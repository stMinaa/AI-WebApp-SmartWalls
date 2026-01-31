/**
 * Validation Helper
 * Common input validation utilities for API endpoints
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (min 8 chars, at least one letter and one number)
 * @param {string} password
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is valid' };
}

/**
 * Validate mobile number format
 * @param {string} mobile
 * @returns {boolean}
 */
function isValidMobile(mobile) {
  // Allow 10-15 digits, optionally with spaces, dashes, or plus sign
  const mobileRegex = /^[\d\s\-+]{10,15}$/;
  return mobileRegex.test(mobile);
}

/**
 * Validate username (alphanumeric and underscore, 3-20 chars)
 * @param {string} username
 * @returns {boolean}
 */
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate required fields exist
 * @param {Object} data
 * @param {Array<string>} fields - required field names
 * @returns {Object} { valid: boolean, message: string }
 */
function validateRequired(data, fields) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      return { valid: false, message: `${field} is required` };
    }
  }
  return { valid: true, message: 'All required fields present' };
}

/**
 * Validate string length
 * @param {string} str
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {boolean}
 */
function isValidLength(str, minLength, maxLength) {
  if (!str) return false;
  const len = str.trim().length;
  return len >= minLength && len <= maxLength;
}

/**
 * Validate user role
 * @param {string} role
 * @returns {boolean}
 */
function isValidRole(role) {
  const validRoles = ['tenant', 'manager', 'director', 'associate', 'admin'];
  return validRoles.includes(role);
}

/**
 * Validate user status
 * @param {string} status
 * @returns {boolean}
 */
function isValidStatus(status) {
  const validStatuses = ['active', 'pending', 'rejected'];
  return validStatuses.includes(status);
}

/**
 * Validate issue status
 * @param {string} status
 * @returns {boolean}
 */
function isValidIssueStatus(status) {
  const validStatuses = ['reported', 'forwarded', 'assigned', 'in progress', 'resolved', 'rejected'];
  return validStatuses.includes(status);
}

/**
 * Validate issue urgency
 * @param {string} urgency
 * @returns {boolean}
 */
function isValidUrgency(urgency) {
  const validUrgencies = ['urgent', 'not urgent'];
  return validUrgencies.includes(urgency);
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate positive integer
 * @param {any} value
 * @returns {boolean}
 */
function isPositiveInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Sanitize string input (trim and prevent empty strings)
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Validate registration input
 * @param {Object} data
 * @returns {Object} { valid: boolean, message: string }
 */
function validateRegistration(data) {
  const required = validateRequired(data, ['username', 'email', 'password', 'firstName', 'lastName', 'role']);
  if (!required.valid) return required;

  if (!isValidUsername(data.username)) {
    return { valid: false, message: 'Username must be 3-20 characters (alphanumeric and underscore)' };
  }

  if (!isValidEmail(data.email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  const passValidation = validatePassword(data.password);
  if (!passValidation.valid) return passValidation;

  if (!isValidRole(data.role)) {
    return { valid: false, message: 'Invalid role' };
  }

  return { valid: true, message: 'Registration data is valid' };
}

/**
 * Validate login input
 * @param {Object} data
 * @returns {Object} { valid: boolean, message: string }
 */
function validateLogin(data) {
  const required = validateRequired(data, ['username', 'password']);
  if (!required.valid) return required;

  if (!isValidUsername(data.username)) {
    return { valid: false, message: 'Invalid username format' };
  }

  return { valid: true, message: 'Login data is valid' };
}

module.exports = {
  isValidEmail,
  validatePassword,
  isValidMobile,
  isValidUsername,
  validateRequired,
  isValidLength,
  isValidRole,
  isValidStatus,
  isValidIssueStatus,
  isValidUrgency,
  isValidObjectId,
  isPositiveInteger,
  sanitize,
  validateRegistration,
  validateLogin
};
