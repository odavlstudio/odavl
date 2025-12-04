# ODAVL Studio v2.0 - Complete Architecture Guide

## 1. System Overview

ODAVL Studio is a unified platform with three independent products following the Office 365 model:

- **ODAVL Insight**: ML-powered error detection (12 detectors)
- **ODAVL Autopilot**: Self-healing code infrastructure (O-D-A-V-L cycle)
- **ODAVL Guardian**: Pre-deploy quality gates (4 test suites)

### Technology Stack

- **Runtime**: Node.js 18+, TypeScript 5.3+
- **Package Manager**: pnpm 8+ (monorepo with workspaces)
- **Build Tools**: tsup (dual ESM/CJS exports), Next.js 15
- **Testing**: Vitest, Playwright
- **Databases**: PostgreSQL (Prisma ORM), Redis (caching)
- **Deployment**: Docker, Kubernetes, Vercel

## 2. Monorepo Structure

```
odavl-studio/
├── insight/
│   ├── core/          @odavl-studio/insight-core (detectors engine)
│   ├── cloud/         @odavl-studio/insight-cloud (Next.js dashboard)
│   └── extension/     VS Code extension
├── autopilot/
│   ├── engine/        @odavl-studio/autopilot-engine (O-D-A-V-L)
│   ├── recipes/       Improvement recipes (JSON)
│   └── extension/     VS Code extension
└── guardian/
    ├── app/           @odavl-studio/guardian-app (testing dashboard)
    ├── workers/       @odavl-studio/guardian-workers (background jobs)
    └── extension/     VS Code extension

apps/
├── studio-hub/        Marketing website (Next.js 15)
└── studio-cli/        @odavl-studio/cli (unified CLI)

packages/
├── sdk/               @odavl-studio/sdk (public API)
├── auth/              @odavl-studio/auth (JWT authentication)
├── core/              @odavl-studio/core (shared utilities)
└── types/             @odavl/types (TypeScript interfaces - private)
```

## 3. Product Architectures

### 3.1 ODAVL Insight - Error Detection

**Purpose**: Analyze code for 12 types of errors using ML-powered detectors.

**Core Components**:

```
insight-core/src/
├── detector/          12 specialized detectors
│   ├── typescript-detector.ts    (Type errors)
│   ├── eslint-detector.ts        (Linting issues)
│   ├── import-detector.ts        (Import problems)
│   ├── security-detector.ts      (Hardcoded secrets, SQL injection)
│   ├── circular-detector.ts      (Circular dependencies)
│   └── ...
├── learning/          ML pattern learning
│   ├── pattern-memory.ts         (Pattern database)
│   └── pattern-learning-schema.ts (ML schemas)
├── analyzer/          Code analysis engine
├── reporter.ts        Results formatting
└── index.ts           Public API (ESM export)
```

**Data Flow**:

```
1. User → CLI/Extension → InsightCore.analyze(workspace)
2. InsightCore → Load 12 detectors → Run in parallel
3. Each detector → Scan files → Return issues[]
4. InsightCore → Aggregate results → ML pattern matching
5. InsightCore → Generate report → Save to .odavl/
6. Return → Display in VS Code Problems Panel / Dashboard
```

**Key Interfaces**:

```typescript
interface DetectorResult {
  detector: string;
  issues: Issue[];
  executionTime: number;
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  column: number;
  code?: string;
}
```

### 3.2 ODAVL Autopilot - Self-Healing

**Purpose**: Autonomous code improvement through 5-phase O-D-A-V-L cycle.

**Core Components**:

```
autopilot-engine/src/
├── phases/
│   ├── observe.ts     Metrics collection (ESLint, TypeScript)
│   ├── decide.ts      Recipe selection (trust-based)
│   ├── act.ts         Apply improvements (with snapshots)
│   ├── verify.ts      Quality gates enforcement
│   └── learn.ts       Trust score updates
├── policies/
│   └── risk-budget-guard.ts  Safety constraints
├── core/
│   ├── attestation.ts         Cryptographic proofs
│   └── undo-system.ts         Rollback mechanism
└── index.ts           CLI entry point
```

**O-D-A-V-L Cycle**:

