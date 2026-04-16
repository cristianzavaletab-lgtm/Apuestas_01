// src/middleware/errorHandler.js
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message: process.env.NODE_ENV === 'development' ? message : 'An unexpected error occurred'
  });
}

module.exports = errorHandler;
