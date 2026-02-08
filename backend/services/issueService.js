/**
 * Issue Service
 * Handles issue business logic: reporting, fetching, status updates, ETA management
 */

const Issue = require('../models/Issue');
const User = require('../models/User');

/**
 * Validate title is provided
 * @private
 */
function validateTitle(title) {
  if (!title || !title.trim()) {
    throw { status: 400, message: 'Title is required.' };
  }
}

/**
 * Validate description is provided
 * @private
 */
function validateDescription(description) {
  if (!description || !description.trim()) {
    throw { status: 400, message: 'Description is required.' };
  }
}

/**
 * Validate urgency value if provided
 * @private
 */
function validateUrgency(urgency) {
  if (urgency && !['urgent', 'not urgent'].includes(urgency)) {
    throw { status: 400, message: 'Invalid urgency value.' };
  }
}

/**
 * Validate issue report data
 * @private
 */
function validateIssueReportData(title, description, urgency) {
  validateTitle(title);
  validateDescription(description);
  validateUrgency(urgency);
}

/**
 * Report a new issue (tenant)
 * @param {string} tenantUsername
 * @param {Object} data - { title, description, urgency }
 * @returns {Promise<Object>}
 */
async function reportIssue(tenantUsername, data) {
  const { title, description, urgency } = data;

  // Validate input data
  validateIssueReportData(title, description, urgency);

  const user = await User.findOne({ username: tenantUsername });
  if (!user) throw { status: 404, message: 'User not found.' };

  const issue = new Issue({
    tenant: user._id,
    title: title.trim(),
    description,
    urgency: urgency || 'not urgent',
    status: 'reported'
  });

  await issue.save();
  return { message: 'Issue reported successfully.' };
}

/**
 * Get tenant's own issues
 * @param {string} tenantUsername
 * @returns {Promise<Array>}
 */
async function getTenantIssues(tenantUsername) {
  const user = await User.findOne({ username: tenantUsername });
  if (!user) throw { status: 404, message: 'User not found.' };

  return await Issue.find({ tenant: user._id }).sort({ createdAt: -1 });
}

/**
 * Get all issues (manager/director/admin)
 * @returns {Promise<Array>}
 */
async function getAllIssues() {
  return await Issue.find()
    .populate({
      path: 'tenant',
      select: 'username firstName lastName email building apartment',
      populate: [
        { path: 'building', select: 'name address' },
        { path: 'apartment', select: 'unitNumber' }
      ]
    })
    .sort({ createdAt: -1 });
}

/**
 * Get issues assigned to associate
 * @param {string} associateUsername
 * @returns {Promise<Array>}
 */
async function getAssociateIssues(associateUsername) {
  const associate = await User.findOne({ username: associateUsername });
  if (!associate || associate.status !== 'active') {
    throw { status: 403, message: 'Associate not active' };
  }

  return await Issue.find({ assignee: associateUsername })
    .populate({
      path: 'tenant',
      select: 'firstName lastName building apartment',
      populate: [
        { path: 'building', select: 'address name' },
        { path: 'apartment', select: 'unitNumber' }
      ]
    })
    .sort({ createdAt: -1 });
}

/**
 * Validate status parameter is provided
 * @private
 */
function validateStatusProvided(status) {
  if (!status) {
    throw { status: 400, message: 'Status required' };
  }
}

/**
 * Find and validate issue exists
 * @private
 */
async function findAndValidateIssue(issueId) {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw { status: 404, message: 'Issue not found' };
  }
  return issue;
}

/**
 * Find and validate user exists
 * @private
 */
async function findAndValidateUser(username) {
  const actor = await User.findOne({ username });
  if (!actor) {
    throw { status: 404, message: 'User not found' };
  }
  return actor;
}

/**
 * Validate user has active status for sensitive operations
 * @private
 */
function validateUserIsActive(role, actor) {
  if (['manager', 'associate'].includes(role) && actor.status !== 'active') {
    throw { status: 403, message: 'Inactive user cannot perform this action' };
  }
}

/**
 * Validate issue status change prerequisites
 * @private
 */
async function validateIssueStatusChange(issueId, role, username, status) {
  validateStatusProvided(status);
  const issue = await findAndValidateIssue(issueId);
  const actor = await findAndValidateUser(username);
  validateUserIsActive(role, actor);
  
  return { issue, actor };
}

/**
 * Validate role has permission for status change
 * @private
 */
