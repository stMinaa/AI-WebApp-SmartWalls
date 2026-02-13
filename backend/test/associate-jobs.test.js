const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { connectTestDB, disconnectTestDB } = require('./setup');
const {
  cleanCollections, signupUser, approveUser,
  createBuilding, assignManager, createApartment,
  assignTenant, createIssue
} = require('./helpers');
const { getData, assertSuccess, assertError } = require('./helpers/responseHelpers');

jest.setTimeout(60000);

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

/**
 * Setup building with two associates (one with assigned jobs, one without)
 */
async function setupAssociateJobsScenario() {
  const director = await signupUser({ username: 'director1', password: 'password', email: 'director1@test.com', role: 'director', firstName: 'Director', lastName: 'One' });

  const assoc1 = await signupUser({ username: 'associate1', password: 'password', email: 'associate1@test.com', role: 'associate', firstName: 'Associate', lastName: 'One' });
  await approveUser(director.token, assoc1._id);

  const assoc2 = await signupUser({ username: 'associate2', password: 'password', email: 'associate2@test.com', role: 'associate', firstName: 'Associate', lastName: 'Two' });
  await approveUser(director.token, assoc2._id);

  const mgr = await signupUser({ username: 'manager1', password: 'password', email: 'manager1@test.com', role: 'manager', firstName: 'Manager', lastName: 'One' });
  await approveUser(director.token, mgr._id);

  const tenant = await signupUser({ username: 'tenant1', password: 'password', email: 'tenant1@test.com', role: 'tenant', firstName: 'Tenant', lastName: 'One' });

  const bld = await createBuilding(director.token, { name: 'Test Building', address: '123 Main St' });
  await assignManager(director.token, bld, mgr._id);
  const apt = await createApartment(mgr.token, bld, '101');
  await assignTenant(mgr.token, { tenantId: tenant._id, apartmentId: apt, buildingId: bld, numPeople: 2 });

  const iss1 = await createIssue(tenant.token, { title: 'Leaking faucet', description: 'Kitchen faucet is leaking', priority: 'high' });
  const iss2 = await createIssue(tenant.token, { title: 'Broken window', description: 'Bedroom window cracked', priority: 'medium' });
  const iss3 = await createIssue(tenant.token, { title: 'Light bulb out', description: 'Hallway light needs replacement', priority: 'low' });

  // Assign 2 issues to associate1 directly via DB
  const associate1Doc = await User.findOne({ username: 'associate1' });
  await Issue.findByIdAndUpdate(iss1, { assignedTo: associate1Doc._id, status: 'assigned' });
  await Issue.findByIdAndUpdate(iss2, { assignedTo: associate1Doc._id, status: 'assigned' });

  return {
    directorToken: director.token,
    associate1Token: assoc1.token, associate1Id: associate1Doc._id.toString(),
    associate2Token: assoc2.token,
    issue1: iss1, issue2: iss2, unassignedIssue: iss3
  };
}

describe('Phase 4.1: Associate Views Assigned Jobs', () => {
  describe('GET /api/associates/me/jobs', () => {
    let ctx;

    beforeEach(async () => {
      await cleanCollections();
      ctx = await setupAssociateJobsScenario();
    });

    it('should return only jobs assigned to the authenticated associate', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data.every(job => job.assignedTo._id === ctx.associate1Id)).toBe(true);
    });

    it('should populate apartment and building details', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      const job = data[0];
      expect(job.apartment).toBeDefined();
      expect(job.apartment.unitNumber).toBe('101');
      expect(job.building).toBeDefined();
      expect(job.building.name).toBe('Test Building');
    });

    it('should populate createdBy (tenant) details', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      const job = data[0];
      expect(job.createdBy).toBeDefined();
      expect(job.createdBy.firstName).toBe('Tenant');
      expect(job.createdBy.lastName).toBe('One');
      expect(job.createdBy.password).toBeUndefined();
    });

    it('should filter jobs by status (query param)', async () => {
      await Issue.findByIdAndUpdate(ctx.issue1, { status: 'in-progress' });

      const res = await request(app)
        .get('/api/associates/me/jobs?status=assigned')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(1);
      expect(data[0].status).toBe('assigned');
    });

    it('should filter jobs by priority (query param)', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs?priority=high')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(1);
      expect(data[0].priority).toBe('high');
    });

    it('should sort jobs by newest first (default)', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(2);
      const dates = data.map(j => new Date(j.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should return empty array if associate has no assigned jobs', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.associate2Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/associates/me/jobs');
      assertError(res, 401);
    });

    it('should return 403 if user is not an associate', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.directorToken}`);

      assertError(res, 403, 'Only associates can view their jobs');
    });

    it('should include all job fields', async () => {
      const res = await request(app)
        .get('/api/associates/me/jobs')
        .set('Authorization', `Bearer ${ctx.associate1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      const job = data[0];
      expect(job._id).toBeDefined();
      expect(job.title).toBeDefined();
      expect(job.description).toBeDefined();
      expect(job.priority).toBeDefined();
      expect(job.status).toBeDefined();
      expect(job.assignedTo).toBeDefined();
      expect(job.assignedTo._id).toBe(ctx.associate1Id);
      expect(job.createdAt).toBeDefined();
    });
  });
});
