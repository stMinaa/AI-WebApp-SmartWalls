require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
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
 * Setup one building with two tenants and their issues
 */
async function setupTenantIssueScenario() {
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
  await assignTenant(mgr.token, { tenantId: ten2._id, apartmentId: apt2, buildingId: bld, numPeople: 3 });

  const iss1 = await createIssue(ten1.token, { title: 'Broken faucet', description: 'Kitchen faucet is leaking', priority: 'high' });
  const iss2 = await createIssue(ten1.token, { title: 'Light bulb out', description: 'Living room light needs replacement', priority: 'low' });
  const iss3 = await createIssue(ten2.token, { title: 'Heating not working', description: 'No heat in apartment', priority: 'high' });

  return {
    directorToken: director.token,
    managerToken: mgr.token,
    tenant1Token: ten1.token, tenant2Token: ten2.token,
    building: bld,
    issue1: iss1, issue2: iss2, issue3: iss3
  };
}

describe('Phase 3.3: Tenant Views Their Own Issues', () => {
  describe('GET /api/issues/my', () => {
    let ctx;

    beforeEach(async () => {
      await cleanCollections();
      ctx = await setupTenantIssueScenario();
    });

    it('should return only issues created by the authenticated tenant', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);

      const issueTitles = data.map(i => i.title);
      expect(issueTitles).toContain('Broken faucet');
      expect(issueTitles).toContain('Light bulb out');
      expect(issueTitles).not.toContain('Heating not working');
    });

    it('should populate apartment and building details', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data[0].apartment).toBeDefined();
      expect(data[0].apartment.unitNumber).toBe('101');
      expect(data[0].building).toBeDefined();
      expect(data[0].building.name).toBe('Test Building');
    });

    it('should filter issues by status', async () => {
      await Issue.findByIdAndUpdate(ctx.issue1, { status: 'forwarded' });

      const res = await request(app)
        .get('/api/issues/my?status=reported')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Light bulb out');
      expect(data[0].status).toBe('reported');
    });

    it('should filter issues by priority', async () => {
      const res = await request(app)
        .get('/api/issues/my?priority=high')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Broken faucet');
      expect(data[0].priority).toBe('high');
    });

    it('should sort issues by newest first (default)', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(2);
      expect(data[0].title).toBe('Light bulb out');
      expect(data[1].title).toBe('Broken faucet');
    });

    it('should return empty array if tenant has no issues', async () => {
      const ten3 = await signupUser({ username: 'tenant3', email: 'tenant3@test.com', password: 'password123', role: 'tenant', firstName: 'Tenant', lastName: 'Three' });

      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ten3.token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/issues/my');
      assertError(res, 401);
    });

    it('should return 403 if user is not a tenant', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ctx.managerToken}`);

      assertError(res, 403);
      expect(res.body.error).toMatch(/Only tenants/i);
    });

    it('should include all issue fields', async () => {
      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      const issue = data[0];
      expect(issue._id).toBeDefined();
      expect(issue.title).toBeDefined();
      expect(issue.description).toBeDefined();
      expect(issue.priority).toBeDefined();
      expect(issue.status).toBeDefined();
      expect(issue.createdAt).toBeDefined();
    });

    it('should work for tenants even if not assigned to apartment', async () => {
      const ten3 = await signupUser({ username: 'tenant3', email: 'tenant3@test.com', password: 'password123', role: 'tenant', firstName: 'Tenant', lastName: 'Three' });

      const res = await request(app)
        .get('/api/issues/my')
        .set('Authorization', `Bearer ${ten3.token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data).toEqual([]);
    });
  });
});
