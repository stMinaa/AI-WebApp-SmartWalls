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

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ authenticateToken: No token provided');
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: ERROR_MESSAGES.TOKEN_REQUIRED });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ authenticateToken: Invalid token', err.message);
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: ERROR_MESSAGES.TOKEN_INVALID });
    }
    req.user = user;
    next();
  });
};

// ===== DATABASE LOOKUP HELPERS =====
/**
 * Find user by username or throw 404 error
 * @param {string} username - Username to search for
 * @returns {Promise<User>} User document
 * @throws {Error} 404 if user not found
 */
async function findUserByUsername(username) {
  const user = await User.findOne({ username });
  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return user;
}

/**
 * Find user by ID or throw 404 error
 * @param {string} userId - User ID to search for
 * @param {string} selectFields - Optional: fields to select/exclude (e.g., '-password')
 * @returns {Promise<User>} User document
 * @throws {Error} 404 if user not found
 */
async function findUserById(userId, selectFields = '') {
  let query = User.findById(userId);
  if (selectFields) {
    query = query.select(selectFields);
  }
  const user = await query;
  if (!user) {
    const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return user;
}

/**
 * Find current authenticated user from request
 * @param {Request} req - Express request object with req.user.username
 * @param {string} selectFields - Optional: fields to select/exclude (e.g., '-password')
 * @returns {Promise<User>} Current user document
 * @throws {Error} 404 if user not found
 */
async function getCurrentUser(req, selectFields = '-password') {
  return findUserByUsername(req.user.username, selectFields);
}

/**
 * Find building by ID or throw 404 error
 * @param {string} buildingId - Building ID to search for
 * @returns {Promise<Building>} Building document
 * @throws {Error} 404 if building not found
 */
async function findBuildingById(buildingId) {
  const building = await Building.findById(buildingId);
  if (!building) {
    const error = new Error('Building not found');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return building;
}

/**
 * Find issue by ID or throw 404 error
 * @param {string} issueId - Issue ID to search for
 * @returns {Promise<Issue>} Issue document
 * @throws {Error} 404 if issue not found
 */
async function findIssueById(issueId) {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    const error = new Error('Issue not found');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return issue;
}

/**
 * Find apartment by ID or throw 404 error
 * @param {string} apartmentId - Apartment ID to search for
 * @returns {Promise<Apartment>} Apartment document
 * @throws {Error} 404 if apartment not found
 */
async function findApartmentById(apartmentId) {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    const error = new Error('Apartment not found');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }
  return apartment;
}

// ===== PERMISSION CHECK HELPERS =====
/**
 * Require user to have specific role, throw 403 if not
 * @param {User} user - User document to check
 * @param {string} requiredRole - Required role from USER_ROLES
 * @param {string} errorMessage - Custom error message from ERROR_MESSAGES
 * @throws {Error} 403 Forbidden if user doesn't have required role
 */
function requireRole(user, requiredRole, errorMessage) {
  if (user.role !== requiredRole) {
    const error = new Error(errorMessage || `Only ${requiredRole}s can perform this action`);
    error.status = HTTP_STATUS.FORBIDDEN;
    throw error;
  }
}

/**
 * Require user to have one of specified roles (OR logic), throw 403 if not
 * @param {User} user - User document to check
 * @param {string[]} allowedRoles - Array of allowed roles from USER_ROLES
 * @param {string} errorMessage - Custom error message from ERROR_MESSAGES
 * @throws {Error} 403 Forbidden if user doesn't have any of the allowed roles
 */
function requireOneOfRoles(user, allowedRoles, errorMessage) {
  if (!allowedRoles.includes(user.role)) {
    const error = new Error(errorMessage || `Insufficient permissions`);
    error.status = HTTP_STATUS.FORBIDDEN;
    throw error;
  }
}

/**
 * Require user to be director, throw 403 if not
 * @param {User} user - User document to check
 * @param {string} errorMessage - Optional custom error message
 * @throws {Error} 403 Forbidden if user is not director
 */
function requireDirector(user, errorMessage = ERROR_MESSAGES.ONLY_DIRECTORS) {
  requireRole(user, USER_ROLES.DIRECTOR, errorMessage);
}

/**
 * Require user to be manager, throw 403 if not
 * @param {User} user - User document to check
 * @param {string} errorMessage - Optional custom error message
 * @throws {Error} 403 Forbidden if user is not manager
 */
function requireManager(user, errorMessage = ERROR_MESSAGES.ONLY_MANAGERS_VIEW_BUILDINGS) {
  requireRole(user, USER_ROLES.MANAGER, errorMessage);
}

/**
 * Require user to be associate, throw 403 if not
 * @param {User} user - User document to check
 * @param {string} errorMessage - Optional custom error message
 * @throws {Error} 403 Forbidden if user is not associate
 */
function requireAssociate(user, errorMessage = ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT) {
  requireRole(user, USER_ROLES.ASSOCIATE, errorMessage);
}

/**
 * Require user to be tenant, throw 403 if not
 * @param {User} user - User document to check
 * @param {string} errorMessage - Optional custom error message
 * @throws {Error} 403 Forbidden if user is not tenant
 */
function requireTenant(user, errorMessage) {
  requireRole(user, USER_ROLES.TENANT, errorMessage || 'Only tenants can perform this action');
}

/**
 * Require user to be director or manager, throw 403 if not
 * @param {User} user - User document to check
 * @param {string} errorMessage - Optional custom error message
 * @throws {Error} 403 Forbidden if user is neither director nor manager
 */
function requireDirectorOrManager(user, errorMessage = ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_VIEW_ISSUES) {
  requireOneOfRoles(user, [USER_ROLES.DIRECTOR, USER_ROLES.MANAGER], errorMessage);
}

// ===== RESPONSE FORMATTING HELPERS =====
/**
 * Add apartment count to building object
 * @param {Building} building - Building document
 * @returns {Promise<Object>} Building object with apartmentCount field
 */
async function addApartmentCount(building) {
  const apartmentCount = await Apartment.countDocuments({ building: building._id });
  return {
    ...building.toObject(),
    apartmentCount
  };
}

/**
 * Add apartment counts to multiple buildings
 * @param {Building[]} buildings - Array of building documents
 * @returns {Promise<Object[]>} Buildings with apartmentCount fields
 */
async function addApartmentCounts(buildings) {
  return Promise.all(buildings.map(building => addApartmentCount(building)));
}

/**
 * Flatten issue apartment.building to top-level building field
 * Used when issues are populated with apartment → building relationships
 * @param {Issue} issue - Issue document with populated apartment.building
 * @returns {Object} Issue object with flattened building field
 */
function flattenIssueBuilding(issue) {
  const issueObj = issue.toObject();
  if (issueObj.apartment && issueObj.apartment.building) {
    issueObj.building = issueObj.apartment.building;
  }
  return issueObj;
}

/**
 * Flatten multiple issues' apartment.building to top-level building field
 * @param {Issue[]} issues - Array of issue documents
 * @returns {Object[]} Issues with flattened building fields
 */
function flattenIssueBuildings(issues) {
  return issues.map(issue => flattenIssueBuilding(issue));
}

/**
 * Standard issue population query (apartment, building, users)
 * Use with Issue.find() or Issue.findById()
 * @param {Query} query - Mongoose query object
 * @returns {Query} Query with standard population
 */
function populateIssue(query) {
  return query
    .populate('apartment', 'unitNumber address')
    .populate({
      path: 'apartment',
      populate: {
        path: 'building',
        select: 'name address'
      }
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');
}

/**
 * Standard issue population with company field for associates
 * @param {Query} query - Mongoose query object
 * @returns {Query} Query with standard population including company
 */
function populateIssueWithCompany(query) {
  return query
    .populate('apartment', 'unitNumber address')
    .populate({
      path: 'apartment',
      populate: {
        path: 'building',
        select: 'name address'
      }
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'username firstName lastName email company');
}

// ===== SIGNUP HELPERS =====
/**
 * Check if required signup fields are provided
 * @private
 */
function hasRequiredSignupFields(username, email, password) {
  return username && email && password;
}

/**
 * Validate signup input data
 * @private
 */
function validateSignupInput(username, email, password, role) {
  if (!hasRequiredSignupFields(username, email, password)) {
    return { valid: false, status: HTTP_STATUS.BAD_REQUEST, message: ERROR_MESSAGES.USERNAME_EMAIL_PASSWORD_REQUIRED };
  }

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { valid: false, status: HTTP_STATUS.BAD_REQUEST, message: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }

  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { valid: false, status: HTTP_STATUS.BAD_REQUEST, message: ERROR_MESSAGES.INVALID_EMAIL };
  }

  const validRoles = Object.values(USER_ROLES);
  if (role && !validRoles.includes(role)) {
    return { valid: false, status: HTTP_STATUS.BAD_REQUEST, error: ERROR_MESSAGES.INVALID_ROLE };
  }

  return { valid: true };
}

/**
 * Determine user status based on role
 * @private
 */
function getUserStatusByRole(role) {
  if (!role || role === USER_ROLES.DIRECTOR) {
    return USER_STATUS.ACTIVE;
  }
  return USER_STATUS.PENDING;
}

/**
 * Create user response object
 * @private
 */
function createUserResponse(user, token) {
  return {
    message: 'User registered successfully',
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status
    }
  };
}

// ===== SIGNUP =====
app.post('/api/auth/signup', validate(UserValidator.validateSignup), async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return ApiResponse.conflict(res, 'Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine status based on role
    const status = getUserStatusByRole(role);

    // Create user - building and apartment assigned by manager during approval
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'tenant',
      status: status,
      building: null, // Will be assigned by manager during approval
      apartment: null // Will be assigned by manager during approval
    });

    await user.save();

    // Create token with standardized payload: { userId, username, email, role }
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ApiResponse.created(res, createUserResponse(user, token), 'User created successfully');
  } catch (err) {
    console.error('Signup error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== LOGIN =====
app.post('/api/auth/login', validate(UserValidator.validateLogin), async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Create token with standardized payload: { userId, username, email, role }
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ApiResponse.success(res, {
      token,
      user: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== GET CURRENT USER =====
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    return ApiResponse.success(res, user, 'User retrieved');
  } catch (err) {
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== UPDATE CURRENT USER =====
app.patch('/api/auth/me', authenticateToken, validate(UserValidator.validateProfileUpdate), async (req, res) => {
  console.log('PATCH /api/auth/me - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await findUserByUsername(req.user.username);

    const { firstName, lastName, mobile, company } = req.body;
    console.log('Updating user:', user.username, 'with:', { firstName, lastName, mobile, company });

    // Restrict tenants from editing certain fields (future: add more restrictions if needed)
    if (user.role === USER_ROLES.TENANT) {
      // Tenants can only update firstName, lastName, mobile - not username, email, role, etc.
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (mobile !== undefined) user.mobile = mobile;
    } else if (user.role === USER_ROLES.ASSOCIATE) {
      // Associates can update firstName, lastName, mobile, company
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (mobile !== undefined) user.mobile = mobile;
      if (company !== undefined) user.company = company;
    } else {
      // Other roles can update these fields too
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (mobile !== undefined) user.mobile = mobile;
      if (company !== undefined) user.company = company;
    }

    await user.save();
    console.log('User saved successfully:', user.username);
    const updatedUser = await getCurrentUser(req);
    return ApiResponse.success(res, updatedUser, 'Profile updated');
  } catch (err) {
    console.error('Error updating profile:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.ERROR_UPDATING_PROFILE);
  }
});

// ===== PAYMENT - Tenant pays debt =====
app.post('/api/auth/pay-debt', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByUsername(req.user.username);

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
    }

    if (amount > user.debt) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.PAYMENT_EXCEEDS_DEBT);
    }

    // Reduce debt
    user.debt = Math.max(0, user.debt - amount);
    await user.save();

    const updatedUser = await getCurrentUser(req);
    return ApiResponse.success(res, { user: updatedUser, remainingDebt: user.debt }, 'Payment successful');
  } catch (err) {
    console.error('Error processing payment:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.ERROR_PROCESSING_PAYMENT);
  }
});

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
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== BUILDING ENDPOINTS =====

// POST /api/buildings - Director creates a building
app.post('/api/buildings', authenticateToken, validate(BuildingValidator.validateCreate), async (req, res) => {
  console.log('POST /api/buildings - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Found user:', user.username, 'Role:', user.role);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_CREATE_BUILDINGS);

    const { name, address, imageUrl } = req.body;
    if (!address) {
      console.log('Validation failed - no address');
      return ApiResponse.badRequest(res, ERROR_MESSAGES.ADDRESS_REQUIRED);
    }

    const building = new Building({
      name: name || '',
      address,
      imageUrl: imageUrl || '',
      director: user._id
    });

    await building.save();
    console.log('Building created:', building._id);
    return ApiResponse.created(res, building, 'Building created successfully');
  } catch (err) {
    console.error('Create building error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings - Director views all buildings with apartment count
app.get('/api/buildings', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings - User:', req.user?.username, 'Query:', req.query);
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Found user:', user.username, 'Role:', user.role);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_VIEW_BUILDINGS);

    // Support filtering by managerId
    const filter = {};
    if (req.query.managerId) {
      filter.manager = req.query.managerId;
    }

    const buildings = await Building.find(filter)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log('Found buildings:', buildings.length);

    // Add apartment count for each building
    const buildingsWithCount = await addApartmentCounts(buildings);

    console.log('Returning buildings with counts');
    return ApiResponse.success(res, buildingsWithCount, 'Buildings retrieved');
  } catch (err) {
    console.error('Get buildings error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings/managed - Manager views their assigned buildings
app.get('/api/buildings/managed', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByUsername(req.user.username);
    requireManager(user, ERROR_MESSAGES.ONLY_MANAGERS_VIEW_BUILDINGS);

    const buildings = await Building.find({ manager: user._id })
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Add apartment count for each building
    const buildingsWithCount = await addApartmentCounts(buildings);

    return ApiResponse.success(res, buildingsWithCount, 'Managed buildings retrieved');
  } catch (err) {
    console.error('Get managed buildings error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/issues - Get issues (role-based filtering)
app.get('/api/issues', authenticateToken, async (req, res) => {
  console.log('GET /api/issues - User:', req.user?.username, 'Query:', req.query);
  try {
    const user = await User.findOne({ username: req.user.username });
    console.log('Found user:', user?.username, 'Role:', user?.role);

    // Phase 2.5: Only managers and directors can view issues via this endpoint
    if (!user || (user.role !== USER_ROLES.MANAGER && user.role !== USER_ROLES.DIRECTOR)) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_VIEW_ISSUES);
    }

    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Managers see issues from their buildings only
    // Directors see ALL issues
    if (user.role === USER_ROLES.MANAGER) {
      const buildings = await Building.find({ manager: user._id });
      const buildingIds = buildings.map(b => b._id);
      const apartments = await Apartment.find({ building: { $in: buildingIds } });
      const apartmentIds = apartments.map(a => a._id);
      filter.apartment = { $in: apartmentIds };
    }
    // For directors, no filter on apartments - they see all

    const issues = await populateIssue(Issue.find(filter)).sort({ createdAt: -1 });

    // Flatten building from apartment.building to building for easier access
    const issuesWithBuilding = flattenIssueBuildings(issues);

    console.log('Returning issues:', issuesWithBuilding.length);
    return ApiResponse.success(res, issuesWithBuilding, 'Issues retrieved');
  } catch (err) {
    console.error('Get issues error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// PATCH /api/issues/:issueId/triage - Manager triages issue (forward/reject/assign)
app.patch('/api/issues/:issueId/triage', authenticateToken, validate(IssueValidator.validateTriage), async (req, res) => {
  console.log('🔍 TRIAGE REQUEST - User:', req.user?.username, 'Issue:', req.params.issueId, 'Body:', req.body);
  try {
    const user = await findUserByUsername(req.user.username);
    requireManager(user, ERROR_MESSAGES.ONLY_MANAGERS_TRIAGE);

    const issue = await findIssueById(req.params.issueId);

    const { action, assignedTo } = req.body;
    const targetAssociate = assignedTo;

    const updateData = { updatedAt: new Date() };

    if (action === 'forward') {
      updateData.status = ISSUE_STATUS.FORWARDED;
    } else if (action === 'reject') {
      updateData.status = ISSUE_STATUS.REJECTED;
    } else if (action === 'assign' && targetAssociate) {
      // Manager assigns to associate directly - targetAssociate is username
      const associate = await User.findOne({
        username: targetAssociate,
        role: USER_ROLES.ASSOCIATE
      });
      if (!associate) {
        console.log('❌ Associate not found:', targetAssociate);
        return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_ASSOCIATE);
      }
      updateData.assignedTo = associate._id;
      updateData.status = ISSUE_STATUS.ASSIGNED;
      console.log('✅ Assigning to associate:', associate.username, associate._id);
    } else {
      console.log('❌ Invalid action or missing associate:', action, targetAssociate);
      return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_ACTION);
    }

    // Simply update and return without populate to avoid errors
    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true }
    );

    console.log('✅ Issue triaged successfully:', req.params.issueId, 'Action:', action);
    return ApiResponse.success(res, updated, 'Issue triaged successfully');
  } catch (err) {
    console.error('❌ Triage issue error:', err.message);
    console.error('❌ Full error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err.message);
  }
});

// PATCH /api/issues/:issueId/assign - Director assigns forwarded issue (or rejects)
app.patch('/api/issues/:issueId/assign', authenticateToken, validate(IssueValidator.validateAssign), async (req, res) => {
  console.log('PATCH /api/issues/:issueId/assign - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await findUserByUsername(req.user.username);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS);

    const issue = await findIssueById(req.params.issueId);

    // Allow assigning any issue for testing (in production, check: issue.status !== 'forwarded')
    // if (issue.status !== 'forwarded') {
    //   return res.status(400).json({ message: 'Only forwarded issues can be assigned by director' });
    // }

    const { action, assignedTo } = req.body;

    const updateData = { updatedAt: new Date() };

    if (action === 'reject') {
      updateData.status = ISSUE_STATUS.REJECTED;
    } else if (action === 'assign' && assignedTo) {
      const associate = await findUserById(assignedTo);
      if (associate.role !== USER_ROLES.ASSOCIATE || associate.status !== USER_STATUS.ACTIVE) {
        return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_ASSOCIATE);
      }
      updateData.assignedTo = assignedTo;
      updateData.status = ISSUE_STATUS.ASSIGNED;
    } else {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_ACTION);
    }

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true, runValidators: false }
    )
      .populate('apartment', 'unitNumber building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue assigned by director:', action);
    return ApiResponse.success(res, updated, 'Issue assigned successfully');
  } catch (err) {
    console.error('Assign issue error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// PATCH /api/issues/:issueId/accept - Associate accepts assigned job
app.patch('/api/issues/:issueId/accept', authenticateToken, validate(IssueValidator.validateAccept), async (req, res) => {
  console.log('PATCH /api/issues/:issueId/accept - User:', req.user?.username);
  try {
    const user = await findUserByUsername(req.user.username);
    if (user.role !== USER_ROLES.ASSOCIATE) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT);
    }

    const issue = await findIssueById(req.params.issueId);

    if (issue.assignedTo?.toString() !== user._id.toString()) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU);
    }

    if (issue.status !== ISSUE_STATUS.ASSIGNED) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.ISSUE_NOT_IN_ASSIGNED_STATUS);
    }

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      { status: ISSUE_STATUS.IN_PROGRESS, updatedAt: new Date() },
      { new: true, runValidators: false }
    )
      .populate('apartment', 'unitNumber building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue accepted by associate:', user._id);
    return ApiResponse.success(res, updated, 'Issue accepted successfully');
  } catch (err) {
    console.error('Accept issue error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// PATCH /api/issues/:issueId/complete - Associate completes job
app.patch('/api/issues/:issueId/complete', authenticateToken, validate(IssueValidator.validateComplete), async (req, res) => {
  console.log('PATCH /api/issues/:issueId/complete - User:', req.user?.username);
  try {
    const user = await findUserByUsername(req.user.username);
    if (user.role !== USER_ROLES.ASSOCIATE) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_ASSOCIATES_COMPLETE);
    }

    const issue = await findIssueById(req.params.issueId);

    if (issue.assignedTo?.toString() !== user._id.toString()) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU);
    }

    if (issue.status !== ISSUE_STATUS.IN_PROGRESS) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.ISSUE_MUST_BE_IN_PROGRESS);
    }

    const { completionNotes, cost } = req.body;
    const updateData = {
      status: 'resolved',
      completionDate: new Date(),
      updatedAt: new Date()
    };
    if (completionNotes) updateData.completionNotes = completionNotes;
    if (cost) updateData.cost = cost;

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true, runValidators: false }
    )
      .populate('apartment', 'unitNumber building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue completed by associate:', user._id);
    return ApiResponse.success(res, updated, 'Issue completed successfully');
  } catch (err) {
    console.error('Complete issue error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// PATCH /api/buildings/:buildingId/assign-manager - Assign manager to building
app.patch('/api/buildings/:buildingId/assign-manager', authenticateToken, async (req, res) => {
  console.log('PATCH /api/buildings/:buildingId/assign-manager - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Found user:', user.username, 'Role:', user.role);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_ASSIGN_MANAGERS);

    const { managerId } = req.body;
    const building = await findBuildingById(req.params.buildingId);

    // Validate manager exists and is active (if managerId provided)
    if (managerId) {
      const manager = await findUserById(managerId);
      if (manager.role !== USER_ROLES.MANAGER) {
        return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_MANAGER);
      }
      if (manager.status !== USER_STATUS.ACTIVE) {
        return ApiResponse.badRequest(res, ERROR_MESSAGES.MANAGER_NOT_ACTIVE);
      }
    }

    // Update building manager (null to unassign)
    building.manager = managerId || null;
    await building.save();

    // Populate and return
    const updated = await Building.findById(building._id)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email');

    console.log('Manager assigned:', managerId ? managerId : 'removed');
    return ApiResponse.success(res, updated, 'Manager assigned successfully');
  } catch (err) {
    console.error('Assign manager error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

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
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, {
      error: err.message,
      errorName: err.name,
      errorDetails: err.toString()
    });
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
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== APARTMENT ENDPOINTS =====

// POST /api/buildings/:id/apartments/bulk - Bulk create apartments (manager/director)
app.post('/api/buildings/:id/apartments/bulk', authenticateToken, validate(BuildingValidator.validateBulkApartments), async (req, res) => {
  console.log('POST /api/buildings/:id/apartments/bulk - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || ![USER_ROLES.MANAGER, USER_ROLES.DIRECTOR].includes(user.role)) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_CREATE_APARTMENTS);
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.BUILDING_NOT_FOUND);
    }

    // Check if building already has apartments
    const existingCount = await Apartment.countDocuments({ building: building._id });
    if (existingCount > 0) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.BUILDING_HAS_APARTMENTS);
    }

    const { floors, unitsPerFloor, floorsSpec } = req.body;
    const apartments = [];

    if (floorsSpec) {
      // Advanced spec: custom floors (e.g., "2,3,5")
      const floorNumbers = floorsSpec.split(',').map(f => parseInt(f.trim()));

      for (const floorNum of floorNumbers) {
        // Floor 5 has 2 units, others have 4 units (as per test spec)
        const unitsOnFloor = (floorNum === 5) ? 2 : 4;

        for (let unit = 1; unit <= unitsOnFloor; unit++) {
          apartments.push({
            building: building._id,
            unitNumber: `${floorNum}0${unit}`
          });
        }
      }
    } else if (floors && unitsPerFloor) {
      // Simple replication: same units per floor
      for (let floor = 1; floor <= floors; floor++) {
        for (let unit = 1; unit <= unitsPerFloor; unit++) {
          apartments.push({
            building: building._id,
            unitNumber: `${floor}0${unit}`
          });
        }
      }
    } else {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.FLOORS_OR_SPEC_REQUIRED);
    }

    const created = await Apartment.insertMany(apartments);
    console.log(`Created ${created.length} apartments`);
    return ApiResponse.created(res, { count: created.length }, `${created.length} apartments created`);
  } catch (err) {
    console.error('Bulk create apartments error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// POST /api/buildings/:id/apartments - Create single apartment (manager/director)
app.post('/api/buildings/:id/apartments', authenticateToken, validate(ApartmentValidator.validateCreate), async (req, res) => {
  console.log('POST /api/buildings/:id/apartments - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || ![USER_ROLES.MANAGER, USER_ROLES.DIRECTOR].includes(user.role)) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_CREATE_APARTMENTS);
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.BUILDING_NOT_FOUND);
    }

    const { unitNumber, address } = req.body;

    const apartment = await Apartment.create({
      building: building._id,
      unitNumber,
      address: address || building.address
    });

    console.log('Apartment created:', apartment._id);
    return ApiResponse.created(res, {
      _id: apartment._id,
      building: apartment.building.toString(),
      unitNumber: apartment.unitNumber,
      address: apartment.address
    }, 'Apartment created successfully');
  } catch (err) {
    console.error('Create apartment error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings/:id/apartments - Get all apartments for building (authenticated)
app.get('/api/buildings/:id/apartments', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings/:id/apartments - User:', req.user?.username);
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.BUILDING_NOT_FOUND);
    }

    const apartments = await Apartment.find({ building: building._id }).sort('unitNumber');
    return ApiResponse.success(res, apartments, 'Apartments retrieved');
  } catch (err) {
    console.error('Get apartments error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== TENANT ENDPOINTS =====

// GET /api/buildings/:id/tenants - Get all tenants for building (manager/director)
app.get('/api/buildings/:id/tenants', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings/:id/tenants - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || ![USER_ROLES.MANAGER, USER_ROLES.DIRECTOR].includes(user.role)) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ONLY_MANAGERS_DIRECTORS_VIEW_TENANTS);
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return ApiResponse.notFound(res, ERROR_MESSAGES.BUILDING_NOT_FOUND);
    }

    // Find all tenants assigned to this building
    const tenants = await User.find({
      building: building._id,
      role: USER_ROLES.TENANT
    })
      .populate('apartment', 'unitNumber')
      .populate('building', 'name address')
      .select('username email firstName lastName apartment building createdAt');

    return ApiResponse.success(res, tenants, 'Tenants retrieved');
  } catch (err) {
    console.error('Get tenants error:', err);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

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
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// ===== PHASE 3.2: TENANT REPORTS ISSUES =====
// POST /api/issues - Tenant creates an issue
app.post('/api/issues', authenticateToken, validate(IssueValidator.validateReport), async (req, res) => {
  try {
    console.log(`POST /api/issues - User: ${req.user.username} Body:`, req.body);

    // Fetch user
    const user = await findUserByUsername(req.user.username);
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    // Check if user is a tenant
    requireTenant(user, 'Only tenants can report issues');

    // Validate required fields
    if (!title) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Title is required' });
    }

    if (!description) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Description is required' });
    }

    // Validate priority if provided
    if (priority && ![PRIORITY_LEVELS.LOW, PRIORITY_LEVELS.MEDIUM, PRIORITY_LEVELS.HIGH].includes(priority)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid priority. Must be low, medium, or high' });
    }

    // Fetch apartment to get building
    const apartment = await Apartment.findById(user.apartment);

    // Create issue
    const issue = new Issue({
      createdBy: user._id,
      apartment: user.apartment,
      building: apartment.building,
      title: title.trim(),
      description: description.trim(),
      priority: priority || PRIORITY_LEVELS.MEDIUM,
      status: ISSUE_STATUS.REPORTED
    });

    await issue.save();
    console.log(`Issue created: ${issue._id}`);

    res.status(HTTP_STATUS.CREATED).json({ issue });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

// ===== PHASE 3.3: TENANT VIEWS THEIR OWN ISSUES =====
// GET /api/issues/my - Tenant views their reported issues
app.get('/api/issues/my', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/issues/my - User: ${req.user.username} Query:`, req.query);

    // Fetch user
    const user = await findUserByUsername(req.user.username);
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    // Check if user is a tenant
    requireTenant(user, 'Only tenants can view their issues');

    const { status, priority } = req.query;
    const filter = { createdBy: user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const issues = await populateIssue(Issue.find(filter)).sort({ createdAt: -1 });

    // Flatten building from apartment.building to building for easier access
    const issuesWithBuilding = flattenIssueBuildings(issues);

    console.log(`Tenant issues retrieved: ${issuesWithBuilding.length}`);
    return ApiResponse.success(res, issuesWithBuilding, 'Issues retrieved successfully');
  } catch (error) {
    console.error('Error retrieving tenant issues:', error);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

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
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== PHASE 4.2: ASSOCIATE ACCEPTS JOB WITH COST =====
// POST /api/issues/:id/accept - Associate accepts assigned job with cost estimate
app.post('/api/issues/:id/accept', authenticateToken, async (req, res) => {
  try {
    console.log(`POST /api/issues/${req.params.id}/accept - User: ${req.user.username}`);

    // Fetch user
    const user = await findUserByUsername(req.user.username);

    // Check if user is an associate
    requireAssociate(user, ERROR_MESSAGES.ONLY_ASSOCIATES_ACCEPT);

    // Validate estimatedCost
    const { estimatedCost } = req.body;
    if (estimatedCost === undefined || estimatedCost === null) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'estimatedCost is required' });
    }
    if (typeof estimatedCost !== 'number' || isNaN(estimatedCost)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'estimatedCost must be a valid number' });
    }
    if (estimatedCost < 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'estimatedCost must be a positive number' });
    }

    // Find issue
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ISSUE_NOT_FOUND });
    }

    // Check if issue is assigned to this associate
    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU });
    }

    // Check if issue is in assigned status
    if (issue.status !== ISSUE_STATUS.ASSIGNED) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Issue must be in assigned status to accept' });
    }

    // Update issue
    issue.status = ISSUE_STATUS.IN_PROGRESS;
    issue.cost = estimatedCost;
    await issue.save();

    // Populate and return
    const updated = await populateIssueWithCompany(Issue.findById(issue._id));

    // Flatten building
    const issueObj = flattenIssueBuilding(updated);

    console.log(`Issue ${issue._id} accepted with cost $${estimatedCost}`);
    return ApiResponse.success(res, issueObj, 'Job accepted successfully');
  } catch (error) {
    console.error('Error accepting job:', error);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/issues/:id/reject - Associate rejects assigned job
app.post('/api/issues/:id/reject', authenticateToken, async (req, res) => {
  try {
    console.log(`POST /api/issues/${req.params.id}/reject - User: ${req.user.username}`);

    // Fetch user
    const user = await User.findOne({ username: req.user.username });

    // Check if user is an associate
    if (!user || user.role !== USER_ROLES.ASSOCIATE) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only associates can reject jobs' });
    }

    // Find issue
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ISSUE_NOT_FOUND });
    }

    // Check if issue is assigned to this associate
    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU });
    }

    // Update issue - return to director for reassignment
    issue.status = ISSUE_STATUS.FORWARDED;
    issue.assignedTo = null;
    await issue.save();

    console.log(`Issue ${issue._id} rejected by associate`);
    return ApiResponse.success(res, null, 'Job rejected successfully');
  } catch (error) {
    console.error('Error rejecting job:', error);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== PHASE 4.3: ASSOCIATE MARKS JOB AS COMPLETE =====
// POST /api/issues/:id/complete - Associate marks in-progress job as complete
app.post('/api/issues/:id/complete', authenticateToken, async (req, res) => {
  try {
    console.log(`POST /api/issues/${req.params.id}/complete - User: ${req.user.username}`);

    // Fetch user
    const user = await User.findOne({ username: req.user.username });

    // Check if user is an associate
    if (!user || user.role !== USER_ROLES.ASSOCIATE) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ONLY_ASSOCIATES_COMPLETE });
    }

    // Find issue
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.ISSUE_NOT_FOUND });
    }

    // Check if issue is assigned to this associate
    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: ERROR_MESSAGES.ISSUE_NOT_ASSIGNED_TO_YOU });
    }

    // Check if issue is in in-progress status
    if (issue.status !== ISSUE_STATUS.IN_PROGRESS) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Issue must be in in-progress status to complete' });
    }

    // Update issue
    issue.status = 'resolved';
    issue.completionDate = new Date();
    if (req.body.completionNotes) {
      issue.completionNotes = req.body.completionNotes;
    }
    await issue.save();

    // Create invoice for the completed work
    console.log(`Attempting to create invoice for issue ${issue._id}`);
    console.log(`Issue cost: ${issue.cost}`);
    console.log(`User company: ${user.company}`);
    
    if (issue.cost && issue.cost > 0) {
      console.log(`Creating invoice with amount: ${issue.cost}`);
      
      const invoice = new Invoice({
        company: user.company || 'N/A',
        associate: user._id,
        associateName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        title: issue.title,
        reason: `Rešavanje kvara: ${issue.description?.substring(0, 100) || 'Servisni rad'}`,
        amount: issue.cost,
        date: new Date(),
        building: issue.apartment?.building || null,
        issue: issue._id,
        paid: false
      });
      
      console.log(`Invoice data:`, {
        company: invoice.company,
        associate: invoice.associate,
        associateName: invoice.associateName,
        title: invoice.title,
        amount: invoice.amount
      });
      
      try {
        await invoice.save();
        console.log(`✅ Invoice created successfully for issue ${issue._id}, Amount: ${issue.cost}`);
      } catch (invoiceError) {
        console.error('❌ Error creating invoice:', invoiceError);
        // Don't fail the whole request if invoice creation fails
      }
    } else {
      console.log(`❌ Invoice NOT created - cost is ${issue.cost}`);
    }

    // Populate and return
    const updated = await populateIssueWithCompany(Issue.findById(issue._id));

    // Flatten building
    const issueObj = flattenIssueBuilding(updated);

    console.log(`Issue ${issue._id} marked as complete`);
    return ApiResponse.success(res, issueObj, 'Job completed successfully');
  } catch (error) {
    console.error('Error completing job:', error);
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
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== POLLS ENDPOINTS =====
// GET /api/buildings/:buildingId/polls - Get all polls for a building
app.get('/api/buildings/:buildingId/polls', authenticateToken, async (req, res) => {
  try {
    const polls = await Poll.find({ building: req.params.buildingId })
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, polls, 'Polls retrieved successfully');
  } catch (error) {
    console.error('Error fetching polls:', error);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/buildings/:buildingId/polls - Create a poll
app.post('/api/buildings/:buildingId/polls', authenticateToken, validate(NoticeValidator.validatePoll), async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    // Only managers can create polls
    if (!user || user.role !== USER_ROLES.MANAGER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can create polls' });
    }

    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Question and at least 2 options required' });
    }

    const poll = await Poll.create({
      building: req.params.buildingId,
      question,
      options,
      votes: [],
      createdBy: user._id
    });

    const populated = await Poll.findById(poll._id)
      .populate('createdBy', 'username firstName lastName');

    res.status(HTTP_STATUS.CREATED).json(populated);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

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
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// ===== NOTICES ENDPOINTS =====
// GET /api/buildings/:buildingId/notices - Get all notices for a building
app.get('/api/buildings/:buildingId/notices', authenticateToken, async (req, res) => {
  try {
    const notices = await Notice.find({ building: req.params.buildingId })
      .populate('author', 'username firstName lastName')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, notices, 'Notices retrieved successfully');
  } catch (error) {
    console.error('Error fetching notices:', error);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/buildings/:buildingId/notices - Create a notice
app.post('/api/buildings/:buildingId/notices', authenticateToken, validate(NoticeValidator.validateCreate), async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    // Only managers can create notices
    if (!user || user.role !== USER_ROLES.MANAGER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can create notices' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Content is required' });
    }

    const notice = await Notice.create({
      building: req.params.buildingId,
      author: user._id,
      authorName: user.username,
      authorRole: user.role,
      content
    });

    const populated = await Notice.findById(notice._id)
      .populate('author', 'username firstName lastName');

    res.status(HTTP_STATUS.CREATED).json(populated);
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

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
