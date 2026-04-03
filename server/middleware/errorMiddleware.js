const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`[${req.method}] ${req.url} - Error: ${err.message}`, { 
    stack: err.stack, 
    userId: req.user?._id 
  });

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production: We still expose the message for remote debugging during this launch phase
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      detail: err.isOperational ? undefined : err.stack // Only show stack for non-operational errors
    });
  }
};

module.exports = { ApiError, errorHandler };
