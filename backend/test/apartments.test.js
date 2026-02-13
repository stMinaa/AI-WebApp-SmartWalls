const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const { connectTestDB, disconnectTestDB } = require('./setup');
const { getData, assertSuccess, assertError } = require('./helpers/responseHelpers');

let app;

describe('Phase 2.2: Manager Creates Apartments', () => {
  beforeAll(async () => {
    await connectTestDB();
    // Now require app after DB is connected
    app = require('../index');
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  let directorToken, managerToken, tenantToken;
  let directorId, managerId;
  let buildingId;

  beforeEach(async () => {
    // Clean up
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
        firstName: 'Man',
        lastName: 'Ager',
        role: 'manager'
      });
    managerToken = getData(managerRes).token;
    managerId = getData(managerRes).user._id;
      .post('/api/auth/signup')
      .send({
        username: 'tenant1',
        email: 'tenant1@test.com',
        password: 'pass123',
        firstName: 'Ten',
        lastName: 'Ant',
        role: 'tenant'
      });
    tenantToken = getData(tenantRes).token;
    // Assign manager to building
    await request(app)
      .patch(`/api/buildings/${buildingId}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId });
  });

  describe('POST /api/buildings/:id/apartments/bulk', () => {
    it('should create apartments using simple replication (floors + unitsPerFloor)', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ floors: 3, unitsPerFloor: 4 });

      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.message).toMatch(/created/i);
      expect(data.count).toBe(12); // 3 floors × 4 units

      // Verify in database
      const apartments = await Apartment.find({ building: buildingId });
      expect(apartments.length).toBe(12);

      // Check unit numbering (e.g., 101, 102, 103, 104, 201, 202, ...)
      const unitNumbers = apartments.map(a => a.unitNumber).sort();
      expect(unitNumbers).toContain('101');
      expect(unitNumbers).toContain('104');
      expect(unitNumbers).toContain('201');
      expect(unitNumbers).toContain('304');
    });

    it('should create apartments using advanced spec (custom floors)', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ floorsSpec: '2,3,5' });

      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.count).toBe(10); // Floor 2: 4 units, Floor 3: 4 units, Floor 5: 2 units

      const apartments = await Apartment.find({ building: buildingId });
      expect(apartments.length).toBe(10);
      
      const unitNumbers = apartments.map(a => a.unitNumber).sort();
      expect(unitNumbers).toContain('201');
      expect(unitNumbers).toContain('204');
      expect(unitNumbers).toContain('301');
      expect(unitNumbers).toContain('304');
      expect(unitNumbers).toContain('501');
      expect(unitNumbers).toContain('502');
    });

    it('should reject bulk create if building already has apartments', async () => {
      // First bulk create
      await request(app)
        .post(`/api/buildings/${buildingId}/apartments/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ floors: 2, unitsPerFloor: 2 });

      // Try second bulk create
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ floors: 1, unitsPerFloor: 1 });

      assertError(res, 400);
      expect(res.body.error).toMatch(/already has apartments/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments/bulk`)
        .send({ floors: 2, unitsPerFloor: 2 });

      assertError(res, 401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments/bulk`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ floors: 2, unitsPerFloor: 2 });

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
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ unitNumber: 'A1', address: '123 Main St, Unit A1' });

      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.unitNumber).toBe('A1');
      expect(data.building).toBe(buildingId);
      expect(data.address).toBe('123 Main St, Unit A1');

      // Verify in database
      const apartment = await Apartment.findById(data._id);
      expect(apartment).toBeTruthy();
      expect(apartment.unitNumber).toBe('A1');
    });

    it('should reject if unitNumber missing', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ address: '123 Main St' });

      assertError(res, 400);
      expect(res.body.error).toMatch(/unitNumber.*required/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments`)
        .send({ unitNumber: 'A1' });

      assertError(res, 401);
    });

    it('should return 403 if user is not manager or director', async () => {
      const res = await request(app)
        .post(`/api/buildings/${buildingId}/apartments`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ unitNumber: 'A1' });

      assertError(res, 403);
    });
  });

  describe('GET /api/buildings/:id/apartments', () => {
    beforeEach(async () => {
      // Create test apartments
      await Apartment.create([
        { building: buildingId, unitNumber: '101' },
        { building: buildingId, unitNumber: '102' },
        { building: buildingId, unitNumber: '201' }
      ]);
    });

    it('should return all apartments for building', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);
      
      const unitNumbers = data.map(a => a.unitNumber).sort();
      expect(unitNumbers).toEqual(['101', '102', '201']);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get(`/api/buildings/${buildingId}/apartments`);

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
