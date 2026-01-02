/**
 * Routes Index
 * Main router configuration
 */

const express = require('express');
const router = express.Router();

const sessionRoutes = require('./sessionRoutes');
const chatRoutes = require('./chatRoutes');
const reportRoutes = require('./reportRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'NeuroFocus AI API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/session', sessionRoutes);
router.use('/chat', chatRoutes);
router.use('/report', reportRoutes);

// Legacy routes (for backwards compatibility)
router.post('/start-session', (req, res, next) => {
  req.url = '/session/start';
  router.handle(req, res, next);
});

router.post('/end-session', (req, res, next) => {
  req.url = '/session/end';
  router.handle(req, res, next);
});

router.get('/download-report', (req, res, next) => {
  req.url = '/report/download';
  router.handle(req, res, next);
});

module.exports = router;
