/**
 * Conversation Model
 * MongoDB schema for ADHD screening conversations
 * Enhanced for adaptive conversation flow and clinical analysis
 */

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Session identification
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // User information
  name: { type: String, required: true },
  age: { type: Number, required: true },
  userType: { 
    type: String, 
    enum: ['parent', 'student'], 
    default: 'parent' 
  },
  
  // Chat messages with enhanced metadata
  messages: [{
    sender: { type: String, enum: ['user', 'ai'] },
    text: String,
    timestamp: { type: Date, default: Date.now },
    phaseId: Number,
    responseTime: Number,
    wordCount: Number,
    // Track if message was a clarification request/response
    isClarification: { type: Boolean, default: false },
    // Track detected indicators in this message
    indicatorsDetected: [String]
  }],
  
  // Clinical observations
  observations: [{
    text: String,
    domain: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // DSM-5 Indicators - Enhanced with severity tracking
  indicators: [{
    domain: { 
      type: String, 
      enum: ['inattention', 'hyperactivity', 'impulsivity', 'emotional', 'executive'],
      required: true 
    },
    pattern: String,
    context: String,
    severity: { 
      type: String, 
      enum: ['always', 'often', 'sometimes', 'rarely', 'neutral'],
      default: 'neutral' 
    },
    weight: { type: Number, default: 1 },
    phaseId: Number,
    dsmCriteria: String,
    timestamp: { type: Date, default: Date.now },
    // Track specific behavior mentioned
    behaviorDescription: String,
    // Track frequency if mentioned
    frequency: String
  }],
  
  // Cognitive Adaptive State
  cognitiveState: {
    impulsivityScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 50 },
    focusMeterIntensity: { type: Number, default: 50 },
    engagementLevel: { type: String, default: 'normal' },
    specificExamplesCount: { type: Number, default: 0 },
    coolDownTriggered: { type: Boolean, default: false },
    averageResponseTime: { type: Number, default: 0 },
    shortResponseStreak: { type: Number, default: 0 },
    // Track deepening question effectiveness
    deepeningQuestionsAsked: { type: Number, default: 0 },
    specificAnswersReceived: { type: Number, default: 0 }
  },
  
  // Screening Progress - Enhanced
  currentPhase: { type: Number, default: 0 },
  phaseExchanges: { type: Number, default: 0 },
  questionIndex: { type: Number, default: 0 },
  totalExchanges: { type: Number, default: 0 },
  sectorsUnlocked: [Number],
  
  // Phase-specific indicator counts for transition requirements
  phaseIndicatorCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Track used deepening questions to avoid repetition
  usedDeepeningQuestions: [String],
  
  // Timing
  startTime: { type: Date, default: Date.now },
  lastMessageTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: String,
  
  // Status and Results
  status: { 
    type: String, 
    enum: ['active', 'completed', 'abandoned'], 
    default: 'active' 
  },
  analysis: Object,
  
  // DSM-5 Scoring - Enhanced with domain breakdowns
  dsmScoring: {
    // Item counts per domain
    inattentionItems: { type: Number, default: 0 },
    hyperactivityItems: { type: Number, default: 0 },
    impulsivityItems: { type: Number, default: 0 },
    emotionalItems: { type: Number, default: 0 },
    
    // Weighted scores
    inattentionScore: { type: Number, default: 0 },
    hiScore: { type: Number, default: 0 }, // Hyperactivity-Impulsivity combined
    totalScore: { type: Number, default: 0 },
    
    // Clinical presentation
    presentationCode: String, // 314.01, 314.00, 314.01 combined
    presentationType: String, // Predominantly Inattentive, Hyperactive-Impulsive, Combined
    severityLevel: String, // Mild, Moderate, Severe
    
    // Confidence based on data quality
    confidenceLevel: { type: String, default: 'low' },
    
    // Domain-specific severity assessments
    domainSeverities: {
      inattention: { type: String, default: 'none' },
      hyperactivity: { type: String, default: 'none' },
      impulsivity: { type: String, default: 'none' },
      emotional: { type: String, default: 'none' }
    }
  },
  
  // Conversation quality metrics
  conversationMetrics: {
    clarificationRequests: { type: Number, default: 0 },
    topicChanges: { type: Number, default: 0 },
    deepeningSuccess: { type: Number, default: 0 },
    averageResponseLength: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ status: 1 });
conversationSchema.index({ startTime: -1 });
conversationSchema.index({ 'dsmScoring.presentationCode': 1 });
conversationSchema.index({ 'indicators.domain': 1 });
conversationSchema.index({ 'indicators.timestamp': -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
