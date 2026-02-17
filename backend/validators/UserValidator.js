/**
 * User Validator
 * Input validation for user-related operations
 */

const {
  validateEmail,
  validatePassword,
  validateMobile,
  validateUsername,
  validateRole,
  validateRequired
} = require('../utils/validation');

/**
 * Validate signup data
 * @param {Object} data - Signup data (username, email, password, firstName, lastName, role, mobile)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function checkRequired(data, fields) {
  const errors = [];
  for (const [field, label] of fields) {
    const check = validateRequired(data[field], label);
    if (!check.valid) errors.push(check.message);
  }
  return errors;
}

function checkFormats(data) {
  const errors = [];
  const checks = [
    validateUsername(data.username),
    validateEmail(data.email),
    validatePassword(data.password),
    validateRole(data.role)
  ];
  for (const check of checks) {
    if (!check.valid) errors.push(check.message);
  }
  if (data.mobile) {
    const mobileCheck = validateMobile(data.mobile, false);
    if (!mobileCheck.valid) errors.push(mobileCheck.message);
  }
  return errors;
}

function validateSignup(data) {
  const requiredFields = [
    ['username', 'Username'],
    ['email', 'Email'],
    ['password', 'Password'],
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['role', 'Role']
  ];

  const requiredErrors = checkRequired(data, requiredFields);
  if (requiredErrors.length > 0) return { valid: false, errors: requiredErrors };

  const formatErrors = checkFormats(data);
  return formatErrors.length === 0 ? { valid: true } : { valid: false, errors: formatErrors };
}

/**
 * Validate login data
 * @param {Object} data - Login data (username, password)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateLogin(data) {
  const errors = [];

  const usernameCheck = validateRequired(data.username, 'Username/Email');
  if (!usernameCheck.valid) errors.push(usernameCheck.message);

  const passwordCheck = validateRequired(data.password, 'Password');
  if (!passwordCheck.valid) errors.push(passwordCheck.message);

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate profile update data
 * @param {Object} data - Profile update data (firstName, lastName, mobile, company)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateProfileUpdate(data) {
  const errors = [];

  // All fields are optional, but if mobile is provided, validate it
  if (data.mobile && data.mobile.trim()) {
    const mobileValidation = validateMobile(data.mobile, false);
    if (!mobileValidation.valid) errors.push(mobileValidation.message);
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

module.exports = {
  validateSignup,
  validateLogin,
  validateProfileUpdate
};
