const NoticeModel = require('../../../models/Notice');

class MongoNoticeRepository {
  async findById(id) {
    return NoticeModel.findById(id);
  }

  async deleteById(id) {
    return NoticeModel.findByIdAndDelete(id);
  }
}

module.exports = MongoNoticeRepository;
