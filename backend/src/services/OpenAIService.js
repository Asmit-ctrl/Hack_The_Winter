/**
 * OpenAI Service
 * Handles AI response generation using OpenAI API with contextual memory
 */

const OpenAI = require('openai/index.mjs');
const config = require('../config');

class OpenAIService {
  constructor() {
    this.openai = null;
    this.isAvailable = false;
    
    if (config.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
      this.isAvailable = true;
    }
  }

  /**
   * Generate AI response using OpenAI with contextual memory
   * Includes last 4-6 messages for conversation continuity
   */
  async generateResponse(systemPrompt, conversationHistory, userMessage) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      // Build contextual memory - last 6 messages for continuity
      const contextMessages = (conversationHistory || [])
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const completion = await this.openai.chat.completions.create({
        model: config.FINE_TUNED_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 250, // Reduced to encourage concise responses
        temperature: 0.7, // Balanced for natural responses
        presence_penalty: 0.6, // Strongly discourage repetition of topics
        frequency_penalty: 0.5 // Strongly encourage variety in questions
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  /**
   * Generate response with enhanced context for deeper conversations
   */
  async generateDeepeningResponse(systemPrompt, conversationHistory, userMessage, detectedIndicators) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      // Build rich context with indicator information
      const contextMessages = (conversationHistory || [])
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      // Add context about detected patterns
      let enhancedPrompt = systemPrompt;
      if (detectedIndicators && detectedIndicators.length > 0) {
        const indicatorContext = detectedIndicators
          .map(ind => `- ${ind.domain}: "${ind.pattern}" (${ind.severity})`)
          .join('\n');
        enhancedPrompt += `\n\nDETECTED PATTERNS IN THIS MESSAGE:\n${indicatorContext}\n\nUse this insight to ask a deepening follow-up question about the specific behavior mentioned.`;
      }

      const completion = await this.openai.chat.completions.create({
        model: config.FINE_TUNED_MODEL,
        messages: [
          { role: 'system', content: enhancedPrompt },
          ...contextMessages,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7,
        presence_penalty: 0.6, // Strongly discourage repetition
        frequency_penalty: 0.5 // Strongly encourage variety
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  /**
   * Check if OpenAI is available
   */
  isConfigured() {
    return this.isAvailable;
  }
}

// Export singleton instance
module.exports = new OpenAIService();

