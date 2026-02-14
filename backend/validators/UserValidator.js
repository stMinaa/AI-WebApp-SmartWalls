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
function validateSignup(data) {
  const errors = [];
  
  // Check required fields
  const usernameCheck = validateRequired(data.username, 'Username');
  if (!usernameCheck.valid) errors.push(usernameCheck.message);
  
  const emailCheck = validateRequired(data.email, 'Email');
  if (!emailCheck.valid) errors.push(emailCheck.message);
  
  const passwordCheck = validateRequired(data.password, 'Password');
  if (!passwordCheck.valid) errors.push(passwordCheck.message);
  
  const firstNameCheck = validateRequired(data.firstName, 'First name');
  if (!firstNameCheck.valid) errors.push(firstNameCheck.message);
  
  const lastNameCheck = validateRequired(data.lastName, 'Last name');
  if (!lastNameCheck.valid) errors.push(lastNameCheck.message);
  
  const roleCheck = validateRequired(data.role, 'Role');
  if (!roleCheck.valid) errors.push(roleCheck.message);
  
  // If basic required checks failed, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Validate formats
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.valid) errors.push(usernameValidation.message);
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) errors.push(emailValidation.message);
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) errors.push(passwordValidation.message);
  
  const roleValidation = validateRole(data.role);
  if (!roleValidation.valid) errors.push(roleValidation.message);
  
  // Optional mobile validation
  if (data.mobile) {
    const mobileValidation = validateMobile(data.mobile, false);
    if (!mobileValidation.valid) errors.push(mobileValidation.message);
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
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
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
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
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

module.exports = {
  validateSignup,
  validateLogin,
  validateProfileUpdate
};
