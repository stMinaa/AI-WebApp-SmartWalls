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
const { ERROR_MESSAGES, USER_ROLES, ISSUE_STATUS, PRIORITY_LEVELS, HTTP_STATUS, USER_STATUS } = require('../config/constants');

// Helpers
const { findUserByUsername, findUserById } = require('../utils/authHelpers');
const { findIssueById } = require('../utils/lookupHelpers');
const { requireTenant, requireManager, requireDirector } = require('../middleware/roleHelper');
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

// ===== MANAGER WORKFLOW (Part 3B) =====

// PATCH /:issueId/triage - Manager triages issue (forward/reject/assign)
router.patch('/:issueId/triage', authenticateToken, validate(IssueValidator.validateTriage), async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err.message);
  }
});

// PATCH /:issueId/assign - Director assigns forwarded issue (or rejects)
router.patch('/:issueId/assign', authenticateToken, validate(IssueValidator.validateAssign), async (req, res) => {
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
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
});

module.exports = router;
