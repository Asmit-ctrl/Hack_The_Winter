/**
 * NeuroNav - Frontend Configuration
 * Central configuration for the ADHD Screening application
 */

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    SESSION: {
      START: '/api/session/start',
      END: '/api/session/end',
      STATUS: '/api/session/status'
    },
    CHAT: '/api/chat',
    REPORT: {
      DOWNLOAD: '/api/report/download',
      PREVIEW: '/api/report/preview'
    }
  },
  TIMEOUT: 30000
};

export const APP_CONFIG = {
  name: 'NeuroNav',
  version: '2.0.0',
  description: 'ADHD Screening & Assessment Platform',
  supportEmail: 'support@neuronav.ai'
};

export const THEME_CONFIG = {
  defaultTheme: 'dark',
  themes: ['dark', 'light'],
  transitionDuration: 300
};

export default {
  API_CONFIG,
  APP_CONFIG,
  THEME_CONFIG
};
