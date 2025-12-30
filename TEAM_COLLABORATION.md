# NeuroFocus AI - Team Collaboration Document

## Project Overview
NeuroFocus AI is an intelligent ADHD screening and assessment application that uses adaptive conversational AI to conduct therapeutic interviews with parents and students. The system implements DSM-5 clinical criteria through a phase-based "Acknowledgment-Insight-Inquiry" conversation loop.

---

## Team Members & Roles

### 1. **Asmit Singh Bisht** - LLM Fine-tuning & AI Integration
**Responsibilities:**
- LLM model selection and fine-tuning for therapeutic conversations
- OpenAI integration and API management
- Response generation optimization using the Acknowledgment-Insight-Inquiry framework
- Prompt engineering for natural, empathetic clinical conversations
- Model performance monitoring and iterative improvements

**Key Components:**
- `src/services/OpenAIService.js` - OpenAI API wrapper and response generation
- `src/services/AdaptiveResponseGenerator.js` - Therapeutic response framework
- `src/config/` - Prompts and system instructions for LLM

**Deliverables:**
- Fine-tuned models for ADHD assessment conversations
- System prompts and response templates
- Integration tests for AI responses
- Performance benchmarks and optimization reports

---

### 2. **Aman Sarounia** - ADHD Research & Clinical Analysis
**Responsibilities:**
- DSM-5 clinical criteria research and implementation
- Behavioral indicator detection algorithms
- Clinical scoring engines and assessment metrics
- Validation of conversation flows against clinical standards
- Research on ADHD presentation patterns and diagnostic criteria

**Key Components:**
- `src/config/dsm5Patterns.js` - DSM-5 markers and indicator patterns
- `src/services/DSM5ScoringEngine.js` - Clinical scoring and severity calculation
- `src/services/CognitiveAnalyzer.js` - Behavioral analysis and indicator detection
- `src/config/phases.js` - Phase definitions and clinical goals
- `tests/` - Test cases covering DSM-5 criteria

**Deliverables:**
- DSM-5 implementation documentation
- Clinical validation reports
- Behavioral indicator patterns library
- Assessment methodology documentation
- Research findings on ADHD screening best practices

---

### 3. **Harsh Verma** - Frontend Development & UX
**Responsibilities:**
- React/Vue.js frontend application development
- User interface design for engaging conversations
- Real-time progress tracking and visualization (mission phases, focus meters)
- Responsive design for mobile and desktop
- User feedback integration and error handling

**Key Components:**
- Frontend application structure (React/Vue components)
- Chat interface components
- Progress visualization (mission phases, sector unlocking)
- Report display and export functionality
- Session management and authentication UI

**Deliverables:**
- Responsive web application
- Interactive mission phase UI
- Progress tracking dashboard
- Report generation and viewing interface
- Accessibility compliance (WCAG)
- Cross-browser compatibility testing

---

### 4. **Ritik** - Backend API & Database Development
**Responsibilities:**
- RESTful API design and implementation (Express.js)
- MongoDB database schema design and optimization
- Session management and data persistence
- PDF report generation
- API authentication, validation, and error handling
- Database indexing and query optimization

**Key Components:**
- `src/server.js` / `src/app.js` - Express server setup
- `src/routes/` - API endpoint definitions
- `src/controllers/` - Request handling and business logic
- `src/models/Conversation.js` - MongoDB schema and models
- `src/config/database.js` - Database connection and configuration
- `src/services/PDFReportGenerator.js` - Report generation

**Deliverables:**
- REST API documentation (OpenAPI/Swagger)
- Database schema documentation
- API authentication implementation
- Session storage and management
- Performance optimization reports
- Database backup and recovery procedures

---

## Technology Stack

### Frontend
- **Framework:** React / Vue.js
- **UI Components:** Custom components with Tailwind CSS or Material-UI
- **State Management:** Redux / Vuex (if needed)
- **API Communication:** Axios / Fetch API
- **Charts/Visualization:** Chart.js, D3.js
- **Real-time Updates:** WebSockets / Server-Sent Events

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **API Documentation:** Swagger/OpenAPI
- **PDF Generation:** PDFKit or similar library
- **Environment Management:** dotenv

