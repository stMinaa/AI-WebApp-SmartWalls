/**
 * Auth Routes - Step 2.2 Part 1
 * Handles user authentication: signup, login, profile management
 */

const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { ERROR_MESSAGES, USER_ROLES, JWT_SECRET } = require('../config/constants');
const { authMiddleware: authenticateToken } = require('../middleware/authHelper');
const { validate } = require('../middleware/validate');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const {
  findUserByUsername,
  getCurrentUser,
  getUserStatusByRole,
  createUserResponse
} = require('../utils/authHelpers');
const UserValidator = require('../validators/UserValidator');

// Import helper functions

// ===== SIGNUP =====
router.post('/signup', validate(UserValidator.validateSignup), async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return ApiResponse.conflict(res, 'Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine status based on role
    const status = getUserStatusByRole(role);

    // Create user - building and apartment assigned by manager during approval
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'tenant',
      status: status,
      building: null, // Will be assigned by manager during approval
      apartment: null // Will be assigned by manager during approval
    });

    await user.save();

    // Create token with standardized payload: { userId, username, email, role }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ApiResponse.created(res, createUserResponse(user, token), 'User created successfully');
  } catch (err) {
    console.error('Signup error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== LOGIN =====
router.post('/login', validate(UserValidator.validateLogin), async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Create token with standardized payload: { userId, username, email, role }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ApiResponse.success(
      res,
      {
        token,
        user: {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        }
      },
      'Login successful'
    );
  } catch (err) {
    console.error('Login error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== GET CURRENT USER =====
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    return ApiResponse.success(res, user, 'User retrieved');
  } catch {
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

function applyProfileUpdates(user, body) {
  const { firstName, lastName, mobile, company } = body;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (mobile !== undefined) user.mobile = mobile;
  if (company !== undefined && user.role !== USER_ROLES.TENANT) user.company = company;
}

// ===== UPDATE CURRENT USER =====
router.patch(
  '/me',
  authenticateToken,
  validate(UserValidator.validateProfileUpdate),
  async (req, res) => {
    console.info('PATCH /api/auth/me - User:', req.user?.username);
    try {
      const user = await findUserByUsername(req.user.username);
      applyProfileUpdates(user, req.body);
      await user.save();

      console.info('User saved:', user.username);
      const updatedUser = await getCurrentUser(req);
      return ApiResponse.success(res, updatedUser, 'Profile updated');
    } catch (err) {
      console.error('Error updating profile:', err);
      return ApiResponse.serverError(res, ERROR_MESSAGES.ERROR_UPDATING_PROFILE);
    }
  }
);

// ===== PAYMENT - Tenant pays debt =====
router.post('/pay-debt', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByUsername(req.user.username);

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
    }

    if (amount > user.debt) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.PAYMENT_EXCEEDS_DEBT);
    }

    // Reduce debt
    user.debt = Math.max(0, user.debt - amount);
    await user.save();

    const updatedUser = await getCurrentUser(req);
    return ApiResponse.success(
      res,
      { user: updatedUser, remainingDebt: user.debt },
      'Payment successful'
    );
  } catch (err) {
    console.error('Error processing payment:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.ERROR_PROCESSING_PAYMENT);
  }
});

module.exports = router;