function validateRolePermissions(role, status) {
  const allowed = {
    associate: ['in progress', 'resolved', 'rejected'],
    manager: ['forwarded', 'assigned', 'in progress', 'resolved', 'rejected'],
    director: ['assigned', 'in progress', 'resolved', 'rejected'],
    admin: ['forwarded', 'assigned', 'in progress', 'resolved', 'rejected']
  };

  if (!allowed[role] || !allowed[role].includes(status)) {
    throw { status: 403, message: 'Forbidden status change' };
  }
}

/**
 * Validate issue can be accepted
 * @private
 */
function validateIssueAcceptance(issue) {
  if (issue.status === 'in progress') {
    throw { status: 400, message: 'Issue already in progress.' };
  }
}

/**
 * Validate and parse cost value
 * @private
 */
function validateAndParseCost(cost) {
  if (cost == null || cost === '') {
    throw { status: 400, message: 'Cost is required when accepting.' };
  }

  const numericCost = Number(cost);
  if (isNaN(numericCost) || numericCost < 0) {
    throw { status: 400, message: 'Invalid cost value.' };
  }

  return numericCost;
}

/**
 * Update tenant debt with issue cost
 * @private
 */
async function updateTenantDebt(tenantId, costAmount) {
  try {
    const tenantUser = await User.findById(tenantId);
    if (tenantUser) {
      tenantUser.debt = (Number(tenantUser.debt) || 0) + costAmount;
      await tenantUser.save();
    }
  } catch (_) {
    // Silently fail if tenant update fails
  }
}

/**
 * Add history entry to issue
 * @private
 */
function addIssueHistoryEntry(issue, username, action, note) {
  issue.history = Array.isArray(issue.history) ? issue.history : [];
  issue.history.push({ by: username, action, note });
}

/**
 * Handle associate accepting issue with cost
 * @private
 */
async function handleAssociateAccept(issue, username, cost) {
  // Validate issue can be accepted
  validateIssueAcceptance(issue);
  
  // Validate and parse cost
  const numericCost = validateAndParseCost(cost);

  // Update issue
  issue.cost = numericCost;
  issue.status = 'in progress';

  // Update tenant debt
  await updateTenantDebt(issue.tenant, numericCost);

  // Add history entry
  addIssueHistoryEntry(issue, username, 'accept', `Accepted (cost ${numericCost})`);
  
  await issue.save();
  return { message: 'Issue accepted', issue };
}

/**
 * Handle associate resolving issue
 * @private
 */
async function handleAssociateResolve(issue, username) {
  if (issue.status !== 'in progress') {
    throw { status: 400, message: 'Issue must be in progress to resolve.' };
  }
  
  issue.status = 'resolved';
  addIssueHistoryEntry(issue, username, 'resolve', 'Finished work');
  
  await issue.save();
  return { message: 'Issue resolved', issue };
}

/**
 * Handle manager forwarding issue to director
 * @private
 */
async function handleManagerForward(issue, username) {
  issue.status = 'forwarded';
  addIssueHistoryEntry(issue, username, 'forward', 'Forwarded to director');
  
  await issue.save();
  return { message: 'Forwarded', issue };
}

/**
 * Check if assignee username is valid
 * @private
 */
function isValidAssigneeUsername(assignee) {
  return assignee && typeof assignee === 'string' && assignee.trim();
}

/**
 * Validate assignee username is provided
 * @private
 */
function validateAssigneeProvided(assignee) {
  if (!isValidAssigneeUsername(assignee)) {
    throw { status: 400, message: 'Assignee username is required to assign.' };
  }
}

/**
 * Find and validate assignee is an associate
 * @private
 */
async function findAndValidateAssignee(assignee) {
  const target = await User.findOne({ username: assignee.trim() });
  if (!target || target.role !== 'associate') {
    throw { status: 400, message: 'Assignee must be an associate user.' };
  }
  return target;
}

/**
 * Validate assignee has active status
 * @private
 */
function validateAssigneeIsActive(target) {
  if (target.status !== 'active') {
    throw { status: 400, message: 'Assignee associate is not active.' };
  }
}

/**
 * Perform atomic issue assignment update
 * @private
 */
