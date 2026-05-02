# DevOps Oracle - Architecture Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Trigger Layer"
        PD[PagerDuty Alert] -->|HTTP POST| WH[Express Webhook Server]
        WH -->|200 OK| PD
        WH -->|Async| ORCH[Bob Orchestrator]
    end
    
    subgraph "Intelligence Layer - IBM Bob"
        ORCH -->|Dispatch| LA[Log Agent<br/>Ask Mode]
        ORCH -->|Dispatch| RA[Repo Agent<br/>Advanced Mode]
        ORCH -->|Dispatch| HA[History Agent<br/>Ask Mode]
        
        LA -->|Error Signature| SYNTH[Synthesizer<br/>Orchestrator Mode]
        RA -->|Commit Info| SYNTH
        HA -->|Pattern Match| SYNTH
        
        SYNTH -->|Root Cause| CODE[Code Mode<br/>Fix Generation]
        CODE -->|Hotfix| TEST[Advanced Mode<br/>BobShell Tests]
        TEST -->|Pass| PR[GitHub MCP<br/>Create PR]
    end
    
    subgraph "Tooling Layer - MCP Servers"
        LA -.->|Fetch Logs| LOGS[Log Service]
        RA -.->|Search/Read| GH[GitHub MCP]
        HA -.->|Query| DB[(MongoDB)]
        PR -.->|Create PR| GH
        ORCH -.->|Notify| SL[Slack MCP]
    end
    
    subgraph "Presentation Layer"
        DB -->|Read| API[REST API]
        API -->|JSON| DASH[React Dashboard]
    end
    
    style ORCH fill:#4A90E2
    style LA fill:#7ED321
    style RA fill:#7ED321
    style HA fill:#7ED321
    style CODE fill:#F5A623
    style TEST fill:#BD10E0
    style PR fill:#BD10E0
```

---

## Data Flow Sequence

```mermaid
sequenceDiagram
    participant PD as PagerDuty
    participant WH as Webhook Server
    participant BO as Bob Orchestrator
    participant LA as Log Agent
    participant RA as Repo Agent
    participant HA as History Agent
    participant CM as Code Mode
    participant BS as BobShell
    participant GH as GitHub MCP
    participant SL as Slack MCP
    participant DB as MongoDB
    
    PD->>WH: POST /webhook/pagerduty
    WH->>PD: 200 OK
    WH->>DB: Save incident (triggered)
    WH->>BO: Trigger investigation
    
    BO->>SL: Post "Oracle activated"
    
    par Parallel Investigation
        BO->>LA: Analyze logs
        LA->>LA: Extract error signature
        LA-->>BO: Error details
    and
        BO->>RA: Trace to code
        RA->>GH: Search repository
        GH-->>RA: File contents
        RA->>GH: Get commit history
        GH-->>RA: Commits
        RA-->>BO: Suspect commit
    and
        BO->>HA: Check history
        HA->>DB: Query similar incidents
        DB-->>HA: Pattern matches
        HA-->>BO: Historical context
    end
    
    BO->>BO: Synthesize root cause
    BO->>DB: Update (root_cause_found)
    BO->>SL: Post root cause
    
    BO->>CM: Generate fix
    CM->>CM: Write hotfix
    CM-->>BO: Fixed code
    BO->>DB: Update (fix_written)
    
    BO->>BS: Run tests
    BS->>BS: Execute npm test
    BS-->>BO: Test results (PASS)
    BO->>DB: Update (tests_passed)
    
    BO->>GH: Create PR
    GH-->>BO: PR URL
    BO->>DB: Update (pr_opened)
    BO->>SL: Post PR link