### AI/ML Components
- **LLM Provider:** OpenAI GPT-4 / GPT-3.5-turbo
- **Prompt Engineering:** Template-based system prompts
- **Pattern Matching:** Regex-based keyword detection
- **Scoring Engine:** Rule-based clinical scoring system

### DevOps & Infrastructure
- **Version Control:** Git/GitHub
- **Containerization:** Docker
- **Hosting:** Cloud platform (AWS/GCP/Azure)
- **Testing:** Jest, Mocha/Chai
- **CI/CD:** GitHub Actions / GitLab CI

---

## Architecture & Data Flow

### Phase-Based Conversation System
```
User Input
    ↓
[CognitiveAnalyzer] - Extract DSM-5 indicators & behavioral patterns
    ↓
[ConversationStateMachine] - Track phase, exchanges, and transition criteria
    ↓
[AdaptiveResponseGenerator] - Generate empathetic, context-aware responses
    ↓
[OpenAIService/FallbackTemplates] - Generate or template final response
    ↓
[Conversation Model] - Store message, indicators, and metrics in MongoDB
    ↓
[Frontend] - Display response with progress tracking
```

### Core Services

#### 1. **CognitiveAnalyzer** (Aman's Domain)
- Detects DSM-5 indicators from user messages
- Analyzes behavioral patterns (inattention, hyperactivity, impulsivity, emotional dysregulation)
- Calculates confidence scores for each indicator
- Handles negation and positive context detection

#### 2. **DSM5ScoringEngine** (Aman's Domain)
- Aggregates indicators across conversation
- Calculates severity levels and presentation codes
- Maps indicators to DSM-5 diagnostic criteria
- Generates clinical recommendations

#### 3. **AdaptiveResponseGenerator** (Asmit's Domain)
- Implements Acknowledgment-Insight-Inquiry framework
- Manages phase transitions based on exchange count and indicator detection
- Generates personalized questions and acknowledgments
- Synchronizes conversation flow with therapeutic goals

#### 4. **OpenAIService** (Asmit's Domain)
- Handles all OpenAI API communications
- Manages API rate limiting and error handling
- Caches system prompts for efficiency
- Logs conversation quality metrics

#### 5. **PDFReportGenerator** (Ritik's Domain)
- Generates comprehensive ADHD assessment reports
- Includes DSM-5 scoring, severity levels, and clinical impressions
- Exports conversation summaries and recommendations
- Supports custom branding and headers

#### 6. **Session Management** (Ritik's Domain)
- User/session authentication and validation
- Conversation persistence in MongoDB
- Session timeout and cleanup
- Multi-session user support

---

## Development Workflow

### Phase 1: Setup & Planning (Week 1)
- [ ] Team meetings to align on requirements
- [ ] Database schema finalization (Ritik)
- [ ] API endpoint specifications (Ritik)
- [ ] LLM selection and testing (Asmit)
- [ ] DSM-5 criteria mapping (Aman)
- [ ] Frontend mockups (Harsh)

### Phase 2: Core Development (Weeks 2-4)
- [ ] Backend API implementation (Ritik)
- [ ] Database integration (Ritik)
- [ ] Frontend component development (Harsh)
- [ ] CognitiveAnalyzer implementation (Aman)
- [ ] DSM5ScoringEngine implementation (Aman)
- [ ] OpenAI integration (Asmit)
- [ ] Response generation templates (Asmit & Aman)

### Phase 3: Integration & Testing (Weeks 5-6)
- [ ] End-to-end testing (All)
- [ ] Clinical validation (Aman)
- [ ] Performance optimization (Asmit & Ritik)
- [ ] User acceptance testing (Harsh)
- [ ] Bug fixes and refinements (All)

### Phase 4: Deployment & Launch (Week 7)
- [ ] Production deployment (Ritik)
- [ ] Monitoring and logging setup (Ritik)
- [ ] Documentation finalization (All)
- [ ] Team training and handoff (All)

