import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ phase, progress, phases }) => {
  const currentIndex = phases.findIndex(p => p.id === phase.id);
  
  // SVG circle calculations for main progress ring
  const size = 90;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="progress-sidebar">
      <div className="progress-scroll-area">
        {/* Main Progress Ring */}
        <div className="progress-ring-container">
          <div className="circular-progress">
            <svg width={size} height={size} className="progress-ring">
              <circle
                className="progress-ring-bg"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
              />
              <circle
                className="progress-ring-fill"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                  stroke: phase.color
                }}
              />
            </svg>
            <div className="progress-center">
              <span className="progress-value" style={{ color: phase.color }}>{Math.round(progress)}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="progress-section-label">
          <span>MISSION PHASES</span>
        </div>

        {/* Phase List - Vertical */}
        <div className="phase-list">
          {phases.map((p, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isFuture = index > currentIndex;
            
            return (
              <div 
                key={p.id}
                className={`phase-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="phase-item-line">
                  {index < phases.length - 1 && (
                    <div 
                      className="connector-line"
                      style={{ background: isCompleted ? p.color : 'var(--border-subtle)' }}
                    />
                  )}
                </div>
                <div 
                  className="phase-item-circle"
                  style={{ 
                    background: isCompleted || isActive ? p.color : 'var(--bg-card)',
                    borderColor: isFuture ? 'var(--border-subtle)' : p.color,
                    color: isCompleted || isActive ? '#000' : 'var(--text-muted)',
                    boxShadow: isActive ? `0 0 16px ${p.color}50` : 'none'
                  }}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="phase-icon">{p.icon}</span>
                  )}
                </div>
                <div className="phase-item-info">
                  <span 
                    className="phase-item-name" 
                    style={{ color: isActive ? p.color : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {p.name}
                  </span>
                  {isActive && (
                    <span className="phase-item-status">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Phase Summary */}
        <div className="current-phase-summary">
          <div className="summary-header">
            <div className="summary-dot" style={{ background: phase.color }} />
            <span className="summary-label">CURRENT PHASE</span>
          </div>
          <span className="summary-name" style={{ color: phase.color }}>{phase.name}</span>
          <span className="summary-desc">{phase.description}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