```

---

## Bob Mode Usage Flow

```mermaid
stateDiagram-v2
    [*] --> Orchestrator: Alert Received
    
    Orchestrator --> Ask_Log: Dispatch Log Agent
    Orchestrator --> Ask_Repo: Dispatch Repo Agent
    Orchestrator --> Ask_History: Dispatch History Agent
    
    Ask_Log --> Orchestrator: Error Signature
    Ask_Repo --> Orchestrator: Commit Info
    Ask_History --> Orchestrator: Patterns
    
    Orchestrator --> Synthesize: Combine Findings
    Synthesize --> Code: Generate Fix
    
    Code --> Advanced: Run Tests
    Advanced --> Code: Tests Failed (Retry)
    Advanced --> Advanced_PR: Tests Passed
    
    Advanced_PR --> Orchestrator: PR Created
    Orchestrator --> [*]: Complete
    
    note right of Orchestrator
        Master coordinator
        Plans and dispatches
    end note
    
    note right of Ask_Log
        Read-only investigation
        No file modifications
    end note
    
    note right of Code
        File modification
        Writes hotfix
    end note
    
    note right of Advanced
        CLI access
        Executes tests
    end note
```

---

## Pipeline State Machine

```mermaid
stateDiagram-v2
    [*] --> triggered: Alert Received
    
    triggered --> investigating: Start Investigation
    triggered --> halted: Invalid Alert
    
    investigating --> root_cause_found: High Confidence
    investigating --> halted: Low Confidence
    
    root_cause_found --> fix_written: Fix Generated
    root_cause_found --> halted: Cannot Generate Fix
    
    fix_written --> tests_passed: Tests Pass
    fix_written --> investigating: Tests Fail (Retry)
    fix_written --> halted: Max Retries Exceeded
    
    tests_passed --> pr_opened: PR Created
    tests_passed --> halted: PR Creation Failed
    
    pr_opened --> merged: Human Approves
    pr_opened --> halted: Human Rejects
    
    merged --> [*]
    halted --> [*]
    
    note right of triggered
        Initial state
        Webhook received
    end note
    
    note right of investigating
        Agents gathering data
        Parallel execution
    end note
    
    note right of halted
        Terminal state
        Human intervention required
    end note
```

---

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend - React"
        UI[User Interface]
        IF[Incident Feed]
        PS[Pipeline Status]
        RC[Root Cause Card]
        PR[PR Status]
        
        UI --> IF
        UI --> PS
        UI --> RC
        UI --> PR
    end
    
    subgraph "Backend - Express"
        API[REST API]
        WH[Webhook Handler]
        ORCH[Orchestrator]
        
        API --> ORCH
        WH --> ORCH
    end
    
    subgraph "Agents"
        LA[Log Agent]
        RA[Repo Agent]
        HA[History Agent]
        
        ORCH --> LA
        ORCH --> RA
        ORCH --> HA
    end
    
    subgraph "Data Layer"
        DB[(MongoDB)]
        CACHE[In-Memory Cache]
        
        API --> DB
        ORCH --> DB
        HA --> DB
        RA --> CACHE
    end
    
    subgraph "External Services"
        GH[GitHub MCP]
        SL[Slack MCP]
        LOGS[Log Service]
        
        RA --> GH
        ORCH --> SL
        LA --> LOGS
    end
    
    UI -->|HTTP| API
    WH -->|Webhook| ORCH
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Local Development"
        DEV[Developer Machine]
        MONGO[MongoDB Local]
        NGROK[ngrok Tunnel]
        
        DEV --> MONGO
        DEV --> NGROK
    end
    
    subgraph "Cloud Deployment (Optional)"
        RAILWAY[Railway.app]
        ATLAS[MongoDB Atlas]
        VERCEL[Vercel]
        
        RAILWAY -->|Connect| ATLAS
        VERCEL -->|API Calls| RAILWAY
    end
    
    subgraph "External Services"
        GH[GitHub]
        PD[PagerDuty]
        SL[Slack]
        
        RAILWAY -->|MCP| GH
        PD -->|Webhook| RAILWAY
        RAILWAY -->|Notify| SL
    end
    
    NGROK -.->|Tunnel| DEV
    PD -.->|Webhook| NGROK
```

