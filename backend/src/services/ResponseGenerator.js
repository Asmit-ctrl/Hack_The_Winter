/**
 * Response Generator Service
 * Generates AI responses based on cognitive analysis and phase context
 */

const PHASES = require('../config/phases');
const CognitiveAnalyzer = require('./CognitiveAnalyzer');
const DSM5ScoringEngine = require('./DSM5ScoringEngine');
const OpenAIService = require('./OpenAIService');
const { Conversation } = require('../models');

class ResponseGenerator {
  /**
   * Get phase-based system prompt for AI
   */
  static getSystemPrompt(phaseId, userType, name, age) {
    const phase = PHASES[phaseId] || PHASES[0];
    const isParent = userType === 'parent';
    
    return `You are NeuroFocus AI, a warm and empathetic clinical assistant conducting an ADHD screening conversation. You are currently in ${phase.sectorName}: ${phase.missionTitle}.

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
  }

  /**
   * Get phase question
   */
  static getPhaseQuestion(phaseId, questionIndex, name) {
    const phase = PHASES[Math.min(phaseId, PHASES.length - 1)];
    const idx = Math.min(questionIndex, phase.questions.length - 1);
    const q = phase.questions[idx];
    return {
      text: q.text.replace(/{name}/g, name),
      hint: q.hint
    };
  }

  /**
   * Check if phase should advance
   */
  static shouldAdvancePhase(phaseExchanges, phaseId, indicatorCount) {
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

  /**
   * Generate acknowledgment based on analysis
   */
  static generateAcknowledgment(cognitiveAnalysis) {
    if (cognitiveAnalysis.isEmotional) {
      return "I hear you - that sounds really challenging. Thank you for being so open. ";
    } else if (cognitiveAnalysis.hasSpecificExample) {
      return "That's a really helpful specific example - it helps me understand the situation better. ";
    } else if (cognitiveAnalysis.isVague) {
      return "I'd love to understand more about that. ";
    } else if (cognitiveAnalysis.indicators.length > 0) {
      const domain = cognitiveAnalysis.indicators[0].domain;
      const domainAcks = {
        inattention: "I see - so focus and attention are areas of challenge. ",
        hyperactivity: "It sounds like there's a lot of energy to manage. ",
        impulsivity: "Patience and self-control seem challenging. ",
        emotional: "The emotional side can be really intense. ",
        executive: "Organization and planning are tough areas. "
      };
      return domainAcks[domain] || "That's helpful to know. ";
    }
    return "Thank you for sharing that. ";
  }

  /**
   * Main response generation function
   */
  static async generate(userMessage, conversation, responseTime) {
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
    
    // Build response
    let acknowledgment = this.generateAcknowledgment(cognitiveAnalysis);
    let insight = "";
    let nextQuestion = "";
    let currentHint = "";
    
    // Add severity insight if detected
    if (cognitiveAnalysis.severity.level === 'high') {
      insight = "When you say it happens that frequently, that's definitely worth noting. ";
    }
    
    // Check phase advancement
    const shouldAdvance = this.shouldAdvancePhase(phaseExchanges, phaseId, cognitiveAnalysis.indicators.length);
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
      const questionData = this.getPhaseQuestion(newPhaseId, 0, name);
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
        const questionData = this.getPhaseQuestion(phaseId, newQuestionIndex, name);
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
    
    // Try OpenAI first, fall back to template
    let aiResponse = acknowledgment + insight + nextQuestion;
    
    if (OpenAIService.isConfigured()) {
      const systemPrompt = this.getSystemPrompt(newPhaseId, userType, name, age);
      const openAIResponse = await OpenAIService.generateResponse(
        systemPrompt,
        conversation.messages,
        userMessage
      );
      if (openAIResponse) {
        aiResponse = openAIResponse;
      }
    }
    
    // Detect patterns for frontend toast notifications
    const detectedPatterns = cognitiveAnalysis.indicators.map(ind => ({
      type: ind.domain,
      message: `${ind.domain.charAt(0).toUpperCase() + ind.domain.slice(1)} indicator: "${ind.pattern}" detected`
    }));
    
    const phase = PHASES[Math.min(newPhaseId, PHASES.length - 1)];
    
    return {
      text: aiResponse.trim(),
      hint: currentHint,
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
}

module.exports = ResponseGenerator;
