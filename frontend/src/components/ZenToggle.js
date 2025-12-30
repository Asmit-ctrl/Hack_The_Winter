import React from 'react';
import './ZenToggle.css';

/**
 * Zen Toggle Component
 * Simplifies UI by removing icons and non-essential text
 * Reduces cognitive load for ADHD users
 */
const ZenToggle = ({ isActive, onToggle }) => {
  return (
    <button 
      className={`zen-toggle ${isActive ? 'active' : ''}`}
      onClick={onToggle}
      title={isActive ? 'Exit Zen Mode' : 'Enter Zen Mode (Simplified UI)'}
      aria-label={isActive ? 'Exit Zen Mode' : 'Enter Zen Mode'}
    >
      <div className="zen-toggle-track">
        <div className="zen-toggle-thumb">
          {isActive ? '🧘' : '✨'}
        </div>
      </div>
      <span className="zen-toggle-label">
        {isActive ? 'ZEN' : 'FULL'}
      </span>
    </button>
  );
};

export default ZenToggle;
