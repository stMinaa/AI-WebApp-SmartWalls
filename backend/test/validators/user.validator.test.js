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

  test('missing username should fail', () => {
    const data = {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    };
    
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Username is required');
  });

  test('missing email should fail', () => {
    const data = {
      username: 'testuser',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    };
    
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
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

  test('missing password should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'tenant'
    };
    
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
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
    expect(result.errors.some(e => e.includes('Password must be at least'))).toBe(true);
  });

  test('missing firstName should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      lastName: 'User',
      role: 'tenant'
    };
    
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('First name is required');
  });

  test('missing lastName should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      role: 'tenant'
    };
    
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Last name is required');
  });

  test('missing role should fail', () => {
    const data = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const result = UserValidator.validateSignup(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Role is required');
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
    expect(result.errors.some(e => e.includes('Invalid role'))).toBe(true);
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
    expect(result.errors.some(e => e.includes('Mobile'))).toBe(true);
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

  test('missing username should fail', () => {
    const data = {
      password: 'Test123!'
    };
    
    const result = UserValidator.validateLogin(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Username/Email is required');
  });

  test('missing password should fail', () => {
    const data = {
      username: 'testuser'
    };
    
    const result = UserValidator.validateLogin(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  test('empty username should fail', () => {
    const data = {
      username: '   ',
      password: 'Test123!'
    };
    
    const result = UserValidator.validateLogin(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Username/Email is required');
  });

  test('empty password should fail', () => {
    const data = {
      username: 'testuser',
      password: '   '
    };
    
    const result = UserValidator.validateLogin(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
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
    expect(result.errors.some(e => e.includes('Mobile'))).toBe(true);
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
