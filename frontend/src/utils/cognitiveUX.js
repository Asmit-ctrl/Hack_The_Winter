/**
 * ============================================================
 * COGNITIVE-ADAPTIVE UX MANAGER
 * ============================================================
 * Sensory-Adaptive Navigation System for ADHD Screening
 * 
 * Features:
 * - Pace Monitor (impulsivity/inattention detection)
 * - Zen Mode (reduced cognitive load UI)
 * - Phase Unlock Animations
 * - Behavioral Observation Flags
 * - User Type Color Theming
 * ============================================================
 */

// ==================== PACE MONITOR ====================
// Detects if user is responding too quickly (impulsivity) or too slow (inattention)

class PaceMonitor {
  constructor() {
    this.responseHistory = [];
    this.lastMessageTime = null;
    this.thresholds = {
      impulsivity: {
        responseTime: 3000,    // < 3 seconds = potentially impulsive
        minWords: 5,           // < 5 words = potentially impulsive
        consecutiveCount: 2    // 2+ rapid responses = flag
      },
      inattention: {
        responseTime: 120000,  // > 2 minutes = potentially distracted
        longPause: 60000,      // > 1 minute mid-typing = attention drift
        abandonThreshold: 180000 // > 3 minutes = session at risk
      }
    };
    this.observations = [];
    this.typingStartTime = null;
    this.isTyping = false;
  }

  // Record when user starts typing
  startTyping() {
    if (!this.isTyping) {
      this.typingStartTime = Date.now();
      this.isTyping = true;
    }
  }

  // Record when user stops typing (pauses)
  pauseTyping() {
    this.isTyping = false;
  }

  // Analyze a completed response
  analyzeResponse(message, messageTimestamp = Date.now()) {
    const wordCount = message.trim().split(/\s+/).filter(w => w.length > 0).length;
    const responseTime = this.lastMessageTime 
      ? messageTimestamp - this.lastMessageTime 
      : 10000; // Default 10s for first message

    const analysis = {
      responseTime,
      wordCount,
      timestamp: messageTimestamp,
      flags: [],
      observations: []
    };

    // Check for impulsivity markers
    if (responseTime < this.thresholds.impulsivity.responseTime) {
      analysis.flags.push('rapid_response');
      if (wordCount < this.thresholds.impulsivity.minWords) {
        analysis.flags.push('brief_response');
        analysis.observations.push({
          type: 'impulsivity',
          severity: 'moderate',
          description: 'Rapid, brief response pattern detected',
          context: `Response in ${(responseTime/1000).toFixed(1)}s with ${wordCount} words`
        });
      }
    }

    // Check consecutive rapid responses
    this.responseHistory.push(analysis);
    const recentRapid = this.responseHistory
      .slice(-3)
      .filter(r => r.flags.includes('rapid_response')).length;
    
    if (recentRapid >= this.thresholds.impulsivity.consecutiveCount) {
      analysis.observations.push({
        type: 'impulsivity',
        severity: 'high',
        description: 'Pattern of rapid responses suggests impulsivity',
        context: `${recentRapid} consecutive rapid responses`
      });
    }

    // Check for inattention markers
    if (responseTime > this.thresholds.inattention.responseTime) {
      analysis.flags.push('slow_response');
      analysis.observations.push({
        type: 'inattention',
        severity: responseTime > this.thresholds.inattention.abandonThreshold ? 'high' : 'moderate',
        description: 'Extended response time may indicate attention drift',
        context: `Response took ${Math.round(responseTime/60000)} minutes`
      });
    }

    // Update state
    this.lastMessageTime = messageTimestamp;
    this.observations.push(...analysis.observations);

    return analysis;
  }

  // Get all observations for backend
  getObservations() {
    return this.observations;
  }

  // Get current behavioral flags
  getCurrentFlags() {
    const recent = this.responseHistory.slice(-3);
    return {
      showingImpulsivity: recent.filter(r => r.flags.includes('rapid_response')).length >= 2,
      showingInattention: recent.some(r => r.flags.includes('slow_response')),
      recommendCoolDown: recent.filter(r => r.flags.includes('brief_response')).length >= 2,
      observations: this.observations.slice(-5)
    };
  }

  // Reset for new session
  reset() {
    this.responseHistory = [];
    this.lastMessageTime = null;
    this.observations = [];
    this.typingStartTime = null;
    this.isTyping = false;
  }
}


// ==================== ZEN MODE MANAGER ====================
// Simplifies UI to reduce cognitive load for ADHD users

