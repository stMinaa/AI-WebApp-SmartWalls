/**
 * User Validator Tests
 * RED Phase: Tests for user input validation (signup, login, profile)
 */

const UserValidator = require('../../validators/UserValidator');

describe('UserValidator - Signup', () => {
  test('valid signup data should pass', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    };

    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  const validBase = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'tenant'
  };

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

  test('invalid email format should fail', () => {
    const data = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    };

    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  test('short password should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    };

    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Password must be at least'))).toBe(true);
  });

  test('invalid role should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'superadmin'
    };

    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid role'))).toBe(true);
  });

  test('valid signup with mobile should pass', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant',
      mobile: '0641234567'
    };

    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(true);
  });

  test('invalid mobile format should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant',
      mobile: '123'
    };

    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Mobile'))).toBe(true);
  });
});

describe('UserValidator - Login', () => {
  test('valid login data should pass', () => {
    const data = {
      username: 'testuser',
      password: 'Test123!'
    };

    const result = UserValidator.validateLogin(data);
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
  test('valid profile update should pass', () => {
    const data = {
      firstName: 'Updated',
      lastName: 'Name',
      mobile: '0641234567'
    };

    const result = UserValidator.validateProfileUpdate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('empty data should pass (optional fields)', () => {
    const data = {};

    const result = UserValidator.validateProfileUpdate(data);
    expect(result.valid).toBe(true);
  });

  test('invalid mobile format should fail', () => {
    const data = {
      firstName: 'Updated',
      mobile: 'not-a-number'
    };

    const result = UserValidator.validateProfileUpdate(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Mobile'))).toBe(true);
  });

  test('valid update with only firstName should pass', () => {
    const data = {
      firstName: 'John'
    };

    const result = UserValidator.validateProfileUpdate(data);
    expect(result.valid).toBe(true);
  });

  test('valid update with company (for associates) should pass', () => {
    const data = {
      firstName: 'John',
      company: 'Tech Corp'
    };

    const result = UserValidator.validateProfileUpdate(data);
    expect(result.valid).toBe(true);
  });
});
