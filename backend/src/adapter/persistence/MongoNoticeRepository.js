const NoticeModel = require('../../../models/Notice');

class MongoNoticeRepository {
  _populate(query) {
    return query.populate('author', 'username firstName lastName');
  }

  async findById(id) {
    return NoticeModel.findById(id);
  }

  async findByBuilding(buildingId) {
    return this._populate(NoticeModel.find({ building: buildingId }).sort({ createdAt: -1 }));
  }

  async create(data) {
    const notice = new NoticeModel(data);
    await notice.save();
    return this._populate(NoticeModel.findById(notice._id));
  }

  async deleteById(id) {
    return NoticeModel.findByIdAndDelete(id);
  }
}

module.exports = MongoNoticeRepository;
