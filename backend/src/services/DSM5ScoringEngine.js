/**
 * DSM-5 Scoring Engine
 * Calculates clinical scores based on DSM-5 criteria
 */

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

  /**
   * Generate clinical summary
   */
  static generateSummary(conversation, dsmScoring) {
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

  /**
   * Generate clinical observations
   */
  static generateObservations(conversation, dsmScoring) {
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
}

module.exports = DSM5ScoringEngine;
