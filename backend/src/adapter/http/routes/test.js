const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const TestService = require('../../../application/service/TestService');
const MongoTestRepository = require('../../persistence/MongoTestRepository');
const TestController = require('../controllers/TestController');

const router = express.Router();

// Wire dependencies
const testRepo = new MongoTestRepository();
const testService = new TestService(testRepo);
const controller = new TestController(testService);

router.get('/', (req, res) => controller.healthCheck(req, res));
router.get('/me', authMiddleware, (req, res) => controller.getMe(req, res));
router.post('/seed-issues', authMiddleware, requireRole('director'), (req, res) =>
  controller.seedIssues(req, res)
);
router.post('/seed-notices', authMiddleware, requireRole('director'), (req, res) =>
  controller.seedNotices(req, res)
);

module.exports = router;
