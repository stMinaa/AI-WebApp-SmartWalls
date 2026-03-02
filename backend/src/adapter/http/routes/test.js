const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const { testController: controller } = require('../../composition');

const router = express.Router();

router.get('/', (req, res) => controller.healthCheck(req, res));
router.get('/me', authMiddleware, (req, res) => controller.getMe(req, res));
router.post('/seed-issues', authMiddleware, requireRole('director'), (req, res) =>
  controller.seedIssues(req, res)
);
router.post('/seed-notices', authMiddleware, requireRole('director'), (req, res) =>
  controller.seedNotices(req, res)
);

module.exports = router;
