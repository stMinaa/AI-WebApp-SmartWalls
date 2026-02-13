// Refaktorisana verzija updateIssueStatus funkcije
// Razdvojena na manje, fokusirane funkcije

// Helper funkcije za validaciju
async function validateIssueStatusChange(issueId, role, username, status) {
  if (!status) throw { status: 400, message: 'Status required' };

  const issue = await Issue.findById(issueId);
  if (!issue) throw { status: 404, message: 'Issue not found' };

  const actor = await User.findOne({ username });
  if (!actor) throw { status: 404, message: 'User not found' };

  // Enforce active status for manager and associate
  if (['manager', 'associate'].includes(role) && actor.status !== 'active') {
    throw { status: 403, message: 'Inactive user cannot perform this action' };
  }

  return { issue, actor };
}

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

// Specifične akcije po ulogama
async function handleAssociateAccept(issue, username, cost) {
  if (issue.status === 'in progress') {
    throw { status: 400, message: 'Issue already in progress.' };
  }
  
  if (cost == null || cost === '') {
    throw { status: 400, message: 'Cost is required when accepting.' };
  }

  const numericCost = Number(cost);
  if (isNaN(numericCost) || numericCost < 0) {
    throw { status: 400, message: 'Invalid cost value.' };
  }

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
  issue.history.push({ 
    by: username, 
    action: 'accept', 
    note: `Accepted (cost ${numericCost})` 
  });
  
  await issue.save();
  return { message: 'Issue accepted', issue };
}

async function handleAssociateResolve(issue, username) {
  if (issue.status !== 'in progress') {
    throw { status: 400, message: 'Issue must be in progress to resolve.' };
  }
  
  issue.status = 'resolved';
  issue.history = Array.isArray(issue.history) ? issue.history : [];
  issue.history.push({ by: username, action: 'resolve', note: 'Finished work' });
  
  await issue.save();
  return { message: 'Issue resolved', issue };
}

async function handleManagerForward(issue, username) {
  issue.status = 'forwarded';
  issue.history = Array.isArray(issue.history) ? issue.history : [];
  issue.history.push({ by: username, action: 'forward', note: 'Forwarded to director' });
  
  await issue.save();
  return { message: 'Forwarded', issue };
}

async function handleAssignment(issue, username, assignee) {
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

  const updated = await Issue.findById(issue._id);
  return { message: 'Assigned', issue: updated };
}

async function handleGenericStatusChange(issue, username, status, assignee, note) {
  const setFields = { status };
  if (assignee) setFields.assignee = assignee;

  await Issue.updateOne(
    { _id: issue._id },
    {
      $set: setFields,
      $push: { 
        history: { 
          by: username, 
          action: 'status', 
          note: note || status, 
          at: new Date() 
        } 
      }
    }
  );

  const updated = await Issue.findById(issue._id);
  return { message: 'Status updated', issue: updated };
}

// Glavna refaktorisana funkcija
async function updateIssueStatus(issueId, role, username, updates) {
  const { status, note, cost, assignee } = updates;

  // Validacija
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
  return await handleGenericStatusChange(issue, username, status, assignee, note);
}

// Eksportuj sve funkcije
module.exports = {
  updateIssueStatus,
  validateIssueStatusChange,
  validateRolePermissions,
  handleAssociateAccept,
  handleAssociateResolve,
  handleManagerForward,
  handleAssignment,
  handleGenericStatusChange
};
