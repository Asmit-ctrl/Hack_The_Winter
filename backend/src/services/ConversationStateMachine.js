/**
 * Conversation State Machine
 * Manages adaptive conversation flow with phase tracking, indicator thresholds,
 * and the "Acknowledgment-Insight-Inquiry" loop for natural conversation
 */

const PHASES = require('../config/phases');

/**
 * Phase transition requirements
 * More strict requirements to ensure thorough exploration
 */
const PHASE_REQUIREMENTS = {
  0: { minExchanges: 2, minIndicators: 0, name: 'Introduction' },      // Intro doesn't need indicators
  1: { minExchanges: 3, minIndicators: 2, name: 'Focus & Attention' }, // Need 2 inattention indicators
  2: { minExchanges: 3, minIndicators: 2, name: 'Energy & Movement' }, // Need 2 hyperactivity indicators
  3: { minExchanges: 2, minIndicators: 2, name: 'Impulse Control' },   // Need 2 impulsivity indicators
  4: { minExchanges: 2, minIndicators: 1, name: 'Emotions' },          // 1 emotional indicator
  5: { minExchanges: 2, minIndicators: 0, name: 'Strengths & Wrap-up' } // Wrap-up doesn't need indicators
};

/**
 * Clarification phrases that trigger explanation mode
 */
const CLARIFICATION_TRIGGERS = [
  "don't understand",
  "dont understand",
  "not able to understand",
  "what do you mean",
  "what does that mean",
  "can you explain",
  "i'm confused",
  "im confused",
  "unclear",
  "huh",
  "what?"
];

/**
 * Domain-specific deepening questions for the Inquiry part
 */
const DEEPENING_QUESTIONS = {
  inattention: {
    'loses things': [
      "What kinds of things does {name} lose most often?",
      "Where do these items usually turn up?",
      "How often would you say this happens in a typical week?"
    ],
    'distracted': [
      "What kinds of things tend to pull {name}'s attention away?",
      "Does this happen more in certain settings, like school vs. home?",
      "How quickly does {name} get back on track after getting distracted?"
    ],
    'forgets': [
      "Can you give me a recent example of something {name} forgot?",
      "Is it more about forgetting tasks or forgetting instructions?",
      "Does writing things down help {name} remember?"
    ],
    'homework': [
      "How long does homework typically take compared to what it should?",
      "What does {name} do during homework time when they get off track?",
      "Is there a particular subject that's harder to focus on?"
    ],
    'careless mistakes': [
      "What kinds of mistakes does {name} typically make?",
      "Does {name} notice the mistakes when you point them out?",
      "Does this happen more in certain subjects or activities?"
    ],
    'instructions': [
      "How many steps can {name} follow before getting lost?",
      "Does {name} seem to hear the instructions but then forget them?",
      "Does it help to write down the steps for {name}?"
    ],
    'default': [
      "Can you walk me through a specific recent example?",
      "How does this affect {name}'s daily life?",
      "Has this been happening for a long time or is it more recent?"
    ]
  },
  hyperactivity: {
    'fidgets': [
      "What does the fidgeting look like - is it feet tapping, hands moving?",
      "When does the fidgeting happen most - during quiet activities?",
      "Does {name} seem aware that they're fidgeting?"
    ],
    'cant sit still': [
      "How long can {name} typically stay seated before needing to move?",
      "What happens if {name} is forced to stay seated?",
      "Does {name} do better with standing activities?"
    ],
    'always running': [
      "Does {name} run or climb in situations where it's not appropriate?",
      "How does {name} handle quiet environments like libraries or church?",
      "Is there ever a time when {name} can be calm and still?"
    ],
    'talks too much': [
      "Does {name} have trouble knowing when to stop talking?",
      "Does {name} talk even during quiet activities or tests?",
      "Does {name} seem to talk to themselves or need to verbalize thoughts?"
    ],
    'restless': [
      "How does {name} describe this restless feeling?",
      "Does physical activity help burn off some of this energy?",
      "Is the restlessness worse at certain times of day?"
    ],
    'default': [
      "Can you describe what this looks like in a typical day?",
      "How do teachers or other adults usually respond to this?",
      "Is this something that's always been there or developed over time?"
    ]
  },
  impulsivity: {
    'blurts out': [
      "Does {name} blurt out in class or more in conversations?",
      "Does {name} seem to know they shouldn't but can't help it?",
      "How do teachers typically handle this?"
    ],
    'cant wait': [
      "What happens when {name} has to wait in line or for a turn?",
      "Does {name} get upset or just find it very hard?",
      "Are there any situations where waiting is easier?"
    ],
    'interrupts': [
      "Does {name} interrupt adults, other kids, or both?",
      "Does {name} realize they're interrupting after they do it?",
      "Does this happen even in important conversations?"
    ],
    'acts without thinking': [
      "Can you give me an example of {name} acting without thinking first?",
      "Has this ever led to {name} getting hurt or in trouble?",
      "Does {name} feel bad about it afterwards?"
    ],
    'default': [
      "How often would you say this happens?",
      "What situations make this more likely to happen?",
      "Has {name} gotten better at this with age or stayed the same?"
    ]
  },
  emotional: {
    'meltdowns': [
      "What typically triggers a meltdown?",
      "How long do the meltdowns usually last?",
      "What helps {name} calm down during or after?"
    ],
    'frustrated easily': [
      "What kinds of things frustrate {name} the most?",
      "How does {name} show their frustration?",
      "Can {name} recover quickly from frustration?"
    ],
    'mood swings': [
      "How quickly do {name}'s moods change?",
      "Can you usually tell what triggered the mood change?",
      "Does {name} seem aware of these mood shifts?"
    ],
    'sensitive': [
      "What kinds of things is {name} most sensitive to?",
      "How does {name} react to criticism or correction?",
      "Does {name} seem to feel things more intensely than other kids?"
    ],
    'default': [
      "How often do you see these emotional reactions?",
      "How does this affect {name}'s relationships or school?",
      "What strategies have you tried that help, even a little?"
    ]
  }
};

