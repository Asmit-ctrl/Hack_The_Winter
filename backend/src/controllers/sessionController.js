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
      ? `Hello! I'm NeuroFocus AI, a clinical screening assistant designed to help identify ADHD patterns in children.\n\nI'll guide you through a structured conversation about ${name}'s behavior across different areas - attention, energy, impulse control, emotions, and daily functioning. This takes about 15-20 minutes.\n\nAbout This Screening:\n- Based on DSM-5 clinical criteria\n- Covers 5 key behavioral domains\n- Generates a professional report for healthcare providers\n\nPhase 1: Introduction\n\nLet's start by understanding the current situation. Can you describe ${name}'s typical day? How does ${name} handle tasks like homework, chores, or following instructions?`
      : `Hi ${name}! I'm NeuroFocus AI, a screening assistant that helps understand how your brain works.\n\nI'll ask you questions about your focus, energy, and how you handle different situations. There are no right or wrong answers - just be honest about your experiences. This takes about 15-20 minutes.\n\nWhat We'll Cover:\n- How you focus on tasks\n- Your energy levels\n- How you handle emotions\n- Daily challenges and strengths\n\nPhase 1: Getting Started\n\nLet's begin! Can you tell me about a typical school day? What's the hardest part about staying focused in class or on homework?`;
    
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
      ? "e.g., 'Takes forever to finish homework, gets distracted easily' or 'Has trouble following multi-step instructions'"
      : "e.g., 'I get distracted a lot in class' or 'It's hard to sit still during lessons'";
    
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
