/**
 * NeuroNav - Chat Service
 * Handles message communication with AI therapist
 */

import api from './api';
import { API_CONFIG } from '../config';

const { ENDPOINTS } = API_CONFIG;

class ChatService {
  /**
   * Send a message and get AI response
   * @param {string} message - User message
   * @param {object} context - Additional context (timing, patterns)
   * @returns {Promise<object>} AI response with analysis data
   */
  async sendMessage(message, context = {}) {
    try {
      const payload = {
        message: message.trim(),
        timestamp: Date.now(),
        ...context
      };

      const response = await api.post(ENDPOINTS.CHAT, payload);

      return {
        success: true,
        message: response.message,
        phase: response.phase,
        progress: response.progress,
        sessionComplete: response.sessionComplete || false,
        analysis: {
          dsmIndicators: response.dsmIndicators || [],
          patterns: response.patterns || [],
          riskLevel: response.riskLevel,
          confidence: response.confidence
        },
        cognitiveMetrics: response.cognitiveMetrics || {},
        timestamp: response.timestamp || Date.now()
      };
    } catch (error) {
      console.error('[ChatService] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Format message for display
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   * @param {object} metadata - Additional metadata
   * @returns {object} Formatted message object
   */
  formatMessage(role, content, metadata = {}) {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    };
  }

  /**
   * Parse AI response for display
   * @param {object} response - Raw API response
   * @returns {object} Formatted message for chat display
   */
  parseResponse(response) {
    return this.formatMessage('assistant', response.message, {
      phase: response.phase,
      progress: response.progress,
      analysis: response.analysis,
      cognitiveMetrics: response.cognitiveMetrics
    });
  }

  /**
   * Build initial greeting message
   * @param {string} userName - User's name
   * @returns {object} Greeting message
   */
  buildGreeting(userName) {
    const name = userName || 'Space Cadet';
    const greeting = `Welcome aboard, ${name}! 🚀

I'm your Mission Commander for today's ADHD screening journey. Think of this as a friendly exploration of how your mind works - there are no wrong answers!

We'll navigate through 6 Mission Sectors, each exploring different aspects of attention, energy, and daily patterns. 

**Ready to begin Sector Alpha: Attention Patterns?**

Tell me about a typical day - what's it like when you're trying to focus on something important?`;

    return this.formatMessage('assistant', greeting, {
      phase: 'alpha',
      isGreeting: true
    });
  }
}

// Singleton instance
const chatService = new ChatService();
export default chatService;
