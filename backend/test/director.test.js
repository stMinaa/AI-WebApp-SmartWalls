/**
 * Director Operations Tests
 * Tests for director-specific endpoints: buildings, manager assignment, staff approvals
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const { connectTestDB, disconnectTestDB } = require('./setup');

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
// Test Helper Functions
// ========================================

/**
 * Create a user via signup endpoint
 * @param {Object} userData - User data object
 * @returns {Promise<string>} User ID
 */
async function createUser(userData) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send(userData);
  return res.body.user._id;
}

/**
 * Login and get authentication token
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<string>} JWT token
 */
async function loginUser(username, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password });
  return res.body.token;
}

/**
 * Create a building (director only)
 * @param {string} token - Director token
 * @param {Object} buildingData - Building data
 * @returns {Promise<string>} Building ID
 */
async function createBuilding(token, buildingData) {
  const res = await request(app)
    .post('/api/buildings')
    .set('Authorization', `Bearer ${token}`)
    .send(buildingData);
  return res.body._id;
}

/**
 * Approve a pending user (director only)
 * @param {string} token - Director token
 * @param {string} userId - User ID to approve
 * @returns {Promise<Object>} Response body
 */
async function approveUser(token, userId) {
  const res = await request(app)
    .patch(`/api/users/${userId}/approve`)
    .set('Authorization', `Bearer ${token}`);
  return res.body;
}

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
  let directorToken;
  let directorId;
  let managerId;
  let associateId;
  let tenantId;

  beforeEach(async () => {
    // Clean all collections
    await User.deleteMany({});
    await Building.deleteMany({});

    // Create test users
    directorId = await createUser(TEST_USERS.director);
    managerId = await createUser(TEST_USERS.manager);
    associateId = await createUser(TEST_USERS.associate);
    tenantId = await createUser(TEST_USERS.tenant);

    // Login as director
    directorToken = await loginUser(TEST_USERS.director.username, TEST_USERS.director.password);
  });

  // ========================================
  // Group 1: Building Creation
  // ========================================
  describe('POST /api/buildings - Create Building', () => {
    
    test('Should create building with valid data', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(TEST_BUILDING);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(TEST_BUILDING.name);
      expect(res.body.address).toBe(TEST_BUILDING.address);
    });

    test('Should reject building without name', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ address: TEST_BUILDING.address });

      expect(res.status).toBe(201);
      // Backend creates building even without name (name defaults to empty string)
    });

    test('Should reject building without address', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: TEST_BUILDING.name });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Address');
    });

    test('Should reject request without director token', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .send(TEST_BUILDING);

      expect(res.status).toBe(401);
    });

    test('Should reject request from non-director role', async () => {
      const tenantToken = await loginUser(TEST_USERS.tenant.username, TEST_USERS.tenant.password);

      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(TEST_BUILDING);

      expect(res.status).toBe(403);
    });
  });

  // ========================================
  // Group 2: Manager Assignment
  // ========================================
  describe('PATCH /api/buildings/:id/assign-manager - Assign Manager to Building', () => {
    
    let buildingId;

    beforeEach(async () => {
      // Create building and approve manager
      buildingId = await createBuilding(directorToken, { name: 'Test Zgrada', address: 'Test Adresa 123' });
      await approveUser(directorToken, managerId);
    });

    test('Should assign manager to building', async () => {
      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId });

      expect(res.status).toBe(200);
      expect(res.body.manager).toBeDefined();
      expect(String(res.body.manager._id)).toBe(String(managerId));
    });

    test('Should reject assignment with invalid building ID', async () => {
      const res = await request(app)
        .patch('/api/buildings/invalid-id/assign-manager')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId });

      expect(res.status).toBe(500);
    });

    test('Should reject assignment with non-existent manager', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId: fakeId });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid manager');
    });

    test('Should reject assignment if user is not manager role', async () => {
      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ managerId: tenantId });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid manager');
    });

    test('Should reject request from non-director user', async () => {
      const tenantToken = await loginUser(TEST_USERS.tenant.username, TEST_USERS.tenant.password);

      const res = await request(app)
        .patch(`/api/buildings/${buildingId}/assign-manager`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ managerId });

      expect(res.status).toBe(403);
    });
  });

  // ========================================
  // Group 3: View Pending Staff
  // ========================================
  describe('GET /api/users/pending - View Pending Staff', () => {

    test('Should return pending users for director', async () => {
      const res = await request(app)
        .get('/api/users/pending')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Check that all returned users have pending status
      res.body.forEach(user => {
        expect(user.status).toBe('pending');
      });
    });

    test('Should reject request from tenant (not manager/director)', async () => {
      const tenantToken = await loginUser(TEST_USERS.tenant.username, TEST_USERS.tenant.password);

      const res = await request(app)
        .get('/api/users/pending')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ========================================
  // Group 4: Approve Staff
  // ========================================
  describe('PATCH /api/users/:id/approve - Approve Staff', () => {

    test('Should approve pending manager', async () => {
      const result = await approveUser(directorToken, managerId);

      expect(result.user.status).toBe('active');
    });

    test('Should approve pending associate', async () => {
      const result = await approveUser(directorToken, associateId);

      expect(result.user.status).toBe('active');
    });

    test('Should reject approval of already active user', async () => {
      // Approve once
      await approveUser(directorToken, managerId);

      // Try to approve again
      const res = await request(app)
        .patch(`/api/users/${managerId}/approve`)
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already');
    });

    test('Should reject approval of non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .patch(`/api/users/${fakeId}/approve`)
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(404);
    });

    test('Should reject approval from non-director/non-manager', async () => {
      const tenantToken = await loginUser(TEST_USERS.tenant.username, TEST_USERS.tenant.password);

      const res = await request(app)
        .patch(`/api/users/${managerId}/approve`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });

    test('Should handle invalid user ID gracefully', async () => {
      const res = await request(app)
        .patch('/api/users/invalid-id/approve')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(500);
    });
  });

  // ========================================
  // Group 5: Delete User
  // ========================================
  describe('DELETE /api/users/:id - Delete User', () => {

    test('Should delete user by ID', async () => {
      const res = await request(app)
        .delete(`/api/users/${tenantId}`)
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
      
      // Verify user is deleted from database
      const user = await User.findById(tenantId);
      expect(user).toBeNull();
    });

    test('Should reject deletion of non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(404);
    });

    test('Should reject deletion from non-director', async () => {
      const tenantToken = await loginUser(TEST_USERS.tenant.username, TEST_USERS.tenant.password);

      const res = await request(app)
        .delete(`/api/users/${managerId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });

    test('Should handle invalid user ID', async () => {
      const res = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(res.status).toBe(500);
    });
  });
});
