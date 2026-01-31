/**
 * Authentication Routes
 * Register, login, and user profile endpoints
 */

const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authHelper');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const result = await userService.registerUser(req.body);
  sendSuccess(res, 201, result.message, {
    token: result.token,
    role: result.role,
    user: result.user
  });
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', asyncHandler(async (req, res) => {
  const result = await userService.loginUser(req.body);
  sendSuccess(res, 200, result.message, {
    token: result.token,
    role: result.role,
    user: result.user
  });
}));

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user.username);
  sendSuccess(res, 200, 'User profile retrieved', user);
}));

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
router.patch('/me', authMiddleware, asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    mobile, 
    household, 
    company, 
    specialties, 
    description, 
    website, 
    serviceAreas, 
    yearsExperience 
  } = req.body;

  const updates = {
    firstName,
    lastName,
    mobile,
    householdMembers: household,
    company,
    specialties,
    description,
    website,
    serviceAreas,
    yearsExperience
  };

  // Remove undefined fields
  Object.keys(updates).forEach(key => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  const result = await userService.updateUserProfile(req.user.username, updates);
  sendSuccess(res, 200, result.message, result.user);
}));

module.exports = router;
