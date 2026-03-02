const NotFoundException = require('../../domain/exception/NotFoundException');
const ValidationError = require('../../domain/exception/ValidationError');

class PollService {
  constructor(pollRepository) {
    this.repo = pollRepository;
  }

  async listByBuilding(buildingId) {
    return this.repo.findByBuilding(buildingId);
  }

  async create(buildingId, { question, options }, createdBy) {
    if (!question?.trim()) throw new ValidationError('Question is required');
    if (!options || options.length < 2)
      throw new ValidationError('At least 2 options are required');
    return this.repo.create({ building: buildingId, question, options, votes: [], createdBy });
  }

  async vote(pollId, userId, option) {
    if (!option) throw new ValidationError('Option is required');

    const poll = await this.repo.findById(pollId);
    if (!poll) throw new NotFoundException('Poll not found');

    const alreadyVoted = poll.votes.find((v) => v.voter.toString() === userId);
    if (alreadyVoted) throw new ValidationError('You have already voted on this poll');

    poll.votes.push({ option, voter: userId });
    await poll.save();

    return this.repo.findByIdPopulated(pollId);
  }

  async close(pollId) {
    const poll = await this.repo.findById(pollId);
    if (!poll) throw new NotFoundException('Poll not found');

    poll.closedAt = new Date();
    await poll.save();

    return this.repo.findByIdPopulated(pollId);
  }
}

module.exports = PollService;
