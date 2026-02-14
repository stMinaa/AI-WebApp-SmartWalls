/**
 * Notice Validator
 * Input validation for notice and poll operations
 */

const { validateRequired } = require('../utils/validation');

/**
 * Validate notice creation data
 * @param {Object} data - Notice data (title, content)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateCreate(data) {
  const errors = [];
  
  const titleCheck = validateRequired(data.title, 'Title');
  if (!titleCheck.valid) errors.push(titleCheck.message);
  
  const contentCheck = validateRequired(data.content, 'Content');
  if (!contentCheck.valid) errors.push(contentCheck.message);
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate poll creation data
 * @param {Object} data - Poll data (title, content, options)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validatePoll(data) {
  const errors = [];
  
  const titleCheck = validateRequired(data.title, 'Title');
  if (!titleCheck.valid) errors.push(titleCheck.message);
  
  const contentCheck = validateRequired(data.content, 'Content');
  if (!contentCheck.valid) errors.push(contentCheck.message);
  
  // Validate options
  if (!data.options) {
    errors.push('Options are required');
    return { valid: false, errors };
  }
  
  if (!Array.isArray(data.options)) {
    errors.push('Options must be an array');
    return { valid: false, errors };
  }
  
  if (data.options.length < 2) {
    errors.push('At least 2 options are required');
    return { valid: false, errors };
  }
  
  // Validate each option
  data.options.forEach((option, index) => {
    if (!option || (typeof option === 'string' && !option.trim())) {
      errors.push(`Option #${index + 1} cannot be empty`);
    }
  });
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate poll vote data
 * @param {Object} data - Vote data (optionIndex)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateVote(data) {
  const errors = [];
  
  if (data.optionIndex === undefined || data.optionIndex === null) {
    errors.push('Option index is required');
    return { valid: false, errors };
  }
  
  if (typeof data.optionIndex !== 'number') {
    errors.push('Option index must be a number');
    return { valid: false, errors };
  }
  
  if (data.optionIndex < 0) {
    errors.push('Option index must be non-negative');
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

module.exports = {
  validateCreate,
  validatePoll,
  validateVote
};
