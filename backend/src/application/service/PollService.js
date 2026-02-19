const ValidationError = require('../../domain/exception/ValidationError');

class PollService {
  constructor(pollRepository) {
    this.repo = pollRepository;
  }

  async vote(pollId, userId, option) {
    if (!option) throw new ValidationError('Option is required');

    const poll = await this.repo.findById(pollId);
    if (!poll) this._throwNotFound('Poll not found');

    const alreadyVoted = poll.votes.find((v) => v.voter.toString() === userId);
    if (alreadyVoted) throw new ValidationError('You have already voted on this poll');

    poll.votes.push({ option, voter: userId });
    await poll.save();

    return this.repo.findByIdPopulated(pollId);
  }

  async close(pollId) {
    const poll = await this.repo.findById(pollId);
    if (!poll) this._throwNotFound('Poll not found');

    poll.closedAt = new Date();
    await poll.save();

    return this.repo.findByIdPopulated(pollId);
  }

  _throwNotFound(message) {
    const err = new Error(message);
    err.status = 404;
    throw err;
  }
}

module.exports = PollService;
