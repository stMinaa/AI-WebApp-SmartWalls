/* eslint-disable max-nested-callbacks */

const AuthApplicationService = require('../../../src/application/service/AuthApplicationService');
const ValidationError = require('../../../src/domain/exception/ValidationError');

describe('AuthApplicationService', () => {
  let service;
  let mockAuthRepo;
  let mockAuthService;

  beforeEach(() => {
    mockAuthRepo = {
      findByUsernameOrEmail: jest.fn(),
      existsByUsernameOrEmail: jest.fn(),
      findByUsernameExcludePassword: jest.fn(),
      findByUsername: jest.fn(),
      createUser: jest.fn(),
      save: jest.fn()
    };
    mockAuthService = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
      generateToken: jest.fn()
    };
    service = new AuthApplicationService(mockAuthRepo, mockAuthService);
  });

  describe('signup', () => {
    const signupData = {
      username: 'newuser',
      email: 'new@test.com',
      password: 'Test123!',
      firstName: 'New',
      lastName: 'User',
      role: 'tenant'
    };

    it('creates user and returns token on successful signup', async () => {
      mockAuthRepo.existsByUsernameOrEmail.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashedpass');
      const savedUser = {
        _id: { toString: () => 'user123' },
        username: 'newuser',
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'tenant',
        status: 'pending'
      };
      mockAuthRepo.createUser.mockResolvedValue(savedUser);
      mockAuthService.generateToken.mockReturnValue('token123');

      const result = await service.signup(signupData);

      expect(mockAuthRepo.existsByUsernameOrEmail).toHaveBeenCalledWith('newuser', 'new@test.com');
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('Test123!');
      expect(result.token).toBe('token123');
      expect(result.user.username).toBe('newuser');
    });

    it('throws conflict error when user already exists', async () => {
      mockAuthRepo.existsByUsernameOrEmail.mockResolvedValue({ username: 'existing' });

      await expect(service.signup(signupData)).rejects.toThrow('Username or email already exists');
    });

    it('sets director status to active', async () => {
      mockAuthRepo.existsByUsernameOrEmail.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashedpass');
      const savedUser = {
        _id: { toString: () => 'user123' },
        username: 'director1',
        email: 'dir@test.com',
        firstName: 'Dir',
        lastName: 'Ector',
        role: 'director',
        status: 'active'
      };
      mockAuthRepo.createUser.mockResolvedValue(savedUser);
      mockAuthService.generateToken.mockReturnValue('token123');

      await service.signup({ ...signupData, role: 'director', username: 'director1' });

      const createCall = mockAuthRepo.createUser.mock.calls[0][0];
      expect(createCall.status).toBe('active');
    });

    it('sets non-director status to pending', async () => {
      mockAuthRepo.existsByUsernameOrEmail.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashedpass');
      const savedUser = {
        _id: { toString: () => 'user123' },
        username: 'newuser',
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'tenant',
        status: 'pending'
      };
      mockAuthRepo.createUser.mockResolvedValue(savedUser);
      mockAuthService.generateToken.mockReturnValue('token123');

      await service.signup(signupData);

      const createCall = mockAuthRepo.createUser.mock.calls[0][0];
      expect(createCall.status).toBe('pending');
    });
  });

  describe('login', () => {
    it('returns token and user on valid login', async () => {
      const user = {
        _id: { toString: () => 'user123' },
        username: 'testuser',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'tenant',
        status: 'active',
        password: 'hashedpass'
      };
      mockAuthRepo.findByUsernameOrEmail.mockResolvedValue(user);
      mockAuthService.verifyPassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockReturnValue('token456');

      const result = await service.login('testuser', 'Test123!');

      expect(result.token).toBe('token456');
      expect(result.user.username).toBe('testuser');
      expect(result.user.role).toBe('tenant');
    });

    it('throws on invalid username', async () => {
      mockAuthRepo.findByUsernameOrEmail.mockResolvedValue(null);

      await expect(service.login('nouser', 'pass')).rejects.toThrow('Invalid credentials');
    });

    it('throws on invalid password', async () => {
      mockAuthRepo.findByUsernameOrEmail.mockResolvedValue({
        password: 'hashedpass'
      });
      mockAuthService.verifyPassword.mockResolvedValue(false);

      await expect(service.login('testuser', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getProfile', () => {
    it('returns user without password', async () => {
      const user = { username: 'testuser', email: 'test@test.com', role: 'tenant' };
      mockAuthRepo.findByUsernameExcludePassword.mockResolvedValue(user);

      const result = await service.getProfile('testuser');

      expect(result).toEqual(user);
      expect(mockAuthRepo.findByUsernameExcludePassword).toHaveBeenCalledWith('testuser');
    });

    it('throws when user not found', async () => {
      mockAuthRepo.findByUsernameExcludePassword.mockResolvedValue(null);

      await expect(service.getProfile('nouser')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('updates allowed fields', async () => {
      const user = {
        username: 'testuser',
        role: 'manager',
        firstName: 'Old',
        lastName: 'Name',
        save: jest.fn()
      };
      mockAuthRepo.findByUsername.mockResolvedValue(user);
      const updatedUser = { username: 'testuser', firstName: 'New', lastName: 'Last' };
      mockAuthRepo.findByUsernameExcludePassword.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('testuser', {
        firstName: 'New',
        lastName: 'Last'
      });

      expect(user.firstName).toBe('New');
      expect(user.lastName).toBe('Last');
      expect(mockAuthRepo.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(updatedUser);
    });

    it('ignores company field for tenants', async () => {
      const user = {
        username: 'tenant1',
        role: 'tenant',
        save: jest.fn()
      };
      mockAuthRepo.findByUsername.mockResolvedValue(user);
      mockAuthRepo.findByUsernameExcludePassword.mockResolvedValue(user);

      await service.updateProfile('tenant1', { company: 'ShouldNotSet' });

      expect(user.company).toBeUndefined();
    });

    it('allows company field for non-tenants', async () => {
      const user = {
        username: 'manager1',
        role: 'manager',
        save: jest.fn()
      };
      mockAuthRepo.findByUsername.mockResolvedValue(user);
      mockAuthRepo.findByUsernameExcludePassword.mockResolvedValue(user);

      await service.updateProfile('manager1', { company: 'MyCompany' });

      expect(user.company).toBe('MyCompany');
    });

    it('throws when user not found', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(null);

      await expect(service.updateProfile('nouser', {})).rejects.toThrow('User not found');
    });
  });

  describe('payDebt', () => {
    it('reduces debt by payment amount', async () => {
      const user = { username: 'tenant1', debt: 1000, save: jest.fn() };
      mockAuthRepo.findByUsername.mockResolvedValue(user);
      const updatedUser = { username: 'tenant1', debt: 500 };
      mockAuthRepo.findByUsernameExcludePassword.mockResolvedValue(updatedUser);

      const result = await service.payDebt('tenant1', 500);

      expect(user.debt).toBe(500);
      expect(mockAuthRepo.save).toHaveBeenCalledWith(user);
      expect(result.remainingDebt).toBe(500);
    });

    it('throws ValidationError for zero amount', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ debt: 1000 });

      await expect(service.payDebt('tenant1', 0)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for negative amount', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ debt: 1000 });

      await expect(service.payDebt('tenant1', -50)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when amount exceeds debt', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue({ debt: 100 });

      await expect(service.payDebt('tenant1', 200)).rejects.toThrow(ValidationError);
    });

    it('throws when user not found', async () => {
      mockAuthRepo.findByUsername.mockResolvedValue(null);

      await expect(service.payDebt('nouser', 100)).rejects.toThrow('User not found');
    });
  });
});