---

## MCP Integration Architecture

```mermaid
graph LR
    subgraph "Bob Process"
        ORCH[Orchestrator Mode]
        ASK[Ask Mode]
        CODE[Code Mode]
        ADV[Advanced Mode]
    end
    
    subgraph "MCP Layer"
        GHUB[GitHub MCP Server]
        PD[PagerDuty MCP Server]
        SLACK[Slack MCP Server]
    end
    
    subgraph "External APIs"
        GHAPI[GitHub API]
        PDAPI[PagerDuty API]
        SLAPI[Slack API]
    end
    
    ORCH -->|stdio| GHUB
    ORCH -->|stdio| SLACK
    ASK -->|stdio| GHUB
    ADV -->|stdio| GHUB
    
    GHUB -->|HTTPS| GHAPI
    PD -->|HTTPS| PDAPI
    SLACK -->|HTTPS| SLAPI
    
    style GHUB fill:#4A90E2
    style PD fill:#4A90E2
    style SLACK fill:#4A90E2
```

---

## Error Handling Flow

```mermaid
graph TD
    START[Alert Received] --> VALIDATE{Valid Webhook?}
    
    VALIDATE -->|No| REJECT[Return 401]
    VALIDATE -->|Yes| ACCEPT[Return 200 OK]
    
    ACCEPT --> INVESTIGATE[Start Investigation]
    
    INVESTIGATE --> CONFIDENCE{Confidence Level?}
    
    CONFIDENCE -->|HIGH| GENERATE[Generate Fix]
    CONFIDENCE -->|MEDIUM/LOW| HALT1[Halt Pipeline]
    
    GENERATE --> TESTS{Tests Pass?}
    
    TESTS -->|Yes| CREATE_PR[Create PR]
    TESTS -->|No| RETRY{Retry Count < 2?}
    
    RETRY -->|Yes| GENERATE
    RETRY -->|No| HALT2[Halt Pipeline]
    
    CREATE_PR --> SUCCESS[Notify Success]
    
    HALT1 --> NOTIFY1[Notify Slack: Low Confidence]
    HALT2 --> NOTIFY2[Notify Slack: Tests Failed]
    
    REJECT --> END1[End]
    SUCCESS --> END2[End]
    NOTIFY1 --> END3[End]
    NOTIFY2 --> END4[End]
    
    style HALT1 fill:#F5A623
    style HALT2 fill:#F5A623
    style SUCCESS fill:#7ED321
```

---

## Technology Stack Diagram

```mermaid
graph TB
    subgraph "Frontend Stack"
        REACT[React 18]
        RQ[React Query]
        TC[Tailwind CSS]
        AXIOS[Axios]
    end
    
    subgraph "Backend Stack"
        NODE[Node.js 18+]
        EXPRESS[Express.js]
        MONGOOSE[Mongoose]
        DOTENV[dotenv]
    end
    
    subgraph "IBM Bob Stack"
        BOB[IBM Bob]
        ORCH_M[Orchestrator Mode]
        ASK_M[Ask Mode]
        CODE_M[Code Mode]
        ADV_M[Advanced Mode]
        
        BOB --> ORCH_M
        BOB --> ASK_M
        BOB --> CODE_M
        BOB --> ADV_M
    end
    
    subgraph "MCP Stack"
        GH_MCP[GitHub MCP]
        PD_MCP[PagerDuty MCP]
        SL_MCP[Slack MCP]
    end
    
    subgraph "Database"
        MONGO[(MongoDB)]
    end
    
    REACT --> AXIOS
    AXIOS --> EXPRESS
    EXPRESS --> MONGOOSE
    MONGOOSE --> MONGO
    EXPRESS --> BOB
    BOB --> GH_MCP
    BOB --> PD_MCP
    BOB --> SL_MCP
```

---

## Demo Flow Diagram

