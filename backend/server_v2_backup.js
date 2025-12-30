/**
 * ============================================================
 * NEUROFOCUS AI - MISSION CONTROL BACKEND
 * ============================================================
 * Cognitive-Adaptive ADHD Screening with DSM-5 Analysis Engine
 * 
 * FEATURES:
 * - 6-Phase "Sector" screening system (Narrative Quests)
 * - Real-time impulsivity detection (Cool Down trigger)
 * - Focus Meter scoring (specific example detection)
 * - DSM-5 severity marker analysis
 * - Age-based diagnostic thresholds
 * - ADHD presentation type calculation (ADHD-C, ADHD-I, ADHD-HI)
 * - PDF clinical report generation
 * ============================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'neurofocus_mission_control_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ==================== MONGODB CONNECTION ====================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/adhd_screening')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ==================== ENHANCED MONGODB SCHEMA ====================
const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  name: String,
  age: Number,
  userType: { type: String, enum: ['parent', 'student'], default: 'parent' },
  messages: [{
    sender: { type: String, enum: ['user', 'ai'] },
    text: String,
    timestamp: { type: Date, default: Date.now },
    phaseId: Number,
    responseTime: Number,  // milliseconds between messages
    wordCount: Number
  }],
  observations: [{
    text: String,
    domain: String,
    timestamp: { type: Date, default: Date.now }
  }],
  indicators: [{
    domain: String,
    pattern: String,
    context: String,
    severity: String,
    phaseId: Number,
    dsmCriteria: String   // DSM-5 criteria reference
  }],
  
  // Cognitive Adaptive State
  cognitiveState: {
    impulsivityScore: { type: Number, default: 0 },      // 0-100 (high = impulsive)
    focusScore: { type: Number, default: 50 },           // 0-100 (Focus Meter)
    engagementLevel: { type: String, default: 'normal' }, // low, normal, high
    specificExamplesCount: { type: Number, default: 0 },
    coolDownTriggered: { type: Boolean, default: false },
    averageResponseTime: { type: Number, default: 0 },
    shortResponseStreak: { type: Number, default: 0 }
  },
  
  // Screening Progress
  currentPhase: { type: Number, default: 0 },
  phaseExchanges: { type: Number, default: 0 },
  questionIndex: { type: Number, default: 0 },
  totalExchanges: { type: Number, default: 0 },
  sectorsUnlocked: [Number],  // Mission Narrative: unlocked sectors
  
  // Timing
  startTime: { type: Date, default: Date.now },
  lastMessageTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: String,
  
  // Status and Results
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  analysis: Object,
  
  // DSM-5 Scoring
  dsmScoring: {
    inattentionItems: { type: Number, default: 0 },        // Count of met criteria
    hyperactivityItems: { type: Number, default: 0 },
    impulsivityItems: { type: Number, default: 0 },
    inattentionScore: { type: Number, default: 0 },        // Weighted score
    hiScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 }
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// ==================== OPENAI SETUP ====================
const DEMO_MODE = !process.env.OPENAI_API_KEY;
let openai = null;

if (!DEMO_MODE) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const FINE_TUNED_MODEL = process.env.FINE_TUNED_MODEL || 'ft:gpt-3.5-turbo-0125:helling-aura::CsEvcJqe';

// ==================== 6-PHASE "MISSION SECTORS" SYSTEM ====================
const PHASES = [
  {
    id: 0,
    name: 'Introduction',
    sectorName: 'Sector Alpha',
    missionTitle: 'First Contact',
    icon: '👋',
    color: '#FF9F43',
    description: 'Establishing connection and understanding mission objectives',
    questions: [
      {
        text: "Welcome to Mission Control. What brought you here today? What's been on your mind?",
        hint: "e.g., 'Teacher suggested it' or 'Struggling with homework' or 'Can't sit still'",
        probeFor: ['concerns', 'context']
      },
      {
        text: "Tell me a bit about {name} - what's their personality like on a typical day?",
        hint: "e.g., 'Very energetic and curious' or 'Quiet but easily frustrated'",
        probeFor: ['personality', 'baseline']
      }
    ],
    minExchanges: 2,
    maxExchanges: 3,
    dsmDomains: []
  },
  {
    id: 1,
    name: 'Focus & Attention',
    sectorName: 'Sector Beta',
    missionTitle: 'Deep Scan: Attention Systems',
    icon: '🎯',
    color: '#54A0FF',
    description: 'Scanning attention patterns and concentration capabilities',
    questions: [
      {
        text: "Entering Attention Sector. How does {name} handle tasks that need concentration - like homework or chores?",
        hint: "e.g., 'Takes hours to finish' or 'Gets distracted every few minutes'",
        probeFor: ['sustained_attention', 'task_completion'],
        dsmCriteria: 'DSM-5 Criterion A1a-d'
      },
      {
        text: "When {name} is doing something they find boring, what happens?",
        hint: "e.g., 'Gives up quickly' or 'Starts doing something else'",
        probeFor: ['effort_avoidance', 'persistence'],
        dsmCriteria: 'DSM-5 Criterion A1f'
      },
      {
        text: "Does {name} often lose things or forget what they were supposed to do?",
        hint: "e.g., 'Loses pencils daily' or 'Forgets homework at school'",
        probeFor: ['organization', 'forgetfulness'],
        dsmCriteria: 'DSM-5 Criterion A1g-i'
      },
      {
        text: "How easily does {name} get distracted by things around them?",
        hint: "e.g., 'Any noise grabs attention' or 'Looks out window constantly'",
        probeFor: ['distractibility', 'external_stimuli'],
        dsmCriteria: 'DSM-5 Criterion A1h'
      }
    ],
    minExchanges: 3,
    maxExchanges: 5,
    dsmDomains: ['inattention']
  },
  {
    id: 2,
    name: 'Energy & Movement',
    sectorName: 'Sector Gamma',
    missionTitle: 'Power Systems Analysis',
    icon: '⚡',
    color: '#FECA57',
    description: 'Analyzing energy output and movement patterns',
    questions: [
      {
        text: "Sector Gamma activated. How would you describe {name}'s activity level compared to others?",
        hint: "e.g., 'Way more hyper' or 'About the same' or 'Non-stop energy'",
        probeFor: ['hyperactivity_level', 'comparison'],
        dsmCriteria: 'DSM-5 Criterion A2a'
      },
      {
        text: "Can {name} sit still when needed - at dinner, in class, or watching a movie?",
        hint: "e.g., 'Never sits still' or 'Fidgets but stays seated'",
        probeFor: ['fidgeting', 'seat_leaving'],
        dsmCriteria: 'DSM-5 Criterion A2a-b'
      },
      {
        text: "Does {name} seem like they're 'driven by a motor' - always on the go?",
        hint: "e.g., 'Yes, non-stop' or 'Running around even at night'",
        probeFor: ['motor_driven', 'restlessness'],
        dsmCriteria: 'DSM-5 Criterion A2c-d'
      }
    ],
    minExchanges: 3,
    maxExchanges: 5,
    dsmDomains: ['hyperactivity']
  },
  {
    id: 3,
    name: 'Impulse Control',
    sectorName: 'Sector Delta',
    missionTitle: 'Control Systems Check',
    icon: '⏱️',
    color: '#FF5F5F',
    description: 'Testing impulse regulation and response inhibition',
    questions: [
      {
        text: "Entering Control Sector. How does {name} handle waiting - in lines, for turns, for things they want?",
        hint: "e.g., 'Meltdowns in lines' or 'Can wait if distracted' or 'Very impatient'",
        probeFor: ['waiting_difficulty', 'frustration_tolerance'],
        dsmCriteria: 'DSM-5 Criterion A2g'
      },
      {
        text: "Does {name} often interrupt conversations or blurt out answers?",
        hint: "e.g., 'All the time' or 'In class especially' or 'Only when excited'",
        probeFor: ['interrupting', 'blurting'],
        dsmCriteria: 'DSM-5 Criterion A2h-i'
      },
      {
        text: "When {name} wants to do something, do they think it through or just act?",
        hint: "e.g., 'Acts without thinking' or 'Jumps into things' or 'Sometimes plans'",
        probeFor: ['action_without_thinking', 'planning'],
        dsmCriteria: 'DSM-5 Criterion A2e-f'
      }
    ],
    minExchanges: 2,
    maxExchanges: 4,
    dsmDomains: ['impulsivity']
  },
  {
    id: 4,
    name: 'Emotions',
    sectorName: 'Sector Epsilon',
    missionTitle: 'Emotional Systems Calibration',
    icon: '💭',
    color: '#A29BFE',
    description: 'Calibrating emotional regulation systems',
    questions: [
      {
        text: "Sector Epsilon online. How does {name} handle frustration or when things don't go their way?",
        hint: "e.g., 'Big meltdowns' or 'Throws things' or 'Cries easily'",
        probeFor: ['frustration_tolerance', 'emotional_intensity']
      },
      {
        text: "Does {name} have strong emotional reactions - like big meltdowns or mood swings?",
        hint: "e.g., 'From happy to angry instantly' or 'Small things cause big reactions'",
        probeFor: ['emotional_lability', 'intensity']
      },
      {
        text: "When {name} gets upset, what helps them calm down? How long does it take?",
        hint: "e.g., 'Takes 30+ minutes' or 'Needs alone time' or 'Nothing works'",
        probeFor: ['regulation_strategies', 'recovery_time']
      }
    ],
    minExchanges: 2,
    maxExchanges: 4,
    dsmDomains: ['emotional']
  },
  {
    id: 5,
    name: 'Strengths & Wrap-up',
    sectorName: 'Sector Omega',
    missionTitle: 'Mission Completion',
    icon: '⭐',
    color: '#1DD1A1',
    description: 'Identifying strengths and concluding mission',
    questions: [
      {
        text: "Final Sector reached. Let's talk strengths - what is {name} really good at?",
        hint: "e.g., 'Very creative' or 'Great with animals' or 'Makes people laugh'",
        probeFor: ['strengths', 'positive_traits']
      },
      {
        text: "What activities or subjects does {name} enjoy and do well in?",
        hint: "e.g., 'Art and music' or 'Sports' or 'Video games' or 'Building things'",
        probeFor: ['interests', 'successes']
      },
      {
        text: "Is there anything else important for the mission report?",
        hint: "e.g., 'Has anxiety too' or 'Different at home vs school'",
        probeFor: ['additional_info', 'comorbidities']
      }
    ],
    minExchanges: 2,
    maxExchanges: 3,
    dsmDomains: []
  }
];

// ==================== DSM-5 ANALYSIS ENGINE ====================

/**
 * DSM-5 Severity Markers with weighted scoring
 */
