# DevOps Oracle - Implementation Checklist

This checklist ensures you don't miss any critical components during the 48-hour hackathon build.

## 📋 Phase 0: Environment Setup (Hours 0-4)

### Project Initialization
- [ ] Create project directory: `devops-oracle/`
- [ ] Run `npm init -y`
- [ ] Create `.gitignore` with node_modules, .env, .DS_Store
- [ ] Initialize git repository: `git init`
- [ ] Create initial commit

### Dependencies Installation
```bash
# Backend dependencies
npm install express mongoose dotenv cors morgan axios

# Development dependencies
npm install -D nodemon concurrently jest

# React dashboard (separate)
npx create-react-app dashboard
cd dashboard
npm install @tanstack/react-query axios date-fns
npm install -D tailwindcss
```

- [ ] All backend dependencies installed
- [ ] React app created
- [ ] Dev dependencies installed

### Directory Structure
```
devops-oracle/
├── .bob/
│   └── mcp.json
├── bob-prompts/
│   ├── orchestrator.md
│   ├── log-analysis.md
│   ├── repo-analysis.md
│   └── fix-generation.md
├── server/
│   ├── index.js
│   ├── routes/
│   │   └── webhook.js
│   ├── orchestrator.js
│   ├── agents/
│   │   ├── log-agent.js
│   │   ├── repo-agent.js
│   │   └── history-agent.js
│   └── middleware/
│       ├── logger.js
│       └── auth.js
├── dashboard/
│   └── src/
│       ├── components/
│       │   ├── IncidentFeed.jsx
│       │   ├── PipelineStatus.jsx
│       │   ├── RootCauseCard.jsx
│       │   └── PRStatus.jsx
│       ├── App.jsx
│       └── index.jsx
├── db/
│   ├── connect.js
│   └── models/
│       └── Incident.model.js
├── scripts/
│   ├── simulate-alert.sh
│   └── check-mcp.js
├── mock-data/
│   ├── logs/
│   │   └── sample-error.log
│   └── incidents/
│       └── seed-data.json
├── .env.example
├── package.json
└── README.md
```

- [ ] All directories created
- [ ] All files scaffolded (can be empty initially)

### MCP Configuration
- [ ] Create `.bob/mcp.json` with GitHub MCP config
- [ ] Test GitHub MCP connection: `bob mcp test github`
- [ ] (Optional) Add PagerDuty MCP config
- [ ] (Optional) Add Slack MCP config

### Environment Variables
Create `.env.example`:
```
GITHUB_TOKEN=your_github_token_here
MONGODB_URI=mongodb://localhost:27017/devops-oracle
PORT=3000
NODE_ENV=development
PAGERDUTY_API_TOKEN=your_pagerduty_token_here
SLACK_BOT_TOKEN=your_slack_token_here
SLACK_CHANNEL=#incidents
```

- [ ] `.env.example` created
- [ ] Copy to `.env` and fill in actual tokens
- [ ] Verify `.env` is in `.gitignore`

### Basic Server Setup
- [ ] Create `server/index.js` with Express app
- [ ] Add basic route: `GET /health` returns 200
- [ ] Test server starts: `node server/index.js`
- [ ] Add nodemon script: `"dev": "nodemon server/index.js"`

---

## 📋 Phase 1: Webhook Receiver (Hours 4-6)

### Express Webhook Endpoint
- [ ] Create `server/routes/webhook.js`
- [ ] Implement `POST /webhook/pagerduty` handler
- [ ] Return 200 OK immediately (async processing)
- [ ] Log incoming webhook payload
- [ ] Test with curl command

### Test Script
Create `scripts/simulate-alert.sh`:
```bash
#!/bin/bash
curl -X POST http://localhost:3000/webhook/pagerduty \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [{
      "event": {
        "id": "INC-DEMO-001",
        "data": {
          "id": "INC-DEMO-001",
          "title": "NullPointerException in OrderService.processRefund()",
          "urgency": "high",
          "service": { "summary": "order-service" },
          "created_at": "2026-05-02T03:00:00Z",
          "body": {
            "details": {
              "logs_url": "http://localhost:3001/mock-logs/INC-DEMO-001"
            }
          }
        }
      }
    }]
  }'
```

- [ ] Script created and executable: `chmod +x scripts/simulate-alert.sh`
- [ ] Test script successfully triggers webhook
- [ ] Server logs show received payload

---

## 📋 Phase 2: Bob Orchestrator (Hours 6-12)

