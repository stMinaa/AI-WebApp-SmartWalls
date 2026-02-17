const express = require('express');
const router = express.Router();

const { authMiddleware: authenticateToken } = require('../../../../middleware/authHelper');
const UserService = require('../../../application/service/UserService');
const MongoUserRepository = require('../../persistence/MongoUserRepository');
const UserController = require('../controllers/UserController');

// Wire dependencies
const userRepo = new MongoUserRepository();
const userService = new UserService(userRepo);
const controller = new UserController(userService);

// ===== USER MANAGEMENT ENDPOINTS =====
router.patch('/users/:id/debt', authenticateToken, (req, res) => controller.updateDebt(req, res));
router.get('/users/pending', authenticateToken, (req, res) =>
  controller.listPendingUsers(req, res)
);
router.delete('/users/bulk/test', authenticateToken, (req, res) =>
  controller.bulkDeleteTestUsers(req, res)
);
router.get('/users', authenticateToken, (req, res) => controller.listUsers(req, res));
router.patch('/users/:userId/approve', authenticateToken, (req, res) =>
  controller.approveUser(req, res)
);
router.delete('/users/:userId', authenticateToken, (req, res) => controller.deleteUser(req, res));

// ===== ASSOCIATE ENDPOINTS =====
router.get('/associates/me/jobs', authenticateToken, (req, res) =>
  controller.listAssociateJobs(req, res)
);
router.get('/associates', authenticateToken, (req, res) => controller.listAssociates(req, res));

module.exports = router;