---

## Key Features & Implementation Details

### 1. Adaptive Conversation System
**Owner:** Asmit Singh Bisht (with Aman for clinical validation)

**Features:**
- Natural, empathetic conversation flow
- Automatic phase progression based on indicators and exchanges
- Contextual follow-up questions that avoid repetition
- Cool-down timer for rapid responses
- Engagement tracking

**Implementation:**
```javascript
// Acknowledgment-Insight-Inquiry Loop
1. Acknowledge: Validate what the user shared
2. Insight: Connect to DSM-5 understanding (if applicable)
3. Inquiry: Ask ONE new question moving the conversation forward
```

### 2. DSM-5 Clinical Assessment
**Owner:** Aman Sarounia

**Features:**
- Real-time indicator detection
- Severity level classification (Mild, Moderate, Severe)
- Presentation code assignment (Combined, Predominantly Inattentive, Predominantly Hyperactive)
- Confidence scoring for each indicator
- Multi-exchange pattern recognition

**Implementation:**
```javascript
DSM-5 CRITERIA:
- Inattention (9 criteria)
- Hyperactivity-Impulsivity (6 criteria)
- Requires ≥6 symptoms in one category AND onset before age 12
```

### 3. Phase-Based Mission System
**Owner:** Harsh Verma & Aman Sarounia

**Phases:**
0. **Introduction** - Build rapport and establish history
1. **Focus & Attention** - Assess inattention and concentration
2. **Energy & Movement** - Assess hyperactivity and restlessness
3. **Impulse Control** - Assess impulsivity and self-control
4. **Emotions** - Assess emotional dysregulation
5. **Strengths & Wrap-up** - Highlight strengths and complete assessment

**Progress Tracking:**
- Exchange counter per phase
- Indicator collection progress
- Visual progress bar
- Sector unlocking on phase completion

### 4. Report Generation
**Owner:** Ritik

**Features:**
- Comprehensive PDF reports with clinical findings
- DSM-5 scoring summary
- Severity recommendations
- Next steps and referrals
- Conversation transcript
- Customizable branding

---

## Communication & Collaboration Standards

### Code Review Process
1. **Feature Branch Creation:** `feature/component-name` or `fix/issue-name`
2. **Pull Request:** Include description, testing details, and screenshots
3. **Reviewer Assignment:** Based on component ownership (see team members)
4. **Merge Criteria:** ≥1 approval, all tests passing, no conflicts

### Documentation Standards
- **Code Comments:** Explain "why" not "what"
- **Function Documentation:** JSDoc for all exported functions
- **API Documentation:** OpenAPI/Swagger specification
- **Clinical Documentation:** Include DSM-5 references for behavioral components

### Meeting Schedule
- **Daily Standup:** 10 AM IST (15 minutes)
  - Current progress, blockers, next steps
- **Weekly Technical Sync:** Tuesday 2 PM IST (1 hour)
  - Architecture decisions, integration points
- **Weekly Clinical Review:** Thursday 3 PM IST (1 hour)
  - DSM-5 implementation, test case validation
- **Sprint Planning:** Every 2 weeks Monday 10 AM IST

### Communication Channels
- **Code/Architecture:** GitHub Issues & Pull Requests
- **Real-time Chat:** Slack/Teams
- **Documentation:** Shared Google Docs / Notion
- **Meetings:** Google Meet / Zoom

---

## API Endpoints (Ritik's Responsibility)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Chat/Conversation
- `POST /api/chat` - Send message and receive AI response
- `GET /api/conversations/:sessionId` - Retrieve conversation history
- `POST /api/conversations/:sessionId/start` - Start new session
- `POST /api/conversations/:sessionId/end` - End session

### Reports
- `GET /api/reports/:sessionId` - Get assessment report
- `POST /api/reports/:sessionId/export` - Export report as PDF
- `GET /api/reports/:sessionId/score` - Get DSM-5 scoring

