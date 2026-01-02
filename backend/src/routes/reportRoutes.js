/**
 * Report Routes
 * /api/report/*
 */

const express = require('express');
const router = express.Router();
const { reportController } = require('../controllers');

// Download PDF report
router.get('/download', reportController.downloadReport);

module.exports = router;
