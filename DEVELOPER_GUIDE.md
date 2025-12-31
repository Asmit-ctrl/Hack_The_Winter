# 👨‍💻 Neurofocus Developer Guide

Complete technical documentation for developers.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Setup & Installation](#setup--installation)
4. [Project Structure](#project-structure)
5. [Backend Services](#backend-services)
6. [Frontend Components](#frontend-components)
7. [API Reference](#api-reference)
8. [Configuration](#configuration)
9. [DSM-5 Scoring System](#dsm-5-scoring-system)
10. [Testing](#testing)
11. [Deployment](#deployment)




## Architecture Overview

---<img width="1440" height="780" alt="Blank diagram (6)" src="https://github.com/user-attachments/assets/e8669560-6529-4aa3-bf5a-eef4f0bdf930" />

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Express API    │────▶│   MongoDB       │
│   (Frontend)    │◀────│  (Backend)      │◀────│   (Database)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  OpenAI API     │
                        │  (Fine-tuned    │
                        │   GPT-3.5)      │
                        └─────────────────┘
```

### Request Flow
1. User sends message via React frontend
2. Express backend receives request
3. CognitiveAnalyzer detects behavioral patterns
4. DSM5ScoringEngine updates clinical scores
5. OpenAI generates contextual response
6. Response sent back with updated indicators

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| lucide-react | latest | Icons |
| CSS3 | - | Styling & animations |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | Web framework |
| mongoose | 8.0.3 | MongoDB ODM |
| openai | 4.24.1 | AI API client |
| pdfkit | 0.14.0 | PDF generation |
| express-session | 1.17.3 | Session management |
| uuid | 9.0.0 | Unique IDs |
| cors | 2.8.5 | Cross-origin requests |
| dotenv | 16.3.1 | Environment variables |

### Database
- MongoDB 5+
- Mongoose schemas for Conversation model

---

## Setup & Installation

### Prerequisites
- Node.js 16+
- MongoDB 5+
- OpenAI API Key with fine-tuned model access

### Step 1: Clone Repository
```bash
git clone https://github.com/Asmit-ctrl/Hack_The_Winter.git
cd Hack_The_Winter
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=mongodb://localhost:27017/neurofocus
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_random_32_char_secret
CORS_ORIGIN=http://localhost:3000
FINE_TUNED_MODEL=your_fine_tuned_model_id
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 4: Start Services
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm start
```

### Verify Installation
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: GET http://localhost:5000/api/health

---

## Project Structure

```
Hack_The_Winter/
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js              # Entry point
│   │   ├── app.js                 # Express app setup
│   │   ├── config/
│   │   │   ├── index.js           # Config aggregator
│   │   │   ├── database.js        # MongoDB connection
│   │   │   ├── phases.js          # 6 mission phases definition
│   │   │   └── dsm5Patterns.js    # DSM-5 behavioral patterns
│   │   ├── controllers/
│   │   │   ├── sessionController.js
│   │   │   ├── chatController.js
│   │   │   └── reportController.js
│   │   ├── services/
│   │   │   ├── OpenAIService.js          # AI integration
│   │   │   ├── CognitiveAnalyzer.js      # Pattern detection
│   │   │   ├── DSM5ScoringEngine.js      # Clinical scoring
│   │   │   ├── ConversationStateMachine.js
│   │   │   ├── ResponseGenerator.js
│   │   │   ├── AdaptiveResponseGenerator.js
│   │   │   └── PDFReportGenerator.js
│   │   ├── models/
│   │   │   └── Conversation.js    # MongoDB schema
│   │   ├── routes/
│   │   │   ├── sessionRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   └── reportRoutes.js
│   │   └── middleware/
│   │       ├── errorHandler.js
│   │       ├── requestLogger.js
│   │       └── sessionValidator.js
│   └── tests/
│       ├── runner.js              # Test runner
│       ├── test_cases.json        # Basic tests (8)
│       ├── test_cases_extended.json # Extended tests (12)
│       └── results/               # Test output
│
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js               # React entry
│       ├── App.js                 # Main component (692 lines)
│       ├── App.css                # Global styles
│       ├── components/
│       │   ├── ChatArea.js        # Chat interface
│       │   ├── WelcomeScreen.js   # Initial setup
│       │   ├── ResultsScreen.js   # Final results
│       │   ├── Sidebar.js         # focusigation
│       │   ├── StarField.js       # Animated background
│       │   ├── MissionMap.js      # Progress visualization
│       │   ├── PhaseIndicator.js  # Current phase display
│       │   ├── PatternToast.js    # Pattern notifications
│       │   ├── BehavioralAlert.js # Alert system
│       │   ├── ProgressBar.js     # Progress indicator
│       │   ├── MissionProgress.js # Mission tracker
│       │   ├── ZenToggle.js       # Zen mode switch
│       │   ├── CoolDownTimer.js   # Pacing timer
│       │   └── FocusMeter.js      # Engagement feedback
│       ├── config/
│       │   ├── phases.js          # Phase definitions
│       │   └── themes.js          # Color themes
│       ├── context/
│       │   └── AppContext.js      # Global state
│       ├── hooks/                 # Custom React hooks
│       └── utils/                 # Helper functions
│
└── docs/
    ├── README.md
    ├── USER_GUIDE.md
    ├── DEVELOPER_GUIDE.md
    └── INNOVATION_USP_IMPACT.md
```

---

## Backend Services

### OpenAIService.js
Handles communication with fine-tuned GPT-3.5-turbo model.

```javascript
// Key methods
generateResponse(messages, context) // Generate AI response
buildSystemPrompt(phase, context)   // Build phase-specific prompt
```

### CognitiveAnalyzer.js
Pattern detection engine with 60+ behavioral patterns.

```javascript
// Key features
- 5 ADHD domains: inattention, hyperactivity, impulsivity, emotional, executive
- Weighted scoring (1-2 per indicator)
- Negation detection with 80-char context window
- Positive phrase patterns to avoid false positives

// Key methods
analyzeMessage(message, context)    // Analyze user message
getSentenceContext(text, position)  // Get surrounding context
isNegatedOrPositive(text, position) // Check for negation
```

### DSM5ScoringEngine.js
Clinical scoring based on DSM-5 criteria.

```javascript
// Severity thresholds (based on totalScore)
- Minimal: totalScore < 15
- Mild: totalScore >= 15
- Moderate: totalScore >= 28
- Severe: totalScore >= 42

// Age-based thresholds
- Ages 6-16: 6+ symptoms required
- Ages 17+: 5+ symptoms required

// Key methods
updateScoring(conversation)         // Update scores from indicators
getThreshold(age)                   // Get age-based threshold
generateSummary()                   // Generate clinical summary
generateObservations()              // Generate detailed observations
```

### PDFReportGenerator.js
Generates professional PDF reports using PDFKit.

```javascript
// Report sections
- Patient information
- Domain scores with visualizations
- Severity assessment
- Conversation transcript
- Clinical recommendations
```

### ConversationStateMachine.js
Manages 6-phase conversation flow.

```javascript
// Phase transitions
- Validates minimum exchanges per phase
- Handles advance requests
- Tracks progress across domains
```

---

## Frontend Components

### Core Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `App.js` | Main container | State management, routing |
| `ChatArea.js` | Chat interface | Message display, input |
| `WelcomeScreen.js` | Initial setup | Name, age, role input |
| `ResultsScreen.js` | Final display | Scores, PDF download |
| `Sidebar.js` | focusigation | Phase list, progress |

### Visual Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `StarField.js` | Background | Canvas animation |
| `MissionMap.js` | Progress | Interactive map |
| `PhaseIndicator.js` | Current phase | Color-coded display |
| `PatternToast.js` | Notifications | Pattern alerts |
| `ProgressBar.js` | Progress | Visual indicator |

### Feature Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `ZenToggle.js` | Accessibility | Reduce visuals |
| `CoolDownTimer.js` | Pacing | Prevent rushing |
| `FocusMeter.js` | Engagement | Real-time feedback |
| `BehavioralAlert.js` | Alerts | Pattern notifications |

---

## API Reference

### Session Endpoints

#### POST /api/sessions/create
Create new screening session.

**Request:**
```json
{
  "childName": "string",
  "childAge": "number (6-17)",
  "respondentType": "parent|teacher|self"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "message": "Session created"
}
```

#### GET /api/sessions/:sessionId
Get session data.

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "childName": "string",
    "childAge": "number",
    "respondentType": "string",
    "currentPhase": "number",
    "scores": {},
    "indicators": []
  }
}
```

### Chat Endpoints

#### POST /api/chat/message
Send message and get AI response.

**Request:**
```json
{
  "sessionId": "uuid",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI response string",
  "indicators": [
    {
      "domain": "inattention",
      "pattern": "difficulty_sustaining_attention",
      "score": 2,
      "evidence": "matched text"
    }
  ],
  "scores": {
    "inattention": 4,
    "hyperactivity": 2,
    "impulsivity": 1,
    "emotional": 3,
    "executive": 2
  },
  "currentPhase": 1,
  "phaseComplete": false
}
```

#### POST /api/chat/advance
Advance to next phase.

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "newPhase": 2,
  "message": "Advanced to phase 2"
}
```

### Report Endpoints

#### POST /api/report/generate
Generate PDF report.

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response:** PDF file stream

---

## Configuration

### phases.js
Defines the 6 mission sectors.

```javascript
const PHASES = [
  {
    id: 0,
    name: 'Introduction',
    sectorName: 'Sector Alpha',
    icon: '👋',
    color: '#f97316',  // Orange
    description: 'Initial concerns and context',
    minExchanges: 2,
    maxExchanges: 3,
    dsmDomains: ['general']
  },
  {
    id: 1,
    name: 'Focus & Attention',
    sectorName: 'Sector Beta',
    icon: '🎯',
    color: '#3b82f6',  // Blue
    minExchanges: 3,
    maxExchanges: 5,
    dsmDomains: ['inattention']
  },
  // ... phases 2-5
];
```

### dsm5Patterns.js
Behavioral pattern definitions.

```javascript
const DSM5_PATTERNS = {
  inattention: [
    {
      id: 'difficulty_sustaining_attention',
      keywords: ['distracted', 'loses focus', 'cant concentrate'],
      weight: 2,
      description: 'Difficulty sustaining attention'
    },
    // ... more patterns
  ],
  hyperactivity: [...],
  impulsivity: [...],
  emotional: [...],
  executive: [...]
};
```

---

## DSM-5 Scoring System

### Domain Weights
Each pattern has a weight of 1-2 based on clinical significance.

### Score Calculation
```javascript
// Per domain
domainScore = sum(uniquePatternWeights)

// Total score
totalScore = sum(allDomainScores)

// Severity determination
if (totalScore < 15) severity = 'minimal';
else if (totalScore < 28) severity = 'mild';
else if (totalScore < 42) severity = 'moderate';
else severity = 'severe';
```

### Age-Adaptive Thresholds
```javascript
function getThreshold(age) {
  return age < 17 ? 6 : 5;
}

// Threshold met if domain has >= threshold unique symptoms
```

### Presentation Types
- **ADHD-C (Combined):** Both inattention AND hyperactivity-impulsivity thresholds met
- **ADHD-I (Inattentive):** Only inattention threshold met
- **ADHD-HI (Hyperactive-Impulsive):** Only hyperactivity-impulsivity threshold met

---

## Testing

### Running Tests
```bash
cd backend
node tests/runner.js
```

### Test Cases
- `test_cases.json` - 8 basic scenarios
- `test_cases_extended.json` - 12 extended scenarios

### Test Categories
1. **Negation handling** - "He's NOT distracted" should not trigger
2. **Mixed signals** - Strengths and challenges in same response
3. **Phase-specific** - Correct domain detection per phase
4. **Severity levels** - Appropriate severity classification

### Test Output
Results saved to `tests/results/`:
- `test_results.json` - Detailed results
- `metrics_report.json` - Accuracy metrics
- `test_output.txt` - Console log

---

## Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_key
MONGODB_URI=mongodb+srv://...
PORT=5000
SESSION_SECRET=strong_random_secret_32_chars
CORS_ORIGIN=https://your-domain.com
FINE_TUNED_MODEL=your_fine_tuned_model_id
```

### Build Commands
```bash
# Frontend build
cd frontend
npm run build

# Backend start
cd backend
npm start
```

### Recommended Stack
- **Frontend:** Vercel, Netlify
- **Backend:** Railway, Render, AWS
- **Database:** MongoDB Atlas

---

## Troubleshooting

### Common Issues

**MongoDB connection failed:**
```bash
# Check MongoDB is running
mongod --version
# Start MongoDB service
mongod
```

**OpenAI API errors:**
- Verify API key is valid
- Check fine-tuned model ID is correct
- Ensure sufficient API credits

**CORS errors:**
- Verify CORS_ORIGIN matches frontend URL
- Check both servers are running

**Session issues:**
- Clear browser cookies
- Restart backend server
- Check MongoDB connection

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

---

## Support

- **Developer:** [@Asmit-ctrl](https://github.com/Asmit-ctrl)
- **Issues:** GitHub Issues
- **Project:** Hack The Winter 2025

---

**Happy Coding! 🚀**
