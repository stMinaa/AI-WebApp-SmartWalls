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
    await this._requireDirectorRole(username);
    const building = await this._findBuildingOrThrow(buildingId);
    if (managerId) await this._validateManager(managerId);
    building.assignManager(managerId || null);
    await this.buildingRepo.save(building);
    return this.buildingRepo.findByIdPopulated(buildingId);
  }

  async _requireDirectorRole(username) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');
    if (!BuildingPermissions.canAssignManager(user.role)) {
      throw new AuthorizationError('Only directors can assign managers');
    }
  }

  async _findBuildingOrThrow(buildingId) {
    const building = await this.buildingRepo.findById(buildingId);
    if (!building) throw new ValidationError('Building not found');
    return building;
  }

  async _validateManager(managerId) {
    const manager = await this.userRepo.findById(managerId);
    if (!manager) throw new ValidationError('Manager not found');
    if (manager.role !== USER_ROLES.MANAGER) throw new ValidationError('Invalid manager');
    if (manager.status !== USER_STATUS.ACTIVE) throw new ValidationError('Manager not active');
  }

  async createApartment(username, buildingId, { unitNumber, address }) {
    await this._requireApartmentPermission(username);
    const building = await this._findBuildingRawOrThrow(buildingId);
    return this.apartmentRepo.createSingle({
      buildingId: building._id,
      unitNumber,
      address: address || building.address
    });
  }

  async bulkCreateApartments(username, buildingId, spec) {
    await this._requireApartmentPermission(username);
    const building = await this._findBuildingRawOrThrow(buildingId);
    await this._requireEmptyBuilding(building._id);
    const apartments = this._generateApartments(building._id, spec);
    const created = await this.apartmentRepo.createBulk(apartments);
    return { count: created.length };
  }

  async _requireApartmentPermission(username) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');
    if (!BuildingPermissions.canCreateApartments(user.role)) {
      throw new AuthorizationError('Only managers and directors can create apartments');
    }
  }

  async _findBuildingRawOrThrow(buildingId) {
    const building = await this.buildingRepo.findRawById(buildingId);
    if (!building) throw new ValidationError('Building not found');
    return building;
  }

  async _requireEmptyBuilding(buildingId) {
    const existingCount = await this.apartmentRepo.countByBuilding(buildingId);
    if (existingCount > 0) {
      throw new ValidationError(
        'Building already has apartments. Bulk create only works on empty buildings.'
      );
    }
  }

  _generateApartments(buildingId, { floors, unitsPerFloor, floorsSpec }) {
    if (floorsSpec) return this._generateFromSpec(buildingId, floorsSpec);
    if (floors && unitsPerFloor) return this._generateFromFloors(buildingId, floors, unitsPerFloor);
    throw new ValidationError('Either (floors + unitsPerFloor) or floorsSpec is required');
  }

  _generateFromSpec(buildingId, floorsSpec) {
    const floorNumbers = floorsSpec.split(',').map((f) => parseInt(f.trim()));
    return floorNumbers.flatMap((floorNum) => {
      const unitsOnFloor = floorNum === 5 ? 2 : 4;
      return Array.from({ length: unitsOnFloor }, (_, i) => ({
        building: buildingId,
        unitNumber: `${floorNum}0${i + 1}`
      }));
    });
  }

  _generateFromFloors(buildingId, floors, unitsPerFloor) {
    const apartments = [];
    for (let floor = 1; floor <= floors; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        apartments.push({ building: buildingId, unitNumber: `${floor}0${unit}` });
      }
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
