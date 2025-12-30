/**
 * Middleware Index
 * Export all middleware from a single entry point
 */

const errorHandler = require('./errorHandler');
const requestLogger = require('./requestLogger');
const sessionValidator = require('./sessionValidator');

module.exports = {
  errorHandler,
  requestLogger,
  sessionValidator
};
