/**
 * Users Management Routes
 * Staff management, approvals, and listings (director/admin only)
 */

const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const { authMiddleware, requireRole } = require('../middleware/authHelper');
const { isValidObjectId } = require('../middleware/validationHelper');

/**
 * GET /api/users/managers
 * Get all managers (director/admin only)
 */
router.get('/managers', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const managers = await userService.getAllManagers();
  sendSuccess(res, 200, 'Managers retrieved', managers);
}));

/**
 * GET /api/users/associates
 * Get all associates (director/admin only)
 */
router.get('/associates', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const associates = await userService.getAllAssociates();
  sendSuccess(res, 200, 'Associates retrieved', associates);
}));

/**
 * GET /api/users/pending
 * Get pending staff (directors/managers waiting for approval)
 */
router.get('/pending', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const pending = await userService.getPendingStaff();
  sendSuccess(res, 200, 'Pending staff retrieved', pending);
}));

/**
 * POST /api/users/:userId/approve
 * Approve a pending staff member (manager/director/associate)
 */
router.post('/:userId/approve', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.userId)) return sendError(res, 400, 'Invalid user ID');

  const result = await userService.approveUser(req.params.userId);
  sendSuccess(res, 200, result.message, result.user);
}));

/**
 * POST /api/users/:userId/reject
 * Reject a pending staff member
 */
router.post('/:userId/reject', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.userId)) return sendError(res, 400, 'Invalid user ID');

  const result = await userService.rejectUser(req.params.userId);
  sendSuccess(res, 200, result.message, result.user);
}));

/**
 * DELETE /api/users/:userId
 * Delete a user (director/admin only)
 */
router.delete('/:userId', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.userId)) return sendError(res, 400, 'Invalid user ID');

  const result = await userService.deleteUser(req.params.userId);
  sendSuccess(res, 200, result.message);
}));

module.exports = router;
