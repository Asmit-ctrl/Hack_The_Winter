import React from 'react';
import './MissionMap.css';

/**
 * Mission Map - Right Sidebar
 * Replaces standard sidebar with a phase-aware mission tracker
 * Color shifts with current phase (Prism UI)
 */
const MissionMap = ({ 
  currentPhase, 
  phases, 
  exchangeCount, 
  progressPercent,
  completedPhases = []
}) => {
  // Calculate which phases are completed
  const getPhaseStatus = (phase) => {
    if (phase.id < currentPhase?.id) return 'completed';
    if (phase.id === currentPhase?.id) return 'active';
    return 'locked';
  };

  return (
    <div 
      className="mission-map"
      style={{ '--map-accent': currentPhase?.color || '#FF9F43' }}
    >
      {/* Completion Ring */}
      <div className="completion-ring-container">
        <svg className="completion-ring" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={currentPhase?.color || '#FF9F43'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
            transform="rotate(-90 50 50)"
            style={{ 
              transition: 'stroke-dashoffset 0.6s ease-out',
              filter: `drop-shadow(0 0 8px ${currentPhase?.color}50)`
            }}
          />
        </svg>
        <div className="completion-text">
          <span className="completion-value">{progressPercent}%</span>
          <span className="completion-label">COMPLETE</span>
        </div>
      </div>

      {/* Mission Phases Header */}
      <div className="map-section-header">
        <span className="map-section-icon">🗺️</span>
        <span className="map-section-title">MISSION PHASES</span>
      </div>

      {/* Phase List */}
      <div className="phase-list">
        {phases.map((phase) => {
          const status = getPhaseStatus(phase);
          return (
            <div 
              key={phase.id}
              className={`phase-item ${status}`}
              style={{ '--phase-color': phase.color }}
            >
              <div className="phase-indicator">
                {status === 'completed' ? (
                  <span className="phase-check">✓</span>
                ) : status === 'active' ? (
                  <span className="phase-icon">{phase.icon}</span>
                ) : (
                  <span className="phase-lock">○</span>
                )}
              </div>
              
              <div className="phase-info">
                <span className="phase-name">{phase.name}</span>
                {status === 'active' && (
                  <span className="phase-status">IN PROGRESS</span>
                )}
              </div>

              {status === 'active' && (
                <div className="phase-pulse" style={{ background: phase.color }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Phase Details */}
      <div className="current-phase-card" style={{ borderColor: `${currentPhase?.color}40` }}>
        <div className="current-phase-badge">
          <span className="badge-dot" style={{ background: currentPhase?.color }} />
          <span className="badge-text">CURRENT PHASE</span>
        </div>
        <h3 className="current-phase-name" style={{ color: currentPhase?.color }}>
          {currentPhase?.name || 'Introduction'}
        </h3>
        <p className="current-phase-desc">
          {currentPhase?.description || 'Build rapport and understand concerns'}
        </p>
      </div>

      {/* Session Stats */}
      <div className="session-stats">
        <div className="stat-item">
          <span className="stat-value">{exchangeCount}</span>
          <span className="stat-label">Exchanges</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{currentPhase?.id + 1 || 1}/6</span>
          <span className="stat-label">Phase</span>
        </div>
      </div>
    </div>
  );
};

export default MissionMap;
