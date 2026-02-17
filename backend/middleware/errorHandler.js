/**
 * Error Handler Middleware
 * Centralized error handling for all API endpoints
 */

/**
 * Handle service errors and convert to HTTP responses
 * Services throw errors as: { status: number, message: string }
 * This middleware converts them to standard JSON responses
 * @param {Error|Object} err
 * @param {Object} res - Express response object
 */
function errorResponse(res, status, message) {
  return res.status(status).json({ success: false, message, status });
}

const ERROR_MAP = {
  MongoError: { status: 500, message: 'Database error' },
  JsonWebTokenError: { status: 401, message: 'Invalid token' },
  TokenExpiredError: { status: 401, message: 'Token expired' }
};

function handleError(err, res) {
  if (!err) return errorResponse(res, 500, 'Internal server error');

  if (err.status && err.message) return errorResponse(res, err.status, err.message);

  if (err.name === 'ValidationError') {
    return errorResponse(
      res,
      400,
      Object.values(err.errors)
        .map((e) => e.message)
        .join(', ')
    );
  }

  const mapped = ERROR_MAP[err.name];
  if (mapped) return errorResponse(res, mapped.status, mapped.message);

  return errorResponse(res, 500, err.message || 'Internal server error');
}

/**
 * Express error handling middleware
 * Catches errors from async route handlers
 * Usage: app.use(errorMiddleware);
 * @param {Error} err
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
// eslint-disable-next-line max-params, no-unused-vars
function errorMiddleware(err, req, res, next) {
  return handleError(err, res);
}

/**
 * Async wrapper to catch errors from async route handlers
 * Usage: router.post('/endpoint', asyncHandler(async (req, res) => { ... }));
 * @param {Function} fn - async route handler
 * @returns {Function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Response formatter for successful operations
 * @param {Object} res - Express response
 * @param {number} status - HTTP status (200, 201, etc)
 * @param {string} message
 * @param {any} data - optional response data
 */
// eslint-disable-next-line max-params
function sendSuccess(res, status, message, data) {
  const response = {
    success: true,
    message,
    status
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(status).json(response);
}

/**
 * Response formatter for errors
 * @param {Object} res - Express response
 * @param {number} status - HTTP status (400, 401, 403, 404, 500)
 * @param {string} message
 */
function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
    status
  });
}

module.exports = {
  handleError,
  errorMiddleware,
  asyncHandler,
  sendSuccess,
  sendError
};
