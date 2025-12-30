import React from 'react';
import './ResultsScreen.css';

// SVG Progress Ring Component
const ProgressRing = ({ value, max, color, label, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min((value / max) * 100, 100);
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring-card">
      <svg width={size} height={size} className="score-ring">
        <circle
          className="ring-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="ring-fill"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            stroke: color
          }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value" style={{ color }}>{value}</span>
        <span className="ring-max">/ {max}</span>
      </div>
      <span className="ring-label">{label}</span>
    </div>
  );
};

// Severity Badge with high contrast
const SeverityBadge = ({ level }) => {
  const severityConfig = {
    minimal: { color: '#1DD1A1', bg: 'rgba(29, 209, 161, 0.15)', text: 'MINIMAL' },
    mild: { color: '#FECA57', bg: 'rgba(254, 202, 87, 0.15)', text: 'MILD' },
    moderate: { color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.15)', text: 'MODERATE' },
    significant: { color: '#FF5F5F', bg: 'rgba(255, 95, 95, 0.15)', text: 'SIGNIFICANT' },
    severe: { color: '#FF5F5F', bg: 'rgba(255, 95, 95, 0.2)', text: 'SEVERE' }
  };

  const config = severityConfig[level?.toLowerCase()] || severityConfig.minimal;

  return (
    <div 
      className="severity-badge-large"
      style={{ 
        background: config.bg,
        borderColor: config.color
      }}
    >
      <span className="severity-dot" style={{ background: config.color }} />
      <span className="severity-text" style={{ color: config.color }}>{config.text}</span>
      <span className="severity-label">SEVERITY LEVEL</span>
    </div>
  );
};

// DSM-5 Presentation Code Display
const PresentationCode = ({ code, description }) => {
  const codeConfig = {
    'ADHD-C': { label: 'Combined Presentation', color: '#A29BFE', icon: '🔄' },
    'ADHD-I': { label: 'Predominantly Inattentive', color: '#54A0FF', icon: '🎯' },
    'ADHD-H': { label: 'Predominantly Hyperactive-Impulsive', color: '#FF9F43', icon: '⚡' },
    'Subthreshold': { label: 'Subthreshold Indicators', color: '#1DD1A1', icon: '📊' },
    'Low': { label: 'Low Indicators', color: '#1DD1A1', icon: '✓' }
  };

  const config = codeConfig[code] || codeConfig['Subthreshold'];

  return (
    <div className="presentation-code-card">
      <div className="presentation-header">
        <span className="presentation-icon">{config.icon}</span>
        <div className="presentation-info">
          <span className="presentation-code-text" style={{ color: config.color }}>{code || 'Subthreshold'}</span>
          <span className="presentation-label">{config.label}</span>
        </div>
      </div>
      {description && <p className="presentation-desc">{description}</p>}
    </div>
  );
};

