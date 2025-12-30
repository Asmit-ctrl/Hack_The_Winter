import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import PhaseIndicator from './components/PhaseIndicator';
import StarField from './components/StarField';
import WelcomeScreen from './components/WelcomeScreen';
import ResultsScreen from './components/ResultsScreen';
import PatternToast from './components/PatternToast';
import MissionMap from './components/MissionMap';
import ZenToggle from './components/ZenToggle';
import BehavioralAlert from './components/BehavioralAlert';
import useCognitiveUX from './utils/useCognitiveUX';
import './App.css';

// 6-Phase ADHD Screening System with Prism Rainbow Colors
const PHASES = [
  { 
    id: 0, 
    name: 'Introduction', 
    icon: '👋',
    description: 'Build rapport and understand concerns', 
    color: '#FF9F43',      // Prism Orange
    minExchanges: 2,
    maxExchanges: 3
  },
  { 
    id: 1, 
    name: 'Focus & Attention', 
    icon: '🎯',
    description: 'Explore attention patterns and concentration', 
    color: '#54A0FF',      // Prism Blue
    minExchanges: 3,
    maxExchanges: 5
  },
  { 
    id: 2, 
    name: 'Energy & Movement', 
    icon: '⚡',
    description: 'Understand activity levels and hyperactivity', 
    color: '#FECA57',      // Prism Yellow
    minExchanges: 3,
    maxExchanges: 5
  },
  { 
    id: 3, 
    name: 'Impulse Control', 
    icon: '⏱️',
    description: 'Assess self-control and patience', 
    color: '#FF5F5F',      // Prism Red
    minExchanges: 2,
    maxExchanges: 4
  },
  { 
    id: 4, 
    name: 'Emotions', 
    icon: '💭',
    description: 'Explore emotional regulation', 
    color: '#A29BFE',      // Prism Purple
    minExchanges: 2,
    maxExchanges: 4
  },
  { 
    id: 5, 
    name: 'Strengths & Wrap-up', 
    icon: '⭐',
    description: 'Identify positives and conclude', 
    color: '#1DD1A1',      // Prism Green
    minExchanges: 2,
    maxExchanges: 3
  }
];

const API_URL = 'http://localhost:5000/api';

