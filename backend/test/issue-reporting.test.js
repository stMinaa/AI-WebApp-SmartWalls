require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Issue = require('../models/Issue');
const { connectTestDB, disconnectTestDB } = require('./setup');
const {
  cleanCollections, signupUser, approveUser,
  createBuilding, assignManager, createApartment,
  assignTenant
} = require('./helpers');
const { getData, assertSuccess, assertError } = require('./helpers/responseHelpers');

jest.setTimeout(60000);

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

/**
 * Setup building with one assigned tenant and one unassigned tenant
 */
async function setupIssueReportingScenario() {
  const director = await signupUser({ username: 'director1', email: 'director1@test.com', password: 'password123', role: 'director', firstName: 'Director', lastName: 'One' });

  const mgr = await signupUser({ username: 'manager1', email: 'manager1@test.com', password: 'password123', role: 'manager', firstName: 'Manager', lastName: 'One' });
  await approveUser(director.token, mgr._id);

  const bld = await createBuilding(director.token, { name: 'Test Building', address: '123 Main St' });
  await assignManager(director.token, bld, mgr._id);

  const apt1 = await createApartment(mgr.token, bld, '101');
  const apt2 = await createApartment(mgr.token, bld, '102');

  const ten1 = await signupUser({ username: 'tenant1', email: 'tenant1@test.com', password: 'password123', role: 'tenant', firstName: 'Tenant', lastName: 'One' });
  const ten2 = await signupUser({ username: 'tenant2', email: 'tenant2@test.com', password: 'password123', role: 'tenant', firstName: 'Tenant', lastName: 'Two' });

  await assignTenant(mgr.token, { tenantId: ten1._id, apartmentId: apt1, buildingId: bld, numPeople: 2 });

  return {
    directorToken: director.token,
    managerToken: mgr.token,
    tenant1Token: ten1.token, tenant1Id: ten1._id,
    tenant2Token: ten2.token,
    building: bld, apartment1: apt1, apartment2: apt2
  };
}

describe('Phase 3.2: Tenant Reports Issues', () => {
  describe('POST /api/issues', () => {
    let ctx;

    beforeEach(async () => {
      await cleanCollections();
      ctx = await setupIssueReportingScenario();
    });

    it('should create issue for assigned tenant with all required fields', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Broken faucet', description: 'Kitchen faucet is leaking water', priority: 'high' });

      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.issue).toBeDefined();
      expect(data.issue.title).toBe('Broken faucet');
      expect(data.issue.description).toBe('Kitchen faucet is leaking water');
      expect(data.issue.priority).toBe('high');
      expect(data.issue.status).toBe('reported');
      expect(data.issue.createdBy.toString()).toBe(ctx.tenant1Id.toString());
      expect(data.issue.building.toString()).toBe(ctx.building);
      expect(data.issue.apartment.toString()).toBe(ctx.apartment1);
      expect(data.issue.createdAt).toBeDefined();
    });

    it('should default priority to medium if not provided', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Minor issue', description: 'Light bulb needs replacement' });

      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.issue.priority).toBe('medium');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ description: 'Some description' });

      assertError(res, 400);
      expect(res.body.error).toContain('Title');
    });

    it('should return 400 if description is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Some title' });

      assertError(res, 400);
      expect(res.body.error).toContain('Description');
    });

    it('should return 400 if priority is invalid', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Test issue', description: 'Test description', priority: 'critical' });

      assertError(res, 400);
      expect(res.body.error).toMatch(/priority/i);
    });

    it('should return 404 if tenant not assigned to apartment', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant2Token}`)
        .send({ title: 'Test issue', description: 'Test description' });

      assertError(res, 404);
      expect(res.body.error).toMatch(/not assigned/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/issues')
        .send({ title: 'Test issue', description: 'Test description' });

      assertError(res, 401);
    });

    it('should return 403 if user is not a tenant', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.managerToken}`)
        .send({ title: 'Test issue', description: 'Test description' });

      assertError(res, 403);
      expect(res.body.error).toMatch(/Only tenants/i);
    });

    it('should create multiple issues for same tenant', async () => {
      const res1 = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Issue 1', description: 'Description 1', priority: 'low' });

      const res2 = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Issue 2', description: 'Description 2', priority: 'high' });

      assertSuccess(res1, 201);
      assertSuccess(res2, 201);
      expect(getData(res1).issue._id).not.toBe(getData(res2).issue._id);

      const issueCount = await Issue.countDocuments({ createdBy: ctx.tenant1Id });
      expect(issueCount).toBe(2);
    });

    it('should trim whitespace from title and description', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: '  Broken window  ', description: '  Window is cracked  ' });

      assertSuccess(res, 201);
      const data = getData(res);
      expect(data.issue.title).toBe('Broken window');
      expect(data.issue.description).toBe('Window is cracked');
    });
  });
});
