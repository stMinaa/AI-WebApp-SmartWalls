const TRANSITION_ROLES = {
  'reported->forwarded': ['manager', 'director'],
  'reported->rejected': ['manager', 'director'],
  'reported->assigned': ['manager'],
  'forwarded->assigned': ['director', 'manager'],
  'forwarded->rejected': ['director', 'manager'],
  'assigned->in-progress': ['associate'],
  'assigned->forwarded': ['associate'],
  'assigned->rejected': ['associate'],
  'in-progress->resolved': ['associate'],
  'in-progress->rejected': ['associate']
};

const VALID_TRANSITIONS = {
  reported: ['forwarded', 'rejected', 'assigned'],
  forwarded: ['assigned', 'rejected'],
  assigned: ['in-progress', 'forwarded', 'rejected'],
  'in-progress': ['resolved', 'rejected'],
  resolved: [],
  rejected: []
};

const IssuePermissions = {
  canForward(role) {
    return ['manager', 'director'].includes(role);
  },

  canAssign(role) {
    return ['director', 'manager'].includes(role);
  },

  canAccept(role) {
    return role === 'associate';
  },

  canComplete(role) {
    return role === 'associate';
  },

  canReject(role) {
    return ['manager', 'director', 'associate'].includes(role);
  },

  canReport(role) {
    return role === 'tenant';
  },

  canViewAll(role) {
    return ['manager', 'director'].includes(role);
  },

  getAllowedTransitions(role, currentStatus) {
    const possibleNext = VALID_TRANSITIONS[currentStatus] || [];
    return possibleNext.filter((nextStatus) => {
      const key = `${currentStatus}->${nextStatus}`;
      const allowedRoles = TRANSITION_ROLES[key];
      return allowedRoles && allowedRoles.includes(role);
    });
  }
};

module.exports = IssuePermissions;
