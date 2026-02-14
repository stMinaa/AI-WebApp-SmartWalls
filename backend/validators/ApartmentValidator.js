/**
 * Apartment Validator
 * Input validation for apartment-related operations
 */

const { validateRequired } = require('../utils/validation');

/**
 * Validate apartment creation data
 * @param {Object} data - Apartment data (unitNumber, address)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateCreate(data) {
  const errors = [];
  
  const unitNumberCheck = validateRequired(data.unitNumber, 'Unit number');
  if (!unitNumberCheck.valid) errors.push(unitNumberCheck.message);
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate tenant assignment data
 * @param {Object} data - Assignment data (tenantId)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateAssignTenant(data) {
  const errors = [];
  
  const tenantIdCheck = validateRequired(data.tenantId, 'Tenant ID');
  if (!tenantIdCheck.valid) {
    errors.push(tenantIdCheck.message);
    return { valid: false, errors };
  }
  
  // Validate ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(data.tenantId)) {
    errors.push('Invalid tenant ID format');
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

module.exports = {
  validateCreate,
  validateAssignTenant
};
