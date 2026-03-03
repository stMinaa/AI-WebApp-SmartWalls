/* eslint-disable max-nested-callbacks */
/**
 * ApiResponse Tests
 * Verifies standardized API response format
 */

const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/ApiResponse');

describe('ApiResponse Utility', () => {
  let mockRes;

  beforeEach(() => {
    // Mock Express response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('Success responses', () => {
    test.each([
      [ApiResponse.success, HTTP_STATUS.OK, 'Success message'],
      [ApiResponse.created, HTTP_STATUS.CREATED, 'Created']
    ])('success method returns correct response', (method, expectedStatus, message) => {
      const data = { id: 1 };
      method(mockRes, data, message);
      expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message, data });
    });

    test('success() should handle custom status code', () => {
      ApiResponse.success(mockRes, null, 'OK', 204);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: null });
    });
  });

  describe('Error responses', () => {
    test('error() should return custom status with message', () => {
      ApiResponse.error(mockRes, 'Error occurred', 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error occurred',
        error: null
      });
    });

    test('badRequest() should return 400', () => {
      ApiResponse.badRequest(mockRes, 'Invalid input');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
        error: null
      });
    });

    test('unauthorized() should return 401', () => {
      ApiResponse.unauthorized(mockRes, 'Token required');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token required'
      });
    });

    test('forbidden() should return 403', () => {
      ApiResponse.forbidden(mockRes, 'Access denied');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied'
      });
    });

    test('notFound() should return 404', () => {
      ApiResponse.notFound(mockRes, 'Resource not found');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found'
      });
    });

    test('conflict() should return 409', () => {
      ApiResponse.conflict(mockRes, 'Duplicate entry');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate entry'
      });
    });

    test('serverError() should return 500', () => {
      ApiResponse.serverError(mockRes, 'Server error');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });

    test.each([
      ['production', 'Sensitive info', null],
      ['development', 'Debug info', 'Debug info']
    ])('serverError() behaves correctly in %s', (env, errorMsg, expectedError) => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = env;

      ApiResponse.serverError(mockRes, 'Server error', new Error(errorMsg));

      const expected = { success: false, message: 'Server error' };
      if (expectedError) expected.error = expectedError;
      expect(mockRes.json).toHaveBeenCalledWith(expected);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Response format validation', () => {
    test('all success responses should have success=true', () => {
      ApiResponse.success(mockRes, {}, 'OK');
      ApiResponse.created(mockRes, {}, 'Created');

      mockRes.json.mock.calls.forEach((call) => {
        expect(call[0].success).toBe(true);
      });
    });

    test('all error responses should have success=false', () => {
      ApiResponse.badRequest(mockRes, 'Bad');
      ApiResponse.unauthorized(mockRes, 'Unauth');
      ApiResponse.forbidden(mockRes, 'Forbidden');
      ApiResponse.notFound(mockRes, 'Not found');
      ApiResponse.serverError(mockRes, 'Error');

      mockRes.json.mock.calls.forEach((call) => {
        expect(call[0].success).toBe(false);
      });
    });

    test('all responses should have message property', () => {
      ApiResponse.success(mockRes, {}, 'Success');
      ApiResponse.badRequest(mockRes, 'Error');

      mockRes.json.mock.calls.forEach((call) => {
        expect(call[0]).toHaveProperty('message');
      });
    });
  });
});
