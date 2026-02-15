/**
 * User & Tenant Management Routes - Step 2.2 Part 4
 * Handles user/tenant operations: debt, approvals, assignments, listings
 */

const express = require('express');
const router = express.Router();

// Models
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');

// Middleware
const { authMiddleware: authenticateToken } = require('../middleware/authHelper');

// Utils
const ApiResponse = require('../utils/ApiResponse');
const { ERROR_MESSAGES, USER_ROLES, USER_STATUS, HTTP_STATUS } = require('../config/constants');

// Helpers
const { findUserByUsername, findUserById } = require('../utils/authHelpers');
const { requireDirectorOrManager, requireDirector, requireTenant } = require('../middleware/roleHelper');
const { addApartmentCount } = require('../utils/responseHelpers');

// ===== USER MANAGEMENT ENDPOINTS =====

// PATCH /users/:id/debt - Update user debt (director/manager)
router.patch('/users/:id/debt', authenticateToken, async (req, res) => {
  try {
    const currentUser = await findUserByUsername(req.user.username);
    requireDirectorOrManager(currentUser, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_ADJUST_DEBT);

    const targetUser = await findUserById(req.params.id);

    const { debt, reason } = req.body;

    if (debt === undefined || debt < 0) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_DEBT_AMOUNT);
    }

    targetUser.debt = debt;
    await targetUser.save();

    return ApiResponse.success(res, { user: targetUser, reason }, 'Debt updated');
  } catch (err) {
    console.error('Error updating debt:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.ERROR_UPDATING_DEBT);
  }
});

