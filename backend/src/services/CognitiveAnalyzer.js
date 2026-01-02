/**
 * Cognitive Analyzer Service
 * Analyzes user messages for DSM-5 indicators and cognitive patterns
 * 
 * UPDATED v2: Enhanced negation detection with:
 * - Expanded context window (80 chars)
 * - Positive adverb detection ("really well", "very good")
 * - Sentence-level positive context check
 * - Word-boundary aware matching
 */

const {
  DSM5_MARKERS,
  DSM5_INDICATOR_PATTERNS,
  SPECIFIC_EXAMPLE_INDICATORS,
  IMPULSIVITY_INDICATORS,
  EMOTIONAL_WORDS,
  VAGUE_RESPONSES,
  NEGATION_PATTERNS,
  POSITIVE_CONTEXT_PATTERNS,
  CONFIDENCE_THRESHOLDS
} = require('../config/dsm5Patterns');

/**
 * Additional positive phrases that indicate ABSENCE of symptoms
 * These phrases near a keyword should NEGATE the detection
 */
const POSITIVE_PHRASES = [
  // Ability indicators
  'really well', 'very well', 'quite well', 'pretty well',
  'does well', 'doing well', 'do well', 'did well',
  'good at', 'great at', 'excellent at',
  'able to', 'can', 'manages to', 'succeeds',
  // Positive descriptors before the keyword
  'good', 'great', 'excellent', 'strong', 'fine',
  // Improvement indicators
  'improved', 'better', 'resolved', 'stopped', 'no longer',
  // Absence indicators
  'no problem', 'no issue', 'no trouble', 'not a problem',
  "isn't", "doesn't", "don't", "didn't", "hasn't", "won't",
  'never', 'rarely', 'seldom', 'hardly',
  // Qualifier phrases
  'for hours', 'easily', 'without difficulty'
];

/**
 * Phrases that CONFIRM a symptom (should override negation in some cases)
 */
const NEGATIVE_PHRASES = [
  'trouble', 'problem', 'difficulty', 'struggle', 'hard time',
  'can\'t', 'cannot', 'unable', 'fails to', 'doesn\'t',
  'constantly', 'always', 'never', 'impossible',
  'terrible', 'horrible', 'severe', 'extreme'
];

class CognitiveAnalyzer {
  
  /**
   * Get the sentence containing the keyword for context analysis
   */
  static getSentenceContext(message, keywordPosition) {
    // Find sentence boundaries
    const beforeKeyword = message.slice(0, keywordPosition);
    const afterKeyword = message.slice(keywordPosition);
    
    // Find start of sentence (last period, exclamation, question mark, or start)
    const sentenceStartMatch = beforeKeyword.match(/[.!?][^.!?]*$/);
    const sentenceStart = sentenceStartMatch 
      ? keywordPosition - sentenceStartMatch[0].length + 1 
      : 0;
    
    // Find end of sentence
    const sentenceEndMatch = afterKeyword.match(/[.!?]/);
    const sentenceEnd = sentenceEndMatch 
      ? keywordPosition + sentenceEndMatch.index + 1 
      : message.length;
    
    return message.slice(sentenceStart, sentenceEnd).trim();
  }

  /**
   * ENHANCED: Check if a keyword is in positive context (negated or described positively)
   * Uses multiple detection strategies:
   * 1. Direct negation words before keyword
   * 2. Positive adverbs/phrases before keyword
   * 3. Sentence-level positive context
   */
  static isNegatedOrPositive(message, keywordPosition, keyword) {
    const messageLower = message.toLowerCase();
    const sentence = this.getSentenceContext(message, keywordPosition).toLowerCase();
    
    // Get expanded context before keyword (80 chars for better phrase matching)
    const contextStart = Math.max(0, keywordPosition - 80);
    const contextBefore = messageLower.slice(contextStart, keywordPosition);
    
    // Strategy 1: Check for direct negation patterns
    for (const negation of NEGATION_PATTERNS) {
      const negLower = negation.toLowerCase();
      const negPos = contextBefore.lastIndexOf(negLower);
      
      if (negPos !== -1) {
        const textBetween = contextBefore.slice(negPos + negLower.length);
        const wordsBetween = textBetween.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        // Negation within 6 words of keyword
        if (wordsBetween <= 6) {
          return {
            isNegated: true,
            reason: 'direct_negation',
            trigger: negation,
            distance: wordsBetween
          };
        }
      }
    }
    
    // Strategy 2: Check for positive phrases in context
    for (const phrase of POSITIVE_PHRASES) {
      const phrasePos = contextBefore.lastIndexOf(phrase.toLowerCase());
      
      if (phrasePos !== -1) {
        const textBetween = contextBefore.slice(phrasePos + phrase.length);
        const wordsBetween = textBetween.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        // Positive phrase within 4 words of keyword
        if (wordsBetween <= 4) {
          return {
            isNegated: true,
            reason: 'positive_phrase',
            trigger: phrase,
            distance: wordsBetween
          };
        }
      }
    }
    
    // Strategy 3: Check sentence-level positive patterns
    for (const pattern of POSITIVE_CONTEXT_PATTERNS) {
      if (pattern.test(sentence)) {
        return {
          isNegated: true,
          reason: 'positive_sentence',
          trigger: pattern.source,
          distance: 0
        };
      }
    }
    
    // Strategy 4: Check if there's a NEGATIVE phrase that should override
    // (prevents false negatives when someone says "has trouble focusing")
    for (const negPhrase of NEGATIVE_PHRASES) {
      if (contextBefore.includes(negPhrase.toLowerCase())) {
        // This is a PROBLEM phrase, so we should NOT negate
        return {
          isNegated: false,
          reason: 'confirmed_by_negative_phrase',
          trigger: negPhrase
        };
      }
    }
    
    return { isNegated: false };
  }

