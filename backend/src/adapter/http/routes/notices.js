const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const NoticeService = require('../../../application/service/NoticeService');
const MongoNoticeRepository = require('../../persistence/MongoNoticeRepository');
const NoticeController = require('../controllers/NoticeController');

const router = express.Router();

// Wire dependencies
const noticeRepo = new MongoNoticeRepository();
const noticeService = new NoticeService(noticeRepo);
const controller = new NoticeController(noticeService);

router.delete('/:noticeId', authMiddleware, requireRole('manager'), (req, res) =>
  controller.deleteNotice(req, res)
);

module.exports = router;
