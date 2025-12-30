/**
 * Adaptive Response Generator
 * Implements the "Acknowledgment-Insight-Inquiry" loop for natural,
 * therapeutic conversation flow in ADHD screening
 * 
 * UPDATED: Synchronous phase transitions - phase check happens BEFORE response generation
 */

const PHASES = require('../config/phases');
const CognitiveAnalyzer = require('./CognitiveAnalyzer');
const DSM5ScoringEngine = require('./DSM5ScoringEngine');
const OpenAIService = require('./OpenAIService');
const ConversationStateMachine = require('./ConversationStateMachine');
const { Conversation } = require('../models');

/**
 * Minimum exchanges per phase to prevent premature transitions
 */
const PHASE_MIN_EXCHANGES = {
  0: 2,  // Introduction - build rapport
  1: 4,  // Focus & Attention - INCREASED to catch more inattention signals
  2: 3,  // Energy & Movement
  3: 3,  // Impulse Control
  4: 4,  // Emotions - INCREASED to ensure emotional indicators are captured
  5: 2   // Wrap-up
};

/**
 * Minimum indicators required per phase before transition is allowed
 */
const PHASE_MIN_INDICATORS = {
  0: 0,  // Introduction - no indicators needed
  1: 2,  // Focus & Attention - need 2 inattention indicators
  2: 2,  // Energy & Movement - need 2 hyperactivity indicators  
  3: 1,  // Impulse Control - need 1 impulsivity indicator
  4: 1,  // Emotions - need 1 emotional indicator
  5: 0   // Wrap-up - summary phase
};

/**
 * Empathetic acknowledgment templates based on content analysis
 */
const ACKNOWLEDGMENT_TEMPLATES = {
  // When user shares specific examples
  specificExample: [
    "That's a really helpful example - it paints a clear picture of what {name} experiences.",
    "Thank you for sharing that specific situation. It really helps me understand.",
    "I can picture that scenario clearly. That kind of detail is so valuable.",
    "That's exactly the kind of example that helps me understand what's happening."
  ],
  
  // When user expresses emotion or frustration
  emotional: [
    "I can hear how challenging this has been. Thank you for being so open with me.",
    "It sounds like this has been really difficult. Your feelings are completely valid.",
    "I appreciate you sharing that - it takes courage to talk about these struggles.",
    "That sounds exhausting. I want you to know that what you're describing is important."
  ],
  
  // When user describes high frequency behaviors
  highSeverity: [
    "When it happens that often, I can imagine how much it affects daily life.",
    "That's significant. When something happens that frequently, it really matters.",
    "I hear you - that's happening a lot, and that's important information.",
    "That frequency tells me this is a consistent pattern, not just occasional."
  ],
  
  // When detecting specific DSM-5 indicators
  inattention: [
    "It sounds like staying focused is a real challenge for {name}.",
    "I'm hearing that attention and concentration are areas of struggle.",
    "Managing focus seems to take a lot of energy for {name}.",
    "Those attention challenges sound like they show up in many areas."
  ],
  hyperactivity: [
    "It sounds like {name} has a lot of energy to manage.",
    "That constant need to move sounds like it's hard to control.",
    "I can tell the energy levels are really high and hard to contain.",
    "Staying still seems to be genuinely difficult, not just a choice."
  ],
  impulsivity: [
    "Acting before thinking sounds like it happens pretty automatically for {name}.",
    "That quick-to-react pattern is something I'm noting.",
    "Waiting and impulse control seem to be real challenges.",
    "It sounds like the brain moves faster than the brakes can work."
  ],
  emotional: [
    "The emotional intensity you're describing sounds overwhelming at times.",
    "Those big feelings seem to come on strong and fast.",
    "Managing emotions sounds like a real struggle for {name}.",
    "The emotional reactions you're describing are significant."
  ],
  
  // Default/neutral acknowledgments
  neutral: [
    "Thank you for sharing that.",
    "I appreciate you telling me about that.",
    "That's helpful to know.",
    "I'm getting a clearer picture."
  ],
  
  // When response is vague
  vague: [
    "I'd love to understand more about that.",
    "Can you help me picture what that looks like?",
    "Tell me more - what does that actually look like day-to-day?",
    "I want to make sure I understand - can you paint me a picture?"
  ]
};

