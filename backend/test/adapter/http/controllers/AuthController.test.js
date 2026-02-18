/* eslint-disable max-nested-callbacks */

const AuthController = require('../../../../src/adapter/http/controllers/AuthController');
const ValidationError = require('../../../../src/domain/exception/ValidationError');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AuthController', () => {
  let controller;
  let mockService;

  beforeEach(() => {
    mockService = {
      signup: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      payDebt: jest.fn()
    };
    controller = new AuthController(mockService);
  });

  describe('signup', () => {
    it('returns 201 on successful signup', async () => {
      const req = {
        body: { username: 'newuser', email: 'new@test.com', password: 'Test123!' }
      };
      const res = mockRes();
      const serviceResult = { token: 'tok', user: { username: 'newuser' } };
      mockService.signup.mockResolvedValue(serviceResult);

      await controller.signup(req, res);

      expect(mockService.signup).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: serviceResult })
      );
    });

    it('handles conflict error (409)', async () => {
      const req = { body: {} };
      const res = mockRes();
      const err = new Error('Username or email already exists');
      err.status = 409;
      mockService.signup.mockRejectedValue(err);

      await controller.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('handles server error', async () => {
      const req = { body: {} };
      const res = mockRes();
      mockService.signup.mockRejectedValue(new Error('DB error'));

      await controller.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('returns 200 with token on success', async () => {
      const req = { body: { username: 'testuser', password: 'pass' } };
      const res = mockRes();
      const serviceResult = { token: 'tok', user: { username: 'testuser' } };
      mockService.login.mockResolvedValue(serviceResult);

      await controller.login(req, res);

      expect(mockService.login).toHaveBeenCalledWith('testuser', 'pass');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 401 on invalid credentials', async () => {
      const req = { body: { username: 'bad', password: 'wrong' } };
      const res = mockRes();
      const err = new Error('Invalid credentials');
      err.status = 401;
      mockService.login.mockRejectedValue(err);

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getProfile', () => {
    it('returns 200 with user data', async () => {
      const req = { user: { username: 'testuser' } };
      const res = mockRes();
      const user = { username: 'testuser', email: 'test@test.com' };
      mockService.getProfile.mockResolvedValue(user);

      await controller.getProfile(req, res);

      expect(mockService.getProfile).toHaveBeenCalledWith('testuser');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on server error', async () => {
      const req = { user: { username: 'testuser' } };
      const res = mockRes();
      mockService.getProfile.mockRejectedValue(new Error('DB fail'));

      await controller.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProfile', () => {
    it('returns 200 on successful update', async () => {
      const req = { user: { username: 'testuser' }, body: { firstName: 'New' } };
      const res = mockRes();
      const updated = { username: 'testuser', firstName: 'New' };
      mockService.updateProfile.mockResolvedValue(updated);

      await controller.updateProfile(req, res);

      expect(mockService.updateProfile).toHaveBeenCalledWith('testuser', { firstName: 'New' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when user not found', async () => {
      const req = { user: { username: 'ghost' }, body: {} };
      const res = mockRes();
      const err = new Error('User not found');
      err.status = 404;
      mockService.updateProfile.mockRejectedValue(err);

      await controller.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('payDebt', () => {
    it('returns 200 on successful payment', async () => {
      const req = { user: { username: 'tenant1' }, body: { amount: 500 } };
      const res = mockRes();
      const result = { user: {}, remainingDebt: 500 };
      mockService.payDebt.mockResolvedValue(result);

      await controller.payDebt(req, res);

      expect(mockService.payDebt).toHaveBeenCalledWith('tenant1', 500);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 on invalid payment amount', async () => {
      const req = { user: { username: 'tenant1' }, body: { amount: -1 } };
      const res = mockRes();
      mockService.payDebt.mockRejectedValue(new ValidationError('Invalid payment amount'));

      await controller.payDebt(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
