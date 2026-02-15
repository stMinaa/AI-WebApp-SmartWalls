require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiResponse = require('./utils/ApiResponse');
const {
  JWT_SECRET,
  USER_ROLES,
  USER_STATUS,
  ISSUE_STATUS,
  PRIORITY_LEVELS,
  NODE_ENV,
  VALIDATION_RULES,
  HTTP_STATUS,
  ERROR_MESSAGES,
} = require('./config/constants');

// Validation middleware and validators
const { validate } = require('./middleware/validate');
const UserValidator = require('./validators/UserValidator');
const IssueValidator = require('./validators/IssueValidator');
const BuildingValidator = require('./validators/BuildingValidator');
const ApartmentValidator = require('./validators/ApartmentValidator');
const NoticeValidator = require('./validators/NoticeValidator');

const app = express();

// MongoDB connection string (hardcoded for simplicity)
const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

// Import models
const User = require('./models/User');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Issue = require('./models/Issue');
const Notice = require('./models/Notice');
const Poll = require('./models/Poll');
const Invoice = require('./models/Invoice');

// Import routers
const authRoutes = require('./routes/auth');
const buildingRoutes = require('./routes/buildings');
const issueRoutes = require('./routes/issues');

// Import auth helper functions
const {
  findUserByUsername,
  findUserById,
  getCurrentUser,
  getUserStatusByRole,
  createUserResponse
} = require('./utils/authHelpers');

// Import auth middleware
const { authenticateToken } = require('./middleware/authHelper');

// Import role permission helpers
const {
  requireRole,
  requireOneOfRoles,
  requireDirector,
  requireManager,
  requireAssociate,
  requireTenant,
  requireDirectorOrManager
} = require('./middleware/roleHelper');

// Import DB lookup helpers
const { findBuildingById, findIssueById, findApartmentById } = require('./utils/lookupHelpers');

// Import response formatting helpers
const {
  addApartmentCount,
  addApartmentCounts,
  flattenIssueBuilding,
  flattenIssueBuildings,
  populateIssue,
  populateIssueWithCompany
} = require('./utils/responseHelpers');

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== NODE_ENV.TEST) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MONGO RUNNING - Connected to MongoDB'))
    .catch(err => {
      console.error('❌ MONGO ERROR:', err.message);
      process.exit(1);
    });
}

// ===== SIGNUP & AUTH HELPERS =====
// Auth helper functions are in utils/authHelpers.js
// Role helpers are in middleware/roleHelper.js
// DB lookup helpers are in utils/lookupHelpers.js
// Response helpers are in utils/responseHelpers.js

// ===== REGISTER AUTH ROUTER =====
// Register auth routes at /api/auth
app.use('/api/auth', authRoutes);

// ===== REGISTER BUILDINGS ROUTER =====
// Register building routes at /api/buildings
app.use('/api/buildings', buildingRoutes);

// ===== REGISTER ISSUES ROUTER =====
// Register issue routes at /api/issues
app.use('/api/issues', issueRoutes);

// ===== OLD INLINE AUTH ENDPOINTS (NOW IN routes/auth.js) =====
// The following endpoints have been moved to routes/auth.js:
// - POST /api/auth/signup
// - POST /api/auth/login
// - GET /api/auth/me
// - PATCH /api/auth/me
// - POST /api/auth/pay-debt