```
┌─────────────┐
│  1. OBSERVE │ → Scan code (eslint, tsc)
└──────┬──────┘
       ↓
┌─────────────┐
│  2. DECIDE  │ → Select recipe (trust scores)
└──────┬──────┘
       ↓
┌─────────────┐
│   3. ACT    │ → Apply fixes (save snapshots)
└──────┬──────┘
       ↓
┌─────────────┐
│  4. VERIFY  │ → Check gates (quality improved?)
└──────┬──────┘
       ↓
┌─────────────┐
│  5. LEARN   │ → Update trust scores
└─────────────┘
```

**Safety Mechanisms**:

1. **Risk Budget Guard**: Max 10 files/cycle, max 40 LOC/file
2. **Undo Snapshots**: `.odavl/undo/<timestamp>.json`
3. **Attestation Chain**: SHA-256 proofs in `.odavl/attestation/`

**Key Data Structures**:

```typescript
interface Metrics {
  eslintWarnings: number;
  eslintErrors: number;
  typeErrors: number;
  totalIssues: number;
  timestamp: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  trustScore: number; // 0.1-1.0
  command: string;
}
```

### 3.3 ODAVL Guardian - Quality Testing

**Purpose**: Pre-deploy testing for accessibility, performance, security, SEO.

**Core Components**:

```
guardian-app/src/
├── services/
│   ├── accessibility-service.ts  (Lighthouse, axe-core)
│   ├── performance-service.ts    (Core Web Vitals)
│   ├── security-service.ts       (OWASP checks)
│   └── seo-service.ts            (Meta tags, sitemaps)
├── workers/
│   └── test-runner.ts            (Background job processing)
└── lib/
    └── quality-gates.ts          (Pass/fail thresholds)
```

**Test Flow**:

```
1. User → CLI/Dashboard → guardian.test(url)
2. Guardian → Spawn 4 test workers in parallel
3. Workers → Run Lighthouse/axe/OWASP/SEO tests
4. Workers → Collect scores + issues
5. Guardian → Check quality gates (min scores)
6. Guardian → Generate PDF report
7. Return → Pass/Fail + detailed breakdown
```

## 4. Data Flows & Integration Points

### 4.1 CLI to Product Integration

```
apps/studio-cli/src/index.ts (Commander)
    ↓
commands/{insight,autopilot,guardian}.ts
    ↓
Import product packages:
- @odavl-studio/insight-core
- @odavl-studio/autopilot-engine
- @odavl-studio/guardian-app
    ↓
Execute methods → Return results
```

### 4.2 SDK Integration Pattern

```typescript
// packages/sdk/src/index.ts - Dual export (ESM/CJS)
export { Insight } from './insight.js';
export { Autopilot } from './autopilot.js';
export { Guardian } from './guardian.js';

// Subpath exports in package.json
"exports": {
  ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
  "./insight": { "import": "./dist/insight.js", ... },
  "./autopilot": { "import": "./dist/autopilot.js", ... },
  "./guardian": { "import": "./dist/guardian.js", ... }
}
```

### 4.3 VS Code Extension Architecture

Each extension follows lazy loading pattern:

```typescript
// extension/src/extension.ts
export async function activate(context: vscode.ExtensionContext) {
  // Lazy service initialization
  const dataService = new ODAVLDataService(workspaceRoot);
  GlobalContainer.register('ODAVLDataService', dataService);
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl.analyze', analyzeWorkspace)
  );
  
  // File watchers
  const watcher = vscode.workspace.createFileSystemWatcher('**/.odavl/ledger/*.json');
  watcher.onDidCreate(onLedgerCreated);
}
```

## 5. Database Schemas

### 5.1 Insight Cloud (PostgreSQL + Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  projects      Project[]
  subscription  Subscription?
}

model Project {
  id          String   @id @default(cuid())
  name        String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  analyses    Analysis[]
}

model Analysis {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  results     Json     // { detector: string, issues: Issue[] }
  timestamp   DateTime @default(now())
}