const DSM5_MARKERS = {
  high: {
    words: ['always', 'constantly', 'every day', 'all the time', 'never', 'completely', 
            'impossible', 'extreme', 'severe', 'terrible', 'horrible', 'cant', "can't",
            'unable', 'refuses', 'won\'t', 'wont'],
    weight: 3,
    description: 'Severe/Pervasive'
  },
  moderate: {
    words: ['often', 'frequently', 'usually', 'most', 'many times', 'regularly',
            'very', 'really', 'pretty', 'quite', 'a lot', 'tends to'],
    weight: 2,
    description: 'Often/Significant'
  },
  low: {
    words: ['sometimes', 'occasionally', 'rarely', 'once in a while', 'now and then',
            'a little', 'somewhat', 'kind of', 'sort of', 'depends'],
    weight: 1,
    description: 'Sometimes/Mild'
  }
};

/**
 * Pattern indicators mapped to DSM-5 criteria
 */
const DSM5_INDICATOR_PATTERNS = {
  inattention: {
    patterns: ['distracted', 'focus', 'attention', 'concentrate', 'forget', 'forgets',
               'lose', 'loses', 'lost', 'careless', 'mistake', 'daydream', 'zone out',
               'not listening', 'doesn\'t listen', 'homework', 'follow through', 
               'finish', 'organize', 'avoids', 'details', 'instructions'],
    criteria: 'DSM-5 Criterion A1 (Inattention)',
    maxItems: 9
  },
  hyperactivity: {
    patterns: ['fidget', 'fidgets', 'sit still', 'restless', 'always moving', 'hyper',
               'energy', 'running', 'climbing', 'motor', 'calm down', 'loud', 'noisy',
               'squirms', 'leaves seat', 'runs', 'climbs', 'on the go', 'talks a lot',
               'excessive', 'nonstop'],
    criteria: 'DSM-5 Criterion A2a-f (Hyperactivity)',
    maxItems: 6
  },
  impulsivity: {
    patterns: ['interrupt', 'interrupts', 'blurt', 'blurts', 'wait', 'waiting', 
               'patient', 'impatient', 'impulsive', 'turn', 'turns', 'cut in line',
               'grab', 'grabs', 'without thinking', 'rush', 'rushes', 'intrudes',
               'butts in', 'answer before'],
    criteria: 'DSM-5 Criterion A2g-i (Impulsivity)',
    maxItems: 3
  },
  emotional: {
    patterns: ['meltdown', 'tantrum', 'mood', 'outburst', 'anger', 'angry', 'cry',
               'cries', 'sensitive', 'overreact', 'emotional', 'frustrated', 'explosive',
               'irritable', 'temper', 'rage'],
    criteria: 'Emotional Dysregulation (Associated Feature)'
  },
  executive: {
    patterns: ['organize', 'plan', 'planning', 'time', 'late', 'routine', 'schedule',
               'start', 'starting', 'finish', 'finishing', 'complete', 'procrastinate',
               'prioritize', 'manage', 'sequence'],
    criteria: 'Executive Function (Associated Feature)'
  }
};

