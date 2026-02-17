const express = require('express');
const router = express.Router();

const { ERROR_MESSAGES, USER_ROLES, HTTP_STATUS } = require('../../../../config/constants');
const { authMiddleware: authenticateToken } = require('../../../../middleware/authHelper');
const { validate } = require('../../../../middleware/validate');
const Notice = require('../../../../models/Notice');
const Poll = require('../../../../models/Poll');
const User = require('../../../../models/User');
const ApiResponse = require('../../../../utils/ApiResponse');
const ApartmentValidator = require('../../../../validators/ApartmentValidator');
const BuildingValidator = require('../../../../validators/BuildingValidator');
const NoticeValidator = require('../../../../validators/NoticeValidator');
const BuildingService = require('../../../application/service/BuildingService');
const MongoApartmentRepository = require('../../persistence/MongoApartmentRepository');
const MongoBuildingRepository = require('../../persistence/MongoBuildingRepository');
const MongoUserRepository = require('../../persistence/MongoUserRepository');
const BuildingController = require('../controllers/BuildingController');

const buildingRepo = new MongoBuildingRepository();
const apartmentRepo = new MongoApartmentRepository();
const userRepo = new MongoUserRepository();
const buildingService = new BuildingService(buildingRepo, apartmentRepo, userRepo);
const controller = new BuildingController(buildingService);

// ===== BUILDING ENDPOINTS (hex) =====
router.post('/', authenticateToken, validate(BuildingValidator.validateCreate), (req, res) =>
  controller.createBuilding(req, res)
);
router.get('/', authenticateToken, (req, res) => controller.listBuildings(req, res));
router.get('/managed', authenticateToken, (req, res) => controller.listManagedBuildings(req, res));
router.patch('/:buildingId/assign-manager', authenticateToken, (req, res) =>
  controller.assignManager(req, res)
);

// ===== APARTMENT ENDPOINTS (hex) =====
router.post('/:id/apartments/bulk', authenticateToken, (req, res) =>
  controller.bulkCreateApartments(req, res)
);
router.post(
  '/:id/apartments',
  authenticateToken,
  validate(ApartmentValidator.validateCreate),
  (req, res) => controller.createApartment(req, res)
);
router.get('/:id/apartments', authenticateToken, (req, res) => controller.listApartments(req, res));

// ===== TENANT ENDPOINTS (hex) =====
router.get('/:id/tenants', authenticateToken, (req, res) => controller.listTenants(req, res));

// ===== POLL ENDPOINTS (legacy inline - will migrate later) =====
router.get('/:buildingId/polls', authenticateToken, async (req, res) => {
  try {
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

router.post(
  '/:buildingId/polls',
  authenticateToken,
  validate(NoticeValidator.validatePoll),
  async (req, res) => {
    try {
      const user = await User.findOne({ username: req.user.username });
      if (!user || user.role !== USER_ROLES.MANAGER) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Only managers can create polls' });
      }

      const { question, options } = req.body;
      if (!question || !options || options.length < 2) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: 'Question and at least 2 options required' });
      }

      const poll = await Poll.create({
        building: req.params.buildingId,
        question,
        options,
        votes: [],
        createdBy: user._id
      });

      const populated = await Poll.findById(poll._id).populate(
        'createdBy',
        'username firstName lastName'
      );

      res.status(HTTP_STATUS.CREATED).json(populated);
    } catch (error) {
      console.error('Error creating poll:', error);
      if (error.status) return ApiResponse.error(res, error.message, error.status);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  }
);

// ===== NOTICE ENDPOINTS (legacy inline - will migrate later) =====
router.get('/:buildingId/notices', authenticateToken, async (req, res) => {
  try {
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

router.post(
  '/:buildingId/notices',
  authenticateToken,
  validate(NoticeValidator.validateCreate),
  async (req, res) => {
    try {
      const user = await User.findOne({ username: req.user.username });
      if (!user || user.role !== USER_ROLES.MANAGER) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ error: 'Only managers can create notices' });
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

      const populated = await Notice.findById(notice._id).populate(
        'author',
        'username firstName lastName'
      );

      res.status(HTTP_STATUS.CREATED).json(populated);
    } catch (error) {
      console.error('Error creating notice:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
  }
);

module.exports = router;
