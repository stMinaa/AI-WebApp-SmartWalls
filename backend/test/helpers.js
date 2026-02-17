/* eslint-disable max-params, complexity, max-lines */
/**
 * Shared Test Helpers
 * Centralized test utilities to reduce boilerplate across test files.
 * Follow DRY principles - any repeated test pattern should be extracted here.
 */

const request = require('supertest');

const app = require('../index');
const Apartment = require('../models/Apartment');
const Building = require('../models/Building');
const Issue = require('../models/Issue');
const User = require('../models/User');

const { getData, assertSuccess } = require('./helpers/responseHelpers');

/**
 * Clean all test collections
 */
async function cleanCollections() {
  await Promise.all([
    User.deleteMany({}),
    Building.deleteMany({}),
    Apartment.deleteMany({}),
    Issue.deleteMany({})
  ]);
}

/**
 * Sign up a user and return { _id, token }
 */
async function signupUser(data) {
  const res = await request(app).post('/api/auth/signup').send(data);
  const signupData = getData(res);
  if (!signupData) throw new Error(`signupUser failed: ${JSON.stringify(res.body)}`);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: data.username, password: data.password });
  const loginData = getData(login);
  if (!loginData) throw new Error(`signupUser login failed: ${JSON.stringify(login.body)}`);
  return {
    _id: signupData.user?._id,
    token: loginData.token
  };
}

/**
 * Approve a user via director token
 * @returns {Promise<Object|undefined>} Response data if available
 */
async function approveUser(directorToken, userId) {
  const res = await request(app)
    .patch(`/api/users/${userId}/approve`)
    .set('Authorization', `Bearer ${directorToken}`);
  return getData(res);
}

/**
 * Create a building and return its _id
 */
async function createBuilding(directorToken, data) {
  const res = await request(app)
    .post('/api/buildings')
    .set('Authorization', `Bearer ${directorToken}`)
    .send(data);
  const d = getData(res);
  if (!d) throw new Error(`createBuilding failed: ${JSON.stringify(res.body)}`);
  return d._id;
}

/**
 * Assign a manager to a building
 */
async function assignManager(directorToken, buildingId, managerId) {
  await request(app)
    .patch(`/api/buildings/${buildingId}/assign-manager`)
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ managerId });
}

/**
 * Create an apartment and return its _id
 */
async function createApartment(token, buildingId, unitNumber, extraData = {}) {
  const res = await request(app)
    .post(`/api/buildings/${buildingId}/apartments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ unitNumber, ...extraData });
  const d = getData(res);
  if (!d) throw new Error(`createApartment failed: ${JSON.stringify(res.body)}`);
  return d._id;
}

/**
 * Assign a tenant to an apartment
 * @param {string} token - Auth token
 * @param {Object} opts - { tenantId, apartmentId, buildingId, numPeople }
 */
async function assignTenant(token, opts) {
  const { tenantId, apartmentId, buildingId, numPeople } = opts;
  await request(app)
    .post(`/api/tenants/${tenantId}/assign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ apartmentId, buildingId, numPeople: numPeople || 2 });
}

/**
 * Create an issue as a tenant
 */
async function createIssue(tenantToken, data) {
  const res = await request(app)
    .post('/api/issues')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send(data);
  const d = getData(res);
  return d.issue ? d.issue._id : d._id;
}

// ========================================
// SECTION 2: Authentication Helpers
// ========================================

/**
 * Login an existing user and return auth data
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{_id: string, token: string}>}
 */
async function loginUser(username, password) {
  const res = await request(app).post('/api/auth/login').send({ username, password });
  const data = getData(res);
  if (!data) throw new Error(`loginUser failed: ${JSON.stringify(res.body)}`);
  return {
    _id: data.user?._id || data._id,
    token: data.token
  };
}

// ========================================
// SECTION 3: API Request Wrappers
// ========================================

/**
 * Make authenticated GET request
 * @param {string} endpoint - API endpoint path
 * @param {string} token - JWT token
 * @param {number} expectedStatus - Expected HTTP status (default 200)
 * @returns {Promise<any>} Response data
 */
async function apiGet(endpoint, token, expectedStatus = 200) {
  const res = await request(app).get(endpoint).set('Authorization', `Bearer ${token}`);
  assertSuccess(res, expectedStatus);
  return getData(res);
}

/**
 * Make authenticated POST request
 * @param {string} endpoint - API endpoint path
 * @param {string} token - JWT token
 * @param {Object} body - Request body
 * @param {number} expectedStatus - Expected HTTP status (default 200)
 * @returns {Promise<any>} Response data
 */
async function apiPost(endpoint, token, body, expectedStatus = 200) {
  const res = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send(body);
  assertSuccess(res, expectedStatus);
  return getData(res);
}

