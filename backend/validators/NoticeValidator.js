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

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate poll creation data
 * @param {Object} data - Poll data (title, content, options)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function _isEmptyOption(opt) {
  return !opt || (typeof opt === 'string' && !opt.trim());
}

function validatePollOptions(options) {
  if (!options) return ['Options are required'];
  if (!Array.isArray(options)) return ['Options must be an array'];
  if (options.length < 2) return ['At least 2 options are required'];

  const errors = [];
  options.forEach((option, index) => {
    if (_isEmptyOption(option)) {
      errors.push(`Option #${index + 1} cannot be empty`);
    }
  });
  return errors;
}

function validatePoll(data) {
  const errors = [];

  const titleCheck = validateRequired(data.title, 'Title');
  if (!titleCheck.valid) errors.push(titleCheck.message);

  const contentCheck = validateRequired(data.content, 'Content');
  if (!contentCheck.valid) errors.push(contentCheck.message);

  const optionErrors = validatePollOptions(data.options);
  errors.push(...optionErrors);

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
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

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

module.exports = {
  validateCreate,
  validatePoll,
  validateVote
};
