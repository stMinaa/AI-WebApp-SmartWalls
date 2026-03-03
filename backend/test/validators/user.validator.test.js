/**
 * User Validator Tests
 * RED Phase: Tests for user input validation (signup, login, profile)
 */

const UserValidator = require('../../validators/UserValidator');

const validBase = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'tenant'
};

describe('UserValidator - Signup', () => {
  test.each([[validBase], [{ ...validBase, mobile: '0641234567' }]])(
    'valid signup data should pass',
    (data) => {
      const result = UserValidator.validateSignup(data);
      expect(result.valid).toBe(true);
    }
  );

  test.each([
    ['username', 'Username is required'],
    ['email', 'Email is required'],
    ['password', 'Password is required'],
    ['firstName', 'First name is required'],
    ['lastName', 'Last name is required'],
    ['role', 'Role is required']
  ])('missing %s should fail', (field, expectedError) => {
    const { [field]: _omit, ...data } = validBase;
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });

  test.each([
    [{ ...validBase, email: 'invalid-email' }, 'Invalid email format'],
    [{ ...validBase, password: '123' }, 'Password must be at least'],
    [{ ...validBase, role: 'superadmin' }, 'Invalid role'],
    [{ ...validBase, mobile: '123' }, 'Mobile']
  ])('invalid field value should fail', (data, errorFragment) => {
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes(errorFragment))).toBe(true);
  });
});

describe('UserValidator - Login', () => {
  test('valid login data should pass', () => {
    const result = UserValidator.validateLogin({ username: 'testuser', password: 'Test123!' });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test.each([
    [{ password: 'Test123!' }, 'Username/Email is required'],
    [{ username: '   ', password: 'Test123!' }, 'Username/Email is required'],
    [{ username: 'testuser' }, 'Password is required'],
    [{ username: 'testuser', password: '   ' }, 'Password is required']
  ])('invalid login data should fail', (data, expectedError) => {
    const result = UserValidator.validateLogin(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });
});

describe('UserValidator - Profile Update', () => {
  test.each([
    [{ firstName: 'Updated', lastName: 'Name', mobile: '0641234567' }],
    [{}],
    [{ firstName: 'John' }],
    [{ firstName: 'John', company: 'Tech Corp' }]
  ])('valid profile update should pass', (data) => {
    const result = UserValidator.validateProfileUpdate(data);
    expect(result.valid).toBe(true);
  });

  test('invalid mobile format should fail', () => {
    const result = UserValidator.validateProfileUpdate({
      firstName: 'Updated',
      mobile: 'not-a-number'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Mobile'))).toBe(true);
  });
});
