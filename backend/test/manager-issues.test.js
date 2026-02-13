require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
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
 * Setup two buildings with managers, tenants, and issues
 */
async function setupTwoBuildingScenario() {
  const director = await signupUser({ username: 'director1', email: 'director1@test.com', password: 'password123', role: 'director', firstName: 'Director', lastName: 'One' });

  const mgr1 = await signupUser({ username: 'manager1', email: 'manager1@test.com', password: 'password123', role: 'manager', firstName: 'Manager', lastName: 'One' });
  await approveUser(director.token, mgr1._id);

  const mgr2 = await signupUser({ username: 'manager2', email: 'manager2@test.com', password: 'password123', role: 'manager', firstName: 'Manager', lastName: 'Two' });
  await approveUser(director.token, mgr2._id);

  const bld1 = await createBuilding(director.token, { name: 'Building A', address: '123 Main St' });
  const bld2 = await createBuilding(director.token, { name: 'Building B', address: '456 Oak Ave' });

  await assignManager(director.token, bld1, mgr1._id);
  await assignManager(director.token, bld2, mgr2._id);

  const apt1 = await createApartment(mgr1.token, bld1, '101');
  const apt2 = await createApartment(mgr1.token, bld1, '102');
  const apt3 = await createApartment(mgr2.token, bld2, '201');

  const ten1 = await signupUser({ username: 'tenant1', email: 'tenant1@test.com', password: 'password123', role: 'tenant', firstName: 'Tenant', lastName: 'One' });
  const ten2 = await signupUser({ username: 'tenant2', email: 'tenant2@test.com', password: 'password123', role: 'tenant', firstName: 'Tenant', lastName: 'Two' });

  await assignTenant(mgr1.token, { tenantId: ten1._id, apartmentId: apt1, buildingId: bld1, numPeople: 2 });
  await assignTenant(mgr2.token, { tenantId: ten2._id, apartmentId: apt3, buildingId: bld2, numPeople: 3 });

  const iss1 = await createIssue(ten1.token, { title: 'Broken faucet', description: 'Kitchen faucet is leaking', priority: 'high' });
  const iss2 = await createIssue(ten1.token, { title: 'Light bulb out', description: 'Living room light needs replacement', priority: 'low' });
  const iss3 = await createIssue(ten2.token, { title: 'Heating not working', description: 'No heat in apartment', priority: 'high' });

  return {
    directorToken: director.token,
    manager1Token: mgr1.token, manager2Token: mgr2.token,
    tenant1Token: ten1.token, tenant2Token: ten2.token,
    building1: bld1, building2: bld2,
    issue1: iss1, issue2: iss2, issue3: iss3
  };
}

describe('Phase 2.5: Manager Views Tenant-Reported Issues', () => {
  describe('GET /api/issues', () => {
    let ctx;

    beforeEach(async () => {
      await cleanCollections();
      ctx = await setupTwoBuildingScenario();
    });

    it('should return issues only from manager\'s assigned buildings', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);

      const titles = data.map(i => i.title);
      expect(titles).toContain('Broken faucet');
      expect(titles).toContain('Light bulb out');
      expect(titles).not.toContain('Heating not working');
    });

    it('should populate tenant, apartment, and building details', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data[0].createdBy).toBeDefined();
      expect(data[0].createdBy.firstName).toBe('Tenant');
      expect(data[0].apartment).toBeDefined();
      expect(data[0].apartment.unitNumber).toBe('101');
      expect(data[0].building).toBeDefined();
      expect(data[0].building.name).toBe('Building A');
    });

    it('should filter issues by status', async () => {
      await Issue.findByIdAndUpdate(ctx.issue1, { status: 'forwarded' });

      const res = await request(app)
        .get('/api/issues?status=reported')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Light bulb out');
    });

    it('should filter issues by priority', async () => {
      const res = await request(app)
        .get('/api/issues?priority=high')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Broken faucet');
    });

    it('should sort issues by newest first (default)', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(2);
      expect(data[0].title).toBe('Light bulb out');
      expect(data[1].title).toBe('Broken faucet');
    });

    it('should return empty array if manager has no buildings', async () => {
      const mgr3 = await signupUser({ username: 'manager3', email: 'manager3@test.com', password: 'password123', role: 'manager', firstName: 'Manager', lastName: 'Three' });
      await approveUser(ctx.directorToken, mgr3._id);

      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${mgr3.token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/issues');
      assertError(res, 401);
    });

    it('should return 403 if user is not a manager', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${ctx.tenant1Token}`);

      assertError(res, 403);
      expect(res.body.message).toMatch(/Only managers and directors/i);
    });

    it('should include issue count in response', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data.length).toBe(2);
    });

    it('should not expose tenant password or sensitive data', async () => {
      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${ctx.manager1Token}`);

      assertSuccess(res, 200);
      const data = getData(res);
      expect(data[0].createdBy.password).toBeUndefined();
    });
  });
});
