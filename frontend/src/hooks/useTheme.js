/**
 * NeuroNav - useTheme Hook
 * Manages application theme (dark/light mode)
 */

import { useState, useEffect, useCallback } from 'react';
import { applyTheme, getStoredTheme, THEMES } from '../config/themes';

/**
 * React Hook for Theme Management
 */
export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme());
  const [themeConfig, setThemeConfig] = useState(THEMES[theme]);

  // Apply theme on mount and changes
  useEffect(() => {
    const config = applyTheme(theme);
    setThemeConfig(config);
  }, [theme]);

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Set specific theme
  const setSpecificTheme = useCallback((themeName) => {
    if (THEMES[themeName]) {
      setTheme(themeName);
    }
  }, []);

  // Check if dark mode
  const isDarkMode = theme === 'dark';

  return {
    theme,
    themeConfig,
    isDarkMode,
    toggleTheme,
    setTheme: setSpecificTheme,
    availableThemes: Object.keys(THEMES)
  };
}

export default useTheme;
