const PollModel = require('../../../models/Poll');

class MongoPollRepository {
  _populate(query) {
    return query.populate('createdBy', 'username firstName lastName');
  }

  async findById(id) {
    return PollModel.findById(id);
  }

  async findByIdPopulated(id) {
    return this._populate(PollModel.findById(id));
  }

  async findByBuilding(buildingId) {
    return this._populate(PollModel.find({ building: buildingId }).sort({ createdAt: -1 }));
  }

  async create(data) {
    const poll = new PollModel(data);
    await poll.save();
    return this._populate(PollModel.findById(poll._id));
  }

  async save(poll) {
    return poll.save();
  }
}

module.exports = MongoPollRepository;
