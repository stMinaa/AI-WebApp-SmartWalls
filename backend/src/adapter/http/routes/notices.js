const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const { noticeController: controller } = require('../../composition');

const router = express.Router();

router.delete('/:noticeId', authMiddleware, requireRole('manager'), (req, res) =>
  controller.deleteNotice(req, res)
);

module.exports = router;
