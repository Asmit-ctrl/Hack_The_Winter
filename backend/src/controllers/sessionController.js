/**
 * Session Controller
 * Handles session lifecycle (start, end, status)
 */

const { v4: uuidv4 } = require('uuid');
const { Conversation } = require('../models');
const { DSM5ScoringEngine } = require('../services');
const PHASES = require('../config/phases');

/**
 * Start a new screening session
 */
const startSession = async (req, res) => {
  try {
    const { name, age, userType } = req.body;
    
    if (!name || !age) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and age are required' 
      });
    }
    
    const sessionId = uuidv4();
    
    // Create conversation
    const conversation = new Conversation({
      sessionId,
      name,
      age: parseInt(age) || 10,
      userType: userType || 'parent',
      sectorsUnlocked: [0],
      cognitiveState: {
        impulsivityScore: 0,
        focusScore: 50,
        engagementLevel: 'normal',
        specificExamplesCount: 0,
        coolDownTriggered: false,
        averageResponseTime: 0,
        shortResponseStreak: 0
      }
    });
    
    await conversation.save();
    req.session.sessionId = sessionId;
    
    // Generate greeting
    const isParent = userType === 'parent';
    const greeting = isParent 
      ? `🚀 Welcome to Mission Control, Navigator!\n\nI'm NeuroFocus AI, and I'll be your guide through this screening mission. We'll explore different "sectors" together to understand ${name}'s attention, focus, and behavior patterns.\n\nThis isn't a test - it's a conversation. Your honest observations are valuable data.\n\n📍 Current Sector: Alpha (First Contact)\n\nLet's begin: What made you decide to start this mission today? What's been on your mind about ${name}?`
      : `🚀 Welcome to Mission Control, ${name}!\n\nI'm NeuroFocus AI. Think of me as your co-pilot on this exploration mission. We'll chat about how your brain works - your focus, energy, and how you handle things.\n\nNo tests, no grades - just a conversation.\n\n📍 Current Sector: Alpha (First Contact)\n\nSo, what made you want to do this today?`;
    
    // Save greeting
    await Conversation.updateOne(
      { sessionId },
      { 
        $push: { 
          messages: { 
            sender: 'ai', 
            text: greeting, 
            phaseId: 0 
          } 
        } 
      }
    );
    
    const hint = isParent 
      ? "e.g., 'Teacher suggested it' or 'Struggling with homework' or 'Can't sit still'"
      : "e.g., 'My parents wanted me to' or 'I have trouble focusing' or 'Just curious'";
    
    res.json({
      success: true,
      sessionId,
      message: greeting,
      hint,
      phase: {
        id: 0,
        name: PHASES[0].name,
        sectorName: PHASES[0].sectorName,
        missionTitle: PHASES[0].missionTitle,
        icon: PHASES[0].icon,
        color: PHASES[0].color,
        total: PHASES.length
      },
      cognitive: {
        focusScore: 50,
        impulsivityScore: 0,
        coolDownTriggered: false,
        coolDownDuration: 0,
        engagementLevel: 'normal'
      },
      missionProgress: {
        sectorsUnlocked: [0],
        currentSector: 0,
        totalSectors: PHASES.length
      }
    });
    
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * End session and get final analysis
 */
const endSession = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Calculate final analysis
    const dsmScoring = DSM5ScoringEngine.updateScoring(conversation);
    const endTime = new Date();
    const duration = Math.round((endTime - conversation.startTime) / 60000);
    
    // Generate summary and observations
    const summary = DSM5ScoringEngine.generateSummary(conversation, dsmScoring);
    const observations = DSM5ScoringEngine.generateObservations(conversation, dsmScoring);
    
    const analysis = {
      ...dsmScoring,
      summary,
      observations,
      recommendEvaluation: dsmScoring.severityLevel !== 'minimal' || 
                          dsmScoring.presentationCode !== 'Subthreshold'
    };
    
    // Update conversation
    await Conversation.updateOne(
      { sessionId },
      { 
        $set: { 
          status: 'completed',
          endTime,
          duration: `${duration} minutes`,
          analysis
        } 
      }
    );
    
    res.json({
      success: true,
      name: conversation.name,
      age: conversation.age,
      userType: conversation.userType,
      summary: analysis.summary,
      analysis: {
        presentationCode: dsmScoring.presentationCode,
        presentationType: dsmScoring.presentationType,
        severityLevel: dsmScoring.severityLevel,
        inattentionScore: dsmScoring.inattentionScore,
        hiScore: dsmScoring.hiScore,
        totalScore: dsmScoring.totalScore,
        threshold: dsmScoring.threshold,
        meetsInattentionThreshold: dsmScoring.meetsInattentionThreshold,
        meetsHIThreshold: dsmScoring.meetsHIThreshold,
        domainScores: dsmScoring.domainScores,
        recommendEvaluation: analysis.recommendEvaluation,
        observations: analysis.observations
      },
      exchangeCount: conversation.totalExchanges || conversation.messages.filter(m => m.sender === 'user').length,
      duration: `${duration} minutes`,
      sectorsCompleted: conversation.sectorsUnlocked?.length || 1
    });
    
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get session status
 */
const getSessionStatus = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({
      success: true,
      sessionId,
      status: conversation.status,
      currentPhase: conversation.currentPhase,
      totalExchanges: conversation.totalExchanges,
      sectorsUnlocked: conversation.sectorsUnlocked
    });
    
  } catch (error) {
    console.error('Get session status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  startSession,
  endSession,
  getSessionStatus
};
