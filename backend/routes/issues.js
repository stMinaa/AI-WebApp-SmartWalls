const express = require('express');
const router = express.Router();

// Models
const Issue = require('../models/Issue');
const Apartment = require('../models/Apartment');
const Building = require('../models/Building');
const User = require('../models/User');

// Middleware
const { authMiddleware: authenticateToken } = require('../middleware/authHelper');
const { validate } = require('../middleware/validate');

// Validators
const IssueValidator = require('../validators/IssueValidator');

// Utils
const ApiResponse = require('../utils/ApiResponse');
const { ERROR_MESSAGES, USER_ROLES, ISSUE_STATUS, PRIORITY_LEVELS, HTTP_STATUS } = require('../config/constants');

// Helpers
const { findUserByUsername } = require('../utils/authHelpers');
const { requireTenant } = require('../middleware/roleHelper');
const { populateIssue, flattenIssueBuildings } = require('../utils/responseHelpers');

// ===== BASIC ISSUE OPERATIONS (Part 3A) =====

// GET / - List all issues (manager/director only, role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

// POST / - Report new issue (tenant only)
router.post('/', authenticateToken, validate(IssueValidator.validateReport), async (req, res) => {
  try {
    console.log(`POST /api/issues - User: ${req.user.username} Body:`, req.body);

    const { title, description, priority } = req.body;

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

    // Check tenant is assigned to an apartment
    if (!user.apartment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Tenant is not assigned to an apartment' });
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
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
});

// GET /my - Tenant views their reported issues
router.get('/my', authenticateToken, async (req, res) => {
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
    if (error.status) return ApiResponse.error(res, error.message, error.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, error);
  }
});

module.exports = router;
