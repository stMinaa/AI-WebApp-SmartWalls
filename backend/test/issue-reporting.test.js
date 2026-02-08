require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const Issue = require('../models/Issue');
const { connectTestDB, disconnectTestDB } = require('./setup');

// Increase timeout for all tests
jest.setTimeout(30000);

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Building.deleteMany({});
  await Apartment.deleteMany({});
  await Issue.deleteMany({});
});

describe('Phase 3.2: Tenant Reports Issues', () => {
  describe('POST /api/issues', () => {
    let directorToken, managerToken, tenant1Token, tenant2Token;
    let building, apartment1, apartment2;
    let tenant1, tenant2, manager;

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

      // Approve manager
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
        .post(`/api/buildings/${building._id.toString()}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ unitNumber: '101', address: '123 Main St, Unit 101' });
      apartment1 = apt1Res.body;

      const apt2Res = await request(app)
        .post(`/api/buildings/${building._id.toString()}/apartments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ unitNumber: '102', address: '123 Main St, Unit 102' });
      apartment2 = apt2Res.body;

      // Create tenants
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

      // Assign tenant1 to apartment1
      await request(app)
        .post(`/api/tenants/${tenant1._id.toString()}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          apartmentId: apartment1._id.toString(),
          buildingId: building._id.toString(),
          numPeople: 2
        });
    });

    it('should create issue for assigned tenant with all required fields', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Broken faucet',
          description: 'Kitchen faucet is leaking water',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.issue).toBeDefined();
      expect(res.body.issue.title).toBe('Broken faucet');
      expect(res.body.issue.description).toBe('Kitchen faucet is leaking water');
      expect(res.body.issue.priority).toBe('high');
      expect(res.body.issue.status).toBe('reported');
      expect(res.body.issue.createdBy.toString()).toBe(tenant1._id.toString());
      expect(res.body.issue.building.toString()).toBe(building._id);
      expect(res.body.issue.apartment.toString()).toBe(apartment1._id);
      expect(res.body.issue.createdAt).toBeDefined();
    });

    it('should default priority to medium if not provided', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Minor issue',
          description: 'Light bulb needs replacement'
        });

      expect(res.status).toBe(201);
      expect(res.body.issue.priority).toBe('medium');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          description: 'Some description'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Title');
    });

    it('should return 400 if description is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Some title'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Description');
    });

    it('should return 400 if priority is invalid', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Test issue',
          description: 'Test description',
          priority: 'critical'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority/i);
    });

    it('should return 404 if tenant not assigned to apartment', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          title: 'Test issue',
          description: 'Test description'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not assigned/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/issues')
        .send({
          title: 'Test issue',
          description: 'Test description'
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not a tenant', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Test issue',
          description: 'Test description'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only tenants/i);
    });

    it('should create multiple issues for same tenant', async () => {
      const res1 = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Issue 1',
          description: 'Description 1',
          priority: 'low'
        });

      const res2 = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Issue 2',
          description: 'Description 2',
          priority: 'high'
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.issue._id).not.toBe(res2.body.issue._id);

      const issueCount = await Issue.countDocuments({ createdBy: tenant1._id });
      expect(issueCount).toBe(2);
    });

    it('should trim whitespace from title and description', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: '  Broken window  ',
          description: '  Window is cracked  '
        });

      expect(res.status).toBe(201);
      expect(res.body.issue.title).toBe('Broken window');
      expect(res.body.issue.description).toBe('Window is cracked');
    });
  });
});
