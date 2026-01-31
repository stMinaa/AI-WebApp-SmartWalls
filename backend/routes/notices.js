/**
 * Notices & Polls Routes
 * Building notices, tenant notifications, and polls
 */

const express = require('express');
const router = express.Router();
const noticeService = require('../services/noticeService');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const { authMiddleware, requireRole } = require('../middleware/authHelper');
const { isValidObjectId } = require('../middleware/validationHelper');

/**
 * POST /api/notices/:buildingId
 * Create notice for building (manager/director/admin only)
 */
router.post('/:buildingId', authMiddleware, requireRole('manager', 'director', 'admin'), asyncHandler(async (req, res) => {
  const { title, body, attachment } = req.body;

  if (!isValidObjectId(req.params.buildingId)) return sendError(res, 400, 'Invalid building ID');
  if (!title?.trim()) return sendError(res, 400, 'Title required');
  if (!body?.trim()) return sendError(res, 400, 'Body required');

  const result = await noticeService.createNotice(req.params.buildingId, { title, body, attachment });
  sendSuccess(res, 201, result.message, result.notice);
}));

/**
 * GET /api/notices/:buildingId
 * Get notices for a building
 */
router.get('/:buildingId', authMiddleware, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.buildingId)) return sendError(res, 400, 'Invalid building ID');

  const notices = await noticeService.getNoticesByBuilding(req.params.buildingId);
  sendSuccess(res, 200, 'Notices retrieved', notices);
}));

/**
 * GET /api/notices/tenant/:buildingId
 * Get notices for tenant (includes read status)
 */
router.get('/tenant/:buildingId', authMiddleware, requireRole('tenant'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.buildingId)) return sendError(res, 400, 'Invalid building ID');

  const User = require('../models/User');
  const user = await User.findOne({ username: req.user.username });
  if (!user) return sendError(res, 404, 'User not found');

  const notices = await noticeService.getTenantNotices(user._id, req.params.buildingId);
  sendSuccess(res, 200, 'Your notices retrieved', notices);
}));

/**
 * POST /api/notices/:noticeId/read
 * Mark notice as read (tenant)
 */
router.post('/:noticeId/read', authMiddleware, requireRole('tenant'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.noticeId)) return sendError(res, 400, 'Invalid notice ID');

  const User = require('../models/User');
  const user = await User.findOne({ username: req.user.username });

  const result = await noticeService.markNoticeAsRead(req.params.noticeId, user._id);
  sendSuccess(res, 200, result.message);
}));

/**
 * POST /api/polls/:buildingId
 * Create a poll for building (manager/director/admin only)
 */
router.post('/create/:buildingId', authMiddleware, requireRole('manager', 'director', 'admin'), asyncHandler(async (req, res) => {
  const { question, options } = req.body;

  if (!isValidObjectId(req.params.buildingId)) return sendError(res, 400, 'Invalid building ID');
  if (!question?.trim()) return sendError(res, 400, 'Question required');
  if (!Array.isArray(options) || options.length < 2) {
    return sendError(res, 400, 'At least 2 options required');
  }

  const result = await noticeService.createPoll(req.params.buildingId, { question, options });
  sendSuccess(res, 201, result.message, result.poll);
}));

/**
 * GET /api/polls/:buildingId
 * Get polls for a building
 */
router.get('/list/:buildingId', authMiddleware, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.buildingId)) return sendError(res, 400, 'Invalid building ID');

  const polls = await noticeService.getPollsByBuilding(req.params.buildingId);
  sendSuccess(res, 200, 'Polls retrieved', polls);
}));

/**
 * POST /api/polls/:pollId/vote
 * Vote on a poll (tenant)
 */
router.post('/:pollId/vote', authMiddleware, requireRole('tenant'), asyncHandler(async (req, res) => {
  const { option } = req.body;

  if (!isValidObjectId(req.params.pollId)) return sendError(res, 400, 'Invalid poll ID');
  if (!option?.trim()) return sendError(res, 400, 'Option required');

  const User = require('../models/User');
  const user = await User.findOne({ username: req.user.username });

  const result = await noticeService.votePoll(req.params.pollId, user._id, option.trim());
  sendSuccess(res, 200, result.message, result.poll);
}));

/**
 * GET /api/polls/:pollId/results
 * Get poll results (manager/director/admin)
 */
router.get('/:pollId/results', authMiddleware, requireRole('manager', 'director', 'admin'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.pollId)) return sendError(res, 400, 'Invalid poll ID');

  const results = await noticeService.getPollResults(req.params.pollId);
  sendSuccess(res, 200, 'Poll results retrieved', results);
}));

module.exports = router;