class ZenModeManager {
  constructor() {
    this.isActive = false;
    this.originalStyles = {};
  }

  // Toggle Zen Mode
  toggle() {
    this.isActive = !this.isActive;
    this.applyMode();
    return this.isActive;
  }

  // Enable Zen Mode
  enable() {
    this.isActive = true;
    this.applyMode();
  }

  // Disable Zen Mode
  disable() {
    this.isActive = false;
    this.applyMode();
  }

  // Apply the current mode to the DOM
  applyMode() {
    const root = document.documentElement;
    
    if (this.isActive) {
      root.classList.add('zen-mode');
      // Store and simplify
      root.style.setProperty('--zen-transition', '0.4s ease');
    } else {
      root.classList.remove('zen-mode');
    }

    // Dispatch event for React components to listen
    window.dispatchEvent(new CustomEvent('zenModeChange', { 
      detail: { isActive: this.isActive } 
    }));

    return this.isActive;
  }

  // Get current state
  getState() {
    return this.isActive;
  }
}


// ==================== PHASE UNLOCK ANIMATOR ====================
// Creates pulse animations when completing phases

class PhaseUnlockAnimator {
  constructor() {
    this.unlockedPhases = new Set([0]); // Phase 0 is always unlocked
    this.animationQueue = [];
    this.isAnimating = false;
  }

  // Unlock a new phase with animation
  async unlockPhase(phaseId, phaseColor) {
    if (this.unlockedPhases.has(phaseId)) return;
    
    this.unlockedPhases.add(phaseId);
    
    // Queue the animation
    this.animationQueue.push({ phaseId, phaseColor });
    
    if (!this.isAnimating) {
      await this.processAnimationQueue();
    }
  }

  // Process queued animations
  async processAnimationQueue() {
    this.isAnimating = true;
    
    while (this.animationQueue.length > 0) {
      const { phaseId, phaseColor } = this.animationQueue.shift();
      await this.playUnlockAnimation(phaseId, phaseColor);
    }
    
    this.isAnimating = false;
  }

