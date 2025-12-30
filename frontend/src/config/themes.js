/**
 * NeuroNav - Theme Configuration
 * CSS variables and theme definitions
 */

export const THEMES = {
  dark: {
    name: 'dark',
    label: 'Dark Mode',
    colors: {
      // Backgrounds
      bgPrimary: '#0a0a0f',
      bgSecondary: '#12121a',
      bgTertiary: '#1a1a24',
      bgCard: 'rgba(26, 26, 36, 0.8)',
      
      // Text
      textPrimary: '#ffffff',
      textSecondary: '#a0a0b0',
      textMuted: '#6a6a7a',
      
      // Borders
      borderPrimary: 'rgba(255, 255, 255, 0.1)',
      borderSecondary: 'rgba(255, 255, 255, 0.05)',
      
      // Input
      inputBg: 'rgba(255, 255, 255, 0.05)',
      inputText: '#ffffff',
      inputPlaceholder: '#6a6a7a',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      inputFocusBorder: 'rgba(255, 107, 44, 0.5)',
      
      // Accents
      accentPrimary: '#FF6B2C',
      accentSecondary: '#00D4FF',
      
      // Shadows
      shadow: 'rgba(0, 0, 0, 0.3)',
      glow: 'rgba(255, 107, 44, 0.2)'
    }
  },
  light: {
    name: 'light',
    label: 'Light Mode',
    colors: {
      // Backgrounds
      bgPrimary: '#f5f5f7',
      bgSecondary: '#ffffff',
      bgTertiary: '#e8e8ec',
      bgCard: 'rgba(255, 255, 255, 0.9)',
      
      // Text
      textPrimary: '#1a1a24',
      textSecondary: '#4a4a5a',
      textMuted: '#8a8a9a',
      
      // Borders
      borderPrimary: 'rgba(0, 0, 0, 0.1)',
      borderSecondary: 'rgba(0, 0, 0, 0.05)',
      
      // Input
      inputBg: 'rgba(0, 0, 0, 0.03)',
      inputText: '#1a1a24',
      inputPlaceholder: '#8a8a9a',
      inputBorder: 'rgba(0, 0, 0, 0.15)',
      inputFocusBorder: 'rgba(255, 107, 44, 0.6)',
      
      // Accents
      accentPrimary: '#FF6B2C',
      accentSecondary: '#0066CC',
      
      // Shadows
      shadow: 'rgba(0, 0, 0, 0.1)',
      glow: 'rgba(255, 107, 44, 0.15)'
    }
  }
};

export const applyTheme = (themeName) => {
  const theme = THEMES[themeName] || THEMES.dark;
  const root = document.documentElement;
  
  // Set theme attribute for CSS selectors
  root.setAttribute('data-theme', themeName);
  
  // Apply CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Store preference
  localStorage.setItem('neuronav-theme', themeName);
  
  return theme;
};

export const getStoredTheme = () => {
  return localStorage.getItem('neuronav-theme') || 'dark';
};

export default THEMES;