model Subscription {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  tier        String   // 'FREE' | 'PRO' | 'ENTERPRISE'
  status      String   // 'active' | 'cancelled'
  limits      Json     // { maxProjects, maxAnalyses }
}
```

### 5.2 Local Storage (.odavl/ directory)

```
.odavl/
├── history.json              # Run history (append-only)
├── recipes-trust.json        # Recipe trust scores
├── gates.yml                 # Quality gates config
├── undo/
│   ├── latest.json           # Symlink to most recent
│   └── 2025-01-09T12-00-00.json
├── ledger/
│   └── run-<runId>.json      # Detailed run logs
├── attestation/
│   └── <sha256>.json         # Cryptographic proofs
└── problems-panel-export.json # VS Code diagnostics
```

## 6. Security Architecture

### 6.1 Authentication Flow

```
User → Login → JWT token (7 days)
    ↓
Token stored in:
- Browser: httpOnly cookie
- CLI: ~/.odavl/credentials.json
- Extension: VS Code SecretStorage
    ↓
API Request → Middleware → Verify JWT
    ↓
Attach user context → Process request
```

### 6.2 Authorization Levels

- **FREE**: Basic detectors, 3 projects, 100 analyses/month
- **PRO**: All detectors, 10 projects, 1000 analyses/month
- **ENTERPRISE**: Unlimited + SSO + RBAC + Audit logs

## 7. Performance Optimizations

### 7.1 Insight Core

- **Parallel Detection**: 12 detectors run concurrently
- **Incremental Analysis**: Only changed files
- **Pattern Caching**: LRU cache for ML patterns

### 7.2 Autopilot Engine

- **Scope Limitation**: Max 10 files/cycle (prevents large changes)
- **Shadow Verification**: Test in isolated environment before applying
- **Fast Rollback**: Git-based undo system

### 7.3 Guardian Workers

- **Background Jobs**: Bull queue with Redis
- **Concurrent Testing**: 4 test suites in parallel
- **Report Caching**: Store results for 24 hours

## 8. Deployment Architecture

### 8.1 Cloud Services (Insight Cloud + Guardian App)

```
Vercel/AWS
├── Next.js App (Frontend + API Routes)
├── PostgreSQL (Supabase/AWS RDS)
├── Redis (Upstash/AWS ElastiCache)
└── S3 (Report storage)
```

### 8.2 Local Development

```
Docker Compose:
├── postgres:15 (port 5432)
├── redis:7 (port 6379)
├── insight-cloud:dev (port 3001)
└── guardian-app:dev (port 3002)
```

### 8.3 CI/CD Pipeline

```
GitHub Actions:
1. Lint & TypeCheck (pnpm forensic:all)
2. Test (pnpm test:coverage)
3. Build packages (pnpm -r build)
4. Publish to npm (@odavl-studio/*)
5. Deploy dashboards (Vercel)
6. Package extensions (vsce package)
```

## 9. Extension Points

### 9.1 Custom Detectors

```typescript
// Create custom detector
class MyDetector implements IDetector {
  async analyze(workspace: string): Promise<Issue[]> {
    // Your logic
  }
}

// Register in insight-core
InsightCore.registerDetector(new MyDetector());
```

### 9.2 Custom Recipes

```json
// .odavl/recipes/my-recipe.json
{
  "id": "my-custom-fix",
  "name": "Custom Fix",
  "description": "My improvement logic",
  "trustScore": 0.5,
  "command": "my-fix-script.sh"
}
```

### 9.3 Quality Gates

```yaml
# .odavl/gates.yml
risk_budget: 100
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
```

## 10. Monitoring & Observability

### 10.1 Metrics Collection

```typescript
// Real-time analytics
interface AnalyticsEvent {
  eventType: 'analysis_started' | 'cycle_completed' | 'test_failed';
  metadata: {
    duration: number;
    issuesFound: number;
    success: boolean;
  };
}
```

### 10.2 Error Tracking

- **Sentry**: Production error monitoring
- **Log Files**: `.odavl/logs/odavl.log`
- **Audit Trail**: `.odavl/audit/` (Enterprise)

---

**Version**: ODAVL Studio v2.0  
**Last Updated**: November 23, 2025  
**Word Count**: ~1,800 words

For detailed API references, see [SDK_REFERENCE.md](./SDK_REFERENCE.md).  
For implementation patterns, see [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md).
