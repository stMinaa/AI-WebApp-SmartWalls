/* eslint-disable max-nested-callbacks */
/**
 * Phase 4.2: Associate accepts job with cost estimate
 * Tests for POST /api/issues/:id/accept
 */

const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const Apartment = require('../../models/Apartment');
const Building = require('../../models/Building');
const Issue = require('../../models/Issue');
const {
  cleanCollections,
  createDirector,
  createManager,
  createTenant,
  createAssociate,
  getIssueFromDB
} = require('../helpers');
const { getData } = require('../helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('../setup');

let associate1, _associate2, manager, tenant;
let directorToken, associate1Token, associate2Token, _managerToken, tenantToken;
let building, apartment, assignedIssue, _unassignedIssue;

async function _createTestUsers(dToken) {
  const assoc1 = await createAssociate(dToken, {
    username: 'associate1',
    email: 'associate1@test.com',
    password: 'password123',
    firstName: 'Associate',
    lastName: 'One',
    company: 'Plumbing Co'
  });
  associate1Token = assoc1.token;
  associate1 = { _id: assoc1._id };

  const assoc2 = await createAssociate(dToken, {
    username: 'associate2',
    email: 'associate2@test.com',
    password: 'password123',
    firstName: 'Associate',
    lastName: 'Two',
    company: 'Electric Co'
  });
  associate2Token = assoc2.token;
  _associate2 = { _id: assoc2._id };

  const mgr = await createManager(dToken, {
    username: 'manager1',
    email: 'manager1@test.com',
    password: 'password123',
    firstName: 'Manager',
    lastName: 'One',
    company: 'Management Co'
  });
  _managerToken = mgr.token;
  manager = { _id: mgr._id };

  const ten = await createTenant({
    username: 'tenant1',
    email: 'tenant1@test.com',
    password: 'password123',
    firstName: 'Tenant',
    lastName: 'One'
  });
  tenantToken = ten.token;
  tenant = { _id: ten._id };
}

async function _createTestData() {
  building = await Building.create({
    name: 'Test Building',
    address: '123 Test St',
    manager: manager._id
  });

  apartment = await Apartment.create({
    building: building._id,
    unitNumber: '101',
    address: '123 Test St, Apt 101',
    numPeople: 2,
    tenant: tenant._id
  });

  assignedIssue = await Issue.create({
    apartment: apartment._id,
    building: building._id,
    createdBy: tenant._id,
    title: 'Leaking faucet',
    description: 'Kitchen faucet is leaking',
    priority: 'high',
    status: 'assigned',
    assignedTo: associate1._id
  });

  _unassignedIssue = await Issue.create({
    apartment: apartment._id,
    building: building._id,
    createdBy: tenant._id,
    title: 'Broken window',
    description: 'Bedroom window is broken',
    priority: 'medium',
    status: 'reported'
  });
}

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

describe('Phase 4.2: Associate Accepts Job with Cost Estimate', () => {
  describe('POST /api/issues/:id/accept', () => {
    beforeEach(async () => {
      await cleanCollections();
      const director = await createDirector({
        username: 'director1',
        email: 'director1@test.com',
        password: 'password123'
      });
      directorToken = director.token;
      await _createTestUsers(directorToken);
      await _createTestData();
    });

    it('should accept job and update status to in-progress with cost', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ estimatedCost: 150 });

      expect(res.status).toBe(200);
      const data = getData(res);
      expect(data.status).toBe('in-progress');
      expect(data.cost).toBe(150);
      expect(data._id).toBe(assignedIssue._id.toString());

      const updated = await getIssueFromDB(assignedIssue._id);
      expect(updated.status).toBe('in-progress');
      expect(updated.cost).toBe(150);
    });

    it('should return updated issue with populated fields', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ estimatedCost: 200 });

      expect(res.status).toBe(200);
      const data = getData(res);
      expect(data.apartment).toBeDefined();
      expect(data.apartment.unitNumber).toBe('101');
      expect(data.building).toBeDefined();
      expect(data.building.name).toBe('Test Building');
      expect(data.createdBy).toBeDefined();
      expect(data.createdBy.email).toBe('tenant1@test.com');
      expect(data.createdBy.password).toBeUndefined();
    });

    it('should reject if estimatedCost is missing', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('estimatedCost');
    });

    it('should reject if estimatedCost is not a number', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ estimatedCost: 'not a number' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('estimatedCost');
    });

    it('should reject if estimatedCost is negative', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ estimatedCost: -50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('positive');
    });

    it('should reject if issue is not assigned to the associate', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate2Token) // Different associate
        .send({ estimatedCost: 100 });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('not assigned');
    });

    it('should reject if issue is not in assigned status', async () => {
      // Change status to in-progress
      assignedIssue.status = 'in-progress';
      await assignedIssue.save();

      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ estimatedCost: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .send({ estimatedCost: 100 });

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not an associate', async () => {
      const res = await request(app)
        .post(`/api/issues/${assignedIssue._id}/accept`)
        .set('Authorization', 'Bearer ' + tenantToken)
        .send({ estimatedCost: 100 });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/associate/i);
    });

    it('should return 404 if issue does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/issues/${fakeId}/accept`)
        .set('Authorization', 'Bearer ' + associate1Token)
        .send({ estimatedCost: 100 });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
