const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const { connectTestDB, disconnectTestDB } = require('./setup');
const { getData, getErrorMessage } = require('./helpers/responseHelpers');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Phase 3.1: Tenant Views Apartment & Building Info', () => {
  let tenantToken, tenant2Token, managerToken, directorToken;
  let tenantId, tenant2Id, managerId, directorId;
  let buildingId, apartmentId, apartment2Id;

  beforeEach(async () => {
    await User.deleteMany({});
    await Building.deleteMany({});
    await Apartment.deleteMany({});

    // Create director
    const directorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'director1',
        email: 'director1@example.com',
        password: 'password123',
        firstName: 'Director',
        lastName: 'One',
        role: 'director'
      });
    directorId = getData(directorRes).user._id;

    const directorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'director1',
        password: 'password123'
      });
    directorToken = getData(directorLogin).token;

    // Create and approve manager
    const managerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'manager1',
        email: 'manager1@example.com',
        password: 'password123',
        firstName: 'Manager',
        lastName: 'One',
        role: 'manager'
      });
    managerId = getData(managerRes).user._id;

    await request(app)
      .patch(`/api/users/${managerId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'manager1',
        password: 'password123'
      });
    managerToken = getData(managerLogin).token;

    // Create building and assign manager
    const buildingRes = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        name: 'Test Building',
        address: '123 Main St'
      });
    buildingId = getData(buildingRes)._id;

    await request(app)
      .patch(`/api/buildings/${buildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId });

    // Create apartments
    const apartment1Res = await request(app)
      .post(`/api/buildings/${buildingId}/apartments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        unitNumber: '101',
        address: '123 Main St, Unit 101'
      });
    apartmentId = getData(apartment1Res)._id;

    const apartment2Res = await request(app)
      .post(`/api/buildings/${buildingId}/apartments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        unitNumber: '102',
        address: '123 Main St, Unit 102'
      });
    apartment2Id = getData(apartment2Res)._id;

    // Create tenants
    const tenant1Res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'tenant1',
        email: 'tenant1@example.com',
        password: 'password123',
        firstName: 'Tenant',
        lastName: 'One',
        role: 'tenant'
      });
    tenantId = getData(tenant1Res).user._id;

    const tenant1Login = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'tenant1',
        password: 'password123'
      });
    tenantToken = getData(tenant1Login).token;

    const tenant2Res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'tenant2',
        email: 'tenant2@example.com',
        password: 'password123',
        firstName: 'Tenant',
        lastName: 'Two',
        role: 'tenant'
      });
    tenant2Id = getData(tenant2Res).user._id;

    const tenant2Login = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'tenant2',
        password: 'password123'
      });
    tenant2Token = getData(tenant2Login).token;

    // Assign tenant1 to apartment
    await request(app)
      .post(`/api/tenants/${tenantId}/assign`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        apartmentId,
        buildingId,
        numPeople: 3
      });
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
      const res = await request(app)
        .get('/api/tenants/me/apartment');

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
