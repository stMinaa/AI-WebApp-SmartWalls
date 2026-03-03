/**
 * Building Validator
 * Input validation for building-related operations
 */

const { validateRequired } = require('../utils/validation');

/**
 * Validate building creation data
 * @param {Object} data - Building data (name, address)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateCreate(data) {
  const errors = [];

  const nameCheck = validateRequired(data.name, 'Building name');
  if (!nameCheck.valid) errors.push(nameCheck.message);

  const addressCheck = validateRequired(data.address, 'Address');
  if (!addressCheck.valid) errors.push(addressCheck.message);

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

function _validateApartment(apt, index) {
  const errors = [];
  const aptNum = index + 1;

  const numberCheck = validateRequired(apt.number, `Apartment #${aptNum}: Number`);
  if (!numberCheck.valid) errors.push(`Apartment #${aptNum}: number is required`);

  if (apt.floor === undefined || apt.floor === null) {
    errors.push(`Apartment #${aptNum}: floor is required`);
  } else if (typeof apt.floor !== 'number') {
    errors.push(`Apartment #${aptNum}: floor must be a number`);
  }

  return errors;
}

/**
 * Validate bulk apartments creation data
 * @param {Object} data - Bulk apartments data (apartments: [{number, floor}])
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateBulkApartments(data) {
  if (!data.apartments) return { valid: false, errors: ['Apartments array is required'] };
  if (!Array.isArray(data.apartments))
    return { valid: false, errors: ['Apartments must be an array'] };
  if (data.apartments.length === 0)
    return { valid: false, errors: ['At least one apartment is required'] };

  const errors = data.apartments.flatMap((apt, index) => _validateApartment(apt, index));
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

module.exports = {
  validateCreate,
  validateBulkApartments
};
