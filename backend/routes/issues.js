/**
 * Issues Routes
 * Report, fetch, and manage maintenance issues
 */

const express = require('express');
const router = express.Router();
const issueService = require('../services/issueService');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const { authMiddleware, requireRole } = require('../middleware/authHelper');
const { isValidObjectId, isValidUrgency } = require('../middleware/validationHelper');

/**
 * POST /api/issues
 * Report a new issue (tenant)
 */
router.post('/', authMiddleware, requireRole('tenant'), asyncHandler(async (req, res) => {
  const { title, description, urgency } = req.body;

  if (!title?.trim()) return sendError(res, 400, 'Title required');
  if (!description?.trim()) return sendError(res, 400, 'Description required');
  if (urgency && !isValidUrgency(urgency)) return sendError(res, 400, 'Invalid urgency');

  const result = await issueService.reportIssue(req.user.username, { title, description, urgency });
  sendSuccess(res, 201, result.message);
}));

/**
 * GET /api/issues
 * Get all issues (manager/director/admin view)
 */
router.get('/', authMiddleware, requireRole('manager', 'director', 'admin'), asyncHandler(async (req, res) => {
  const issues = await issueService.getAllIssues();
  res.json(issues);
}));

/**
 * GET /api/issues/my
 * Get tenant's own issues
 */
router.get('/my', authMiddleware, requireRole('tenant'), asyncHandler(async (req, res) => {
  const issues = await issueService.getTenantIssues(req.user.username);
  sendSuccess(res, 200, 'Your issues retrieved', issues);
}));

/**
 * GET /api/issues/assigned-to-me
 * Get issues assigned to associate
 */
router.get('/assigned-to-me', authMiddleware, requireRole('associate'), asyncHandler(async (req, res) => {
  const issues = await issueService.getAssociateIssues(req.user.username);
  sendSuccess(res, 200, 'Assigned issues retrieved', issues);
}));

/**
 * POST /api/issues/:id/assign
 * Director/Manager assigns issue to associate
 */
router.post('/:id/assign', authMiddleware, requireRole('director', 'manager', 'admin'), asyncHandler(async (req, res) => {
  const { assignee } = req.body;

  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid issue ID');
  if (!assignee?.trim()) return sendError(res, 400, 'Assignee required');

  const result = await issueService.updateIssueStatus(
    req.params.id,
    req.user.role,
    req.user.username,
    { status: 'assigned', assignee: assignee.trim() }
  );

  sendSuccess(res, 200, result.message, result.issue);
}));

/**
 * PATCH /api/issues/:id/status
 * Update issue status
 * Role-aware: associate can accept/resolve, manager can forward, director can assign/resolve
 */
router.patch('/:id/status', authMiddleware, asyncHandler(async (req, res) => {
  const { status, note, cost, assignee } = req.body;

  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid issue ID');
  if (!status?.trim()) return sendError(res, 400, 'Status required');

  const result = await issueService.updateIssueStatus(
    req.params.id,
    req.user.role,
    req.user.username,
    { status: status.trim(), note, cost, assignee }
  );

  sendSuccess(res, 200, result.message, result.issue);
}));

/**
 * POST /api/issues/:id/eta
 * Set ETA for issue (associate)
 */
router.post('/:id/eta', authMiddleware, requireRole('associate'), asyncHandler(async (req, res) => {
  const { eta } = req.body;

  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid issue ID');
  if (!eta) return sendError(res, 400, 'ETA required');

  const result = await issueService.setETA(req.params.id, req.user.username, eta);
  sendSuccess(res, 200, result.message, result.issue);
}));

/**
 * POST /api/issues/:id/acknowledge-eta
 * Tenant acknowledges ETA
 */
router.post('/:id/acknowledge-eta', authMiddleware, requireRole('tenant'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid issue ID');

  const result = await issueService.acknowledgeETA(req.params.id, req.user.username);
  sendSuccess(res, 200, result.message, result.issue);
}));

/**
 * PATCH /api/issues/:id/triage
 * Manager triages issue - assign, forward, or reject
 */
router.patch('/:id/triage', authMiddleware, requireRole('manager', 'director', 'admin'), asyncHandler(async (req, res) => {
  const { action, assignedTo, note } = req.body;
  
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid issue ID');
  if (!action) return sendError(res, 400, 'Action required');
  
  console.log(`🎯 TRIAGE REQUEST: Issue ${req.params.id}, Action: ${action}, AssignedTo: ${assignedTo}`);
  
  const Issue = require('../models/Issue');
  const User = require('../models/User');
  
  const issue = await Issue.findById(req.params.id);
  if (!issue) return sendError(res, 404, 'Issue not found');
  
  let updateData = {
    triageAction: action,
    triageNote: note || '',
    triageDate: new Date(),
    triageBy: req.user.username
  };
  
  if (action === 'assign' && assignedTo) {
    // Verify associate exists
    const associate = await User.findOne({ username: assignedTo, role: 'associate' });
    if (!associate) return sendError(res, 400, 'Associate not found');
    
    updateData.status = 'assigned';
    updateData.assignedTo = associate._id;  // Use ObjectId, not username
    updateData.assignedDate = new Date();
  } else if (action === 'forward') {
    updateData.status = 'forwarded';
  } else if (action === 'reject') {
    updateData.status = 'rejected';
  }
  
  const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, updateData, { new: true });
  
  console.log(`✅ TRIAGE SUCCESS: Issue ${req.params.id} ${action}ed`);
  sendSuccess(res, 200, `Issue ${action}ed successfully`, updatedIssue);
}));

module.exports = router;
