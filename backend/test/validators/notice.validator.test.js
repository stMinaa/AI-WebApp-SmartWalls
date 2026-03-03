/**
 * Notice Validator Tests
 * RED Phase: Tests for notice/poll input validation
 */

const NoticeValidator = require('../../validators/NoticeValidator');

describe('NoticeValidator - Create Notice', () => {
  test.each([
    [{ title: 'Building maintenance', content: 'The building will undergo maintenance next week' }],
    [{ title: 'T', content: 'C' }]
  ])('valid notice data should pass', (data) => {
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(true);
  });

  test.each([
    [{ content: 'The building will undergo maintenance next week' }, 'Title is required'],
    [
      { title: '   ', content: 'The building will undergo maintenance next week' },
      'Title is required'
    ],
    [{ title: 'Building maintenance' }, 'Content is required'],
    [{ title: 'Building maintenance', content: '   ' }, 'Content is required']
  ])('invalid notice data should fail', (data, expectedError) => {
    const result = NoticeValidator.validateCreate(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });
});

const validPollBase = {
  title: 'Should we repaint the building?',
  content: 'Vote on whether we should repaint the building facade',
  options: ['Yes', 'No', 'Maybe later']
};

describe('NoticeValidator - Create Poll', () => {
  test.each([
    [validPollBase],
    [
      {
        title: 'Choose paint color',
        content: 'Which color?',
        options: ['White', 'Beige', 'Gray', 'Blue', 'Green']
      }
    ]
  ])('valid poll data should pass', (data) => {
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(true);
  });

  test.each([
    [{ ...validPollBase, title: undefined }, 'Title is required'],
    [{ ...validPollBase, content: undefined }, 'Content is required'],
    [{ ...validPollBase, options: undefined }, 'Options are required'],
    [{ ...validPollBase, options: 'Yes, No' }, 'Options must be an array'],
    [{ ...validPollBase, options: ['Yes'] }, 'At least 2 options are required'],
    [{ ...validPollBase, options: [] }, 'At least 2 options are required']
  ])('invalid poll data should fail', (data, expectedError) => {
    const result = NoticeValidator.validatePoll(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });

  test('options with empty strings should fail', () => {
    const result = NoticeValidator.validatePoll({
      ...validPollBase,
      options: ['Yes', '   ', 'No']
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Option #2 cannot be empty'))).toBe(true);
  });
});

describe('NoticeValidator - Vote', () => {
  test.each([[{ optionIndex: 0 }], [{ optionIndex: 5 }]])('valid vote should pass', (data) => {
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(true);
  });

  test.each([
    [{}, 'Option index is required'],
    [{ optionIndex: 'first' }, 'Option index must be a number'],
    [{ optionIndex: -1 }, 'Option index must be non-negative']
  ])('invalid vote should fail', (data, expectedError) => {
    const result = NoticeValidator.validateVote(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });
});
