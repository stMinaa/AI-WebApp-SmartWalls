/**
 * Buildings Routes
 * Create, manage buildings and apartments
 */

const express = require('express');
const router = express.Router();
const buildingService = require('../services/buildingService');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const { authMiddleware, requireRole } = require('../middleware/authHelper');
const { isValidObjectId, isPositiveInteger } = require('../middleware/validationHelper');

/**
 * POST /api/buildings
 * Create a new building (director/admin only)
 */
router.post('/', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const { name, address } = req.body;

  if (!name?.trim()) return sendError(res, 400, 'Building name required');
  if (!address?.trim()) return sendError(res, 400, 'Address required');

  const result = await buildingService.createBuilding({ name, address });
  sendSuccess(res, 201, result.message, result.building);
}));

/**
 * GET /api/buildings
 * Get all buildings
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const buildings = await buildingService.getAllBuildings();
  sendSuccess(res, 200, 'Buildings retrieved', buildings);
}));

/**
 * GET /api/buildings/managed
 * Get buildings managed by current manager
 */
router.get('/managed', authMiddleware, requireRole('manager'), asyncHandler(async (req, res) => {
  // This route should be before /:id to avoid matching
  // Fetch from user's managedBuildings
  const User = require('../models/User');
  const user = await User.findOne({ username: req.user.username }).populate('managedBuildings');

  if (!user || user.status !== 'active') {
    return sendError(res, 403, 'Manager not active');
  }

  sendSuccess(res, 200, 'Managed buildings retrieved', user.managedBuildings || []);
}));

/**
 * GET /api/buildings/:id
 * Get building details with apartments
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid building ID');

  const building = await buildingService.getBuilding(req.params.id);
  sendSuccess(res, 200, 'Building retrieved', building);
}));

/**
 * GET /api/buildings/:id/info
 * Get minimal building info (address, name)
 */
router.get('/:id/info', authMiddleware, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid building ID');

  const building = await buildingService.getBuilding(req.params.id);
  sendSuccess(res, 200, 'Building info retrieved', {
    _id: building._id,
    name: building.name,
    address: building.address
  });
}));

/**
 * POST /api/buildings/:id/manager
 * Assign manager to building (director/admin only)
 */
router.post('/:id/manager', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const { managerUsername } = req.body;

  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid building ID');
  if (!managerUsername?.trim()) return sendError(res, 400, 'Manager username required');

  const result = await buildingService.assignManager(req.params.id, managerUsername.trim());
  sendSuccess(res, 200, result.message, result.building);
}));

/**
 * GET /api/buildings/:id/apartments
 * Get apartments in building
 */
router.get('/:id/apartments', authMiddleware, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid building ID');

  const apartments = await buildingService.getApartments(req.params.id);
  sendSuccess(res, 200, 'Apartments retrieved', apartments);
}));

/**
 * POST /api/buildings/:id/apartments/bulk
 * Bulk create apartments (director/admin only)
 */
router.post('/:id/apartments/bulk', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const { startUnit, count, replicaValue } = req.body;

  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid building ID');
  if (!startUnit || !count) return sendError(res, 400, 'startUnit and count required');
  if (!isPositiveInteger(startUnit)) return sendError(res, 400, 'Invalid startUnit');
  if (!isPositiveInteger(count)) return sendError(res, 400, 'Invalid count');

  const result = await buildingService.bulkCreateApartments(req.params.id, { startUnit, count, replicaValue });
  sendSuccess(res, 201, result.message, result.apartments);
}));

/**
 * GET /api/buildings/:id/stats
 * Get building statistics (occupancy, etc)
 */
router.get('/:id/stats', authMiddleware, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid building ID');

  const stats = await buildingService.getBuildingStats(req.params.id);
  sendSuccess(res, 200, 'Building stats retrieved', stats);
}));

module.exports = router;
