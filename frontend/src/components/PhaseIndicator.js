import React, { useEffect } from 'react';
import './PhaseIndicator.css';

const PhaseIndicator = ({ phase, show, onClose }) => {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="phase-indicator show">
      <div className="phase-content" style={{ borderColor: phase.color }}>
        <div className="phase-color-bar" style={{ background: phase.color }} />
        <div className="phase-info">
          <span className="phase-label">Phase Started</span>
          <span className="phase-name" style={{ color: phase.color }}>{phase.name}</span>
          <span className="phase-description">{phase.description}</span>
        </div>
        <button className="phase-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PhaseIndicator;
