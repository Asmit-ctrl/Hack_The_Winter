import React, { useState } from 'react';
import './WelcomeScreen.css';

// Prism Phase Colors
const PRISM_PHASES = [
  { id: 0, name: 'Introduction', icon: '👋', color: '#FF9F43' },    // Orange
  { id: 1, name: 'Focus', icon: '🎯', color: '#54A0FF' },           // Blue
  { id: 2, name: 'Energy', icon: '⚡', color: '#FECA57' },          // Yellow
  { id: 3, name: 'Impulse', icon: '⏱️', color: '#FF5F5F' },         // Red
  { id: 4, name: 'Emotions', icon: '💭', color: '#A29BFE' },        // Purple
  { id: 5, name: 'Strengths', icon: '⭐', color: '#1DD1A1' },       // Green
];

const WelcomeScreen = ({ onStart, isLoading, phases }) => {
  const [userType, setUserType] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [ageFocused, setAgeFocused] = useState(false);

  const handleStart = () => {
    if (name.trim() && userType && age) {
      onStart(name.trim(), parseInt(age) || 10, userType);
    }
  };

  const displayPhases = phases || PRISM_PHASES;

  return (
    <div className="welcome-screen">
      {/* Premium Bento Modal */}
      <div className="welcome-modal">
        {/* Phase Map Header */}
        <div className="phase-map-header">
          <span className="phase-map-label">YOUR MISSION MAP</span>
          <div className="phase-badges">
            {displayPhases.map((phase) => (
              <div 
                key={phase.id} 
                className="phase-badge"
                style={{ 
                  borderColor: phase.color,
                  '--phase-color': phase.color 
                }}
              >
                <span className="phase-badge-icon">{phase.icon}</span>
                <span className="phase-badge-name">{phase.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="welcome-content">
          {/* Logo & Title */}
          <div className="welcome-brand">
            <div className="brand-logo">
              <div className="logo-bars">
                <div className="logo-bar" style={{ background: 'var(--prism-red)' }} />
                <div className="logo-bar mid" style={{ background: 'var(--prism-yellow)' }} />
                <div className="logo-bar" style={{ background: 'var(--prism-blue)' }} />
              </div>
              <span className="logo-pulse"></span>
            </div>
            <h1 className="brand-title">NeuroFocus AI</h1>
            <p className="brand-subtitle">ADHD Screening Companion</p>
          </div>

          {/* Dual-Card Selection */}
          <div className="role-selection">
            <h3 className="selection-title">Who's taking this screening?</h3>
            <div className="role-cards">
              {/* Parent Card */}
              <button 
                className={`role-card ${userType === 'parent' ? 'selected' : ''}`}
                onClick={() => setUserType('parent')}
                data-role="parent"
              >
                <div className="role-card-inner">
                  <div className="role-check">
                    {userType === 'parent' && (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="role-emoji">👨‍👩‍👧</span>
                  <span className="role-title">I'm a Parent</span>
                  <span className="role-desc">Answering about my child</span>
                </div>
              </button>

              {/* Student Card */}
              <button 
                className={`role-card ${userType === 'student' ? 'selected' : ''}`}
                onClick={() => setUserType('student')}
                data-role="student"
              >
                <div className="role-card-inner">
                  <div className="role-check">
                    {userType === 'student' && (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="role-emoji">🎒</span>
                  <span className="role-title">I'm a Student</span>
                  <span className="role-desc">Answering about myself</span>
                </div>
              </button>
            </div>
          </div>

          {/* Floating Label Inputs */}
          <div className="input-section">
            <div className="input-row">
              {/* Name Input */}
              <div className={`floating-input ${nameFocused || name ? 'focused' : ''}`}>
                <input
                  type="text"
                  id="name-input"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  required
                />
                <label htmlFor="name-input">
                  {userType === 'student' ? 'Your Name' : "Child's Name"}
                </label>
                <div className="input-border"></div>
              </div>

              {/* Age Input */}
              <div className={`floating-input floating-input-small ${ageFocused || age ? 'focused' : ''}`}>
                <input
                  type="number"
                  id="age-input"
                  placeholder=" "
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onFocus={() => setAgeFocused(true)}
                  onBlur={() => setAgeFocused(false)}
                  min="4"
                  max="99"
                  required
                />
                <label htmlFor="age-input">Age</label>
                <div className="input-border"></div>
              </div>
            </div>
          </div>

          {/* Premium Start Button */}
          <button 
            className={`start-mission-btn ${(!name.trim() || !userType || !age || isLoading) ? 'disabled' : ''}`}
            onClick={handleStart}
            disabled={!name.trim() || !userType || !age || isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="loading-spinner"></span>
                INITIATING...
              </span>
            ) : (
              <span className="btn-content">
                <span className="btn-text">START MISSION</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </button>

          {/* Status Icons */}
          <div className="status-bar">
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>15-25 minutes</span>
            </div>
            <div className="status-divider"></div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Private & Secure</span>
            </div>
            <div className="status-divider"></div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Get PDF Report</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
