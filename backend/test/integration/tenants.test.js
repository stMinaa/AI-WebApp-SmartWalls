/* eslint-disable max-nested-callbacks */
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const User = require('../../models/User');
const {
  cleanCollections,
  createDirector,
  createManager,
  createTenant,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant,
  getUserFromDB,
  getApartmentFromDB
} = require('../helpers');
const { getData, assertSuccess, assertError } = require('../helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('../setup');

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

describe('Phase 2.3: Manager Views & Manages Tenants', () => {
  let directorToken, managerToken, otherManagerToken, tenantToken;
  let managerId, otherManagerId;
  let buildingId, otherBuildingId;
  let apartmentId;
  let tenant1Id, tenant2Id, _tenant3Id;

  beforeEach(async () => {
    await cleanCollections();

    const director = await createDirector({
      username: 'director1',
      email: 'director1@test.com',
      password: 'pass123'
    });
    directorToken = director.token;

    const manager = await createManager(directorToken, {
      username: 'manager1',
      email: 'manager1@test.com',
      password: 'pass123',
      firstName: 'Man',
      lastName: 'Ager'
    });
    managerId = manager._id;
    managerToken = manager.token;

    const otherManager = await createManager(directorToken, {
      username: 'manager2',
      email: 'manager2@test.com',
      password: 'pass123',
      firstName: 'Other',
      lastName: 'Manager'
    });
    otherManagerId = otherManager._id;
    otherManagerToken = otherManager.token;

    buildingId = await createBuilding(directorToken, {
      name: 'Building A',
      address: '123 Main St'
    });
    await assignManager(directorToken, buildingId, managerId);

    otherBuildingId = await createBuilding(directorToken, {
      name: 'Building B',
      address: '456 Oak St'
    });
    await assignManager(directorToken, otherBuildingId, otherManagerId);

    apartmentId = await createApartment(managerToken, buildingId, '101');

    const tenant1 = await createTenant({
      username: 'tenant1',
      email: 'tenant1@test.com',
      password: 'pass123',
      firstName: 'Tenant',
      lastName: 'One'
    });
    tenant1Id = tenant1._id;

    const tenant2 = await createTenant({
      username: 'tenant2',
      email: 'tenant2@test.com',
      password: 'pass123',
      firstName: 'Tenant',
      lastName: 'Two'
    });
    tenant2Id = tenant2._id;

    const tenant3 = await createTenant({
      username: 'tenant3',
      email: 'tenant3@test.com',
      password: 'pass123',
      firstName: 'Tenant',
      lastName: 'Three'
    });
    _tenant3Id = tenant3._id;
    tenantToken = tenant3.token;

    await assignTenant(managerToken, { tenantId: tenant1Id, apartmentId, buildingId });

    // Assign tenant2 to building only (no apartment)
    await User.findByIdAndUpdate(tenant2Id, {
      building: new mongoose.Types.ObjectId(buildingId)
    });
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

      const usernames = data.map((t) => t.username).sort();
      expect(usernames).toEqual(['tenant1', 'tenant2']);

      // Check populated apartment
      const tenant1 = data.find((t) => t.username === 'tenant1');
      expect(tenant1.apartment).toBeTruthy();
      expect(tenant1.apartment.unitNumber).toBe('101');

      // tenant2 should have building but no apartment
      const tenant2 = data.find((t) => t.username === 'tenant2');
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
      const res = await request(app).get(`/api/buildings/${buildingId}/tenants`);

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

      const deletedTenant = await getUserFromDB(tenant1Id);
      expect(deletedTenant).toBeNull();

      const apartment = await getApartmentFromDB(apartmentId);
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
      const res = await request(app).delete(`/api/tenants/${tenant1Id}`);

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
