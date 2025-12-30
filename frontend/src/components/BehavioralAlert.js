import React, { useEffect, useState } from 'react';
import './BehavioralAlert.css';

/**
 * Behavioral Alert Component
 * Shows subtle alerts for detected behavioral patterns
 */
const BehavioralAlert = ({ flags, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    if (flags.showingImpulsivity && flags.recommendCoolDown) {
      setCurrentAlert({
        type: 'impulsivity',
        icon: '⚡',
        title: 'Rapid Response Pattern',
        message: 'Take a moment to reflect on your answer. More detail helps us understand better.',
        color: '#FF9F43'
      });
      setVisible(true);
    } else if (flags.showingInattention) {
      setCurrentAlert({
        type: 'inattention',
        icon: '💭',
        title: 'Still there?',
        message: 'No rush - take your time. We\'re here when you\'re ready.',
        color: '#54A0FF'
      });
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [flags]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible || !currentAlert) return null;

  return (
    <div 
      className={`behavioral-alert ${currentAlert.type}`}
      style={{ '--alert-color': currentAlert.color }}
    >
      <div className="alert-glow" />
      <div className="alert-content">
        <span className="alert-icon">{currentAlert.icon}</span>
        <div className="alert-text">
          <h4 className="alert-title">{currentAlert.title}</h4>
          <p className="alert-message">{currentAlert.message}</p>
        </div>
        <button className="alert-dismiss" onClick={() => setVisible(false)}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default BehavioralAlert;
