/**
 * NeuroNav - App Context
 * Global application state provider
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  // User info
  user: {
    name: '',
    age: null,
    relationship: 'self' // 'self', 'parent', 'teacher'
  },
  
  // Session state
  session: {
    isActive: false,
    sessionId: null,
    startTime: null
  },
  
  // Screening state
  screening: {
    currentPhase: 'alpha',
    progress: 0,
    exchangeCount: 0,
    messages: [],
    isComplete: false
  },
  
  // DSM-5 Analysis
  analysis: {
    dsmScores: {
      inattention: 0,
      hyperactivity: 0,
      impulsivity: 0,
      emotionalDysregulation: 0,
      functionalImpairment: 0
    },
    indicators: [],
    patterns: [],
    riskLevel: 'undetermined'
  },
  
  // UI state
  ui: {
    theme: 'dark',
    zenMode: false,
    showWelcome: true,
    showResults: false,
    isLoading: false,
    error: null
  }
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  START_SESSION: 'START_SESSION',
  END_SESSION: 'END_SESSION',
  UPDATE_PHASE: 'UPDATE_PHASE',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_ANALYSIS: 'UPDATE_ANALYSIS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_THEME: 'SET_THEME',
  TOGGLE_ZEN_MODE: 'TOGGLE_ZEN_MODE',
  SHOW_RESULTS: 'SHOW_RESULTS',
  RESET: 'RESET'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        ui: { ...state.ui, showWelcome: false }
      };
    
    case ActionTypes.START_SESSION:
      return {
        ...state,
        session: {
          isActive: true,
          sessionId: action.payload.sessionId,
          startTime: Date.now()
        },
        screening: {
          ...initialState.screening,
          messages: action.payload.initialMessages || []
        },
        ui: { ...state.ui, showWelcome: false, showResults: false }
      };
    
    case ActionTypes.END_SESSION:
      return {
        ...state,
        session: { ...state.session, isActive: false }
      };
    
    case ActionTypes.UPDATE_PHASE:
      return {
        ...state,
        screening: {
          ...state.screening,
          currentPhase: action.payload.phase,
          progress: action.payload.progress,
          exchangeCount: action.payload.exchangeCount ?? state.screening.exchangeCount
        }
      };
    
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        screening: {
          ...state.screening,
          messages: [...state.screening.messages, action.payload],
          exchangeCount: state.screening.exchangeCount + (action.payload.role === 'user' ? 1 : 0)
        }
      };
    
    case ActionTypes.UPDATE_ANALYSIS:
      return {
        ...state,
        analysis: {
          ...state.analysis,
          ...action.payload
        }
      };
    
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        ui: { ...state.ui, isLoading: action.payload }
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        ui: { ...state.ui, error: action.payload, isLoading: false }
      };
    
    case ActionTypes.SET_THEME:
      return {
        ...state,
        ui: { ...state.ui, theme: action.payload }
      };
    
    case ActionTypes.TOGGLE_ZEN_MODE:
      return {
        ...state,
        ui: { ...state.ui, zenMode: !state.ui.zenMode }
      };
    
    case ActionTypes.SHOW_RESULTS:
      return {
        ...state,
        screening: { ...state.screening, isComplete: true },
        ui: { ...state.ui, showResults: true }
      };
    
    case ActionTypes.RESET:
      return {
        ...initialState,
        ui: { ...initialState.ui, theme: state.ui.theme }
      };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext(null);

/**
 * App Context Provider
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setUser: useCallback((userData) => {
      dispatch({ type: ActionTypes.SET_USER, payload: userData });
    }, []),

    startSession: useCallback((sessionData) => {
      dispatch({ type: ActionTypes.START_SESSION, payload: sessionData });
    }, []),

    endSession: useCallback(() => {
      dispatch({ type: ActionTypes.END_SESSION });
    }, []),

    updatePhase: useCallback((phaseData) => {
      dispatch({ type: ActionTypes.UPDATE_PHASE, payload: phaseData });
    }, []),

    addMessage: useCallback((message) => {
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: message });
    }, []),

    updateAnalysis: useCallback((analysisData) => {
      dispatch({ type: ActionTypes.UPDATE_ANALYSIS, payload: analysisData });
    }, []),

    setLoading: useCallback((isLoading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading });
    }, []),

    setError: useCallback((error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    }, []),

    setTheme: useCallback((theme) => {
      dispatch({ type: ActionTypes.SET_THEME, payload: theme });
    }, []),

    toggleZenMode: useCallback(() => {
      dispatch({ type: ActionTypes.TOGGLE_ZEN_MODE });
    }, []),

    showResults: useCallback(() => {
      dispatch({ type: ActionTypes.SHOW_RESULTS });
    }, []),

    reset: useCallback(() => {
      dispatch({ type: ActionTypes.RESET });
    }, [])
  };

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use app context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };
export default AppContext;
