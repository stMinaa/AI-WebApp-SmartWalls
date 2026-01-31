/**
 * User Service
 * Handles user-related business logic: registration, login, profile updates, approval workflow
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, HTTP_STATUS, ERROR_MESSAGES, USER_ROLES, USER_STATUS } = require('../config/constants');
const { 
  validateRegistrationData, 
  validateLoginData,
  sanitizeString 
} = require('../utils/validation');

/**
 * Create standardized error object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} Error object
 */
function createError(status, message) {
  return { status, message };
}

/**
 * Register a new user
 * @param {Object} data - { username, password, role, firstName, lastName, email, mobile, company, buildingId, apartmentId }
 * @returns {Promise<{ token: string, role: string, user: Object }>}
 */
async function registerUser(data) {
  // Validate input data
  const validation = validateRegistrationData(data);
  if (!validation.valid) {
    throw createError(HTTP_STATUS.BAD_REQUEST, validation.message);
  }

  const { 
    username, 
    password, 
    role, 
    firstName, 
    lastName, 
    email, 
    mobile, 
    company, 
    buildingId, 
    apartmentId 
  } = data;

  // Sanitize inputs
  const sanitizedUsername = sanitizeString(username);
  const sanitizedEmail = sanitizeString(email);

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { username: sanitizedUsername }, 
      { email: sanitizedEmail }
    ] 
  });

  if (existingUser) {
    throw createError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.USER_EXISTS);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user object
  const user = new User({
    username: sanitizedUsername,
    password: hashedPassword,
    role,
    firstName: sanitizeString(firstName),
    lastName: sanitizeString(lastName),
    email: sanitizedEmail,
    mobile: mobile ? sanitizeString(mobile) : undefined
  });

  // Handle role-specific setup
  await handleRoleSpecificSetup(user, role, { company, buildingId, apartmentId });

  // Save user
  await user.save();

  // Generate token
  const token = jwt.sign(
    { username: user.username, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );

  // Return user info without password
  const { password: _, ...userInfo } = user.toObject();
  return { 
    message: 'User registered successfully',
    token, 
    role: user.role, 
    user: userInfo 
  };
}

/**
 * Handle role-specific user setup
 * @param {Object} user - User document
 * @param {string} role - User role
 * @param {Object} options - Additional options (company, buildingId, apartmentId)
 */
async function handleRoleSpecificSetup(user, role, options) {
  const { company, buildingId, apartmentId } = options;

  // Tenant setup
  if (role === USER_ROLES.TENANT) {
    user.status = USER_STATUS.PENDING;
    
    if (buildingId && apartmentId) {
      await validateTenantBuilding(user, buildingId, apartmentId);
    }
  }

  // Associate/Manager setup
  if (role === USER_ROLES.ASSOCIATE || role === USER_ROLES.MANAGER) {
    user.status = USER_STATUS.PENDING;
    
    if (role === USER_ROLES.ASSOCIATE && company) {
      user.company = sanitizeString(company);
    }
  }
}

/**
 * Validate tenant building and apartment assignment
 * @param {Object} user - User document
 * @param {string} buildingId - Building ID
 * @param {string} apartmentId - Apartment ID
 */
async function validateTenantBuilding(user, buildingId, apartmentId) {
  const { Building } = require('../models');
  const { Apartment } = require('../models');

  const building = await Building.findById(buildingId);
  if (!building) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid building selection');
  }

  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid apartment selection');
  }

  if (String(apartment.building) !== String(building._id)) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Apartment not in selected building');
  }

  if (apartment.tenant) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Apartment already occupied');
  }

  user.requestedBuilding = building._id;
  user.requestedApartment = apartment._id;
}

/**
 * Login user
 * @param {Object} data - { username, password }
 * @returns {Promise<{ token: string, role: string, user: Object }>}
 */
