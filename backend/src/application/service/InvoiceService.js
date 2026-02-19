const { ERROR_MESSAGES } = require('../../../config/constants');
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

  _validateCreateInput({ company, associateId, title, amount }) {
    if (!company?.trim()) throw new ValidationError('Company name required');
    if (!associateId) throw new ValidationError('Associate ID required');
    if (!title?.trim()) throw new ValidationError('Invoice title required');
    if (!amount || amount <= 0) throw new ValidationError('Valid amount required');
  }

  async create(data) {
    const { company, associateId, title, amount, reason, buildingId, issueId } = data;
    this._validateCreateInput({ company, associateId, title, amount });

    const associate = await this.repo.findAssociate(associateId);
    if (!associate || associate.role !== 'associate') {
      throw new ValidationError(ERROR_MESSAGES.INVALID_ASSOCIATE);
    }

    const associateName = `${associate.firstName || ''} ${associate.lastName || ''}`.trim();
    const saved = await this.repo.create({
      company: company.trim(),
      associate: associateId,
      associateName,
      title: title.trim(),
      reason: reason?.trim() || '',
      amount: parseFloat(amount),
      building: buildingId || undefined,
      issue: issueId || undefined
    });

    return this.repo.findByIdPopulated(saved._id);
  }

  async markAsPaid(id) {
    if (!OBJECT_ID_REGEX.test(id)) throw new ValidationError('Invalid invoice ID');

    const invoice = await this.repo.findById(id);
    if (!invoice) this._throwNotFound('Invoice not found');

    if (invoice.paid) throw new ValidationError('Invoice already paid');

    invoice.paid = true;
    invoice.paidDate = new Date();
    await this.repo.save(invoice);
    return this.repo.findByIdPopulated(id);
  }

  async remove(id) {
    if (!OBJECT_ID_REGEX.test(id)) throw new ValidationError('Invalid invoice ID');

    const invoice = await this.repo.findById(id);
    if (!invoice) this._throwNotFound('Invoice not found');

    await this.repo.deleteOne(invoice);
  }

  _throwNotFound(message) {
    const err = new Error(message);
    err.status = 404;
    throw err;
  }
}

module.exports = InvoiceService;
