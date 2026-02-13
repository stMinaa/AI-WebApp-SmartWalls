/**
 * ApiResponse Utility
 * Standardized API response format for consistency across all endpoints
 * Format: { success: boolean, message: string, data: any, error: string }
 */

const { HTTP_STATUS } = require('../config/constants');

/**
 * Base class for API responses
 */
class ApiResponse {
  /**
   * Success response
   * @param {object} res - Express response object
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response (201)
   * @param {object} res - Express response object
   * @param {any} data - Created resource data
   * @param {string} message - Success message
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {any} error - Additional error details
   */
  static error(res, message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_ERROR, error = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  }

  /**
   * Bad Request response (400)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {any} error - Validation errors or details
   */
  static badRequest(res, message = 'Bad request', error = null) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
      error,
    });
  }

  /**
   * Unauthorized response (401)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message,
    });
  }

  /**
   * Forbidden response (403)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Forbidden') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message,
    });
  }

  /**
   * Not Found response (404)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message,
    });
  }

  /**
   * Conflict response (409)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict(res, message = 'Resource conflict') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message,
    });
  }

  /**
   * Internal Server Error response (500)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {any} error - Error details (only in development)
   */
  static serverError(res, message = 'Internal server error', error = null) {
    const response = {
      success: false,
      message,
    };

    // Only include error details in development
    if (process.env.NODE_ENV !== 'production' && error) {
      response.error = error.message || error;
    }

    return res.status(HTTP_STATUS.INTERNAL_ERROR).json(response);
  }
}

module.exports = ApiResponse;
