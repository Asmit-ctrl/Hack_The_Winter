/**
 * Chat Routes
 * /api/chat/*
 */

const express = require('express');
const router = express.Router();
const { chatController } = require('../controllers');

// Send chat message
router.post('/', chatController.sendMessage);

// Get chat history
router.get('/history', chatController.getChatHistory);

module.exports = router;
