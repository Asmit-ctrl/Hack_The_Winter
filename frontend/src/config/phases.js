/**
 * NeuroNav - Mission Phases Configuration
 * Defines the 6-phase ADHD screening journey
 */

export const MISSION_PHASES = {
  ALPHA: {
    id: 'alpha',
    name: 'Sector Alpha',
    subtitle: 'Attention Patterns',
    description: 'Exploring daily attention habits and focus behaviors',
    color: '#FF6B2C',
    gradient: 'linear-gradient(135deg, #FF6B2C 0%, #FF8F5C 100%)',
    dsmDomain: 'Inattention',
    icon: '🎯',
    minExchanges: 3
  },
  BETA: {
    id: 'beta',
    name: 'Sector Beta',
    subtitle: 'Activity & Energy',
    description: 'Understanding movement patterns and energy levels',
    color: '#00D4FF',
    gradient: 'linear-gradient(135deg, #00D4FF 0%, #6EE7FF 100%)',
    dsmDomain: 'Hyperactivity',
    icon: '⚡',
    minExchanges: 3
  },
  GAMMA: {
    id: 'gamma',
    name: 'Sector Gamma',
    subtitle: 'Decision Making',
    description: 'Examining impulse control and decision patterns',
    color: '#FFD93D',
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #FFE873 100%)',
    dsmDomain: 'Impulsivity',
    icon: '🧠',
    minExchanges: 3
  },
  DELTA: {
    id: 'delta',
    name: 'Sector Delta',
    subtitle: 'Emotional Regulation',
    description: 'Exploring emotional responses and coping mechanisms',
    color: '#FF4757',
    gradient: 'linear-gradient(135deg, #FF4757 0%, #FF6B81 100%)',
    dsmDomain: 'Emotional Dysregulation',
    icon: '💫',
    minExchanges: 3
  },
  EPSILON: {
    id: 'epsilon',
    name: 'Sector Epsilon',
    subtitle: 'Social & Work Impact',
    description: 'Assessing functional impairment across life domains',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
    dsmDomain: 'Functional Impairment',
    icon: '🌟',
    minExchanges: 3
  },
  OMEGA: {
    id: 'omega',
    name: 'Sector Omega',
    subtitle: 'Mission Complete',
    description: 'Final analysis and personalized recommendations',
    color: '#22C55E',
    gradient: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
    dsmDomain: 'Synthesis',
    icon: '🏆',
    minExchanges: 2
  }
};

export const PHASE_ORDER = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'omega'];

export const PHASE_COLORS = {
  alpha: '#FF6B2C',
  beta: '#00D4FF',
  gamma: '#FFD93D',
  delta: '#FF4757',
  epsilon: '#A855F7',
  omega: '#22C55E'
};

export const getPhaseByIndex = (index) => {
  const phaseId = PHASE_ORDER[index];
  return MISSION_PHASES[phaseId?.toUpperCase()];
};

export const getPhaseProgress = (currentPhase) => {
  const index = PHASE_ORDER.indexOf(currentPhase);
  if (index === -1) return 0;
  return Math.round(((index + 1) / PHASE_ORDER.length) * 100);
};

export default MISSION_PHASES;
