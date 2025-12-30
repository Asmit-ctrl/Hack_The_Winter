import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewChat,
  selectedModel,
  onSelectModel,
  collapsed,
  onToggleCollapse,
  userName
}) => {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const models = [
    { id: 'adhd', name: 'ADHD', description: 'Focus & attention', color: 'var(--prism-orange)' },
    { id: 'learning', name: 'Learning', description: 'Learning support', color: 'var(--prism-yellow)' },
    { id: 'autism', name: 'Autism', description: 'ASD support', color: 'var(--prism-green)' },
    { id: 'anxiety', name: 'Anxiety', description: 'Anxiety help', color: 'var(--prism-blue)' },
    { id: 'general', name: 'General', description: 'All conditions', color: 'var(--prism-purple)' }
  ];

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-bars">
            <div className="logo-bar" style={{ background: 'var(--prism-red)' }} />
            <div className="logo-bar mid" style={{ background: 'var(--prism-yellow)' }} />
            <div className="logo-bar" style={{ background: 'var(--prism-blue)' }} />
          </div>
          {!collapsed && <h1 className="logo-text">NeuroFocus</h1>}
        </div>
        <button className="collapse-btn" onClick={onToggleCollapse}>
          <svg viewBox="0 0 24 24" fill="none">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {/* New Mission Button - Premium Green */}
          <button className="new-mission-btn" onClick={onNewChat}>
            <span>Start New Mission</span>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Condition Selector */}
          <div className="condition-selector" onClick={() => setShowModelDropdown(!showModelDropdown)}>
            <div className="condition-dot" style={{ background: selectedModelInfo?.color }} />
            <div className="condition-info">
              <span className="condition-name">{selectedModelInfo?.name}</span>
              <span className="condition-desc">{selectedModelInfo?.description}</span>
            </div>
            <svg className={`dropdown-icon ${showModelDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            
            {showModelDropdown && (
              <div className="condition-dropdown">
                {models.map(model => (
                  <div 
                    key={model.id}
                    className={`condition-option ${selectedModel === model.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModel(model.id);
                      setShowModelDropdown(false);
                    }}
                  >
                    <div className="option-dot" style={{ background: model.color }} />
                    <span className="option-name">{model.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Missions */}
          <div className="missions-section">
            <p className="section-label">Past Missions</p>
            <div className="missions-list">
              {conversations.map((conv, index) => (
                <div
                  key={conv.id}
                  className={`mission-item ${activeConversation === conv.id ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div className="mission-dot" style={{ 
                    background: activeConversation === conv.id ? 'var(--prism-red)' : 'var(--text-muted)' 
                  }} />
                  <span className="mission-title">{conv.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            {/* Theme Toggle */}
            <button className="theme-btn" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* User Card */}
            <div className="user-card">
              <div className="user-avatar">
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </div>
              <div className="user-info">
                <span className="user-name">{userName || 'Guest'}</span>
                <span className="user-level">Level 5 Focus</span>
              </div>
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div className="collapsed-actions">
          <button className="collapsed-btn" onClick={onNewChat} title="New Mission">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