/**
 * Specific Example Detection (for Focus Meter)
 */
const SPECIFIC_EXAMPLE_INDICATORS = [
  /yesterday|today|last week|this morning|last night/i,
  /when (he|she|they|we|i) (was|were|did)/i,
  /for example|like when|such as|one time/i,
  /at school|at home|during dinner|during homework|in class/i,
  /teacher said|doctor said|therapist/i,
  /\d+ (minutes?|hours?|times?|days?)/i,  // Specific time references
  /"[^"]+"/,  // Quoted speech
  /happened when|remember when/i
];

/**
 * Impulsivity Detection Patterns (for Cool Down Timer)
 */
const IMPULSIVITY_INDICATORS = {
  shortResponse: 5,      // Words threshold for "short" response
  rapidFire: 3000,       // Milliseconds threshold for "rapid" response
  streakThreshold: 3,    // Consecutive short responses to trigger
  coolDownDuration: 5000 // Milliseconds to cool down
};

// ==================== COGNITIVE STATE ANALYZER ====================

class CognitiveAnalyzer {
  /**
   * Analyze message for DSM-5 severity markers
   */
  static analyzeSeverity(message) {
    const messageLower = message.toLowerCase();
    
    for (const [level, config] of Object.entries(DSM5_MARKERS)) {
      for (const word of config.words) {
        if (messageLower.includes(word)) {
          return {
            level,
            weight: config.weight,
            description: config.description,
            trigger: word
          };
        }
      }
    }
    
    return { level: 'neutral', weight: 0, description: 'Neutral/Unclear' };
  }

  /**
   * Detect DSM-5 domain indicators
   */
  static detectIndicators(message, phaseId) {
    const messageLower = message.toLowerCase();
    const indicators = [];
    const severity = this.analyzeSeverity(message);
    
    for (const [domain, config] of Object.entries(DSM5_INDICATOR_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (messageLower.includes(pattern)) {
          indicators.push({
            domain,
            pattern,
            context: message.slice(0, 150),
            severity: severity.level,
            weight: severity.weight,
            phaseId,
            dsmCriteria: config.criteria,
            timestamp: new Date()
          });
          break; // One indicator per domain per message
        }
      }
    }
    
    return { indicators, severity };
  }

  /**
   * Calculate Focus Meter (specific examples detection)
   */
  static calculateFocusScore(message, currentScore, specificExamplesCount) {
    let newScore = currentScore;
    let newExamplesCount = specificExamplesCount;
    let hasSpecificExample = false;
    
    // Check for specific examples
    for (const pattern of SPECIFIC_EXAMPLE_INDICATORS) {
      if (pattern.test(message)) {
        hasSpecificExample = true;
        newExamplesCount++;
        newScore = Math.min(100, newScore + 15);  // Boost for specific example
        break;
      }
    }
    
    // Word count affects focus score
    const wordCount = message.split(/\s+/).length;
    if (wordCount >= 20) {
      newScore = Math.min(100, newScore + 5);  // Detailed response
    } else if (wordCount <= 5) {
      newScore = Math.max(0, newScore - 10);   // Too brief
    }
    
    return {
      focusScore: newScore,
      specificExamplesCount: newExamplesCount,
      hasSpecificExample,
      wordCount
    };
  }

