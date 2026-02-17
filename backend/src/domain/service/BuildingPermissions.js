const BuildingPermissions = {
  canCreateBuilding(role) {
    return role === 'director';
  },

  canViewAllBuildings(role) {
    return role === 'director';
  },

  canViewManagedBuildings(role) {
    return role === 'manager';
  },

  canAssignManager(role) {
    return role === 'director';
  },

  canCreateApartments(role) {
    return ['manager', 'director'].includes(role);
  },

  canViewApartments() {
    return true; // Any authenticated user
  },

  canViewTenants(role) {
    return ['manager', 'director'].includes(role);
  }
};

module.exports = BuildingPermissions;
