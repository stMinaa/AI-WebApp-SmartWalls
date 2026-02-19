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

  async save(poll) {
    return poll.save();
  }
}

module.exports = MongoPollRepository;
