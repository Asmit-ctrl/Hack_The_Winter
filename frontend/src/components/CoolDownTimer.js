import React, { useEffect, useState, useCallback } from 'react';
import './CoolDownTimer.css';

/**
 * Cool Down Timer Component
 * Appears when impulsivity is detected to encourage reflection before sending
 */
const CoolDownTimer = ({ 
  isActive, 
  duration = 5, 
  onComplete, 
  impulsivityLevel,
  canSkip = false 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset timer when activated
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isActive, duration]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        setProgress(((duration - newTime) / duration) * 100);
        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isActive, isPaused, timeLeft, duration, onComplete]);

  const handleSkip = useCallback(() => {
    if (canSkip) {
      setTimeLeft(0);
      setProgress(100);
      onComplete?.();
    }
  }, [canSkip, onComplete]);

  if (!isActive) return null;

  // Get level styling
  const getLevelStyle = () => {
    if (impulsivityLevel === 'high') {
      return { 
        color: '#FF5F5F', 
        label: 'Take a breath...',
        icon: '🔴',
        message: 'Quick responses detected. Let\'s slow down.'
      };
    }
    if (impulsivityLevel === 'medium') {
      return { 
        color: '#FECA57', 
        label: 'Reflection moment',
        icon: '🟡',
        message: 'Consider adding more detail to your response.'
      };
    }
    return { 
      color: '#54A0FF', 
      label: 'Quick pause',
      icon: '🔵',
      message: 'A brief pause helps deeper thinking.'
    };
  };

  const style = getLevelStyle();
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`cool-down-timer ${impulsivityLevel}`}>
      <div className="timer-backdrop" />
      
      <div className="timer-content">
        <div className="timer-circle-container">
          <svg className="timer-svg" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={style.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 40 40)"
              style={{ 
                transition: 'stroke-dashoffset 0.1s linear',
                filter: `drop-shadow(0 0 8px ${style.color})`
              }}
            />
          </svg>
          
          <div className="timer-center">
            <span className="timer-icon">{style.icon}</span>
            <span className="timer-seconds" style={{ color: style.color }}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
        </div>

        <div className="timer-text">
          <h3 className="timer-label" style={{ color: style.color }}>
            {style.label}
          </h3>
          <p className="timer-message">{style.message}</p>
        </div>

        {canSkip && timeLeft > 1 && (
          <button className="timer-skip" onClick={handleSkip}>
            Skip (not recommended)
          </button>
        )}

        <div className="breathing-guide">
          <div className="breath-circle" style={{ borderColor: style.color }}>
            <span>Breathe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoolDownTimer;