/**
 * Term explanations for clarification mode
 */
const TERM_EXPLANATIONS = {
  'driven by a motor': "When I say 'driven by a motor,' I mean feeling like there's endless energy inside that makes it really hard to be still or quiet. Like {name}'s body or mind is always running, even when they want to relax.",
  'always on the go': "By 'always on the go,' I mean that {name} might seem to have unlimited energy - constantly moving, talking, or doing something, even when sitting still would be expected.",
  'fidget': "Fidgeting means small, often unconscious movements like tapping feet, bouncing legs, playing with objects, or squirming in a seat - even when {name} is trying to stay still.",
  'impulsive': "Being impulsive means acting quickly without stopping to think about consequences - like blurting out answers, grabbing things, or making quick decisions that {name} might regret later.",
  'inattentive': "Inattention means difficulty focusing on things, especially tasks that aren't very exciting. It might look like {name} zoning out, missing details, or having trouble following through.",
  'hyperactive': "Hyperactivity is having more physical energy and movement than what's typical - running, climbing, talking, or moving around more than other kids the same age.",
  'regulate': "Emotional regulation is the ability to manage feelings - to calm down when upset, not get too hyped up when excited, and respond proportionally to situations."
};

class ConversationStateMachine {
  /**
   * Check if a message contains clarification request
   */
  static needsClarification(message) {
    const lowerMessage = message.toLowerCase();
    return CLARIFICATION_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
  }

  /**
   * Get explanation for a clinical term
   */
  static getTermExplanation(term, name) {
    const explanation = TERM_EXPLANATIONS[term.toLowerCase()];
    if (explanation) {
      return explanation.replace(/{name}/g, name);
    }
    return null;
  }

  /**
   * Detect which term needs explanation from AI's last message
   */
  static detectTermToExplain(lastAIMessage) {
    const terms = Object.keys(TERM_EXPLANATIONS);
    for (const term of terms) {
      if (lastAIMessage.toLowerCase().includes(term.toLowerCase())) {
        return term;
      }
    }
    return null;
  }

  /**
   * Check if phase can advance based on requirements
   */
  static canAdvancePhase(conversation) {
    const { currentPhase, phaseExchanges, indicators } = conversation;
    const requirements = PHASE_REQUIREMENTS[currentPhase];
    
    if (!requirements || currentPhase >= PHASES.length - 1) {
      return false;
    }

    // Count indicators for current phase's domain
    const phase = PHASES[currentPhase];
    const relevantDomains = phase.dsmDomains || [];
    const phaseIndicators = (indicators || []).filter(ind => 
      ind.phaseId === currentPhase || relevantDomains.includes(ind.domain)
    );

    const hasEnoughExchanges = phaseExchanges >= requirements.minExchanges;
    const hasEnoughIndicators = phaseIndicators.length >= requirements.minIndicators;

    // Also check maxExchanges as fallback
    const maxExchangesReached = phaseExchanges >= (PHASES[currentPhase].maxExchanges || 5);

    return (hasEnoughExchanges && hasEnoughIndicators) || maxExchangesReached;
  }

  /**
   * Get transition message when advancing to new phase
   */
  static getPhaseTransition(newPhaseId, name) {
    const phase = PHASES[newPhaseId];
    const transitions = {
      1: `I've gotten a good sense of the overall picture. Now let's look more closely at attention and focus. 🎯`,
      2: `Thank you for those insights about focus. Now I'd like to understand {name}'s energy levels and movement patterns. ⚡`,
      3: `That helps a lot with understanding the energy side. Let's talk about impulse control and patience now. ⏱️`,
      4: `Great progress - we're almost there. Now I want to understand how {name} handles emotions. 💭`,
      5: `We're in the home stretch. Before we wrap up, let's talk about {name}'s strengths and what they're great at. ⭐`
    };
    
    return (transitions[newPhaseId] || '').replace(/{name}/g, name);
  }

