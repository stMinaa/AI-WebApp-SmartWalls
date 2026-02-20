const _mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const {
  cleanCollections,
  createDirector,
  createManager,
  createTenant,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant
} = require('../helpers');
const { getData, getErrorMessage } = require('../helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('../setup');

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

describe('Phase 3.1: Tenant Views Apartment & Building Info', () => {
  let tenantToken, tenant2Token, managerToken, directorToken;
  let tenantId, _tenant2Id;
  let buildingId, apartmentId, _apartment2Id;

  beforeEach(async () => {
    await cleanCollections();

    const director = await createDirector({
      username: 'director1',
      email: 'director1@example.com',
      password: 'password123'
    });
    directorToken = director.token;

    const manager = await createManager(directorToken, {
      username: 'manager1',
      email: 'manager1@example.com',
      password: 'password123',
      firstName: 'Manager',
      lastName: 'One'
    });
    managerToken = manager.token;

    buildingId = await createBuilding(directorToken, {
      name: 'Test Building',
      address: '123 Main St'
    });
    await assignManager(directorToken, buildingId, manager._id);

    apartmentId = await createApartment(managerToken, buildingId, '101', {
      address: '123 Main St, Unit 101'
    });
    _apartment2Id = await createApartment(managerToken, buildingId, '102', {
      address: '123 Main St, Unit 102'
    });

    const tenant1 = await createTenant({
      username: 'tenant1',
      email: 'tenant1@example.com',
      password: 'password123',
      firstName: 'Tenant',
      lastName: 'One'
    });
    tenantId = tenant1._id;
    tenantToken = tenant1.token;

    const tenant2 = await createTenant({
      username: 'tenant2',
      email: 'tenant2@example.com',
      password: 'password123',
      firstName: 'Tenant',
      lastName: 'Two'
    });
    _tenant2Id = tenant2._id;
    tenant2Token = tenant2.token;

    await assignTenant(managerToken, { tenantId, apartmentId, buildingId, numPeople: 3 });
  });

  describe('GET /api/tenants/me/apartment', () => {
    it('should return apartment and building info for assigned tenant', async () => {
      const res = await request(app)
        .get('/api/tenants/me/apartment')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      const data = getData(res);
      expect(data.apartment).toBeDefined();
      expect(data.apartment.unitNumber).toBe('101');
      expect(data.apartment.address).toBe('123 Main St, Unit 101');
      expect(data.apartment.numPeople).toBe(3);

      expect(data.building).toBeDefined();
      expect(data.building.name).toBe('Test Building');
      expect(data.building.address).toBe('123 Main St');

      expect(data.building.manager).toBeDefined();
      expect(data.building.manager.firstName).toBe('Manager');
      expect(data.building.manager.lastName).toBe('One');
    });

    it('should return 404 if tenant not assigned to any apartment', async () => {
      const res = await request(app)
        .get('/api/tenants/me/apartment')
        .set('Authorization', `Bearer ${tenant2Token}`);

      expect(res.status).toBe(404);
      expect(getErrorMessage(res)).toContain('not assigned');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/tenants/me/apartment');

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not a tenant', async () => {
      const res = await request(app)
        .get('/api/tenants/me/apartment')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(getErrorMessage(res)).toContain('Only tenants');
    });

    it('should include apartment count in building info', async () => {
      const res = await request(app)
        .get('/api/tenants/me/apartment')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      const data = getData(res);
      expect(data.building.apartmentCount).toBeDefined();
      expect(data.building.apartmentCount).toBeGreaterThan(0);
    });

    it('should not expose sensitive manager information', async () => {
      const res = await request(app)
        .get('/api/tenants/me/apartment')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      const data = getData(res);
      expect(data.building.manager.password).toBeUndefined();
      expect(data.building.manager.email).toBeDefined(); // Email should be included for contact
    });
  });
});
