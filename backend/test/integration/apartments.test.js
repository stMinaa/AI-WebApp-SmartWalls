/* eslint-disable max-nested-callbacks */
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Apartment = require('../../models/Apartment');
const {
  cleanCollections,
  createDirector,
  createManager,
  createTenant,
  createBuilding,
  assignManager
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

describe('Phase 2.2: Manager Creates Apartments', () => {
  let directorToken, managerToken, tenantToken;
  let managerId;
  let buildingId;

  function postBulk(token, body) {
    const r = request(app).post(`/api/buildings/${buildingId}/apartments/bulk`);
    return (token ? r.set('Authorization', `Bearer ${token}`) : r).send(body);
  }

  function postSingle(token, body) {
    const r = request(app).post(`/api/buildings/${buildingId}/apartments`);
    return (token ? r.set('Authorization', `Bearer ${token}`) : r).send(body);
  }

  function getAptList(token) {
    const r = request(app).get(`/api/buildings/${buildingId}/apartments`);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  }

  async function createBulkAndVerify(body, expectedCount, expectedUnits) {
    const res = await postBulk(managerToken, body);
    assertSuccess(res, 201);
    const data = getData(res);
    expect(res.body.message).toMatch(/created/i);
    expect(data.count).toBe(expectedCount);
    const apartments = await Apartment.find({ building: buildingId });
    expect(apartments.length).toBe(expectedCount);
    const unitNumbers = apartments.map((a) => a.unitNumber).sort();
    expectedUnits.forEach((u) => expect(unitNumbers).toContain(u));
  }

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

    const tenant = await createTenant({
      username: 'tenant1',
      email: 'tenant1@test.com',
      password: 'pass123',
      firstName: 'Ten',
      lastName: 'Ant'
    });
    tenantToken = tenant.token;

    buildingId = await createBuilding(directorToken, {
      name: 'Test Building',
      address: '123 Main St'
    });
    await assignManager(directorToken, buildingId, managerId);
  });

  describe('POST /api/buildings/:id/apartments/bulk', () => {
    it('should create apartments using simple replication (floors + unitsPerFloor)', async () => {
      await createBulkAndVerify({ floors: 3, unitsPerFloor: 4 }, 12, ['101', '104', '201', '304']);
    });

    it('should create apartments using advanced spec (custom floors)', async () => {
      await createBulkAndVerify({ floorsSpec: '2,3,5' }, 10, [
        '201',
        '204',
        '301',
        '304',
        '501',
        '502'
      ]);
    });

    it('should reject bulk create if building already has apartments', async () => {
      await postBulk(managerToken, { floors: 2, unitsPerFloor: 2 });
      const res = await postBulk(managerToken, { floors: 1, unitsPerFloor: 1 });
      assertError(res, 400);
      expect(res.body.message).toMatch(/already has apartments/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await postBulk(null, { floors: 2, unitsPerFloor: 2 });
      assertError(res, 401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await postBulk(tenantToken, { floors: 2, unitsPerFloor: 2 });
      assertError(res, 403);
    });

    it('should return 404 if building not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/buildings/${fakeId}/apartments/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ floors: 2, unitsPerFloor: 2 });
      assertError(res, 404);
    });
  });

  describe('POST /api/buildings/:id/apartments', () => {
    it('should create single apartment', async () => {
      const res = await postSingle(managerToken, {
        unitNumber: 'A1',
        address: '123 Main St, Unit A1'
      });
      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.unitNumber).toBe('A1');
      expect(data.building).toBe(buildingId);
      expect(data.address).toBe('123 Main St, Unit A1');

      const apartment = await Apartment.findById(data._id);
      expect(apartment).toBeTruthy();
      expect(apartment.unitNumber).toBe('A1');
    });

    it('should reject if unitNumber missing', async () => {
      const res = await postSingle(managerToken, { address: '123 Main St' });
      assertError(res, 400);
      expect(res.body.message).toMatch(/unit.?number.*required/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await postSingle(null, { unitNumber: 'A1' });
      assertError(res, 401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await postSingle(tenantToken, { unitNumber: 'A1' });
      assertError(res, 403);
    });
  });

  describe('GET /api/buildings/:id/apartments', () => {
    beforeEach(async () => {
      await Apartment.create([
        { building: buildingId, unitNumber: '101' },
        { building: buildingId, unitNumber: '102' },
        { building: buildingId, unitNumber: '201' }
      ]);
    });

    it('should return all apartments for building', async () => {
      const res = await getAptList(managerToken);
      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);

      const unitNumbers = data.map((a) => a.unitNumber).sort();
      expect(unitNumbers).toEqual(['101', '102', '201']);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await getAptList(null);
      assertError(res, 401);
    });

    it('should return 404 if building not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/buildings/${fakeId}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertError(res, 404);
    });
  });
});