  /**
   * Get deepening question based on detected domain and pattern
   */
  static getDeepeningQuestion(domain, detectedPattern, name, usedQuestions = []) {
    const domainQuestions = DEEPENING_QUESTIONS[domain];
    if (!domainQuestions) return null;

    // Find the most relevant question set
    let questionSet = domainQuestions['default'];
    for (const [key, questions] of Object.entries(domainQuestions)) {
      if (key !== 'default' && detectedPattern.toLowerCase().includes(key)) {
        questionSet = questions;
        break;
      }
    }

    // Pick a question that hasn't been used
    const available = questionSet.filter(q => !usedQuestions.includes(q));
    if (available.length === 0) return null;

    const question = available[Math.floor(Math.random() * available.length)];
    return question.replace(/{name}/g, name);
  }

  /**
   * Determine conversation state and next action
   */
  static analyzeState(conversation) {
    const { currentPhase, phaseExchanges, totalExchanges, indicators, messages } = conversation;
    const phase = PHASES[currentPhase];
    const requirements = PHASE_REQUIREMENTS[currentPhase];

    // Calculate indicators per domain for current phase
    const phaseIndicators = (indicators || []).filter(ind => ind.phaseId === currentPhase);
    const domainCounts = {};
    phaseIndicators.forEach(ind => {
      domainCounts[ind.domain] = (domainCounts[ind.domain] || 0) + 1;
    });

    // Determine if we're exploring deeply enough
    const hasDeepEngagement = phaseIndicators.length >= requirements.minIndicators;
    const needsMoreDepth = phaseExchanges >= 2 && !hasDeepEngagement;

    // Check if we can end the conversation
    const isInFinalPhase = currentPhase === PHASES.length - 1;
    const canEnd = isInFinalPhase && phaseExchanges >= requirements.minExchanges;

    // Calculate focus meter intensity based on recent message quality
    const recentMessages = (messages || []).slice(-3).filter(m => m.sender === 'user');
    const avgWordCount = recentMessages.length > 0 
      ? recentMessages.reduce((sum, m) => sum + (m.wordCount || 5), 0) / recentMessages.length 
      : 5;
    const focusMeterIntensity = Math.min(100, Math.max(0, avgWordCount * 5));

    return {
      currentPhase,
      phaseName: phase.name,
      phaseExchanges,
      totalExchanges,
      phaseIndicatorCount: phaseIndicators.length,
      domainCounts,
      canAdvance: this.canAdvancePhase(conversation),
      hasDeepEngagement,
      needsMoreDepth,
      canEnd,
      focusMeterIntensity,
      phase: {
        id: currentPhase,
        name: phase.name,
        sectorName: phase.sectorName,
        missionTitle: phase.missionTitle,
        icon: phase.icon,
        color: phase.color,
        total: PHASES.length
      }
    };
  }

  /**
   * Get contextual hint that matches the inquiry
   */
  static getSynchronizedHint(inquiry, domain, name) {
    // Generate hint based on the specific question being asked
    const hintTemplates = {
      'how often': "e.g., 'Multiple times a day' or 'A few times a week' or 'Only sometimes'",
      'when does': "e.g., 'During homework time' or 'At school mostly' or 'When tired'",
      'what kinds': "e.g., 'Math is hardest' or 'Any boring task' or 'Mostly at school'",
      'how long': "e.g., 'Takes 2 hours for 30 min of work' or 'About twice as long as it should'",
      'what happens': "e.g., 'Gets really frustrated' or 'Starts doing something else' or 'Needs lots of reminders'",
      'can you give': "e.g., 'Last week when...' or 'Yesterday at school...' or 'This morning...'",
      'does this happen': "e.g., 'Yes, all the time' or 'Mostly at school' or 'More at home'",
      'default': "e.g., Share a specific example or describe what you've observed"
    };

    const inquiryLower = inquiry.toLowerCase();
    for (const [trigger, hint] of Object.entries(hintTemplates)) {
      if (trigger !== 'default' && inquiryLower.includes(trigger)) {
        return hint;
      }
    }

    // Domain-specific default hints
    const domainHints = {
      inattention: "e.g., 'Gets distracted by any noise' or 'Forgets what I just said'",
      hyperactivity: "e.g., 'Can never sit still' or 'Always needs to move'",
      impulsivity: "e.g., 'Acts before thinking' or 'Can't wait for their turn'",
      emotional: "e.g., 'Small things cause big reactions' or 'Mood changes quickly'"
    };

    return domainHints[domain] || hintTemplates['default'];
  }
}

module.exports = ConversationStateMachine;
