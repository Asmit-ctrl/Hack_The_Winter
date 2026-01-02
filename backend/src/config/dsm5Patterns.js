/**
 * DSM-5 Clinical Patterns Configuration
 * Severity markers, indicator patterns, and clinical thresholds
 * 
 * UPDATED: Added negation detection and context-aware scoring
 */

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
 * NEGATION PATTERNS - Words/phrases that NEGATE an indicator
 * If these appear BEFORE a keyword within 5 words, the indicator is invalidated
 */
const NEGATION_PATTERNS = [
  // Direct negations
  'not', "n't", 'dont', "don't", 'doesnt', "doesn't", 'didnt', "didn't",
  'isnt', "isn't", 'wasnt', "wasn't", 'wont', "won't", 'cant', "can't",
  'never', 'no', 'none', 'nothing', 'neither', 'nor',
  // Positive descriptors (indicating ABSENCE of problem)
  'good at', 'great at', 'excellent', 'fine with', 'handles well',
  'no problem', 'no issue', 'no trouble', 'no difficulty',
  'rarely', 'seldom', 'hardly ever', 'barely',
  'able to', 'manages to', 'succeeds at', 'does well',
  // Qualifiers that reduce severity
  'used to but', 'stopped', 'improved', 'better now', 'overcome',
  'recovered', 'resolved', 'no longer'
];

/**
 * POSITIVE CONTEXT PATTERNS - Phrases that indicate healthy/normal behavior
 * These should REDUCE confidence in any detected indicator
 * 
 * ENHANCED v2: Added patterns for positive ability descriptions
 */
const POSITIVE_CONTEXT_PATTERNS = [
  // Ability + keyword + well patterns (e.g., "focuses really well", "pays attention fine")
  /(focus(es)?|pay(s)? attention|concentrate(s)?|organize(s)?|sit(s)? still) (really |very |quite |pretty )?(well|fine|good|okay)/i,
  /(can |is able to |able to |knows how to )(focus|pay attention|concentrate|sit still|organize|calm)/i,
  
  // Good/great + keyword patterns (e.g., "good attention to detail", "great at focusing")
  /(good|great|excellent|strong|fine) (at )?(focus|attention|concentration|organization|patience)/i,
  
  // Healthy coping descriptions
  /handles? (it |this |that |things )?(pretty |quite |very )?(well|fine|okay|good)/i,
  /recovers? (quickly|fast|in a few|within)/i,
  /calms? (down|himself|herself|themselves) (quickly|easily|well)/i,
  /no (major |big |real )?(problems?|issues?|concerns?|difficulties?|trouble)/i,
  /generally (good|fine|okay|well|normal)/i,
  /appropriate for (his|her|their) age/i,
  /typical for (his|her|their) age/i,
  /normal (for |amount |level )/i,
  
  // Explicit absence of symptoms
  /doesn'?t (really |seem to )?(have |show |display |exhibit )/i,
  /(he|she|they|my child|my son|my daughter) (is|are|seems?) (pretty |quite |very )?(calm|focused|patient|organized|attentive)/i,
  /not (really |particularly )?(a |an )?(issue|problem|concern|challenge)/i,
  
  // Success/achievement context  
  /(great|good|excellent) (student|kid|child)/i,
  /doing (well|great|fine) (at|in) school/i,
  /succeeds? (at|in|with)/i,
  /developing (normally|well|appropriately)/i,
  
  // Negation + problem patterns (e.g., "doesn't forget", "never loses things")
  /(doesn'?t|don'?t|never|rarely) (forget|lose|miss|skip|avoid)/i,
  /(doesn'?t|don'?t|never|rarely) (have trouble|have problems?|struggle|have difficulty)/i,
  
  // Impulsivity control patterns
  /(waits? |has learned to |knows how to |able to )(his |her |their )?(turn|wait|be patient)/i,
  /(can |is able to |knows how to )(wait|be patient|take turns|control impulses?|think before)/i,
  
  // For hours pattern (indicates sustained attention)
  /(for|can go) (hours|a long time|extended periods?) (without|at)/i,
  /(reads?|play(s)?|work(s)?|focus(es)?) for hours/i,
  
  // Improvement patterns
  /(has|have) (improved|gotten better|come a long way)/i,
  /used to (but |have |be )/i,
  /no longer (has|have|shows?|exhibits?)/i
];

/**
 * MINIMUM CONFIDENCE THRESHOLDS
 * Balanced thresholds to minimize both false positives AND false negatives
 */
const CONFIDENCE_THRESHOLDS = {
  // Minimum requirements to flag an indicator
  minSeverityForSingleKeyword: 'low',      // Allow single keyword with any severity (rely on negation detection)
  minKeywordsForNeutral: 1,                // Single keyword enough for neutral (negation check handles false positives)
  minKeywordsForLow: 1,                    // Single keyword enough for low severity (with context check)
  minKeywordsForPositiveContext: 2,        // Require 2+ keywords if positive context detected
  // Confidence reduction factors
  negationReduction: 1.0,                  // Full reduction (invalidate) on negation
  positiveContextReduction: 0.4,           // 40% reduction for positive context (down from 70%)
  lowSeverityReduction: 0.7                // 70% weight for low severity matches (up from 50%)
};