async function loginUser(data) {
  // Validate input
  const validation = validateLoginData(data);
  if (!validation.valid) {
    throw createError(HTTP_STATUS.BAD_REQUEST, validation.message);
  }

  const { username, password } = data;
  const sanitizedUsername = sanitizeString(username);

  // Find user by username or email
  const user = await User.findOne({ 
    $or: [
      { username: sanitizedUsername }, 
      { email: sanitizedUsername }
    ] 
  });

  if (!user) {
    throw createError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Generate token
  const token = jwt.sign(
    { username: user.username, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );

  // Return user info without password
  const { password: _, ...userInfo } = user.toObject();
  return { 
    message: 'Login successful',
    token, 
    role: user.role, 
    user: userInfo 
  };
}

/**
 * Get user profile
 * @param {string} username
 * @returns {Promise<Object>}
 */
async function getUserProfile(username) {
  const user = await User.findOne({ username });
  if (!user) {
    throw createError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { password: _, ...userInfo } = user.toObject();
  return userInfo;
}

/**
 * Update user profile
 * @param {string} username
 * @param {Object} updates - { firstName, lastName, mobile, householdMembers, company, specialties, description, website, serviceAreas, yearsExperience }
 * @returns {Promise<Object>}
 */
async function updateUserProfile(username, updates) {
  const user = await User.findOne({ username });
  if (!user) {
    throw createError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { 
    firstName, 
    lastName, 
    mobile, 
    householdMembers, 
    company, 
    specialties, 
    description, 
    website, 
    serviceAreas, 
    yearsExperience 
  } = updates;

  // Update basic fields
  if (firstName) user.firstName = sanitizeString(firstName);
  if (lastName) user.lastName = sanitizeString(lastName);

  // Validate and update mobile
  if (mobile) {
    const mobileValidation = require('../utils/validation').validateMobile(mobile, false);
    if (!mobileValidation.valid) {
      throw createError(HTTP_STATUS.BAD_REQUEST, mobileValidation.message);
    }
    user.mobile = sanitizeString(mobile);
  }

  // Tenant-specific updates
  if (user.role === USER_ROLES.TENANT && householdMembers !== undefined) {
    await updateTenantHousehold(user, householdMembers);
  }

  // Associate-specific updates
  if (user.role === USER_ROLES.ASSOCIATE) {
    updateAssociateFields(user, {
      company,
      specialties,
      description,
      website,
      serviceAreas,
      yearsExperience
    });
  }

  await user.save();
  const { password: _, ...userInfo } = user.toObject();
  return { message: 'Profile updated', user: userInfo };
}

/**
 * Update tenant household members
 * @param {Object} user - User document
 * @param {number} householdMembers - Number of household members
 */
async function updateTenantHousehold(user, householdMembers) {
  const n = Number(householdMembers);
  
  if (!Number.isInteger(n) || n < 1) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid household members count');
  }

  if (!user.apartment) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'No apartment assigned');
  }

  const { Apartment } = require('../models');
  const apt = await Apartment.findById(user.apartment);
  
  if (apt) {
    apt.numPeople = n;
    await apt.save();
  }
}

/**
 * Update associate-specific fields
 * @param {Object} user - User document
 * @param {Object} fields - Associate fields to update
 */
function updateAssociateFields(user, fields) {
  const { company, specialties, description, website, serviceAreas, yearsExperience } = fields;

  if (typeof company === 'string') {
    user.company = sanitizeString(company);
  }

  if (Array.isArray(specialties)) {
    user.specialties = specialties
      .map(s => sanitizeString(String(s)))
      .filter(Boolean);
  }

  if (typeof description === 'string') {
    user.description = sanitizeString(description);
  }

  if (typeof website === 'string') {
    user.website = sanitizeString(website);
  }

  if (Array.isArray(serviceAreas)) {
    user.serviceAreas = serviceAreas
      .map(s => sanitizeString(String(s)))
      .filter(Boolean);
  }

  if (yearsExperience !== undefined) {
    const y = Number(yearsExperience);
    if (!Number.isInteger(y) || y < 0) {
      throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid years of experience');
    }
    user.yearsExperience = y;
  }
}

/**
 * Get all managers (for director)
 * @returns {Promise<Array>}
 */
async function getAllManagers() {
  const managers = await User.find({ role: 'manager' })
    .select('firstName lastName username email managedBuildings')
    .populate('managedBuildings', 'name address');
  return managers;
}

/**
 * Get all associates (for director/manager)
 * @returns {Promise<Array>}
 */
async function getAllAssociates() {
  const associates = await User.find({ role: 'associate' })
    .select('username firstName lastName email mobile company specialties description website serviceAreas yearsExperience');
  return associates;
}

/**
 * Get pending staff (managers/associates awaiting approval)
 * @param {string} [role] - optional filter by role
 * @returns {Promise<Array>}
 */
async function getPendingStaff(role) {
  const query = { status: 'pending', role: { $in: ['manager', 'associate'] } };
  if (role && ['manager', 'associate'].includes(role)) query.role = role;
  return await User.find(query).select('firstName lastName username email role company');
}

/**
 * Approve pending user (director only)
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function approveUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (!['manager', 'associate'].includes(user.role)) throw { status: 400, message: 'Not approvable role' };
  if (user.status !== 'pending') throw { status: 400, message: 'User not pending' };

  user.status = 'active';
  await user.save();
  return { message: 'User approved', userId: user._id };
}

/**
 * Reject pending user (director only)
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function rejectUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (!['manager', 'associate'].includes(user.role)) throw { status: 400, message: 'Not rejectable role' };
  if (user.status !== 'pending') throw { status: 400, message: 'User not pending' };

  user.status = 'rejected';
  await user.save();
  return { message: 'User rejected', userId: user._id };
}

/**
 * Delete user (director only)
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function deleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (!['manager', 'associate'].includes(user.role)) {
    throw { status: 400, message: 'Only managers or associates can be deleted' };
  }

  // If manager, unset from buildings
  if (user.role === 'manager') {
    const { Building } = require('../models');
    await Building.updateMany({ manager: user._id }, { $unset: { manager: '' } });
  }

  await User.deleteOne({ _id: user._id });
  return { message: 'User deleted', userId: user._id };
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllManagers,
  getAllAssociates,
  getPendingStaff,
  approveUser,
  rejectUser,
  deleteUser
};
