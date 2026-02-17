/* eslint-disable max-nested-callbacks */
const _mongoose = require('mongoose');
const request = require('supertest');

const app = require('../index');
const Issue = require('../models/Issue');
const User = require('../models/User');

const {
  cleanCollections,
  createDirector,
  createManager,
  createTenant,
  createAssociate,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant,
  createIssue,
  apiGet
} = require('./helpers');
const { _getData, _assertSuccess, assertError } = require('./helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('./setup');

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

/**
 * Setup building with two associates (one with assigned jobs, one without)
 */
async function setupAssociateJobsScenario() {
  const director = await createDirector({ username: 'director1', email: 'director1@test.com' });

  const assoc1 = await createAssociate(director.token, {
    username: 'associate1',
    email: 'associate1@test.com'
  });
  const assoc2 = await createAssociate(director.token, {
    username: 'associate2',
    email: 'associate2@test.com'
  });

  const mgr = await createManager(director.token, {
    username: 'manager1',
    email: 'manager1@test.com'
  });
  const tenant = await createTenant({
    username: 'tenant1',
    email: 'tenant1@test.com',
    firstName: 'Tenant',
    lastName: 'One'
  });

  const bld = await createBuilding(director.token, {
    name: 'Test Building',
    address: '123 Main St'
  });
  await assignManager(director.token, bld, mgr._id);
  const apt = await createApartment(mgr.token, bld, '101');
  await assignTenant(mgr.token, {
    tenantId: tenant._id,
    apartmentId: apt,
    buildingId: bld,
    numPeople: 2
  });

  const iss1 = await createIssue(tenant.token, {
    title: 'Leaking faucet',
    description: 'Kitchen faucet is leaking',
    priority: 'high'
  });
  const iss2 = await createIssue(tenant.token, {
    title: 'Broken window',
    description: 'Bedroom window cracked',
    priority: 'medium'
  });
  const iss3 = await createIssue(tenant.token, {
    title: 'Light bulb out',
    description: 'Hallway light needs replacement',
    priority: 'low'
  });

  // Assign 2 issues to associate1 directly via DB
  const associate1Doc = await User.findOne({ username: 'associate1' });
  await Issue.findByIdAndUpdate(iss1, { assignedTo: associate1Doc._id, status: 'assigned' });
  await Issue.findByIdAndUpdate(iss2, { assignedTo: associate1Doc._id, status: 'assigned' });

  return {
    directorToken: director.token,
    associate1Token: assoc1.token,
    associate1Id: associate1Doc._id.toString(),
    associate2Token: assoc2.token,
    issue1: iss1,
    issue2: iss2,
    unassignedIssue: iss3
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
      const data = await apiGet('/api/associates/me/jobs', ctx.associate1Token);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data.every((job) => job.assignedTo._id === ctx.associate1Id)).toBe(true);
    });

    it('should populate apartment and building details', async () => {
      const data = await apiGet('/api/associates/me/jobs', ctx.associate1Token);

      const job = data[0];
      expect(job.apartment).toBeDefined();
      expect(job.apartment.unitNumber).toBe('101');
      expect(job.building).toBeDefined();
      expect(job.building.name).toBe('Test Building');
    });

    it('should populate createdBy (tenant) details', async () => {
      const data = await apiGet('/api/associates/me/jobs', ctx.associate1Token);

      const job = data[0];
      expect(job.createdBy).toBeDefined();
      expect(job.createdBy.firstName).toBe('Tenant');
      expect(job.createdBy.lastName).toBe('One');
      expect(job.createdBy.password).toBeUndefined();
    });

    it('should filter jobs by status (query param)', async () => {
      await Issue.findByIdAndUpdate(ctx.issue1, { status: 'in-progress' });

      const data = await apiGet('/api/associates/me/jobs?status=assigned', ctx.associate1Token);

      expect(data.length).toBe(1);
      expect(data[0].status).toBe('assigned');
    });

    it('should filter jobs by priority (query param)', async () => {
      const data = await apiGet('/api/associates/me/jobs?priority=high', ctx.associate1Token);

      expect(data.length).toBe(1);
      expect(data[0].priority).toBe('high');
    });

    it('should sort jobs by newest first (default)', async () => {
      const data = await apiGet('/api/associates/me/jobs', ctx.associate1Token);

      expect(data.length).toBe(2);
      const dates = data.map((j) => new Date(j.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should return empty array if associate has no assigned jobs', async () => {
      const data = await apiGet('/api/associates/me/jobs', ctx.associate2Token);

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
      const data = await apiGet('/api/associates/me/jobs', ctx.associate1Token);

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
