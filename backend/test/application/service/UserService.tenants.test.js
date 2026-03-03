const {
  TenantService,
  AuthorizationError,
  ValidationError,
  createMockRepo,
  makeUser
} = require('./userServiceTestHelpers');

describe('TenantService - Tenant Operations', () => {
  let service;
  let repo;

  beforeEach(() => {
    repo = createMockRepo();
    service = new TenantService(repo);
  });

  describe('deleteTenant', () => {
    it('deletes tenant and frees apartment', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(makeUser({ _id: 't1', apartment: 'apt1' }));
      repo.updateApartmentTenant.mockResolvedValue({});
      repo.deleteById.mockResolvedValue({});
      await service.deleteTenant('manager', 't1');
      expect(repo.updateApartmentTenant).toHaveBeenCalledWith('apt1', null, 0);
      expect(repo.deleteById).toHaveBeenCalledWith('t1');
    });

    it('throws ValidationError if tenant not found', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(null);
      await expect(service.deleteTenant('manager', 't1')).rejects.toThrow(ValidationError);
    });

    it('throws AuthorizationError for tenant role', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'tenant' }));
      await expect(service.deleteTenant('tenant', 't1')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('approveTenant', () => {
    it('approves tenant via save', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      const tenant = makeUser({ _id: 't1', role: 'tenant', status: 'pending' });
      repo.findById.mockResolvedValue(tenant);
      repo.save.mockResolvedValue(tenant);
      const result = await service.approveTenant('manager', 't1');
      expect(tenant.status).toBe('active');
      expect(repo.save).toHaveBeenCalledWith(tenant);
      expect(result.tenant).toBe(tenant);
    });

    it('throws AuthorizationError for non-manager', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'director' }));
      await expect(service.approveTenant('director', 't1')).rejects.toThrow(AuthorizationError);
    });

    it('throws ValidationError if not a tenant', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      repo.findById.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.approveTenant('manager', 't1')).rejects.toThrow(ValidationError);
    });
  });

  describe('assignTenant', () => {
    function _setupAssign(tenantOverrides = {}) {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      const tenant = makeUser({ _id: 't1', role: 'tenant', ...tenantOverrides });
      repo.findById.mockResolvedValue(tenant);
      const apartment = { _id: 'apt1', tenant: null, save: jest.fn() };
      repo.findApartmentById.mockResolvedValue(apartment);
      repo.save.mockResolvedValue(tenant);
      return { tenant, apartment };
    }

    it('assigns tenant to apartment', async () => {
      const { tenant, apartment } = _setupAssign();

      await service.assignTenant('manager', 't1', {
        apartmentId: 'apt1',
        buildingId: 'b1',
        numPeople: 3
      });

      expect(tenant.apartment).toBe('apt1');
      expect(tenant.building).toBe('b1');
      expect(apartment.tenant).toBe('t1');
      expect(apartment.numPeople).toBe(3);
    });

    it('throws ValidationError if missing fields', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.assignTenant('manager', 't1', { apartmentId: 'a1' })).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError if apartment occupied by another', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      const tenant = makeUser({ _id: 't1', role: 'tenant' });
      repo.findById.mockResolvedValue(tenant);
      const apartment = { _id: 'apt1', tenant: { toString: () => 'other-tenant' } };
      repo.findApartmentById.mockResolvedValue(apartment);

      await expect(
        service.assignTenant('manager', 't1', { apartmentId: 'apt1', buildingId: 'b1' })
      ).rejects.toThrow(ValidationError);
    });

    it('frees old apartment when reassigning', async () => {
      repo.updateApartmentTenant.mockResolvedValue({});
      _setupAssign({ apartment: 'old-apt' });

      await service.assignTenant('manager', 't1', {
        apartmentId: 'apt1',
        buildingId: 'b1',
        numPeople: 2
      });

      expect(repo.updateApartmentTenant).toHaveBeenCalledWith('old-apt', null, 0);
    });
  });

  describe('getMyApartment', () => {
    it('returns apartment and building info', async () => {
      const tenant = makeUser({ role: 'tenant', apartment: 'apt1' });
      repo.findByUsername.mockResolvedValue(tenant);
      const apartment = {
        _id: 'apt1',
        unitNumber: '101',
        address: 'St',
        numPeople: 2,
        floor: 3,
        building: 'b1'
      };
      repo.findApartmentWithBuilding.mockResolvedValue(apartment);
      repo.findBuildingWithManagerAndCount.mockResolvedValue({
        _id: 'b1',
        name: 'B',
        apartmentCount: 5
      });
      const result = await service.getMyApartment('tenant');
      expect(result.apartment._id).toBe('apt1');
      expect(result.building).toBeDefined();
    });

    it('throws AuthorizationError for non-tenant', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'manager' }));
      await expect(service.getMyApartment('manager')).rejects.toThrow(AuthorizationError);
    });

    it('throws ValidationError if no apartment assigned', async () => {
      repo.findByUsername.mockResolvedValue(makeUser({ role: 'tenant', apartment: null }));
      await expect(service.getMyApartment('tenant')).rejects.toThrow(ValidationError);
    });
  });
});
