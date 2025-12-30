/**
 * NeuroNav - useSession Hook
 * Manages screening session state and API communication
 */

import { useState, useCallback, useRef } from 'react';
import { sessionService, chatService } from '../services';

/**
 * React Hook for Session Management
 */
export function useSession() {
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState({
    phase: 'alpha',
    progress: 0,
    exchangeCount: 0,
    dsmScores: {}
  });

  const sessionRef = useRef(null);

  /**
   * Start a new screening session
   */
  const startSession = useCallback(async (userData = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionService.startSession(userData);
      
      setSessionId(result.sessionId);
      setIsActive(true);
      sessionRef.current = result.sessionId;
      
      setSessionData({
        phase: 'alpha',
        progress: 0,
        exchangeCount: 0,
        dsmScores: {},
        userName: userData.name || 'Space Cadet'
      });

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * End the current session
   */
  const endSession = useCallback(async () => {
    if (!isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionService.endSession();
      
      setIsActive(false);
      sessionRef.current = null;
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isActive]);

  /**
   * Update session data from response
   */
  const updateFromResponse = useCallback((response) => {
    setSessionData(prev => ({
      ...prev,
      phase: response.phase || prev.phase,
      progress: response.progress ?? prev.progress,
      exchangeCount: (prev.exchangeCount || 0) + 1,
      dsmScores: response.analysis?.dsmScores || prev.dsmScores
    }));
  }, []);

  /**
   * Reset session state
   */
  const resetSession = useCallback(() => {
    setIsActive(false);
    setSessionId(null);
    setError(null);
    setSessionData({
      phase: 'alpha',
      progress: 0,
      exchangeCount: 0,
      dsmScores: {}
    });
    sessionRef.current = null;
  }, []);

  /**
   * Get current session status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await sessionService.getStatus();
      setSessionData(prev => ({
        ...prev,
        ...status
      }));
      setIsActive(status.active);
      return status;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    // State
    isActive,
    sessionId,
    isLoading,
    error,
    sessionData,
    phase: sessionData.phase,
    progress: sessionData.progress,
    exchangeCount: sessionData.exchangeCount,
    
    // Actions
    startSession,
    endSession,
    resetSession,
    refreshStatus,
    updateFromResponse,
    
    // Helpers
    clearError: () => setError(null)
  };
}

export default useSession;
