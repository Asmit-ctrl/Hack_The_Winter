/**
 * Session Routes
 * /api/session/*
 */

const express = require('express');
const router = express.Router();
const { sessionController } = require('../controllers');

// Start new session
router.post('/start', sessionController.startSession);

// End session
router.post('/end', sessionController.endSession);

// Get session status
router.get('/status', sessionController.getSessionStatus);

module.exports = router;
