const IssuePermissions = require('../../../src/domain/service/IssuePermissions');

describe('Domain - IssuePermissions', () => {
  describe('canForward', () => {
    it('should allow manager to forward', () => {
      expect(IssuePermissions.canForward('manager')).toBe(true);
    });

    it('should allow director to forward', () => {
      expect(IssuePermissions.canForward('director')).toBe(true);
    });

    it('should not allow tenant to forward', () => {
      expect(IssuePermissions.canForward('tenant')).toBe(false);
    });

    it('should not allow associate to forward', () => {
      expect(IssuePermissions.canForward('associate')).toBe(false);
    });
  });

  describe('canAssign', () => {
    it('should allow director to assign', () => {
      expect(IssuePermissions.canAssign('director')).toBe(true);
    });

    it('should allow manager to assign', () => {
      expect(IssuePermissions.canAssign('manager')).toBe(true);
    });

    it('should not allow tenant to assign', () => {
      expect(IssuePermissions.canAssign('tenant')).toBe(false);
    });
  });

  describe('canAccept', () => {
    it('should allow associate to accept', () => {
      expect(IssuePermissions.canAccept('associate')).toBe(true);
    });

    it('should not allow manager to accept', () => {
      expect(IssuePermissions.canAccept('manager')).toBe(false);
    });
  });

  describe('canComplete', () => {
    it('should allow associate to complete', () => {
      expect(IssuePermissions.canComplete('associate')).toBe(true);
    });

    it('should not allow director to complete', () => {
      expect(IssuePermissions.canComplete('director')).toBe(false);
    });
  });

  describe('canReject', () => {
    it('should allow manager to reject', () => {
      expect(IssuePermissions.canReject('manager')).toBe(true);
    });

    it('should allow director to reject', () => {
      expect(IssuePermissions.canReject('director')).toBe(true);
    });

    it('should allow associate to reject', () => {
      expect(IssuePermissions.canReject('associate')).toBe(true);
    });

    it('should not allow tenant to reject', () => {
      expect(IssuePermissions.canReject('tenant')).toBe(false);
    });
  });

  describe('canReport', () => {
    it('should allow tenant to report', () => {
      expect(IssuePermissions.canReport('tenant')).toBe(true);
    });

    it('should not allow manager to report', () => {
      expect(IssuePermissions.canReport('manager')).toBe(false);
    });
  });

  describe('canViewAll', () => {
    it('should allow manager to view all', () => {
      expect(IssuePermissions.canViewAll('manager')).toBe(true);
    });

    it('should allow director to view all', () => {
      expect(IssuePermissions.canViewAll('director')).toBe(true);
    });

    it('should not allow tenant to view all', () => {
      expect(IssuePermissions.canViewAll('tenant')).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return forwarded,rejected,assigned for manager on reported', () => {
      const transitions = IssuePermissions.getAllowedTransitions('manager', 'reported');
      expect(transitions).toContain('forwarded');
      expect(transitions).toContain('rejected');
      expect(transitions).toContain('assigned');
    });

    it('should return assigned,rejected for director on forwarded', () => {
      const transitions = IssuePermissions.getAllowedTransitions('director', 'forwarded');
      expect(transitions).toContain('assigned');
      expect(transitions).toContain('rejected');
    });

    it('should return in-progress,forwarded for associate on assigned', () => {
      const transitions = IssuePermissions.getAllowedTransitions('associate', 'assigned');
      expect(transitions).toContain('in-progress');
      expect(transitions).toContain('forwarded');
    });

    it('should return empty array for tenant on any status', () => {
      expect(IssuePermissions.getAllowedTransitions('tenant', 'reported')).toEqual([]);
    });

    it('should return empty for terminal states', () => {
      expect(IssuePermissions.getAllowedTransitions('director', 'resolved')).toEqual([]);
      expect(IssuePermissions.getAllowedTransitions('director', 'rejected')).toEqual([]);
    });
  });
});
