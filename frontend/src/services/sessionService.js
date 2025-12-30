/**
 * NeuroNav - Session Service
 * Handles screening session lifecycle
 */

import api from './api';
import { API_CONFIG } from '../config';

const { ENDPOINTS } = API_CONFIG;

class SessionService {
  /**
   * Start a new screening session
   * @param {object} userData - Optional user data (name, age)
   * @returns {Promise<object>} Session data with sessionId
   */
  async startSession(userData = {}) {
    try {
      const response = await api.post(ENDPOINTS.SESSION.START, userData);
      return {
        success: true,
        sessionId: response.sessionId,
        message: response.message,
        timestamp: response.timestamp
      };
    } catch (error) {
      console.error('[SessionService] Failed to start session:', error);
      throw error;
    }
  }

  /**
   * End current screening session
   * @returns {Promise<object>} Session summary
   */
  async endSession() {
    try {
      const response = await api.post(ENDPOINTS.SESSION.END);
      return {
        success: true,
        summary: response.summary,
        duration: response.duration
      };
    } catch (error) {
      console.error('[SessionService] Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Get current session status
   * @returns {Promise<object>} Session status with phase info
   */
  async getStatus() {
    try {
      const response = await api.get(ENDPOINTS.SESSION.STATUS);
      return {
        active: response.active,
        phase: response.phase,
        progress: response.progress,
        exchangeCount: response.exchangeCount,
        dsmScores: response.dsmScores
      };
    } catch (error) {
      console.error('[SessionService] Failed to get status:', error);
      // Return default status on error
      return {
        active: false,
        phase: 'alpha',
        progress: 0,
        exchangeCount: 0,
        dsmScores: {}
      };
    }
  }

  /**
   * Check if session is valid/active
   * @returns {Promise<boolean>}
   */
  async isSessionActive() {
    const status = await this.getStatus();
    return status.active === true;
  }
}

// Singleton instance
const sessionService = new SessionService();
export default sessionService;
