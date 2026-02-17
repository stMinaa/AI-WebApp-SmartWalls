const UserService = require('../../../src/application/service/UserService');
const AuthorizationError = require('../../../src/domain/exception/AuthorizationError');
const ValidationError = require('../../../src/domain/exception/ValidationError');

function createMockRepo(overrides = {}) {
  return {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    updateStatus: jest.fn(),
    findPending: jest.fn(),
    findWithFilters: jest.fn(),
    deleteById: jest.fn(),
    deleteMany: jest.fn(),
    findTestUsers: jest.fn(),
    findAssociates: jest.fn(),
    countBuildingsByManager: jest.fn(),
    findBuildingsByManager: jest.fn(),
    clearManagerFromBuildings: jest.fn(),
    updateApartmentTenant: jest.fn(),
    findApartmentById: jest.fn(),
    findApartmentWithBuilding: jest.fn(),
    findBuildingWithManager: jest.fn(),
    findBuildingWithManagerAndCount: jest.fn(),
    findAssociateJobs: jest.fn(),
    ...overrides
  };
}

function makeUser(overrides = {}) {
  return {
    _id: 'user123',
    username: 'testuser',
    role: 'director',
    status: 'active',
    save: jest.fn(),
    ...overrides
  };
}

module.exports = {
  UserService,
  AuthorizationError,
  ValidationError,
  createMockRepo,
  makeUser
};
