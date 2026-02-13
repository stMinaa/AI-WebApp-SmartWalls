const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const { connectTestDB, disconnectTestDB } = require('./setup');
const { getData, assertSuccess, assertError } = require('./helpers/responseHelpers');

let app;

describe('Phase 2.3: Manager Views & Manages Tenants', () => {
  beforeAll(async () => {
    await connectTestDB();
    app = require('../index');
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  let directorToken, managerToken, otherManagerToken, tenantToken;
  let directorId, managerId, otherManagerId;
  let buildingId, otherBuildingId;
  let apartmentId;
  let tenant1Id, tenant2Id, tenant3Id;

  beforeEach(async () => {
    await User.deleteMany({});
    await Building.deleteMany({});
    await Apartment.deleteMany({});

    // Create director
    const directorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'director1',
        email: 'director1@test.com',
        password: 'pass123',
        firstName: 'Dir',
        lastName: 'Ector',
        role: 'director'
      });
    directorToken = getData(directorRes).token;
    directorId = getData(directorRes).user._id;

    // Create manager
    const managerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'manager1',
        email: 'manager1@test.com',
        password: 'pass123',
        firstName: 'Man',
        lastName: 'Ager',
        role: 'manager'
      });
    managerToken = getData(managerRes).token;
    managerId = getData(managerRes).user._id;
    await request(app)
      .patch(`/api/users/${managerId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    // Create another manager
    const otherManagerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'manager2',
        email: 'manager2@test.com',
        password: 'pass123',
        firstName: 'Other',
        lastName: 'Manager',
        role: 'manager'
      });
    otherManagerToken = getData(otherManagerRes).token;
    otherManagerId = getData(otherManagerRes).user._id;
    await request(app)
      .patch(`/api/users/${otherManagerId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    // Create building for manager1
    const buildingRes = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ name: 'Building A', address: '123 Main St' });
    buildingId = getData(buildingRes)._id;
    await request(app)
      .patch(`/api/buildings/${buildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId });

    // Create building for manager2
    const otherBuildingRes = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ name: 'Building B', address: '456 Oak St' });
    otherBuildingId = getData(otherBuildingRes)._id;
    await request(app)
      .patch(`/api/buildings/${otherBuildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId: otherManagerId });

    // Create apartment in building A
    const apartmentRes = await request(app)
      .post(`/api/buildings/${buildingId}/apartments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ unitNumber: '101' });
    apartmentId = getData(apartmentRes)._id;

    // Create tenants
    const tenant1Res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'tenant1',
        email: 'tenant1@test.com',
        password: 'pass123',
        firstName: 'Tenant',
        lastName: 'One',
        role: 'tenant'
      });
    tenant1Id = getData(tenant1Res).user._id;

    const tenant2Res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'tenant2',
        email: 'tenant2@test.com',
        password: 'pass123',
        firstName: 'Tenant',
        lastName: 'Two',
        role: 'tenant'
      });
    tenant2Id = getData(tenant2Res).user._id;

    const tenant3Res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'tenant3',
        email: 'tenant3@test.com',
        password: 'pass123',
        firstName: 'Tenant',
        lastName: 'Three',
        role: 'tenant'
      });
    tenant3Id = getData(tenant3Res).user._id;
    tenantToken = getData(tenant3Res).token;

    // Assign tenant1 to apartment (sets both building and apartment)
    await request(app)
      .post(`/api/tenants/${tenant1Id}/assign`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ apartmentId, buildingId, numPeople: 2 });

    // Assign tenant2 to building only (no apartment)
    await User.findByIdAndUpdate(tenant2Id, {
      building: new mongoose.Types.ObjectId(buildingId)
    });

    // Tenant3 not assigned to any building (should not appear in manager1's list)
  });

  describe('GET /api/buildings/:id/tenants', () => {
    it('should return all tenants for building (assigned and unassigned)', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/tenants`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // tenant1 and tenant2

      const usernames = data.map(t => t.username).sort();
      expect(usernames).toEqual(['tenant1', 'tenant2']);

      // Check populated apartment
      const tenant1 = data.find(t => t.username === 'tenant1');
      expect(tenant1.apartment).toBeTruthy();
      expect(tenant1.apartment.unitNumber).toBe('101');

      // tenant2 should have building but no apartment
      const tenant2 = data.find(t => t.username === 'tenant2');
      expect(tenant2.apartment).toBeFalsy();
      expect(tenant2.building._id).toBe(buildingId);
    });

    it('should return empty array if building has no tenants', async () => {
      const res = await request(app)
        .get(`/api/buildings/${otherBuildingId}/tenants`)
        .set('Authorization', `Bearer ${otherManagerToken}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/tenants`);

      assertError(res, 401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/tenants`)
        .set('Authorization', `Bearer ${tenantToken}`);

      assertError(res, 403);
    });

    it('should return 404 if building not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/buildings/${fakeId}/tenants`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertError(res, 404);
    });
  });

  describe('DELETE /api/tenants/:id', () => {
    it('should delete tenant and free their apartment', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${tenant1Id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertSuccess(res, 200);
      expect(res.body.message).toMatch(/deleted/i);

      // Verify tenant deleted
      const deletedTenant = await User.findById(tenant1Id);
      expect(deletedTenant).toBeNull();

      // Verify apartment freed
      const apartment = await Apartment.findById(apartmentId);
      expect(apartment.tenant).toBeFalsy();
    });

    it('should return 404 if tenant not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/tenants/${fakeId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertError(res, 404);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${tenant1Id}`);

      assertError(res, 401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${tenant1Id}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      assertError(res, 403);
    });
  });
});
