/**
 * Test Helper Utilities
 * Helpers for working with standardized API responses in tests
 */

/**
 * Extract data from standardized API response  
 * Supports both old format (direct data) and new format ({ success, message, data })
 * 
 * @param {object} response - Supertest response object
 * @returns {any} - The data from the response
 */
const getData = (response) => {
  if (response.body && response.body.hasOwnProperty('success')) {
    // New standardized format: { success, message, data }
    return response.body.data;
  }
  // Old format: direct data
  return response.body;
};

/**
 * Check if API response indicates success
 * 
 * @param {object} response - Supertest response object
 * @returns {boolean}
 */
const isSuccess = (response) => {
  if (response.body && response.body.hasOwnProperty('success')) {
    return response.body.success === true;
  }
  // Default: check HTTP status
  return response.status >= 200 && response.status < 300;
};

/**
 * Get error message from response
 * 
 * @param {object} response - Supertest response object
 * @returns {string}
 */
const getErrorMessage = (response) => {
  if (response.body && response.body.message) {
    return response.body.message;
  }
  if (response.body && response.body.error) {
    return response.body.error;
  }
  return 'Unknown error';
};

/**
 * Get success message from response 
 * 
 * @param {object} response - Supertest response object
 * @returns {string}
 */
const getMessage = (response) => {
  return response.body.message || '';
};

/**
 * Assert response is successful
 * 
 * @param {object} response - Supertest response object
 * @param {number} expectedStatus - Expected HTTP status code (default: 200)
 */
const assertSuccess = (response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  if (response.body.hasOwnProperty('success')) {
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBeDefined();
  }
};

/**
 * Assert response is an error
 * 
 * @param {object} response - Supertest response object
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} expectedMessage - Expected error message (optional)
 */
const assertError = (response, expectedStatus, expectedMessage = null) => {
  expect(response.status).toBe(expectedStatus);
  if (response.body.hasOwnProperty('success')) {
    expect(response.body.success).toBe(false);
  }
  // At least one of message or error should be defined
  const errorMsg = response.body.message || response.body.error;
  expect(errorMsg).toBeDefined();

  if (expectedMessage) {
    expect(errorMsg).toContain(expectedMessage);
  }
};

module.exports = {
  getData,
  isSuccess,
  getErrorMessage,
  getMessage,
  assertSuccess,
  assertError,
};
