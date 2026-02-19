const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const ValidationError = require('../../../domain/exception/ValidationError');

class InvoiceController {
  constructor(invoiceService) {
    this.service = invoiceService;
  }

  async getAll(req, res) {
    try {
      const invoices = await this.service.getAll(req.query);
      return ApiResponse.success(res, invoices, 'Invoices retrieved');
    } catch (err) {
      console.error('Get invoices error:', err);
      return this._handleError(res, err);
    }
  }

  async getUnpaid(req, res) {
    try {
      const grouped = await this.service.getUnpaid();
      return ApiResponse.success(res, grouped, 'Unpaid invoices retrieved');
    } catch (err) {
      console.error('Get unpaid invoices error:', err);
      return this._handleError(res, err);
    }
  }

  async create(req, res) {
    try {
      const invoice = await this.service.create(req.body);
      return ApiResponse.created(res, invoice, 'Invoice created successfully');
    } catch (err) {
      console.error('Create invoice error:', err);
      return this._handleError(res, err);
    }
  }

  async markAsPaid(req, res) {
    try {
      const invoice = await this.service.markAsPaid(req.params.id);
      return ApiResponse.success(res, invoice, 'Invoice marked as paid');
    } catch (err) {
      console.error('Mark invoice paid error:', err);
      return this._handleError(res, err);
    }
  }

  async remove(req, res) {
    try {
      await this.service.remove(req.params.id);
      return ApiResponse.success(res, null, 'Invoice deleted successfully');
    } catch (err) {
      console.error('Delete invoice error:', err);
      return this._handleError(res, err);
    }
  }

  _handleError(res, err) {
    if (err instanceof ValidationError) return ApiResponse.badRequest(res, err.message);
    if (err.status === 404) return ApiResponse.notFound(res, err.message);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = InvoiceController;