// GET /users/pending - Get pending users (for managers/directors)
router.get('/users/pending', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByUsername(req.user.username);
    requireDirectorOrManager(user, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_VIEW_PENDING);

    const query = { status: USER_STATUS.PENDING };

    // Managers only see pending tenants for their buildings
    if (user.role === USER_ROLES.MANAGER) {
      const managedBuildings = await Building.find({ manager: user._id });
      const buildingIds = managedBuildings.map(b => b._id);
      query.building = { $in: buildingIds };
    }

    const pendingUsers = await User.find(query)
      .select('-password')
      .populate('building', 'name address')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, pendingUsers, 'Pending users retrieved');
  } catch (err) {
    console.error('Error fetching pending users:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /users - Get users with optional role/status filter (director only)
router.get('/users', authenticateToken, async (req, res) => {
  console.log('GET /api/users - User:', req.user?.username, 'Query:', req.query);
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Found user:', user.username, 'Role:', user.role);
    if (user.role !== USER_ROLES.DIRECTOR) {
      console.log('Authorization failed - user role:', user?.role);
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_DIRECTORS_VIEW_USERS);
    }

    const { role, status, includeTest } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Exclude test users by default (usernames starting with 'test' or names matching test patterns)
    if (includeTest !== 'true') {
      filter.$and = [
        { username: { $not: /^test/i } },
        { firstName: { $not: /^(name|test)\d+$/i } },
        { lastName: { $not: /^(last|test)\d+$/i } }
      ];
    }

    const users = await User.find(filter)
      .select('firstName lastName email username role status mobile company')
      .sort({ createdAt: -1 });

    console.log('Sample user data:', users[0] ? {
      firstName: users[0].firstName,
      lastName: users[0].lastName,
      mobile: users[0].mobile,
      company: users[0].company
    } : 'No users found');

    // If fetching managers, add building count
    if (role === USER_ROLES.MANAGER) {
      const usersWithCount = await Promise.all(
        users.map(async (u) => {
          const buildingCount = await Building.countDocuments({ manager: u._id });
          return {
            ...u.toObject(),
            buildingCount
          };
        })
      );
      console.log('Returning managers with building counts:', usersWithCount.length);
      return ApiResponse.success(res, usersWithCount, 'Managers retrieved successfully');
    }

    console.log('Returning users:', users.length);
    return ApiResponse.success(res, users, 'Users retrieved successfully');
  } catch (err) {
    console.error('Get users error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
});

// PATCH /users/:userId/approve - Approve pending user (manager/director)
router.patch('/users/:userId/approve', authenticateToken, async (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 APPROVE ENDPOINT CALLED!');
  console.log('User:', req.user?.username);
  console.log('Target UserID:', req.params.userId);
  console.log('='.repeat(60) + '\n');
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Approving user found:', user.username, 'Role:', user.role);
    requireDirectorOrManager(user, ERROR_MESSAGES.ONLY_DIRECTORS_APPROVE_MANAGERS);

    const targetUser = await findUserById(req.params.userId);

    if (targetUser.status === USER_STATUS.ACTIVE) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.USER_ALREADY_ACTIVE);
    }

    // Manager can only approve tenants in their buildings
    if (user.role === USER_ROLES.MANAGER && targetUser.role === USER_ROLES.TENANT) {
      console.log('Manager approving tenant, checking buildings...');
      const managedBuildings = await Building.find({ manager: user._id });
      const canApprove = managedBuildings.some(b => String(b._id) === String(targetUser.building));
      if (!canApprove) {
        return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_MANAGERS_APPROVE_TENANTS);
      }
    }

    // Director can approve managers, associates, and tenants without restrictions
    console.log('Setting status to active...');

    // Simple direct update without optional fields
    targetUser.status = 'active';
    
    // Use updateOne instead of save to bypass validation
    await User.updateOne(
      { _id: targetUser._id },
      { $set: { status: 'active' } }
    );

    console.log('User approved successfully:', targetUser.username);

    return ApiResponse.success(res, {
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
    }, 'User approved successfully');
  } catch (err) {
    console.error('Approve user error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// DELETE /users/:userId - Delete a user (director only)
router.delete('/users/:userId', authenticateToken, async (req, res) => {
  console.log('DELETE /api/users/:userId - User:', req.user?.username, 'Target:', req.params.userId);
  try {
    const user = await findUserByUsername(req.user.username);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_DELETE_USERS);

    const targetUser = await findUserById(req.params.userId);

    // Don't allow deleting yourself
    if (targetUser.username === user.username) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.CANNOT_DELETE_YOURSELF);
    }

    // If deleting a manager, remove them from all buildings
    if (targetUser.role === USER_ROLES.MANAGER) {
      await Building.updateMany(
        { manager: targetUser._id },
        { $set: { manager: null } }
      );
      console.log('Removed manager from all buildings');
    }

    await User.findByIdAndDelete(req.params.userId);
    console.log('User deleted:', targetUser.username);
    return ApiResponse.success(res, null, 'User deleted successfully');
  } catch (err) {
    console.error('Delete user error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// DELETE /users/bulk/test - Delete all test users (director only)
router.delete('/users/bulk/test', authenticateToken, async (req, res) => {
  console.log('DELETE /api/users/bulk/test - User:', req.user?.username);
  try {
    const user = await findUserByUsername(req.user.username);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_DELETE_USERS);

    // Find all test users (excluding the current user)
    const testUsers = await User.find({
      _id: { $ne: user._id },
      $or: [
        { username: /^test/i },
        { firstName: /^(name|test)\d+$/i },
        { lastName: /^(last|test)\d+$/i }
      ]
    });

    console.log(`Found ${testUsers.length} test users to delete`);

    // Remove test managers from buildings
    const testManagerIds = testUsers.filter(u => u.role === USER_ROLES.MANAGER).map(u => u._id);
    if (testManagerIds.length > 0) {
      await Building.updateMany(
        { manager: { $in: testManagerIds } },
        { $set: { manager: null } }
      );
      console.log('Removed test managers from buildings');
    }

    // Delete all test users
    const result = await User.deleteMany({
      _id: { $ne: user._id },
      $or: [
        { username: /^test/i },
        { firstName: /^(name|test)\d+$/i },
        { lastName: /^(last|test)\d+$/i }
      ]
    });

    console.log(`Deleted ${result.deletedCount} test users`);
    return ApiResponse.success(res, { deletedCount: result.deletedCount }, `Successfully deleted ${result.deletedCount} test users`);
  } catch (err) {
    console.error('Bulk delete error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== TENANT-SPECIFIC ENDPOINTS =====

// DELETE /tenants/:id - Delete tenant and free apartment (manager/director)
router.delete('/tenants/:id', authenticateToken, async (req, res) => {
  console.log('DELETE /api/tenants/:id - User:', req.user?.username, 'Tenant:', req.params.id);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || ![USER_ROLES.MANAGER, USER_ROLES.DIRECTOR].includes(user.role)) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_DELETE_TENANTS);
    }

    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.TENANT_NOT_FOUND);
    }

    // If tenant has an apartment, free it
    if (tenant.apartment) {
      await Apartment.findByIdAndUpdate(tenant.apartment, { tenant: null });
      console.log('Freed apartment:', tenant.apartment);
    }

    await User.findByIdAndDelete(req.params.id);
    console.log('Tenant deleted:', tenant.username);
    return ApiResponse.success(res, null, 'Tenant deleted successfully');
  } catch (err) {
    console.error('Delete tenant error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// POST /tenants/:id/approve - Approve pending tenant (manager only)
router.post('/tenants/:id/approve', authenticateToken, async (req, res) => {
  console.log(`POST /api/tenants/:id/approve - User: ${req.user.username}`);

  try {
    // Check if user is manager
    const user = await User.findOne({ username: req.user.username });

    if (!user || user.role !== USER_ROLES.MANAGER) {
      return ApiResponse.forbidden(res, 'Only managers can approve tenants');
    }

    // Find tenant
    const tenant = await User.findById(req.params.id);
    if (!tenant || tenant.role !== USER_ROLES.TENANT) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.TENANT_NOT_FOUND);
    }

    // Update tenant status to active
    tenant.status = USER_STATUS.ACTIVE;
    await tenant.save();

    console.log('Tenant approved:', tenant.username);
    return ApiResponse.success(res, { tenant }, 'Tenant approved successfully');
  } catch (err) {
    console.error('Approve tenant error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// POST /tenants/:id/assign - Assign tenant to apartment
router.post('/tenants/:id/assign', authenticateToken, async (req, res) => {
  console.log(`POST /api/tenants/:id/assign - User: ${req.user.username} Body:`, req.body);

  try {
    // Check if user is manager or director
    const user = await findUserByUsername(req.user.username);
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    requireDirectorOrManager(user, 'Only managers and directors can assign tenants');

    const { apartmentId, buildingId, numPeople } = req.body;

    // Validate required fields
    if (!apartmentId || !buildingId) {
      return ApiResponse.badRequest(res, 'apartmentId and buildingId are required');
    }

    // Find tenant
    const tenant = await User.findById(req.params.id);
    if (!tenant || tenant.role !== USER_ROLES.TENANT) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.TENANT_NOT_FOUND);
    }

    // Find apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return ApiResponse.notFound(res, 'Apartment not found');
    }

    // Check if apartment is already occupied by another tenant
    if (apartment.tenant && apartment.tenant.toString() !== tenant._id.toString()) {
      return ApiResponse.badRequest(res, 'Apartment is already occupied by another tenant');
    }

    // If tenant is being reassigned to a different apartment, free the old one
    if (tenant.apartment && tenant.apartment.toString() !== apartmentId) {
      await Apartment.findByIdAndUpdate(tenant.apartment, {
        tenant: null,
        numPeople: 0
      });
      console.log('Freed old apartment:', tenant.apartment);
    }

    // Update tenant
    tenant.apartment = apartmentId;
    tenant.building = buildingId;
    await tenant.save();

    // Update apartment
    apartment.tenant = tenant._id;
    apartment.numPeople = numPeople || 1;
    await apartment.save();

    console.log('Tenant assigned successfully:', tenant._id, 'to apartment:', apartmentId);
    return ApiResponse.success(res, null, 'Tenant assigned successfully');
  } catch (err) {
    console.error('Assign tenant error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /tenants/me/apartment - Tenant views their apartment and building info
router.get('/tenants/me/apartment', authenticateToken, async (req, res) => {
  console.log(`GET /api/tenants/me/apartment - User: ${req.user.username}`);

  try {
    // Check if user is tenant
    const user = await findUserByUsername(req.user.username);
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    requireTenant(user, 'Only tenants can view apartment info');

    // Check if tenant has an apartment assigned
    if (!user.apartment) {
      return ApiResponse.notFound(res, 'You are not assigned to any apartment yet');
    }

    // Fetch apartment with building info
    const apartment = await Apartment.findById(user.apartment);
    if (!apartment) {
      return ApiResponse.notFound(res, 'Apartment not found');
    }

    const building = await Building.findById(apartment.building)
      .populate('manager', 'firstName lastName email');
    if (!building) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.BUILDING_NOT_FOUND);
    }

    // Get apartment count for building
    const buildingWithCount = await addApartmentCount(building);

    console.log('Tenant apartment info retrieved successfully');
    return ApiResponse.success(res, {
      apartment: {
        _id: apartment._id,
        unitNumber: apartment.unitNumber,
        address: apartment.address,
        numPeople: apartment.numPeople,
        floor: apartment.floor
      },
      building: buildingWithCount
    }, 'Apartment info retrieved');
  } catch (err) {
    console.error('Get tenant apartment error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

module.exports = router;
