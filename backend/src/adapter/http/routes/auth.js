const express = require('express');
const rateLimit = require('express-rate-limit');

const { authMiddleware: authenticateToken } = require('../../../../middleware/authHelper');
const { validate } = require('../../../../middleware/validate');
const UserValidator = require('../../../../validators/UserValidator');
const AuthApplicationService = require('../../../application/service/AuthApplicationService');
const AuthService = require('../../../domain/auth/AuthService');
const MongoAuthRepository = require('../../persistence/MongoAuthRepository');
const MongoUserRepository = require('../../persistence/MongoUserRepository');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// Wire dependencies
const authRepo = new MongoAuthRepository();
const userRepo = new MongoUserRepository();
const domainAuthService = new AuthService(userRepo);
const authAppService = new AuthApplicationService(authRepo, domainAuthService);
const controller = new AuthController(authAppService);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' }
});

// ===== AUTH ENDPOINTS =====
router.post('/signup', authLimiter, validate(UserValidator.validateSignup), (req, res) =>
  controller.signup(req, res)
);
router.post('/login', authLimiter, validate(UserValidator.validateLogin), (req, res) =>
  controller.login(req, res)
);
router.get('/me', authenticateToken, (req, res) => controller.getProfile(req, res));
router.patch('/me', authenticateToken, validate(UserValidator.validateProfileUpdate), (req, res) =>
  controller.updateProfile(req, res)
);
router.post('/pay-debt', authenticateToken, (req, res) => controller.payDebt(req, res));

module.exports = router;