/**
 * Insight templates that connect observations to DSM-5 understanding
 */
const INSIGHT_TEMPLATES = {
  inattention: [
    "What you're describing with focus challenges is something we see in attention-related patterns.",
    "These concentration difficulties often go together - trouble focusing and getting distracted easily.",
    "The attention patterns you're describing tell me a lot about how {name}'s brain processes tasks."
  ],
  hyperactivity: [
    "That high energy and need for movement is often the brain seeking stimulation.",
    "What you're describing with the constant motion is a common pattern we look for.",
    "The 'motor' you're describing - that driven energy - is really important to understand."
  ],
  impulsivity: [
    "Acting quickly without thinking is often about the brain's braking system needing more time.",
    "This kind of quick-to-act pattern tells me about how {name} processes decisions.",
    "The difficulty waiting and holding back tells me about impulse regulation."
  ],
  emotional: [
    "These intense emotional reactions often connect to how the brain regulates feelings.",
    "The emotional sensitivity you're describing is an important part of the picture.",
    "Big feelings that come on fast tell me about emotional regulation."
  ]
};

/**
 * Inquiry templates for deepening exploration (avoiding topic jumps)
 */
const DEEPENING_INQUIRY_TEMPLATES = {
  askForExample: [
    "Can you walk me through a recent specific time this happened?",
    "Think back to the last few days - can you give me a specific example?",
    "What did this look like most recently?"
  ],
  askForFrequency: [
    "How often would you say this happens in a typical week?",
    "Is this something that happens daily, or more occasionally?",
    "Would you say this is most days, some days, or rare?"
  ],
  askForContext: [
    "When does this tend to happen most - at home, school, or both?",
    "Are there certain situations where this is better or worse?",
    "What's usually going on when this happens?"
  ],
  askForImpact: [
    "How does this affect {name}'s day-to-day life?",
    "What challenges does this create at school or home?",
    "How do others - teachers, friends - usually respond to this?"
  ],
  askForDuration: [
    "Has this been going on for a while, or is it more recent?",
    "When did you first start noticing this pattern?",
    "Would you say this has always been there, or developed over time?"
  ]
};

class AdaptiveResponseGenerator {
  
  /**
   * Get a random item from an array
   */
  static pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generate empathetic acknowledgment based on analysis
   */
  static generateAcknowledgment(cognitiveAnalysis, name) {
    let templates;
    
    // Priority order for acknowledgment selection
    if (cognitiveAnalysis.isEmotional) {
      templates = ACKNOWLEDGMENT_TEMPLATES.emotional;
    } else if (cognitiveAnalysis.hasSpecificExample) {
      templates = ACKNOWLEDGMENT_TEMPLATES.specificExample;
    } else if (cognitiveAnalysis.severity?.level === 'high') {
      templates = ACKNOWLEDGMENT_TEMPLATES.highSeverity;
    } else if (cognitiveAnalysis.indicators?.length > 0) {
      const domain = cognitiveAnalysis.indicators[0].domain;
      templates = ACKNOWLEDGMENT_TEMPLATES[domain] || ACKNOWLEDGMENT_TEMPLATES.neutral;
    } else if (cognitiveAnalysis.isVague) {
      templates = ACKNOWLEDGMENT_TEMPLATES.vague;
    } else {
      templates = ACKNOWLEDGMENT_TEMPLATES.neutral;
    }
    
    return this.pickRandom(templates).replace(/{name}/g, name);
  }

  /**
   * Generate insight that connects to DSM-5 understanding
   */
  static generateInsight(indicators, name) {
    if (!indicators || indicators.length === 0) return '';
    
    const domain = indicators[0].domain;
    const templates = INSIGHT_TEMPLATES[domain];
    
    if (!templates) return '';
    
    return ' ' + this.pickRandom(templates).replace(/{name}/g, name);
  }

