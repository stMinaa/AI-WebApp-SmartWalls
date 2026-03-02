const express = require('express');
const router = express.Router();

const { authMiddleware: authenticateToken } = require('../../../../middleware/authHelper');
const { validate } = require('../../../../middleware/validate');
const IssueValidator = require('../../../../validators/IssueValidator');
const { issueController: controller } = require('../../composition');

// Routes
router.get('/', authenticateToken, (req, res) => controller.listIssues(req, res));
router.post('/', authenticateToken, validate(IssueValidator.validateReport), (req, res) =>
  controller.reportIssue(req, res)
);
router.get('/my', authenticateToken, (req, res) => controller.listMyIssues(req, res));
router.patch(
  '/:issueId/triage',
  authenticateToken,
  validate(IssueValidator.validateTriage),
  (req, res) => controller.triageIssue(req, res)
);
router.patch(
  '/:issueId/assign',
  authenticateToken,
  validate(IssueValidator.validateAssign),
  (req, res) => controller.assignIssue(req, res)
);
router.post('/:id/accept', authenticateToken, (req, res) => controller.acceptIssue(req, res));
router.post('/:id/reject', authenticateToken, (req, res) =>
  controller.rejectIssueByAssociate(req, res)
);
router.post('/:id/complete', authenticateToken, (req, res) => controller.completeIssue(req, res));

module.exports = router;