  /**
   * Detect impulsivity patterns (for Cool Down Timer)
   */
  static detectImpulsivity(message, responseTime, currentState) {
    const wordCount = message.split(/\s+/).length;
    let impulsivityScore = currentState.impulsivityScore || 0;
    let shortStreak = currentState.shortResponseStreak || 0;
    let triggerCoolDown = false;
    
    // Short response detection
    if (wordCount <= IMPULSIVITY_INDICATORS.shortResponse) {
      shortStreak++;
      impulsivityScore = Math.min(100, impulsivityScore + 15);
    } else {
      shortStreak = Math.max(0, shortStreak - 1);
      impulsivityScore = Math.max(0, impulsivityScore - 5);
    }
    
    // Rapid response detection
    if (responseTime && responseTime < IMPULSIVITY_INDICATORS.rapidFire) {
      impulsivityScore = Math.min(100, impulsivityScore + 20);
      shortStreak++;
    }
    
    // Trigger cool down if streak threshold met
    if (shortStreak >= IMPULSIVITY_INDICATORS.streakThreshold) {
      triggerCoolDown = true;
    }
    
    // High impulsivity score triggers cool down
    if (impulsivityScore >= 70) {
      triggerCoolDown = true;
    }
    
    return {
      impulsivityScore,
      shortResponseStreak: shortStreak,
      coolDownTriggered: triggerCoolDown,
      coolDownDuration: triggerCoolDown ? IMPULSIVITY_INDICATORS.coolDownDuration : 0,
      responseTime,
      wordCount
    };
  }

  /**
   * Full cognitive analysis of user message
   */
  static analyzeMessage(message, responseTime, conversation) {
    const currentState = conversation.cognitiveState || {};
    
    // DSM-5 indicators
    const { indicators, severity } = this.detectIndicators(message, conversation.currentPhase);
    
    // Focus meter
    const focusAnalysis = this.calculateFocusScore(
      message, 
      currentState.focusScore || 50,
      currentState.specificExamplesCount || 0
    );
    
    // Impulsivity detection
    const impulsivityAnalysis = this.detectImpulsivity(message, responseTime, currentState);
    
    // Engagement level
    let engagementLevel = 'normal';
    if (focusAnalysis.focusScore >= 75 && focusAnalysis.hasSpecificExample) {
      engagementLevel = 'high';
    } else if (focusAnalysis.focusScore <= 30 || impulsivityAnalysis.impulsivityScore >= 60) {
      engagementLevel = 'low';
    }
    
    // Emotional analysis
    const emotionalWords = ['frustrated', 'worried', 'exhausted', 'tired', 'scared',
                           'angry', 'upset', 'overwhelmed', 'stressed', 'hard', 
                           'difficult', 'struggling', 'hate', 'love', 'happy'];
    const isEmotional = emotionalWords.some(w => message.toLowerCase().includes(w));
    
    // Vague response detection
    const vagueResponses = ['yes', 'no', 'maybe', 'sometimes', 'i guess', 'ok', 'okay', 'sure', 'idk'];
    const isVague = vagueResponses.includes(message.toLowerCase().trim()) || message.split(/\s+/).length < 4;
    
    return {
      indicators,
      severity,
      focusScore: focusAnalysis.focusScore,
      specificExamplesCount: focusAnalysis.specificExamplesCount,
      hasSpecificExample: focusAnalysis.hasSpecificExample,
      impulsivityScore: impulsivityAnalysis.impulsivityScore,
      shortResponseStreak: impulsivityAnalysis.shortResponseStreak,
      coolDownTriggered: impulsivityAnalysis.coolDownTriggered,
      coolDownDuration: impulsivityAnalysis.coolDownDuration,
      engagementLevel,
      isEmotional,
      isVague,
      wordCount: focusAnalysis.wordCount,
      responseTime
    };
  }
}

// ==================== DSM-5 SCORING ENGINE ====================

class DSM5ScoringEngine {
  /**
   * Calculate age-based diagnostic threshold
   * DSM-5: 6+ symptoms for under 17, 5+ for 17 and older
   */
  static getThreshold(age) {
    return age < 17 ? 6 : 5;
  }

