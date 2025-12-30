import React from 'react';
import './MissionProgress.css';

/**
 * Mission Progress Component
 * Displays 6 phases as "Sector Unlocks" in a space mission narrative
 */
const MissionProgress = ({ currentPhase, phases, completedPhases = [] }) => {
  const missionSectors = [
    { 
      id: 'introduction', 
      name: 'LAUNCH PAD', 
      icon: '🚀', 
      subtitle: 'Mission Briefing',
      color: '#FF9F43'
    },
    { 
      id: 'focus', 
      name: 'NEBULA ZONE', 
      icon: '🌌', 
      subtitle: 'Focus Scan',
      color: '#54A0FF'
    },
    { 
      id: 'energy', 
      name: 'SOLAR CORE', 
      icon: '☀️', 
      subtitle: 'Energy Analysis',
      color: '#FECA57'
    },
    { 
      id: 'impulse', 
      name: 'ASTEROID BELT', 
      icon: '💫', 
      subtitle: 'Impulse Navigation',
      color: '#FF5F5F'
    },
    { 
      id: 'emotions', 
      name: 'COSMIC DRIFT', 
      icon: '🌊', 
      subtitle: 'Emotional Mapping',
      color: '#A29BFE'
    },
    { 
      id: 'strengths', 
      name: 'SUPERNOVA', 
      icon: '⭐', 
      subtitle: 'Strength Discovery',
      color: '#1DD1A1'
    }
  ];

  // Find current phase index
  const getCurrentPhaseIndex = () => {
    if (!currentPhase) return 0;
    const phaseId = currentPhase.toLowerCase().replace(' & ', '_').replace(' ', '_');
    const index = missionSectors.findIndex(s => 
      phaseId.includes(s.id) || s.id.includes(phaseId.split('_')[0])
    );
    return index >= 0 ? index : 0;
  };

  const currentIndex = getCurrentPhaseIndex();
  const progressPercent = ((currentIndex + 1) / missionSectors.length) * 100;

  return (
    <div className="mission-progress">
      <div className="mission-header">
        <span className="mission-badge">🛸 ACTIVE MISSION</span>
        <span className="mission-title">NEUROFOCUS EXPLORATION</span>
      </div>

      {/* Progress Line */}
      <div className="mission-track">
        <div 
          className="mission-track-fill" 
          style={{ 
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${missionSectors[0].color}, ${missionSectors[currentIndex].color})`
          }}
        />
        
        {/* Sectors */}
        <div className="sectors-container">
          {missionSectors.map((sector, index) => {
            const isComplete = index < currentIndex || completedPhases.includes(sector.id);
            const isCurrent = index === currentIndex;
            const isLocked = index > currentIndex;

            return (
              <div 
                key={sector.id}
                className={`sector ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <div 
                  className="sector-node"
                  style={{ 
                    borderColor: isLocked ? 'rgba(255,255,255,0.2)' : sector.color,
                    boxShadow: isCurrent ? `0 0 20px ${sector.color}50` : 'none'
                  }}
                >
                  {isComplete ? (
                    <span className="sector-check">✓</span>
                  ) : isLocked ? (
                    <span className="sector-lock">🔒</span>
                  ) : (
                    <span className="sector-icon">{sector.icon}</span>
                  )}
                </div>
                
                <div className="sector-info">
                  <span 
                    className="sector-name"
                    style={{ color: isLocked ? 'rgba(255,255,255,0.3)' : sector.color }}
                  >
                    {sector.name}
                  </span>
                  <span className="sector-subtitle">{sector.subtitle}</span>
                </div>

                {isCurrent && (
                  <div className="current-indicator">
                    <span className="current-pulse" style={{ background: sector.color }} />
                    <span className="current-label">IN PROGRESS</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Stats */}
      <div className="mission-stats">
        <div className="stat">
          <span className="stat-value">{currentIndex + 1}/6</span>
          <span className="stat-label">SECTORS</span>
        </div>
        <div className="stat">
          <span className="stat-value">{Math.round(progressPercent)}%</span>
          <span className="stat-label">COMPLETE</span>
        </div>
        <div className="stat">
          <span className="stat-value">{6 - currentIndex - 1}</span>
          <span className="stat-label">REMAINING</span>
        </div>
      </div>
    </div>
  );
};

export default MissionProgress;