### Sessions
- `GET /api/sessions` - List user sessions
- `GET /api/sessions/:sessionId` - Get session details
- `PUT /api/sessions/:sessionId` - Update session metadata

---

## Database Schema (Ritik's Responsibility)

### Conversation Model
```javascript
{
  _id: ObjectId,
  sessionId: String,
  userId: String,
  userType: String, // 'parent' or 'student'
  name: String,
  age: Number,
  messages: [{
    sender: String, // 'user' or 'ai'
    text: String,
    timestamp: Date,
    responseTime: Number // milliseconds
  }],
  indicators: [{
    domain: String, // 'inattention', 'hyperactivity', 'impulsivity', 'emotional'
    confidence: Number,
    severity: String,
    timestamp: Date,
    phaseId: Number
  }],
  currentPhase: Number,
  phaseExchanges: Number,
  totalExchanges: Number,
  dsmScoring: {
    inattentionScore: Number,
    hiScore: Number,
    totalScore: Number,
    severityLevel: String,
    presentationCode: String
  },
  cognitiveState: {
    focusScore: Number,
    impulsivityScore: Number,
    engagementLevel: String,
    coolDownTriggered: Boolean,
    shortResponseStreak: Number
  },
  sectorsUnlocked: [Number],
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

---

## Testing Strategy

### Unit Tests (All Team Members)
- Service functions (CognitiveAnalyzer, DSM5ScoringEngine, etc.)
- Utility functions and helpers
- Database models and queries
- API endpoint handlers

### Integration Tests (Ritik + Asmit)
- End-to-end chat flow
- API integration with database
- LLM response generation and processing
- Phase transitions and state management

### Clinical Validation Tests (Aman)
- DSM-5 criterion mapping accuracy
- Indicator detection on clinical cases
- Severity scoring validation
- Edge case handling for atypical presentations

### UI/UX Tests (Harsh)
- Component rendering and interaction
- Responsive design across devices
- Accessibility compliance
- User flow and navigation

### Performance Tests (Ritik + Asmit)
- API response time (<500ms target)
- LLM token usage and cost optimization
- Database query optimization
- Frontend bundle size and load time

---

## Known Issues & Technical Debt

### Current Blockers
- [ ] LLM response latency during peak hours
- [ ] Database query optimization for conversation retrieval
- [ ] Mobile UI responsiveness on smaller screens
- [ ] Edge cases in negation pattern detection

### Technical Debt
- Refactor indicator detection into modular classes
- Add comprehensive logging and monitoring
- Implement caching for frequently accessed patterns
- Create comprehensive API documentation with examples

---

## Success Metrics

### Clinical Outcomes
- DSM-5 diagnostic accuracy >90%
- User satisfaction score >4.5/5
- Conversation completion rate >85%
- Session time 20-30 minutes average

### Technical Metrics
- API uptime >99.5%
- Response time <500ms (p95)
- LLM token cost <$0.50 per session
- Bug fix rate <5% post-deployment

### User Engagement
- Session completion rate >85%
- Phase transition success >95%
- User retention >70%
- Referral rate >30%

---

## Resources & References

### DSM-5 Resources
- American Psychiatric Association (2013). Diagnostic and Statistical Manual of Mental Disorders (5th ed.)
- ADHD diagnostic criteria and coding
- Severity level classifications

### LLM/AI Resources
- OpenAI API documentation
- Prompt engineering best practices
- Fine-tuning guidelines for medical applications

### Technical Resources
- Express.js and MongoDB documentation
- React/Vue.js component libraries
- Patient privacy regulations (HIPAA/GDPR considerations)

---

## Contact & Escalation

- **Asmit Singh Bisht** (LLM & AI): asmit@neurofocus.ai
- **Aman Sarounia** (Clinical): aman@neurofocus.ai
- **Harsh Verma** (Frontend): harsh@neurofocus.ai
- **Ritik** (Backend): ritik@neurofocus.ai

**Project Manager/Lead:** TBD

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-31 | Initial team collaboration document | Team |
| | | | |

---

**Last Updated:** December 31, 2025
**Next Review:** January 15, 2026
