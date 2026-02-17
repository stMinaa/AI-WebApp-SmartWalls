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

// ===== TENANT ENDPOINTS =====
router.delete('/tenants/:id', authenticateToken, (req, res) => controller.deleteTenant(req, res));
router.post('/tenants/:id/approve', authenticateToken, (req, res) =>
  controller.approveTenant(req, res)
);
router.post('/tenants/:id/assign', authenticateToken, (req, res) =>
  controller.assignTenant(req, res)
);
router.get('/tenants/me/apartment', authenticateToken, (req, res) =>
  controller.getMyApartment(req, res)
);

module.exports = router;
