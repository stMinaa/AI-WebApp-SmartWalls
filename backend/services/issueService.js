/**
 * Issue Service
 * Handles issue business logic: reporting, fetching, status updates, ETA management
 */

const Issue = require('../models/Issue');
const User = require('../models/User');

/**
 * Report a new issue (tenant)
 * @param {string} tenantUsername
 * @param {Object} data - { title, description, urgency }
 * @returns {Promise<Object>}
 */
async function reportIssue(tenantUsername, data) {
  const { title, description, urgency } = data;

  if (!title || !title.trim()) throw { status: 400, message: 'Title is required.' };
  if (!description || !description.trim()) throw { status: 400, message: 'Description is required.' };
  if (urgency && !['urgent', 'not urgent'].includes(urgency)) {
    throw { status: 400, message: 'Invalid urgency value.' };
  }

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
 * Update issue status with validation
 * @param {string} issueId
 * @param {string} role - user role
 * @param {string} username - username of person making change
 * @param {Object} updates - { status, note, cost, assignee }
 * @returns {Promise<Object>}
 */
async function updateIssueStatus(issueId, role, username, updates) {
  const { status, note, cost, assignee } = updates;

  if (!status) throw { status: 400, message: 'Status required' };

  const issue = await Issue.findById(issueId);
  if (!issue) throw { status: 404, message: 'Issue not found' };

  const actor = await User.findOne({ username });
  if (!actor) throw { status: 404, message: 'User not found' };

  // Enforce active status for manager and associate
  if (['manager', 'associate'].includes(role) && actor.status !== 'active') {
    throw { status: 403, message: 'Inactive user cannot perform this action' };
  }

  // Define allowed statuses per role
  const allowed = {
    associate: ['in progress', 'resolved', 'rejected'],
    manager: ['forwarded', 'assigned', 'in progress', 'resolved', 'rejected'],
    director: ['assigned', 'in progress', 'resolved', 'rejected'],
    admin: ['forwarded', 'assigned', 'in progress', 'resolved', 'rejected']
  };

  if (!allowed[role] || !allowed[role].includes(status)) {
    throw { status: 403, message: 'Forbidden status change' };
  }

  // Associate accept with cost
  if (role === 'associate' && status === 'in progress') {
    if (issue.status === 'in progress') throw { status: 400, message: 'Issue already in progress.' };
    if (cost == null || cost === '') throw { status: 400, message: 'Cost is required when accepting.' };

    const numericCost = Number(cost);
    if (isNaN(numericCost) || numericCost < 0) throw { status: 400, message: 'Invalid cost value.' };

    issue.cost = numericCost;
    issue.status = 'in progress';

    // Update tenant debt
    try {
      const tenantUser = await User.findById(issue.tenant);
      if (tenantUser) {
        tenantUser.debt = (Number(tenantUser.debt) || 0) + numericCost;
        await tenantUser.save();
      }
    } catch (_) {}

    issue.history = Array.isArray(issue.history) ? issue.history : [];
    issue.history.push({ by: username, action: 'accept', note: `Accepted (cost ${numericCost})` });
    await issue.save();
    return { message: 'Issue accepted', issue };
  }

  // Associate resolve
  if (role === 'associate' && status === 'resolved') {
    if (issue.status !== 'in progress') throw { status: 400, message: 'Issue must be in progress to resolve.' };
    issue.status = 'resolved';
    issue.history = Array.isArray(issue.history) ? issue.history : [];
    issue.history.push({ by: username, action: 'resolve', note: 'Finished work' });
    await issue.save();
    return { message: 'Issue resolved', issue };
  }

  // Manager forward
  if (role === 'manager' && status === 'forwarded') {
    issue.status = 'forwarded';
    issue.history = Array.isArray(issue.history) ? issue.history : [];
    issue.history.push({ by: username, action: 'forward', note: 'Forwarded to director' });
    await issue.save();
    return { message: 'Forwarded', issue };
  }

  // Director assign with validation
  if ((role === 'director' || role === 'manager' || role === 'admin') && status === 'assigned') {
    if (!assignee || typeof assignee !== 'string' || !assignee.trim()) {
      throw { status: 400, message: 'Assignee username is required to assign.' };
    }

    const target = await User.findOne({ username: assignee.trim() });
    if (!target || target.role !== 'associate') {
      throw { status: 400, message: 'Assignee must be an associate user.' };
    }
    if (target.status !== 'active') {
      throw { status: 400, message: 'Assignee associate is not active.' };
    }

    // Use atomic update to avoid validation errors on legacy documents
    await Issue.updateOne(
      { _id: issue._id },
      {
        $set: { assignee: assignee.trim(), status: 'assigned' },
        $push: { history: { by: username, action: 'assign', note: `Assigned to ${assignee.trim()}`, at: new Date() } }
      }
    );

    const updated = await Issue.findById(issue._id);
    return { message: 'Assigned', issue: updated };
  }

  // Generic status change
  const setFields = { status };
  if (assignee) setFields.assignee = assignee;

  await Issue.updateOne(
    { _id: issue._id },
    {
      $set: setFields,
      $push: { history: { by: username, action: 'status', note: note || status, at: new Date() } }
    }
  );

  const updatedGeneric = await Issue.findById(issue._id);
  return { message: 'Status updated', issue: updatedGeneric };
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
