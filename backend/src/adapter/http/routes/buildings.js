const express = require('express');
const router = express.Router();

const { authMiddleware: authenticateToken } = require('../../../../middleware/authHelper');
const { validate } = require('../../../../middleware/validate');
const ApartmentValidator = require('../../../../validators/ApartmentValidator');
const BuildingValidator = require('../../../../validators/BuildingValidator');
const NoticeValidator = require('../../../../validators/NoticeValidator');
const {
  buildingController: controller,
  noticeController,
  pollController
} = require('../../composition');

// ===== BUILDING ENDPOINTS =====
router.post('/', authenticateToken, validate(BuildingValidator.validateCreate), (req, res) =>
  controller.createBuilding(req, res)
);
router.get('/', authenticateToken, (req, res) => controller.listBuildings(req, res));
router.get('/managed', authenticateToken, (req, res) => controller.listManagedBuildings(req, res));
router.patch('/:buildingId/assign-manager', authenticateToken, (req, res) =>
  controller.assignManager(req, res)
);

// ===== APARTMENT ENDPOINTS =====
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

// ===== TENANT ENDPOINTS =====
router.get('/:id/tenants', authenticateToken, (req, res) => controller.listTenants(req, res));

// ===== POLL ENDPOINTS =====
router.get('/:buildingId/polls', authenticateToken, (req, res) =>
  pollController.listByBuilding(req, res)
);
router.post(
  '/:buildingId/polls',
  authenticateToken,
  validate(NoticeValidator.validatePoll),
  (req, res) => pollController.create(req, res)
);

// ===== NOTICE ENDPOINTS =====
router.get('/:buildingId/notices', authenticateToken, (req, res) =>
  noticeController.listByBuilding(req, res)
);
router.post(
  '/:buildingId/notices',
  authenticateToken,
  validate(NoticeValidator.validateCreate),
  (req, res) => noticeController.create(req, res)
);

module.exports = router;
