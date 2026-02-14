/**
 * Validation Middleware
 * Express middleware for input validation using validators
 */

const ApiResponse = require('../utils/ApiResponse');

/**
 * Create validation middleware for a given validator function
 * @param {Function} validator - Validator function that takes data and returns {valid, errors}
 * @returns {Function} Express middleware function
 */
function validate(validator) {
  return (req, res, next) => {
    const result = validator(req.body);
    
    if (!result.valid) {
      return ApiResponse.badRequest(res, result.errors.join(', '));
    }
    
    next();
  };
}

module.exports = { validate };
