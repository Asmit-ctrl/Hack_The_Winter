# 🧠 NeuroFocus - AI-Powered ADHD Screening Platform

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Asmit-ctrl/Hack_The_Winter)
[![Node](https://img.shields.io/badge/node-16+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**India's First AI-Powered ADHD Mission Control Platform**

> Transforming ADHD screening from clinical questionnaires to gamified therapeutic journeys for K-12 students (ages 6-17)
---

## 🌟 What is NeuroFocus?

NeurozFocus is an intelligent ADHD screening platform for children aged 6-17 that uses:

- **Conversational AI** (Fine-tuned GPT-3.5-turbo) for natural, adaptive assessments
- **DSM-5 Clinical Scoring** for medical-grade accuracy
- **Professional PDF Reports** to share with healthcare providers

### Who Can Use It

| User Type | Description |
|-----------|-------------|
| 👨‍👩‍👧 **Parents** | Answer questions about your child's behavior at home |
| 👨‍🏫 **Teachers** | Share classroom observations and academic patterns |
| 🧑 **Teens (13-17)** | Complete self-assessment with guidance |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📖 [**USER_GUIDE.md**](./USER_GUIDE.md) | Complete usage guide for parents, teachers, teens |
| 👨‍💻 [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) | Technical setup, architecture, API documentation |
| 🚀 [**INNOVATION_USP_IMPACT.md**](./INNOVATION_USP_IMPACT.md) | Innovation features, USP, and societal impact |
| 🔬 [**RESEARCH_WORK.md**](./RESEARCH_WORK.md) | Research foundation, clinical validation, citations |

---

## ✨ Key Features

### 🧠 AI-Powered Assessment
- Fine-tuned GPT-3.5-turbo for natural conversations
- Real-time pattern detection (60+ behavioral indicators)
- Context-aware follow-up questions
- Negation detection to avoid false positives

### 📊 Clinical Accuracy
- DSM-5 compliant scoring algorithm
- 5 ADHD domains: Inattention, Hyperactivity, Impulsivity, Emotional, Executive Function
- Age-adaptive symptom thresholds (6+ symptoms for ages 6-16, 5+ for ages 17+)
- Weighted indicator scoring (1-2 per pattern)

### 📄 Professional Reports
- Downloadable PDF with domain scores
- Complete conversation transcript
- Clinical recommendations
- Shareable with healthcare providers

### ♿ Cognitive-Friendly Design
- **Zen Mode** - Reduce visual distractions
- **Cool-Down Timer** - Prevent rushing through questions
- **Focus Meter** - Real-time engagement feedback
- **Pattern Toasts** - Non-intrusive indicator notifications


---

## 🎯 The 6 Assessment Phases

| Phase | Name | Focus Area | Icon |
|-------|------|------------|------|
| 0 | **Alpha** | Introduction & Context | 👋 |
| 1 | **Beta** | Focus & Attention | 🎯 |
| 2 | **Gamma** | Energy & Movement | ⚡ |
| 3 | **Delta** | Impulse Control | ⏱️ |
| 4 | **Epsilon** | Emotional Regulation | 💭 |
| 5 | **Omega** | Strengths & Wrap-up | ⭐ |

Each phase contains 2-5 conversational exchanges designed to assess specific DSM-5 criteria naturally.

---

## 📊 Understanding Results

### Severity Levels

| Level | Total Score | Interpretation |
|-------|-------------|----------------|
| 🟢 **Minimal** | < 15 | Few or no significant indicators detected |
| 🟡 **Mild** | ≥ 15 | Notable patterns present; monitoring recommended |
| 🟠 **Moderate** | ≥ 28 | Significant patterns; professional evaluation advised |
| 🔴 **Severe** | ≥ 42 | Multiple strong indicators; comprehensive evaluation recommended |

### The 5 ADHD Domains

| Domain | What It Measures |
|--------|------------------|
| 🎯 **Inattention** | Focus problems, task completion, organization, forgetfulness |
| ⚡ **Hyperactivity** | Excessive movement, fidgeting, restlessness, can't stay seated |
| ⏱️ **Impulsivity** | Acting without thinking, interrupting, difficulty waiting |
| 💭 **Emotional** | Frustration tolerance, mood swings, emotional reactions |
| 🧠 **Executive Function** | Planning, time management, task initiation, working memory |

### Age-Based Thresholds

| Age Group | Symptom Threshold |
|-----------|-------------------|
| Ages 6-16 | 6+ symptoms for clinical significance |
| Ages 17+ | 5+ symptoms for clinical significance |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- MongoDB 5+
- OpenAI API Key

### Installation

```bash
# Clone repository
git clone https://github.com/Asmit-ctrl/Hack_The_Winter.git
cd Hack_The_Winter

# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### Environment Configuration

Create `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=mongodb://localhost:27017/neurofocus
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_random_32_char_secret
CORS_ORIGIN=http://localhost:3000
FINE_TUNED_MODEL=ft:gpt-3.5-turbo-0125:helling-aura::CsEvcJqe
```

### Running the Application

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

Access the application at `http://localhost:3000`

---

## 🏗️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, CSS3, Lucide React | 18.2.0 |
| **Backend** | Node.js, Express | 4.18.2 |
| **Database** | MongoDB, Mongoose | 8.0.3 |
| **AI** | Fine-tuned GPT-3.5-turbo (OpenAI) | 4.24.1 |
| **Reports** | PDFKit | 0.14.0 |

---

## 📁 Project Structure

---<img width="1440" height="780" alt="Blank diagram (6)" src="https://github.com/user-attachments/assets/e8669560-6529-4aa3-bf5a-eef4f0bdf930" />

```
Hack_The_Winter/
├── backend/
│   └── src/
│       ├── config/          # Phases, DSM-5 patterns, database
│       ├── controllers/     # Session, chat, report handlers
│       ├── services/        # AI, scoring engine, PDF generator
│       ├── models/          # MongoDB schemas
│       ├── routes/          # API endpoints
│       └── middleware/      # Error handling, validation
├── frontend/
│   └── src/
│       ├── components/      # 20+ React components
│       ├── context/         # App state management
│       ├── hooks/           # Custom React hooks
│       └── config/          # Frontend configuration
└── docs/
    ├── README.md
    ├── USER_GUIDE.md
    ├── DEVELOPER_GUIDE.md
    ├── INNOVATION_USP_IMPACT.md
    └── RESEARCH_WORK.md
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions/create` | Create new screening session |
| `POST` | `/api/chat/message` | Send message, receive AI response |
| `POST` | `/api/chat/advance` | Advance to next phase |
| `GET` | `/api/sessions/:id` | Retrieve session data |
| `POST` | `/api/report/generate` | Generate PDF report |

---

## 💡 Answer Quality Tips

### Good vs. Poor Responses

| Topic | ❌ Vague | ✅ Specific |
|-------|---------|-------------|
| **Focus** | "Struggles with homework" | "Takes 3 hours for 30-min homework, gets up every 5 minutes" |
| **Energy** | "Can't sit still" | "Up 5+ times per meal, fidgets constantly even while chewing" |
| **Impulse** | "Sometimes interrupts" | "Interrupts every conversation, can't wait 10 seconds before blurting" |
| **Emotions** | "Gets upset" | "Cries for 20+ minutes over small things, throws items when frustrated" |

### Best Practices

- ✓ Observe patterns over 6+ months
- ✓ Compare to same-age children
- ✓ Consider multiple settings (home, school, social)
- ✓ Be specific with examples and frequency
- ✓ Take your time (quality over speed)

---

## 🔬 Research Foundation

Neurofocus is built on validated clinical research:

- **Prevalence:** 12M+ Indian children affected (6-17% prevalence studies)
- **Diagnostic Gap:** 80% of cases undiagnosed, 6+ month waitlists at NIMHANS
- **Clinical Basis:** DSM-5 criteria, Vanderbilt ADHD Scale (91.8% sensitivity)
- **AI Validation:** Conversational AI screening shows 82% agreement with clinicians

📖 **See [RESEARCH_WORK.md](./RESEARCH_WORK.md) for complete citations and methodology**

---

## 🌍 Impact

| Metric | Current State | NeuroFocus Solution |
|--------|---------------|-------------------|
| **Affected** | 12M+ Indian K-12 students | Accessible screening for all |
| **Diagnosed** | <20% (80% missed) | Early identification tool |
| **Waitlists** | 6+ months at centers | Instant preliminary screening |
| **Cost** | ₹5,000-15,000 per evaluation | Free screening access |
| **Coverage** | Urban centers only | Works anywhere with internet |

---

## ⚠️ Important Disclaimer

### What NeuroNav IS:

- ✅ A structured screening questionnaire
- ✅ A pattern identification tool
- ✅ A report to share with healthcare providers
- ✅ A conversation starter for professional evaluation

### What NeuroNav is NOT:

- ❌ A medical diagnosis
- ❌ A replacement for professional evaluation
- ❌ Sufficient for treatment decisions

**Only licensed mental health professionals can diagnose ADHD.** Always consult a qualified healthcare provider for comprehensive evaluation.

---

## 📱 During the Assessment

### Available Features

| Feature | Purpose |
|---------|---------|
| 🧘 **Zen Mode** | Reduce visual distractions for better focus |
| ⏰ **Cool-Down Timer** | Prevents rushing, encourages thoughtful responses |
| 📊 **Pattern Toasts** | Real-time feedback on detected patterns |
| 📈 **Focus Meter** | Engagement quality indicator |
| 💡 **Hints** | Example answers for guidance |

---

## ❓ FAQ

| Question | Answer |
|----------|--------|
| **How long does it take?** | 15-25 minutes. Take your time for accuracy. |
| **Can I save and return?** | Currently, complete in one session. |
| **Should my child be present?** | For parent/teacher - no. For teen self-assessment - yes. |
| **High scores - what now?** | Download PDF and schedule healthcare appointment. |
| **Are results accurate?** | Uses DSM-5 criteria, but only professionals can diagnose. |
| **Can I reassess later?** | Yes! Reassess after several months to track changes. |

---

## 🧪 Testing

```bash
cd backend
node tests/runner.js
```

Results saved in `tests/results/`

---

## 🔒 Privacy & Security

- 🔒 Secure session-based storage
- 🔒 Data stored locally in your MongoDB instance
- 🔒 Reports accessible only to you
- 🔒 No third-party data sharing

---

## 📞 Support

- **Technical Issues:** [Open GitHub Issue](https://github.com/Asmit-ctrl/Hack_The_Winter/issues)
- **Developer:** [@Asmit-ctrl](https://github.com/Asmit-ctrl)

**For clinical concerns, always consult a qualified healthcare provider.**

---

## 👨‍💻 Developer

**Asmit** - [@Asmit-ctrl](https://github.com/Asmit-ctrl)

**Project:** Hack The Winter 2025

---

## 🙏 Acknowledgments

- **American Psychiatric Association** - DSM-5 criteria
- **OpenAI** - Fine-tuned GPT-3.5-turbo API
- **NIMHANS** - Indian ADHD research foundation
- **React Community** - Frontend framework
- **Indian ADHD Advocacy Organizations** - Awareness efforts

---


---

## 📖 Related Documentation

- [USER_GUIDE.md](./USER_GUIDE.md) - Detailed usage instructions
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Technical setup guide
- [INNOVATION_USP_IMPACT.md](./INNOVATION_USP_IMPACT.md) - Innovation & roadmap
- [RESEARCH_WORK.md](./RESEARCH_WORK.md) - Research foundation & citations

---

**Made with ❤️ for India's neurodivergent students**
