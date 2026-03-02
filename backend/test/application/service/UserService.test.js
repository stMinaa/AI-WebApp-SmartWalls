const {
  UserService,
  AuthorizationError,
  ValidationError,
  createMockRepo,
  makeUser
} = require('./userServiceTestHelpers');

describe('UserService - User Management', () => {
  let service;
  let repo;

  beforeEach(() => {
    repo = createMockRepo();
    service = new UserService(repo);
  });

  describe('updateDebt', () => {
    it('updates debt for valid request', async () => {
      const currentUser = makeUser({ role: 'manager' });
      const targetUser = makeUser({ _id: 'target1', username: 'target' });
      repo.findByUsername.mockResolvedValue(currentUser);
      repo.findById.mockResolvedValue(targetUser);
      repo.save.mockResolvedValue(targetUser);

      const result = await service.updateDebt('testuser', 'target1', { debt: 500, reason: 'rent' });

      expect(result.user).toBe(targetUser);
      expect(result.reason).toBe('rent');
      expect(targetUser.debt).toBe(500);
      expect(repo.save).toHaveBeenCalledWith(targetUser);
    });

    it('throws AuthorizationError for tenant', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'tenant' }));
      await expect(service.updateDebt('testuser', 'target1', { debt: 100 })).rejects.toThrow(
        AuthorizationError
      );
    });

    it('throws ValidationError for negative debt', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(makeUser());
      await expect(service.updateDebt('testuser', 'target1', { debt: -1 })).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for undefined debt', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(makeUser());
      await expect(service.updateDebt('testuser', 'target1', {})).rejects.toThrow(ValidationError);
    });
  });

  describe('listPendingUsers', () => {
    it('returns all pending for director', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findPending.mockResolvedValue([{ username: 'pending1' }]);
      const result = await service.listPendingUsers('director');
      expect(repo.findPending).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it('scopes to buildings for manager', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findBuildingsByManager.mockResolvedValue([{ _id: 'b1' }, { _id: 'b2' }]);
      repo.findPending.mockResolvedValue([]);
      await service.listPendingUsers('testuser');
      expect(repo.findBuildingsByManager).toHaveBeenCalledWith('user123');
      expect(repo.findPending).toHaveBeenCalledWith(['b1', 'b2']);
    });

    it('throws AuthorizationError for tenant', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'tenant' }));
      await expect(service.listPendingUsers('testuser')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('listUsers', () => {
    it('returns filtered users for director', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findWithFilters.mockResolvedValue([]);
      await service.listUsers('director', { role: 'tenant', status: 'active' });
      expect(repo.findWithFilters).toHaveBeenCalled();
    });

    it('excludes test users by default', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findWithFilters.mockResolvedValue([]);
      await service.listUsers('director', {});
      const filter = repo.findWithFilters.mock.calls[0][0];
      expect(filter.$and).toBeDefined();
    });

    it('includes test users when requested', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findWithFilters.mockResolvedValue([]);
      await service.listUsers('director', { includeTest: 'true' });
      const filter = repo.findWithFilters.mock.calls[0][0];
      expect(filter.$and).toBeUndefined();
    });

    it('adds buildingCount for managers', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      const mockManager = { _id: 'm1', toObject: () => ({ _id: 'm1', role: 'manager' }) };
      repo.findWithFilters.mockResolvedValue([mockManager]);
      repo.countBuildingsByManager.mockResolvedValue(3);
      const result = await service.listUsers('director', { role: 'manager' });
      expect(result[0].buildingCount).toBe(3);
    });

    it('throws AuthorizationError for non-director', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.listUsers('manager', {})).rejects.toThrow(AuthorizationError);
    });
  });

  describe('approveUser', () => {
    it('approves user via updateOne bypass', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findById.mockResolvedValue(makeUser({ _id: 't1', status: 'pending', role: 'manager' }));
      repo.updateStatus.mockResolvedValue({});
      const result = await service.approveUser('director', 't1');
      expect(repo.updateStatus).toHaveBeenCalledWith('t1', 'active');
      expect(result.user.status).toBe('active');
    });

    it('throws ValidationError if already active', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findById.mockResolvedValue(makeUser({ status: 'active' }));
      await expect(service.approveUser('director', 'user123')).rejects.toThrow(ValidationError);
    });

    it('manager can approve tenant in their building', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(
        makeUser({ _id: 't1', role: 'tenant', status: 'pending', building: 'b1' })
      );
      repo.findBuildingsByManager.mockResolvedValue([{ _id: 'b1' }]);
      repo.updateStatus.mockResolvedValue({});
      await service.approveUser('testuser', 't1');
      expect(repo.updateStatus).toHaveBeenCalled();
    });

    it('manager cannot approve tenant in other building', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(
        makeUser({ _id: 't1', role: 'tenant', status: 'pending', building: 'b2' })
      );
      repo.findBuildingsByManager.mockResolvedValue([{ _id: 'b1' }]);
      await expect(service.approveUser('testuser', 't1')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('deleteUser', () => {
    it('deletes user and clears manager buildings', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director', username: 'director' }));
      repo.findById.mockResolvedValue(
        makeUser({ _id: 'del1', username: 'target', role: 'manager' })
      );
      repo.clearManagerFromBuildings.mockResolvedValue({});
      repo.deleteById.mockResolvedValue({});
      await service.deleteUser('director', 'del1');
      expect(repo.clearManagerFromBuildings).toHaveBeenCalledWith('del1');
      expect(repo.deleteById).toHaveBeenCalledWith('del1');
    });

    it('throws ValidationError when deleting yourself', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director', username: 'same' }));
      repo.findById.mockResolvedValue(makeUser({ username: 'same' }));
      await expect(service.deleteUser('same', 'user123')).rejects.toThrow(ValidationError);
    });

    it('throws AuthorizationError for non-director', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.deleteUser('manager', 'id')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('bulkDeleteTestUsers', () => {
    it('deletes test users and clears manager buildings', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      repo.findTestUsers.mockResolvedValue([
        { _id: 'm1', role: 'manager' },
        { _id: 't1', role: 'tenant' }
      ]);
      repo.clearManagerFromBuildings.mockResolvedValue({});
      repo.deleteMany.mockResolvedValue({ deletedCount: 2 });
      const result = await service.bulkDeleteTestUsers('director');
      expect(repo.clearManagerFromBuildings).toHaveBeenCalledWith(['m1']);
      expect(result.deletedCount).toBe(2);
    });

    it('throws AuthorizationError for non-director', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.bulkDeleteTestUsers('manager')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('listAssociateJobs', () => {
    it('returns jobs for associate', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'associate' }));
      repo.findAssociateJobs.mockResolvedValue([{ title: 'Fix pipe' }]);
      const result = await service.listAssociateJobs('assoc', { status: 'assigned' });
      expect(repo.findAssociateJobs).toHaveBeenCalledWith('user123', { status: 'assigned' });
      expect(result).toHaveLength(1);
    });

    it('throws AuthorizationError for non-associate', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.listAssociateJobs('manager', {})).rejects.toThrow(AuthorizationError);
    });
  });

  describe('listAssociates', () => {
    it('returns associates for manager', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findAssociates.mockResolvedValue([{ username: 'assoc1' }]);
      const result = await service.listAssociates('manager');
      expect(result).toHaveLength(1);
    });

    it('throws AuthorizationError for associate', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'associate' }));
      await expect(service.listAssociates('assoc')).rejects.toThrow(AuthorizationError);
    });
  });
});
