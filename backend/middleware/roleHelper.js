const { USER_ROLES, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

function requireRole(user, requiredRole, errorMessage) {
  if (user.role !== requiredRole) {
    const error = new Error(errorMessage || `Only ${requiredRole}s can perform this action`);
    error.status = HTTP_STATUS.FORBIDDEN;
    throw error;
  }
}

function requireOneOfRoles(user, allowedRoles, errorMessage) {
  if (!allowedRoles.includes(user.role)) {
    const error = new Error(errorMessage || `Insufficient permissions`);
    error.status = HTTP_STATUS.FORBIDDEN;
    throw error;
  }
}

function requireDirector(user, errorMessage = ERROR_MESSAGES.ONLY_DIRECTORS) {
  requireRole(user, USER_ROLES.DIRECTOR, errorMessage);
}

function requireManager(user, errorMessage = ERROR_MESSAGES.ONLY_MANAGERS_VIEW_BUILDINGS) {
  requireRole(user, USER_ROLES.MANAGER, errorMessage);
}

function requireAssociate(user, errorMessage = ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT) {
  requireRole(user, USER_ROLES.ASSOCIATE, errorMessage);
}

function requireTenant(user, errorMessage) {
  requireRole(user, USER_ROLES.TENANT, errorMessage || 'Only tenants can perform this action');
}

function requireDirectorOrManager(user, errorMessage = ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_VIEW_ISSUES) {
  requireOneOfRoles(user, [USER_ROLES.DIRECTOR, USER_ROLES.MANAGER], errorMessage);
}

module.exports = {
  requireRole,
  requireOneOfRoles,
  requireDirector,
  requireManager,
  requireAssociate,
  requireTenant,
  requireDirectorOrManager
};
