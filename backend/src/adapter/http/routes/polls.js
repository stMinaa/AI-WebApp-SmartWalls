const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const PollService = require('../../../application/service/PollService');
const MongoPollRepository = require('../../persistence/MongoPollRepository');
const PollController = require('../controllers/PollController');

const router = express.Router();

// Wire dependencies
const pollRepo = new MongoPollRepository();
const pollService = new PollService(pollRepo);
const controller = new PollController(pollService);

router.post('/:pollId/vote', authMiddleware, (req, res) => controller.vote(req, res));
router.post('/:pollId/close', authMiddleware, requireRole('manager'), (req, res) =>
  controller.close(req, res)
);

module.exports = router;
