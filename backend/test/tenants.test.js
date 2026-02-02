const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');

let mongoServer;
let app;

describe('Phase 2.3: Manager Views & Manages Tenants', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    app = require('../index');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
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
    directorToken = directorRes.body.token;
    directorId = directorRes.body.user._id;

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
    managerToken = managerRes.body.token;
    managerId = managerRes.body.user._id;
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
    otherManagerToken = otherManagerRes.body.token;
    otherManagerId = otherManagerRes.body.user._id;
    await request(app)
      .patch(`/api/users/${otherManagerId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`);

    // Create building for manager1
    const buildingRes = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ name: 'Building A', address: '123 Main St' });
    buildingId = buildingRes.body._id;
    await request(app)
      .patch(`/api/buildings/${buildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId });

    // Create building for manager2
    const otherBuildingRes = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ name: 'Building B', address: '456 Oak St' });
    otherBuildingId = otherBuildingRes.body._id;
    await request(app)
      .patch(`/api/buildings/${otherBuildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId: otherManagerId });

    // Create apartment in building A
    const apartmentRes = await request(app)
      .post(`/api/buildings/${buildingId}/apartments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ unitNumber: '101' });
    apartmentId = apartmentRes.body._id;

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
    tenant1Id = tenant1Res.body.user._id;

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
    tenant2Id = tenant2Res.body.user._id;

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
    tenant3Id = tenant3Res.body.user._id;
    tenantToken = tenant3Res.body.token;

    // Assign tenant1 to apartment in building A
    await User.findByIdAndUpdate(tenant1Id, {
      building: new mongoose.Types.ObjectId(buildingId),
      apartment: new mongoose.Types.ObjectId(apartmentId)
    });

    // Assign tenant2 to building A but no apartment (pending assignment)
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

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // tenant1 and tenant2

      const usernames = res.body.map(t => t.username).sort();
      expect(usernames).toEqual(['tenant1', 'tenant2']);

      // Check populated apartment
      const tenant1 = res.body.find(t => t.username === 'tenant1');
      expect(tenant1.apartment).toBeTruthy();
      expect(tenant1.apartment.unitNumber).toBe('101');

      // tenant2 should have building but no apartment
      const tenant2 = res.body.find(t => t.username === 'tenant2');
      expect(tenant2.apartment).toBeFalsy();
      expect(tenant2.building._id).toBe(buildingId);
    });

    it('should return empty array if building has no tenants', async () => {
      const res = await request(app)
        .get(`/api/buildings/${otherBuildingId}/tenants`)
        .set('Authorization', `Bearer ${otherManagerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/tenants`);

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/tenants`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 if building not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/buildings/${fakeId}/tenants`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tenants/:id', () => {
    it('should delete tenant and free their apartment', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${tenant1Id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
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

      expect(res.status).toBe(404);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${tenant1Id}`);

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .delete(`/api/tenants/${tenant1Id}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });
  });
});
