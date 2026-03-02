const mongoose = require('mongoose');
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
  getUserFromDB,
  getApartmentFromDB,
  _signupUser
} = require('../helpers');
const { getData, assertSuccess, _assertError } = require('../helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('../setup');

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

describe('Phase 2.4: Assign Tenants to Apartments', () => {
  let directorToken, managerToken, tenantToken;
  let tenantId;
  let buildingId, apartmentId;

  async function sendAssign(token, tId, body) {
    return request(app)
      .post(`/api/tenants/${tId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

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

    apartmentId = await createApartment(managerToken, buildingId, '101');

    const tenant = await createTenant({
      username: 'tenant1',
      email: 'tenant1@example.com',
      password: 'password123',
      firstName: 'Tenant',
      lastName: 'One'
    });
    tenantId = tenant._id;
    tenantToken = tenant.token;
  });

  describe('POST /api/tenants/:id/assign', () => {
    it('should assign tenant to apartment and update both records', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 3
        });

      assertSuccess(res, 200);
      expect(res.body.message).toBe('Tenant assigned successfully');

      const tenant = await getUserFromDB(tenantId);
      expect(tenant.apartment.toString()).toBe(apartmentId);
      expect(tenant.building.toString()).toBe(buildingId);

      const apartment = await getApartmentFromDB(apartmentId);
      expect(apartment.tenant.toString()).toBe(tenantId);
      expect(apartment.numPeople).toBe(3);
    });

    it('should update numPeople if already assigned to same apartment', async () => {
      // First assignment
      await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      // Update numPeople
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 4
        });

      assertSuccess(res, 200);

      const apartment = await getApartmentFromDB(apartmentId);
      expect(apartment.numPeople).toBe(4);
    });

    it('should free old apartment when reassigning to new apartment', async () => {
      // Create second apartment
      const apartment2Res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          unitNumber: '102',
          address: '123 Main St, Unit 102'
        });
      const apartment2Id = getData(apartment2Res)._id;

      // First assignment to apartment 1
      await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      // Reassign to apartment 2
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId: apartment2Id,
          buildingId,
          numPeople: 3
        });

      expect(res.status).toBe(200);

      const apartment1 = await getApartmentFromDB(apartmentId);
      expect(apartment1.tenant).toBeNull();
      expect(apartment1.numPeople).toBe(0);

      const apartment2 = await getApartmentFromDB(apartment2Id);
      expect(apartment2.tenant.toString()).toBe(tenantId);
      expect(apartment2.numPeople).toBe(3);

      const tenant = await getUserFromDB(tenantId);
      expect(tenant.apartment.toString()).toBe(apartment2Id);
    });

    it('should return 400 if apartment already occupied by another tenant', async () => {
      const tenant2 = await createTenant({
        username: 'tenant2',
        email: 'tenant2@example.com',
        password: 'password123',
        firstName: 'Tenant',
        lastName: 'Two'
      });
      const tenant2Id = tenant2._id;

      // Assign first tenant to apartment
      await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      // Try to assign second tenant to same apartment
      const res = await request(app)
        .post(`/api/tenants/${tenant2Id}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already occupied');
    });

    it('should return 400 if apartmentId or buildingId missing', async () => {
      const res = await sendAssign(managerToken, tenantId, { apartmentId, numPeople: 2 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('apartmentId and buildingId are required');
    });

    it.each([
      {
        scenario: 'tenant',
        getTId: () => new mongoose.Types.ObjectId(),
        getBody: () => ({ apartmentId, buildingId, numPeople: 2 }),
        expectedMsg: 'Tenant not found'
      },
      {
        scenario: 'apartment',
        getTId: () => tenantId,
        getBody: () => ({ apartmentId: new mongoose.Types.ObjectId(), buildingId, numPeople: 2 }),
        expectedMsg: 'Apartment not found'
      }
    ])('should return 404 if $scenario not found', async ({ getTId, getBody, expectedMsg }) => {
      const res = await sendAssign(managerToken, getTId(), getBody());
      expect(res.status).toBe(404);
      expect(res.body.message).toContain(expectedMsg);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).post(`/api/tenants/${tenantId}/assign`).send({
        apartmentId,
        buildingId,
        numPeople: 2
      });

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/assign`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          apartmentId,
          buildingId,
          numPeople: 2
        });

      expect(res.status).toBe(403);
    });

    it('should allow director to assign tenants', async () => {
      const res = await sendAssign(directorToken, tenantId, {
        apartmentId,
        buildingId,
        numPeople: 2
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Tenant assigned successfully');
    });
  });
});
