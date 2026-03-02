const { ERROR_MESSAGES } = require('../../../config/constants');
const NotFoundException = require('../../domain/exception/NotFoundException');
const ValidationError = require('../../domain/exception/ValidationError');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

class InvoiceService {
  constructor(invoiceRepository) {
    this.repo = invoiceRepository;
  }

  async getAll(query = {}) {
    const filter = {};
    if (query.paid !== undefined) {
      filter.paid = query.paid === 'true';
    }
    if (query.company) {
      filter.company = query.company;
    }
    return this.repo.findAll(filter);
  }

  async getUnpaid() {
    const invoices = await this.repo.findUnpaid();
    const grouped = {};
    invoices.forEach((inv) => {
      const companyName = inv.company || 'Nepoznata firma';
      if (!grouped[companyName]) {
        grouped[companyName] = { company: companyName, total: 0, invoices: [] };
      }
      grouped[companyName].total += inv.amount;
      grouped[companyName].invoices.push(inv);
    });
    return Object.values(grouped);
  }

  _validateStringFields(company, title) {
    if (!company?.trim()) throw new ValidationError('Company name required');
    if (!title?.trim()) throw new ValidationError('Invoice title required');
  }

  _validateRequiredValues(associateId, amount) {
    if (!associateId) throw new ValidationError('Associate ID required');
    if (!amount || amount <= 0) throw new ValidationError('Valid amount required');
  }

  _validateCreateInput({ company, associateId, title, amount }) {
    this._validateStringFields(company, title);
    this._validateRequiredValues(associateId, amount);
  }

  _buildInvoicePayload(data, associateName) {
    const { company, associateId, title, reason, amount, buildingId, issueId } = data;
    return {
      company: company.trim(),
      associate: associateId,
      associateName,
      title: title.trim(),
      reason: reason?.trim() || '',
      amount: parseFloat(amount),
      building: buildingId || undefined,
      issue: issueId || undefined
    };
  }

  async create(data) {
    const { associateId } = data;
    this._validateCreateInput(data);

    const associate = await this.repo.findAssociate(associateId);
    if (!associate || associate.role !== 'associate') {
      throw new ValidationError(ERROR_MESSAGES.INVALID_ASSOCIATE);
    }

    const associateName = `${associate.firstName || ''} ${associate.lastName || ''}`.trim();
    const saved = await this.repo.create(this._buildInvoicePayload(data, associateName));
    return this.repo.findByIdPopulated(saved._id);
  }

  async _findValidatedInvoice(id) {
    if (!OBJECT_ID_REGEX.test(id)) throw new ValidationError('Invalid invoice ID');
    const invoice = await this.repo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async markAsPaid(id) {
    const invoice = await this._findValidatedInvoice(id);
    if (invoice.paid) throw new ValidationError('Invoice already paid');

    invoice.paid = true;
    invoice.paidDate = new Date();
    await this.repo.save(invoice);
    return this.repo.findByIdPopulated(id);
  }

  async remove(id) {
    const invoice = await this._findValidatedInvoice(id);
    await this.repo.deleteOne(invoice);
  }
}

module.exports = InvoiceService;