  // Play the unlock animation
  async playUnlockAnimation(phaseId, phaseColor) {
    return new Promise((resolve) => {
      // Create pulse overlay element
      const overlay = document.createElement('div');
      overlay.className = 'phase-unlock-overlay';
      overlay.innerHTML = `
        <div class="unlock-pulse" style="--unlock-color: ${phaseColor}">
          <div class="unlock-ring"></div>
          <div class="unlock-ring delay-1"></div>
          <div class="unlock-ring delay-2"></div>
        </div>
        <div class="unlock-content">
          <span class="unlock-icon">🔓</span>
          <span class="unlock-text">SECTOR ${phaseId + 1} UNLOCKED</span>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Play sound effect (optional)
      this.playUnlockSound();
      
      // Dispatch event for React components
      window.dispatchEvent(new CustomEvent('phaseUnlocked', { 
        detail: { phaseId, phaseColor } 
      }));
      
      // Remove after animation
      setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.remove();
          resolve();
        }, 400);
      }, 2000);
    });
  }

  // Optional: Play unlock sound
  playUnlockSound() {
    // Can be implemented with Web Audio API
    // For now, we'll use a visual-only approach
  }

  // Check if phase is unlocked
  isPhaseUnlocked(phaseId) {
    return this.unlockedPhases.has(phaseId);
  }

  // Get all unlocked phases
  getUnlockedPhases() {
    return Array.from(this.unlockedPhases);
  }

  // Reset for new session
  reset() {
    this.unlockedPhases = new Set([0]);
    this.animationQueue = [];
    this.isAnimating = false;
  }
}


// ==================== USER TYPE THEMING ====================
// Sets base color theme based on user type (Parent vs Student)

class UserTypeThemer {
  constructor() {
    this.currentType = null;
    this.themes = {
      parent: {
        baseColor: '#A29BFE',      // Purple
        accentGlow: 'rgba(162, 155, 254, 0.3)',
        accentBg: 'rgba(162, 155, 254, 0.1)',
        label: 'Parent/Guardian Mode'
      },
      student: {
        baseColor: '#54A0FF',      // Blue  
        accentGlow: 'rgba(84, 160, 255, 0.3)',
        accentBg: 'rgba(84, 160, 255, 0.1)',
        label: 'Student Mode'
      }
    };
  }

  // Set the user type theme
  setUserType(type) {
    if (!this.themes[type]) return;
    
    this.currentType = type;
    const theme = this.themes[type];
    const root = document.documentElement;
    
    // Set CSS variables for base theme
    root.style.setProperty('--user-base-color', theme.baseColor);
    root.style.setProperty('--user-base-glow', theme.accentGlow);
    root.style.setProperty('--user-base-bg', theme.accentBg);
    
    // Add class for conditional styling
    root.classList.remove('user-parent', 'user-student');
    root.classList.add(`user-${type}`);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('userTypeChange', { 
      detail: { type, theme } 
    }));
    
    return theme;
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentType ? this.themes[this.currentType] : null;
  }

  // Reset
  reset() {
    this.currentType = null;
    document.documentElement.classList.remove('user-parent', 'user-student');
  }
}


// ==================== SESSION COMPLETION MANAGER ====================
// Manages session completion state and download permissions

class SessionCompletionManager {
  constructor() {
    this.phases = {
      introduction: false,
      focus: false,
      energy: false,
      impulse: false,
      emotions: false,
      strengths: false
    };
    this.isComplete = false;
    this.minimumExchanges = 12; // Minimum exchanges for valid screening
    this.currentExchanges = 0;
  }

  // Mark a phase as complete
  completePhase(phaseName) {
    const key = phaseName.toLowerCase().split(' ')[0];
    if (key in this.phases) {
      this.phases[key] = true;
      this.checkCompletion();
    }
  }

  // Update exchange count
  updateExchanges(count) {
    this.currentExchanges = count;
    this.checkCompletion();
  }

  // Check if screening is complete
  checkCompletion() {
    // Must complete Strengths & Wrap-up phase
    const strengthsComplete = this.phases.strengths;
    
    // Must have minimum exchanges
    const hasEnoughExchanges = this.currentExchanges >= this.minimumExchanges;
    
    this.isComplete = strengthsComplete && hasEnoughExchanges;
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('sessionCompletionChange', { 
      detail: { 
        isComplete: this.isComplete,
        canDownload: this.isComplete,
        phases: this.phases,
        exchanges: this.currentExchanges
      } 
    }));
    
    return this.isComplete;
  }

  // Check if download is allowed
  canDownloadReport() {
    return this.isComplete;
  }

  // Get completion status
  getStatus() {
    const completedCount = Object.values(this.phases).filter(Boolean).length;
    return {
      isComplete: this.isComplete,
      completedPhases: completedCount,
      totalPhases: 6,
      exchanges: this.currentExchanges,
      minimumExchanges: this.minimumExchanges,
      canDownload: this.isComplete,
      phases: { ...this.phases }
    };
  }

  // Reset for new session
  reset() {
    Object.keys(this.phases).forEach(key => this.phases[key] = false);
    this.isComplete = false;
    this.currentExchanges = 0;
  }
}


// ==================== MAIN COGNITIVE UX MANAGER ====================
// Combines all managers into a single interface

class CognitiveUXManager {
  constructor() {
    this.paceMonitor = new PaceMonitor();
    this.zenMode = new ZenModeManager();
    this.unlockAnimator = new PhaseUnlockAnimator();
    this.userThemer = new UserTypeThemer();
    this.sessionManager = new SessionCompletionManager();
    
    this.initialized = false;
  }

  // Initialize the manager
  init(userType = 'parent') {
    if (this.initialized) return;
    
    this.userThemer.setUserType(userType);
    this.injectStyles();
    this.initialized = true;
    
    console.log('🧠 Cognitive UX Manager initialized');
  }

  // Inject required CSS for animations
  injectStyles() {
    if (document.getElementById('cognitive-ux-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'cognitive-ux-styles';
    styles.textContent = `
      /* ==================== ZEN MODE STYLES ==================== */
      .zen-mode {
        --bg-base: #0A0A0A;
        --bg-panel: #0F0F0F;
        --text-muted: #444;
      }
      
      .zen-mode .mission-progress,
      .zen-mode .focus-meter,
      .zen-mode .pattern-toast-container,
      .zen-mode .hint-bento-box .hint-icon,
      .zen-mode .phase-indicator,
      .zen-mode .prism-bar,
      .zen-mode .mission-header,
      .zen-mode .sector-icon,
      .zen-mode .current-indicator,
      .zen-mode .breathing-guide {
        display: none !important;
      }
      
      .zen-mode .mission-map {
        width: 200px;
        min-width: 200px;
      }
      
      .zen-mode .phase-item .phase-indicator {
        display: flex !important;
        width: 24px;
        height: 24px;
      }
      
      .zen-mode .phase-name {
        font-size: 11px;
      }
      
      .zen-mode .hint-bento-box {
        background: transparent;
        border: none;
        padding: 8px 0;
      }
      
      .zen-mode .hint-text {
        font-size: 12px;
        color: var(--text-muted);
      }
      
      /* ==================== UNLOCK ANIMATION STYLES ==================== */
      .phase-unlock-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        animation: overlayFadeIn 0.3s ease;
      }
      
      @keyframes overlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .phase-unlock-overlay.fade-out {
        animation: overlayFadeOut 0.4s ease forwards;
      }
      
      @keyframes overlayFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      .unlock-pulse {
        position: relative;
        width: 200px;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .unlock-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid var(--unlock-color);
        border-radius: 50%;
        animation: unlockPulse 1.5s ease-out infinite;
      }
      
      .unlock-ring.delay-1 {
        animation-delay: 0.3s;
      }
      
      .unlock-ring.delay-2 {
        animation-delay: 0.6s;
      }
      
      @keyframes unlockPulse {
        0% {
          transform: scale(0.5);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      .unlock-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-top: 40px;
        animation: unlockContentIn 0.5s ease 0.3s both;
      }
      
      @keyframes unlockContentIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .unlock-icon {
        font-size: 48px;
        animation: unlockBounce 0.5s ease 0.5s both;
      }
      
      @keyframes unlockBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      
      .unlock-text {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 4px;
        color: rgba(255, 255, 255, 0.9);
        text-transform: uppercase;
      }
      
      /* ==================== USER TYPE THEMING ==================== */
      .user-parent {
        --user-accent: #A29BFE;
      }
      
      .user-student {
        --user-accent: #54A0FF;
      }
      
      /* Pulse animation for behavioral flags */
      @keyframes behaviorAlert {
        0%, 100% { box-shadow: 0 0 0 0 var(--alert-color); }
        50% { box-shadow: 0 0 20px 5px var(--alert-color); }
      }
      
      .behavior-alert {
        animation: behaviorAlert 2s ease infinite;
      }
    `;
    
    document.head.appendChild(styles);
  }

  // Process a user message
  processMessage(message) {
    const analysis = this.paceMonitor.analyzeResponse(message);
    
    // Send observations to backend if significant
    if (analysis.observations.length > 0) {
      this.sendBehavioralObservation(analysis.observations);
    }
    
    return {
      analysis,
      flags: this.paceMonitor.getCurrentFlags(),
      shouldShowCoolDown: analysis.flags.includes('rapid_response') && 
                          analysis.flags.includes('brief_response')
    };
  }

  // Send behavioral observation to backend
  async sendBehavioralObservation(observations) {
    try {
      await fetch('/api/behavioral-observation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ observations })
      });
    } catch (error) {
      console.warn('Failed to send behavioral observation:', error);
    }
  }

  // Handle phase transition
  async transitionPhase(newPhaseId, phaseColor, phaseName) {
    // Play unlock animation for new phase
    await this.unlockAnimator.unlockPhase(newPhaseId, phaseColor);
    
    // Mark previous phase as complete
    if (newPhaseId > 0) {
      const prevPhaseName = ['introduction', 'focus', 'energy', 'impulse', 'emotions', 'strengths'][newPhaseId - 1];
      this.sessionManager.completePhase(prevPhaseName);
    }
  }

  // Toggle Zen Mode
  toggleZenMode() {
    return this.zenMode.toggle();
  }

  // Update session exchanges
  updateExchanges(count) {
    this.sessionManager.updateExchanges(count);
  }

  // Check if download is allowed
  canDownload() {
    return this.sessionManager.canDownloadReport();
  }

  // Get full status
  getStatus() {
    return {
      zenMode: this.zenMode.getState(),
      behavioral: this.paceMonitor.getCurrentFlags(),
      completion: this.sessionManager.getStatus(),
      unlockedPhases: this.unlockAnimator.getUnlockedPhases()
    };
  }

  // Reset for new session
  reset() {
    this.paceMonitor.reset();
    this.zenMode.disable();
    this.unlockAnimator.reset();
    this.sessionManager.reset();
  }
}

// Create singleton instance
const cognitiveUX = new CognitiveUXManager();

// Export for use in React components
export { 
  cognitiveUX,
  PaceMonitor, 
  ZenModeManager, 
  PhaseUnlockAnimator, 
  UserTypeThemer,
  SessionCompletionManager,
  CognitiveUXManager 
};

export default cognitiveUX;
