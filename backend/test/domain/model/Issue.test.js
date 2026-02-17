/* eslint-disable max-nested-callbacks */
const AuthorizationError = require('../../../src/domain/exception/AuthorizationError');
const ValidationError = require('../../../src/domain/exception/ValidationError');
const Issue = require('../../../src/domain/model/Issue');

describe('Domain - Issue Entity', () => {
  describe('Constructor validation', () => {
    it('should reject empty title', () => {
      expect(() => new Issue({ title: '', description: 'desc' })).toThrow(ValidationError);
    });

    it('should reject null title', () => {
      expect(() => new Issue({ title: null, description: 'desc' })).toThrow(ValidationError);
    });

    it('should reject whitespace-only title', () => {
      expect(() => new Issue({ title: '   ', description: 'desc' })).toThrow(ValidationError);
    });

    it('should reject empty description', () => {
      expect(() => new Issue({ title: 'Test', description: '' })).toThrow(ValidationError);
    });

    it('should reject invalid priority', () => {
      expect(() => new Issue({ title: 'Test', description: 'desc', priority: 'critical' })).toThrow(
        ValidationError
      );
    });

    it('should accept valid priority values', () => {
      const issue = new Issue({ title: 'Test', description: 'desc', priority: 'high' });
      expect(issue.priority).toBe('high');
    });

    it('should default priority to medium', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(issue.priority).toBe('medium');
    });

    it('should initialize with reported status', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(issue.status).toBe('reported');
    });

    it('should trim title', () => {
      const issue = new Issue({ title: '  Water leak  ', description: 'desc' });
      expect(issue.title).toBe('Water leak');
    });

    it('should trim description', () => {
      const issue = new Issue({ title: 'Test', description: '  broken pipe  ' });
      expect(issue.description).toBe('broken pipe');
    });

    it('should accept optional fields', () => {
      const issue = new Issue({
        title: 'Test',
        description: 'desc',
        createdBy: 'user123',
        apartment: 'apt123',
        building: 'bld123'
      });
      expect(issue.createdBy).toBe('user123');
      expect(issue.apartment).toBe('apt123');
      expect(issue.building).toBe('bld123');
    });

    it('should allow restoring from persisted data with any status', () => {
      const issue = Issue.restore({
        id: '123',
        title: 'Test',
        description: 'desc',
        status: 'forwarded',
        priority: 'high',
        createdBy: 'user1'
      });
      expect(issue.status).toBe('forwarded');
      expect(issue.id).toBe('123');
    });
  });

  describe('Status transitions', () => {
    it('should allow manager to forward reported issue', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      issue.transitionTo('forwarded', 'manager');
      expect(issue.status).toBe('forwarded');
    });

    it('should allow manager to reject reported issue', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      issue.transitionTo('rejected', 'manager');
      expect(issue.status).toBe('rejected');
    });

    it('should allow director to forward reported issue', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      issue.transitionTo('forwarded', 'director');
      expect(issue.status).toBe('forwarded');
    });

    it('should not allow tenant to forward issue', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(() => issue.transitionTo('forwarded', 'tenant')).toThrow(AuthorizationError);
    });

    it('should allow director to assign forwarded issue', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'forwarded' });
      issue.transitionTo('assigned', 'director');
      expect(issue.status).toBe('assigned');
    });

    it('should allow manager to assign forwarded issue', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'forwarded' });
      issue.transitionTo('assigned', 'manager');
      expect(issue.status).toBe('assigned');
    });

    it('should allow manager to assign reported issue directly', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      issue.transitionTo('assigned', 'manager');
      expect(issue.status).toBe('assigned');
    });

    it('should allow associate to move assigned to in-progress', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      issue.transitionTo('in-progress', 'associate');
      expect(issue.status).toBe('in-progress');
    });

    it('should allow associate to resolve in-progress issue', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'in-progress' });
      issue.transitionTo('resolved', 'associate');
      expect(issue.status).toBe('resolved');
    });

    it('should reject invalid transition (reported → resolved)', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(() => issue.transitionTo('resolved', 'director')).toThrow(ValidationError);
    });

    it('should reject transition from terminal state (resolved)', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'resolved' });
      expect(() => issue.transitionTo('in-progress', 'associate')).toThrow(ValidationError);
    });

    it('should reject transition from terminal state (rejected)', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'rejected' });
      expect(() => issue.transitionTo('assigned', 'director')).toThrow(ValidationError);
    });

    it('should allow associate to reject assigned issue (back to forwarded)', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      issue.transitionTo('forwarded', 'associate');
      expect(issue.status).toBe('forwarded');
    });
  });

  describe('canTransitionTo', () => {
    it('should return true for valid transitions', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(issue.canTransitionTo('forwarded', 'manager')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(issue.canTransitionTo('resolved', 'manager')).toBe(false);
    });

    it('should return false for unauthorized role', () => {
      const issue = new Issue({ title: 'Test', description: 'desc' });
      expect(issue.canTransitionTo('forwarded', 'tenant')).toBe(false);
    });
  });

  describe('Cost handling', () => {
    it('should set valid cost', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      issue.setCost(150);
      expect(issue.cost).toBe(150);
    });

    it('should accept zero cost', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      issue.setCost(0);
      expect(issue.cost).toBe(0);
    });

    it('should reject negative cost', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      expect(() => issue.setCost(-10)).toThrow(ValidationError);
    });

    it('should reject non-number cost', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      expect(() => issue.setCost('abc')).toThrow(ValidationError);
    });

    it('should reject NaN cost', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'assigned' });
      expect(() => issue.setCost(NaN)).toThrow(ValidationError);
    });
  });

  describe('Completion', () => {
    it('should set completion date and notes', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'in-progress' });
      issue.complete('Fixed the pipe');
      expect(issue.completionNotes).toBe('Fixed the pipe');
      expect(issue.completionDate).toBeInstanceOf(Date);
    });

    it('should work without notes', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'in-progress' });
      issue.complete();
      expect(issue.completionDate).toBeInstanceOf(Date);
      expect(issue.completionNotes).toBeUndefined();
    });
  });

  describe('Assignment', () => {
    it('should set assignedTo', () => {
      const issue = Issue.restore({ title: 'T', description: 'd', status: 'forwarded' });
      issue.assignTo('assoc123');
      expect(issue.assignedTo).toBe('assoc123');
    });

    it('should clear assignedTo on unassign', () => {
      const issue = Issue.restore({
        title: 'T',
        description: 'd',
        status: 'assigned',
        assignedTo: 'assoc123'
      });
      issue.unassign();
      expect(issue.assignedTo).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should serialize all fields', () => {
      const issue = new Issue({
        title: 'Water leak',
        description: 'Pipe broken',
        priority: 'high',
        createdBy: 'user1',
        apartment: 'apt1',
        building: 'bld1'
      });
      const json = issue.toJSON();
      expect(json.title).toBe('Water leak');
      expect(json.description).toBe('Pipe broken');
      expect(json.priority).toBe('high');
      expect(json.status).toBe('reported');
      expect(json.createdBy).toBe('user1');
    });
  });
});
