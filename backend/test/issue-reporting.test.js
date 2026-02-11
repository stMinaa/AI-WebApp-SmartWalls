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

      expect(res.status).toBe(201);
      expect(res.body.issue).toBeDefined();
      expect(res.body.issue.title).toBe('Broken faucet');
      expect(res.body.issue.description).toBe('Kitchen faucet is leaking water');
      expect(res.body.issue.priority).toBe('high');
      expect(res.body.issue.status).toBe('reported');
      expect(res.body.issue.createdBy.toString()).toBe(ctx.tenant1Id.toString());
      expect(res.body.issue.building.toString()).toBe(ctx.building);
      expect(res.body.issue.apartment.toString()).toBe(ctx.apartment1);
      expect(res.body.issue.createdAt).toBeDefined();
    });

    it('should default priority to medium if not provided', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Minor issue', description: 'Light bulb needs replacement' });

      expect(res.status).toBe(201);
      expect(res.body.issue.priority).toBe('medium');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ description: 'Some description' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Title');
    });

    it('should return 400 if description is missing', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Some title' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Description');
    });

    it('should return 400 if priority is invalid', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: 'Test issue', description: 'Test description', priority: 'critical' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority/i);
    });

    it('should return 404 if tenant not assigned to apartment', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant2Token}`)
        .send({ title: 'Test issue', description: 'Test description' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not assigned/i);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/issues')
        .send({ title: 'Test issue', description: 'Test description' });

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not a tenant', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.managerToken}`)
        .send({ title: 'Test issue', description: 'Test description' });

      expect(res.status).toBe(403);
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

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.issue._id).not.toBe(res2.body.issue._id);

      const issueCount = await Issue.countDocuments({ createdBy: ctx.tenant1Id });
      expect(issueCount).toBe(2);
    });

    it('should trim whitespace from title and description', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`)
        .send({ title: '  Broken window  ', description: '  Window is cracked  ' });

      expect(res.status).toBe(201);
      expect(res.body.issue.title).toBe('Broken window');
      expect(res.body.issue.description).toBe('Window is cracked');
    });
  });
});
