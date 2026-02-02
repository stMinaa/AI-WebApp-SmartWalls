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

describe('Phase 3.3: Tenant Views Their Own Issues', () => {
  describe('GET /api/issues/my', () => {
    let directorToken, managerToken, tenant1Token, tenant2Token;
    let building, apartment1, apartment2;
    let manager, tenant1, tenant2;
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

      // Create manager
      const managerSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'manager1',
          email: 'manager1@test.com',
          password: 'password123',
          role: 'manager',
          firstName: 'Manager',
          lastName: 'One'
        });
      manager = managerSignup.body.user;

      await request(app)
        .patch(`/api/users/${manager._id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ status: 'approved' });

      const managerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'manager1', password: 'password123' });
      managerToken = managerLogin.body.token;

      // Create building
      const buildingRes = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: 'Test Building', address: '123 Main St' });
      building = buildingRes.body;

      // Assign manager to building
      await request(app)
        .patch(`/api/buildings/${building._id}/assign-manager`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId: manager._id.toString() });

      // Create apartments
      const apt1Res = await request(app)
        .post(`/api/buildings/${building._id}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ unitNumber: '101', address: '123 Main St, Unit 101' });
      apartment1 = apt1Res.body;

      const apt2Res = await request(app)
        .post(`/api/buildings/${building._id}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ unitNumber: '102', address: '123 Main St, Unit 102' });
      apartment2 = apt2Res.body;

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

      // Assign tenants to apartments
      await request(app)
        .post(`/api/tenants/${tenant1._id}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId: apartment1._id.toString(),
          buildingId: building._id.toString(),
          numPeople: 2
        });

      await request(app)
        .post(`/api/tenants/${tenant2._id}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId: apartment2._id.toString(),
          buildingId: building._id.toString(),
          numPeople: 3
        });

      // Create 3 issues (2 from tenant1, 1 from tenant2)
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

    it('should return only issues created by the authenticated tenant', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      
      const issueTitles = res.body.map(i => i.title);
      expect(issueTitles).toContain('Broken faucet');
      expect(issueTitles).toContain('Light bulb out');
      expect(issueTitles).not.toContain('Heating not working');
    });

    it('should populate apartment and building details', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body[0].apartment).toBeDefined();
      expect(res.body[0].apartment.unitNumber).toBe('101');
      expect(res.body[0].building).toBeDefined();
      expect(res.body[0].building.name).toBe('Test Building');
    });

    it('should filter issues by status', async () => {
      // Update one issue to forwarded status
      await Issue.findByIdAndUpdate(issue1._id, { status: 'forwarded' });

      const res = await request(app)
        .get('/api/issues/my?status=reported')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Light bulb out');
      expect(res.body[0].status).toBe('reported');
    });

    it('should filter issues by priority', async () => {
      const res = await request(app)
        .get('/api/issues/my?priority=high')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Broken faucet');
      expect(res.body[0].priority).toBe('high');
    });

    it('should sort issues by newest first (default)', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // issue2 was created after issue1
      expect(res.body[0].title).toBe('Light bulb out');
      expect(res.body[1].title).toBe('Broken faucet');
    });

    it('should return empty array if tenant has no issues', async () => {
      // Create a new tenant with no issues
      const tenant3Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'tenant3',
          email: 'tenant3@test.com',
          password: 'password123',
          role: 'tenant',
          firstName: 'Tenant',
          lastName: 'Three'
        });

      const tenant3Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'tenant3', password: 'password123' });

      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${tenant3Login.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/issues/my');

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not a tenant', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only tenants/i);
    });

    it('should include all issue fields', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(res.status).toBe(200);
      const issue = res.body[0];
      expect(issue._id).toBeDefined();
      expect(issue.title).toBeDefined();
      expect(issue.description).toBeDefined();
      expect(issue.priority).toBeDefined();
      expect(issue.status).toBeDefined();
      expect(issue.createdAt).toBeDefined();
    });

    it('should work for tenants even if not assigned to apartment', async () => {
      // Create a tenant without apartment assignment
      const tenant3Signup = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'tenant3',
          email: 'tenant3@test.com',
          password: 'password123',
          role: 'tenant',
          firstName: 'Tenant',
          lastName: 'Three'
        });

      const tenant3Login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'tenant3', password: 'password123' });

      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${tenant3Login.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
