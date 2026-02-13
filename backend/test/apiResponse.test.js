/**
 * ApiResponse Tests
 * Verifies standardized API response format
 */

const ApiResponse = require('../utils/ApiResponse');
const { HTTP_STATUS } = require('../config/constants');

describe('ApiResponse Utility', () => {
  let mockRes;

  beforeEach(() => {
    // Mock Express response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('Success responses', () => {
    test('success() should return 200 with data', () => {
      const data = { id: 1, name: 'Test' };
      ApiResponse.success(mockRes, data, 'Success message');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data,
      });
    });

    test('success() should handle custom status code', () => {
      ApiResponse.success(mockRes, null, 'OK', 204);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
        data: null,
      });
    });

    test('created() should return 201', () => {
      const data = { id: 1 };
      ApiResponse.created(mockRes, data, 'Created');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data,
      });
    });
  });

  describe('Error responses', () => {
    test('error() should return custom status with message', () => {
      ApiResponse.error(mockRes, 'Error occurred', 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error occurred',
        error: null,
      });
    });

    test('badRequest() should return 400', () => {
      ApiResponse.badRequest(mockRes, 'Invalid input');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
        error: null,
      });
    });

    test('unauthorized() should return 401', () => {
      ApiResponse.unauthorized(mockRes, 'Token required');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token required',
      });
    });

    test('forbidden() should return 403', () => {
      ApiResponse.forbidden(mockRes, 'Access denied');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
      });
    });

    test('notFound() should return 404', () => {
      ApiResponse.notFound(mockRes, 'Resource not found');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
      });
    });

    test('conflict() should return 409', () => {
      ApiResponse.conflict(mockRes, 'Duplicate entry');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate entry',
      });
    });

    test('serverError() should return 500', () => {
      ApiResponse.serverError(mockRes, 'Server error');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
      });
    });

    test('serverError() should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Sensitive info');
      ApiResponse.serverError(mockRes, 'Server error', error);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('serverError() should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Debug info');
      ApiResponse.serverError(mockRes, 'Server error', error);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: 'Debug info',
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Response format validation', () => {
    test('all success responses should have success=true', () => {
      ApiResponse.success(mockRes, {}, 'OK');
      ApiResponse.created(mockRes, {}, 'Created');

      mockRes.json.mock.calls.forEach(call => {
        expect(call[0].success).toBe(true);
      });
    });

    test('all error responses should have success=false', () => {
      ApiResponse.badRequest(mockRes, 'Bad');
      ApiResponse.unauthorized(mockRes, 'Unauth');
      ApiResponse.forbidden(mockRes, 'Forbidden');
      ApiResponse.notFound(mockRes, 'Not found');
      ApiResponse.serverError(mockRes, 'Error');

      mockRes.json.mock.calls.forEach(call => {
        expect(call[0].success).toBe(false);
      });
    });

    test('all responses should have message property', () => {
      ApiResponse.success(mockRes, {}, 'Success');
      ApiResponse.badRequest(mockRes, 'Error');

      mockRes.json.mock.calls.forEach(call => {
        expect(call[0]).toHaveProperty('message');
      });
    });
  });
});
