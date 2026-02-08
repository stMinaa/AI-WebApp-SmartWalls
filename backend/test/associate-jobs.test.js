const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const Issue = require('../models/Issue');
const { connectTestDB, disconnectTestDB } = require('./setup');

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

describe('Phase 4.1: Associate Views Assigned Jobs', () => {
  describe('GET /api/associates/me/jobs', () => {
    let director, associate1, associate2, manager, tenant;
    let directorToken, associate1Token, associate2Token;
    let building, apartment;
    let assignedIssue1, assignedIssue2, unassignedIssue;

    beforeEach(async () => {
      // Create users
      const directorRes = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'director1', password: 'password', email: 'director1@test.com', role: 'director', firstName: 'Director', lastName: 'One' });
      directorToken = directorRes.body.token;

      const associate1Res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'associate1', password: 'password', email: 'associate1@test.com', role: 'associate', firstName: 'Associate', lastName: 'One', company: 'Fix-It Co' });
      associate1Token = associate1Res.body.token;

      const associate2Res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'associate2', password: 'password', email: 'associate2@test.com', role: 'associate', firstName: 'Associate', lastName: 'Two', company: 'Repair Pro' });
      associate2Token = associate2Res.body.token;

      const managerRes = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'manager1', password: 'password', email: 'manager1@test.com', role: 'manager', firstName: 'Manager', lastName: 'One' });
      const managerToken = managerRes.body.token;

      const tenantRes = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'tenant1', password: 'password', email: 'tenant1@test.com', role: 'tenant', firstName: 'Tenant', lastName: 'One' });
      const tenantToken = tenantRes.body.token;

      // Fetch user objects from database
      director = await User.findOne({ username: 'director1' });
      manager = await User.findOne({ username: 'manager1' });
      associate1 = await User.findOne({ username: 'associate1' });
      associate2 = await User.findOne({ username: 'associate2' });
      tenant = await User.findOne({ username: 'tenant1' });

      // Approve manager and associates
      await request(app).patch(`/api/users/${manager._id}/approve`).set('Authorization', 'Bearer ' + directorToken);
      await request(app).patch(`/api/users/${associate1._id}/approve`).set('Authorization', 'Bearer ' + directorToken);
      await request(app).patch(`/api/users/${associate2._id}/approve`).set('Authorization', 'Bearer ' + directorToken);

      // Create building and apartment
      const buildingRes = await request(app)
        .post('/api/buildings')
        .set('Authorization', 'Bearer ' + directorToken)
        .send({ name: 'Test Building', address: '123 Main St' });
      building = await Building.findById(buildingRes.body._id);

      await request(app)
        .patch(`/api/buildings/${building._id}/assign-manager`)
        .set('Authorization', 'Bearer ' + directorToken)
        .send({ managerId: manager._id.toString() });

      const apartmentRes = await request(app)
        .post(`/api/buildings/${building._id}/apartments`)
        .set('Authorization', 'Bearer ' + managerToken)
        .send({ unitNumber: '101', address: '123 Main St, Unit 101' });
      apartment = await Apartment.findById(apartmentRes.body._id);

      // Assign tenant to apartment
      await request(app)
        .post(`/api/tenants/${tenant._id}/assign`)
        .set('Authorization', 'Bearer ' + managerToken)
        .send({ apartmentId: apartment._id.toString(), buildingId: building._id.toString(), numPeople: 2 });

      // Create issues
      const issue1Res = await request(app)
        .post('/api/issues')
        .set('Authorization', 'Bearer ' + tenantToken)
        .send({ title: 'Leaking faucet', description: 'Kitchen faucet is leaking', priority: 'high' });
      assignedIssue1 = await Issue.findById(issue1Res.body.issue._id);

      const issue2Res = await request(app)
        .post('/api/issues')
        .set('Authorization', 'Bearer ' + tenantToken)
        .send({ title: 'Broken window', description: 'Bedroom window cracked', priority: 'medium' });
      assignedIssue2 = await Issue.findById(issue2Res.body.issue._id);

      const issue3Res = await request(app)
        .post('/api/issues')
        .set('Authorization', 'Bearer ' + tenantToken)
        .send({ title: 'Light bulb out', description: 'Hallway light needs replacement', priority: 'low' });
      unassignedIssue = await Issue.findById(issue3Res.body.issue._id);

      // Assign issues to associate1
      assignedIssue1.assignedTo = associate1._id;
      assignedIssue1.status = 'assigned';
      await assignedIssue1.save();

      assignedIssue2.assignedTo = associate1._id;
      assignedIssue2.status = 'assigned';
      await assignedIssue2.save();
    });

    it('should return only jobs assigned to the authenticated associate', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body.every(job => job.assignedTo._id === associate1._id.toString())).toBe(true);
      expect(res.body.find(j => j._id === assignedIssue1._id.toString())).toBeTruthy();
      expect(res.body.find(j => j._id === assignedIssue2._id.toString())).toBeTruthy();
    });

    it('should populate apartment and building details', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      const job = res.body[0];
      expect(job.apartment).toBeDefined();
      expect(job.apartment.unitNumber).toBe('101');
      expect(job.building).toBeDefined();
      expect(job.building.name).toBe('Test Building');
    });

    it('should populate createdBy (tenant) details', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      const job = res.body[0];
      expect(job.createdBy).toBeDefined();
      expect(job.createdBy.firstName).toBe('Tenant');
      expect(job.createdBy.lastName).toBe('One');
      expect(job.createdBy.password).toBeUndefined();
    });

    it('should filter jobs by status (query param)', async () => {
      // Change one issue to 'in-progress'
      assignedIssue1.status = 'in-progress';
      await assignedIssue1.save();

      const res = await request(app)
        .get('/api/associates/me/jobs?status=assigned')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('assigned');
    });

    it('should filter jobs by priority (query param)', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs?priority=high')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].priority).toBe('high');
    });

    it('should sort jobs by newest first (default)', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const dates = res.body.map(j => new Date(j.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should return empty array if associate has no assigned jobs', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + associate2Token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/associates/me/jobs');
      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not an associate', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + directorToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Only associates can view their jobs');
    });

    it('should include all job fields', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', 'Bearer ' + associate1Token);

      expect(res.status).toBe(200);
      const job = res.body[0];
      expect(job._id).toBeDefined();
      expect(job.title).toBeDefined();
      expect(job.description).toBeDefined();
      expect(job.priority).toBeDefined();
      expect(job.status).toBeDefined();
      expect(job.assignedTo).toBeDefined();
      expect(job.assignedTo._id).toBe(associate1._id.toString());
      expect(job.createdAt).toBeDefined();
    });
  });
});