  /**
   * Update DSM-5 scoring from indicators
   */
  static updateScoring(conversation) {
    const indicators = conversation.indicators || [];
    const age = conversation.age || 10;
    const threshold = this.getThreshold(age);
    
    // Count unique patterns per domain
    const domainPatterns = {
      inattention: new Set(),
      hyperactivity: new Set(),
      impulsivity: new Set(),
      emotional: new Set(),
      executive: new Set()
    };
    
    // Weighted scores
    const domainScores = {
      inattention: 0,
      hyperactivity: 0,
      impulsivity: 0,
      emotional: 0,
      executive: 0
    };
    
    for (const ind of indicators) {
      const domain = ind.domain;
      if (domainPatterns[domain]) {
        domainPatterns[domain].add(ind.pattern);
        
        // Add weighted score
        const weight = ind.weight || 1;
        domainScores[domain] += weight;
      }
    }
    
    // Item counts (unique patterns detected)
    const inattentionItems = Math.min(domainPatterns.inattention.size, 9);
    const hyperactivityItems = Math.min(domainPatterns.hyperactivity.size, 6);
    const impulsivityItems = Math.min(domainPatterns.impulsivity.size, 3);
    
    // Weighted scores (capped)
    const inattentionScore = Math.min(domainScores.inattention, 27);
    const hiScore = Math.min(domainScores.hyperactivity + domainScores.impulsivity, 27);
    const totalScore = inattentionScore + hiScore;
    
    // Determine presentation type based on DSM-5 criteria
    const meetsInattentionThreshold = inattentionItems >= threshold;
    const meetsHIThreshold = (hyperactivityItems + impulsivityItems) >= threshold;
    
    let presentationCode, presentationType;
    if (meetsInattentionThreshold && meetsHIThreshold) {
      presentationCode = 'ADHD-C';
      presentationType = 'Combined Presentation';
    } else if (meetsInattentionThreshold) {
      presentationCode = 'ADHD-I';
      presentationType = 'Predominantly Inattentive Presentation';
    } else if (meetsHIThreshold) {
      presentationCode = 'ADHD-HI';
      presentationType = 'Predominantly Hyperactive-Impulsive Presentation';
    } else {
      presentationCode = 'Subthreshold';
      presentationType = 'Below Diagnostic Threshold';
    }
    
    // Severity level
    let severityLevel;
    if (totalScore >= 42) severityLevel = 'severe';
    else if (totalScore >= 28) severityLevel = 'moderate';
    else if (totalScore >= 15) severityLevel = 'mild';
    else severityLevel = 'minimal';
    
    return {
      inattentionItems,
      hyperactivityItems,
      impulsivityItems,
      inattentionScore,
      hiScore,
      totalScore,
      threshold,
      meetsInattentionThreshold,
      meetsHIThreshold,
      presentationCode,
      presentationType,
      severityLevel,
      domainScores
    };
  }
}

// ==================== PHASE-BASED SYSTEM PROMPTS ====================

function getSystemPrompt(phaseId, userType, name, age) {
  const phase = PHASES[phaseId] || PHASES[0];
  const isParent = userType === 'parent';
  const subject = isParent ? name : 'yourself';
  const pronoun = isParent ? 'they' : 'you';
  
  const basePrompt = `You are NeuroFocus AI, a warm and empathetic clinical assistant conducting an ADHD screening conversation. You are currently in ${phase.sectorName}: ${phase.missionTitle}.

CURRENT MISSION PHASE: ${phase.name} (${phase.icon})
PHASE OBJECTIVE: ${phase.description}
USER TYPE: ${isParent ? 'Parent (answering about their child ' + name + ', age ' + age + ')' : 'Student (answering about themselves, ' + name + ', age ' + age + ')'}

COMMUNICATION STYLE:
- Be warm, validating, and conversational
- Use age-appropriate language (${age < 12 ? 'simpler terms' : 'can use more detailed language'})
- Acknowledge emotions before asking follow-up questions
- Ask for specific examples when answers are vague
- Never use clinical jargon with the user

DSM-5 AREAS TO EXPLORE IN THIS PHASE:
${phase.dsmDomains.length > 0 ? phase.dsmDomains.map(d => '- ' + d.charAt(0).toUpperCase() + d.slice(1)).join('\n') : '- Build rapport and establish context'}

RESPONSE STRUCTURE:
1. ACKNOWLEDGE what they shared (show you heard them)
2. If emotional, VALIDATE their feelings first
3. Ask ONE focused follow-up question related to ${phase.name}
4. Keep response under 100 words

Remember: You're having a real conversation, not administering a test. Be curious about their experiences.`;

  return basePrompt;
}

// ==================== GENERATE AI RESPONSE ====================

