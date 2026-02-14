/**
 * Building Validator
 * Input validation for building-related operations
 */

const { validateRequired } = require('../utils/validation');

/**
 * Validate building creation data
 * @param {Object} data - Building data (name, address, city)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateCreate(data) {
  const errors = [];
  
  const nameCheck = validateRequired(data.name, 'Building name');
  if (!nameCheck.valid) errors.push(nameCheck.message);
  
  const addressCheck = validateRequired(data.address, 'Address');
  if (!addressCheck.valid) errors.push(addressCheck.message);
  
  const cityCheck = validateRequired(data.city, 'City');
  if (!cityCheck.valid) errors.push(cityCheck.message);
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate bulk apartments creation data
 * @param {Object} data - Bulk apartments data (apartments: [{number, floor}])
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateBulkApartments(data) {
  const errors = [];
  
  // Check if apartments array exists
  if (!data.apartments) {
    errors.push('Apartments array is required');
    return { valid: false, errors };
  }
  
  // Check if apartments is an array
  if (!Array.isArray(data.apartments)) {
    errors.push('Apartments must be an array');
    return { valid: false, errors };
  }
  
  // Check if array is not empty
  if (data.apartments.length === 0) {
    errors.push('At least one apartment is required');
    return { valid: false, errors };
  }
  
  // Validate each apartment
  data.apartments.forEach((apt, index) => {
    const aptNum = index + 1;
    
    const numberCheck = validateRequired(apt.number, `Apartment #${aptNum}: Number`);
    if (!numberCheck.valid) {
      errors.push(`Apartment #${aptNum}: number is required`);
    }
    
    if (apt.floor === undefined || apt.floor === null) {
      errors.push(`Apartment #${aptNum}: floor is required`);
    } else if (typeof apt.floor !== 'number') {
      errors.push(`Apartment #${aptNum}: floor must be a number`);
    }
  });
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

module.exports = {
  validateCreate,
  validateBulkApartments
};