/**
 * Make authenticated PATCH request
 * @param {string} endpoint - API endpoint path
 * @param {string} token - JWT token
 * @param {Object} body - Request body
 * @param {number} expectedStatus - Expected HTTP status (default 200)
 * @returns {Promise<any>} Response data
 */
async function apiPatch(endpoint, token, body = {}, expectedStatus = 200) {
  const res = await request(app).patch(endpoint).set('Authorization', `Bearer ${token}`).send(body);
  assertSuccess(res, expectedStatus);
  return getData(res);
}

/**
 * Make authenticated DELETE request
 * @param {string} endpoint - API endpoint path
 * @param {string} token - JWT token
 * @param {number} expectedStatus - Expected HTTP status (default 200)
 * @returns {Promise<any>} Response data
 */
async function apiDelete(endpoint, token, expectedStatus = 200) {
  const res = await request(app).delete(endpoint).set('Authorization', `Bearer ${token}`);
  assertSuccess(res, expectedStatus);
  return getData(res);
}

// ========================================
// SECTION 4: Composite Setup Helpers
// ========================================

/**
 * Create a director user (auto-approved)
 * @param {Object} userData - Optional user data override
 * @returns {Promise<{_id: string, token: string}>}
 */
async function createDirector(userData = {}) {
  const defaultData = {
    username: 'director_test',
    email: 'director@test.com',
    password: 'Test123!',
    firstName: 'Director',
    lastName: 'Test',
    role: 'director'
  };
  return await signupUser({ ...defaultData, ...userData });
}

/**
 * Create a manager user (requires director approval)
 * @param {string} directorToken - Director's auth token
 * @param {Object} userData - Optional user data override
 * @returns {Promise<{_id: string, token: string}>}
 */
async function createManager(directorToken, userData = {}) {
  const defaultData = {
    username: 'manager_test',
    email: 'manager@test.com',
    password: 'Test123!',
    firstName: 'Manager',
    lastName: 'Test',
    role: 'manager'
  };
  const manager = await signupUser({ ...defaultData, ...userData });
  await approveUser(directorToken, manager._id);
  return manager;
}

/**
 * Create a tenant user (active by default)
 * @param {Object} userData - Optional user data override
 * @returns {Promise<{_id: string, token: string}>}
 */
async function createTenant(userData = {}) {
  const defaultData = {
    username: 'tenant_test',
    email: 'tenant@test.com',
    password: 'Test123!',
    firstName: 'Tenant',
    lastName: 'Test',
    role: 'tenant'
  };
  return await signupUser({ ...defaultData, ...userData });
}

/**
 * Create an associate user (requires director approval)
 * @param {string} directorToken - Director's auth token
 * @param {Object} userData - Optional user data override
 * @returns {Promise<{_id: string, token: string}>}
 */
async function createAssociate(directorToken, userData = {}) {
  const defaultData = {
    username: 'associate_test',
    email: 'associate@test.com',
    password: 'Test123!',
    firstName: 'Associate',
    lastName: 'Test',
    role: 'associate'
  };
  const associate = await signupUser({ ...defaultData, ...userData });
  await approveUser(directorToken, associate._id);
  return associate;
}

/**
 * Create a complete test scenario with all roles and relationships
 * @param {Object} options - Configuration options
 * @param {number} options.numManagers - Number of managers (default 1)
 * @param {number} options.numBuildings - Number of buildings (default 1)
 * @param {number} options.numApartments - Apartments per building (default 2)
 * @param {number} options.numTenants - Number of tenants (default 2)
 * @param {number} options.numAssociates - Number of associates (default 1)
 * @param {number} options.numIssues - Issues per tenant (default 1)
 * @returns {Promise<Object>} Complete scenario context
 */