  /**
   * Generate deepening inquiry (stays on same topic)
   */
  static generateDeepeningInquiry(cognitiveAnalysis, conversation, name) {
    const { indicators, hasSpecificExample, isVague, severity } = cognitiveAnalysis;
    
    // If vague, always ask for specific example
    if (isVague && !hasSpecificExample) {
      return ' ' + this.pickRandom(DEEPENING_INQUIRY_TEMPLATES.askForExample).replace(/{name}/g, name);
    }
    
    // If we have an indicator but no severity info, ask about frequency
    if (indicators?.length > 0 && severity?.level !== 'high') {
      return ' ' + this.pickRandom(DEEPENING_INQUIRY_TEMPLATES.askForFrequency).replace(/{name}/g, name);
    }
    
    // If high severity, ask about impact
    if (severity?.level === 'high') {
      return ' ' + this.pickRandom(DEEPENING_INQUIRY_TEMPLATES.askForImpact).replace(/{name}/g, name);
    }
    
    // If we have a specific example, ask about context
    if (hasSpecificExample) {
      return ' ' + this.pickRandom(DEEPENING_INQUIRY_TEMPLATES.askForContext).replace(/{name}/g, name);
    }
    
    // Default: ask for example
    return ' ' + this.pickRandom(DEEPENING_INQUIRY_TEMPLATES.askForExample).replace(/{name}/g, name);
  }

  /**
   * Generate phase transition question
   */
  static generatePhaseQuestion(phaseId, questionIndex, name) {
    const phase = PHASES[Math.min(phaseId, PHASES.length - 1)];
    const idx = Math.min(questionIndex, phase.questions.length - 1);
    const q = phase.questions[idx];
    return {
      text: q.text.replace(/{name}/g, name),
      hint: q.hint
    };
  }

  /**
   * Handle clarification request
   */
  static generateClarificationResponse(userMessage, lastAIMessage, name) {
    // Try to find the term that confused them
    const term = ConversationStateMachine.detectTermToExplain(lastAIMessage);
    
    if (term) {
      const explanation = ConversationStateMachine.getTermExplanation(term, name);
      return {
        text: explanation + "\n\nDoes that make more sense? Let me ask again: " + this.extractLastQuestion(lastAIMessage),
        isClarification: true
      };
    }
    
    // Generic clarification
    return {
      text: `I want to make sure I'm being clear. Let me rephrase that: I'm trying to understand ${name}'s typical behavior patterns. Can you describe what a regular day looks like for ${name}?`,
      isClarification: true
    };
  }

