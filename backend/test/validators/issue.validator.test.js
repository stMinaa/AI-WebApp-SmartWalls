/**
 * Issue Validator Tests
 * RED Phase: Tests for issue input validation (report, triage, assign, accept, complete)
 */

const IssueValidator = require('../../validators/IssueValidator');

const validReport = {
  title: 'Broken window',
  description: 'The window in the living room is broken',
  priority: 'high'
};

describe('IssueValidator - Report', () => {
  test.each([
    [validReport],
    [{ title: 'Broken window', description: 'The window in the living room is broken' }]
  ])('valid issue report should pass', (data) => {
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(true);
  });

  test.each([
    [{ description: 'The window is broken', priority: 'high' }, 'Title is required'],
    [{ title: '   ', description: 'The window is broken', priority: 'high' }, 'Title is required'],
    [{ title: 'Broken window', priority: 'high' }, 'Description is required'],
    [{ title: 'Broken window', description: '   ', priority: 'high' }, 'Description is required']
  ])('required field validation fails', (data, expectedError) => {
    const result = IssueValidator.validateReport(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });

  test('invalid priority should fail', () => {
    const result = IssueValidator.validateReport({ ...validReport, priority: 'super-urgent' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid priority'))).toBe(true);
  });

  test.each(['low', 'medium', 'high', 'critical'])('valid priority %s should pass', (priority) => {
    const result = IssueValidator.validateReport({ title: 'T', description: 'D', priority });
    expect(result.valid).toBe(true);
  });
});

describe('IssueValidator - Triage', () => {
  test.each([
    [{ action: 'forward' }],
    [{ action: 'reject' }],
    [{ action: 'assign', assignedTo: 'associate1' }]
  ])('valid triage action should pass', (data) => {
    const result = IssueValidator.validateTriage(data);
    expect(result.valid).toBe(true);
  });

  test('missing action should fail', () => {
    const result = IssueValidator.validateTriage({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Action is required');
  });

  test('invalid action should fail', () => {
    const result = IssueValidator.validateTriage({ action: 'delete' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid action'))).toBe(true);
  });

  test.each([[{ action: 'assign' }], [{ action: 'assign', assignedTo: '   ' }]])(
    'assign action without valid assignedTo should fail',
    (data) => {
      const result = IssueValidator.validateTriage(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Associate username is required for assign action');
    }
  );
});

describe('IssueValidator - Assign (Director)', () => {
  test.each([[{ action: 'assign', assignedTo: 'associate1' }], [{ action: 'reject' }]])(
    'valid assign action should pass',
    (data) => {
      const result = IssueValidator.validateAssign(data);
      expect(result.valid).toBe(true);
    }
  );

  test('missing action should fail', () => {
    const result = IssueValidator.validateAssign({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Action is required');
  });

  test('invalid action should fail', () => {
    const result = IssueValidator.validateAssign({ action: 'cancel' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid action'))).toBe(true);
  });

  test('assign action without assignedTo should fail', () => {
    const result = IssueValidator.validateAssign({ action: 'assign' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Associate username is required for assign action');
  });
});

describe('IssueValidator - Accept', () => {
  test.each([[{}], [{ message: 'I will start working on this tomorrow' }]])(
    'valid acceptance should pass',
    (data) => {
      const result = IssueValidator.validateAccept(data);
      expect(result.valid).toBe(true);
    }
  );
});

describe('IssueValidator - Complete', () => {
  test.each([[{}], [{ message: 'Issue fixed successfully' }]])(
    'valid completion should pass',
    (data) => {
      const result = IssueValidator.validateComplete(data);
      expect(result.valid).toBe(true);
    }
  );
});

describe('IssueValidator - Reject', () => {
  test.each([[{ reason: 'Not a maintenance issue' }], [{}]])(
    'valid rejection should pass',
    (data) => {
      const result = IssueValidator.validateReject(data);
      expect(result.valid).toBe(true);
    }
  );
});
