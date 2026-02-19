/* eslint-disable max-nested-callbacks */
'use strict';

const TestService = require('../../../src/application/service/TestService');

function makeRepo(overrides = {}) {
  return {
    findUserByUsername: jest.fn(),
    findFirstApartment: jest.fn(),
    findFirstTenant: jest.fn(),
    findFirstBuilding: jest.fn(),
    findFirstManager: jest.fn(),
    createIssue: jest.fn(),
    createNotice: jest.fn(),
    ...overrides
  };
}

describe('TestService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = makeRepo();
    service = new TestService(repo);
  });

  describe('getAuthenticatedUser', () => {
    it('returns user by username', async () => {
      const user = { username: 'testuser' };
      repo.findUserByUsername.mockResolvedValue(user);
      const result = await service.getAuthenticatedUser('testuser');
      expect(result).toBe(user);
    });
  });

  describe('seedIssues', () => {
    it('throws 400 when no apartment or tenant found', async () => {
      repo.findFirstApartment.mockResolvedValue(null);
      repo.findFirstTenant.mockResolvedValue(null);
      await expect(service.seedIssues()).rejects.toMatchObject({ status: 400 });
    });

    it('throws 400 when apartment found but no tenant', async () => {
      repo.findFirstApartment.mockResolvedValue({ _id: 'apt1' });
      repo.findFirstTenant.mockResolvedValue(null);
      await expect(service.seedIssues()).rejects.toMatchObject({ status: 400 });
    });

    it('creates 8 test issues and returns count', async () => {
      repo.findFirstApartment.mockResolvedValue({ _id: 'apt1' });
      repo.findFirstTenant.mockResolvedValue({ _id: 'tenant1' });
      repo.createIssue.mockResolvedValue({});

      const result = await service.seedIssues();
      expect(repo.createIssue).toHaveBeenCalledTimes(8);
      expect(result.count).toBe(8);
    });
  });

  describe('seedNotices', () => {
    it('throws 400 when no building or manager found', async () => {
      repo.findFirstBuilding.mockResolvedValue(null);
      repo.findFirstManager.mockResolvedValue(null);
      await expect(service.seedNotices()).rejects.toMatchObject({ status: 400 });
    });

    it('creates 7 test notices and returns count', async () => {
      repo.findFirstBuilding.mockResolvedValue({ _id: 'bld1' });
      repo.findFirstManager.mockResolvedValue({ _id: 'mgr1', username: 'mgr', role: 'manager' });
      repo.createNotice.mockResolvedValue({});

      const result = await service.seedNotices();
      expect(repo.createNotice).toHaveBeenCalledTimes(7);
      expect(result.count).toBe(7);
    });
  });
});
