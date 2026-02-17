/**
 * User Service
 * Handles user-related business logic: registration, login, profile updates, approval workflow
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  JWT_SECRET,
  HTTP_STATUS,
  ERROR_MESSAGES,
  USER_ROLES,
  USER_STATUS,
  TOKEN_EXPIRY
} = require('../config/constants');
const User = require('../models/User');
const {
  validateRegistrationData,
  validateLoginData,
  sanitizeString
} = require('../utils/validation');

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY || '1h' }
  );
}

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function checkUserExists(username, email) {
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) throw createError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.USER_EXISTS);
}

function buildUserObject(data, hashedPassword) {
  return new User({
    username: sanitizeString(data.username),
    password: hashedPassword,
    role: data.role,
    firstName: sanitizeString(data.firstName),
    lastName: sanitizeString(data.lastName),
    email: sanitizeString(data.email),
    mobile: data.mobile ? sanitizeString(data.mobile) : undefined
  });
}

async function registerUser(data) {
  const validation = validateRegistrationData(data);
  if (!validation.valid) throw createError(HTTP_STATUS.BAD_REQUEST, validation.message);

  await checkUserExists(sanitizeString(data.username), sanitizeString(data.email));

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = buildUserObject(data, hashedPassword);

  await handleRoleSpecificSetup(user, data.role, {
    company: data.company,
    buildingId: data.buildingId,
    apartmentId: data.apartmentId
  });

  await user.save();
  const token = generateToken(user);
  const { password: _, ...userInfo } = user.toObject();
  return { message: 'User registered successfully', token, role: user.role, user: userInfo };
}

async function setupTenantUser(user, buildingId, apartmentId) {
  user.status = USER_STATUS.PENDING;

  if (buildingId && apartmentId) {
    await validateTenantBuilding(user, buildingId, apartmentId);
  }
}

function setupAssociateOrManager(user, role, company) {
  user.status = USER_STATUS.PENDING;

  if (role === USER_ROLES.ASSOCIATE && company) {
    user.company = sanitizeString(company);
  }
}

async function handleRoleSpecificSetup(user, role, options) {
  const { company, buildingId, apartmentId } = options;

  // Tenant setup
  if (role === USER_ROLES.TENANT) {
    await setupTenantUser(user, buildingId, apartmentId);
    return;
  }

  // Associate/Manager setup
  if (role === USER_ROLES.ASSOCIATE || role === USER_ROLES.MANAGER) {
    setupAssociateOrManager(user, role, company);
  }
}

async function findAndValidateBuilding(buildingId) {
  const Building = require('../models/Building');
  const building = await Building.findById(buildingId);
  if (!building) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid building selection');
  }
  return building;
}

async function findAndValidateApartment(apartmentId) {
  const Apartment = require('../models/Apartment');
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid apartment selection');
  }
  return apartment;
}

function validateApartmentBelongsToBuilding(apartment, building) {
  if (String(apartment.building) !== String(building._id)) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Apartment not in selected building');
  }
}

function validateApartmentIsAvailable(apartment) {
  if (apartment.tenant) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Apartment already occupied');
  }
}

async function validateTenantBuilding(user, buildingId, apartmentId) {
  const building = await findAndValidateBuilding(buildingId);
  const apartment = await findAndValidateApartment(apartmentId);
  validateApartmentBelongsToBuilding(apartment, building);
  validateApartmentIsAvailable(apartment);

  user.requestedBuilding = building._id;
  user.requestedApartment = apartment._id;
}

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
    $or: [{ username: sanitizedUsername }, { email: sanitizedUsername }]
  });

  if (!user) {
    throw createError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken(user);
  const { password: _, ...userInfo } = user.toObject();
  return { message: 'Login successful', token, role: user.role, user: userInfo };
}

async function getUserProfile(username) {
  const user = await User.findOne({ username });
  if (!user) {
    throw createError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { password: _, ...userInfo } = user.toObject();
  return userInfo;
}

function updateBasicFields(user, firstName, lastName) {
  if (firstName) user.firstName = sanitizeString(firstName);
  if (lastName) user.lastName = sanitizeString(lastName);
}

function updateMobileField(user, mobile) {
  if (!mobile) return;

  const mobileValidation = require('../utils/validation').validateMobile(mobile, false);
  if (!mobileValidation.valid) {
    throw createError(HTTP_STATUS.BAD_REQUEST, mobileValidation.message);
  }
  user.mobile = sanitizeString(mobile);
}

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
  updateBasicFields(user, firstName, lastName);

  // Validate and update mobile
  updateMobileField(user, mobile);

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

async function updateTenantHousehold(user, householdMembers) {
  const n = Number(householdMembers);

  if (!Number.isInteger(n) || n < 1) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid household members count');
  }

  if (!user.apartment) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'No apartment assigned');
  }

  const Apartment = require('../models/Apartment');
  const apt = await Apartment.findById(user.apartment);

  if (apt) {
    apt.numPeople = n;
    await apt.save();
  }
}

function updateStringField(user, fieldName, value) {
  if (typeof value === 'string') {
    user[fieldName] = sanitizeString(value);
  }
}

function updateArrayField(user, fieldName, arrayValue) {
  if (Array.isArray(arrayValue)) {
    user[fieldName] = arrayValue.map((item) => sanitizeString(String(item))).filter(Boolean);
  }
}

function updateYearsExperience(user, value) {
  if (value !== undefined) {
    const years = Number(value);
    if (!Number.isInteger(years) || years < 0) {
      throw createError(HTTP_STATUS.BAD_REQUEST, 'Invalid years of experience');
    }
    user.yearsExperience = years;
  }
}

function updateAssociateFields(user, fields) {
  const { company, specialties, description, website, serviceAreas, yearsExperience } = fields;

  updateStringField(user, 'company', company);
  updateArrayField(user, 'specialties', specialties);
  updateStringField(user, 'description', description);
  updateStringField(user, 'website', website);
  updateArrayField(user, 'serviceAreas', serviceAreas);
  updateYearsExperience(user, yearsExperience);
}

async function getAllManagers() {
  const managers = await User.find({ role: 'manager' })
    .select('firstName lastName username email managedBuildings')
    .populate('managedBuildings', 'name address');
  return managers;
}

async function getAllAssociates() {
  // Find associates that are active (either status: 'active' or status: undefined)
  const associates = await User.find({
    role: 'associate',
    $or: [{ status: 'active' }, { status: { $exists: false } }]
  }).select(
    'username firstName lastName email mobile company specialties description website serviceAreas yearsExperience'
  );
  return associates;
}

async function getPendingStaff(role) {
  const query = { status: 'pending', role: { $in: ['manager', 'associate'] } };
  if (role && ['manager', 'associate'].includes(role)) query.role = role;
  return await User.find(query).select('firstName lastName username email role company');
}

async function approveUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw createError(HTTP_STATUS.NOT_FOUND, 'User not found');
  if (!['manager', 'associate'].includes(user.role))
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Not approvable role');
  if (user.status !== 'pending') throw createError(HTTP_STATUS.BAD_REQUEST, 'User not pending');

  user.status = 'active';
  await user.save();
  return { message: 'User approved', userId: user._id };
}

async function rejectUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw createError(HTTP_STATUS.NOT_FOUND, 'User not found');
  if (!['manager', 'associate'].includes(user.role))
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Not rejectable role');
  if (user.status !== 'pending') throw createError(HTTP_STATUS.BAD_REQUEST, 'User not pending');

  user.status = 'rejected';
  await user.save();
  return { message: 'User rejected', userId: user._id };
}

async function deleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw createError(HTTP_STATUS.NOT_FOUND, 'User not found');
  if (!['manager', 'associate'].includes(user.role)) {
    throw createError(HTTP_STATUS.BAD_REQUEST, 'Only managers or associates can be deleted');
  }

  // If manager, unset from buildings
  if (user.role === 'manager') {
    const Building = require('../models/Building');
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
