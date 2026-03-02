/* eslint-disable max-lines */
const { ERROR_MESSAGES, HTTP_STATUS } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const AuthorizationError = require('../../../domain/exception/AuthorizationError');
const ValidationError = require('../../../domain/exception/ValidationError');

class IssueController {
  constructor(issueService) {
    this.issueService = issueService;
  }

  async listIssues(req, res) {
    console.info('GET /api/issues - User:', req.user?.username, 'Role will be resolved');
    return this._fetchIssues(req, res, {
      fn: (ctx, filters) => this.issueService.listIssues(ctx, filters),
      msg: 'Issues retrieved'
    });
  }

  async reportIssue(req, res) {
    try {
      console.info(`POST /api/issues - User: ${req.user.username} Body:`, req.body);
      const { title, description, priority } = req.body;

      // Match original inline validations that return { error } format
      if (!title) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Title is required' });
      }
      if (!description) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Description is required' });
      }
      if (priority && !['low', 'medium', 'high'].includes(priority)) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: 'Invalid priority. Must be low, medium, or high' });
      }

      const issue = await this.issueService.reportIssue(req.user.username, {
        title,
        description,
        priority
      });

      // Match original response format: { issue: {...} } with 201 status
      const savedDoc = await this.issueService.findRaw(issue.id);
      console.info(`Issue created: ${issue.id}`);
      return res.status(HTTP_STATUS.CREATED).json({ issue: savedDoc });
    } catch (err) {
      return this._handleErrorForReport(res, err);
    }
  }

  async listMyIssues(req, res) {
    console.info(`GET /api/issues/my - User: ${req.user.username}`);
    return this._fetchIssues(req, res, {
      fn: (ctx, filters) => this.issueService.listMyIssues(ctx, filters),
      msg: 'Issues retrieved successfully'
    });
  }

  async triageIssue(req, res) {
    console.info(
      'TRIAGE REQUEST - User:',
      req.user?.username,
      'Issue:',
      req.params.issueId,
      'Body:',
      req.body
    );
    try {
      const user = await this.issueService.getUserByUsername(req.user.username);
      if (!user || user.role !== 'manager') {
        return ApiResponse.error(res, ERROR_MESSAGES.ONLY_MANAGERS_TRIAGE, HTTP_STATUS.FORBIDDEN);
      }

      const { action, assignedTo } = req.body;

      const issue = await this.issueService.triageIssue(
        req.params.issueId,
        { role: user.role, _id: user._id },
        { action, assignedTo }
      );

      // Return raw mongoose doc to match original format
      const updatedDoc = await this.issueService.findRaw(issue.id);
      console.info('Issue triaged successfully:', req.params.issueId, 'Action:', action);
      return ApiResponse.success(res, updatedDoc, 'Issue triaged successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async assignIssue(req, res) {
    console.info(
      'PATCH /api/issues/:issueId/assign - User:',
      req.user?.username,
      'Body:',
      req.body
    );
    try {
      const user = await this._requireRole(req, 'director', ERROR_MESSAGES.ONLY_DIRECTORS);
      if (!user)
        return ApiResponse.error(res, ERROR_MESSAGES.ONLY_DIRECTORS, HTTP_STATUS.FORBIDDEN);

      const { action, assignedTo } = req.body;
      const userCtx = { role: user.role, _id: user._id };

      const issue = await this._handleDirectorAction(req.params.issueId, userCtx, {
        action,
        assignedTo
      });
      if (!issue) return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_ACTION);

      return this._respondWithPopulated(res, issue.id, 'Issue assigned successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async _handleDirectorAction(issueId, userCtx, { action, assignedTo }) {
    if (action === 'reject') {
      return this.issueService.rejectIssue(issueId, userCtx);
    }
    if (action === 'assign' && assignedTo) {
      console.info('Issue assigned by director:', action);
      return this.issueService.assignIssue(issueId, userCtx, assignedTo);
    }
    return null;
  }

  async acceptIssue(req, res) {
    try {
      console.info(`POST /api/issues/${req.params.id}/accept - User: ${req.user.username}`);
      const user = await this._requireRole(req, 'associate', ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT);
      if (!user)
        return ApiResponse.error(res, ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT, HTTP_STATUS.FORBIDDEN);

      const costError = this._validateEstimatedCost(req.body.estimatedCost);
      if (costError) return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: costError });

      const rawIssue = await this._findAssignedIssue(res, req.params.id, user);
      if (!rawIssue) return;

      if (rawIssue.status !== 'assigned') {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: 'Issue must be in assigned status to accept' });
      }

      const issue = await this.issueService.acceptIssue(
        req.params.id,
        { role: user.role, _id: user._id.toString() },
        req.body.estimatedCost
      );

      console.info(`Issue ${issue.id} accepted with cost $${req.body.estimatedCost}`);
      return this._respondWithPopulated(res, issue.id, 'Job accepted successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async rejectIssueByAssociate(req, res) {
    try {
      console.info(`POST /api/issues/${req.params.id}/reject - User: ${req.user.username}`);
      const user = await this._requireRole(req, 'associate', null);
      if (!user) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only associates can reject jobs' });
      }

      const rawIssue = await this._findAssignedIssue(res, req.params.id, user);
      if (!rawIssue) return;

      await this.issueService.rejectByAssociate(req.params.id, {
        role: user.role,
        _id: user._id.toString()
      });

      console.info(`Issue ${req.params.id} rejected by associate`);
      return ApiResponse.success(res, null, 'Job rejected successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async completeIssue(req, res) {
    try {
      console.info(`POST /api/issues/${req.params.id}/complete - User: ${req.user.username}`);
      const user = await this._requireRole(
        req,
        'associate',
        ERROR_MESSAGES.ONLY_ASSOCIATES_COMPLETE
      );
      if (!user)
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ error: ERROR_MESSAGES.ONLY_ASSOCIATES_COMPLETE });

      const rawIssue = await this._findAssignedIssue(res, req.params.id, user);
      if (!rawIssue) return;

      if (rawIssue.status !== 'in-progress') {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: 'Issue must be in in-progress status to complete' });
      }

      const issue = await this.issueService.completeIssue(
        req.params.id,
        { role: user.role, _id: user._id.toString() },
        req.body.completionNotes
      );

      await this.issueService.createInvoiceIfNeeded(rawIssue, user, issue);
      console.info(`Issue ${issue.id} marked as complete`);
      return this._respondWithPopulated(res, issue.id, 'Job completed successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async _respondWithPopulated(res, issueId, msg) {
    const populated = await this.issueService.findPopulated(issueId);
    return ApiResponse.success(res, populated, msg);
  }

  async _fetchIssues(req, res, { fn, msg }) {
    try {
      const user = await this.issueService.getUserByUsername(req.user.username);
      const issues = await fn({ role: user.role, _id: user._id }, this._buildFilters(req.query));
      return ApiResponse.success(res, issues, msg);
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  _buildFilters({ status, priority }) {
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    return filters;
  }

  async _requireRole(req, role, _errorMsg) {
    const user = await this.issueService.getUserByUsername(req.user.username);
    if (!user || user.role !== role) return null;
    return user;
  }

  _validateEstimatedCost(estimatedCost) {
    if (estimatedCost === undefined || estimatedCost === null) return 'estimatedCost is required';
    if (typeof estimatedCost !== 'number' || isNaN(estimatedCost))
      return 'estimatedCost must be a valid number';
    if (estimatedCost < 0) return 'estimatedCost must be a positive number';
    return null;
  }

  async _findAssignedIssue(res, issueId, user) {
    const rawIssue = await this.issueService.findRaw(issueId);
    if (!rawIssue) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ISSUE_NOT_FOUND });
      return null;
    }
    if (!rawIssue.assignedTo || rawIssue.assignedTo.toString() !== user._id.toString()) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU });
      return null;
    }
    return rawIssue;
  }

  _handleErrorForReport(res, err) {
    console.error('Issue controller error:', err.message);

    // Match original route error format: { error: '...' }
    if (err instanceof ValidationError) {
      if (err.message.includes('not assigned to an apartment')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: err.message });
      }
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: err.message });
    }

    if (err instanceof AuthorizationError) {
      return ApiResponse.error(res, err.message, HTTP_STATUS.FORBIDDEN);
    }

    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }

  _handleError(res, err) {
    console.error('Issue controller error:', err.message);

    if (err instanceof ValidationError) {
      if (err.message.includes('not found')) {
        return ApiResponse.notFound(res, err.message);
      }
      return ApiResponse.badRequest(res, err.message);
    }

    if (err instanceof AuthorizationError) {
      return ApiResponse.forbidden(res, err.message);
    }

    if (err.status) {
      return ApiResponse.error(res, err.message, err.status);
    }

    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = IssueController;
