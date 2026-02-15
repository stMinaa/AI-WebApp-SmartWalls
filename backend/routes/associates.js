/**
 * Associates Routes - Step 2.2 Part 5
 * Handles associate-specific operations: job listings, associate directory
 */

const express = require('express');
const router = express.Router();

// Models
const User = require('../models/User');
const Issue = require('../models/Issue');

// Middleware
const { authMiddleware: authenticateToken } = require('../middleware/authHelper');

// Utils
const ApiResponse = require('../utils/ApiResponse');
const { ERROR_MESSAGES, USER_ROLES, USER_STATUS, HTTP_STATUS } = require('../config/constants');

// Helpers
const { findUserByUsername } = require('../utils/authHelpers');
const { requireAssociate } = require('../middleware/roleHelper');
const { populateIssueWithCompany, flattenIssueBuildings } = require('../utils/responseHelpers');

// ===== ASSOCIATE ENDPOINTS =====

// GET /associates/me/jobs - Associate views their assigned jobs
router.get('/associates/me/jobs', authenticateToken, async (req, res) => {
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

// GET /associates - Get all associates (for manager/director dropdowns)
router.get('/associates', authenticateToken, async (req, res) => {
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

module.exports = router;
