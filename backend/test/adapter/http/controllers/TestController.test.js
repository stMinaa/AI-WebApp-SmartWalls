/* eslint-disable max-nested-callbacks */
'use strict';

const TestController = require('../../../../src/adapter/http/controllers/TestController');

function makeService(overrides = {}) {
  return {
    getAuthenticatedUser: jest.fn(),
    seedIssues: jest.fn(),
    seedNotices: jest.fn(),
    ...overrides
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('TestController', () => {
  let service;
  let controller;

  beforeEach(() => {
    service = makeService();
    controller = new TestController(service);
  });

  describe('healthCheck', () => {
    it('returns 200 with health message', async () => {
      const res = makeRes();
      await controller.healthCheck({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getMe', () => {
    it('returns 200 with user', async () => {
      const user = { username: 'testuser' };
      service.getAuthenticatedUser.mockResolvedValue(user);
      const req = { user: { username: 'testuser' } };
      const res = makeRes();
      await controller.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on error', async () => {
      service.getAuthenticatedUser.mockRejectedValue(new Error('DB error'));
      const req = { user: { username: 'testuser' } };
      const res = makeRes();
      await controller.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('seedIssues', () => {
    it('returns 200 with count on success', async () => {
      service.seedIssues.mockResolvedValue({ count: 8 });
      const res = makeRes();
      await controller.seedIssues({ user: { username: 'dir' } }, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 on status 400 error', async () => {
      const err = new Error('Need apartment and tenant');
      err.status = 400;
      service.seedIssues.mockRejectedValue(err);
      const res = makeRes();
      await controller.seedIssues({ user: { username: 'dir' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on unexpected error', async () => {
      service.seedIssues.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      await controller.seedIssues({ user: { username: 'dir' } }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('seedNotices', () => {
    it('returns 200 with count on success', async () => {
      service.seedNotices.mockResolvedValue({ count: 7 });
      const res = makeRes();
      await controller.seedNotices({ user: { username: 'dir' } }, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 on status 400 error', async () => {
      const err = new Error('Need building and manager');
      err.status = 400;
      service.seedNotices.mockRejectedValue(err);
      const res = makeRes();
      await controller.seedNotices({ user: { username: 'dir' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
