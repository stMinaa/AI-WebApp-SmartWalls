const { ERROR_MESSAGES, HTTP_STATUS } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const NotFoundException = require('../../../domain/exception/NotFoundException');
const ValidationError = require('../../../domain/exception/ValidationError');

class NoticeController {
  constructor(noticeService) {
    this.service = noticeService;
  }

  async listByBuilding(req, res) {
    try {
      const notices = await this.service.listByBuilding(req.params.buildingId);
      return ApiResponse.success(res, notices, 'Notices retrieved successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async create(req, res) {
    try {
      if (!['manager', 'tenant'].includes(req.user.role)) {
        return ApiResponse.error(
          res,
          'Only managers and tenants can create notices',
          HTTP_STATUS.FORBIDDEN
        );
      }
      const author = { id: req.user.userId, username: req.user.username, role: req.user.role };
      const notice = await this.service.create(req.params.buildingId, req.body, author);
      return ApiResponse.created(res, notice, 'Notice created successfully');
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  async deleteNotice(req, res) {
    try {
      await this.service.deleteNotice(req.params.noticeId);
      return ApiResponse.success(res, null, 'Notice deleted successfully');
    } catch (err) {
      console.error('Delete notice error:', err);
      return this._handleError(res, err);
    }
  }

  _handleError(res, err) {
    if (err instanceof NotFoundException) return ApiResponse.notFound(res, err.message);
    if (err instanceof ValidationError) return ApiResponse.badRequest(res, err.message);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = NoticeController;
