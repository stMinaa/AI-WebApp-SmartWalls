/* eslint-disable max-nested-callbacks, max-statements */
/**
 * Director Operations Tests
 * Tests for director-specific endpoints: buildings, manager assignment, staff approvals
 */

const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../../index');
const _Building = require('../../models/Building');
const User = require('../../models/User');
const {
  cleanCollections,
  signupUser,
  _loginUser,
  createBuilding,
  approveUser,
  apiPost,
  apiGet,
  apiPatch
} = require('../helpers');
const { _getData, assertSuccess, assertError } = require('../helpers/responseHelpers');
const { connectTestDB, disconnectTestDB } = require('../setup');

// ========================================
// Test Data Fixtures
// ========================================
const TEST_USERS = {
  director: {
    username: 'testdirektor',
    email: 'director@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Director',
    role: 'director'
  },
  manager: {
    username: 'testmanager',
    email: 'manager@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Manager',
    role: 'manager'
  },
  associate: {
    username: 'testassociate',
    email: 'associate@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Associate',
    role: 'associate'
  },
  tenant: {
    username: 'testtenant',
    email: 'tenant@test.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'Tenant',
    role: 'tenant'
  }
};

const TEST_BUILDING = {
  name: 'Test Zgrada 1',
  address: 'Bulevar Kralja Aleksandra 73, Beograd'
};

// ========================================
// Test Suite
// ========================================

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Director Operations', () => {
  let director;
  let manager;
  let associate;
  let tenant;

  beforeEach(async () => {
    // Clean all collections
    await cleanCollections();

    // Create test users (signupUser returns { _id, token })
    director = await signupUser(TEST_USERS.director);
    manager = await signupUser(TEST_USERS.manager);
    associate = await signupUser(TEST_USERS.associate);
    tenant = await signupUser(TEST_USERS.tenant);
  });

  // ========================================
  // Group 1: Building Creation
  // ========================================
  describe('POST /api/buildings - Create Building', () => {
    test('Should create building with valid data', async () => {
      const data = await apiPost('/api/buildings', director.token, TEST_BUILDING, 201);

      expect(data).toHaveProperty('_id');
      expect(data.name).toBe(TEST_BUILDING.name);
      expect(data.address).toBe(TEST_BUILDING.address);
    });

    test('Should reject building without name', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${director.token}`)
        .send({ address: TEST_BUILDING.address });

      assertError(res, 400, 'Building name');
    });

    test('Should reject building without address', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${director.token}`)
        .send({ name: TEST_BUILDING.name });

      assertError(res, 400, 'Address');
    });

    test('Should reject request without director token', async () => {
      const res = await request(app).post('/api/buildings').send(TEST_BUILDING);

      assertError(res, 401);
    });

    test('Should reject request from non-director role', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${tenant.token}`)
        .send(TEST_BUILDING);

      assertError(res, 403);
    });
  });

  // ========================================
  // Group 2: Manager Assignment
  // ========================================
  describe('PATCH /api/buildings/:id/assign-manager - Assign Manager to Building', () => {
    let buildingId;

    beforeEach(async () => {
      // Create building and approve manager
      buildingId = await createBuilding(director.token, {
        name: 'Test Zgrada',
        address: 'Test Adresa 123'
      });
      await approveUser(director.token, manager._id);
    });

    test('Should assign manager to building', async () => {
      const data = await apiPatch(`/api/buildings/${buildingId}/assign-manager`, director.token, {
        managerId: manager._id
      });

      expect(data.manager).toBeDefined();
      expect(String(data.manager._id)).toBe(String(manager._id));
    });

    test('Should reject assignment with invalid building ID', async () => {
      const res = await request(app)
        .patch('/api/buildings/invalid-id/assign-manager')
        .set('Authorization', `Bearer ${director.token}`)
        .send({ managerId: manager._id });

      assertError(res, 500);
    });

    test('Should reject assignment with non-existent manager', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${director.token}`)
        .send({ managerId: fakeId });

      assertError(res, 404);
    });

    test('Should reject assignment if user is not manager role', async () => {
      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${director.token}`)
        .send({ managerId: tenant._id });

      assertError(res, 400, 'Invalid manager');
    });

    test('Should reject request from non-director user', async () => {
      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${tenant.token}`)
        .send({ managerId: manager._id });

      assertError(res, 403);
    });
  });

  // ========================================
  // Group 3: View Pending Staff
  // ========================================
  describe('GET /api/users/pending - View Pending Staff', () => {
    test('Should return pending users for director', async () => {
      const data = await apiGet('/api/users/pending', director.token);

      expect(Array.isArray(data)).toBe(true);

      // Check that all returned users have pending status
      data.forEach((user) => {
        expect(user.status).toBe('pending');
      });
    });

    test('Should reject request from tenant (not manager/director)', async () => {
      const res = await request(app)
        .get('/api/users/pending')
        .set('Authorization', `Bearer ${tenant.token}`);

      assertError(res, 403);
    });
  });

  // ========================================
  // Group 4: Approve Staff
  // ========================================
  describe('PATCH /api/users/:id/approve - Approve Staff', () => {
    test('Should approve pending manager', async () => {
      const result = await approveUser(director.token, manager._id);

      expect(result.user.status).toBe('active');
    });

    test('Should approve pending associate', async () => {
      const result = await approveUser(director.token, associate._id);

      expect(result.user.status).toBe('active');
    });

    test('Should reject approval of already active user', async () => {
      // Approve once
      await approveUser(director.token, manager._id);

      // Try to approve again
      const res = await request(app)
        .patch(`/api/users/${manager._id}/approve`)
        .set('Authorization', `Bearer ${director.token}`);

      assertError(res, 400, 'already');
    });

    test('Should reject approval of non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/users/${fakeId}/approve`)
        .set('Authorization', `Bearer ${director.token}`);

      assertError(res, 404);
    });

    test('Should reject approval from non-director/non-manager', async () => {
      const res = await request(app)
        .patch(`/api/users/${manager._id}/approve`)
        .set('Authorization', `Bearer ${tenant.token}`);

      assertError(res, 403);
    });

    test('Should handle invalid user ID gracefully', async () => {
      const res = await request(app)
        .patch('/api/users/invalid-id/approve')
        .set('Authorization', `Bearer ${director.token}`);

      assertError(res, 500);
    });
  });

  // ========================================
  // Group 5: Delete User
  // ========================================
  describe('DELETE /api/users/:id - Delete User', () => {
    test('Should delete user by ID', async () => {
      const res = await request(app)
        .delete(`/api/users/${tenant._id}`)
        .set('Authorization', `Bearer ${director.token}`);

      assertSuccess(res, 200);
      expect(res.body.message).toContain('deleted');

      // Verify user is deleted from database
      const user = await User.findById(tenant._id);
      expect(user).toBeNull();
    });

    test('Should reject deletion of non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${director.token}`);

      assertError(res, 404);
    });

    test('Should reject deletion from non-director', async () => {
      const res = await request(app)
        .delete(`/api/users/${manager._id}`)
        .set('Authorization', `Bearer ${tenant.token}`);

      assertError(res, 403);
    });

    test('Should handle invalid user ID', async () => {
      const res = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${director.token}`);

      assertError(res, 500);
    });
  });
});
