const { ERROR_MESSAGES, HTTP_STATUS } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const AuthorizationError = require('../../../domain/exception/AuthorizationError');
const ValidationError = require('../../../domain/exception/ValidationError');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async updateDebt(req, res) {
    try {
      const { debt, reason } = req.body;
      const result = await this.userService.updateDebt(req.user.username, req.params.id, {
        debt,
        reason
      });
      return ApiResponse.success(res, result, 'Debt updated');
    } catch (err) {
      console.error('Error updating debt:', err);
      return this._handleError(res, err, ERROR_MESSAGES.ERROR_UPDATING_DEBT);
    }
  }

  async listPendingUsers(req, res) {
    try {
      const users = await this.userService.listPendingUsers(req.user.username);
      return ApiResponse.success(res, users, 'Pending users retrieved');
    } catch (err) {
      console.error('Error fetching pending users:', err);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async listUsers(req, res) {
    console.info('GET /api/users - User:', req.user?.username, 'Query:', req.query);
    try {
      const { role, status, includeTest } = req.query;
      const users = await this.userService.listUsers(req.user.username, {
        role,
        status,
        includeTest
      });
      console.info('Returning users:', users.length);
      return ApiResponse.success(
        res,
        users,
        role === 'manager' ? 'Managers retrieved successfully' : 'Users retrieved successfully'
      );
    } catch (err) {
      console.error('Get users error:', err);
      if (err instanceof AuthorizationError) {
        console.info('Authorization failed');
        return ApiResponse.forbidden(res, err.message);
      }
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async approveUser(req, res) {
    console.info(
      'APPROVE ENDPOINT CALLED! User:',
      req.user?.username,
      'Target:',
      req.params.userId
    );
    return this._execute(res, async () => {
      const result = await this.userService.approveUser(req.user.username, req.params.userId);
      return ApiResponse.success(res, result, 'User approved successfully');
    });
  }

  async deleteUser(req, res) {
    console.info(
      'DELETE /api/users/:userId - User:',
      req.user?.username,
      'Target:',
      req.params.userId
    );
    return this._execute(res, async () => {
      await this.userService.deleteUser(req.user.username, req.params.userId);
      return ApiResponse.success(res, null, 'User deleted successfully');
    });
  }

  async bulkDeleteTestUsers(req, res) {
    console.info('DELETE /api/users/bulk/test - User:', req.user?.username);
    try {
      const result = await this.userService.bulkDeleteTestUsers(req.user.username);
      return ApiResponse.success(
        res,
        result,
        `Successfully deleted ${result.deletedCount} test users`
      );
    } catch (err) {
      console.error('Bulk delete error:', err);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async listAssociateJobs(req, res) {
    try {
      console.info(`GET /api/associates/me/jobs - User: ${req.user.username} Query:`, req.query);
      const { status, priority } = req.query;
      const jobs = await this.userService.listAssociateJobs(req.user.username, {
        status,
        priority
      });
      console.info(`Associate jobs retrieved: ${jobs.length}`);
      return ApiResponse.success(res, jobs, 'Associate jobs retrieved successfully');
    } catch (err) {
      console.error('Error retrieving associate jobs:', err);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async listAssociates(req, res) {
    try {
      console.info('GET /api/associates - DEBUG');
      const associates = await this.userService.listAssociates(req.user.username);
      console.info(`Associates found: ${associates.length}`);
      return ApiResponse.success(res, associates, 'Associates retrieved successfully');
    } catch (err) {
      console.error('Error fetching associates:', err);
      // Original uses raw { error: 'Access denied' } format
      if (err instanceof AuthorizationError) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ error: err.message });
      }
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async _execute(res, fn) {
    try {
      return await fn();
    } catch (err) {
      console.error('UserController error:', err.message);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  _handleError(res, err, fallbackMessage) {
    if (err instanceof ValidationError) {
      if (err.message.includes('not found') || err.message.includes('not assigned')) {
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

    return ApiResponse.serverError(res, fallbackMessage || ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = UserController;