async function generateResponse(userMessage, conversation, responseTime) {
  const sessionId = conversation.sessionId;
  const name = conversation.name || 'your child';
  const age = conversation.age || 10;
  const userType = conversation.userType || 'parent';
  const phaseId = conversation.currentPhase || 0;
  const phaseExchanges = conversation.phaseExchanges || 0;
  const questionIndex = conversation.questionIndex || 0;
  
  // Run cognitive analysis
  const cognitiveAnalysis = CognitiveAnalyzer.analyzeMessage(userMessage, responseTime, conversation);
  
  // Save indicators to database
  for (const indicator of cognitiveAnalysis.indicators) {
    await Conversation.updateOne(
      { sessionId },
      { $push: { indicators: indicator } }
    );
  }
  
  // Update cognitive state
  await Conversation.updateOne(
    { sessionId },
    { 
      $set: { 
        'cognitiveState.impulsivityScore': cognitiveAnalysis.impulsivityScore,
        'cognitiveState.focusScore': cognitiveAnalysis.focusScore,
        'cognitiveState.engagementLevel': cognitiveAnalysis.engagementLevel,
        'cognitiveState.specificExamplesCount': cognitiveAnalysis.specificExamplesCount,
        'cognitiveState.coolDownTriggered': cognitiveAnalysis.coolDownTriggered,
        'cognitiveState.shortResponseStreak': cognitiveAnalysis.shortResponseStreak
      }
    }
  );
  
  // Update DSM-5 scoring
  const updatedConversation = await Conversation.findOne({ sessionId });
  const dsmScoring = DSM5ScoringEngine.updateScoring(updatedConversation);
  
  await Conversation.updateOne(
    { sessionId },
    { $set: { dsmScoring } }
  );
  
  const phase = PHASES[Math.min(phaseId, PHASES.length - 1)];
  
  // Build response
  let acknowledgment = "";
  let insight = "";
  let nextQuestion = "";
  let currentHint = "";
  
  // Generate acknowledgment based on analysis
  if (cognitiveAnalysis.isEmotional) {
    acknowledgment = "I hear you - that sounds really challenging. Thank you for being so open. ";
  } else if (cognitiveAnalysis.hasSpecificExample) {
    acknowledgment = "That's a really helpful specific example - it helps me understand the situation better. ";
  } else if (cognitiveAnalysis.isVague) {
    acknowledgment = "I'd love to understand more about that. ";
  } else if (cognitiveAnalysis.indicators.length > 0) {
    const domain = cognitiveAnalysis.indicators[0].domain;
    const domainAcks = {
      inattention: "I see - so focus and attention are areas of challenge. ",
      hyperactivity: "It sounds like there's a lot of energy to manage. ",
      impulsivity: "Patience and self-control seem challenging. ",
      emotional: "The emotional side can be really intense. ",
      executive: "Organization and planning are tough areas. "
    };
    acknowledgment = domainAcks[domain] || "That's helpful to know. ";
  } else {
    acknowledgment = "Thank you for sharing that. ";
  }
  
  // Add severity insight if detected
  if (cognitiveAnalysis.severity.level === 'high') {
    insight = "When you say it happens that frequently, that's definitely worth noting. ";
  }
  
  // Check phase advancement
  const shouldAdvance = shouldAdvancePhase(phaseExchanges, phaseId, cognitiveAnalysis.indicators.length);
  let newPhaseId = phaseId;
  let newPhaseExchanges = phaseExchanges;
  let newQuestionIndex = questionIndex;
  let sectorUnlocked = false;
  
  if (shouldAdvance && phaseId < PHASES.length - 1) {
    // Advance to next phase
    newPhaseId = phaseId + 1;
    newPhaseExchanges = 0;
    newQuestionIndex = 0;
    sectorUnlocked = true;
    
    const newPhase = PHASES[newPhaseId];
    const transition = `\n\n🔓 ${newPhase.sectorName} Unlocked: ${newPhase.missionTitle}\n\n`;
    const questionData = getPhaseQuestion(newPhaseId, 0, name);
    nextQuestion = transition + questionData.text;
    currentHint = questionData.hint;
    newQuestionIndex = 1;
    
    // Save sector unlock
    await Conversation.updateOne(
      { sessionId },
      { $addToSet: { sectorsUnlocked: newPhaseId } }
    );
    
  } else if (phaseId >= PHASES.length - 1 && phaseExchanges >= PHASES[PHASES.length - 1].minExchanges) {
    // Mission complete
    nextQuestion = "\n\n🎯 Mission Complete!\n\nThank you for this conversation. I have a good understanding now. Would you like to see your mission report?";
    currentHint = "e.g., 'Yes, show me the report' or 'I have more to add'";
    newPhaseExchanges = phaseExchanges + 1;
    
  } else {
    // Continue in current phase
    if (cognitiveAnalysis.isVague && phaseExchanges >= 1) {
      nextQuestion = `Can you give me a specific example? Think of a recent situation where this happened.`;
      currentHint = "e.g., 'Last week during homework...' or 'Yesterday at dinner...'";
    } else {
      newQuestionIndex = questionIndex + 1;
      const questionData = getPhaseQuestion(phaseId, newQuestionIndex, name);
      nextQuestion = questionData.text;
      currentHint = questionData.hint;
    }
    newPhaseExchanges = phaseExchanges + 1;
  }
  
  // Update conversation state
  await Conversation.updateOne(
    { sessionId },
    { 
      $set: { 
        currentPhase: newPhaseId, 
        phaseExchanges: newPhaseExchanges,
        questionIndex: newQuestionIndex,
        lastMessageTime: new Date()
      },
      $inc: { totalExchanges: 1 }
    }
  );
  
  // Use OpenAI if available
  let aiResponse = acknowledgment + insight + nextQuestion;
  
  if (openai && !DEMO_MODE) {
    try {
      const systemPrompt = getSystemPrompt(newPhaseId, userType, name, age);
      const completion = await openai.chat.completions.create({
        model: FINE_TUNED_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation.messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      aiResponse = completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error:', error);
      // Fall back to template response
    }
  }
  
  // Detect patterns for frontend toast notifications
  const detectedPatterns = cognitiveAnalysis.indicators.map(ind => ({
    type: ind.domain,
    message: `${ind.domain.charAt(0).toUpperCase() + ind.domain.slice(1)} indicator: "${ind.pattern}" detected`
  }));
  
  return {
    text: aiResponse.trim(),
    hint: currentHint,
    phase: {
      id: newPhaseId,
      name: PHASES[Math.min(newPhaseId, PHASES.length - 1)].name,
      sectorName: PHASES[Math.min(newPhaseId, PHASES.length - 1)].sectorName,
      missionTitle: PHASES[Math.min(newPhaseId, PHASES.length - 1)].missionTitle,
      icon: PHASES[Math.min(newPhaseId, PHASES.length - 1)].icon,
      color: PHASES[Math.min(newPhaseId, PHASES.length - 1)].color,
      total: PHASES.length
    },
    cognitive: {
      focusScore: cognitiveAnalysis.focusScore,
      impulsivityScore: cognitiveAnalysis.impulsivityScore,
      coolDownTriggered: cognitiveAnalysis.coolDownTriggered,
      coolDownDuration: cognitiveAnalysis.coolDownDuration,
      engagementLevel: cognitiveAnalysis.engagementLevel,
      hasSpecificExample: cognitiveAnalysis.hasSpecificExample
    },
    patterns: detectedPatterns,
    sectorUnlocked,
    dsmScoring: {
      presentationCode: dsmScoring.presentationCode,
      severityLevel: dsmScoring.severityLevel,
      totalScore: dsmScoring.totalScore
    }
  };
}

function shouldAdvancePhase(phaseExchanges, phaseId, indicatorCount) {
  if (phaseId >= PHASES.length) return false;
  const phase = PHASES[phaseId];
  
  // Always advance if we hit maxExchanges
  if (phaseExchanges >= phase.maxExchanges) return true;
  
  // Advance if minExchanges met and we have at least 1 indicator
  if (phaseExchanges >= phase.minExchanges && indicatorCount >= 1) return true;
  
  // Also advance after minExchanges + 1 extra exchange even without indicators (fallback)
  if (phaseExchanges >= phase.minExchanges + 1) return true;
  
  return false;
}

function getPhaseQuestion(phaseId, questionIndex, name) {
  const phase = PHASES[Math.min(phaseId, PHASES.length - 1)];
  const idx = Math.min(questionIndex, phase.questions.length - 1);
  const q = phase.questions[idx];
  return {
    text: q.text.replace(/{name}/g, name),
    hint: q.hint
  };
}

// ==================== API ROUTES ====================

/**
 * Start new screening session
 */
app.post('/api/start-session', async (req, res) => {
  try {
    const { name, age, userType } = req.body;
    const sessionId = uuidv4();
    
    // Create conversation
    const conversation = new Conversation({
      sessionId,
      name,
      age: parseInt(age) || 10,
      userType: userType || 'parent',
      sectorsUnlocked: [0],  // Start with Sector Alpha unlocked
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
    const subject = isParent ? name : 'you';
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
});

/**
 * Send chat message
 */
app.post('/api/chat', async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    const { message, responseTime } = req.body;  // responseTime in ms from frontend
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Calculate response time if not provided
    const actualResponseTime = responseTime || 
      (conversation.lastMessageTime ? Date.now() - conversation.lastMessageTime.getTime() : 5000);
    
    // Save user message
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
            wordCount
          } 
        } 
      }
    );
    
    // Generate AI response with cognitive analysis
    const response = await generateResponse(message, conversation, actualResponseTime);
    
    // Save AI message
    await Conversation.updateOne(
      { sessionId },
      { 
        $push: { 
          messages: { 
            sender: 'ai', 
            text: response.text, 
            phaseId: response.phase.id 
          } 
        } 
      }
    );
    
    // Get updated conversation
    const updatedConv = await Conversation.findOne({ sessionId });
    const totalExchanges = updatedConv.totalExchanges || 0;
    const canEnd = totalExchanges >= 8;
    const isComplete = response.phase.id >= PHASES.length - 1 && 
                       (updatedConv.phaseExchanges || 0) >= PHASES[PHASES.length - 1].minExchanges;
    
    res.json({
      success: true,
      message: response.text,
      hint: response.hint,
      phase: response.phase,
      cognitive: response.cognitive,
      patterns: response.patterns,
      sectorUnlocked: response.sectorUnlocked,
      dsmScoring: response.dsmScoring,
      exchangeCount: totalExchanges,
      canEnd,
      isComplete,
      missionProgress: {
        sectorsUnlocked: updatedConv.sectorsUnlocked || [0],
        currentSector: response.phase.id,
        totalSectors: PHASES.length
      }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * End session and get final analysis
 */
app.post('/api/end-session', async (req, res) => {
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
    
    // Generate summary
    const summary = generateSummary(conversation, dsmScoring);
    
    // Generate observations
    const observations = generateObservations(conversation, dsmScoring);
    
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
});

/**
 * Download PDF Report
 */
app.get('/api/download-report', async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ADHD_Mission_Report_${conversation.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);
    
    const analysis = conversation.analysis || {};
    const dsmScoring = conversation.dsmScoring || {};
    
    // Header
    doc.fontSize(24).fillColor('#1DD1A1').text('NEUROFOCUS AI', { align: 'center' });
    doc.fontSize(18).fillColor('#333').text('MISSION CONTROL - Clinical Screening Report', { align: 'center' });
    doc.moveDown();
    
    // Participant Info
    doc.fontSize(12).fillColor('#666').text('─'.repeat(60));
    doc.fontSize(14).fillColor('#333').text(`Participant: ${conversation.name}`, { continued: true });
    doc.text(`   Age: ${conversation.age}`, { continued: true });
    doc.text(`   User Type: ${conversation.userType}`);
    doc.fontSize(11).fillColor('#666').text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Duration: ${conversation.duration || 'N/A'}`);
    doc.text(`Sectors Completed: ${conversation.sectorsUnlocked?.length || 0} / ${PHASES.length}`);
    doc.moveDown();
    
    // DSM-5 Assessment
    doc.fontSize(16).fillColor('#54A0FF').text('DSM-5 ASSESSMENT RESULTS');
    doc.fontSize(12).fillColor('#666').text('─'.repeat(60));
    doc.moveDown(0.5);
    
    // Presentation
    doc.fontSize(14).fillColor('#333');
    doc.text(`Presentation Code: `, { continued: true });
    doc.fillColor('#FF5F5F').text(dsmScoring.presentationCode || 'Subthreshold');
    doc.fontSize(11).fillColor('#666').text(dsmScoring.presentationType || 'Below Diagnostic Threshold');
    doc.moveDown();
    
    // Severity
    const severityColors = {
      minimal: '#1DD1A1',
      mild: '#FECA57',
      moderate: '#FF9F43',
      severe: '#FF5F5F'
    };
    doc.fontSize(12).fillColor('#333').text('Severity Level: ', { continued: true });
    doc.fillColor(severityColors[dsmScoring.severityLevel] || '#666')
       .text((dsmScoring.severityLevel || 'minimal').toUpperCase());
    doc.moveDown();
    
    // Scores
    doc.fontSize(12).fillColor('#333');
    doc.text(`Inattention Score: ${dsmScoring.inattentionScore || 0} / 27`);
    doc.text(`Hyperactive/Impulsive Score: ${dsmScoring.hiScore || 0} / 27`);
    doc.text(`Total Score: ${dsmScoring.totalScore || 0} / 54`);
    doc.moveDown();
    
    // Diagnostic Threshold
    doc.text(`Age-Based Threshold: ${dsmScoring.threshold || 6} symptoms`);
    doc.text(`Meets Inattention Threshold: ${dsmScoring.meetsInattentionThreshold ? 'Yes' : 'No'}`);
    doc.text(`Meets H/I Threshold: ${dsmScoring.meetsHIThreshold ? 'Yes' : 'No'}`);
    doc.moveDown();
    
    // Summary
    if (analysis.summary) {
      doc.fontSize(14).fillColor('#54A0FF').text('CLINICAL SUMMARY');
      doc.fontSize(11).fillColor('#333').text(analysis.summary, { align: 'justify' });
      doc.moveDown();
    }
    
    // Observations
    if (analysis.observations && analysis.observations.length > 0) {
      doc.fontSize(14).fillColor('#54A0FF').text('KEY OBSERVATIONS');
      for (const obs of analysis.observations) {
        doc.fontSize(11).fillColor('#333').text(`• ${obs}`);
      }
      doc.moveDown();
    }
    
    // Recommendation
    doc.fontSize(14).fillColor('#FF9F43').text('RECOMMENDATION');
    if (analysis.recommendEvaluation) {
      doc.fontSize(11).fillColor('#333')
         .text('Based on this screening, a comprehensive evaluation by a qualified healthcare professional is recommended for accurate diagnosis.', { align: 'justify' });
    } else {
      doc.fontSize(11).fillColor('#333')
         .text('This screening showed minimal concerning patterns. If concerns persist, consider consulting a healthcare professional.', { align: 'justify' });
    }
    doc.moveDown();
    
    // Disclaimer
    doc.fontSize(10).fillColor('#999');
    doc.text('─'.repeat(60));
    doc.text('DISCLAIMER: This report is generated by an AI screening tool and is NOT a clinical diagnosis. Only qualified healthcare professionals can diagnose ADHD. This screening is intended to guide discussion with clinicians and should not replace professional evaluation.', { align: 'justify' });
    
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function generateSummary(conversation, dsmScoring) {
  const name = conversation.name;
  const severity = dsmScoring.severityLevel;
  const presentationCode = dsmScoring.presentationCode;
  
  if (presentationCode === 'Subthreshold') {
    return `Based on this screening conversation about ${name}, indicators were observed but did not meet the DSM-5 threshold for an ADHD diagnosis. Some attention or behavioral patterns were noted that may benefit from monitoring.`;
  }
  
  const presentations = {
    'ADHD-C': 'both inattention and hyperactivity/impulsivity',
    'ADHD-I': 'predominantly inattention',
    'ADHD-HI': 'predominantly hyperactivity and impulsivity'
  };
  
  return `This screening conversation about ${name} revealed patterns consistent with ${presentations[presentationCode] || 'attention challenges'}. The severity level is ${severity}. Multiple indicators across DSM-5 domains were identified, suggesting that a comprehensive professional evaluation would be beneficial.`;
}

function generateObservations(conversation, dsmScoring) {
  const observations = [];
  const domainScores = dsmScoring.domainScores || {};
  
  if (domainScores.inattention >= 6) {
    observations.push('Significant attention and focus challenges noted');
  }
  if (domainScores.hyperactivity >= 4) {
    observations.push('Elevated activity levels and difficulty staying still observed');
  }
  if (domainScores.impulsivity >= 3) {
    observations.push('Impulsive behaviors and difficulty waiting noted');
  }
  if (domainScores.emotional >= 3) {
    observations.push('Emotional regulation challenges identified');
  }
  if (domainScores.executive >= 3) {
    observations.push('Executive function difficulties (organization, planning) observed');
  }
  
  const cogState = conversation.cognitiveState || {};
  if (cogState.specificExamplesCount >= 3) {
    observations.push('User provided multiple specific examples, indicating good insight');
  }
  if (cogState.impulsivityScore >= 50) {
    observations.push('Response patterns suggest possible impulsivity in communication style');
  }
  
  if (observations.length === 0) {
    observations.push('Minimal concerning patterns observed during screening');
  }
  
  return observations;
}

// ==================== SERVER START ====================
app.listen(PORT, () => {
  console.log(`
====================================================
   🚀 NEUROFOCUS AI - MISSION CONTROL BACKEND
   Cognitive-Adaptive ADHD Screening System
====================================================

   Mission Sectors (6 Phases):
   👋 Alpha: First Contact (#FF9F43)
   🎯 Beta: Attention Systems (#54A0FF)
   ⚡ Gamma: Power Systems (#FECA57)
   ⏱️ Delta: Control Systems (#FF5F5F)
   💭 Epsilon: Emotional Systems (#A29BFE)
   ⭐ Omega: Mission Complete (#1DD1A1)

   🧠 Cognitive Adaptive Features:
   - Focus Meter (specific example detection)
   - Impulsivity Detection (Cool Down trigger)
   - DSM-5 Analysis Engine
   - Age-based diagnostic thresholds

   📡 API: http://localhost:${PORT}
   🎨 Frontend: http://localhost:3000
   📊 Mode: ${DEMO_MODE ? 'DEMO' : 'LIVE (OpenAI connected)'}
====================================================
  `);
});

module.exports = app;
