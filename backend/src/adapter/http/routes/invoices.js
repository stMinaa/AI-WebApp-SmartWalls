const express = require('express');

const { authMiddleware, requireRole } = require('../../../../middleware/authHelper');
const InvoiceService = require('../../../application/service/InvoiceService');
const MongoInvoiceRepository = require('../../persistence/MongoInvoiceRepository');
const InvoiceController = require('../controllers/InvoiceController');

const router = express.Router();

// Wire dependencies
const invoiceRepo = new MongoInvoiceRepository();
const invoiceService = new InvoiceService(invoiceRepo);
const controller = new InvoiceController(invoiceService);

router.get('/', authMiddleware, requireRole('director', 'admin'), (req, res) =>
  controller.getAll(req, res)
);
router.get('/unpaid', authMiddleware, requireRole('director', 'admin'), (req, res) =>
  controller.getUnpaid(req, res)
);
router.post('/', authMiddleware, requireRole('director', 'admin'), (req, res) =>
  controller.create(req, res)
);
router.patch('/:id/pay', authMiddleware, requireRole('director', 'admin'), (req, res) =>
  controller.markAsPaid(req, res)
);
router.delete('/:id', authMiddleware, requireRole('director', 'admin'), (req, res) =>
  controller.remove(req, res)
);

module.exports = router;