```mermaid
sequenceDiagram
    participant D as Demo Presenter
    participant T as Terminal
    participant B as Bob IDE
    participant G as GitHub
    participant S as Slack
    participant DASH as Dashboard
    
    Note over D: [0:00-0:20] THE HOOK
    D->>T: Run simulate-alert.sh
    T->>T: POST /webhook/pagerduty
    T-->>D: 200 OK logged
    
    Note over D: [0:20-0:50] BOB INVESTIGATES
    D->>B: Show Bob terminal
    B->>B: [Orchestrator] Planning...
    B->>B: [Log Agent] Analyzing...
    B->>B: [Repo Agent] Tracing...
    B->>S: Post "Root cause found"
    S-->>D: Show Slack notification
    
    Note over D: [0:50-1:40] THE PR
    D->>G: Navigate to PR
    G-->>D: Show PR details
    D->>D: Walk through title, body, diff
    
    Note over D: [1:40-2:10] THE DASHBOARD
    D->>DASH: Show metrics
    DASH-->>D: Display time-to-PR: 3m 47s
    
    Note over D: [2:10-2:30] UNDER THE HOOD
    D->>T: Show .bob/mcp.json
    
    Note over D: [2:30-3:00] THE CLOSE
    D->>D: Deliver closing statement
```

---

## Confidence Calculation Logic

```mermaid
graph TD
    START[Start Confidence Calculation] --> LOG{Log Analysis Clear?}
    
    LOG -->|Yes +30| STACK{Stack Trace Complete?}
    LOG -->|No +10| STACK
    
    STACK -->|Yes +30| COMMIT{Commit Identified?}
    STACK -->|No +10| COMMIT
    
    COMMIT -->|Yes +30| HISTORY{Historical Pattern?}
    COMMIT -->|No +10| HISTORY
    
    HISTORY -->|Yes +10| TOTAL
    HISTORY -->|No +0| TOTAL
    
    TOTAL[Calculate Total Score] --> SCORE{Score?}
    
    SCORE -->|>= 80| HIGH[HIGH Confidence]
    SCORE -->|50-79| MEDIUM[MEDIUM Confidence]
    SCORE -->|< 50| LOW[LOW Confidence]
    
    HIGH --> PROCEED[Proceed to Fix]
    MEDIUM --> CAUTION[Proceed with Caution]
    LOW --> HALT[Halt Pipeline]
    
    style HIGH fill:#7ED321
    style MEDIUM fill:#F5A623
    style LOW fill:#D0021B
```

---

## Notes

### Diagram Usage

1. **System Architecture Overview** - Use in README and presentation to show high-level design
2. **Data Flow Sequence** - Use to explain the pipeline step-by-step
3. **Bob Mode Usage Flow** - Use to demonstrate proper Bob integration
4. **Pipeline State Machine** - Use to show robust state management
5. **Component Architecture** - Use for technical deep-dive with judges
6. **Deployment Architecture** - Use to show production-readiness
7. **MCP Integration Architecture** - Use to highlight MCP usage
8. **Error Handling Flow** - Use to demonstrate resilience
9. **Technology Stack Diagram** - Use in README and submission
10. **Demo Flow Diagram** - Use for demo rehearsal
11. **Confidence Calculation Logic** - Use to explain AI decision-making

### Rendering Mermaid Diagrams

**In GitHub README:**
```markdown
```mermaid
[diagram code here]
```
```

**In VS Code:**
- Install "Markdown Preview Mermaid Support" extension
- Preview markdown file

**Online:**
- Use https://mermaid.live/ to render and export as PNG/SVG

### Customization Tips

- Adjust colors to match your brand
- Add more detail for technical judges
- Simplify for business-focused judges
- Export as images for presentation slides
- Keep diagrams readable at presentation size

---

*These diagrams are designed to be clear, professional, and impressive to hackathon judges. Use them strategically in your presentation and documentation.*