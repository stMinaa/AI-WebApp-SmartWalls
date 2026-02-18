const { ERROR_MESSAGES } = require('../../../../config/constants');
const ApiResponse = require('../../../../utils/ApiResponse');
const ValidationError = require('../../../domain/exception/ValidationError');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async signup(req, res) {
    try {
      const result = await this.authService.signup(req.body);
      return ApiResponse.created(res, result, 'User created successfully');
    } catch (err) {
      console.error('Signup error:', err);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (err) {
      console.error('Login error:', err);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async getProfile(req, res) {
    try {
      const user = await this.authService.getProfile(req.user.username);
      return ApiResponse.success(res, user, 'User retrieved');
    } catch (err) {
      console.error('Get profile error:', err);
      return this._handleError(res, err, ERROR_MESSAGES.SERVER_ERROR);
    }
  }

  async updateProfile(req, res) {
    console.info('PATCH /api/auth/me - User:', req.user?.username);
    try {
      const updated = await this.authService.updateProfile(req.user.username, req.body);
      return ApiResponse.success(res, updated, 'Profile updated');
    } catch (err) {
      console.error('Error updating profile:', err);
      return this._handleError(res, err, ERROR_MESSAGES.ERROR_UPDATING_PROFILE);
    }
  }

  async payDebt(req, res) {
    try {
      const result = await this.authService.payDebt(req.user.username, req.body.amount);
      return ApiResponse.success(res, result, 'Payment successful');
    } catch (err) {
      console.error('Error processing payment:', err);
      return this._handleError(res, err, ERROR_MESSAGES.ERROR_PROCESSING_PAYMENT);
    }
  }

  _handleError(res, err, fallbackMessage) {
    if (err instanceof ValidationError) {
      return ApiResponse.badRequest(res, err.message);
    }

    if (err.status === 401) {
      return ApiResponse.unauthorized(res, err.message);
    }

    if (err.status === 404) {
      return ApiResponse.notFound(res, err.message);
    }

    if (err.status === 409) {
      return ApiResponse.conflict(res, err.message);
    }

    return ApiResponse.serverError(res, fallbackMessage || ERROR_MESSAGES.SERVER_ERROR);
  }
}

module.exports = AuthController;
