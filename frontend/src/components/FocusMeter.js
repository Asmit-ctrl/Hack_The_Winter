import React, { useEffect, useState } from 'react';
import './FocusMeter.css';

/**
 * Focus Meter Component
 * Real-time visual indicator that glows brighter when user provides specific examples
 */
const FocusMeter = ({ focusScore, hasSpecificExample, engagementLevel }) => {
  const [displayScore, setDisplayScore] = useState(focusScore);
  const [glowing, setGlowing] = useState(false);

  // Animate score changes
  useEffect(() => {
    const diff = focusScore - displayScore;
    if (Math.abs(diff) > 0) {
      const step = diff > 0 ? 2 : -2;
      const timer = setInterval(() => {
        setDisplayScore(prev => {
          const next = prev + step;
          if ((step > 0 && next >= focusScore) || (step < 0 && next <= focusScore)) {
            clearInterval(timer);
            return focusScore;
          }
          return next;
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [focusScore, displayScore]);

  // Glow effect when specific example detected
  useEffect(() => {
    if (hasSpecificExample) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSpecificExample]);

  // Determine meter state
  const getMeterState = () => {
    if (displayScore >= 80) return { label: 'EXCELLENT', color: '#1DD1A1', glow: '0 0 30px #1DD1A1' };
    if (displayScore >= 60) return { label: 'FOCUSED', color: '#54A0FF', glow: '0 0 20px #54A0FF' };
    if (displayScore >= 40) return { label: 'NEUTRAL', color: '#FECA57', glow: '0 0 15px #FECA57' };
    if (displayScore >= 20) return { label: 'DISTRACTED', color: '#FF9F43', glow: '0 0 10px #FF9F43' };
    return { label: 'LOW', color: '#FF5F5F', glow: '0 0 8px #FF5F5F' };
  };

  const state = getMeterState();
  const fillPercent = Math.min(100, Math.max(0, displayScore));

  return (
    <div className={`focus-meter ${glowing ? 'glowing' : ''} ${engagementLevel}`}>
      <div className="meter-header">
        <span className="meter-icon">🎯</span>
        <span className="meter-label">FOCUS METER</span>
        {hasSpecificExample && (
          <span className="specific-badge">✨ Specific Example!</span>
        )}
      </div>
      
      <div className="meter-container">
        <div className="meter-track">
          <div 
            className="meter-fill"
            style={{ 
              width: `${fillPercent}%`,
              background: `linear-gradient(90deg, ${state.color}80, ${state.color})`,
              boxShadow: glowing ? state.glow : 'none'
            }}
          />
          <div className="meter-segments">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="meter-segment" />
            ))}
          </div>
        </div>
        
        <div className="meter-info">
          <span className="meter-score" style={{ color: state.color }}>
            {Math.round(displayScore)}
          </span>
          <span className="meter-state" style={{ color: state.color }}>
            {state.label}
          </span>
        </div>
      </div>

      <p className="meter-hint">
        {displayScore < 40 
          ? "💡 Try sharing a specific recent example..."
          : displayScore >= 70 
          ? "🌟 Great detail! Keep sharing like this."
          : "📝 Adding more detail helps the analysis."}
      </p>
    </div>
  );
};

export default FocusMeter;
