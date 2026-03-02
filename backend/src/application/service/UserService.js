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

    const select = 'firstName lastName email username role status mobile company';
    const users = await this.userRepo.findWithFilters(
      this._buildUserFilter(role, status, includeTest),
      select,
      { createdAt: -1 }
    );

    return role === USER_ROLES.MANAGER ? this._enrichManagersWithBuildingCount(users) : users;
  }

  _buildUserFilter(role, status, includeTest) {
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

    return filter;
  }

  async _enrichManagersWithBuildingCount(users) {
    return Promise.all(
      users.map(async (u) => {
        const buildingCount = await this.userRepo.countBuildingsByManager(u._id);
        return { ...u.toObject(), buildingCount };
      })
    );
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

    await this._verifyManagerCanApproveTenant(user, targetUser);
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

  async _verifyManagerCanApproveTenant(user, targetUser) {
    if (user.role !== USER_ROLES.MANAGER || targetUser.role !== USER_ROLES.TENANT) return;

    const buildings = await this.userRepo.findBuildingsByManager(user._id);
    const canApprove = buildings.some((b) => String(b._id) === String(targetUser.building));
    if (!canApprove) {
      throw new AuthorizationError(ERROR_MESSAGES.ONLY_MANAGERS_APPROVE_TENANTS);
    }
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
