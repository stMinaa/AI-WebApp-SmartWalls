/**
 * Notice Validator Tests
 * RED Phase: Tests for notice/poll input validation
 */

const NoticeValidator = require('../../validators/NoticeValidator');

describe('NoticeValidator - Create Notice', () => {
  test('valid notice data should pass', () => {
    const data = {
      title: 'Building maintenance',
      content: 'The building will undergo maintenance next week'
    };
    
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing title should fail', () => {
    const data = {
      content: 'The building will undergo maintenance next week'
    };
    
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  test('empty title should fail', () => {
    const data = {
      title: '   ',
      content: 'The building will undergo maintenance next week'
    };
    
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  test('missing content should fail', () => {
    const data = {
      title: 'Building maintenance'
    };
    
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Content is required');
  });

  test('empty content should fail', () => {
    const data = {
      title: 'Building maintenance',
      content: '   '
    };
    
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Content is required');
  });
});

describe('NoticeValidator - Create Poll', () => {
  test('valid poll data should pass', () => {
    const data = {
      title: 'Should we repaint the building?',
      content: 'Vote on whether we should repaint the building facade',
      options: ['Yes', 'No', 'Maybe later']
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing title should fail', () => {
    const data = {
      content: 'Vote on whether we should repaint the building facade',
      options: ['Yes', 'No']
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  test('missing content should fail', () => {
    const data = {
      title: 'Should we repaint the building?',
      options: ['Yes', 'No']
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Content is required');
  });

  test('missing options should fail', () => {
    const data = {
      title: 'Should we repaint the building?',
      content: 'Vote on whether we should repaint the building facade'
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Options are required');
  });

  test('non-array options should fail', () => {
    const data = {
      title: 'Should we repaint the building?',
      content: 'Vote on whether we should repaint the building facade',
      options: 'Yes, No'
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Options must be an array');
  });

  test('less than 2 options should fail', () => {
    const data = {
      title: 'Should we repaint the building?',
      content: 'Vote on whether we should repaint the building facade',
      options: ['Yes']
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 2 options are required');
  });

  test('empty options array should fail', () => {
    const data = {
      title: 'Should we repaint the building?',
      content: 'Vote on whether we should repaint the building facade',
      options: []
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 2 options are required');
  });

  test('options with empty strings should fail', () => {
    const data = {
      title: 'Should we repaint the building?',
      content: 'Vote on whether we should repaint the building facade',
      options: ['Yes', '   ', 'No']
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Option #2 cannot be empty'))).toBe(true);
  });

  test('valid poll with many options should pass', () => {
    const data = {
      title: 'Choose paint color',
      content: 'Which color should we use?',
      options: ['White', 'Beige', 'Gray', 'Blue', 'Green']
    };
    
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(true);
  });
});

describe('NoticeValidator - Vote', () => {
  test('valid vote should pass', () => {
    const data = {
      optionIndex: 0
    };
    
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('missing optionIndex should fail', () => {
    const data = {};
    
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Option index is required');
  });

  test('invalid optionIndex type should fail', () => {
    const data = {
      optionIndex: 'first'
    };
    
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Option index must be a number');
  });

  test('negative optionIndex should fail', () => {
    const data = {
      optionIndex: -1
    };
    
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Option index must be non-negative');
  });

  test('valid optionIndex 0 should pass', () => {
    const data = {
      optionIndex: 0
    };
    
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(true);
  });

  test('valid optionIndex 5 should pass', () => {
    const data = {
      optionIndex: 5
    };
    
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(true);
  });
});
