/**
 * Validation Utilities
 * Reusable validation functions for backend
 */

const { VALIDATION_RULES, VALID_ROLES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Validate email format
 * @param {string} email
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { valid: false, message: ERROR_MESSAGES.INVALID_EMAIL };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object} { valid: boolean, message?: string }
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }
  
  return { valid: true };
}

/**
 * Validate mobile number
 * @param {string} mobile
 * @param {boolean} required
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateMobile(mobile, required = false) {
  if (!mobile) {
    return required 
      ? { valid: false, message: 'Mobile number is required' }
      : { valid: true };
  }
  
  if (!VALIDATION_RULES.MOBILE_REGEX.test(mobile)) {
    return { valid: false, message: ERROR_MESSAGES.INVALID_MOBILE };
  }
  
  return { valid: true };
}

/**
 * Validate username
 * @param {string} username
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateUsername(username) {
  if (!username || !username.trim()) {
    return { valid: false, message: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
    return { 
      valid: false, 
      message: `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters` 
    };
  }
  
  if (trimmed.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
    return { 
      valid: false, 
      message: `Username must not exceed ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate user role
 * @param {string} role
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateRole(role) {
  if (!role) {
    return { valid: false, message: 'Role is required' };
  }
  
  if (!VALID_ROLES.includes(role)) {
    return { valid: false, message: ERROR_MESSAGES.INVALID_ROLE };
  }
  
  return { valid: true };
}

/**
 * Validate required field
 * @param {any} value
 * @param {string} fieldName
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateRequired(value, fieldName = 'Field') {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName} is required` };
  }
  
  return { valid: true };
}

/**
 * Validate registration data
 * @param {Object} data - Registration data
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateRegistrationData(data) {
  const { username, password, email, firstName, lastName, role, mobile } = data;
  
  // Check required fields
  const requiredChecks = [
    validateRequired(username, 'Username'),
    validateRequired(password, 'Password'),
    validateRequired(email, 'Email'),
    validateRequired(firstName, 'First name'),
    validateRequired(lastName, 'Last name'),
    validateRequired(role, 'Role'),
  ];
  
  for (const check of requiredChecks) {
    if (!check.valid) return check;
  }
  
  // Validate specific fields
  const validations = [
    validateUsername(username),
    validatePassword(password),
    validateEmail(email),
    validateRole(role),
    validateMobile(mobile, false),
  ];
  
  for (const validation of validations) {
    if (!validation.valid) return validation;
  }
  
  return { valid: true };
}

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateLoginData(data) {
  const { username, password } = data;
  
  const usernameCheck = validateRequired(username, 'Username/Email');
  if (!usernameCheck.valid) return usernameCheck;
  
  const passwordCheck = validateRequired(password, 'Password');
  if (!passwordCheck.valid) return passwordCheck;
  
  return { valid: true };
}

/**
 * Sanitize string input
 * @param {string} input
 * @returns {string}
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.trim();
}

module.exports = {
  validateEmail,
  validatePassword,
  validateMobile,
  validateUsername,
  validateRole,
  validateRequired,
  validateRegistrationData,
  validateLoginData,
  sanitizeString,
};
