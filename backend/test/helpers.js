/**
 * Shared Test Helpers
 * Extracted to keep beforeEach blocks under CodeScene's 70-line threshold
 */

const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');
const Issue = require('../models/Issue');

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
  const res = await request(app)
    .post('/api/auth/signup')
    .send(data);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: data.username, password: data.password });
  return {
    _id: res.body.user?._id,
    token: login.body.token
  };
}

/**
 * Approve a user via director token
 */
async function approveUser(directorToken, userId) {
  await request(app)
    .patch(`/api/users/${userId}/approve`)
    .set('Authorization', `Bearer ${directorToken}`);
}

/**
 * Create a building and return its _id
 */
async function createBuilding(directorToken, data) {
  const res = await request(app)
    .post('/api/buildings')
    .set('Authorization', `Bearer ${directorToken}`)
    .send(data);
  return res.body._id;
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
async function createApartment(token, buildingId, unitNumber) {
  const res = await request(app)
    .post(`/api/buildings/${buildingId}/apartments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ unitNumber });
  return res.body._id;
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
  return res.body.issue?._id;
}

module.exports = {
  cleanCollections,
  signupUser,
  approveUser,
  createBuilding,
  assignManager,
  createApartment,
  assignTenant,
  createIssue
};
