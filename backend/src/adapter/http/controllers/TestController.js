const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');

class TestController {
  constructor(testService) {
    this.service = testService;
  }

  async healthCheck(req, res) {
    return ApiResponse.success(res, null, 'Backend is working!');
  }

  async getMe(req, res) {
    console.info('GET /api/test/me - User:', req.user);
    try {
      const user = await this.service.getAuthenticatedUser(req.user.username);
      return ApiResponse.success(res, { user }, 'Authentication working!');
    } catch (err) {
      console.error('Test me error:', err);
      return this._handleError(res, err);
    }
  }

  async seedIssues(req, res) {
    console.info('POST /api/test/seed-issues - User:', req.user?.username);
    try {
      const result = await this.service.seedIssues();
      return ApiResponse.success(res, result, `Created ${result.count} test issues`);
    } catch (err) {
      console.error('Seed issues error:', err);
      return this._handleError(res, err);
    }
  }

  async seedNotices(req, res) {
    console.info('POST /api/test/seed-notices - User:', req.user?.username);
    try {
      const result = await this.service.seedNotices();
      return ApiResponse.success(res, result, `Created ${result.count} test notices`);
    } catch (err) {
      console.error('Seed notices error:', err);
      return this._handleError(res, err);
    }
  }

  _handleError(res, err) {
    if (err.status === 400) return ApiResponse.badRequest(res, err.message);
    if (err.status === 404) return ApiResponse.notFound(res, err.message);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = TestController;
