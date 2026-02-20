/**
 * Routes Layer Test - Issues API (Integration Tests)
 *
 * Purpose: Test HTTP endpoints, auth, request/response with real MongoDB
 * Mocking: PARTIAL - Real database (MongoDB Atlas), mock external APIs only
 * Coverage Target: ≥70%
 */

require('dotenv').config();
const _mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Issue = require('../../models/Issue');
const _User = require('../../models/User');
const {
  signupUser,
  approveUser,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant
} = require('../helpers');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../setup');

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('Routes Layer - Issues API', () => {
  let tenantToken, managerToken, directorToken;
  let tenantId, managerId, _directorId;
  let buildingId, apartmentId;

  beforeEach(async () => {
    // Create DIRECTOR (auto-active)
    const director = await signupUser({
      username: 'minimal_director',
      email: 'minimal_director@test.com',
      password: 'Test123!',
      firstName: 'Director',
      lastName: 'User',
      role: 'director'
    });
    directorToken = director.token;
    _directorId = director._id;

    // Create MANAGER
    const manager = await signupUser({
      username: 'minimal_manager',
      email: 'minimal_manager@test.com',
      password: 'Test123!',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager'
    });
    managerToken = manager.token;
    managerId = manager._id;

    // Approve MANAGER
    await approveUser(directorToken, managerId);

    // Create building, apartment, assign manager
    buildingId = await createBuilding(directorToken, {
      name: 'Test Building',
      address: '123 Test Street'
    });
    await assignManager(directorToken, buildingId, managerId);
    apartmentId = await createApartment(managerToken, buildingId, '101');

    // Create TENANT and assign to apartment
    const tenant = await signupUser({
      username: 'minimal_tenant',
      email: 'minimal_tenant@test.com',
      password: 'Test123!',
      firstName: 'Tenant',
      lastName: 'User',
      role: 'tenant'
    });
    tenantToken = tenant.token;
    tenantId = tenant._id;

    await assignTenant(managerToken, {
      tenantId,
      apartmentId,
      buildingId,
      numPeople: 2
    });
  });

  describe('POST /api/issues - Report Issue', () => {
    it('should create issue with status REPORTED', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Water leak',
          description: 'Pipe broken in bathroom',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.issue).toBeDefined();
      expect(res.body.issue.title).toBe('Water leak');
      expect(res.body.issue.status).toBe('reported');
      expect(res.body.issue.createdBy).toBe(tenantId);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          description: 'Pipe broken in bathroom',
          priority: 'high'
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/issues').send({
        title: 'Water leak',
        description: 'Pipe broken',
        priority: 'high'
      });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/issues/:id/triage - Forward Issue', () => {
    let issueId;

    beforeEach(async () => {
      const issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test Description',
        priority: 'medium',
        status: 'reported',
        createdBy: tenantId
      });
      issueId = issue._id.toString();
    });

    it('should forward issue when user is MANAGER', async () => {
      const res = await request(app)
        .patch(`/api/issues/${issueId}/triage`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ action: 'forward' });

      expect(res.status).toBe(200);
      // ApiResponse.success wraps in { success, message, data }
      expect(res.body.data.status).toBe('forwarded');
    });

    it('should return 403 when user is TENANT', async () => {
      const res = await request(app)
        .patch(`/api/issues/${issueId}/triage`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ action: 'forward' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/issues/:id/assign - Assign Issue', () => {
    let issueId, associateId;

    beforeEach(async () => {
      const issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test Description',
        priority: 'high',
        status: 'forwarded',
        createdBy: tenantId
      });
      issueId = issue._id.toString();

      // Create ASSOCIATE
      const associate = await signupUser({
        username: 'minimal_associate',
        email: 'minimal_associate@test.com',
        password: 'Test123!',
        firstName: 'Associate',
        lastName: 'User',
        role: 'associate'
      });
      associateId = associate._id;

      // Approve ASSOCIATE
      await approveUser(directorToken, associateId);
    });

    it('should assign issue when user is DIRECTOR', async () => {
      const res = await request(app)
        .patch(`/api/issues/${issueId}/assign`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          action: 'assign',
          assignedTo: associateId
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('assigned');
    });

    it('should return 403 when user is MANAGER', async () => {
      const res = await request(app)
        .patch(`/api/issues/${issueId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          action: 'assign',
          assignedTo: associateId
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/issues - List Issues', () => {
    beforeEach(async () => {
      await Issue.create([
        {
          title: 'Issue 1',
          description: 'Description 1',
          status: 'reported',
          apartment: apartmentId,
          createdBy: tenantId
        },
        {
          title: 'Issue 2',
          description: 'Description 2',
          status: 'forwarded',
          apartment: apartmentId,
          createdBy: tenantId
        },
        {
          title: 'Issue 3',
          description: 'Description 3',
          status: 'assigned',
          apartment: apartmentId,
          createdBy: tenantId
        }
      ]);
    });

    it('should return all issues for director', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(3);
    });

    it('should filter by status for manager', async () => {
      const res = await request(app)
        .get('/api/issues?status=reported')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('reported');
    });
  });
});
