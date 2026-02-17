const { ERROR_MESSAGES, USER_ROLES, USER_STATUS } = require('../../../config/constants');
const AuthorizationError = require('../../domain/exception/AuthorizationError');
const ValidationError = require('../../domain/exception/ValidationError');
const UserPermissions = require('../../domain/service/UserPermissions');

class UserService {
  constructor(userRepository) {
    this.userRepo = userRepository;
  }

  async updateDebt(username, targetId, { debt, reason }) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canUpdateDebt(user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_ADJUST_DEBT);
    }

    const targetUser = await this._findByIdOrThrow(targetId);

    if (debt === undefined || debt < 0) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_DEBT_AMOUNT);
    }

    targetUser.debt = debt;
    await this.userRepo.save(targetUser);

    return { user: targetUser, reason };
  }

  async listPendingUsers(username) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canViewPending(user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_VIEW_PENDING);
    }

    let buildingIds;
    if (user.role === USER_ROLES.MANAGER) {
      const buildings = await this.userRepo.findBuildingsByManager(user._id);
      buildingIds = buildings.map((b) => b._id);
    }

    return this.userRepo.findPending(buildingIds);
  }

  async listUsers(username, { role, status, includeTest }) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canListUsers(user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_DIRECTORS_VIEW_USERS);
    }

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    if (includeTest !== 'true') {
      filter.$and = [
        { username: { $not: /^test/i } },
        { firstName: { $not: /^(name|test)\d+$/i } },
        { lastName: { $not: /^(last|test)\d+$/i } }
      ];
    }

    const select = 'firstName lastName email username role status mobile company';
    const users = await this.userRepo.findWithFilters(filter, select, { createdAt: -1 });

    if (role === USER_ROLES.MANAGER) {
      return Promise.all(
        users.map(async (u) => {
          const buildingCount = await this.userRepo.countBuildingsByManager(u._id);
          return { ...u.toObject(), buildingCount };
        })
      );
    }

    return users;
  }

  async approveUser(username, targetUserId) {
    const user = await this._findUserOrThrow(username);
    const targetUser = await this._findByIdOrThrow(targetUserId);

    if (targetUser.status === USER_STATUS.ACTIVE) {
      throw new ValidationError(ERROR_MESSAGES.USER_ALREADY_ACTIVE);
    }

    if (!UserPermissions.canApproveUser(user.role, targetUser.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_DIRECTORS_APPROVE_MANAGERS);
    }

    // Manager can only approve tenants in their buildings
    if (user.role === USER_ROLES.MANAGER && targetUser.role === USER_ROLES.TENANT) {
      const buildings = await this.userRepo.findBuildingsByManager(user._id);
      const canApprove = buildings.some((b) => String(b._id) === String(targetUser.building));
      if (!canApprove) {
        throw new AuthorizationError(ERROR_MESSAGES.ONLY_MANAGERS_APPROVE_TENANTS);
      }
    }

    // Use updateOne to bypass validation (matching original behavior)
    await this.userRepo.updateStatus(targetUserId, USER_STATUS.ACTIVE);

    return {
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        role: targetUser.role,
        status: USER_STATUS.ACTIVE,
        apartment: targetUser.apartment,
        residents: targetUser.residents
      }
    };
  }

  async deleteUser(username, targetUserId) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canDeleteUser(user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_DIRECTORS_DELETE_USERS);
    }

    const targetUser = await this._findByIdOrThrow(targetUserId);

    if (targetUser.username === user.username) {
      throw new ValidationError(ERROR_MESSAGES.CANNOT_DELETE_YOURSELF);
    }

    if (targetUser.role === USER_ROLES.MANAGER) {
      await this.userRepo.clearManagerFromBuildings(targetUserId);
    }

    await this.userRepo.deleteById(targetUserId);
  }

  async bulkDeleteTestUsers(username) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canDeleteUser(user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_DIRECTORS_DELETE_USERS);
    }

    const testUsers = await this.userRepo.findTestUsers(user._id);

    const testManagerIds = testUsers.filter((u) => u.role === USER_ROLES.MANAGER).map((u) => u._id);

    if (testManagerIds.length > 0) {
      await this.userRepo.clearManagerFromBuildings(testManagerIds);
    }

    const result = await this.userRepo.deleteMany({
      _id: { $ne: user._id },
      $or: [
        { username: /^test/i },
        { firstName: /^(name|test)\d+$/i },
        { lastName: /^(last|test)\d+$/i }
      ]
    });

    return { deletedCount: result.deletedCount };
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

    const tenant = await this._findByIdOrThrow(tenantId);

    if (!tenant || tenant.role !== USER_ROLES.TENANT) {
      throw new ValidationError(ERROR_MESSAGES.TENANT_NOT_FOUND);
    }

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

    const apartment = await this.userRepo.findApartmentWithBuilding(user.apartment);
    if (!apartment) {
      throw new ValidationError('Apartment not found');
    }

    const buildingWithCount = await this.userRepo.findBuildingWithManagerAndCount(
      apartment.building
    );
    if (!buildingWithCount) {
      throw new ValidationError(ERROR_MESSAGES.BUILDING_NOT_FOUND);
    }

    return {
      apartment: {
        _id: apartment._id,
        unitNumber: apartment.unitNumber,
        address: apartment.address,
        numPeople: apartment.numPeople,
        floor: apartment.floor
      },
      building: buildingWithCount
    };
  }

  async listAssociateJobs(username, filters) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canViewOwnJobs(user.role)) {
      throw new AuthorizationError('Only associates can view their jobs');
    }

    return this.userRepo.findAssociateJobs(user._id, filters);
  }

  async listAssociates(username) {
    const user = await this._findUserOrThrow(username);

    if (!UserPermissions.canViewAssociates(user.role)) {
      throw new AuthorizationError('Access denied');
    }

    return this.userRepo.findAssociates();
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

  async _findByIdOrThrow(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ValidationError(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }
}

module.exports = UserService;
