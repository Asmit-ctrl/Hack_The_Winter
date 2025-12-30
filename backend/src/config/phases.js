/**
 * ADHD Screening Phases Configuration
 * 6-Phase "Mission Sectors" System
 */

const PHASES = [
  {
    id: 0,
    name: 'Introduction',
    sectorName: 'Sector Alpha',
    missionTitle: 'First Contact',
    icon: '👋',
    color: '#FF9F43',
    description: 'Establishing connection and understanding mission objectives',
    questions: [
      {
        text: "Welcome to Mission Control. What brought you here today? What's been on your mind?",
        hint: "e.g., 'Teacher suggested it' or 'Struggling with homework' or 'Can't sit still'",
        probeFor: ['concerns', 'context']
      },
      {
        text: "Tell me a bit about {name} - what's their personality like on a typical day?",
        hint: "e.g., 'Very energetic and curious' or 'Quiet but easily frustrated'",
        probeFor: ['personality', 'baseline']
      }
    ],
    minExchanges: 2,
    maxExchanges: 3,
    dsmDomains: []
  },
  {
    id: 1,
    name: 'Focus & Attention',
    sectorName: 'Sector Beta',
    missionTitle: 'Deep Scan: Attention Systems',
    icon: '🎯',
    color: '#54A0FF',
    description: 'Scanning attention patterns and concentration capabilities',
    questions: [
      {
        text: "Entering Attention Sector. How does {name} handle tasks that need concentration - like homework or chores?",
        hint: "e.g., 'Takes hours to finish' or 'Gets distracted every few minutes'",
        probeFor: ['sustained_attention', 'task_completion'],
        dsmCriteria: 'DSM-5 Criterion A1a-d'
      },
      {
        text: "When {name} is doing something they find boring, what happens?",
        hint: "e.g., 'Gives up quickly' or 'Starts doing something else'",
        probeFor: ['effort_avoidance', 'persistence'],
        dsmCriteria: 'DSM-5 Criterion A1f'
      },
      {
        text: "Does {name} often lose things or forget what they were supposed to do?",
        hint: "e.g., 'Loses pencils daily' or 'Forgets homework at school'",
        probeFor: ['organization', 'forgetfulness'],
        dsmCriteria: 'DSM-5 Criterion A1g-i'
      },
      {
        text: "How easily does {name} get distracted by things around them?",
        hint: "e.g., 'Any noise grabs attention' or 'Looks out window constantly'",
        probeFor: ['distractibility', 'external_stimuli'],
        dsmCriteria: 'DSM-5 Criterion A1h'
      }
    ],
    minExchanges: 3,
    maxExchanges: 5,
    dsmDomains: ['inattention']
  },
  {
    id: 2,
    name: 'Energy & Movement',
    sectorName: 'Sector Gamma',
    missionTitle: 'Power Systems Analysis',
    icon: '⚡',
    color: '#FECA57',
    description: 'Analyzing energy output and movement patterns',
    questions: [
      {
        text: "Sector Gamma activated. How would you describe {name}'s activity level compared to others?",
        hint: "e.g., 'Way more hyper' or 'About the same' or 'Non-stop energy'",
        probeFor: ['hyperactivity_level', 'comparison'],
        dsmCriteria: 'DSM-5 Criterion A2a'
      },
      {
        text: "Can {name} sit still when needed - at dinner, in class, or watching a movie?",
        hint: "e.g., 'Never sits still' or 'Fidgets but stays seated'",
        probeFor: ['fidgeting', 'seat_leaving'],
        dsmCriteria: 'DSM-5 Criterion A2a-b'
      },
      {
        text: "Does {name} seem like they're 'driven by a motor' - always on the go?",
        hint: "e.g., 'Yes, non-stop' or 'Running around even at night'",
        probeFor: ['motor_driven', 'restlessness'],
        dsmCriteria: 'DSM-5 Criterion A2c-d'
      }
    ],
    minExchanges: 3,
    maxExchanges: 5,
    dsmDomains: ['hyperactivity']
  },
  {
    id: 3,
    name: 'Impulse Control',
    sectorName: 'Sector Delta',
    missionTitle: 'Control Systems Check',
    icon: '⏱️',
    color: '#FF5F5F',
    description: 'Testing impulse regulation and response inhibition',
    questions: [
      {
        text: "Entering Control Sector. How does {name} handle waiting - in lines, for turns, for things they want?",
        hint: "e.g., 'Meltdowns in lines' or 'Can wait if distracted' or 'Very impatient'",
        probeFor: ['waiting_difficulty', 'frustration_tolerance'],
        dsmCriteria: 'DSM-5 Criterion A2g'
      },
      {
        text: "Does {name} often interrupt conversations or blurt out answers?",
        hint: "e.g., 'All the time' or 'In class especially' or 'Only when excited'",
        probeFor: ['interrupting', 'blurting'],
        dsmCriteria: 'DSM-5 Criterion A2h-i'
      },
      {
        text: "When {name} wants to do something, do they think it through or just act?",
        hint: "e.g., 'Acts without thinking' or 'Jumps into things' or 'Sometimes plans'",
        probeFor: ['action_without_thinking', 'planning'],
        dsmCriteria: 'DSM-5 Criterion A2e-f'
      }
    ],
    minExchanges: 2,
    maxExchanges: 4,
    dsmDomains: ['impulsivity']
  },
  {
    id: 4,
    name: 'Emotions',
    sectorName: 'Sector Epsilon',
    missionTitle: 'Emotional Systems Calibration',
    icon: '💭',
    color: '#A29BFE',
    description: 'Calibrating emotional regulation systems',
    questions: [
      {
        text: "Sector Epsilon online. How does {name} handle frustration or when things don't go their way?",
        hint: "e.g., 'Big meltdowns' or 'Throws things' or 'Cries easily'",
        probeFor: ['frustration_tolerance', 'emotional_intensity']
      },
      {
        text: "Does {name} have strong emotional reactions - like big meltdowns or mood swings?",
        hint: "e.g., 'From happy to angry instantly' or 'Small things cause big reactions'",
        probeFor: ['emotional_lability', 'intensity']
      },
      {
        text: "When {name} gets upset, what helps them calm down? How long does it take?",
        hint: "e.g., 'Takes 30+ minutes' or 'Needs alone time' or 'Nothing works'",
        probeFor: ['regulation_strategies', 'recovery_time']
      }
    ],
    minExchanges: 2,
    maxExchanges: 4,
    dsmDomains: ['emotional']
  },
  {
    id: 5,
    name: 'Strengths & Wrap-up',
    sectorName: 'Sector Omega',
    missionTitle: 'Mission Completion',
    icon: '⭐',
    color: '#1DD1A1',
    description: 'Identifying strengths and concluding mission',
    questions: [
      {
        text: "Final Sector reached. Let's talk strengths - what is {name} really good at?",
        hint: "e.g., 'Very creative' or 'Great with animals' or 'Makes people laugh'",
        probeFor: ['strengths', 'positive_traits']
      },
      {
        text: "What activities or subjects does {name} enjoy and do well in?",
        hint: "e.g., 'Art and music' or 'Sports' or 'Video games' or 'Building things'",
        probeFor: ['interests', 'successes']
      },
      {
        text: "Is there anything else important for the mission report?",
        hint: "e.g., 'Has anxiety too' or 'Different at home vs school'",
        probeFor: ['additional_info', 'comorbidities']
      }
    ],
    minExchanges: 2,
    maxExchanges: 3,
    dsmDomains: []
  }
];

module.exports = PHASES;
