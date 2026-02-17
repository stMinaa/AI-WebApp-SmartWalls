/**
 * Notices Routes
 * Notice management endpoints
 */

const express = require('express');

const router = express.Router();
const { USER_ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');
const { authenticateToken } = require('../middleware/authHelper');
const Notice = require('../models/Notice');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');

// DELETE /api/notices/:noticeId - Delete a notice
router.delete('/:noticeId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    // Only managers can delete notices
    if (!user || user.role !== USER_ROLES.MANAGER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can delete notices' });
    }

    const notice = await Notice.findById(req.params.noticeId);
    if (!notice) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Notice not found' });
    }

    await Notice.findByIdAndDelete(req.params.noticeId);

    return ApiResponse.success(res, null, 'Notice deleted successfully');
  } catch (error) {
    console.error('Error deleting notice:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

module.exports = router;
