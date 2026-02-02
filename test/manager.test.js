/**
 * Phase 2.1: Manager Views Assigned Buildings
 * 
 * Following DEVELOPMENT_WORKFLOW.md TDD Rules:
 * - Rule 1: Tests First, Always
 * - Rule 2: Missing Behavior = Write Test First
 * 
 * Following CODE_QUALITY_STANDARDS.md:
 * - Clear test structure (describe/it blocks)
 * - Meaningful test names
 * - Proper setup/teardown
 * - Test one thing at a time
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../backend/models/User');
const Building = require('../backend/models/Building');

let app;
let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  // Import app after DB connection
  app = require('../backend/index');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Phase 2.1: Manager Views Assigned Buildings', () => {
  let directorToken;
  let managerToken;
  let directorId;
  let managerId;
  let building1Id;
  let building2Id;

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
    await Building.deleteMany({});

    // Create director
    const directorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'director1',
        email: 'director@test.com',
        password: 'pass123',
        firstName: 'Test',
        lastName: 'Director',
        role: 'director'
      });
    
    directorId = directorRes.body.user._id;

    // Login as director
    const directorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'director1',
        password: 'pass123'
      });
    
    directorToken = directorLogin.body.token;

    // Create manager
    const managerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'manager1',
        email: 'manager@test.com',
        password: 'pass123',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'manager'
      });
    
    managerId = managerRes.body.user._id;

    // Approve manager (set status to active)
    await User.findByIdAndUpdate(managerId, { status: 'active' });

    // Login as manager
    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'manager1',
        password: 'pass123'
      });
    
    managerToken = managerLogin.body.token;

    // Create buildings and assign to manager
    const building1 = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        name: 'Building A',
        address: 'Address A'
      });
    
    building1Id = building1.body._id;

    const building2 = await request(app)
      .post('/api/buildings')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        name: 'Building B',
        address: 'Address B'
      });
    
    building2Id = building2.body._id;

    // Assign both buildings to manager
    await request(app)
      .patch(`/api/buildings/${building1Id}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId: managerId });

    await request(app)
      .patch(`/api/buildings/${building2Id}/assign-manager`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ managerId: managerId });
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Building.deleteMany({});
  });

  describe('GET /api/buildings/managed', () => {
    it('should return only buildings assigned to the logged-in manager', async () => {
      const response = await request(app)
        .get('/api/buildings/managed')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      const buildingNames = response.body.map(b => b.name).sort();
      expect(buildingNames).toEqual(['Building A', 'Building B']);
    });

    it('should return empty array if manager has no assigned buildings', async () => {
      // Create another manager with no buildings
      const manager2Res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager2',
          email: 'manager2@test.com',
          password: 'pass123',
          role: 'manager'
        });

      await User.findByIdAndUpdate(manager2Res.body.user._id, { status: 'active' });

      const manager2Login = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'manager2',
          password: 'pass123'
        });

      const response = await request(app)
        .get('/api/buildings/managed')
        .set('Authorization', `Bearer ${manager2Login.body.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/buildings/managed');

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not a manager', async () => {
      // Try with director token
      const response = await request(app)
        .get('/api/buildings/managed')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(403);
    });

    it('should populate manager field in response', async () => {
      const response = await request(app)
        .get('/api/buildings/managed')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].manager).toBeDefined();
      expect(response.body[0].manager._id).toBe(managerId);
      expect(response.body[0].manager.firstName).toBe('Test');
    });

    it('should include apartment count for each building', async () => {
      const response = await request(app)
        .get('/api/buildings/managed')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('apartmentCount');
      expect(typeof response.body[0].apartmentCount).toBe('number');
      // Should be 0 since we haven't created any apartments yet
      expect(response.body[0].apartmentCount).toBe(0);
    });
  });
});