async function performAssignmentUpdate(issue, username, assignee) {
  await Issue.updateOne(
    { _id: issue._id },
    {
      $set: { assignee: assignee.trim(), status: 'assigned' },
      $push: { 
        history: { 
          by: username, 
          action: 'assign', 
          note: `Assigned to ${assignee.trim()}`, 
          at: new Date() 
        } 
      }
    }
  );
}

/**
 * Handle issue assignment to associate
 * @private
 */
async function handleAssignment(issue, username, assignee) {
  validateAssigneeProvided(assignee);
  const target = await findAndValidateAssignee(assignee);
  validateAssigneeIsActive(target);
  await performAssignmentUpdate(issue, username, assignee);

  const updated = await Issue.findById(issue._id);
  return { message: 'Assigned', issue: updated };
}

/**
 * Build update fields for status change
 * @private
 */
function buildStatusUpdateFields(status, assignee) {
  const setFields = { status };
  if (assignee) {
    setFields.assignee = assignee;
  }
  return setFields;
}

/**
 * Create history entry object for status change
 * @private
 */
function createStatusHistoryEntry(username, note, status) {
  return {
    by: username,
    action: 'status',
    note: note || status,
    at: new Date()
  };
}

/**
 * Handle generic status change
 * @private
 */
async function handleGenericStatusChange(issue, username, options) {
  const { status, assignee, note } = options;
  const setFields = buildStatusUpdateFields(status, assignee);
  const historyEntry = createStatusHistoryEntry(username, note, status);

  await Issue.updateOne(
    { _id: issue._id },
    {
      $set: setFields,
      $push: { history: historyEntry }
    }
  );

  const updated = await Issue.findById(issue._id);
  return { message: 'Status updated', issue: updated };
}

/**
 * Update issue status with validation
 * @param {string} issueId
 * @param {string} role - user role
 * @param {string} username - username of person making change
 * @param {Object} updates - { status, note, cost, assignee }
 * @returns {Promise<Object>}
 */
async function updateIssueStatus(issueId, role, username, updates) {
  const { status, note, cost, assignee } = updates;

  // Validation
  const { issue } = await validateIssueStatusChange(issueId, role, username, status);
  validateRolePermissions(role, status);

  // Associate accept
  if (role === 'associate' && status === 'in progress') {
    return await handleAssociateAccept(issue, username, cost);
  }

  // Associate resolve
  if (role === 'associate' && status === 'resolved') {
    return await handleAssociateResolve(issue, username);
  }

  // Manager forward
  if (role === 'manager' && status === 'forwarded') {
    return await handleManagerForward(issue, username);
  }

  // Assignment (director, manager, admin)
  if (['director', 'manager', 'admin'].includes(role) && status === 'assigned') {
    return await handleAssignment(issue, username, assignee);
  }

  // Generic status change
  return await handleGenericStatusChange(issue, username, { status, assignee, note });
}

/**
 * Set ETA for an issue
 * @param {string} issueId
 * @param {string} username
 * @param {Date} eta
 * @returns {Promise<Object>}
 */
async function setETA(issueId, username, eta) {
  if (!eta) throw { status: 400, message: 'ETA required' };

  const issue = await Issue.findById(issueId);
  if (!issue) throw { status: 404, message: 'Issue not found' };

  issue.eta = new Date(eta);
  issue.history = Array.isArray(issue.history) ? issue.history : [];
  issue.history.push({ by: username, action: 'eta', note: `ETA set to ${new Date(eta).toISOString()}` });
  await issue.save();

  return { message: 'ETA set', issue };
}

/**
 * Tenant acknowledges ETA
 * @param {string} issueId
 * @param {string} tenantUsername
 * @returns {Promise<Object>}
 */
async function acknowledgeETA(issueId, tenantUsername) {
  const tenant = await User.findOne({ username: tenantUsername });
  const issue = await Issue.findById(issueId);

  if (!issue || String(issue.tenant) !== String(tenant._id)) {
    throw { status: 404, message: 'Issue not found' };
  }

  issue.etaAckByTenant = true;
  issue.history = Array.isArray(issue.history) ? issue.history : [];
  issue.history.push({
    by: tenantUsername,
    action: 'ack',
    note: `Tenant will be home for ETA ${issue.eta ? issue.eta.toISOString() : ''}`
  });
  await issue.save();

  return { message: 'Acknowledged', issue };
}

module.exports = {
  reportIssue,
  getTenantIssues,
  getAllIssues,
  getAssociateIssues,
  updateIssueStatus,
  setETA,
  acknowledgeETA
};