/**
 * Pattern indicators mapped to DSM-5 criteria
 * EXPANDED: Added more colloquial/informal patterns for better detection
 */
const DSM5_INDICATOR_PATTERNS = {
  inattention: {
    patterns: ['distracted', 'focus', 'attention', 'concentrate', 'forget', 'forgets',
               'lose', 'loses', 'lost', 'careless', 'mistake', 'daydream', 'zone out',
               'not listening', 'doesn\'t listen', 'homework', 'follow through', 
               'finish', 'organize', 'avoids', 'details', 'instructions',
               // ADDED: More colloquial patterns
               'quit', 'quits', 'give up', 'gives up', 'boring', 'bored', 'cant do',
               'cannot', 'canot', 'hard time', 'struggle', 'struggles', 'long time',
               'time span', 'pomodoro', 'timer', 'breaks', 'schedule', 'routine',
               'spacing out', 'wander', 'wandering', 'drift', 'drifting', 'mind wanders'],
    criteria: 'DSM-5 Criterion A1 (Inattention)',
    maxItems: 9
  },
  hyperactivity: {
    patterns: ['fidget', 'fidgets', 'sit still', 'restless', 'always moving', 'hyper',
               'energy', 'running', 'climbing', 'motor', 'calm down', 'loud', 'noisy',
               'squirms', 'leaves seat', 'runs', 'climbs', 'on the go', 'talks a lot',
               'excessive', 'nonstop',
               // ADDED: More colloquial patterns
               'cant sit', 'wont sit', 'bouncing', 'jumping', 'moving around',
               'high energy', 'too much energy', 'always active', 'never stops'],
    criteria: 'DSM-5 Criterion A2a-f (Hyperactivity)',
    maxItems: 6
  },
  impulsivity: {
    patterns: ['interrupt', 'interrupts', 'blurt', 'blurts', 'wait', 'waiting', 
               'patient', 'impatient', 'impulsive', 'turn', 'turns', 'cut in line',
               'grab', 'grabs', 'without thinking', 'rush', 'rushes', 'intrudes',
               'butts in', 'answer before',
               // ADDED: More colloquial patterns
               'cant wait', 'wont wait', 'no patience', 'acts first', 'reacts'],
    criteria: 'DSM-5 Criterion A2g-i (Impulsivity)',
    maxItems: 3
  },
  emotional: {
    patterns: ['meltdown', 'tantrum', 'mood', 'outburst', 'anger', 'angry', 'cry',
               'cries', 'sensitive', 'overreact', 'emotional', 'frustrated', 'explosive',
               'irritable', 'temper', 'rage',
               // ADDED: More colloquial patterns
               'upset', 'mad', 'sad', 'overwhelm', 'stress', 'anxious', 'worry'],
    criteria: 'Emotional Dysregulation (Associated Feature)'
  },
  executive: {
    patterns: ['organize', 'organization', 'disorganized', 'plan', 'planning', 'cant plan',
               'time management', 'time blind', 'loses track of time', 'late', 'always late',
               'routine', 'schedule', 'start', 'starting', 'hard to start', 'cant start',
               'finish', 'finishing', 'never finishes', 'cant finish', 'complete', 
               'procrastinate', 'procrastination', 'puts off', 'prioritize', 'priorities',
               'manage', 'sequence', 'order', 'steps', 'transitions', 'switching tasks',
               'working memory', 'short term memory', 'forgets instructions', 'multi-step',
               'overwhelmed by tasks', 'task initiation', 'follow through',
               // ADDED: More colloquial patterns  
               'messy', 'mess', 'cluttered', 'loses stuff', 'misplaces'],
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
  /\d+ (minutes?|hours?|times?|days?)/i,
  /"[^"]+"/,
  /happened when|remember when/i
];

/**
 * Impulsivity Detection Patterns (for Cool Down Timer)
 */
const IMPULSIVITY_INDICATORS = {
  shortResponse: 5,
  rapidFire: 3000,
  streakThreshold: 3,
  coolDownDuration: 5000
};

/**
 * Emotional words for analysis
 */
const EMOTIONAL_WORDS = [
  'frustrated', 'worried', 'exhausted', 'tired', 'scared',
  'angry', 'upset', 'overwhelmed', 'stressed', 'hard', 
  'difficult', 'struggling', 'hate', 'love', 'happy'
];

/**
 * Vague response indicators
 */
const VAGUE_RESPONSES = [
  'yes', 'no', 'maybe', 'sometimes', 'i guess', 'ok', 'okay', 'sure', 'idk'
];

module.exports = {
  DSM5_MARKERS,
  DSM5_INDICATOR_PATTERNS,
  SPECIFIC_EXAMPLE_INDICATORS,
  IMPULSIVITY_INDICATORS,
  EMOTIONAL_WORDS,
  VAGUE_RESPONSES,
  // NEW EXPORTS for negation detection
  NEGATION_PATTERNS,
  POSITIVE_CONTEXT_PATTERNS,
  CONFIDENCE_THRESHOLDS
};
