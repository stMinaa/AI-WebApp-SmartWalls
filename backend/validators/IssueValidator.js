/**
 * Issue Validator
 * Input validation for issue-related operations
 */

const { PRIORITY_LEVELS } = require('../config/constants');
const { validateRequired } = require('../utils/validation');

/**
 * Validate issue report data
 * @param {Object} data - Issue report data (title, description, priority)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateReport(data) {
  const errors = [];
  
  // Check required fields
  const titleCheck = validateRequired(data.title, 'Title');
  if (!titleCheck.valid) errors.push(titleCheck.message);
  
  const descriptionCheck = validateRequired(data.description, 'Description');
  if (!descriptionCheck.valid) errors.push(descriptionCheck.message);
  
  // Validate priority if provided
  if (data.priority) {
    const validPriorities = Object.values(PRIORITY_LEVELS);
    if (!validPriorities.includes(data.priority)) {
      errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate issue triage data
 * @param {Object} data - Triage data (action, assignedTo)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateTriage(data) {
  const errors = [];
  
  const actionCheck = validateRequired(data.action, 'Action');
  if (!actionCheck.valid) {
    errors.push(actionCheck.message);
    return { valid: false, errors };
  }
  
  const validActions = ['forward', 'reject', 'assign'];
  if (!validActions.includes(data.action)) {
    errors.push(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }
  
  // If action is 'assign', assignedTo is required
  if (data.action === 'assign') {
    const assignedToCheck = validateRequired(data.assignedTo, 'Associate username');
    if (!assignedToCheck.valid) {
      errors.push('Associate username is required for assign action');
    }
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate issue assignment data (by director)
 * @param {Object} data - Assignment data (action, assignedTo)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateAssign(data) {
  const errors = [];
  
  const actionCheck = validateRequired(data.action, 'Action');
  if (!actionCheck.valid) {
    errors.push(actionCheck.message);
    return { valid: false, errors };
  }
  
  const validActions = ['assign', 'reject'];
  if (!validActions.includes(data.action)) {
    errors.push(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }
  
  // If action is 'assign', assignedTo is required
  if (data.action === 'assign') {
    const assignedToCheck = validateRequired(data.assignedTo, 'Associate username');
    if (!assignedToCheck.valid) {
      errors.push('Associate username is required for assign action');
    }
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Validate issue acceptance data
 * @param {Object} data - Acceptance data (message - optional)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateAccept(data) {
  // All fields are optional
  return { valid: true };
}

/**
 * Validate issue completion data
 * @param {Object} data - Completion data (message - optional)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateComplete(data) {
  // All fields are optional
  return { valid: true };
}

/**
 * Validate issue rejection data
 * @param {Object} data - Rejection data (reason - optional)
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
function validateReject(data) {
  // All fields are optional
  return { valid: true };
}

module.exports = {
  validateReport,
  validateTriage,
  validateAssign,
  validateAccept,
  validateComplete,
  validateReject
};