async function createCompleteScenario(options = {}) {
  const {
    numManagers = 1,
    numBuildings = 1,
    numApartments = 2,
    numTenants = 2,
    numAssociates = 1,
    numIssues = 1
  } = options;

  // Create director
  const director = await createDirector({ username: 'dir1', email: 'dir1@test.com' });

  // Create managers
  const managers = [];
  for (let i = 0; i < numManagers; i++) {
    const mgr = await createManager(director.token, {
      username: `mgr${i + 1}`,
      email: `mgr${i + 1}@test.com`
    });
    managers.push(mgr);
  }

  // Create buildings and assign managers
  const buildings = [];
  for (let i = 0; i < numBuildings; i++) {
    const bldId = await createBuilding(director.token, {
      name: `Building ${i + 1}`,
      address: `${100 + i} Test Street`
    });
    const mgr = managers[i % managers.length]; // Round-robin manager assignment
    await assignManager(director.token, bldId, mgr._id);
    buildings.push({ _id: bldId, manager: mgr });
  }

  // Create apartments
  const apartments = [];
  for (const building of buildings) {
    for (let i = 0; i < numApartments; i++) {
      const aptId = await createApartment(building.manager.token, building._id, `${i + 1}01`);
      apartments.push({ _id: aptId, buildingId: building._id, manager: building.manager });
    }
  }

  // Create tenants and assign to apartments
  const tenants = [];
  for (let i = 0; i < numTenants && i < apartments.length; i++) {
    const tenant = await createTenant({
      username: `ten${i + 1}`,
      email: `ten${i + 1}@test.com`
    });
    const apt = apartments[i];
    await assignTenant(apt.manager.token, {
      tenantId: tenant._id,
      apartmentId: apt._id,
      buildingId: apt.buildingId,
      numPeople: 2
    });
    tenants.push({ ...tenant, apartmentId: apt._id, buildingId: apt.buildingId });
  }

  // Create associates
  const associates = [];
  for (let i = 0; i < numAssociates; i++) {
    const assoc = await createAssociate(director.token, {
      username: `assoc${i + 1}`,
      email: `assoc${i + 1}@test.com`
    });
    associates.push(assoc);
  }

  // Create issues
  const issues = [];
  for (const tenant of tenants) {
    for (let i = 0; i < numIssues; i++) {
      const issueId = await createIssue(tenant.token, {
        title: `Issue ${i + 1} for ${tenant._id}`,
        description: `Test issue ${i + 1}`,
        priority: ['low', 'medium', 'high'][i % 3]
      });
      issues.push(issueId);
    }
  }

  return {
    director,
    managers,
    buildings,
    apartments,
    tenants,
    associates,
    issues
  };
}

// ========================================
// SECTION 5: Issue Workflow Helpers
// ========================================

/**
 * Triage an issue (manager action)
 * @param {string} managerToken - Manager's auth token
 * @param {string} issueId - Issue ID
 * @param {string} associateId - Associate to assign (optional)
 */
async function triageIssue(managerToken, issueId, associateId = null) {
  const body = associateId ? { associateId } : {};
  await apiPatch(`/api/issues/${issueId}/triage`, managerToken, body);
}

/**
 * Assign issue to associate (manager action)
 * @param {string} managerToken - Manager's auth token
 * @param {string} issueId - Issue ID
 * @param {string} associateId - Associate ID
 */
async function assignIssue(managerToken, issueId, associateId) {
  await apiPatch(`/api/issues/${issueId}/assign`, managerToken, { associateId });
}

/**
 * Accept a job (associate action)
 * @param {string} associateToken - Associate's auth token
 * @param {string} issueId - Issue ID
 */
async function acceptJob(associateToken, issueId) {
  await apiPatch(`/api/issues/${issueId}/accept`, associateToken);
}

/**
 * Complete a job (associate action)
 * @param {string} associateToken - Associate's auth token
 * @param {string} issueId - Issue ID
 * @param {Object} details - Completion details (notes, etc.)
 */
async function completeJob(associateToken, issueId, details = {}) {
  await apiPatch(`/api/issues/${issueId}/complete`, associateToken, details);
}

/**
 * Update issue status (generic)
 * @param {string} token - Auth token
 * @param {string} issueId - Issue ID
 * @param {string} status - New status
 */
async function updateIssueStatus(token, issueId, status) {
  await Issue.findByIdAndUpdate(issueId, { status });
}

// ========================================
// SECTION 6: Database Query Helpers
// ========================================

/**
 * Fetch issue from database
 * @param {string} issueId - Issue ID
 * @returns {Promise<Object>} Issue document
 */
async function getIssueFromDB(issueId) {
  return await Issue.findById(issueId);
}

/**
 * Fetch user from database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User document
 */
async function getUserFromDB(userId) {
  return await User.findById(userId);
}

/**
 * Fetch building from database
 * @param {string} buildingId - Building ID
 * @returns {Promise<Object>} Building document
 */
async function getBuildingFromDB(buildingId) {
  return await Building.findById(buildingId);
}

/**
 * Fetch apartment from database
 * @param {string} apartmentId - Apartment ID
 * @returns {Promise<Object>} Apartment document
 */
async function getApartmentFromDB(apartmentId) {
  return await Apartment.findById(apartmentId);
}

module.exports = {
  // Section 1: Core Helpers (Original)
  cleanCollections,
  signupUser,
  approveUser,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant,
  createIssue,

  // Section 2: Authentication
  loginUser,

  // Section 3: API Wrappers
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,

  // Section 4: Composite Setup
  createDirector,
  createManager,
  createTenant,
  createAssociate,
  createCompleteScenario,

  // Section 5: Issue Workflows
  triageIssue,
  assignIssue,
  acceptJob,
  completeJob,
  updateIssueStatus,

  // Section 6: Database Queries
  getIssueFromDB,
  getUserFromDB,
  getBuildingFromDB,
  getApartmentFromDB
};