const ResultsScreen = ({ results, onNewScreening, onDownloadReport }) => {
  if (!results) return null;

  const { analysis = {}, name, summary, exchangeCount, duration } = results;
  const {
    severityLevel = 'minimal',
    presentation = 'No significant indicators',
    presentationCode = 'Subthreshold',
    totalScore = 0,
    inattentionScore = 0,
    hiScore = 0,
    domainScores = {},
    recommendEvaluation = false,
    observations = []
  } = analysis;

  // Domain info for visual display
  const domainInfo = {
    inattention: { icon: '🎯', label: 'Inattention', color: '#54A0FF', max: 27 },
    hyperactivity: { icon: '⚡', label: 'Hyperactivity', color: '#FF9F43', max: 18 },
    impulsivity: { icon: '⏱️', label: 'Impulsivity', color: '#FF5F5F', max: 9 },
    emotional: { icon: '💭', label: 'Emotional Reg.', color: '#A29BFE', max: 5 },
    executive: { icon: '🧠', label: 'Executive Func.', color: '#1DD1A1', max: 5 }
  };

  return (
    <div className="results-screen">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <div className="results-badge">SCREENING COMPLETE</div>
          <h1>Clinical Assessment Results</h1>
          <p className="results-name">Participant: <strong>{name}</strong></p>
        </div>

        {/* Severity & Presentation Row */}
        <div className="severity-row">
          <SeverityBadge level={severityLevel} />
          <PresentationCode code={presentationCode} description={presentation} />
        </div>

        {/* DSM-5 Scoring - Progress Rings */}
        <div className="dsm5-section">
          <h2>DSM-5 Scoring Breakdown</h2>
          <div className="score-rings-grid">
            <ProgressRing 
              value={inattentionScore} 
              max={27} 
              color="#54A0FF" 
              label="Inattention"
              size={130}
            />
            <ProgressRing 
              value={hiScore} 
              max={27} 
              color="#FF9F43" 
              label="Hyperactive/Impulsive"
              size={130}
            />
            <ProgressRing 
              value={totalScore} 
              max={54} 
              color="#A29BFE" 
              label="Total Score"
              size={130}
            />
          </div>
        </div>

        {/* Domain Breakdown Bars */}
        {Object.keys(domainScores).length > 0 && (
          <div className="domain-breakdown">
            <h3>Domain Analysis</h3>
            <div className="domain-bars">
              {Object.entries(domainScores).map(([domain, score]) => {
                const info = domainInfo[domain] || { icon: '📍', label: domain, color: '#888', max: 10 };
                const percent = Math.min((score / info.max) * 100, 100);
                
                return (
                  <div key={domain} className="domain-bar-row">
                    <div className="domain-bar-info">
                      <span className="domain-bar-icon">{info.icon}</span>
                      <span className="domain-bar-name">{info.label}</span>
                    </div>
                    <div className="domain-bar-wrapper">
                      <div className="domain-bar-bg">
                        <div 
                          className="domain-bar-value"
                          style={{ 
                            width: `${percent}%`,
                            background: info.color 
                          }}
                        />
                      </div>
                      <span className="domain-bar-score" style={{ color: info.color }}>
                        {score}/{info.max}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="summary-section">
          <h3>Clinical Summary</h3>
          <p>{summary}</p>
        </div>

        {/* Observations */}
        {observations.length > 0 && (
          <div className="observations-section">
            <h3>Key Observations</h3>
            <ul className="observations-list">
              {observations.map((obs, index) => (
                <li key={index}>
                  <span className="obs-bullet" style={{ background: '#54A0FF' }} />
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div className={`recommendation-box ${recommendEvaluation ? 'recommend' : 'low'}`}>
          <div className="rec-icon">{recommendEvaluation ? '⚠️' : '✅'}</div>
          <div className="rec-content">
            <h4>{recommendEvaluation ? 'Professional Evaluation Recommended' : 'Low Concern Level'}</h4>
            <p>
              {recommendEvaluation 
                ? 'Based on the screening patterns, a comprehensive evaluation by a qualified healthcare professional is recommended for accurate diagnosis.'
                : 'This screening showed relatively few concerning patterns. If concerns persist, consider consulting a healthcare professional.'
              }
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <div className="session-stats-bar">
          <div className="stat-item">
            <span className="stat-icon">💬</span>
            <span className="stat-value">{exchangeCount}</span>
            <span className="stat-label">Exchanges</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">{duration || '~15 min'}</span>
            <span className="stat-label">Duration</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-icon">📋</span>
            <span className="stat-value">6</span>
            <span className="stat-label">Phases</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-box">
          <span className="disclaimer-icon">ℹ️</span>
          <p>
            <strong>Important Disclaimer:</strong> This screening tool is NOT a diagnostic instrument. 
            Only qualified healthcare professionals can diagnose ADHD. 
            These results are intended to guide discussion with clinicians.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className={`primary-action-btn ${!onDownloadReport ? 'disabled' : ''}`} 
            onClick={onDownloadReport}
            disabled={!onDownloadReport}
            title={!onDownloadReport ? 'Complete screening to unlock download' : 'Download your report'}
          >
            <span className="btn-icon">📄</span>
            <span className="btn-text">Download Mission Report (PDF)</span>
            {!onDownloadReport && <span className="btn-lock">🔒</span>}
          </button>
          <button className="secondary-action-btn" onClick={onNewScreening}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Start New Mission</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
