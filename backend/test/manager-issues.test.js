require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const Issue = require('../models/Issue');

let mongoServer;

// Increase timeout for all tests
jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Building.deleteMany({});
  await Apartment.deleteMany({});
  await Issue.deleteMany({});
});

describe('Phase 2.5: Manager Views Tenant-Reported Issues', () => {
  describe('GET /api/issues', () => {
    let directorToken, manager1Token, manager2Token, tenant1Token, tenant2Token;
    let building1, building2, apartment1, apartment2, apartment3;
    let manager1, manager2, tenant1, tenant2;
    let issue1, issue2, issue3;

    beforeEach(async () => {
      // Create director
      const directorSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'director1',
          email: 'director1@test.com',
          password: 'password123',
          role: 'director',
          firstName: 'Director',
          lastName: 'One'
        });

      const directorLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'director1', password: 'password123' });
      directorToken = directorLogin.body.token;

      // Create 2 managers
      const manager1Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager1',
          email: 'manager1@test.com',
          password: 'password123',
          role: 'manager',
          firstName: 'Manager',
          lastName: 'One'
        });
      manager1 = manager1Signup.body.user;

      await request(app)
        .patch(`/api/users/${manager1._id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ status: 'approved' });

      const manager1Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'manager1', password: 'password123' });
      manager1Token = manager1Login.body.token;

      const manager2Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager2',
          email: 'manager2@test.com',
          password: 'password123',
          role: 'manager',
          firstName: 'Manager',
          lastName: 'Two'
        });
      manager2 = manager2Signup.body.user;

      await request(app)
        .patch(`/api/users/${manager2._id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ status: 'approved' });

      const manager2Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'manager2', password: 'password123' });
      manager2Token = manager2Login.body.token;

      // Create 2 buildings
      const building1Res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: 'Building A', address: '123 Main St' });
      building1 = building1Res.body;

      const building2Res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: 'Building B', address: '456 Oak Ave' });
      building2 = building2Res.body;

      // Assign manager1 to building1, manager2 to building2
      await request(app)
        .patch(`/api/buildings/${building1._id}/assign-manager`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId: manager1._id.toString() });

      await request(app)
        .patch(`/api/buildings/${building2._id}/assign-manager`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId: manager2._id.toString() });

      // Create apartments
      const apt1Res = await request(app)
        .post(`/api/buildings/${building1._id}/apartments`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ unitNumber: '101', address: '123 Main St, Unit 101' });
      apartment1 = apt1Res.body;

      const apt2Res = await request(app)
        .post(`/api/buildings/${building1._id}/apartments`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ unitNumber: '102', address: '123 Main St, Unit 102' });
      apartment2 = apt2Res.body;

      const apt3Res = await request(app)
        .post(`/api/buildings/${building2._id}/apartments`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({ unitNumber: '201', address: '456 Oak Ave, Unit 201' });
      apartment3 = apt3Res.body;

      // Create 2 tenants
      const tenant1Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'tenant1',
          email: 'tenant1@test.com',
          password: 'password123',
          role: 'tenant',
          firstName: 'Tenant',
          lastName: 'One'
        });
      tenant1 = tenant1Signup.body.user;

      const tenant1Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'tenant1', password: 'password123' });
      tenant1Token = tenant1Login.body.token;

      const tenant2Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'tenant2',
          email: 'tenant2@test.com',
          password: 'password123',
          role: 'tenant',
          firstName: 'Tenant',
          lastName: 'Two'
        });
      tenant2 = tenant2Signup.body.user;

      const tenant2Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'tenant2', password: 'password123' });
      tenant2Token = tenant2Login.body.token;

      // Assign tenant1 to apartment1 (building1), tenant2 to apartment3 (building2)
      await request(app)
        .post(`/api/tenants/${tenant1._id}/assign`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          apartmentId: apartment1._id.toString(),
          buildingId: building1._id.toString(),
          numPeople: 2
        });

      await request(app)
        .post(`/api/tenants/${tenant2._id}/assign`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({
          apartmentId: apartment3._id.toString(),
          buildingId: building2._id.toString(),
          numPeople: 3
        });

      // Create 3 issues
      const issue1Res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Broken faucet',
          description: 'Kitchen faucet is leaking',
          priority: 'high'
        });
      issue1 = issue1Res.body.issue;

      const issue2Res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Light bulb out',
          description: 'Living room light needs replacement',
          priority: 'low'
        });
      issue2 = issue2Res.body.issue;

      const issue3Res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          title: 'Heating not working',
          description: 'No heat in apartment',
          priority: 'high'
        });
      issue3 = issue3Res.body.issue;
    });

    it('should return issues only from manager\'s assigned buildings', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // Only issues from building1
      
      const issueTitles = res.body.map(i => i.title);
      expect(issueTitles).toContain('Broken faucet');
      expect(issueTitles).toContain('Light bulb out');
      expect(issueTitles).not.toContain('Heating not working'); // From building2
    });

    it('should populate tenant, apartment, and building details', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body[0].createdBy).toBeDefined();
      expect(res.body[0].createdBy.firstName).toBe('Tenant');
      expect(res.body[0].apartment).toBeDefined();
      expect(res.body[0].apartment.unitNumber).toBe('101');
      expect(res.body[0].building).toBeDefined();
      expect(res.body[0].building.name).toBe('Building A');
    });

    it('should filter issues by status', async () => {
      // Update one issue to forwarded status
      await Issue.findByIdAndUpdate(issue1._id, { status: 'forwarded' });

      const res = await request(app)
        .get('/api/issues?status=reported')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Light bulb out');
      expect(res.body[0].status).toBe('reported');
    });

    it('should filter issues by priority', async () => {
      const res = await request(app)
        .get('/api/issues?priority=high')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Broken faucet');
      expect(res.body[0].priority).toBe('high');
    });

    it('should sort issues by newest first (default)', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // issue2 was created after issue1
      expect(res.body[0].title).toBe('Light bulb out');
      expect(res.body[1].title).toBe('Broken faucet');
    });

    it('should return empty array if manager has no buildings', async () => {
      // Create a manager with no buildings
      const manager3Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager3',
          email: 'manager3@test.com',
          password: 'password123',
          role: 'manager',
          firstName: 'Manager',
          lastName: 'Three'
        });

      await request(app)
        .patch(`/api/users/${manager3Signup.body.user._id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ status: 'approved' });

      const manager3Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'manager3', password: 'password123' });
      
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${manager3Login.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/issues');

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not a manager', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only managers/i);
    });

    it('should include issue count in response', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should not expose tenant password or sensitive data', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(res.body[0].createdBy.password).toBeUndefined();
    });
  });
});
