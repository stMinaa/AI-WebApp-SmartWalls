const UserPermissions = require('../../../src/domain/service/UserPermissions');

describe('UserPermissions', () => {
  describe('canUpdateDebt', () => {
    it('allows manager', () => {
      expect(UserPermissions.canUpdateDebt('manager')).toBe(true);
    });
    it('allows director', () => {
      expect(UserPermissions.canUpdateDebt('director')).toBe(true);
    });
    it('denies tenant', () => {
      expect(UserPermissions.canUpdateDebt('tenant')).toBe(false);
    });
    it('denies associate', () => {
      expect(UserPermissions.canUpdateDebt('associate')).toBe(false);
    });
  });

  describe('canViewPending', () => {
    it('allows manager', () => {
      expect(UserPermissions.canViewPending('manager')).toBe(true);
    });
    it('allows director', () => {
      expect(UserPermissions.canViewPending('director')).toBe(true);
    });
    it('denies tenant', () => {
      expect(UserPermissions.canViewPending('tenant')).toBe(false);
    });
  });

  describe('canListUsers', () => {
    it('allows director', () => {
      expect(UserPermissions.canListUsers('director')).toBe(true);
    });
    it('denies manager', () => {
      expect(UserPermissions.canListUsers('manager')).toBe(false);
    });
    it('denies tenant', () => {
      expect(UserPermissions.canListUsers('tenant')).toBe(false);
    });
  });

  describe('canApproveUser', () => {
    it('allows director for any role', () => {
      expect(UserPermissions.canApproveUser('director', 'manager')).toBe(true);
      expect(UserPermissions.canApproveUser('director', 'tenant')).toBe(true);
      expect(UserPermissions.canApproveUser('director', 'associate')).toBe(true);
    });
    it('allows manager for tenant only', () => {
      expect(UserPermissions.canApproveUser('manager', 'tenant')).toBe(true);
    });
    it('denies manager for non-tenant', () => {
      expect(UserPermissions.canApproveUser('manager', 'manager')).toBe(false);
      expect(UserPermissions.canApproveUser('manager', 'associate')).toBe(false);
    });
    it('denies tenant', () => {
      expect(UserPermissions.canApproveUser('tenant', 'tenant')).toBe(false);
    });
  });

  describe('canDeleteUser', () => {
    it('allows director', () => {
      expect(UserPermissions.canDeleteUser('director')).toBe(true);
    });
    it('denies manager', () => {
      expect(UserPermissions.canDeleteUser('manager')).toBe(false);
    });
  });

  describe('canDeleteTenant', () => {
    it('allows manager', () => {
      expect(UserPermissions.canDeleteTenant('manager')).toBe(true);
    });
    it('allows director', () => {
      expect(UserPermissions.canDeleteTenant('director')).toBe(true);
    });
    it('denies tenant', () => {
      expect(UserPermissions.canDeleteTenant('tenant')).toBe(false);
    });
  });

  describe('canAssignTenant', () => {
    it('allows manager', () => {
      expect(UserPermissions.canAssignTenant('manager')).toBe(true);
    });
    it('allows director', () => {
      expect(UserPermissions.canAssignTenant('director')).toBe(true);
    });
    it('denies tenant', () => {
      expect(UserPermissions.canAssignTenant('tenant')).toBe(false);
    });
  });

  describe('canViewOwnApartment', () => {
    it('allows tenant', () => {
      expect(UserPermissions.canViewOwnApartment('tenant')).toBe(true);
    });
    it('denies manager', () => {
      expect(UserPermissions.canViewOwnApartment('manager')).toBe(false);
    });
  });

  describe('canViewAssociates', () => {
    it('allows manager', () => {
      expect(UserPermissions.canViewAssociates('manager')).toBe(true);
    });
    it('allows director', () => {
      expect(UserPermissions.canViewAssociates('director')).toBe(true);
    });
    it('denies associate', () => {
      expect(UserPermissions.canViewAssociates('associate')).toBe(false);
    });
  });

  describe('canViewOwnJobs', () => {
    it('allows associate', () => {
      expect(UserPermissions.canViewOwnJobs('associate')).toBe(true);
    });
    it('denies manager', () => {
      expect(UserPermissions.canViewOwnJobs('manager')).toBe(false);
    });
  });
});
