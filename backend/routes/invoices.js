/**
 * Invoices Routes
 * Manage invoices and debts from associates/companies
 */

const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');
const { authMiddleware, requireRole } = require('../middleware/authHelper');
const { isValidObjectId } = require('../middleware/validationHelper');

/**
 * GET /api/invoices
 * Get all invoices (director/admin only)
 * Query params: ?paid=true/false, ?company=CompanyName
 */
router.get('/', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const { paid, company } = req.query;
  
  const filter = {};
  if (paid !== undefined) {
    filter.paid = paid === 'true';
  }
  if (company) {
    filter.company = company;
  }

  const invoices = await Invoice.find(filter)
    .populate('associate', 'firstName lastName email mobile company')
    .populate('building', 'name address')
    .populate('issue', 'title')
    .sort({ date: -1 });

  sendSuccess(res, 200, 'Invoices retrieved', invoices);
}));

/**
 * GET /api/invoices/unpaid
 * Get all unpaid invoices grouped by company
 */
router.get('/unpaid', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ paid: false })
    .populate('associate', 'firstName lastName email mobile company')
    .populate('building', 'name address')
    .populate('issue', 'title')
    .sort({ date: -1 });

  // Group by company and calculate totals
  const grouped = {};
  invoices.forEach(inv => {
    const companyName = inv.company || 'Nepoznata firma';
    if (!grouped[companyName]) {
      grouped[companyName] = {
        company: companyName,
        total: 0,
        invoices: []
      };
    }
    grouped[companyName].total += inv.amount;
    grouped[companyName].invoices.push(inv);
  });

  sendSuccess(res, 200, 'Unpaid invoices retrieved', Object.values(grouped));
}));

/**
 * POST /api/invoices
 * Create a new invoice (director/admin only)
 */
router.post('/', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  const { company, associateId, title, reason, amount, buildingId, issueId } = req.body;

  if (!company?.trim()) return sendError(res, 400, 'Company name required');
  if (!associateId) return sendError(res, 400, 'Associate ID required');
  if (!title?.trim()) return sendError(res, 400, 'Invoice title required');
  if (!amount || amount <= 0) return sendError(res, 400, 'Valid amount required');

  // Verify associate exists
  const associate = await User.findById(associateId);
  if (!associate || associate.role !== 'associate') {
    return sendError(res, 400, 'Invalid associate');
  }

  const invoice = new Invoice({
    company: company.trim(),
    associate: associateId,
    associateName: `${associate.firstName || ''} ${associate.lastName || ''}`.trim(),
    title: title.trim(),
    reason: reason?.trim() || '',
    amount: parseFloat(amount),
    building: buildingId || undefined,
    issue: issueId || undefined
  });

  await invoice.save();

  const populated = await Invoice.findById(invoice._id)
    .populate('associate', 'firstName lastName email mobile company')
    .populate('building', 'name address')
    .populate('issue', 'title');

  sendSuccess(res, 201, 'Invoice created successfully', populated);
}));

/**
 * PATCH /api/invoices/:id/pay
 * Mark invoice as paid
 */
router.patch('/:id/pay', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid invoice ID');

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return sendError(res, 404, 'Invoice not found');

  if (invoice.paid) {
    return sendError(res, 400, 'Invoice already paid');
  }

  invoice.paid = true;
  invoice.paidDate = new Date();
  await invoice.save();

  const populated = await Invoice.findById(invoice._id)
    .populate('associate', 'firstName lastName email mobile company')
    .populate('building', 'name address')
    .populate('issue', 'title');

  sendSuccess(res, 200, 'Invoice marked as paid', populated);
}));

/**
 * DELETE /api/invoices/:id
 * Delete an invoice (director/admin only)
 */
router.delete('/:id', authMiddleware, requireRole('director', 'admin'), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'Invalid invoice ID');

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return sendError(res, 404, 'Invoice not found');

  await invoice.deleteOne();
  sendSuccess(res, 200, 'Invoice deleted successfully');
}));

module.exports = router;