### Orchestrator Prompt
Create `bob-prompts/orchestrator.md`:
```markdown
# DevOps Oracle - Orchestrator Prompt

You are DevOps Oracle, an autonomous incident response agent.
A production alert has fired with the following details:

ALERT_ID: {{alert.id}}
SERVICE: {{alert.service}}
TITLE: {{alert.title}}
SEVERITY: {{alert.severity}}
FIRED_AT: {{alert.fired_at}}
LOGS_URL: {{alert.logs_url}}

Execute the following investigation plan in order:

STEP 1 — Post to console: 'DevOps Oracle activated for {{alert.title}}'
STEP 2 — Dispatch Log Agent: fetch logs from LOGS_URL, extract error signature
STEP 3 — Dispatch Repo Agent: use GitHub MCP to find the file/function in stack trace
STEP 4 — Synthesize findings into a Root Cause Report (structured JSON)
STEP 5 — Switch to Code mode. Write a hotfix with inline comment
STEP 6 — Switch to Advanced mode. Run relevant tests via BobShell
STEP 7 — If tests pass: use GitHub MCP to open a PR
STEP 8 — Post PR link to console

CONSTRAINTS:
- Never merge a PR. Human approval is always required.
- If confidence in root cause is below HIGH, halt and notify.
```

- [ ] Orchestrator prompt created
- [ ] Prompt tested with Bob in Plan mode
- [ ] Bob outputs numbered investigation steps

### Orchestrator Implementation
- [ ] Create `server/orchestrator.js`
- [ ] Function to load and populate prompt template
- [ ] Function to trigger Bob with prompt
- [ ] Function to parse Bob's response
- [ ] Test: Bob receives alert and creates plan

---

## 📋 Phase 3: Log Agent (Hours 8-12)

### Mock Log Data
Create `mock-data/logs/sample-error.log`:
```
2026-05-02T02:58:43Z INFO [order-service] Processing refund request
2026-05-02T02:58:44Z INFO [order-service] Validating refund amount
2026-05-02T02:58:45Z ERROR [order-service] NullPointerException in OrderService.processRefund()
2026-05-02T02:58:45Z ERROR [order-service] Stack trace:
2026-05-02T02:58:45Z ERROR [order-service]   at com.example.OrderService.processRefund(OrderService.java:342)
2026-05-02T02:58:45Z ERROR [order-service]   at com.example.RefundController.handleRefund(RefundController.java:89)
2026-05-02T02:58:45Z ERROR [order-service] Request ID: req-abc-123
2026-05-02T02:58:45Z ERROR [order-service] User ID: user-456
```

