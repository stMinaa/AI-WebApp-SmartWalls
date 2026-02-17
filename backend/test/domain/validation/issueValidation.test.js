/* eslint-disable max-nested-callbacks */
/**
 * Domain Layer Test - Issue Validation (Pure Business Logic)
 *
 * Purpose: Test business rules using actual domain entities
 * Mocking: NONE - Domain has no infrastructure dependencies
 * Coverage Target: ≥90%
 */

const ValidationError = require('../../../src/domain/exception/ValidationError');
const Issue = require('../../../src/domain/model/Issue');
const IssuePermissions = require('../../../src/domain/service/IssuePermissions');

describe('Domain Layer - Issue Validation', () => {
  describe('Title validation', () => {
    it('should reject empty title', () => {
      expect(() => new Issue({ title: '', description: 'desc' })).toThrow(ValidationError);
      expect(() => new Issue({ title: '   ', description: 'desc' })).toThrow(ValidationError);
      expect(() => new Issue({ title: null, description: 'desc' })).toThrow(ValidationError);
    });

    it('should accept valid title', () => {
      const issue1 = new Issue({ title: 'Broken pipe', description: 'desc' });
      expect(issue1.title).toBe('Broken pipe');

      const issue2 = new Issue({ title: 'Water leak in apartment', description: 'desc' });
      expect(issue2.title).toBe('Water leak in apartment');
    });
  });

  describe('Priority validation', () => {
    it('should reject invalid priority', () => {
      expect(() => new Issue({ title: 'Test', description: 'desc', priority: 'critical' })).toThrow(
        ValidationError
      );
      expect(() => new Issue({ title: 'Test', description: 'desc', priority: 'INVALID' })).toThrow(
        ValidationError
      );
    });

    it('should accept valid priority', () => {
      expect(new Issue({ title: 'T', description: 'd', priority: 'low' }).priority).toBe('low');
      expect(new Issue({ title: 'T', description: 'd', priority: 'medium' }).priority).toBe(
        'medium'
      );
      expect(new Issue({ title: 'T', description: 'd', priority: 'high' }).priority).toBe('high');
      expect(new Issue({ title: 'T', description: 'd' }).priority).toBe('medium'); // default
    });
  });

  describe('Status transitions', () => {
    it('should allow valid status transitions', () => {
      const issue = new Issue({ title: 'T', description: 'd' });
      expect(issue.canTransitionTo('forwarded', 'manager')).toBe(true);

      const forwarded = Issue.restore({ title: 'T', description: 'd', status: 'forwarded' });
      expect(forwarded.canTransitionTo('assigned', 'director')).toBe(true);

      const assigned = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      expect(assigned.canTransitionTo('in-progress', 'associate')).toBe(true);

      const inProgress = Issue.restore({ title: 'T', description: 'd', status: 'in-progress' });
      expect(inProgress.canTransitionTo('resolved', 'associate')).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      const reported = new Issue({ title: 'T', description: 'd' });
      expect(reported.canTransitionTo('resolved', 'director')).toBe(false);

      const resolved = Issue.restore({ title: 'T', description: 'd', status: 'resolved' });
      expect(resolved.canTransitionTo('in-progress', 'associate')).toBe(false);

      const rejected = Issue.restore({ title: 'T', description: 'd', status: 'rejected' });
      expect(rejected.canTransitionTo('assigned', 'director')).toBe(false);
    });
  });

  describe('Role authorization', () => {
    it('should allow manager to forward issues', () => {
      expect(IssuePermissions.canForward('manager')).toBe(true);
      expect(IssuePermissions.canForward('director')).toBe(true);
    });

    it('should not allow tenant to forward issues', () => {
      expect(IssuePermissions.canForward('tenant')).toBe(false);
      expect(IssuePermissions.canForward('associate')).toBe(false);
    });

    it('should allow director to assign issues', () => {
      expect(IssuePermissions.canAssign('director')).toBe(true);
    });

    it('should allow manager to assign issues', () => {
      expect(IssuePermissions.canAssign('manager')).toBe(true);
    });

    it('should not allow tenant to assign issues', () => {
      expect(IssuePermissions.canAssign('tenant')).toBe(false);
    });
  });
});
