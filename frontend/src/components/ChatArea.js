import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatArea.css';
import CoolDownTimer from './CoolDownTimer';

// Premium Typing Indicator Component with color-blocked border
const TypingIndicator = ({ phaseColor, phaseIcon }) => (
  <div className="typing-container">
    {/* Color-blocked border matching AI bubbles */}
    <div className="typing-color-block" style={{ background: phaseColor }} />
    <div className="typing-content">
      <div className="typing-header">
        <span className="typing-icon">{phaseIcon || '🧠'}</span>
        <span className="typing-label">NeuroFocus AI</span>
      </div>
      <div className="typing-dots">
        <span style={{ background: phaseColor }} />
        <span style={{ background: phaseColor }} />
        <span style={{ background: phaseColor }} />
      </div>
    </div>
  </div>
);

// Bento-style Dynamic Hint Box
const DynamicHintBox = ({ hint, phaseColor, phaseName }) => {
  if (!hint) return null;
  
  return (
    <div 
      className="hint-bento-box"
      style={{ 
        '--hint-glow-color': phaseColor,
        borderColor: `${phaseColor}40`
      }}
    >
      <div className="hint-header">
        <span className="hint-icon">💡</span>
        <span className="hint-label">Suggested Response</span>
        <span className="hint-phase-tag" style={{ background: `${phaseColor}20`, color: phaseColor }}>
          {phaseName}
        </span>
      </div>
      <p className="hint-text">{hint}</p>
    </div>
  );
};

const ChatArea = ({ 
  messages, 
  onSendMessage, 
  currentPhase,
  currentHint,
  isLoading,
  canEndSession,
  isComplete,
  onEndSession,
  exchangeCount,
  // New cognitive-adaptive props
  focusScore = 50,
  hasSpecificExample = false,
  impulsivityDetected = false,
  impulsivityLevel = 'low',
  engagementLevel = 'medium',
  showMissionProgress = true,
  completedPhases = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showCoolDown, setShowCoolDown] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [pendingMessage, setPendingMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle impulsivity detection - show cool down if rapid responses detected
  const detectImpulsivity = useCallback((message) => {
    const now = Date.now();
    const timeSinceLastMessage = lastMessageTime ? (now - lastMessageTime) / 1000 : 999;
    const wordCount = message.split(/\s+/).length;
    
    // Detect impulsivity: very fast responses (<5s) OR very short responses (<10 words)
    if (timeSinceLastMessage < 5 && wordCount < 20) {
      return 'high';
    } else if (timeSinceLastMessage < 8 && wordCount < 15) {
      return 'medium';
    } else if (timeSinceLastMessage < 10 && wordCount < 10) {
      return 'low';
    }
    return null;
  }, [lastMessageTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const message = inputValue.trim();
      const detectedLevel = detectImpulsivity(message);
      
      // If impulsivity detected, show cool down timer
      if (detectedLevel && messages.length > 2) {
        setPendingMessage(message);
        setShowCoolDown(true);
      } else {
        onSendMessage(message);
        setLastMessageTime(Date.now());
      }
      
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle cool down complete
  const handleCoolDownComplete = () => {
    setShowCoolDown(false);
    if (pendingMessage) {
      onSendMessage(pendingMessage);
      setLastMessageTime(Date.now());
      setPendingMessage(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const phaseColor = currentPhase?.color || '#54A0FF';

  // Get current impulsivity level for display
  const currentImpulsivityLevel = impulsivityDetected ? impulsivityLevel : 'low';

  return (
    <div className="chat-area">
      {/* Cool Down Timer Overlay */}
      <CoolDownTimer 
        isActive={showCoolDown}
        duration={currentImpulsivityLevel === 'high' ? 7 : currentImpulsivityLevel === 'medium' ? 5 : 3}
        onComplete={handleCoolDownComplete}
        impulsivityLevel={currentImpulsivityLevel}
        canSkip={currentImpulsivityLevel !== 'high'}
      />

      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`message ${message.type}`}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                '--phase-color': phaseColor
              }}
            >
              {message.type === 'assistant' && (
                <div className="message-accent" style={{ background: phaseColor }} />
              )}
              
              <div className="message-body">
                <div className="message-header">
                  <span className="message-sender">
                    {message.type === 'assistant' ? 'NeuroFocus AI' : 'You'}
                  </span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>

              {message.type === 'user' && (
                <div className="message-accent-user" style={{ background: 'var(--prism-blue)' }} />
              )}
            </div>
          ))}
          
          {isLoading && (
            <TypingIndicator 
              phaseColor={phaseColor} 
              phaseIcon={currentPhase?.icon}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-container">
        {/* Rainbow Prism Bar */}
        <div className="prism-bar">
          <div className="prism-segment" style={{ background: 'var(--prism-red)' }} />
          <div className="prism-segment" style={{ background: 'var(--prism-orange)' }} />
          <div className="prism-segment" style={{ background: 'var(--prism-yellow)' }} />
          <div className="prism-segment" style={{ background: 'var(--prism-green)' }} />
          <div className="prism-segment" style={{ background: 'var(--prism-blue)' }} />
          <div className="prism-segment" style={{ background: 'var(--prism-purple)' }} />
        </div>
        
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper" style={{ '--phase-color': phaseColor }}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
            />
            <div className="input-actions">
              <button 
                type="submit" 
                className={`send-btn ${inputValue.trim() ? 'active' : ''}`}
                disabled={!inputValue.trim()}
                style={{ background: inputValue.trim() ? phaseColor : undefined }}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </form>
        
        {/* Bento-style Dynamic Hint Box */}
        <DynamicHintBox 
          hint={currentHint}
          phaseColor={phaseColor}
          phaseName={currentPhase?.name}
        />
        
        {/* End Session Button */}
        {canEndSession && (
          <button 
            className={`end-session-btn ${isComplete ? 'complete' : ''}`}
            onClick={onEndSession}
            disabled={isLoading}
          >
            {isComplete ? (
              <>
                <span className="end-icon">✓</span>
                Complete Screening & Get Results
              </>
            ) : (
              <>
                <span className="end-icon">📊</span>
                End Session Early ({exchangeCount} exchanges)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
