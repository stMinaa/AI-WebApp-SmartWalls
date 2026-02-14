/**
 * Issue Triage Tests (TDD RED -> GREEN -> BLUE)
 * Tests for manager triage endpoint: forward, reject, assign to associate
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
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

describe('Issue Triage - PATCH /api/issues/:issueId/triage', () => {
  let directorToken, managerToken, tenantToken;
  let issueId;

  beforeEach(async () => {
    await cleanCollections();

    // Create users
    const director = await signupUser({ username: 'triagedir', email: 'triagedir@test.com', password: 'Test123!', firstName: 'Triage', lastName: 'Director', role: 'director' });
    directorToken = director.token;

    const manager = await signupUser({ username: 'triagemgr', email: 'triagemgr@test.com', password: 'Test123!', firstName: 'Triage', lastName: 'Manager', role: 'manager' });
    await approveUser(directorToken, manager._id);
    managerToken = manager.token;

    const associate = await signupUser({ username: 'triageassoc', email: 'triageassoc@test.com', password: 'Test123!', firstName: 'Triage', lastName: 'Associate', role: 'associate' });
    await approveUser(directorToken, associate._id);

    const tenant = await signupUser({ username: 'triagetenant', email: 'triagetenant@test.com', password: 'Test123!', firstName: 'Triage', lastName: 'Tenant', role: 'tenant' });
    tenantToken = tenant.token;

    // Setup building -> apartment -> tenant -> issue
    const buildingId = await createBuilding(directorToken, { name: 'Triage Zgrada', address: 'Triage Ulica 1' });
    await assignManager(directorToken, buildingId, manager._id);
    const apartmentId = await createApartment(managerToken, buildingId, '101');
    await assignTenant(managerToken, { tenantId: tenant._id, apartmentId, buildingId });
    issueId = await createIssue(tenantToken, { title: 'Curi voda u kupatilu', description: 'Slavina curi vec tri dana', priority: 'high' });
  });

  test('should forward an issue (action=forward)', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'forward' });
    assertSuccess(res, 200);
    const data = getData(res);
    expect(data.status).toBe('forwarded');
  });

  test('should reject an issue (action=reject)', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'reject' });
    assertSuccess(res, 200);
    const data = getData(res);
    expect(data.status).toBe('rejected');
  });

  test('should assign issue to associate (action=assign)', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'assign', assignedTo: 'triageassoc' });
    assertSuccess(res, 200);
    const data = getData(res);
    expect(data.status).toBe('assigned');
    expect(data.assignedTo).toBeDefined();
  });

  test('should return 400 for invalid action', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'invalid_action' });
    assertError(res, 400);
  });

  test('should return 401 without token', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`);
    assertError(res, 401);
  });

  test('should return 403 for non-manager (tenant)', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ action: 'forward' });
    assertError(res, 403);
  });

  test('should return 404 for non-existent issue', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/issues/${fakeId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'forward' });
    assertError(res, 404);
  });

  test('should return 400 when assigning to non-existent associate', async () => {
    const res = await request(app)
      .patch(`/api/issues/${issueId}/triage`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'assign', assignedTo: 'nonexistent_user' });
    assertError(res, 400);
  });
});
