const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const { pollController: controller } = require('../../composition');

const router = express.Router();

router.post('/:pollId/vote', authMiddleware, (req, res) => controller.vote(req, res));
router.post('/:pollId/close', authMiddleware, requireRole('manager'), (req, res) =>
  controller.close(req, res)
);

module.exports = router;
