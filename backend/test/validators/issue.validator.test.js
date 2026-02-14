/**
 * Issue Validator Tests
 * RED Phase: Tests for issue input validation (report, triage, assign, accept, complete)
 */

const IssueValidator = require('../../validators/IssueValidator');

describe('IssueValidator - Report', () => {
  test('valid issue report should pass', () => {
    const data = {
      title: 'Broken window',
      description: 'The window in the living room is broken',
      priority: 'high'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing title should fail', () => {
    const data = {
      description: 'The window in the living room is broken',
      priority: 'high'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  test('empty title should fail', () => {
    const data = {
      title: '   ',
      description: 'The window in the living room is broken',
      priority: 'high'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  test('missing description should fail', () => {
    const data = {
      title: 'Broken window',
      priority: 'high'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Description is required');
  });

  test('empty description should fail', () => {
    const data = {
      title: 'Broken window',
      description: '   ',
      priority: 'high'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Description is required');
  });

  test('invalid priority should fail', () => {
    const data = {
      title: 'Broken window',
      description: 'The window in the living room is broken',
      priority: 'super-urgent'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid priority'))).toBe(true);
  });

  test('missing priority should default to medium', () => {
    const data = {
      title: 'Broken window',
      description: 'The window in the living room is broken'
    };
    
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(true);
  });

  test('valid priority values (low, medium, high, critical)', () => {
    const priorities = ['low', 'medium', 'high', 'critical'];
    
    priorities.forEach(priority => {
      const data = {
        title: 'Test issue',
        description: 'Test description',
        priority
      };
      const result = IssueValidator.validateReport(data);
      expect(result.valid).toBe(true);
    });
  });
});

describe('IssueValidator - Triage', () => {
  test('valid triage with forward action should pass', () => {
    const data = {
      action: 'forward'
    };
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(true);
  });

  test('valid triage with reject action should pass', () => {
    const data = {
      action: 'reject'
    };
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(true);
  });

  test('valid triage with assign action and assignedTo should pass', () => {
    const data = {
      action: 'assign',
      assignedTo: 'associate1'
    };
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(true);
  });

  test('missing action should fail', () => {
    const data = {};
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Action is required');
  });

  test('invalid action should fail', () => {
    const data = {
      action: 'delete'
    };
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid action'))).toBe(true);
  });

  test('assign action without assignedTo should fail', () => {
    const data = {
      action: 'assign'
    };
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Associate username is required for assign action');
  });

  test('empty assignedTo should fail', () => {
    const data = {
      action: 'assign',
      assignedTo: '   '
    };
    
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Associate username is required for assign action');
  });
});

describe('IssueValidator - Assign (Director)', () => {
  test('valid assignment with assign action should pass', () => {
    const data = {
      action: 'assign',
      assignedTo: 'associate1'
    };
    
    const result = IssueValidator.validateAssign(data);
    expect(result.valid).toBe(true);
  });

  test('valid rejection should pass', () => {
    const data = {
      action: 'reject'
    };
    
    const result = IssueValidator.validateAssign(data);
    expect(result.valid).toBe(true);
  });

  test('missing action should fail', () => {
    const data = {};
    
    const result = IssueValidator.validateAssign(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Action is required');
  });

  test('invalid action should fail', () => {
    const data = {
      action: 'cancel'
    };
    
    const result = IssueValidator.validateAssign(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid action'))).toBe(true);
  });

  test('assign action without assignedTo should fail', () => {
    const data = {
      action: 'assign'
    };
    
    const result = IssueValidator.validateAssign(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Associate username is required for assign action');
  });
});

describe('IssueValidator - Accept', () => {
  test('valid acceptance without message should pass', () => {
    const data = {};
    
    const result = IssueValidator.validateAccept(data);
    expect(result.valid).toBe(true);
  });

  test('valid acceptance with message should pass', () => {
    const data = {
      message: 'I will start working on this tomorrow'
    };
    
    const result = IssueValidator.validateAccept(data);
    expect(result.valid).toBe(true);
  });

  test('empty data should pass (all fields optional)', () => {
    const data = {};
    
    const result = IssueValidator.validateAccept(data);
    expect(result.valid).toBe(true);
  });
});

describe('IssueValidator - Complete', () => {
  test('valid completion without message should pass', () => {
    const data = {};
    
    const result = IssueValidator.validateComplete(data);
    expect(result.valid).toBe(true);
  });

  test('valid completion with message should pass', () => {
    const data = {
      message: 'Issue fixed successfully'
    };
    
    const result = IssueValidator.validateComplete(data);
    expect(result.valid).toBe(true);
  });

  test('empty data should pass (all fields optional)', () => {
    const data = {};
    
    const result = IssueValidator.validateComplete(data);
    expect(result.valid).toBe(true);
  });
});

describe('IssueValidator - Reject', () => {
  test('valid rejection with reason should pass', () => {
    const data = {
      reason: 'Not a maintenance issue'
    };
    
    const result = IssueValidator.validateReject(data);
    expect(result.valid).toBe(true);
  });

  test('valid rejection without reason should pass', () => {
    const data = {};
    
    const result = IssueValidator.validateReject(data);
    expect(result.valid).toBe(true);
  });
});
