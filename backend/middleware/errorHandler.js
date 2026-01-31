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
function handleError(err, res) {
  // Service errors have status and message
  if (err && typeof err === 'object' && err.status && err.message) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      status: err.status
    });
  }

  // MongoDB/Mongoose errors
  if (err && err.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      status: 500
    });
  }

  // Mongoose validation errors
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map(e => e.message)
        .join(', '),
      status: 400
    });
  }

  // JWT errors
  if (err && err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      status: 401
    });
  }

  if (err && err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      status: 401
    });
  }

  // Unexpected errors
  const status = err?.status || 500;
  const message = err?.message || 'Internal server error';

  return res.status(status).json({
    success: false,
    message,
    status
  });
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
