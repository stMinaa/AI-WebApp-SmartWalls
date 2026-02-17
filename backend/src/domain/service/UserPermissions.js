const UserPermissions = {
  canUpdateDebt(role) {
    return ['manager', 'director'].includes(role);
  },

  canViewPending(role) {
    return ['manager', 'director'].includes(role);
  },

  canListUsers(role) {
    return role === 'director';
  },

  canApproveUser(approverRole, targetRole) {
    if (approverRole === 'director') return true;
    if (approverRole === 'manager' && targetRole === 'tenant') return true;
    return false;
  },

  canDeleteUser(role) {
    return role === 'director';
  },

  canDeleteTenant(role) {
    return ['manager', 'director'].includes(role);
  },

  canAssignTenant(role) {
    return ['manager', 'director'].includes(role);
  },

  canViewOwnApartment(role) {
    return role === 'tenant';
  },

  canViewAssociates(role) {
    return ['manager', 'director'].includes(role);
  },

  canViewOwnJobs(role) {
    return role === 'associate';
  }
};

module.exports = UserPermissions;
