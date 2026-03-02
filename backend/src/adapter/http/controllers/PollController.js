const { ERROR_MESSAGES, HTTP_STATUS } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const NotFoundException = require('../../../domain/exception/NotFoundException');
const ValidationError = require('../../../domain/exception/ValidationError');

class PollController {
  constructor(pollService) {
    this.service = pollService;
  }

  async listByBuilding(req, res) {
    try {
      const polls = await this.service.listByBuilding(req.params.buildingId);
      return ApiResponse.success(res, polls, 'Polls retrieved successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async create(req, res) {
    try {
      if (req.user.role !== 'manager') {
        return ApiResponse.error(res, 'Only managers can create polls', HTTP_STATUS.FORBIDDEN);
      }
      const { question, options } = req.body;
      const poll = await this.service.create(
        req.params.buildingId,
        { question, options },
        req.user.userId
      );
      return ApiResponse.created(res, poll, 'Poll created successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async vote(req, res) {
    try {
      const { pollId } = req.params;
      const { userId } = req.user;
      const { option } = req.body;
      const poll = await this.service.vote(pollId, userId, option);
      return ApiResponse.success(res, poll, 'Vote recorded successfully');
    } catch (err) {
      console.error('Vote error:', err);
      return this._handleError(res, err);
    }
  }

  async close(req, res) {
    try {
      const poll = await this.service.close(req.params.pollId);
      return ApiResponse.success(res, poll, 'Poll closed successfully');
    } catch (err) {
      console.error('Close poll error:', err);
      return this._handleError(res, err);
    }
  }

  _handleError(res, err) {
    if (err instanceof NotFoundException) return ApiResponse.notFound(res, err.message);
    if (err instanceof ValidationError) return ApiResponse.badRequest(res, err.message);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = PollController;
