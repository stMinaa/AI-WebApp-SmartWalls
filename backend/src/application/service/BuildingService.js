const { USER_STATUS, USER_ROLES } = require('../../../config/constants');
const AuthorizationError = require('../../domain/exception/AuthorizationError');
const ValidationError = require('../../domain/exception/ValidationError');
const Building = require('../../domain/model/Building');
const BuildingPermissions = require('../../domain/service/BuildingPermissions');

class BuildingService {
  constructor(buildingRepository, apartmentRepository, userRepository) {
    this.buildingRepo = buildingRepository;
    this.apartmentRepo = apartmentRepository;
    this.userRepo = userRepository;
  }

  async createBuilding(username, { name, address, imageUrl }) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');

    if (!BuildingPermissions.canCreateBuilding(user.role)) {
      throw new AuthorizationError('Only directors can create buildings');
    }

    const building = new Building({
      name,
      address,
      imageUrl,
      director: user._id
    });

    await this.buildingRepo.save(building);
    return building;
  }

  async listBuildings(user, filter = {}) {
    if (!BuildingPermissions.canViewAllBuildings(user.role)) {
      throw new AuthorizationError('Only directors can view all buildings');
    }

    return this.buildingRepo.findAll(filter);
  }

  async listManagedBuildings(user) {
    if (!BuildingPermissions.canViewManagedBuildings(user.role)) {
      throw new AuthorizationError('Only managers can view managed buildings');
    }

    return this.buildingRepo.findByManager(user._id);
  }

  async assignManager(username, buildingId, managerId) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');

    if (!BuildingPermissions.canAssignManager(user.role)) {
      throw new AuthorizationError('Only directors can assign managers');
    }

    const building = await this.buildingRepo.findById(buildingId);
    if (!building) throw new ValidationError('Building not found');

    if (managerId) await this._validateManager(managerId);

    building.assignManager(managerId || null);
    await this.buildingRepo.save(building);
    return this.buildingRepo.findByIdPopulated(buildingId);
  }

  async _validateManager(managerId) {
    const manager = await this.userRepo.findById(managerId);
    if (!manager) throw new ValidationError('Manager not found');
    if (manager.role !== USER_ROLES.MANAGER) throw new ValidationError('Invalid manager');
    if (manager.status !== USER_STATUS.ACTIVE) throw new ValidationError('Manager not active');
  }

  async createApartment(username, buildingId, { unitNumber, address }) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');

    if (!BuildingPermissions.canCreateApartments(user.role)) {
      throw new AuthorizationError('Only managers and directors can create apartments');
    }

    const building = await this.buildingRepo.findRawById(buildingId);
    if (!building) throw new ValidationError('Building not found');

    const apartment = await this.apartmentRepo.createSingle({
      buildingId: building._id,
      unitNumber,
      address: address || building.address
    });

    return apartment;
  }

  async bulkCreateApartments(username, buildingId, { floors, unitsPerFloor, floorsSpec }) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');

    if (!BuildingPermissions.canCreateApartments(user.role)) {
      throw new AuthorizationError('Only managers and directors can create apartments');
    }

    const building = await this.buildingRepo.findRawById(buildingId);
    if (!building) throw new ValidationError('Building not found');

    const existingCount = await this.apartmentRepo.countByBuilding(building._id);
    if (existingCount > 0) {
      throw new ValidationError(
        'Building already has apartments. Bulk create only works on empty buildings.'
      );
    }

    const apartments = this._generateApartments(building._id, {
      floors,
      unitsPerFloor,
      floorsSpec
    });
    const created = await this.apartmentRepo.createBulk(apartments);
    return { count: created.length };
  }

  _generateApartments(buildingId, { floors, unitsPerFloor, floorsSpec }) {
    const apartments = [];

    if (floorsSpec) {
      const floorNumbers = floorsSpec.split(',').map((f) => parseInt(f.trim()));
      for (const floorNum of floorNumbers) {
        const unitsOnFloor = floorNum === 5 ? 2 : 4;
        for (let unit = 1; unit <= unitsOnFloor; unit++) {
          apartments.push({ building: buildingId, unitNumber: `${floorNum}0${unit}` });
        }
      }
    } else if (floors && unitsPerFloor) {
      for (let floor = 1; floor <= floors; floor++) {
        for (let unit = 1; unit <= unitsPerFloor; unit++) {
          apartments.push({ building: buildingId, unitNumber: `${floor}0${unit}` });
        }
      }
    } else {
      throw new ValidationError('Either (floors + unitsPerFloor) or floorsSpec is required');
    }

    return apartments;
  }

  async listApartments(buildingId) {
    const building = await this.buildingRepo.findRawById(buildingId);
    if (!building) throw new ValidationError('Building not found');

    return this.apartmentRepo.findByBuilding(building._id);
  }

  async listTenants(username, buildingId) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');

    if (!BuildingPermissions.canViewTenants(user.role)) {
      throw new AuthorizationError('Only managers and directors can view tenants');
    }

    const building = await this.buildingRepo.findRawById(buildingId);
    if (!building) throw new ValidationError('Building not found');

    return this.userRepo.findTenantsByBuilding(building._id);
  }
}

module.exports = BuildingService;