// ===== UPDATE DEBT - Director/Manager adds or adjusts tenant debt =====
app.patch('/api/users/:id/debt', authenticateToken, async (req, res) => {
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

// ===== GET PENDING USERS (for managers/directors) =====
app.get('/api/users/pending', authenticateToken, async (req, res) => {
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

// ===== BUILDING ENDPOINTS (NOW IN routes/buildings.js) =====
// The following endpoints have been moved to routes/buildings.js:
// - POST /api/buildings - Create building
// - GET /api/buildings - List buildings
// - GET /api/buildings/managed - Manager's buildings
// - PATCH /api/buildings/:buildingId/assign-manager - Assign manager
// - POST /api/buildings/:id/apartments/bulk - Bulk create apartments
// - POST /api/buildings/:id/apartments - Create single apartment
// - GET /api/buildings/:id/apartments - List apartments
// - GET /api/buildings/:id/tenants - List tenants
// - GET /api/buildings/:buildingId/polls - Get polls
// - POST /api/buildings/:buildingId/polls - Create poll
// - GET /api/buildings/:buildingId/notices - Get notices
// - POST /api/buildings/:buildingId/notices - Create notice

// ===== ISSUE ENDPOINTS (Part 3A-3B-3C - NOW IN routes/issues.js) =====
// The following endpoints have been moved to routes/issues.js:
// Part 3A (Basic Operations):
// - GET /api/issues - List issues (manager/director, role-based filtering)
// - POST /api/issues - Report issue (tenant)
// - GET /api/issues/my - Get tenant's issues
// Part 3B (Manager Workflow):
// - PATCH /api/issues/:issueId/triage - Manager triages issue (forward/reject/assign)
// - PATCH /api/issues/:issueId/assign - Director assigns forwarded issue (or rejects)
// Part 3C (Associate Workflow - POST versions with invoice creation):
// - POST /api/issues/:id/accept - Associate accepts with cost estimate (creates invoice on complete)
// - POST /api/issues/:id/reject - Associate rejects, returns to director
// - POST /api/issues/:id/complete - Associate completes, creates invoice
// Note: Old PATCH versions (accept/complete) were removed in favor of POST versions

// ===== GET ALL ASSOCIATES (for manager/director dropdowns) =====
  }
});

// PATCH /api/buildings/:buildingId/assign-manager - Assign manager to building
// GET /api/users - Get users with optional role/status filter
app.get('/api/users', authenticateToken, async (req, res) => {
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

// PATCH /api/users/:userId/approve - Approve pending user (manager/director can approve and assign apartment)
app.patch('/api/users/:userId/approve', authenticateToken, async (req, res) => {
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

// DELETE /api/users/:userId - Delete a user (director only)
app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
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

// DELETE /api/users/bulk/test - Delete all test users (director only)
app.delete('/api/users/bulk/test', authenticateToken, async (req, res) => {
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

// ===== APARTMENT ENDPOINTS =====

// POST /api/buildings/:id/apartments/bulk - Bulk create apartments (manager/director)
// ===== TENANT ENDPOINTS =====

// DELETE /api/tenants/:id - Delete tenant and free apartment (manager/director)
app.delete('/api/tenants/:id', authenticateToken, async (req, res) => {
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

// POST /api/tenants/:id/approve - Approve pending tenant (manager only)
app.post('/api/tenants/:id/approve', authenticateToken, async (req, res) => {
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

// POST /api/tenants/:id/assign - Assign tenant to apartment
app.post('/api/tenants/:id/assign', authenticateToken, async (req, res) => {
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

// GET /api/tenants/me/apartment - Tenant views their apartment and building info
app.get('/api/tenants/me/apartment', authenticateToken, async (req, res) => {
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

// ===== PHASE 3.2: TENANT REPORTS ISSUES =====
// POST /api/issues - Tenant creates an issue (NOW IN routes/issues.js Part 3A)

// ===== PHASE 3.3: TENANT VIEWS THEIR OWN ISSUES =====
// GET /api/issues/my - Tenant views their reported issues (NOW IN routes/issues.js Part 3A)

// ===== PHASE 4.1: ASSOCIATE VIEWS ASSIGNED JOBS =====
// GET /api/associates/me/jobs - Associate views their assigned jobs
app.get('/api/associates/me/jobs', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/associates/me/jobs - User: ${req.user.username} Query:`, req.query);

    // Fetch user
    const user = await findUserByUsername(req.user.username);
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    // Check if user is an associate
    requireAssociate(user, 'Only associates can view their jobs');

    const { status, priority } = req.query;
    const filter = { assignedTo: user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const jobs = await populateIssueWithCompany(Issue.find(filter)).sort({ createdAt: -1 });

    // Flatten building from apartment.building to building for easier access
    const jobsWithBuilding = flattenIssueBuildings(jobs);

    console.log(`Associate jobs retrieved: ${jobsWithBuilding.length}`);
    return ApiResponse.success(res, jobsWithBuilding, 'Associate jobs retrieved successfully');
  } catch (error) {
    console.error('Error retrieving associate jobs:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== GET ALL ASSOCIATES (for manager/director dropdowns) =====
app.get('/api/associates', authenticateToken, async (req, res) => {
  try {
    console.log('\n🔍 GET /api/associates - DEBUG');
    const user = await User.findOne({ username: req.user.username });
    console.log('   Requesting user:', user?.firstName, user?.lastName, `(${user?.role})`);

    // Only managers and directors can view associates list
    if (!user || (user.role !== USER_ROLES.MANAGER && user.role !== USER_ROLES.DIRECTOR)) {
      console.log('   ❌ Access denied - user role:', user?.role);
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Access denied' });
    }

    console.log('   ✅ Access granted - fetching associates...');
    
    // Get all active associates (status 'active' or undefined for existing users)
    const associates = await User.find({
      role: USER_ROLES.ASSOCIATE,
      $or: [
        { status: USER_STATUS.ACTIVE },
        { status: { $exists: false } },
        { status: null }
      ]
    }).select('_id username firstName lastName email company status');

    console.log(`   📊 Query result: ${associates.length} associates found`);
    
    if (associates.length > 0) {
      console.log('   Sample results:');
      associates.slice(0, 3).forEach((assoc, index) => {
        const name = `${assoc.firstName || ''} ${assoc.lastName || ''}`.trim();
        console.log(`      ${index + 1}. ${name} (@${assoc.username}) - status: ${assoc.status}`);
      });
    }

    return ApiResponse.success(res, associates, 'Associates retrieved successfully');
  } catch (error) {
    console.error('❌ Error fetching associates:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== POLLS ENDPOINTS =====

// POST /api/polls/:pollId/vote - Vote on a poll
app.post('/api/polls/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    const { option } = req.body;

    if (!option) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Option is required' });
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Poll not found' });
    }

    // Check if already voted
    const existingVote = poll.votes.find(v => v.voter.toString() === user._id.toString());
    if (existingVote) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'You have already voted on this poll' });
    }

    // Add vote
    poll.votes.push({ option, voter: user._id });
    await poll.save();

    const updated = await Poll.findById(poll._id)
      .populate('createdBy', 'username firstName lastName');

    return ApiResponse.success(res, updated, 'Vote recorded successfully');
  } catch (error) {
    console.error('Error voting on poll:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/polls/:pollId/close - Close a poll
app.post('/api/polls/:pollId/close', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    // Only managers can close polls
    if (!user || user.role !== USER_ROLES.MANAGER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can close polls' });
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Poll not found' });
    }

    poll.closedAt = new Date();
    await poll.save();

    const updated = await Poll.findById(poll._id)
      .populate('createdBy', 'username firstName lastName');

    return ApiResponse.success(res, updated, 'Poll closed successfully');
  } catch (error) {
    console.error('Error closing poll:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== NOTICES ENDPOINTS =====

// DELETE /api/notices/:noticeId - Delete a notice
app.delete('/api/notices/:noticeId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    // Only managers can delete notices
    if (!user || user.role !== USER_ROLES.MANAGER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can delete notices' });
    }

    const notice = await Notice.findById(req.params.noticeId);
    if (!notice) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Notice not found' });
    }

    await Notice.findByIdAndDelete(req.params.noticeId);

    return ApiResponse.success(res, null, 'Notice deleted successfully');
  } catch (error) {
    console.error('Error deleting notice:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== TEST ENDPOINT =====
app.get('/api/test', (req, res) => {
  return ApiResponse.success(res, null, 'Backend is working!');
});

// GET /api/test/me - Test authentication
app.get('/api/test/me', authenticateToken, async (req, res) => {
  console.log('GET /api/test/me - User:', req.user);
  try {
    const user = await User.findOne({ username: req.user.username }).select('-password');
    return ApiResponse.success(res, { user }, 'Authentication working!');
  } catch (err) {
    console.error('Test me error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err);
  }
});

// POST /api/test/seed-issues - Create test issues (dev only)
app.post('/api/test/seed-issues', authenticateToken, async (req, res) => {
  console.log('POST /api/test/seed-issues - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== USER_ROLES.DIRECTOR) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: ERROR_MESSAGES.ONLY_DIRECTORS });
    }

    // Find first apartment and tenant
    const apartment = await Apartment.findOne();
    const tenant = await User.findOne({ role: USER_ROLES.TENANT });

    if (!apartment || !tenant) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Need at least one apartment and tenant to create issues' });
    }

    const testIssues = [
      { title: 'Nema tople vode', description: 'U kupatilu nema tople vode već tri dana', priority: PRIORITY_LEVELS.HIGH, status: ISSUE_STATUS.FORWARDED },
      { title: 'Lift ne radi', description: 'Lift je zaglavio između spratova', priority: PRIORITY_LEVELS.HIGH, status: ISSUE_STATUS.FORWARDED },
      { title: 'Curi slavina u kuhinji', description: 'Slavina u kuhinji kaplje celu noć', priority: PRIORITY_LEVELS.MEDIUM, status: ISSUE_STATUS.FORWARDED },
      { title: 'Pukla sijalica u hodniku', description: 'Sijalica na trećem spratu je pregorela', priority: PRIORITY_LEVELS.LOW, status: ISSUE_STATUS.FORWARDED },
      { title: 'Nezatvoren prozor na stepeništu', description: 'Prozor na drugom spratu ne može da se zatvori', priority: PRIORITY_LEVELS.MEDIUM, status: ISSUE_STATUS.FORWARDED },
      { title: 'Nema grejanja u stanu', description: 'Radijatori su hladni već dva dana', priority: PRIORITY_LEVELS.HIGH, status: ISSUE_STATUS.FORWARDED },
      { title: 'Prljav ulaz zgrade', description: 'Ulaz nije čišćen nedelju dana', priority: PRIORITY_LEVELS.LOW, status: ISSUE_STATUS.FORWARDED },
      { title: 'Škripi vrata na ulazu', description: 'Glavna vrata jako škripe i teško se otvaraju', priority: PRIORITY_LEVELS.MEDIUM, status: ISSUE_STATUS.FORWARDED }
    ];

    const createdIssues = [];
    for (const issueData of testIssues) {
      const issue = new Issue({
        title: issueData.title,
        description: issueData.description,
        priority: issueData.priority,
        status: issueData.status,
        apartment: apartment._id,
        createdBy: tenant._id
      });
      await issue.save();
      createdIssues.push(issue);
    }

    console.log(`Created ${createdIssues.length} test issues`);
    return ApiResponse.success(res, { count: createdIssues.length }, `Created ${createdIssues.length} test issues`);
  } catch (err) {
    console.error('Seed issues error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err);
  }
});

// POST /api/test/seed-notices - Create test notices (dev only)
app.post('/api/test/seed-notices', authenticateToken, async (req, res) => {
  console.log('POST /api/test/seed-notices - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== USER_ROLES.DIRECTOR) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: ERROR_MESSAGES.ONLY_DIRECTORS });
    }

    // Find first building and manager
    const building = await Building.findOne();
    const manager = await User.findOne({ role: USER_ROLES.MANAGER });

    if (!building || !manager) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Need at least one building and manager to create notices' });
    }

    const testNotices = [
      'Obaveštenje o planiranom održavanju lifta 10. februara od 9h do 15h. Molimo stanare da ne koriste lift tog dana.',
      'Redovno čišćenje stepeništa je planirano svakog ponedeljka i četvrtka. Molimo stanare da ne ostavljaju predmete na stepeništu.',
      'Skupština stanara će se održati 15. februara u 18h u prostorijama zgrade. Molimo sve stanare da prisustvuju.',
      'Grejanje će biti isključeno 12. februara od 8h do 12h zbog servisa kotlarnice.',
      'Molimo stanare da vode računa o zatvaranju ulaznih vrata. Primećeno je da vrata često ostaju otvorena.',
      'Parking mesto broj 7 je trenutno van upotrebe zbog radova. Molimo stanare da koriste alternativna mesta.',
      'Novo radno vreme domara: ponedeljak-petak 8-16h, subota 9-13h. U slučaju hitnosti zovite 064-123-4567.'
    ];

    const createdNotices = [];
    for (const content of testNotices) {
      const notice = new Notice({
        building: building._id,
        author: manager._id,
        authorName: manager.username,
        authorRole: manager.role,
        content
      });
      await notice.save();
      createdNotices.push(notice);
    }

    console.log(`Created ${createdNotices.length} test notices`);
    return ApiResponse.success(res, { count: createdNotices.length }, `Created ${createdNotices.length} test notices`);
  } catch (err) {
    console.error('Seed notices error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err);
  }
});

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

// Register modular routes
const invoicesRouter = require('./routes/invoices');
app.use('/api/invoices', invoicesRouter);

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ BACKEND RUNNING - Server listening on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}`);
    console.log(`✅ MONGO RUNNING ✅ BACKEND RUNNING - Ready to accept requests!\n`);
  });
}

// Export app for testing
module.exports = app;
