/**
 * Application Configuration
 * Environment variables and app settings
 */

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/adhd_screening',
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'neurofocus_mission_control_secret',
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  FINE_TUNED_MODEL: process.env.FINE_TUNED_MODEL || 'ft:gpt-3.5-turbo-0125:helling-aura::CsEvcJqe',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Demo Mode
  DEMO_MODE: !process.env.OPENAI_API_KEY
};
