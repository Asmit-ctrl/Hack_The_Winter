/**
 * Express Application Configuration
 * Sets up middleware and routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, requestLogger } = require('./middleware');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: config.NODE_ENV === 'production',
    maxAge: config.SESSION_MAX_AGE,
    httpOnly: true
  }
}));

// Request logging (development only)
if (config.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// ==================== ROUTES ====================

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NeuroFocus AI API',
    version: '2.0.0',
    description: 'Cognitive-Adaptive ADHD Screening System',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
