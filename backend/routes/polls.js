/**
 * Polls Routes
 * Poll voting and management endpoints
 */

const express = require('express');

const router = express.Router();
const { USER_ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');
const { authenticateToken } = require('../middleware/authHelper');
const Poll = require('../models/Poll');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');

async function validateVoteInput(req, res) {
  const { option } = req.body;
  if (!option) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Option is required' });
    return null;
  }

  const poll = await Poll.findById(req.params.pollId);
  if (!poll) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Poll not found' });
    return null;
  }

  const user = await User.findOne({ username: req.user.username });
  const existingVote = poll.votes.find((v) => v.voter.toString() === user._id.toString());
  if (existingVote) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'You have already voted on this poll' });
    return null;
  }

  return { user, poll, option };
}

// POST /api/polls/:pollId/vote - Vote on a poll
router.post('/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const validated = await validateVoteInput(req, res);
    if (!validated) return;

    const { user, poll, option } = validated;
    poll.votes.push({ option, voter: user._id });
    await poll.save();

    const updated = await Poll.findById(poll._id).populate(
      'createdBy',
      'username firstName lastName'
    );
    return ApiResponse.success(res, updated, 'Vote recorded successfully');
  } catch (error) {
    console.error('Error voting on poll:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/polls/:pollId/close - Close a poll
router.post('/:pollId/close', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    // Only managers can close polls
    if (!user || user.role !== USER_ROLES.MANAGER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can close polls' });
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Poll not found' });
    }

    poll.closedAt = new Date();
    await poll.save();

    const updated = await Poll.findById(poll._id).populate(
      'createdBy',
      'username firstName lastName'
    );

    return ApiResponse.success(res, updated, 'Poll closed successfully');
  } catch (error) {
    console.error('Error closing poll:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

module.exports = router;
