# End-to-End Test Suite for ADHD Screening AI

## Overview
This test suite simulates complete user journeys from onboarding through conversation to final report generation. It validates AI diagnostic accuracy, phase progression, domain detection, and PDF report generation.

## Test Cases

### 1. Comprehensive Combined Presentation
- **User**: Parent of 9-year-old Charlie
- **Scenario**: 14 messages covering all phases (Introduction → Focus → Energy → Impulse → Emotions → Strengths)
- **Expected**: Detects inattention (3+ indicators), hyperactivity (3+ indicators), impulsivity (3+ indicators), emotional dysregulation (2+ indicators)
- **Validates**: Full conversation flow, phase transitions, canEnd constraint, PDF generation

### 2. Inattentive Presentation
- **User**: 14-year-old Alex (self-report)
- **Scenario**: Primarily inattention symptoms, minimal hyperactivity/impulsivity
- **Expected**: Strong inattention detection, low hyperactivity, low impulsivity
- **Validates**: Correct subtype detection, doesn't over-diagnose

### 3. Negative Control
- **User**: Parent of 10-year-old Emma
- **Scenario**: Typical child behavior without ADHD symptoms
- **Expected**: Few or no indicators detected (max 2 total)
- **Validates**: System doesn't over-diagnose, handles negative cases appropriately

## Files
- **test_cases.json** — Test scenarios with expected outcomes
- **runner.js** — Node.js test runner that exercises endpoints and validates responses
- **results/** — Generated directory containing:
  - `test_results.json` — Detailed pass/fail results with validation data
  - `*_report.pdf` — Generated PDF reports for each test case

## How to Run

### Prerequisites
1. **MongoDB**: Must be running and accessible
2. **Backend Server**: Must be running on port 4000 (or set BASE_URL env var)
3. **OpenAI API Key**: Must be configured in backend .env file

### Running Tests (PowerShell on Windows)

1. **Start your backend server** (in a separate terminal):
   ```powershell
   cd 'e:\code\Bhimtal hack\backend'
   node src/server.js
   ```

2. **Run the test suite**:
   ```powershell
   cd 'e:\code\Bhimtal hack\backend\tests'
   node runner.js
   ```

3. **Optional: Set custom BASE_URL**:
   ```powershell
   $env:BASE_URL = "http://localhost:5000/api"
   node runner.js
   ```

### Expected Output
The runner will:
- ✅ Create a session for each test case
- ✅ Send all messages in sequence with delays
- ✅ Validate domain detection for each message
- ✅ Check phase progression and canEnd constraints
- ✅ Verify final summary against expected outcomes
- ✅ Generate PDF reports
- ✅ Display detailed console output with pass/fail status
- ✅ Write JSON results to `results/test_results.json`

### Sample Output
```
======================================================================
  ADHD SCREENING AI - END-TO-END TEST SUITE
======================================================================

[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]
  TEST: Comprehensive ADHD Screening - Combined Presentation
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]

  → Starting session for Charlie (parent, age 9)...
  ✓ Session created: 67a8f...

  Conversation Flow:

  [Message 1/14]
  → Sending message (expected phase: Introduction)...
  ✓ AI Response received (phase: Introduction)
  ✓ Detected domains: inattention, impulsivity

  [Message 2/14]
  → Sending message (expected phase: Focus & Attention)...
  ✓ AI Response received (phase: Focus & Attention)
  ✓ Detected domains: inattention
  
  ...

  Final Validation:
  ✓ Summary validation passed
  ✓ PDF saved: results/comprehensive_combined_presentation_report.pdf

  ──────────────────────────────────────────────────────────────────
  ✅ TEST PASSED
  ──────────────────────────────────────────────────────────────────
```

## Validation Criteria

The test runner validates:

1. **Domain Detection**
   - Each message checks if expected DSM-5 domains are detected
   - Patterns include domain, severity, DSM criteria matching

2. **Phase Progression**
   - Ensures phases advance in correct order
   - Validates `canEnd` is false until final phase

3. **Summary Accuracy**
   - Verifies minimum indicator counts per domain
   - Checks total indicators meet thresholds
   - Validates negative controls don't over-diagnose

4. **Report Generation**
   - Confirms PDF reports can be generated
   - Files saved to `results/` directory

## Troubleshooting

### Error: Connection refused (ECONNREFUSED)
**Cause**: Backend server not running  
**Fix**: Start backend with `node src/server.js` in separate terminal

### Error: No session id returned
**Cause**: /session/start endpoint failing  
**Fix**: Check MongoDB connection, verify endpoint exists at `/api/session/start`

### Error: Unexpected status 500
**Cause**: Server error during processing  
**Fix**: Check backend logs, verify OpenAI API key is valid

### Tests pass but PDFs not generating
**Cause**: PDF endpoint may be failing silently  
**Fix**: Check `/api/session/:id/report/pdf` route, verify pdfkit installation

## Advanced Usage

### Run specific test only
Edit `test_cases.json` and comment out other tests, or modify `runner.js`:
```javascript
const tests = { comprehensive_combined_presentation: allTests.comprehensive_combined_presentation };
```

### Adjust timeouts
Add delays between messages:
```javascript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second
```

### Debug mode
Set verbose logging in runner.js:
```javascript
console.log('Full response:', JSON.stringify(resp, null, 2));
```

## Results Interpretation

### test_results.json Structure
```json
{
  "test": "comprehensive_combined_presentation",
  "name": "Comprehensive ADHD Screening - Combined Presentation",
  "pass": true,
  "messageResults": [...],
  "summary": {
    "totalIndicators": 14,
    "domains": [
      { "domain": "inattention", "count": 4 },
      { "domain": "hyperactivity", "count": 3 },
      { "domain": "impulsivity", "count": 3 },
      { "domain": "emotional", "count": 4 }
    ]
  },
  "pdfGenerated": true
}
```

## Integration with CI/CD
To run in CI pipeline:
```bash
npm install axios
node runner.js
exit $?  # Exit with test status code
```
