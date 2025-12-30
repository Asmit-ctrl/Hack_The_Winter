import React, { useState, useEffect, useCallback } from 'react';
import './PatternToast.css';

const PatternToast = ({ patterns, onDismiss }) => {
  const [visibleToasts, setVisibleToasts] = useState([]);

  // Add new patterns to visible toasts
  useEffect(() => {
    if (patterns && patterns.length > 0) {
      const newPatterns = patterns.filter(
        p => !visibleToasts.some(v => v.id === p.id)
      );
      if (newPatterns.length > 0) {
        setVisibleToasts(prev => [...prev, ...newPatterns]);
      }
    }
  }, [patterns, visibleToasts]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (visibleToasts.length > 0) {
      const timer = setTimeout(() => {
        setVisibleToasts(prev => prev.slice(1));
        if (onDismiss) onDismiss(visibleToasts[0]?.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visibleToasts, onDismiss]);

  const handleDismiss = useCallback((id) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
    if (onDismiss) onDismiss(id);
  }, [onDismiss]);

  if (visibleToasts.length === 0) return null;

  // Pattern type config
  const typeConfig = {
    inattention: { icon: '🎯', color: '#54A0FF', label: 'Inattention' },
    hyperactivity: { icon: '⚡', color: '#FF9F43', label: 'Hyperactivity' },
    impulsivity: { icon: '⏱️', color: '#FF5F5F', label: 'Impulsivity' },
    emotional: { icon: '💭', color: '#A29BFE', label: 'Emotional' },
    executive: { icon: '🧠', color: '#1DD1A1', label: 'Executive' },
    default: { icon: '📊', color: '#54A0FF', label: 'Pattern' }
  };

  return (
    <div className="toast-container">
      {visibleToasts.slice(0, 3).map((toast, index) => {
        const config = typeConfig[toast.type] || typeConfig.default;
        return (
          <div 
            key={toast.id}
            className="pattern-toast"
            style={{ 
              '--toast-color': config.color,
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="toast-accent" style={{ background: config.color }} />
            <div className="toast-content">
              <div className="toast-header">
                <span className="toast-icon">{config.icon}</span>
                <span className="toast-badge" style={{ background: `${config.color}20`, color: config.color }}>
                  {config.label}
                </span>
              </div>
              <p className="toast-title">Pattern Detected</p>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button 
              className="toast-dismiss"
              onClick={() => handleDismiss(toast.id)}
            >
              ✕
            </button>
            <div className="toast-progress" style={{ background: config.color }} />
          </div>
        );
      })}
    </div>
  );
};

export default PatternToast;
