const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');
const { USER_ROLES, USER_STATUS, ERROR_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { validate } = require('../middleware/validate');
const BuildingValidator = require('../validators/BuildingValidator');
const ApartmentValidator = require('../validators/ApartmentValidator');
const { authenticateToken } = require('../middleware/authHelper');
const { requireDirector, requireManager, requireDirectorOrManager } = require('../middleware/roleHelper');
const { findUserByUsername, findUserById } = require('../utils/authHelpers');
const { findBuildingById } = require('../utils/lookupHelpers');
const { addApartmentCounts } = require('../utils/responseHelpers');
const User = require('../models/User');
const Building = require('../models/Building');
const Apartment = require('../models/Apartment');

// POST /api/buildings - Director creates a building
router.post('/', authenticateToken, validate(BuildingValidator.validateCreate), async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings - Director views all buildings with apartment count
router.get('/', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings - User:', req.user?.username, 'Query:', req.query);
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Found user:', user.username, 'Role:', user.role);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_VIEW_BUILDINGS);

    const filter = {};
    if (req.query.managerId) {
      filter.manager = req.query.managerId;
    }

    const buildings = await Building.find(filter)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log('Found buildings:', buildings.length);
    const buildingsWithCount = await addApartmentCounts(buildings);

    console.log('Returning buildings with counts');
    return ApiResponse.success(res, buildingsWithCount, 'Buildings retrieved');
  } catch (err) {
    console.error('Get buildings error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings/managed - Manager views their assigned buildings
router.get('/managed', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByUsername(req.user.username);
    requireManager(user, ERROR_MESSAGES.ONLY_MANAGERS_VIEW_BUILDINGS);

    const buildings = await Building.find({ manager: user._id })
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const buildingsWithCount = await addApartmentCounts(buildings);

    return ApiResponse.success(res, buildingsWithCount, 'Managed buildings retrieved');
  } catch (err) {
    console.error('Get managed buildings error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// PATCH /api/buildings/:buildingId/assign-manager - Assign manager to building
router.patch('/:buildingId/assign-manager', authenticateToken, async (req, res) => {
  console.log('PATCH /api/buildings/:buildingId/assign-manager - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await findUserByUsername(req.user.username);
    console.log('Found user:', user.username, 'Role:', user.role);
    requireDirector(user, ERROR_MESSAGES.ONLY_DIRECTORS_ASSIGN_MANAGERS);

    const { managerId } = req.body;
    const building = await findBuildingById(req.params.buildingId);

    if (managerId) {
      const manager = await findUserById(managerId);
      if (manager.role !== USER_ROLES.MANAGER) {
        return ApiResponse.badRequest(res, ERROR_MESSAGES.INVALID_MANAGER);
      }
      if (manager.status !== USER_STATUS.ACTIVE) {
        return ApiResponse.badRequest(res, ERROR_MESSAGES.MANAGER_NOT_ACTIVE);
      }
    }

    building.manager = managerId || null;
    await building.save();

    const updated = await Building.findById(building._id)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email');

    console.log('Manager assigned:', managerId ? managerId : 'removed');
    return ApiResponse.success(res, updated, 'Manager assigned successfully');
  } catch (err) {
    console.error('Assign manager error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// POST /api/buildings/:id/apartments/bulk - Bulk create apartments
router.post('/:id/apartments/bulk', authenticateToken, async (req, res) => {
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

    const existingCount = await Apartment.countDocuments({ building: building._id });
    if (existingCount > 0) {
      return ApiResponse.badRequest(res, ERROR_MESSAGES.BUILDING_HAS_APARTMENTS);
    }

    const { floors, unitsPerFloor, floorsSpec } = req.body;
    const apartments = [];

    if (floorsSpec) {
      const floorNumbers = floorsSpec.split(',').map(f => parseInt(f.trim()));
      for (const floorNum of floorNumbers) {
        const unitsOnFloor = (floorNum === 5) ? 2 : 4;
        for (let unit = 1; unit <= unitsOnFloor; unit++) {
          apartments.push({
            building: building._id,
            unitNumber: `${floorNum}0${unit}`
          });
        }
      }
    } else if (floors && unitsPerFloor) {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// POST /api/buildings/:id/apartments - Create single apartment
router.post('/:id/apartments', authenticateToken, validate(ApartmentValidator.validateCreate), async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings/:id/apartments - Get all apartments for building
router.get('/:id/apartments', authenticateToken, async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings/:id/tenants - Get all tenants for building
router.get('/:id/tenants', authenticateToken, async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// GET /api/buildings/:buildingId/polls - Get all polls for a building
router.get('/:buildingId/polls', authenticateToken, async (req, res) => {
  try {
    const Poll = require('../models/Poll');
    const polls = await Poll.find({ building: req.params.buildingId })
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, polls, 'Polls retrieved successfully');
  } catch (error) {
    console.error('Error fetching polls:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/buildings/:buildingId/polls - Create a poll
router.post('/:buildingId/polls', authenticateToken, validate(require('../validators/NoticeValidator').validatePoll), async (req, res) => {
  try {
    const Poll = require('../models/Poll');
    const user = await User.findOne({ username: req.user.username });

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
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

// GET /api/buildings/:buildingId/notices - Get all notices for a building
router.get('/:buildingId/notices', authenticateToken, async (req, res) => {
  try {
    const Notice = require('../models/Notice');
    const notices = await Notice.find({ building: req.params.buildingId })
      .populate('author', 'username firstName lastName')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, notices, 'Notices retrieved successfully');
  } catch (error) {
    console.error('Error fetching notices:', error);
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

// POST /api/buildings/:buildingId/notices - Create a notice
router.post('/:buildingId/notices', authenticateToken, validate(require('../validators/NoticeValidator').validateCreate), async (req, res) => {
  try {
    const Notice = require('../models/Notice');
    const user = await User.findOne({ username: req.user.username });

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

module.exports = router;
