const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');

class NoticeController {
  constructor(noticeService) {
    this.service = noticeService;
  }

  async deleteNotice(req, res) {
    try {
      await this.service.deleteNotice(req.params.noticeId);
      return ApiResponse.success(res, null, 'Notice deleted successfully');
    } catch (err) {
      console.error('Delete notice error:', err);
      if (err.status === 404) return ApiResponse.notFound(res, err.message);
      return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
    }
  }
}

module.exports = NoticeController;
