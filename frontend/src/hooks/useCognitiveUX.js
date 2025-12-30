/**
 * NeuroNav - useCognitiveUX Hook
 * React Hook for Cognitive-Adaptive UX integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import cognitiveUX from '../utils/cognitiveUX';

/**
 * React Hook for Cognitive-Adaptive UX
 * Provides easy integration with React components
 */
export function useCognitiveUX(userType = 'parent') {
  const [zenMode, setZenMode] = useState(false);
  const [behavioralFlags, setBehavioralFlags] = useState({
    showingImpulsivity: false,
    showingInattention: false,
    recommendCoolDown: false,
    observations: []
  });
  const [completionStatus, setCompletionStatus] = useState({
    isComplete: false,
    canDownload: false,
    completedPhases: 0,
    totalPhases: 6
  });
  const [unlockedPhases, setUnlockedPhases] = useState([0]);
  
  const initialized = useRef(false);

  // Initialize on mount
  useEffect(() => {
    if (!initialized.current) {
      cognitiveUX.init(userType);
      initialized.current = true;
    }

    // Listen for events
    const handleZenChange = (e) => setZenMode(e.detail.isActive);
    const handlePhaseUnlock = (e) => {
      setUnlockedPhases(cognitiveUX.unlockAnimator.getUnlockedPhases());
    };
    const handleCompletion = (e) => {
      setCompletionStatus({
        isComplete: e.detail.isComplete,
        canDownload: e.detail.canDownload,
        completedPhases: Object.values(e.detail.phases).filter(Boolean).length,
        totalPhases: 6,
        exchanges: e.detail.exchanges
      });
    };

    window.addEventListener('zenModeChange', handleZenChange);
    window.addEventListener('phaseUnlocked', handlePhaseUnlock);
    window.addEventListener('sessionCompletionChange', handleCompletion);

    return () => {
      window.removeEventListener('zenModeChange', handleZenChange);
      window.removeEventListener('phaseUnlocked', handlePhaseUnlock);
      window.removeEventListener('sessionCompletionChange', handleCompletion);
    };
  }, [userType]);

  // Process user message
  const processMessage = useCallback((message) => {
    const result = cognitiveUX.processMessage(message);
    setBehavioralFlags(result.flags);
    return result;
  }, []);

  // Handle phase transition
  const transitionPhase = useCallback(async (newPhaseId, phaseColor, phaseName) => {
    await cognitiveUX.transitionPhase(newPhaseId, phaseColor, phaseName);
    setUnlockedPhases(cognitiveUX.unlockAnimator.getUnlockedPhases());
  }, []);

  // Toggle Zen Mode
  const toggleZenMode = useCallback(() => {
    const newState = cognitiveUX.toggleZenMode();
    setZenMode(newState);
    return newState;
  }, []);

  // Update exchanges
  const updateExchanges = useCallback((count) => {
    cognitiveUX.updateExchanges(count);
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    cognitiveUX.reset();
    setZenMode(false);
    setBehavioralFlags({
      showingImpulsivity: false,
      showingInattention: false,
      recommendCoolDown: false,
      observations: []
    });
    setCompletionStatus({
      isComplete: false,
      canDownload: false,
      completedPhases: 0,
      totalPhases: 6
    });
    setUnlockedPhases([0]);
  }, []);

  return {
    // State
    zenMode,
    behavioralFlags,
    completionStatus,
    unlockedPhases,
    
    // Actions
    processMessage,
    transitionPhase,
    toggleZenMode,
    updateExchanges,
    resetSession,
    
    // Direct access
    canDownload: completionStatus.canDownload
  };
}

export default useCognitiveUX;