  /**
   * Extract the last question from AI message
   */
  static extractLastQuestion(message) {
    const sentences = message.split(/[.!?]+/);
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (sentence.length > 10) { // Reasonable question length
        return sentence + '?';
      }
    }
    return message;
  }

  /**
   * Build system prompt for OpenAI with conversation context
   */
  static buildSystemPrompt(conversation, state) {
    const { name, age, userType } = conversation;
    const phase = PHASES[state.currentPhase];
    const isParent = userType === 'parent';
    
    return `You are NeuroFocus AI, an empathetic clinical assistant conducting an ADHD screening conversation. You follow the "Acknowledgment-Insight-Inquiry" therapeutic approach.

CURRENT PHASE: ${phase.name} (${phase.icon} ${phase.sectorName})
PHASE GOAL: ${phase.description}
USER: ${isParent ? `Parent speaking about their child ${name}, age ${age}` : `Student ${name}, age ${age}, speaking about themselves`}
PROGRESS: Exchange ${state.phaseExchanges + 1} in this phase, ${state.phaseIndicatorCount} indicators collected

YOUR RESPONSE MUST FOLLOW THIS EXACT STRUCTURE:
1. ACKNOWLEDGE: Start with empathy. Validate what they shared. Show you heard them. (1-2 sentences)
2. INSIGHT (optional): If you detected a DSM-5 relevant behavior, briefly note its significance without using clinical jargon. (1 sentence max)
3. INQUIRY: Ask ONE specific follow-up question that DEEPENS the current topic. Do NOT change subjects. (1 question)

CRITICAL RULES:
- DO NOT use the word "Got it" or similar dismissive acknowledgments
- DO NOT ask multiple questions at once
- DO NOT jump to a new topic until explicitly told to transition
- DO NOT end the conversation or suggest wrapping up - this is a diagnostic screening
- STAY on the current topic and dig deeper before moving on
- Keep total response under 80 words
- Be warm and conversational, not clinical or robotic

DSM-5 DOMAINS FOR THIS PHASE: ${phase.dsmDomains.length > 0 ? phase.dsmDomains.join(', ') : 'rapport building'}

EXAMPLE GOOD RESPONSE:
"That's really helpful to hear about the homework struggles - I can imagine how frustrating that must be for everyone. When you say it takes hours to finish, I'm getting a sense of how attention is affecting daily tasks. Can you walk me through what a typical homework session actually looks like?"

EXAMPLE BAD RESPONSE (DO NOT DO THIS):
"Got it. Thanks for sharing. Let's move on to talk about energy levels now."`;
  }

  /**
   * Main response generation - implements the full Acknowledgment-Insight-Inquiry loop
   * 
   * CRITICAL FIX: Synchronous phase transition
   * 1. Analyze message for indicators FIRST
   * 2. Check phase transition criteria BEFORE generating response
   * 3. Generate response with UPDATED phase context
   */
  static async generate(userMessage, conversation, responseTime) {
    const sessionId = conversation.sessionId;
    const name = conversation.name || 'your child';
    const age = conversation.age || 10;
    const userType = conversation.userType || 'parent';
    
    // ============================================
    // STEP 1: Analyze message for DSM-5 indicators FIRST
    // ============================================
    const cognitiveAnalysis = CognitiveAnalyzer.analyzeMessage(userMessage, responseTime, conversation);
    
    // Log analysis for debugging
    console.log(`[AdaptiveResponseGenerator] Phase ${conversation.currentPhase}, Indicators found:`, 
      cognitiveAnalysis.indicators.map(i => `${i.domain}(${i.confidence}%)`).join(', ') || 'none');
    
    // Check for clarification request
    if (ConversationStateMachine.needsClarification(userMessage)) {
      const lastAIMessage = conversation.messages?.slice(-1).find(m => m.sender === 'ai')?.text || '';
      const clarification = this.generateClarificationResponse(userMessage, lastAIMessage, name);
      
      // Don't advance anything, just clarify
      return {
        text: clarification.text,
        hint: "e.g., Share what you understand or ask another question",
        phase: this.getCurrentPhaseInfo(conversation.currentPhase),
        cognitive: this.buildCognitiveResponse(cognitiveAnalysis),
        patterns: [],
        sectorUnlocked: false,
        dsmScoring: conversation.dsmScoring || {},
        isClarification: true,
        suggestedHint: "e.g., 'Yes, that makes sense' or 'Can you explain more?'",
        canEnd: false,
        exchangeCount: conversation.totalExchanges || 0,
        phaseProgress: {
          current: conversation.phaseExchanges || 0,
          required: PHASE_MIN_EXCHANGES[conversation.currentPhase] || 2,
          indicatorsCollected: 0
        }
      };
    }
    
    // Save indicators to database (only high-confidence ones)
    const highConfidenceIndicators = cognitiveAnalysis.indicators.filter(ind => ind.confidence >= 40);
    for (const indicator of highConfidenceIndicators) {
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
        },
        $inc: { phaseExchanges: 1, totalExchanges: 1 }
      }
    );
    
    // ============================================
    // STEP 2: Check phase transition BEFORE response generation
    // ============================================
    const updatedConv = await Conversation.findOne({ sessionId });
    const currentPhase = updatedConv.currentPhase || 0;
    const phaseExchanges = updatedConv.phaseExchanges || 0;
    
    // Count indicators for current phase's target domain
    const targetDomains = PHASES[currentPhase]?.dsmDomains || [];
    const phaseIndicators = (updatedConv.indicators || []).filter(ind => 
      ind.phaseId === currentPhase || 
      targetDomains.includes(ind.domain)
    );
    const phaseIndicatorCount = phaseIndicators.length;
    
    // Phase transition check - SYNCHRONOUS (before response)
    const minExchanges = PHASE_MIN_EXCHANGES[currentPhase] || 2;
    const minIndicators = PHASE_MIN_INDICATORS[currentPhase] || 0;
    const canAdvance = 
      phaseExchanges >= minExchanges && 
      phaseIndicatorCount >= minIndicators &&
      currentPhase < PHASES.length - 1;
    
    console.log(`[AdaptiveResponseGenerator] Phase transition check: ` +
      `exchanges=${phaseExchanges}/${minExchanges}, ` +
      `indicators=${phaseIndicatorCount}/${minIndicators}, ` +
      `canAdvance=${canAdvance}`);
    
    // Initialize state variables
    let newPhaseId = currentPhase;
    let newPhaseExchanges = phaseExchanges;
    let newQuestionIndex = updatedConv.questionIndex || 0;
    let sectorUnlocked = false;
    let responseText = '';
    let currentHint = '';
    
    // ============================================
    // STEP 3: Handle phase transition if criteria met
    // ============================================
    if (canAdvance) {
      // ADVANCE to next phase BEFORE generating response
      newPhaseId = currentPhase + 1;
      newPhaseExchanges = 0;
      newQuestionIndex = 0;
      sectorUnlocked = true;
      
      // Update database with new phase FIRST
      await Conversation.updateOne(
        { sessionId },
        { 
          $set: { 
            currentPhase: newPhaseId,
            phaseExchanges: 0,
            questionIndex: 0
          },
          $addToSet: { sectorsUnlocked: newPhaseId }
        }
      );
      
      console.log(`[AdaptiveResponseGenerator] PHASE TRANSITION: ${currentPhase} -> ${newPhaseId}`);
      
      // Build transition response with NEW phase context
      const acknowledgment = this.generateAcknowledgment(cognitiveAnalysis, name);
      const transition = ConversationStateMachine.getPhaseTransition(newPhaseId, name);
      const questionData = this.generatePhaseQuestion(newPhaseId, 0, name);
      
      responseText = `${acknowledgment}\n\n${transition}\n\n${questionData.text}`;
      currentHint = questionData.hint;
      newQuestionIndex = 1;
      
    } else {
      // ============================================
      // STEP 4: Continue in current phase
      // ============================================
      
      // Update DSM-5 scoring
      const dsmScoring = DSM5ScoringEngine.updateScoring(updatedConv);
      await Conversation.updateOne({ sessionId }, { $set: { dsmScoring } });
      
      // Check if final phase is complete
      const isInFinalPhase = currentPhase === PHASES.length - 1;
      const canEnd = isInFinalPhase && phaseExchanges >= PHASE_MIN_EXCHANGES[currentPhase];
      
      if (canEnd) {
        // Final phase complete
        const acknowledgment = this.generateAcknowledgment(cognitiveAnalysis, name);
        responseText = `${acknowledgment}\n\n🎯 Screening Complete!\n\nThank you for this thorough conversation - I have a comprehensive picture now. Would you like to see the detailed screening report, or is there anything else you'd like to add about ${name}?`;
        currentHint = "e.g., 'Show me the report' or 'I want to add something about...'";
        
      } else {
        // Continue normal flow - use Acknowledgment-Insight-Inquiry loop
        
        // Build system prompt with CURRENT phase context (already synchronized)
        const state = {
          currentPhase: currentPhase,
          phaseExchanges: phaseExchanges,
          phaseIndicatorCount: phaseIndicatorCount
        };
        
        // Try OpenAI first for natural conversation
        if (OpenAIService.isConfigured()) {
          const systemPrompt = this.buildSystemPrompt(updatedConv, state);
          const openAIResponse = await OpenAIService.generateResponse(
            systemPrompt,
            updatedConv.messages,
            userMessage
          );
          
          if (openAIResponse) {
            responseText = openAIResponse;
            currentHint = this.generateSynchronizedHint(openAIResponse, cognitiveAnalysis, name);
          }
        }
        
        // Fallback to template-based response
        if (!responseText) {
          const acknowledgment = this.generateAcknowledgment(cognitiveAnalysis, name);
          const insight = this.generateInsight(cognitiveAnalysis.indicators, name);
          const inquiry = this.generateDeepeningInquiry(cognitiveAnalysis, updatedConv, name);
          
          responseText = acknowledgment + insight + inquiry;
          currentHint = ConversationStateMachine.getSynchronizedHint(
            inquiry, 
            cognitiveAnalysis.indicators?.[0]?.domain || 'general',
            name
          );
        }
        
        // If response is too short or vague, add a phase question
        if (responseText.length < 50 || !responseText.includes('?')) {
          newQuestionIndex = (updatedConv.questionIndex || 0) + 1;
          const questionData = this.generatePhaseQuestion(currentPhase, newQuestionIndex, name);
          responseText = responseText.trim() + ' ' + questionData.text;
          currentHint = questionData.hint;
        }
      }
    }
    
    // ============================================
    // STEP 5: Build and return response
    // ============================================
    
    // Get latest DSM scoring
    const finalConv = await Conversation.findOne({ sessionId });
    const dsmScoring = finalConv.dsmScoring || {};
    
    // Build detected patterns for frontend (only high-confidence)
    const detectedPatterns = highConfidenceIndicators.map(ind => ({
      type: ind.domain,
      message: `${ind.domain.charAt(0).toUpperCase() + ind.domain.slice(1)} indicator detected`,
      severity: ind.severity,
      confidence: ind.confidence
    }));
    
    const phase = PHASES[Math.min(newPhaseId, PHASES.length - 1)];
    
    // CRITICAL: canEnd is FALSE unless in final phase with enough exchanges
    const isInFinalPhase = newPhaseId === PHASES.length - 1;
    const canEnd = isInFinalPhase && newPhaseExchanges >= PHASE_MIN_EXCHANGES[newPhaseId];
    
    return {
      text: responseText.trim(),
      hint: currentHint,
      suggestedHint: currentHint,
      phase: {
        id: newPhaseId,
        name: phase.name,
        sectorName: phase.sectorName,
        missionTitle: phase.missionTitle,
        icon: phase.icon,
        color: phase.color,
        total: PHASES.length
      },
      cognitive: {
        focusScore: cognitiveAnalysis.focusScore,
        focusMeterIntensity: Math.round(cognitiveAnalysis.focusScore / 25) + 1,
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
        totalScore: dsmScoring.totalScore,
        domainScores: {
          inattention: dsmScoring.inattentionScore || 0,
          hyperactivity: dsmScoring.hiScore || 0
        }
      },
      canEnd,
      exchangeCount: (finalConv.totalExchanges || 0),
      phaseProgress: {
        current: newPhaseExchanges,
        required: PHASE_MIN_EXCHANGES[newPhaseId] || 2,
        indicatorsCollected: phaseIndicatorCount
      }
    };
  }

  /**
   * Generate hint synchronized with the AI's question
   */
  static generateSynchronizedHint(aiResponse, cognitiveAnalysis, name) {
    // Try to detect what kind of question was asked
    const responseLower = aiResponse.toLowerCase();
    
    if (responseLower.includes('example') || responseLower.includes('specific')) {
      return "e.g., 'Last week during homework...' or 'Yesterday at school...'";
    }
    if (responseLower.includes('how often') || responseLower.includes('frequency')) {
      return "e.g., 'Multiple times a day' or 'A few times a week'";
    }
    if (responseLower.includes('when does') || responseLower.includes('what situation')) {
      return "e.g., 'During quiet time' or 'At school mostly' or 'When tired'";
    }
    if (responseLower.includes('what happens') || responseLower.includes('what does')) {
      return "e.g., Describe what you see or what " + name + " does";
    }
    if (responseLower.includes('how long') || responseLower.includes('duration')) {
      return "e.g., 'About 30 minutes' or 'Takes forever'";
    }
    if (responseLower.includes('help') || responseLower.includes('what works')) {
      return "e.g., 'Taking breaks helps' or 'Nothing seems to work'";
    }
    
    // Default based on domain
    const domain = cognitiveAnalysis.indicators?.[0]?.domain;
    return ConversationStateMachine.getSynchronizedHint('', domain || 'general', name);
  }

  /**
   * Get current phase info helper
   */
  static getCurrentPhaseInfo(phaseId) {
    const phase = PHASES[Math.min(phaseId, PHASES.length - 1)];
    return {
      id: phaseId,
      name: phase.name,
      sectorName: phase.sectorName,
      missionTitle: phase.missionTitle,
      icon: phase.icon,
      color: phase.color,
      total: PHASES.length
    };
  }

  /**
   * Build cognitive response object
   */
  static buildCognitiveResponse(cognitiveAnalysis) {
    return {
      focusScore: cognitiveAnalysis.focusScore,
      impulsivityScore: cognitiveAnalysis.impulsivityScore,
      coolDownTriggered: cognitiveAnalysis.coolDownTriggered,
      coolDownDuration: cognitiveAnalysis.coolDownDuration,
      engagementLevel: cognitiveAnalysis.engagementLevel,
      hasSpecificExample: cognitiveAnalysis.hasSpecificExample
    };
  }
}

module.exports = AdaptiveResponseGenerator;
