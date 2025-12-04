# ODAVL Studio Architecture Diagrams

This document contains comprehensive architecture diagrams for the ODAVL Studio platform using Mermaid.js.

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Product Architecture](#2-product-architecture)
3. [Data Flow](#3-data-flow)
4. [Deployment Architecture](#4-deployment-architecture)
5. [Integration Patterns](#5-integration-patterns)
6. [Security Architecture](#6-security-architecture)

---

## 1. System Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "ODAVL Studio Platform"
        subgraph "Frontend Layer"
            VSCode[VS Code Extension<br/>ODAVL Studio]
            CLI[CLI Tool<br/>@odavl/cli]
            Web[Web Dashboard<br/>Next.js]
        end
        
        subgraph "Core Products"
            Insight[ODAVL Insight<br/>12 Detectors]
            Autopilot[ODAVL Autopilot<br/>O→D→A→V→L Loop]
            Guardian[ODAVL Guardian<br/>5 Test Runners]
        end
        
        subgraph "Data Layer"
            FS[File System<br/>.odavl/]
            DB[(PostgreSQL<br/>Prisma)]
            Redis[(Redis<br/>Bull Queues)]
        end
        
        subgraph "External Services"
            Sentry[Sentry<br/>Error Tracking]
            GitHub[GitHub<br/>CI/CD]
            npm[npm Registry<br/>Packages]
        end
    end
    
    VSCode --> Insight
    VSCode --> Autopilot
    VSCode --> Guardian
    CLI --> Insight
    CLI --> Autopilot
    CLI --> Guardian
    Web --> DB
    Web --> Redis
    
    Insight --> FS
    Autopilot --> FS
    Guardian --> DB
    Guardian --> Redis
    Guardian --> Sentry
    
    CLI --> npm
    VSCode --> GitHub
    
    style Insight fill:#4CAF50
    style Autopilot fill:#2196F3
    style Guardian fill:#FF9800
    style VSCode fill:#007ACC
    style CLI fill:#68217A
```

### Component Hierarchy

```mermaid
graph LR
    subgraph "Workspace"
        Root[odavl/]
        
        subgraph "Apps"
            CLI_App[apps/cli/]
            VSCode_App[apps/vscode-ext/]
            Guardian_App[apps/guardian/]
            Cloud[apps/insight-cloud/]
        end
        
        subgraph "Packages"
            InsightCore[packages/insight-core/]
            SDK[packages/sdk/]
            Types[packages/types/]
        end
        
        subgraph "Data Directories"
            Odavl[.odavl/]
            Reports[reports/]
            Logs[logs/]
        end
    end
    
    Root --> CLI_App
    Root --> VSCode_App
    Root --> Guardian_App
    Root --> Cloud
    Root --> InsightCore
    Root --> SDK
    Root --> Types
    Root --> Odavl
    Root --> Reports
    Root --> Logs
    
    CLI_App -.->|imports| InsightCore
    CLI_App -.->|imports| Types
    VSCode_App -.->|imports| InsightCore
    VSCode_App -.->|imports| Types
    Guardian_App -.->|imports| SDK
    Guardian_App -.->|imports| Types
    Cloud -.->|imports| Types
    
    style CLI_App fill:#68217A
    style VSCode_App fill:#007ACC
    style Guardian_App fill:#FF9800
    style InsightCore fill:#4CAF50
```

---

## 2. Product Architecture

### ODAVL Insight Architecture

```mermaid
graph TB
    subgraph "ODAVL Insight - 12 Detectors"
        Entry[Entry Point<br/>insight:run]
        
        subgraph "Detector Engine"
            TypeScript[TypeScript Detector<br/>tsc --noEmit]
            ESLint[ESLint Detector<br/>eslint -f json]
            Imports[Import Detector<br/>Dependency Analysis]
            Packages[Package Detector<br/>package.json Validation]
            Runtime[Runtime Detector<br/>Error Pattern Matching]
            Build[Build Detector<br/>Config Analysis]
            Security[Security Detector<br/>CVE + OWASP]
            Circular[Circular Detector<br/>madge Analysis]
            Network[Network Detector<br/>HTTP Error Patterns]
            Performance[Performance Detector<br/>Bundle Size + Metrics]
            Complexity[Complexity Detector<br/>Cyclomatic Complexity]
            Isolation[Isolation Detector<br/>Test Dependencies]
        end
        
        subgraph "Analysis Layer"
            Aggregator[Issue Aggregator]
            Classifier[Severity Classifier]
            Deduplicator[Deduplication Engine]
        end
        
        subgraph "Output Layer"
            ProblemsPanel[VS Code Problems Panel]
            JSON[JSON Export<br/>.odavl/problems-panel-export.json]
            Report[HTML Report]
        end
    end
    
    Entry --> TypeScript
    Entry --> ESLint
    Entry --> Imports
    Entry --> Packages
    Entry --> Runtime
    Entry --> Build
    Entry --> Security
    Entry --> Circular
    Entry --> Network
    Entry --> Performance
    Entry --> Complexity
    Entry --> Isolation
    
    TypeScript --> Aggregator
    ESLint --> Aggregator
    Imports --> Aggregator
    Packages --> Aggregator
    Runtime --> Aggregator
    Build --> Aggregator
    Security --> Aggregator
    Circular --> Aggregator
    Network --> Aggregator
    Performance --> Aggregator
    Complexity --> Aggregator
    Isolation --> Aggregator
    
    Aggregator --> Classifier
    Classifier --> Deduplicator
    
    Deduplicator --> ProblemsPanel
    Deduplicator --> JSON
    Deduplicator --> Report
    
    style Entry fill:#4CAF50
    style Security fill:#FF5252
    style ProblemsPanel fill:#007ACC
```

### ODAVL Autopilot Architecture

```mermaid
graph TB
    subgraph "ODAVL Autopilot - O→D→A→V→L Loop"
        Start[Start Cycle]
        
        subgraph "OBSERVE Phase"
            O1[Run Insight Detectors]
            O2[Collect Metrics]
            O3[Parse Errors/Warnings]
        end
        
        subgraph "DECIDE Phase"
            D1[Load Recipes<br/>.odavl/recipes/]
            D2[Sort by Trust Score]
            D3[Select Highest Trust Recipe]
            D4[Risk Budget Check<br/>Max 10 files, 40 LOC/file]
        end
        
        subgraph "ACT Phase"
            A1[Save Undo Snapshot<br/>.odavl/undo/]
            A2[Execute Recipe Commands]
            A3[Apply Code Changes]
            A4[Write Ledger<br/>.odavl/ledger/run-*.json]
        end
        
        subgraph "VERIFY Phase"
            V1[Re-run Quality Checks]
            V2[Compare Metrics<br/>Before vs After]
            V3[Enforce Gates<br/>.odavl/gates.yml]
            V4[Write Attestation<br/>SHA-256 Hash]
        end
        
        subgraph "LEARN Phase"
            L1[Calculate Success Rate]
            L2[Update Trust Score<br/>.odavl/recipes-trust.json]
            L3[Blacklist if Failed 3x]
            L4[Update History<br/>.odavl/history.json]
        end
        
        End[Cycle Complete]
    end
    
    Start --> O1
    O1 --> O2
    O2 --> O3
    O3 --> D1
    
    D1 --> D2
    D2 --> D3
    D3 --> D4
    
    D4 -->|Pass| A1
    D4 -->|Fail| End
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    
    A4 --> V1
    V1 --> V2
    V2 --> V3
    V3 --> V4
    
    V4 -->|Pass| L1
    V4 -->|Fail| A1
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> End
    
    style Start fill:#2196F3
    style O1 fill:#4CAF50
    style D3 fill:#FFC107
    style A3 fill:#FF9800
    style V4 fill:#9C27B0
    style L2 fill:#00BCD4
    style End fill:#2196F3
```

### ODAVL Guardian Architecture

```mermaid
graph TB
    subgraph "ODAVL Guardian - Testing & Monitoring"
        subgraph "Pre-Deploy Testing"
            E2E[E2E Runner<br/>Playwright<br/>Video Recording]
            Visual[Visual Runner<br/>pixelmatch<br/>Screenshot Diff]
            A11y[A11y Runner<br/>axe-core<br/>WCAG 2.1 AA]
            i18n[i18n Runner<br/>9 Languages<br/>RTL Support]
            Perf[Performance Runner<br/>Core Web Vitals<br/>Lighthouse]
        end
        
        subgraph "Orchestration Layer"
            Queue[Bull Queue<br/>Redis]
            Worker[Background Worker<br/>Concurrent Jobs]
            Dashboard[Real-Time Dashboard<br/>Socket.io]
        end
        
        subgraph "Post-Deploy Monitoring"
            Logs[Winston Logging<br/>5 Log Types<br/>Daily Rotation]
            Errors[Sentry Integration<br/>Client/Server/Edge<br/>Source Maps]
            APM[Performance Monitoring<br/>APM Traces<br/>Metrics]
            Alerts[Multi-Channel Alerts<br/>Email/Slack/Webhook]
        end
        
        subgraph "Health & Metrics"
            Health[/api/health<br/>Liveness Probe]
            Ready[/api/ready<br/>Readiness Probe]
            Metrics[/api/metrics<br/>Prometheus Format]
        end
    end
    
    E2E --> Queue
    Visual --> Queue
    A11y --> Queue
    i18n --> Queue
    Perf --> Queue
    
    Queue --> Worker
    Worker --> Dashboard
    
    Worker --> Logs
    Worker --> Errors
    Worker --> APM
    
    Logs --> Alerts
    Errors --> Alerts
    APM --> Alerts
    
    Worker --> Health
    Worker --> Ready
    Worker --> Metrics
    
    style E2E fill:#FF9800
    style Queue fill:#E91E63
    style Dashboard fill:#9C27B0
    style Alerts fill:#F44336
```

---

## 3. Data Flow

### Autopilot Cycle Data Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI/Extension
    participant Observe as Observe Phase
    participant Decide as Decide Phase
    participant Act as Act Phase
    participant Verify as Verify Phase
    participant Learn as Learn Phase
    participant FS as File System
    
    User->>CLI: pnpm odavl:run
    CLI->>Observe: Start OBSERVE
    
    Observe->>Observe: Run ESLint
    Observe->>Observe: Run TypeScript
    Observe->>Observe: Parse Errors
    Observe->>FS: Write metrics to .odavl/logs/
    Observe-->>Decide: Metrics Object
    
    Decide->>FS: Load .odavl/recipes/
    Decide->>FS: Load .odavl/recipes-trust.json
    Decide->>Decide: Sort by Trust Score
    Decide->>Decide: Risk Budget Check
    Decide-->>Act: Selected Recipe
    
    Act->>FS: Save Undo Snapshot (.odavl/undo/)
    Act->>Act: Execute Recipe Commands
    Act->>FS: Write Modified Files
    Act->>FS: Write Ledger (.odavl/ledger/)
    Act-->>Verify: Edit Summary
    
    Verify->>Observe: Re-run Quality Checks
    Observe-->>Verify: New Metrics
    Verify->>Verify: Compare Before/After
    Verify->>FS: Load .odavl/gates.yml
    Verify->>Verify: Enforce Gates
    Verify->>FS: Write Attestation (.odavl/attestation/)
    Verify-->>Learn: Verification Result
    
    Learn->>Learn: Calculate Success Rate
    Learn->>FS: Update .odavl/recipes-trust.json
    Learn->>FS: Update .odavl/history.json
    Learn-->>CLI: Cycle Complete
    
    CLI-->>User: Success Report
```

### Guardian Test Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant API as Guardian API
    participant Queue as Bull Queue
    participant Worker as Background Worker
    participant Runner as Test Runner
    participant Storage as Storage
    participant Socket as Socket.io
    participant Dashboard as Dashboard
    
    User->>API: POST /guardian/test
    API->>API: Validate Request
    API->>Queue: Enqueue Test Job
    API-->>User: 202 Accepted + Job ID
    
    Queue->>Worker: Dequeue Job
    Worker->>Runner: Execute Test Runner
    
    Runner->>Runner: Setup Browser/Environment
    Runner->>Runner: Run Test Cases
    Runner->>Runner: Capture Artifacts
    
    Runner->>Storage: Save Screenshots
    Runner->>Storage: Save Videos
    Runner->>Storage: Save Reports
    
    Runner-->>Worker: Test Results
    
    Worker->>Socket: Emit Progress Event
    Socket->>Dashboard: Update Real-Time UI
    
    Worker->>API: Mark Job Complete
    
    User->>API: GET /jobs/:jobId
    API-->>User: Test Results + Artifacts
```

---

## 4. Deployment Architecture

### Kubernetes Deployment

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            Ingress[Ingress Controller<br/>nginx/traefik<br/>SSL/TLS Termination]
        end
        
        subgraph "Application Layer"
            subgraph "Guardian Deployment"
                GuardianPod1[Guardian Pod 1<br/>Next.js + Bull Worker]
                GuardianPod2[Guardian Pod 2<br/>Next.js + Bull Worker]
                GuardianPod3[Guardian Pod 3<br/>Next.js + Bull Worker]
            end
            
            subgraph "Insight Cloud Deployment"
                InsightPod1[Insight Cloud Pod 1<br/>Next.js + Prisma]
                InsightPod2[Insight Cloud Pod 2<br/>Next.js + Prisma]
            end
        end
        
        subgraph "Service Layer"
            GuardianSvc[Guardian Service<br/>ClusterIP:3000]
            InsightSvc[Insight Service<br/>ClusterIP:3001]
        end
        
        subgraph "Data Layer"
            PG[PostgreSQL<br/>StatefulSet<br/>Persistent Volume]
            Redis[Redis<br/>StatefulSet<br/>Persistent Volume]
        end
        
        subgraph "Monitoring"
            Prometheus[Prometheus<br/>Metrics Collection]
            Grafana[Grafana<br/>Dashboards]
        end
        
        subgraph "Autoscaling"
            HPA[Horizontal Pod Autoscaler<br/>CPU/Memory Targets]
        end
    end
    
    Internet[Internet] --> Ingress
    
    Ingress --> GuardianSvc
    Ingress --> InsightSvc
    
    GuardianSvc --> GuardianPod1
    GuardianSvc --> GuardianPod2
    GuardianSvc --> GuardianPod3
    
    InsightSvc --> InsightPod1
    InsightSvc --> InsightPod2
    
    GuardianPod1 --> PG
    GuardianPod1 --> Redis
    GuardianPod2 --> PG
    GuardianPod2 --> Redis
    GuardianPod3 --> PG
    GuardianPod3 --> Redis
    
    InsightPod1 --> PG
    InsightPod2 --> PG
    
    GuardianPod1 --> Prometheus
    GuardianPod2 --> Prometheus
    GuardianPod3 --> Prometheus
    InsightPod1 --> Prometheus
    InsightPod2 --> Prometheus
    
    Prometheus --> Grafana
    
    HPA -.->|scales| GuardianPod3
    HPA -.->|scales| InsightPod2
    
    style Ingress fill:#4CAF50
    style PG fill:#336791
    style Redis fill:#DC382D
    style Prometheus fill:#E6522C
    style HPA fill:#326CE5
```

### CI/CD Pipeline

```mermaid
graph LR
    subgraph "GitHub Actions Workflow"
        subgraph "Trigger Events"
            Push[Push to main]
            PR[Pull Request]
            Tag[Tag Release]
        end
        
        subgraph "Build Stage"
            Checkout[Checkout Code]
            Install[Install Dependencies<br/>pnpm install]
            Lint[Lint + Typecheck<br/>pnpm forensic:all]
            Test[Run Tests<br/>pnpm test:coverage]
            Build[Build Apps<br/>pnpm build]
        end
        
        subgraph "Package Stage"
            Docker[Build Docker Images<br/>multi-stage build]
            Push_Registry[Push to Registry<br/>GitHub Container Registry]
            npm_Publish[Publish to npm<br/>@odavl/*]
            VSCode_Package[Package Extension<br/>.vsix]
        end
        
        subgraph "Deploy Stage"
            Staging[Deploy to Staging<br/>kubectl apply]
            Smoke[Smoke Tests<br/>Health Checks]
            Production[Deploy to Production<br/>Helm Upgrade]
        end
        
        subgraph "Verification"
            E2E[E2E Tests<br/>Guardian Runners]
            Monitor[Monitor Metrics<br/>Sentry + APM]
            Rollback{Success?}
        end
    end
    
    Push --> Checkout
    PR --> Checkout
    Tag --> Checkout
    
    Checkout --> Install
    Install --> Lint
    Lint --> Test
    Test --> Build
    
    Build --> Docker
    Build --> npm_Publish
    Build --> VSCode_Package
    
    Docker --> Push_Registry
    Push_Registry --> Staging
    
    Staging --> Smoke
    Smoke --> Production
    
    Production --> E2E
    E2E --> Monitor
    Monitor --> Rollback
    
    Rollback -->|Yes| End[Deployment Complete]
    Rollback -->|No| Revert[Helm Rollback]
    Revert --> Staging
    
    style Checkout fill:#4CAF50
    style Test fill:#2196F3
    style Docker fill:#2496ED
    style Production fill:#FF9800
    style Rollback fill:#F44336
```

---

## 5. Integration Patterns

### VS Code Extension Integration

```mermaid
graph TB
    subgraph "VS Code Extension (ODAVL Studio)"
        subgraph "Extension Host"
            Activation[extension.ts<br/>Activation Entry]
            Container[ServiceContainer<br/>Dependency Injection]
        end
        
        subgraph "Service Layer"
            DataService[ODAVLDataService<br/>Ledger/Metrics Access]
            InsightService[InsightService<br/>Detector Runner]
            AutopilotService[AutopilotService<br/>Cycle Orchestrator]
            GuardianService[GuardianService<br/>Test Integration]
        end
        
        subgraph "View Providers"
            DashboardProvider[DashboardTreeDataProvider<br/>Real-time Metrics]
            RecipesProvider[RecipesTreeDataProvider<br/>Trust Scores]
            ActivityProvider[ActivityTreeDataProvider<br/>Run History]
            ConfigProvider[ConfigTreeDataProvider<br/>Settings]
        end
        
        subgraph "Command Handlers"
            DoctorCmd[odavl.doctor<br/>Health Checks]
            AnalyzeCmd[odavl.analyzeWorkspace<br/>Run Insight]
            RunCycleCmd[odavl.runCycle<br/>Full O→D→A→V→L]
            UndoCmd[odavl.undo<br/>Rollback Changes]
        end
        
        subgraph "File Watchers"
            LedgerWatcher[Ledger Watcher<br/>*.odavl/ledger/run-*.json]
            ConfigWatcher[Config Watcher<br/>*.odavl/gates.yml]
        end
        
        subgraph "Webview Panels"
            InsightPanel[Insight Panel<br/>Detector Results]
            GovernancePanel[Governance Panel<br/>Policy Compliance]
        end
    end
    
    Activation --> Container
    Container --> DataService
    Container --> InsightService
    Container --> AutopilotService
    Container --> GuardianService
    
    DataService --> DashboardProvider
    DataService --> RecipesProvider
    DataService --> ActivityProvider
    DataService --> ConfigProvider
    
    InsightService --> AnalyzeCmd
    AutopilotService --> RunCycleCmd
    AutopilotService --> UndoCmd
    GuardianService --> DoctorCmd
    
    LedgerWatcher --> ActivityProvider
    ConfigWatcher --> ConfigProvider
    
    InsightService --> InsightPanel
    GuardianService --> GovernancePanel
    
    style Activation fill:#007ACC
    style Container fill:#68217A
    style InsightService fill:#4CAF50
    style AutopilotService fill:#2196F3
    style GuardianService fill:#FF9800
```

### CLI Integration

```mermaid
graph TB
    subgraph "CLI Tool (@odavl/cli)"
        subgraph "Command Router"
            Index[index.ts<br/>Command Parser]
        end
        
        subgraph "Core Commands"
            RunCmd[commands/run.ts<br/>Full Cycle]
            ObserveCmd[commands/observe.ts<br/>OBSERVE Phase]
            DecideCmd[commands/decide.ts<br/>DECIDE Phase]
            ActCmd[commands/act.ts<br/>ACT Phase]
            VerifyCmd[commands/verify.ts<br/>VERIFY Phase]
            LearnCmd[commands/learn.ts<br/>LEARN Phase]
        end
        
        subgraph "Utility Commands"
            UndoCmd[commands/undo.ts<br/>Rollback]
            FeedbackCmd[commands/feedback.ts<br/>Submit Feedback]
            RecommendCmd[commands/recommend.ts<br/>Get Recommendations]
            PlanCmd[commands/apply-plan.ts<br/>Execute Plan]
        end
        
        subgraph "Core Logic"
            Loop[core/odavl-loop.ts<br/>Cycle Orchestration]
            Budget[core/risk-budget.ts<br/>Safety Guard]
            Policies[core/policies.ts<br/>Gate Enforcement]
            PlanRunner[core/plan-runner.ts<br/>Plan Execution]
        end
        
        subgraph "I/O Wrappers"
            FSWrapper[phases/fs-wrapper.ts<br/>File System]
            CPWrapper[phases/cp-wrapper.ts<br/>Child Process]
        end
        
        subgraph "External Packages"
            InsightCore[@odavl/insight-core<br/>Detectors]
            Types[@odavl/types<br/>TypeScript Interfaces]
        end
    end
    
    Index --> RunCmd
    Index --> ObserveCmd
    Index --> DecideCmd
    Index --> ActCmd
    Index --> VerifyCmd
    Index --> LearnCmd
    Index --> UndoCmd
    Index --> FeedbackCmd
    Index --> RecommendCmd
    Index --> PlanCmd
    
    RunCmd --> Loop
    ObserveCmd --> Loop
    DecideCmd --> Loop
    ActCmd --> Loop
    VerifyCmd --> Loop
    LearnCmd --> Loop
    
    Loop --> Budget
    Loop --> Policies
    PlanCmd --> PlanRunner
    
    Loop --> FSWrapper
    Loop --> CPWrapper
    
    ObserveCmd --> InsightCore
    Loop --> Types
    
    style Index fill:#68217A
    style RunCmd fill:#2196F3
    style Loop fill:#4CAF50
    style Budget fill:#F44336
    style InsightCore fill:#4CAF50
```

---

## 6. Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph "Security Architecture"
        subgraph "Edge Security"
            WAF[Web Application Firewall<br/>DDoS Protection]
            RateLimit[Rate Limiting<br/>100-Unlimited req/hr]
            IPFilter[IP Filtering<br/>Geo-blocking]
        end
        
        subgraph "Authentication Layer"
            APIKey[API Key Auth<br/>X-API-Key Header]
            JWT[JWT Auth<br/>Bearer Token]
            OAuth[OAuth 2.0<br/>GitHub/Google]
        end
        
        subgraph "Authorization Layer"
            RBAC[Role-Based Access Control<br/>Admin/User/Viewer]
            Scopes[API Scopes<br/>read/write/admin]
            Tiers[Tier Enforcement<br/>Free/Pro/Enterprise]
        end
        
        subgraph "Data Security"
            Encryption[Encryption at Rest<br/>AES-256]
            TLS[TLS 1.3<br/>HTTPS Only]
            Sanitization[Input Sanitization<br/>DOMPurify]
        end
        
        subgraph "Application Security"
            CSRF[CSRF Protection<br/>Token Validation]
            XSS[XSS Prevention<br/>Content Security Policy]
            SQLInjection[SQL Injection<br/>Parameterized Queries]
        end
        
        subgraph "Monitoring & Audit"
            AuditLog[Audit Logging<br/>.odavl/audit/]
            Sentry[Error Tracking<br/>Sentry Integration]
            Alerts[Security Alerts<br/>Multi-Channel]
        end
    end
    
    Internet[Internet] --> WAF
    WAF --> RateLimit
    RateLimit --> IPFilter
    
    IPFilter --> APIKey
    IPFilter --> JWT
    IPFilter --> OAuth
    
    APIKey --> RBAC
    JWT --> RBAC
    OAuth --> RBAC
    
    RBAC --> Scopes
    Scopes --> Tiers
    
    Tiers --> Encryption
    Tiers --> TLS
    Tiers --> Sanitization
    
    Encryption --> CSRF
    TLS --> XSS
    Sanitization --> SQLInjection
    
    CSRF --> AuditLog
    XSS --> Sentry
    SQLInjection --> Alerts
    
    style WAF fill:#F44336
    style JWT fill:#4CAF50
    style RBAC fill:#2196F3
    style Encryption fill:#9C27B0
    style CSRF fill:#FF9800
    style AuditLog fill:#00BCD4
```

### Data Protection Flow

```mermaid
sequenceDiagram
    participant Client
    participant WAF
    participant Auth
    participant API
    participant DB
    participant Audit
    
    Client->>WAF: API Request
    WAF->>WAF: Check Rate Limit
    WAF->>WAF: Validate IP
    
    WAF->>Auth: Forward Request
    Auth->>Auth: Validate API Key/JWT
    Auth->>Auth: Check Scopes
    Auth->>Auth: Enforce Tier Limits
    
    Auth->>API: Authorized Request
    API->>API: Sanitize Input
    API->>API: Validate Schema
    
    API->>DB: Parameterized Query
    DB-->>API: Encrypted Data
    
    API->>API: Apply Output Encoding
    API->>Audit: Log Action
    
    API-->>Client: Sanitized Response (HTTPS)
    
    Note over Audit: All actions logged with:<br/>timestamp, user, action, IP
```

---

## Summary

These architecture diagrams provide a comprehensive view of the ODAVL Studio platform:

1. **System Overview**: High-level component relationships and workspace structure
2. **Product Architecture**: Detailed design for Insight (12 detectors), Autopilot (O→D→A→V→L), and Guardian (5 runners)
3. **Data Flow**: Sequence diagrams showing Autopilot cycles and Guardian test execution
4. **Deployment Architecture**: Kubernetes cluster design and CI/CD pipeline
5. **Integration Patterns**: VS Code extension and CLI internal architecture
6. **Security Architecture**: Multi-layer security model with authentication, authorization, and data protection

All diagrams use Mermaid.js syntax and can be rendered in:

- GitHub Markdown (native support)
- VS Code (with Mermaid extension)
- Documentation sites (mdBook, Docusaurus, etc.)
- Mermaid Live Editor (<https://mermaid.live>)

**Built with ❤️ by ODAVL Team**  
**Version**: 1.0.0  
**Last Updated**: January 9, 2025