function App() {
  // App state
  const [appScreen, setAppScreen] = useState('welcome'); // welcome, chat, results
  
  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState(10);
  const [userType, setUserType] = useState('parent');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [currentHint, setCurrentHint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Phase state
  const [currentPhase, setCurrentPhase] = useState(PHASES[0]);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showPhasePopup, setShowPhasePopup] = useState(false);
  
  // Cognitive UX Hook - Sensory-Adaptive Navigation
  const {
    zenMode,
    behavioralFlags,
    completionStatus,
    unlockedPhases,
    processMessage: processCognitiveMessage,
    transitionPhase,
    toggleZenMode,
    updateExchanges,
    resetSession: resetCognitiveSession,
    canDownload
  } = useCognitiveUX(userType);
  
  // Track previous phase for unlock animations
  const prevPhaseRef = useRef(0);
  const [previousPhaseId, setPreviousPhaseId] = useState(null);
  const [canEndSession, setCanEndSession] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Results state
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // Pattern detection toasts
  const [detectedPatterns, setDetectedPatterns] = useState([]);
  
  // Cognitive-adaptive state (Mission Control)
  const [focusScore, setFocusScore] = useState(50);
  const [hasSpecificExample, setHasSpecificExample] = useState(false);
  const [impulsivityDetected, setImpulsivityDetected] = useState(false);
  const [impulsivityLevel, setImpulsivityLevel] = useState('low');
  const [engagementLevel, setEngagementLevel] = useState('medium');
  const [completedPhases, setCompletedPhases] = useState([]);
  
  // Sidebar state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [selectedModel, setSelectedModel] = useState('adhd');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed for Mission Control

  // ==================== PRISM PHASE TRANSITION ====================
  // Update CSS variables when phase changes for global color shift
  useEffect(() => {
    if (currentPhase?.color) {
      const root = document.documentElement;
      root.style.setProperty('--accent-color', currentPhase.color);
      root.style.setProperty('--accent-glow', `${currentPhase.color}50`);
      root.style.setProperty('--accent-bg', `${currentPhase.color}15`);
      
      // Update meta theme color for mobile browsers
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', currentPhase.color);
      }
    }
  }, [currentPhase]);

  // ==================== BEHAVIORAL OBSERVATION TRACKING ====================
  // Send behavioral observations to backend when detected
  useEffect(() => {
    // Only send if we have a session and observations
    if (!sessionId || !behavioralFlags) return;
    
    const sendObservation = async (observationType, details, metrics) => {
      try {
        await fetch(`${API_URL}/behavioral-observation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            observationType,
            details,
            timestamp: new Date().toISOString(),
            metrics
          })
        });
      } catch (error) {
        console.error('Failed to send behavioral observation:', error);
      }
    };

    // Send impulsivity observation
    if (behavioralFlags.showingImpulsivity) {
      sendObservation('impulsivity', 'User showing rapid-fire response pattern', {
        recommendCoolDown: behavioralFlags.recommendCoolDown
      });
    }
    
    // Send inattention observation
    if (behavioralFlags.showingInattention) {
      sendObservation('inattention', 'User showing delayed response pattern', {});
    }
  }, [sessionId, behavioralFlags.showingImpulsivity, behavioralFlags.showingInattention, behavioralFlags.recommendCoolDown]);

  // Show phase popup when phase changes
  useEffect(() => {
    if (previousPhaseId !== null && currentPhase.id !== previousPhaseId) {
      setShowPhasePopup(true);
    }
    setPreviousPhaseId(currentPhase.id);
  }, [currentPhase.id, previousPhaseId]);

  // Calculate progress based on current phase (e.g., Phase 2 = 33%)
  const calculateProgress = useCallback((phaseId) => {
    // Base progress: (phaseId / totalPhases) * 100
    const baseProgress = (phaseId / PHASES.length) * 100;
    // Add progress for exchanges within current phase (up to 10% per phase for exchanges)
    const phaseExchangeBonus = Math.min((exchangeCount % 5) / 5 * 10, 10);
    const totalProgress = Math.round(baseProgress + phaseExchangeBonus);
    return Math.min(totalProgress, 99); // Never reach 100% until complete
  }, [exchangeCount]);

  // Start a new screening session
  const startSession = async (name, age, type) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, age, userType: type })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        setUserName(name);
        setUserAge(age);
        setUserType(type);
        setMessages([{
          id: 1,
          type: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
        setCurrentHint(data.hint);
        setCurrentPhase(PHASES[data.phase.id] || PHASES[0]);
        setPhaseProgress(calculateProgress(data.phase.id));
        setExchangeCount(0);
        setAppScreen('chat');
        
        // Add to conversations list
        const newConv = {
          id: data.sessionId,
          title: `${name}'s Screening`,
          date: 'Now'
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      // Fallback to demo mode
      startDemoSession(name, age, type);
    }
    setIsLoading(false);
  };

  // Demo mode fallback
  const startDemoSession = (name, age, type) => {
    const demoId = `demo-${Date.now()}`;
    setSessionId(demoId);
    setUserName(name);
    setUserAge(age);
    setUserType(type);
    
    const greeting = type === 'parent' 
      ? `Hello! I'm NeuroFocus AI, and I'm here to have a conversation with you about ${name}.\n\nThis will be a real conversation - I'll ask questions about different areas, and I want to hear your experiences in your own words.\n\nLet's start: What made you decide to do this screening today? What's been on your mind?`
      : `Hey ${name}! I'm NeuroFocus AI.\n\nThis is just a conversation - no tests, no grades. I'm curious to learn about how things are going for you.\n\nSo first: What made you want to do this today?`;
    
    setMessages([{
      id: 1,
      type: 'assistant',
      content: greeting,
      timestamp: new Date()
    }]);
    setCurrentHint("e.g., 'Teacher suggested it' or 'Struggling with homework' or 'Can't sit still in class'");
    setCurrentPhase(PHASES[0]);
    setPhaseProgress(calculateProgress(0));
    setAppScreen('chat');
    
    const newConv = { id: demoId, title: `${name}'s Screening`, date: 'Now' };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(demoId);
  };

  // Send message
  const handleSendMessage = async (content) => {
    // Add user message
    const userMsg = {
      id: messages.length + 1,
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    
    // Process message through Cognitive UX for pace monitoring
    const cognitiveResult = processCognitiveMessage(content);
    
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          message: content,
          // Include behavioral observations from pace monitor
          behavioralFlags: cognitiveResult.flags,
          responseAnalysis: cognitiveResult.analysis
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add AI response
        const aiMsg = {
          id: messages.length + 2,
          type: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // Update phase state and trigger unlock animation
        if (data.phase) {
          const newPhase = PHASES[data.phase.id] || PHASES[data.phase.id - 1] || currentPhase;
          
          // Check if phase changed - trigger unlock animation
          if (data.phase.id > prevPhaseRef.current) {
            transitionPhase(data.phase.id, newPhase.color, newPhase.name);
            prevPhaseRef.current = data.phase.id;
          }
          
          setCurrentPhase(newPhase);
          setPhaseProgress(calculateProgress(data.phase.id));
        }
        
        // Handle detected patterns (DSM-5 indicators)
        if (data.patterns && data.patterns.length > 0) {
          const newPatterns = data.patterns.map((p, i) => ({
            id: `pattern-${Date.now()}-${i}`,
            type: p.type,
            message: p.message
          }));
          setDetectedPatterns(prev => [...prev, ...newPatterns]);
        }
        
        // Handle cognitive-adaptive data from new API response format
        if (data.cognitive) {
          const cd = data.cognitive;
          if (cd.focusScore !== undefined) setFocusScore(cd.focusScore);
          if (cd.focusMeterIntensity !== undefined) setFocusScore(cd.focusMeterIntensity);
          if (cd.hasSpecificExample !== undefined) setHasSpecificExample(cd.hasSpecificExample);
          if (cd.coolDownTriggered !== undefined) setImpulsivityDetected(cd.coolDownTriggered);
          if (cd.impulsivityScore !== undefined) {
            // Map impulsivity score to level
            const level = cd.impulsivityScore >= 70 ? 'high' : cd.impulsivityScore >= 40 ? 'medium' : 'low';
            setImpulsivityLevel(level);
          }
          if (cd.engagementLevel) setEngagementLevel(cd.engagementLevel);
        }
        
        // Update Cognitive UX exchange count
        updateExchanges(data.exchangeCount || exchangeCount + 1);
        // Track completed phases
        if (data.phase && data.phase.id > 0) {
          const prevPhaseId = PHASES[data.phase.id - 1]?.id;
          if (prevPhaseId !== undefined && !completedPhases.includes(prevPhaseId)) {
            setCompletedPhases(prev => [...prev, PHASES[prevPhaseId].name.toLowerCase().split(' ')[0]]);
          }
        }
        
        // Update hint - use suggestedHint for synchronized hints
        setCurrentHint(data.suggestedHint || data.hint || '');
        setExchangeCount(data.exchangeCount || exchangeCount + 1);
        
        // CRITICAL: canEnd is now strictly controlled by backend
        setCanEndSession(data.canEnd || false);
        setIsComplete(data.isComplete || false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Demo mode response
      handleDemoResponse(content);
    }
    setIsLoading(false);
  };

  // Demo mode response handler
  const handleDemoResponse = (userMessage) => {
    const newExchangeCount = exchangeCount + 1;
    setExchangeCount(newExchangeCount);
    
    // Simulate phase progression
    const currentPhaseIndex = currentPhase.id;
    const phase = PHASES[currentPhaseIndex];
    
    let nextPhaseId = currentPhaseIndex;
    let responseText = '';
    let hint = '';
    
    // Check if we should advance phase
    const phaseExchanges = Math.ceil(newExchangeCount / (PHASES.length / 2));
    if (phaseExchanges >= phase.minExchanges && currentPhaseIndex < PHASES.length - 1) {
      nextPhaseId = currentPhaseIndex + 1;
      const nextPhase = PHASES[nextPhaseId];
      responseText = `Thank you for sharing that. ${getDemoAcknowledgment()}\n\nNow I'd like to explore ${nextPhase.name.toLowerCase()}. ${getDemoQuestion(nextPhaseId)}`;
      hint = getDemoHint(nextPhaseId);
    } else {
      responseText = `${getDemoAcknowledgment()} ${getDemoFollowUp(currentPhaseIndex)}`;
      hint = getDemoHint(currentPhaseIndex);
    }
    
    const aiMsg = {
      id: messages.length + 2,
      type: 'assistant',
      content: responseText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMsg]);
    
    // Simulate pattern detection in demo mode
    if (Math.random() > 0.6 && newExchangeCount > 2) {
      const patternTypes = ['inattention', 'hyperactivity', 'impulsivity', 'emotional'];
      const patternMessages = {
        inattention: 'Difficulty maintaining focus noted',
        hyperactivity: 'Elevated activity level indicated',
        impulsivity: 'Impulsive behavior pattern observed',
        emotional: 'Emotional regulation challenge detected'
      };
      const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
      setDetectedPatterns(prev => [...prev, {
        id: `demo-pattern-${Date.now()}`,
        type,
        message: patternMessages[type]
      }]);
    }
    
    // Demo: Simulate cognitive-adaptive analysis
    const wordCount = userMessage.split(/\s+/).length;
    const hasSpecific = userMessage.length > 50 && (
      userMessage.includes('example') || 
      userMessage.includes('yesterday') || 
      userMessage.includes('last week') ||
      userMessage.includes('for instance') ||
      /\d/.test(userMessage) // contains numbers (specific details)
    );
    
    // Calculate focus score based on message quality
    const newFocusScore = Math.min(100, Math.max(20, 
      focusScore + (hasSpecific ? 15 : -5) + (wordCount > 30 ? 10 : wordCount < 10 ? -10 : 0)
    ));
    setFocusScore(newFocusScore);
    setHasSpecificExample(hasSpecific);
    
    // Update engagement level
    const newEngagement = newFocusScore >= 70 ? 'high' : newFocusScore >= 40 ? 'medium' : 'low';
    setEngagementLevel(newEngagement);
    
    // Track completed phases in demo mode + trigger unlock animation
    if (nextPhaseId > currentPhaseIndex && currentPhaseIndex >= 0) {
      const completedPhaseName = PHASES[currentPhaseIndex].name.toLowerCase().split(' ')[0];
      if (!completedPhases.includes(completedPhaseName)) {
        setCompletedPhases(prev => [...prev, completedPhaseName]);
      }
      // Trigger phase unlock animation
      transitionPhase(nextPhaseId, PHASES[nextPhaseId].color, PHASES[nextPhaseId].name);
    }
    
    // Update cognitive UX exchanges
    updateExchanges(newExchangeCount);
    
    setCurrentPhase(PHASES[nextPhaseId]);
    setPhaseProgress(calculateProgress(nextPhaseId));
    setCurrentHint(hint);
    setCanEndSession(newExchangeCount >= 8);
    setIsComplete(nextPhaseId >= PHASES.length - 1 && phaseExchanges >= PHASES[PHASES.length - 1].minExchanges);
  };

  const getDemoAcknowledgment = () => {
    const acks = [
      "I hear you - that sounds really challenging.",
      "Thank you for being so open about that.",
      "I can see how that would be difficult to manage.",
      "That's really helpful information.",
      "I appreciate you sharing that with me."
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  };

  const getDemoQuestion = (phaseId) => {
    const questions = {
      0: "What made you decide to do this screening today?",
      1: "How does focus work during homework or tasks that need concentration?",
      2: "How would you describe the activity level compared to other kids?",
      3: "How is waiting handled - in lines, for turns, or for something wanted?",
      4: "How are frustration and strong emotions handled?",
      5: "What are the real strengths and things that go well?"
    };
    return questions[phaseId] || questions[0];
  };

  const getDemoFollowUp = (phaseId) => {
    const followUps = {
      0: "Can you tell me more about what specific situations concern you most?",
      1: "What happens when there's something boring to do? Can they stick with it?",
      2: "Can sitting still happen when needed - like at dinner or watching a movie?",
      3: "What about interrupting conversations or blurting out answers?",
      4: "What helps with calming down when upset? How long does it usually take?",
      5: "What activities or subjects bring the most enjoyment and success?"
    };
    return followUps[phaseId] || followUps[0];
  };

  const getDemoHint = (phaseId) => {
    const hints = {
      0: "e.g., 'Teacher suggested it' or 'Struggling with homework'",
      1: "e.g., 'Takes hours to finish' or 'Gets distracted every few minutes'",
      2: "e.g., 'Never sits still' or 'Fidgets but stays seated'",
      3: "e.g., 'Meltdowns in lines' or 'Very impatient'",
      4: "e.g., 'Big meltdowns' or 'From happy to angry instantly'",
      5: "e.g., 'Very creative' or 'Great with animals'"
    };
    return hints[phaseId] || hints[0];
  };

  // End session
  const handleEndSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/end-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysisResults(data);
        setAppScreen('results');
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      // Demo results
      setAnalysisResults({
        summary: `Thank you for this conversation about ${userName}. Based on what we discussed, I noticed some patterns that may warrant further exploration with a professional.`,
        analysis: {
          level: 'mild',
          severityLevel: 'mild',
          presentation: 'Some attention patterns noted',
          presentationCode: 'Subthreshold',
          totalScore: 18,
          inattentionScore: 10,
          hiScore: 8,
          domainScores: { inattention: 3, hyperactivity: 2, impulsivity: 2, emotional: 1, executive: 1 },
          recommendEvaluation: true,
          keyConcerns: ['inattention'],
          observations: ['Focus challenges noted', 'Some hyperactivity indicators']
        },
        name: userName,
        exchangeCount,
        duration: '10 minutes'
      });
      setAppScreen('results');
    }
    setIsLoading(false);
  };

  // New screening
  const handleNewScreening = () => {
    setAppScreen('welcome');
    setSessionId(null);
    setMessages([]);
    setCurrentPhase(PHASES[0]);
    setPhaseProgress(0);
    setExchangeCount(0);
    setCanEndSession(false);
    setIsComplete(false);
    setAnalysisResults(null);
    setCurrentHint('');
    setDetectedPatterns([]);
    // Reset cognitive UX
    resetCognitiveSession();
    prevPhaseRef.current = 0;
  };

  // Dismiss pattern toast
  const handleDismissPattern = (id) => {
    setDetectedPatterns(prev => prev.filter(p => p.id !== id));
  };

  // Download report - only enabled after completing Strengths phase
  const handleDownloadReport = () => {
    if (canDownload || isComplete) {
      window.open(`${API_URL}/download-report`, '_blank');
    }
  };

  return (
    <div className={`app ${zenMode ? 'zen-active' : ''}`} style={{ '--phase-color': currentPhase?.color }}>
      <StarField />
      
      {/* Behavioral Alert - Pace Monitor Feedback */}
      {appScreen === 'chat' && (
        <BehavioralAlert flags={behavioralFlags} />
      )}
      
      {/* Pattern Detection Toasts */}
      {appScreen === 'chat' && (
        <PatternToast 
          patterns={detectedPatterns}
          onDismiss={handleDismissPattern}
        />
      )}
      
      {appScreen === 'chat' && (
        <PhaseIndicator 
          phase={currentPhase} 
          show={showPhasePopup}
          onClose={() => setShowPhasePopup(false)}
        />
      )}

      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        onNewChat={handleNewScreening}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={userName}
      />

      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''} ${appScreen === 'chat' ? 'three-column' : ''}`}>
        {appScreen === 'welcome' && (
          <WelcomeScreen 
            onStart={startSession}
            isLoading={isLoading}
            phases={PHASES}
          />
        )}
        
        {appScreen === 'chat' && (
          <>
            <ChatArea
              messages={messages}
              onSendMessage={handleSendMessage}
              currentPhase={currentPhase}
              currentHint={currentHint}
              isLoading={isLoading}
              canEndSession={canEndSession}
              isComplete={isComplete}
              onEndSession={handleEndSession}
              exchangeCount={exchangeCount}
              // Cognitive-adaptive props (Mission Control)
              focusScore={focusScore}
              hasSpecificExample={hasSpecificExample}
              impulsivityDetected={impulsivityDetected}
              impulsivityLevel={impulsivityLevel}
              engagementLevel={engagementLevel}
              showMissionProgress={true}
              completedPhases={completedPhases}
            />
            
            {/* Mission Map - Right Sidebar */}
            <MissionMap 
              currentPhase={currentPhase}
              phases={PHASES}
              exchangeCount={exchangeCount}
              progressPercent={phaseProgress}
              completedPhases={completedPhases}
            />
          </>
        )}
        
        {appScreen === 'results' && (
          <ResultsScreen
            results={analysisResults}
            onNewScreening={handleNewScreening}
            onDownloadReport={handleDownloadReport}
            canDownload={canDownload}
          />
        )}
      </main>
    </div>
  );
}

export default App;