  /**
   * Check if the message contains positive context that reduces indicator confidence
   */
  static hasPositiveContext(message) {
    const matches = [];
    
    for (const pattern of POSITIVE_CONTEXT_PATTERNS) {
      if (pattern.test(message)) {
        matches.push(pattern.source);
      }
    }
    
    return {
      hasPositive: matches.length > 0,
      patterns: matches,
      confidenceReduction: matches.length > 0 ? CONFIDENCE_THRESHOLDS.positiveContextReduction : 0
    };
  }

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
   * ENHANCED v2: Detect DSM-5 domain indicators with improved negation detection
   */
  static detectIndicators(message, phaseId) {
    const messageLower = message.toLowerCase();
    const indicators = [];
    const severity = this.analyzeSeverity(message);
    const positiveContext = this.hasPositiveContext(message);
    
    // Track detected keywords per domain for confidence calculation
    const domainKeywords = {};
    
    for (const [domain, config] of Object.entries(DSM5_INDICATOR_PATTERNS)) {
      const detectedKeywords = [];
      let negatedCount = 0;
      
      for (const pattern of config.patterns) {
        const patternLower = pattern.toLowerCase();
        const keywordPos = messageLower.indexOf(patternLower);
        
        if (keywordPos !== -1) {
          // ENHANCED: Use improved negation/positive detection
          const negationCheck = this.isNegatedOrPositive(message, keywordPos, pattern);
          
          if (negationCheck.isNegated) {
            negatedCount++;
            // Log negated keyword for debugging
            console.log(`[CognitiveAnalyzer] Negated keyword: "${pattern}" (${negationCheck.reason}: "${negationCheck.trigger}")`);
          } else {
            detectedKeywords.push({
              keyword: pattern,
              position: keywordPos
            });
          }
        }
      }
      
      domainKeywords[domain] = {
        detected: detectedKeywords,
        negated: negatedCount
      };
      
      // Apply confidence thresholds
      const shouldFlag = this.shouldFlagIndicator(
        detectedKeywords.length, 
        severity.level, 
        positiveContext.hasPositive
      );
      
      if (shouldFlag && detectedKeywords.length > 0) {
        // Calculate confidence score
        let confidence = this.calculateConfidence(
          detectedKeywords.length,
          severity.weight,
          positiveContext.hasPositive,
          negatedCount
        );
        
        indicators.push({
          domain,
          pattern: detectedKeywords.map(k => k.keyword).join(', '),
          keywords: detectedKeywords.map(k => k.keyword),
          keywordCount: detectedKeywords.length,
          context: message.slice(0, 150),
          severity: severity.level,
          weight: severity.weight,
          confidence,
          phaseId,
          dsmCriteria: config.criteria,
          negatedKeywords: negatedCount,
          hasPositiveContext: positiveContext.hasPositive,
          timestamp: new Date()
        });
      }
    }
    
    return { 
      indicators, 
      severity,
      domainKeywords,
      positiveContext
    };
  }

  /**
   * Determine if an indicator should be flagged based on confidence thresholds
   * BALANCED APPROACH: Allow flagging with context-aware thresholds
   */
  static shouldFlagIndicator(keywordCount, severityLevel, hasPositiveContext) {
    // No keywords = no flag
    if (keywordCount === 0) return false;
    
    // If positive context detected, require 2+ keywords as extra validation
    if (hasPositiveContext) {
      return keywordCount >= CONFIDENCE_THRESHOLDS.minKeywordsForPositiveContext;
    }
    
    // High/moderate severity: single keyword is enough (negation already filtered bad ones)
    if (severityLevel === 'high' || severityLevel === 'moderate') {
      return keywordCount >= 1;
    }
    
    // Low severity: still flag with single keyword (negation check handles false positives)
    if (severityLevel === 'low') {
      return keywordCount >= CONFIDENCE_THRESHOLDS.minKeywordsForLow;
    }
    
    // Neutral severity: require minimum keywords
    if (severityLevel === 'neutral') {
      return keywordCount >= CONFIDENCE_THRESHOLDS.minKeywordsForNeutral;
    }
    
    return keywordCount >= 1;
  }

  /**
   * Calculate confidence score for an indicator
   */
  static calculateConfidence(keywordCount, severityWeight, hasPositiveContext, negatedCount) {
    // Base confidence from keyword count (max 50 from keywords)
    let confidence = Math.min(50, keywordCount * 20);
    
    // Add severity weight (max 30 from severity)
    confidence += severityWeight * 10;
    
    // Reduce for positive context
    if (hasPositiveContext) {
      confidence *= (1 - CONFIDENCE_THRESHOLDS.positiveContextReduction);
    }
    
    // Reduce based on negated keywords ratio
    if (negatedCount > 0 && keywordCount > 0) {
      const negationRatio = negatedCount / (negatedCount + keywordCount);
      confidence *= (1 - negationRatio * 0.5);
    }
    
    // Ensure within bounds
    return Math.max(0, Math.min(100, Math.round(confidence)));
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
        newScore = Math.min(100, newScore + 15);
        break;
      }
    }
    
    // Word count affects focus score
    const wordCount = message.split(/\s+/).length;
    if (wordCount >= 20) {
      newScore = Math.min(100, newScore + 5);
    } else if (wordCount <= 5) {
      newScore = Math.max(0, newScore - 10);
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
    const isEmotional = EMOTIONAL_WORDS.some(w => message.toLowerCase().includes(w));
    
    // Vague response detection
    const isVague = VAGUE_RESPONSES.includes(message.toLowerCase().trim()) || message.split(/\s+/).length < 4;
    
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

module.exports = CognitiveAnalyzer;
