/**
 * NeuroNav - Components Index
 * Central export for all components
 */

// Chat Components
export { ChatArea } from './chat';

// Layout Components
export { Sidebar } from './layout';

// Screening Components
export { 
  MissionMap, 
  MissionProgress, 
  PhaseIndicator, 
  WelcomeScreen, 
  ResultsScreen 
} from './screening';

// Shared Components
export { 
  CoolDownTimer, 
  PatternToast, 
  BehavioralAlert 
} from './shared';

// Legacy exports (for backward compatibility during migration)
// These point to original locations - remove after migration complete
export { default as StarField } from './StarField';
