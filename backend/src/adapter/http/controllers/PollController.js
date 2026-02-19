const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const ValidationError = require('../../../domain/exception/ValidationError');

class PollController {
  constructor(pollService) {
    this.service = pollService;
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
    if (err instanceof ValidationError) return ApiResponse.badRequest(res, err.message);
    if (err.status === 404) return ApiResponse.notFound(res, err.message);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = PollController;
