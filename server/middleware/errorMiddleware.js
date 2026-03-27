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
    // Production: Hide stack trace
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Algo deu errado!'
    });
  }
};

module.exports = { ApiError, errorHandler };
