/**
 * Auth Helper Functions
 * Shared helper functions for authentication and authorization
 * Extracted from index.js in Step 2.1/2.2
 */

const User = require('../models/User');
const { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES, USER_STATUS } = require('../config/constants');

// ===== DATABASE LOOKUP HELPERS =====

/**
 * Find user by username with automatic 404 error
 * @param {string} username - Username to find
 * @returns {Promise<User>} User document
 * @throws {Error} 404 error if user not found
 */
async function findUserByUsername(username) {
  const user = await User.findOne({ username });
  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return user;
}

/**
 * Find user by ID with optional field selection
 * @param {string} userId - User ID to find
 * @param {string} selectFields - Optional fields to select (e.g., '-password')
 * @returns {Promise<User>} User document
 * @throws {Error} 404 error if user not found
 */
async function findUserById(userId, selectFields = '') {
  let query = User.findById(userId);
  if (selectFields) {
    query = query.select(selectFields);
  }
  const user = await query;
  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return user;
}

/**
 * Get current authenticated user from request token
 * @param {Object} req - Express request object with req.user from auth middleware
 * @param {string} selectFields - Optional fields to select (default: '-password')
 * @returns {Promise<User>} Current user document without password
 * @throws {Error} 404 error if user not found
 */
async function getCurrentUser(req, selectFields = '-password') {
  const user = await User.findOne({ username: req.user.username }).select(selectFields);
  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return user;
}

// ===== SIGNUP HELPERS =====

/**
 * Determine user status based on role
 * Directors are active immediately, others are pending approval
 * @param {string} role - User role
 * @returns {string} User status (active or pending)
 */
function getUserStatusByRole(role) {
  if (!role || role === USER_ROLES.DIRECTOR) {
    return USER_STATUS.ACTIVE;
  }
  return USER_STATUS.PENDING;
}

/**
 * Create standardized user response object for signup
 * @param {User} user - User document
 * @param {string} token - JWT token
 * @returns {Object} Standardized user response
 */
function createUserResponse(user, token) {
  return {
    message: 'User registered successfully',
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status
    }
  };
}

module.exports = {
  findUserByUsername,
  findUserById,
  getCurrentUser,
  getUserStatusByRole,
  createUserResponse
};
