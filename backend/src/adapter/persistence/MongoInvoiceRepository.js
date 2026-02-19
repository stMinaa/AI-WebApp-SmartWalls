const InvoiceModel = require('../../../models/Invoice');
const UserModel = require('../../../models/User');

class MongoInvoiceRepository {
  _populate(query) {
    return query
      .populate('associate', 'firstName lastName email mobile company')
      .populate('building', 'name address')
      .populate('issue', 'title');
  }

  async findAll(filter = {}) {
    return this._populate(InvoiceModel.find(filter)).sort({ date: -1 });
  }

  async findUnpaid() {
    return this._populate(InvoiceModel.find({ paid: false })).sort({ date: -1 });
  }

  async findById(id) {
    return InvoiceModel.findById(id);
  }

  async findByIdPopulated(id) {
    return this._populate(InvoiceModel.findById(id));
  }

  async findAssociate(associateId) {
    return UserModel.findById(associateId);
  }

  async create(data) {
    const invoice = new InvoiceModel(data);
    return invoice.save();
  }

  async save(invoice) {
    return invoice.save();
  }

  async deleteOne(invoice) {
    return invoice.deleteOne();
  }
}

module.exports = MongoInvoiceRepository;
