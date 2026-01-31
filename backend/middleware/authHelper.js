/**
 * Authentication Utilities
 * JWT token creation/verification and password hashing
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, TOKEN_EXPIRY, BCRYPT_ROUNDS, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

/**
 * Generate JWT token for user
 * @param {Object} user - { _id, username, role }
 * @returns {string} JWT token
 */
function generateToken(user) {
  if (!user || !user._id || !user.username || !user.role) {
    throw new Error('Invalid user object for token generation');
  }

  return jwt.sign(
    { 
      userId: user._id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} decoded token { userId, username, role, iat, exp }
 * @throws {Object} error with status and message
 */
function verifyToken(token) {
  if (!token) {
    throw { 
      status: HTTP_STATUS.UNAUTHORIZED, 
      message: ERROR_MESSAGES.TOKEN_REQUIRED 
    };
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw { 
      status: HTTP_STATUS.UNAUTHORIZED, 
      message: ERROR_MESSAGES.TOKEN_INVALID 
    };
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  if (!password) {
    throw new Error('Password is required for hashing');
  }
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 * @param {string} password - Plain password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Express middleware to verify JWT from Authorization header
 * Sets req.user with decoded token payload
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function authMiddleware(req, res, next) {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.TOKEN_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(err.status || HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: err.message || ERROR_MESSAGES.TOKEN_INVALID,
      status: err.status || HTTP_STATUS.UNAUTHORIZED
    });
  }
}

/**
 * Authorization middleware factory
 * Checks if user has required role(s)
 * Usage: router.post('/endpoint', authMiddleware, requireRole('director', 'admin'), handler)
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) {
    throw new Error('At least one role must be specified');
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        status: HTTP_STATUS.FORBIDDEN
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  extractToken,
  authMiddleware,
  requireRole,
  JWT_SECRET,
  TOKEN_EXPIRY
};
