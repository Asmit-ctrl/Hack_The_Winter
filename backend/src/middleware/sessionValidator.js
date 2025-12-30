/**
 * Session Validator Middleware
 * Validates session exists for protected routes
 */

const sessionValidator = (req, res, next) => {
  if (!req.session.sessionId) {
    return res.status(401).json({
      success: false,
      error: 'No active session. Please start a session first.'
    });
  }
  next();
};

module.exports = sessionValidator;
