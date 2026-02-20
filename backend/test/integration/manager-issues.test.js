/* eslint-disable max-nested-callbacks */
require('dotenv').config();
const _mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const _Apartment = require('../../models/Apartment');
const _Building = require('../../models/Building');
const Issue = require('../../models/Issue');
const _User = require('../../models/User');
const {
  cleanCollections,
  createDirector,
  createManager,
  createTenant,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant,
  createIssue,
  apiGet
} = require('../helpers');
const { _getData, _assertSuccess, assertError } = require('../helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('../setup');

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

/**
 * Setup two buildings with managers, tenants, and issues
 */
async function setupTwoBuildingScenario() {
  const director = await createDirector({ username: 'director1', email: 'director1@test.com' });

  const mgr1 = await createManager(director.token, {
    username: 'manager1',
    email: 'manager1@test.com'
  });
  const mgr2 = await createManager(director.token, {
    username: 'manager2',
    email: 'manager2@test.com'
  });

  const bld1 = await createBuilding(director.token, { name: 'Building A', address: '123 Main St' });
  const bld2 = await createBuilding(director.token, { name: 'Building B', address: '456 Oak Ave' });

  await assignManager(director.token, bld1, mgr1._id);
  await assignManager(director.token, bld2, mgr2._id);

  const apt1 = await createApartment(mgr1.token, bld1, '101');
  const _apt2 = await createApartment(mgr1.token, bld1, '102');
  const _apt3 = await createApartment(mgr2.token, bld2, '201');

  const ten1 = await createTenant({ username: 'tenant1', email: 'tenant1@test.com' });
  const ten2 = await createTenant({ username: 'tenant2', email: 'tenant2@test.com' });

  await assignTenant(mgr1.token, {
    tenantId: ten1._id,
    apartmentId: apt1,
    buildingId: bld1,
    numPeople: 2
  });
  await assignTenant(mgr2.token, {
    tenantId: ten2._id,
    apartmentId: _apt3,
    buildingId: bld2,
    numPeople: 3
  });

  const iss1 = await createIssue(ten1.token, {
    title: 'Broken faucet',
    description: 'Kitchen faucet is leaking',
    priority: 'high'
  });
  const iss2 = await createIssue(ten1.token, {
    title: 'Light bulb out',
    description: 'Living room light needs replacement',
    priority: 'low'
  });
  const iss3 = await createIssue(ten2.token, {
    title: 'Heating not working',
    description: 'No heat in apartment',
    priority: 'high'
  });

  return {
    directorToken: director.token,
    manager1Token: mgr1.token,
    manager2Token: mgr2.token,
    tenant1Token: ten1.token,
    tenant2Token: ten2.token,
    building1: bld1,
    building2: bld2,
    issue1: iss1,
    issue2: iss2,
    issue3: iss3
  };
}

describe('Phase 2.5: Manager Views Tenant-Reported Issues', () => {
  describe('GET /api/issues', () => {
    let ctx;

    beforeEach(async () => {
      await cleanCollections();
      ctx = await setupTwoBuildingScenario();
    });

    it("should return issues only from manager's assigned buildings", async () => {
      const data = await apiGet('/api/issues', ctx.manager1Token);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);

      const titles = data.map((i) => i.title);
      expect(titles).toContain('Broken faucet');
      expect(titles).toContain('Light bulb out');
      expect(titles).not.toContain('Heating not working');
    });

    it('should populate tenant, apartment, and building details', async () => {
      const data = await apiGet('/api/issues', ctx.manager1Token);

      expect(data[0].createdBy).toBeDefined();
      expect(data[0].createdBy.firstName).toBe('Tenant');
      expect(data[0].apartment).toBeDefined();
      expect(data[0].apartment.unitNumber).toBe('101');
      expect(data[0].building).toBeDefined();
      expect(data[0].building.name).toBe('Building A');
    });

    it('should filter issues by status', async () => {
      await Issue.findByIdAndUpdate(ctx.issue1, { status: 'forwarded' });

      const data = await apiGet('/api/issues?status=reported', ctx.manager1Token);

      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Light bulb out');
    });

    it('should filter issues by priority', async () => {
      const data = await apiGet('/api/issues?priority=high', ctx.manager1Token);

      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Broken faucet');
    });

    it('should sort issues by newest first (default)', async () => {
      const data = await apiGet('/api/issues', ctx.manager1Token);

      expect(data.length).toBe(2);
      expect(data[0].title).toBe('Light bulb out');
      expect(data[1].title).toBe('Broken faucet');
    });

    it('should return empty array if manager has no buildings', async () => {
      const mgr3 = await createManager(ctx.directorToken, {
        username: 'manager3',
        email: 'manager3@test.com'
      });

      const data = await apiGet('/api/issues', mgr3.token);

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
      const data = await apiGet('/api/issues', ctx.manager1Token);

      expect(data.length).toBe(2);
    });

    it('should not expose tenant password or sensitive data', async () => {
      const data = await apiGet('/api/issues', ctx.manager1Token);

      expect(data[0].createdBy.password).toBeUndefined();
    });
  });
});