- [ ] Mock log file created
- [ ] Simple HTTP server to serve logs (or use file:// URL)

### Log Agent Prompt
Create `bob-prompts/log-analysis.md`:
```markdown
# Log Analysis Agent

Analyze the following log output and extract:
1. Error signature (error type + location)
2. Stack trace (file, line number, function)
3. Timestamp window (when error occurred)
4. Request context (request ID, user ID if present)

Return structured JSON:
{
  "error_signature": "NullPointerException in OrderService.processRefund()",
  "stack_trace": "OrderService.java:342",
  "timestamp": "2026-05-02T02:58:45Z",
  "request_id": "req-abc-123",
  "confidence": "HIGH"
}
```

- [ ] Log analysis prompt created
- [ ] Test with Bob in Ask mode

### Log Agent Implementation
- [ ] Create `server/agents/log-agent.js`
- [ ] Function: `analyzeIncidentLogs(logs_url)`
- [ ] Fetch logs from URL
- [ ] Filter ERROR/WARN lines
- [ ] Extract error signature and stack trace
- [ ] Return structured JSON
- [ ] Test with mock log file

---

## 📋 Phase 4: Demo Repository Setup (Hours 12-14)

### Create Demo App Repository
- [ ] Create new GitHub repo: `devops-oracle-demo-app`
- [ ] Initialize with simple Node.js app
- [ ] Create `OrderService.js` with intentional bug

Example `OrderService.js`:
```javascript
class OrderService {
  processRefund(refund) {
    // BUG: Missing null check (removed in commit abc123)
    const amount = refund.getAmount(); // Will throw if refund is null
    
    if (amount > 0) {
      return this.executeRefund(amount);
    }
    throw new Error('Invalid refund amount');
  }
  
  executeRefund(amount) {
    console.log(`Processing refund: $${amount}`);
    return { success: true, amount };
  }
}

module.exports = OrderService;
```

- [ ] Demo repo created
- [ ] Bug introduced in specific commit
- [ ] Commit message: "Remove unnecessary null check"
- [ ] 2-3 simple unit tests created

### Test Files
Create `OrderService.test.js`:
```javascript
const OrderService = require('./OrderService');

describe('OrderService', () => {
  test('should process valid refund', () => {
    const service = new OrderService();
    const refund = { getAmount: () => 50 };
    const result = service.processRefund(refund);
    expect(result.success).toBe(true);
  });
  
  test('should handle null refund gracefully', () => {
    const service = new OrderService();
    expect(() => service.processRefund(null)).toThrow();
  });
});
```

- [ ] Tests created
- [ ] Tests fail with current bug
- [ ] Tests will pass after fix

---

## 📋 Phase 5: Repo Agent (Hours 14-18)

### Repo Agent Prompt
Create `bob-prompts/repo-analysis.md`:
```markdown
# Repository Analysis Agent

Given this stack trace: {{stack_trace}}

Use GitHub MCP to:
1. Search for the file mentioned in stack trace
2. Get current file contents
3. List last 5 commits to that file
4. Identify which commit likely introduced the bug
5. Get diff of that commit

Return structured JSON:
{
  "file_path": "OrderService.java",
  "line_number": 342,
  "function_name": "processRefund",
  "suspect_commit": "abc123",
  "commit_author": "dev-ali",
  "commit_date": "2026-05-01T18:44:00Z",
  "commit_message": "Remove unnecessary null check",
  "confidence": "HIGH"
}
```

- [ ] Repo analysis prompt created

### Repo Agent Implementation
- [ ] Create `server/agents/repo-agent.js`
- [ ] Function: `analyzeRepository(stack_trace, repo_owner, repo_name)`
- [ ] Use GitHub MCP to search code
- [ ] Use GitHub MCP to get file contents
- [ ] Use GitHub MCP to list commits
- [ ] Parse commit history to find suspect
- [ ] Return structured JSON
- [ ] Test with demo repository

---

## 📋 Phase 6: Root Cause Synthesis (Hours 18-20)

### Synthesis Logic
- [ ] Create function in `server/orchestrator.js`
- [ ] Combine Log Agent output + Repo Agent output
- [ ] Generate confidence level (HIGH/MEDIUM/LOW)
- [ ] Create structured Root Cause Report

Root Cause Report Format:
```json
{
  "incident_id": "INC-DEMO-001",
  "root_cause": "NullPointerException in OrderService.processRefund() - missing null check",
  "error_signature": "NullPointerException",
  "file_path": "OrderService.java",
  "line_number": 342,
  "function_name": "processRefund",
  "suspect_commit": "abc123",
  "commit_author": "dev-ali",
  "commit_date": "2026-05-01T18:44:00Z",
  "commit_message": "Remove unnecessary null check",
  "confidence": "HIGH",
  "recommendation": "Add null check before calling refund.getAmount()"
}
```

- [ ] Synthesis function implemented
- [ ] Confidence calculation logic added
- [ ] Test with mock data

---

## 📋 Phase 7: Fix Generation (Hours 20-26)

### Fix Generation Prompt
Create `bob-prompts/fix-generation.md`:
```markdown
# Hotfix Generation

Root Cause: {{root_cause}}
File: {{file_path}}
Line: {{line_number}}
Function: {{function_name}}

Current code:
{{current_code}}

Instructions:
1. Write the minimal fix that resolves the root cause
2. Add inline comment: // DEVOPS ORACLE FIX — {{incident_id}} — {{root_cause}}
3. Do NOT refactor unrelated code
4. Preserve original intent
5. Show the diff before applying

Expected fix:
- Add null check before line {{line_number}}
- Throw appropriate error if null
```

- [ ] Fix generation prompt created

### Fix Implementation
- [ ] Bob generates fix in Code mode
- [ ] Fix includes inline audit comment
- [ ] Fix is minimal and targeted
- [ ] Test: Bob writes correct fix for demo bug

---

## 📋 Phase 8: Test Execution (Hours 24-28)

### BobShell Test Runner
- [ ] Create test execution logic in `server/orchestrator.js`
- [ ] Use Bob Advanced mode to run: `npm test`
- [ ] Parse test output (pass/fail)
- [ ] If tests fail: retry with failure context (max 2 retries)
- [ ] If tests pass: proceed to PR creation

Test Execution Flow:
```javascript
async function runTests(fixedFilePath) {
  const result = await bobShell.execute('npm test -- OrderService.test.js');
  
  if (result.exitCode === 0) {
    return { passed: true, output: result.stdout };
  } else {
    return { passed: false, output: result.stderr };
  }
}
```

- [ ] Test runner implemented
- [ ] Retry logic added
- [ ] Test output parsing works

---

## 📋 Phase 9: PR Creation (Hours 28-32)

### PR Template
Create `bob-prompts/pr-template.md`:
```markdown
# Pull Request Template

Title: fix({{service}}): {{root_cause_summary}} — {{incident_id}}

Body:
## Incident: {{incident_id}}

**Root Cause:** {{root_cause}}

**File:** {{file_path}}:{{line_number}}
**Function:** {{function_name}}
**Introduced in:** {{suspect_commit}} by @{{commit_author}}

## Fix Applied
{{fix_description}}

## Tests
✅ All tests passed ({{test_count}}/{{test_count}})

## Time to Fix
⏱️ {{time_to_pr}} (Alert → PR)

## Confidence
🎯 {{confidence}}

---
*This PR was automatically generated by DevOps Oracle*
*Human review and approval required before merge*
```

- [ ] PR template created

### PR Creation Implementation
- [ ] Use GitHub MCP to create PR
- [ ] Populate PR with template
- [ ] Add labels: `incident-hotfix`, `auto-generated`, `needs-review`
- [ ] Assign to commit author
- [ ] Test: PR created successfully on GitHub

---

## 📋 Phase 10: MongoDB Integration (Hours 18-24)

### Database Setup
- [ ] Install MongoDB locally or use MongoDB Atlas
- [ ] Create database: `devops-oracle`
- [ ] Test connection

### Incident Model
- [ ] Create `db/models/Incident.model.js`
- [ ] Define schema (see SDP Section 7.1)
- [ ] Add indexes for performance
- [ ] Test: Can save and retrieve incidents

### Database Connection
- [ ] Create `db/connect.js`
- [ ] Add connection logic with retry
- [ ] Add graceful degradation if MongoDB unavailable
- [ ] Test connection on server startup

### Seed Data
Create `mock-data/incidents/seed-data.json`:
```json
[
  {
    "alert_id": "INC-001",
    "service": "order-service",
    "title": "Database connection timeout",
    "severity": "high",
    "fired_at": "2026-05-01T10:00:00Z",
    "pipeline_stage": "merged",
    "time_to_pr_ms": 245000
  }
]
```

- [ ] Seed data created
- [ ] Script to load seed data: `node scripts/seed-db.js`
- [ ] Database populated with 5-10 sample incidents

---

## 📋 Phase 11: React Dashboard (Hours 32-40)

### Dashboard Setup
- [ ] React app created with Create React App
- [ ] Tailwind CSS configured
- [ ] React Query installed for data fetching
- [ ] Basic routing setup (if needed)

### Components

#### IncidentFeed.jsx
- [ ] Fetches incidents from `/api/incidents`
- [ ] Displays list with status badges
- [ ] Shows time-to-PR for each
- [ ] Click to view details

#### PipelineStatus.jsx
- [ ] Shows current pipeline stage
- [ ] Visual progress indicator (stepper)
- [ ] Updates in real-time (polling every 2s)
- [ ] Color-coded stages (green=complete, blue=in-progress, gray=pending)

#### RootCauseCard.jsx
- [ ] Displays root cause analysis
- [ ] Shows confidence level
- [ ] Displays suspect commit info
- [ ] Formatted code snippets

#### PRStatus.jsx
- [ ] Shows PR link
- [ ] Displays test results
- [ ] Shows merge status
- [ ] Link to GitHub PR

### API Endpoints
- [ ] `GET /api/incidents` - List all incidents
- [ ] `GET /api/incidents/:id` - Get incident details
- [ ] `GET /api/metrics` - Aggregate metrics
- [ ] `POST /api/simulate` - Trigger demo alert

### Styling
- [ ] Responsive design (mobile-friendly)
- [ ] Dark mode support (optional)
- [ ] Professional color scheme
- [ ] Loading states
- [ ] Error states

---

## 📋 Phase 12: Integration & Testing (Hours 40-44)

### End-to-End Test
- [ ] Start all services (MongoDB, Express, React)
- [ ] Run `./simulate-alert.sh`
- [ ] Verify webhook received
- [ ] Verify Bob investigates
- [ ] Verify fix generated
- [ ] Verify tests run
- [ ] Verify PR created
- [ ] Verify dashboard updates
- [ ] Measure total time (should be <4 minutes)

### Test Checklist
- [ ] Webhook endpoint responds 200 OK
- [ ] Log Agent extracts error correctly
- [ ] Repo Agent finds correct commit
- [ ] Root cause confidence is HIGH
- [ ] Fix includes audit comment
- [ ] Tests pass after fix
- [ ] PR has correct title and body
- [ ] Dashboard shows incident
- [ ] Metrics calculate correctly

### Error Scenarios
- [ ] Test with LOW confidence (pipeline halts)
- [ ] Test with failing tests (retry logic works)
- [ ] Test with network failure (graceful degradation)
- [ ] Test with invalid webhook (rejected)

---

## 📋 Phase 13: Demo Preparation (Hours 44-48)

### Demo Environment
- [ ] Clean database (remove test data)
- [ ] Seed with 5-10 completed incidents
- [ ] Demo repository has the bug
- [ ] All services start cleanly
- [ ] ngrok tunnel configured (if needed)

### Demo Script
- [ ] Print demo script from battle plan
- [ ] Rehearse 3 times
- [ ] Time each section
- [ ] Identify potential failure points
- [ ] Prepare recovery strategies

### Fallback Video
- [ ] Record full 3-minute demo
- [ ] Edit for clarity (remove pauses, errors)
- [ ] Add captions (optional)
- [ ] Upload to YouTube (unlisted)
- [ ] Test video plays smoothly

### Documentation
- [ ] README.md complete with:
  - [ ] Project description
  - [ ] Quick start instructions
  - [ ] Architecture diagram
  - [ ] IBM Bob integration details
  - [ ] Demo video link
  - [ ] Screenshots
- [ ] `.env.example` has all required variables
- [ ] All prompts in `bob-prompts/` folder
- [ ] Code comments added
- [ ] LICENSE file added (MIT)

### Screenshots
- [ ] Bob in Orchestrator mode
- [ ] GitHub PR created by Bob
- [ ] Dashboard showing metrics
- [ ] Slack notifications (if implemented)
- [ ] `.bob/mcp.json` configuration

### Submission Package
- [ ] GitHub repository is public
- [ ] Repository name: `devops-oracle`
- [ ] All code committed and pushed
- [ ] No secrets in repository
- [ ] README is comprehensive
- [ ] Demo video linked
- [ ] Screenshots in `docs/` folder

---

## 📋 Pre-Demo Day Checklist

### 24 Hours Before
- [ ] Full end-to-end test (3 successful runs)
- [ ] Fallback video recorded and accessible
- [ ] All MCP servers tested
- [ ] Database seeded with demo data
- [ ] Demo repository has bug
- [ ] README complete
- [ ] Bob token balance checked

### 1 Hour Before
- [ ] Test on venue WiFi
- [ ] ngrok tunnel active (if needed)
- [ ] All services running
- [ ] Browser tabs pre-opened
- [ ] Terminal windows arranged
- [ ] Demo script printed
- [ ] Backup plan ready

### 5 Minutes Before
- [ ] Close unnecessary apps
- [ ] Clear browser cache
- [ ] Restart all services
- [ ] Test webhook with curl
- [ ] Verify dashboard loads
- [ ] Mute notifications
- [ ] Deep breath 😊

---

## 🎯 Success Criteria

### Minimum Viable Demo
- [ ] Webhook triggers pipeline
- [ ] Bob investigates and finds root cause
- [ ] Bob writes a fix
- [ ] PR is created on GitHub
- [ ] Dashboard shows the incident
- [ ] Demo completes in <3 minutes

### Impressive Demo
- [ ] All of above, plus:
- [ ] Tests pass after fix
- [ ] Real-time updates visible
- [ ] Metrics displayed
- [ ] Professional UI
- [ ] Smooth presentation

### Winning Demo
- [ ] All of above, plus:
- [ ] Multiple incident types
- [ ] Confidence visualization
- [ ] Cost savings calculator
- [ ] Graceful error handling
- [ ] Memorable pitch

---

## 📝 Notes

### Time Management Tips
- Focus on core path first (alert → PR)
- Mock external services initially
- Polish dashboard last
- Reserve 4 hours for demo prep
- Don't add features after Hour 40

### Common Pitfalls
- Don't spend too long on perfect code
- Don't try to implement all features
- Don't skip the fallback video
- Don't test on venue WiFi only
- Don't forget to seed demo data

### If Running Behind Schedule
**Priority 1 (Must Have):**
- Webhook → Bob investigation → PR creation
- Basic dashboard showing incidents

**Priority 2 (Should Have):**
- Test execution
- Metrics display
- Professional styling

**Priority 3 (Nice to Have):**
- Slack notifications
- History Agent
- Multiple incident types

---

*Use this checklist to track your progress. Check off items as you complete them. Good luck!*