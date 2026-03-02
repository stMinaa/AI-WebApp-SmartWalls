const { ERROR_MESSAGES, USER_ROLES, USER_STATUS } = require('../../../config/constants');
const AuthorizationError = require('../../domain/exception/AuthorizationError');
const ValidationError = require('../../domain/exception/ValidationError');
const UserPermissions = require('../../domain/service/UserPermissions');

class TenantService {
  constructor(userRepository) {
    this.userRepo = userRepository;
  }

  async deleteTenant(username, tenantId) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canDeleteTenant(user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_DELETE_TENANTS);
    }

    const tenant = await this.userRepo.findById(tenantId);
    if (!tenant) {
      throw new ValidationError(ERROR_MESSAGES.TENANT_NOT_FOUND);
    }

    if (tenant.apartment) {
      await this.userRepo.updateApartmentTenant(tenant.apartment, null, 0);
    }

    await this.userRepo.deleteById(tenantId);
  }

  async approveTenant(username, tenantId) {
    const user = await this._findUserOrThrow(username);

    if (user.role !== USER_ROLES.MANAGER) {
      throw new AuthorizationError('Only managers can approve tenants');
    }

    const tenant = await this._findTenantOrThrow(tenantId);

    tenant.status = USER_STATUS.ACTIVE;
    await this.userRepo.save(tenant);

    return { tenant };
  }

  async assignTenant(username, tenantId, { apartmentId, buildingId, numPeople }) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canAssignTenant(user.role)) {
      throw new AuthorizationError('Only managers and directors can assign tenants');
    }

    this._validateAssignmentFields(apartmentId, buildingId);

    const tenant = await this._findTenantOrThrow(tenantId);
    const apartment = await this._findAvailableApartment(apartmentId, tenant._id);

    await this._freeOldApartmentIfNeeded(tenant, apartmentId);

    tenant.apartment = apartmentId;
    tenant.building = buildingId;
    await this.userRepo.save(tenant);

    apartment.tenant = tenant._id;
    apartment.numPeople = numPeople || 1;
    await apartment.save();
  }

  async getMyApartment(username) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canViewOwnApartment(user.role)) {
      throw new AuthorizationError('Only tenants can view apartment info');
    }

    if (!user.apartment) {
      throw new ValidationError('You are not assigned to any apartment yet');
    }

    const { apartment, building } = await this._getApartmentWithBuilding(user.apartment);
    return {
      apartment: {
        _id: apartment._id,
        unitNumber: apartment.unitNumber,
        address: apartment.address,
        numPeople: apartment.numPeople,
        floor: apartment.floor
      },
      building
    };
  }

  async _getApartmentWithBuilding(apartmentId) {
    const apartment = await this.userRepo.findApartmentWithBuilding(apartmentId);
    if (!apartment) throw new ValidationError('Apartment not found');

    const building = await this.userRepo.findBuildingWithManagerAndCount(apartment.building);
    if (!building) throw new ValidationError(ERROR_MESSAGES.BUILDING_NOT_FOUND);

    return { apartment, building };
  }

  _validateAssignmentFields(apartmentId, buildingId) {
    if (!apartmentId || !buildingId) {
      throw new ValidationError('apartmentId and buildingId are required');
    }
  }

  async _findTenantOrThrow(tenantId) {
    const tenant = await this.userRepo.findById(tenantId);
    if (!tenant || tenant.role !== USER_ROLES.TENANT) {
      throw new ValidationError(ERROR_MESSAGES.TENANT_NOT_FOUND);
    }
    return tenant;
  }

  async _findAvailableApartment(apartmentId, tenantId) {
    const apartment = await this.userRepo.findApartmentById(apartmentId);
    if (!apartment) {
      throw new ValidationError('Apartment not found');
    }
    if (apartment.tenant && apartment.tenant.toString() !== tenantId.toString()) {
      throw new ValidationError('Apartment is already occupied by another tenant');
    }
    return apartment;
  }

  async _freeOldApartmentIfNeeded(tenant, newApartmentId) {
    if (tenant.apartment && tenant.apartment.toString() !== newApartmentId) {
      await this.userRepo.updateApartmentTenant(tenant.apartment, null, 0);
    }
  }

  async _findUserOrThrow(username) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new ValidationError(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }
}

module.exports = TenantService;
