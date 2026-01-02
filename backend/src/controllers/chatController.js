/**
 * Chat Controller
 * Handles chat message processing with adaptive conversation flow
 */

const { Conversation } = require('../models');
const AdaptiveResponseGenerator = require('../services/AdaptiveResponseGenerator');
const PHASES = require('../config/phases');

/**
 * Process chat message with Acknowledgment-Insight-Inquiry loop
 */
const sendMessage = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    const { message, responseTime } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Calculate response time if not provided
    const actualResponseTime = responseTime || 
      (conversation.lastMessageTime ? Date.now() - conversation.lastMessageTime.getTime() : 5000);
    
    // Save user message with metadata
    const wordCount = message.split(/\s+/).length;
    await Conversation.updateOne(
      { sessionId },
      { 
        $push: { 
          messages: { 
            sender: 'user', 
            text: message, 
            phaseId: conversation.currentPhase,
            responseTime: actualResponseTime,
            wordCount,
            timestamp: new Date()
          } 
        } 
      }
    );
    
    // Generate adaptive AI response using the new system
    const response = await AdaptiveResponseGenerator.generate(message, conversation, actualResponseTime);
    
    // Save AI message
    await Conversation.updateOne(
      { sessionId },
      { 
        $push: { 
          messages: { 
            sender: 'ai', 
            text: response.text, 
            phaseId: response.phase.id,
            timestamp: new Date()
          } 
        } 
      }
    );
    
    // Get updated conversation for final state
    const updatedConv = await Conversation.findOne({ sessionId });
    
    // Build comprehensive response for frontend
    res.json({
      success: true,
      message: response.text,
      
      // CRITICAL: Synchronized hint that matches the AI's question
      hint: response.hint,
      suggestedHint: response.suggestedHint,
      
      // Phase information with Prism UI data
      phase: response.phase,
      phaseColor: response.phase.color,
      phaseIcon: response.phase.icon,
      
      // Cognitive adaptive data
      cognitive: response.cognitive,
      focusMeterIntensity: response.cognitive.focusMeterIntensity,
      
      // Pattern detection for toasts
      patterns: response.patterns,
      
      // Sector/phase progression
      sectorUnlocked: response.sectorUnlocked,
      
      // DSM-5 scoring
      dsmScoring: response.dsmScoring,
      
      // Exchange tracking
      exchangeCount: response.exchangeCount,
      phaseProgress: response.phaseProgress,
      
      // CRITICAL: canEnd constraint - only true in final phase
      canEnd: response.canEnd,
      isComplete: response.canEnd && response.phase.id === PHASES.length - 1,
      
      // Mission progress for right sidebar
      missionProgress: {
        sectorsUnlocked: updatedConv.sectorsUnlocked || [0],
        currentSector: response.phase.id,
        totalSectors: PHASES.length,
        phaseExchanges: response.phaseProgress.current,
        phaseRequired: response.phaseProgress.required,
        indicatorsCollected: response.phaseProgress.indicatorsCollected
      },
      
      // Clarification flag
      isClarification: response.isClarification || false
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get chat history with phase context
 */
const getChatHistory = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const phase = PHASES[Math.min(conversation.currentPhase, PHASES.length - 1)];
    
    res.json({
      success: true,
      messages: conversation.messages,
      currentPhase: conversation.currentPhase,
      totalExchanges: conversation.totalExchanges,
      phase: {
        id: conversation.currentPhase,
        name: phase.name,
        sectorName: phase.sectorName,
        icon: phase.icon,
        color: phase.color
      },
      dsmScoring: conversation.dsmScoring,
      indicators: conversation.indicators?.length || 0
    });
    
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
};
