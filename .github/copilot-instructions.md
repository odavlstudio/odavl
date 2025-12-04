# ODAVL Studio v2.0 - AI Coding Agent Instructions

## 🔒 CRITICAL: Product Boundaries (READ FIRST)

**⚠️ MANDATORY: Every Copilot action MUST respect these boundaries.**

### **Product Separation Philosophy**

```
ODAVL Studio = Suite of 3 INDEPENDENT Products
Each product has ONE job. Do it PERFECTLY. Never mix.
```

#### **1️⃣ ODAVL Insight - The Brain 🧠**

**"يفكر، يحلل، يكشف — لا يلمس الكود أبداً"**

✅ **Allowed:**

- Detection (security, performance, complexity, etc.)
- Analysis (metrics, trends, hotspots)
- Education (explanations, examples, suggestions)
- Reporting (issues, scores, dashboards)

❌ **FORBIDDEN:**

- ❌ Auto-fix (that's Autopilot)
- ❌ Modify files (that's Autopilot)
- ❌ Refactor code (that's Autopilot)
- ❌ Execute commands (that's Autopilot)
- ❌ Quality gates (that's Guardian)

**Integration:** One-click handoff to Autopilot via "Fix with Autopilot" button

---

#### **2️⃣ ODAVL Autopilot - The Executor 🤖**

**"ينفذ بأمان — لا يحلل، فقط يصلح"**

✅ **Allowed:**

- Auto-fix (unused imports, formatting, refactoring)
- File modifications (with undo snapshots)
- Safe refactoring (with rollback)
- Dependency updates (safe upgrades)
- O-D-A-V-L cycle execution

❌ **FORBIDDEN:**

- ❌ Detection (use Insight for issues)
- ❌ Code analysis (use Insight)
- ❌ Quality reports (use Insight)
- ❌ Scoring/metrics (use Insight)
- ❌ Quality gates (that's Guardian)

**Integration:** Receives issues from Insight, triggers Guardian after fixes

---

#### **3️⃣ ODAVL Guardian - The Shield 🛡️**

**"يحمي، يمنع — لا يصلح ولا يحلل"**

✅ **Allowed:**

- Policy enforcement (risk budget, protected paths)
- Quality gates (block bad deployments)
- Attestation verification (cryptographic proofs)
- Production monitoring (error rates, availability)
- Compliance checks (security, governance)

❌ **FORBIDDEN:**

- ❌ Detection (use Insight)
- ❌ Code analysis (use Insight)
- ❌ Auto-fix (use Autopilot)
- ❌ File modifications (use Autopilot)
- ❌ Refactoring (use Autopilot)

**Integration:** Uses Insight for validation, blocks until Autopilot fixes

---

### **🚨 Copilot Checklist (BEFORE EVERY ACTION)**

**Before touching ANY file, ask yourself:**

1. ✅ Which product directory am I in? (insight/autopilot/guardian)
2. ✅ What is this product allowed to do?
3. ✅ Am I about to violate a boundary?
4. ✅ Should this feature be in a different product?
5. ✅ Am I duplicating functionality?

**Golden Rules:**

```
Insight  = Detects, analyzes, explains  (NEVER fixes)
Autopilot = Fixes, refactors, updates   (NEVER detects)
Guardian = Enforces, blocks, validates  (NEVER fixes or detects)
```

**If you're unsure, STOP and ask the user.**

---

## Quick Start for AI Agents

**Essential First Steps:**

1. **Package Manager**: ONLY use `pnpm` (enforced in package.json) - NOT npm/yarn/bun
2. **TypeScript Execution**: Use `tsx` for running .ts files - NOT `tsc` (tsc is for type-checking only)
3. **Pre-Commit Check**: Run `pnpm forensic:all` (lint + typecheck + coverage)
4. **Windows PowerShell**: All `tools/*.ps1` scripts require PowerShell 7+ - NOT Windows PowerShell 5.x or cmd.exe
5. **Protected Paths**: Never auto-edit `security/**`, `auth/**`, `**/*.spec.*`, `**/*.test.*`

**Quick Command Reference:**

| Task          | Command               | Note                            |
| ------------- | --------------------- | ------------------------------- |
| Install deps  | `pnpm install`        | Use `--frozen-lockfile` in CI   |
| Build all     | `pnpm build`          | Recursive build of all packages |
| Run tests     | `pnpm test`           | Vitest unit tests               |
| Pre-commit    | `pnpm forensic:all`   | **Required before commits**     |
| Start CLI dev | `pnpm cli:dev --help` | Uses tsx, no build needed       |
| Insight dev   | `pnpm insight:dev`    | Port 3001                       |
| Guardian dev  | `pnpm guardian:dev`   | Port 3002                       |
| Hub dev       | `pnpm hub:dev`        | Port 3000, needs DB             |
| Health check  | `pnpm monitor:health` | System diagnostics              |

**Immediate Commands:**

```bash
pnpm install             # Install dependencies
pnpm build               # Build all packages
pnpm test                # Run tests
pnpm lint                # Lint codebase
pnpm typecheck           # TypeScript validation
pnpm forensic:all        # Full CI workflow (lint + typecheck + coverage - required before commit)
```

**Database Commands (for Next.js apps with Prisma):**

```bash
# Using provided PowerShell script (Windows - recommended)
.\setup-database.ps1 -UseDocker    # Automated Docker setup + seed

# Manual setup
docker ps                          # Check PostgreSQL container
cd apps/studio-hub && pnpm db:push # Apply Prisma schema
cd apps/studio-hub && pnpm db:seed # Seed with demo data
```

**Product-Specific Quick Start:**

```bash
pnpm insight:dev         # Start Insight dashboard (localhost:3001)
pnpm guardian:dev        # Start Guardian dashboard (localhost:3002)
pnpm hub:dev             # Start marketing hub (localhost:3000)
pnpm cli:dev --help      # Run CLI in dev mode
odavl insight analyze    # Analyze codebase
odavl autopilot run      # Run self-healing cycle
```

**VS Code Tasks (Alternative to pnpm scripts):**

The workspace includes pre-configured VS Code tasks accessible via `Ctrl+Shift+P` → "Tasks: Run Task":

- "Forensic: All" - Run full CI workflow (lint + typecheck + coverage)
- "Forensic: Test Coverage" - Run tests with coverage report
- "Forensic: Setup Analysis" - Initialize forensic analysis
- "Forensic: Tool Versions" - Display all tool versions

## Overview

**ODAVL Studio** is a unified platform for autonomous code quality with three distinct products following the Office 365/Adobe Creative Cloud model. It operates as a pnpm monorepo with strict safety, audit, and undo features.

**Critical Philosophy**: Safety-first autonomous operation with triple-layer protection (Risk Budget → Undo Snapshots → Attestation Chain). Every automated change is auditable, reversible, and cryptographically attested.

## Architecture & Major Components

### Monorepo Structure (pnpm workspaces)

Workspace configuration in `pnpm-workspace.yaml`:

```yaml
packages:
  - "odavl-studio/insight/*" # 3 packages: core, cloud, extension
  - "odavl-studio/autopilot/*" # 3 packages: engine, recipes, extension
  - "odavl-studio/guardian/*" # 4 packages: app, workers, extension, core
  - "apps/*" # 2 apps: studio-cli, studio-hub
  - "packages/*" # 7 packages: sdk, auth, core, types, email, github-integration, plugins
  - "tools/*" # PowerShell automation scripts
  - "internal/*" # Internal packages (not published)
  - "github-actions" # GitHub Actions composite actions
```

Use `pnpm` exclusively (NOT npm/yarn/bun) - enforced by `packageManager: "pnpm@9.12.2"` in root package.json.

**Critical**: On Windows, use PowerShell for scripts. All `tools/*.ps1` scripts require PowerShell 7+.

**Key directories:**

- `apps/` - Deployable applications (CLI, marketing hub)
- `odavl-studio/` - Three products (insight, autopilot, guardian), each with core + cloud + extension
- `packages/` - Shared libraries for cross-product use
- `scripts/` - Root automation (ML training, diagnostics, KPI reports)
- `tools/` - PowerShell scripts (security-scan.ps1, policy-guard.ps1, release automation)
- `docs/` - Comprehensive documentation (160+ markdown files)
- `reports/` - Gitignored, local-only test/coverage reports

**Three Product Architecture:**

Each product follows the same structure: `odavl-studio/{product}/{core|cloud|app|engine|workers|extension}/`

#### 1. ODAVL Insight - ML-Powered Error Detection

- **odavl-studio/insight/core/** - `@odavl-studio/insight-core` - Shared error analysis engine
  - 12 detectors: TypeScript, ESLint, Import, Package, Runtime, Build, Security, Circular, Network, Performance, Complexity, Isolation
  - Dual exports: Four subpaths (`.`, `./server`, `./detector`, `./learning`)
    - Main: `dist/index.{mjs,js}` (ESM import/CJS require)
    - Server: `dist/server.{mjs,js}` (Node-only features)
    - Detector: `dist/detector/index.{mjs,js}` (Individual detectors)
    - Learning: `dist/learning/index.{mjs,js}` (ML training utilities)
  - Build: `tsup src/index.ts src/server.ts src/detector/index.ts src/learning/index.ts --format esm,cjs --dts`
  - ML training: `pnpm ml:train` or `tsx scripts/train-tensorflow-v2.ts` - Uses TensorFlow.js
- **odavl-studio/insight/cloud/** - `@odavl-studio/insight-cloud` - Next.js 15 dashboard
  - Prisma ORM with PostgreSQL for error signatures
  - Singleton pattern: Global `prisma` instance prevents connection leaks
- **odavl-studio/insight/extension/** - VS Code extension for real-time analysis
  - Problems Panel integration: Exports to `.odavl/problems-panel-export.json`
  - Auto-analysis on file save (500ms debounce)
  - Lazy loading: Heavy detectors loaded on-demand, not at activation (startup <200ms)

#### 2. ODAVL Autopilot - Self-Healing Code Infrastructure

- **odavl-studio/autopilot/engine/** - `@odavl-studio/autopilot-engine` - O-D-A-V-L cycle engine
  - Entry: `src/index.ts` - Command router for 5 phases
  - Build: `tsup src/index.ts --format cjs,esm --tsconfig tsconfig.build.json && node scripts/add-shebang.cjs`
  - Phases: `src/phases/{observe,decide,act,verify,learn}.ts`
  - Observe: Executes `eslint . -f json` and `tsc --noEmit`, parses into `Metrics`
  - Decide: Loads recipes from `.odavl/recipes/`, sorts by trust score
  - Act: Calls `sh()` wrapper (never throws), saves undo snapshot before edits via `saveUndoSnapshot()`
  - Verify: Re-runs quality checks, enforces `.odavl/gates.yml` rules
  - Learn: Updates `.odavl/recipes-trust.json` with success/failure (0.1–1.0 range)
  - Wrappers: `src/phases/fs-wrapper.ts` and `src/phases/cp-wrapper.ts` for testable I/O
- **odavl-studio/autopilot/recipes/** - Improvement recipes (JSON with trust scores)
- **odavl-studio/autopilot/extension/** - VS Code extension for autopilot monitoring
  - FileSystemWatcher on `.odavl/ledger/run-*.json` (500ms debounce, auto-opens ledgers)

#### 3. ODAVL Guardian - Pre-Deploy Testing & Monitoring

- **odavl-studio/guardian/app/** - `@odavl-studio/guardian-app` - Next.js testing dashboard
  - Accessibility testing with axe-core and Lighthouse
  - Performance testing: Core Web Vitals, TTFB, LCP, FID, CLS
  - Security testing: OWASP Top 10, CSP validation, SSL/TLS checks
  - Quality gate enforcement before deployment
  - Multi-environment support (staging, production)
  - Real-time monitoring with alerts
- **odavl-studio/guardian/workers/** - `@odavl-studio/guardian-workers` - Background jobs
  - Scheduled testing jobs (cron-based)
  - Webhook listeners for deployment events
  - Test result aggregation and reporting
  - Integration with CI/CD pipelines
- **odavl-studio/guardian/core/** - `@odavl-studio/guardian-core` - Testing engine
  - Test runner orchestration
  - Plugin system for custom tests
  - Result caching and comparison
  - Historical trend analysis
- **odavl-studio/guardian/cli/** - `@odavl-studio/guardian-cli` - Command-line interface
  - Entry: `odavl-studio/guardian/cli/dist/guardian.mjs`
  - Commands: `test`, `verify`, `monitor`, `report`
  - Quick access: `pnpm odavl:guardian` or `pnpm guardian`
  - Options: `--url`, `--suite`, `--environment`, `--format`
- **odavl-studio/guardian/extension/** - VS Code extension for quality monitoring
  - Real-time quality metrics in status bar
  - Pre-commit quality checks
  - Test result notifications
  - Quick access to test reports

#### Shared Infrastructure

- **apps/studio-cli/** - `@odavl-studio/cli` - Unified CLI for all products
  - Entry: `src/index.ts` - Commander-based routing: `odavl <product> <command>`
  - Commands: `src/commands/{insight,autopilot,guardian}.ts`
- **apps/studio-hub/** - Marketing website (Next.js 15, Prisma + PostgreSQL)
  - Auth: NextAuth.js with JWT sessions, GitHub/Google OAuth providers
  - Database: Prisma ORM with singleton pattern (prevents connection leaks)
  - Setup: `.\setup-database.ps1 -UseDocker` for automated PostgreSQL + seeding
- **packages/sdk/** - `@odavl-studio/sdk` - Public TypeScript SDK
  - Dual exports (ESM/CJS): `.`, `./insight`, `./autopilot`, `./guardian` subpaths
  - Build: `tsup src/index.ts src/insight.ts src/autopilot.ts src/guardian.ts --format esm,cjs --dts`
- **packages/auth/** - `@odavl-studio/auth` - JWT-based authentication
- **packages/core/** - `@odavl-studio/core` - Shared utilities
- **packages/types/** - `@odavl/types` - Shared TypeScript interfaces (private)
- **packages/email/** - `@odavl-studio/email` - Email service (SMTP, templates, GDPR compliance)
- **packages/github-integration/** - GitHub API integration utilities
- **packages/plugins/** - Plugin system for extensibility (analyzers, reporters, integrations)
- **tools/** - PowerShell scripts (security-scan, policy-guard, golden, release automation)
- **scripts/** - Root automation (auto-fix, verify-insight, KPI reports, diagnostics, ML training)
- **github-actions/** - Composite GitHub Actions for CI/CD workflows

### Critical Data Structures in `.odavl/`

Each workspace can have its own `.odavl/` directory with governance rules. Products write to different subdirectories:

```
.odavl/
├── history.json              # Run history with trust scoring (append-only)
├── recipes-trust.json        # Recipe success rates (ML feedback loop)
├── trust-history.json        # Historical trust score changes
├── gates.yml                 # Local governance rules (max files, protected paths)
├── problems-panel-export.json # VS Code diagnostics export (Insight)
├── attestation/              # SHA-256 proofs of improvements (Autopilot)
├── undo/                     # File snapshots (timestamped JSON, latest.json symlink)
├── ledger/                   # Run ledgers (run-<runId>.json with edit summaries)
├── recipes/                  # Improvement recipes (JSON with trust scores)
├── logs/                     # Phase execution logs (odavl.log)
├── audit/                    # Audit trail and compliance records
├── guardian/                 # Guardian test results
├── insight/                  # Insight analysis outputs
├── metrics/                  # Performance metrics snapshots
├── ml-models/                # Trained ML models (TensorFlow.js)
├── datasets/                 # Training datasets for ML
├── brain/                    # AI learning state and memory
├── diagnostics/              # System health diagnostics
└── schemas/                  # JSON schemas for validation
```

**Note**: Products can have local `.odavl/` directories (e.g., `odavl-studio/autopilot/engine/.odavl/gates.yml`).

**Critical Files:**

- `gates.yml` - Governance enforcement config (risk_budget: 100, forbidden_paths, thresholds)
- `history.json` - Complete run history with timestamps, recipes used, and outcomes
- `recipes-trust.json` - Recipe trust scores (0.1–1.0), success/failure counts
- `latest.json` - Symlink to most recent undo snapshot for quick rollback

## Critical Data Flows & Patterns

### ODAVL Autopilot Cycle (O-D-A-V-L)

```typescript
// odavl-studio/autopilot/engine/src/index.ts - Entry point for phases
commands.observe → observe() → metrics
commands.decide  → decide(metrics) → recipe
commands.act     → act(recipe) → result
commands.verify  → verify() → attestation
commands.learn   → learn() → trust scores
```

**Observe Phase**: Executes `eslint . -f json` and `tsc --noEmit`, parses warnings/errors into `Metrics` object  
**Decide Phase**: Loads recipes from `.odavl/recipes/`, sorts by trust score, selects highest-trust action  
**Act Phase**: Calls `sh()` wrapper (never throws, captures stdout/stderr), saves undo snapshot before edits  
**Verify Phase**: Re-runs quality checks, enforces gates (`.odavl/gates.yml`), writes attestation if improved  
**Learn Phase**: Updates `.odavl/recipes-trust.json` with success/failure, adjusts trust scores (0.1–1.0 range)

### ODAVL Insight Analysis Flow

```typescript
// odavl-studio/insight/core/src/detector/ - 12 specialized detectors
import { TypeScriptDetector } from "./detector/typescript-detector.js";
const detector = new TypeScriptDetector();
const issues = await detector.analyze(workspace);
// → exports to .odavl/problems-panel-export.json
```

**Detectors**: typescript | eslint | import | package | runtime | build | security | circular | network | performance | complexity | isolation
**CLI Access**: `pnpm odavl:insight` (interactive menu) or via unified CLI `odavl insight analyze`
**VS Code**: Auto-runs on file save, displays in Problems Panel with click-to-navigate

### Multi-Language Support

ODAVL Insight supports multiple programming languages with specialized detectors:

#### TypeScript/JavaScript Detection

```typescript
// odavl-studio/insight/core/src/detector/typescript-detector.ts
import { TypeScriptDetector } from "./detector/typescript-detector.js";
const detector = new TypeScriptDetector();
const issues = await detector.analyze(workspace);
```

#### Python Detection

```python
# CLI usage for Python analysis
odavl insight analyze --language python --detectors security,complexity

# Detects:
# - Type hints violations (mypy integration)
# - PEP 8 compliance (flake8/black)
# - Security issues (bandit)
# - Complexity (radon, mccabe)
# - Import cycles (import-linter)
```

#### Java Detection

```bash
# CLI usage for Java analysis
odavl insight analyze --language java --detectors all

# Detects:
# - Compilation errors
# - Unused imports/variables
# - Exception handling patterns
# - Stream API misuse
# - Complexity (cyclomatic, cognitive)
```

**Language-Specific Patterns:**

- **TypeScript**: Strict mode enforcement, never type detection, async/await patterns
- **Python**: Type hints validation, PEP compliance, security (SQL injection, XSS)
- **Java**: Exception handling, stream operations, null safety, Spring patterns

### Unified CLI Pattern

```bash
# apps/studio-cli/src/index.ts - Commander.js-based routing
odavl <product> <command> [options]

# Examples:
odavl insight analyze --detectors typescript,eslint --language typescript
odavl insight fix                      # AI-powered fix suggestions
odavl autopilot run --max-files 10 --max-loc 40
odavl autopilot observe                # Run single phase
odavl guardian test https://example.com

# Development mode (via workspace scripts):
pnpm cli:dev <args>                    # Run CLI with tsx (no build)
pnpm cli <args>                        # Run built CLI
```

### Safety Mechanisms (Triple-Layer)

1. **Risk Budget Guard** (autopilot engine's governance)
   - Max 10 files/cycle, max 40 LOC/file (configurable in `gates.yml`)
   - Protected globs: `security/**`, `**/*.spec.*`, `public-api/**`, `auth/**`
   - Uses micromatch for glob pattern matching against protected paths
   - Throws if constraints violated BEFORE any file writes
2. **Undo Snapshots** (`odavl-studio/autopilot/engine/src/phases/act.ts`)
   - `saveUndoSnapshot(modifiedFiles)` captures original file contents
   - Stored in `.odavl/undo/<timestamp>.json` with ISO timestamps
   - `latest.json` always points to most recent snapshot
   - Restore via autopilot undo command
3. **Attestation Chain** (`.odavl/attestation/`)
   - SHA-256 hashes of successful improvements
   - Links recipes to verified outcomes (cryptographic audit trail)
   - Multi-layer attestations: core, mesh, consensus, guardian

### Command Execution Pattern

```typescript
// odavl-studio/autopilot/engine/src/phases/act.ts - Never throw, always capture
import { execSync } from "./cp-wrapper"; // Use wrapper, not direct import

export function sh(cmd: string): { out: string; err: string } {
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
    return { out, err: "" };
  } catch (e: unknown) {
    const execError = e as { stdout?: Buffer; stderr?: Buffer };
    return {
      out: execError.stdout?.toString() ?? "",
      err: execError.stderr?.toString() ?? "",
    };
  }
}

// Critical: Always returns success/failure, never throws
// Used throughout engine to make all commands safe
```

### I/O Wrapper Pattern (Critical for Testing)

All file system operations in autopilot use safe wrappers for testability:

```typescript
// odavl-studio/autopilot/engine/src/phases/fs-wrapper.ts
// Wraps fs/promises for mocking in tests
export { readFile, writeFile, access, mkdir } from "node:fs/promises";

// odavl-studio/autopilot/engine/src/phases/cp-wrapper.ts
// Wraps child_process for command execution mocking
export { execSync } from "node:child_process";

// Usage in phases:
import * as fsw from "./fs-wrapper";
import { execSync } from "./cp-wrapper";
// Never import directly from 'node:fs' or 'node:child_process'
```

The engine handles file operations with proper error handling and rollback capabilities via `saveUndoSnapshot()`.

## Development Workflows

### Common Commands

```bash
# Product-specific development
pnpm insight:dev         # Start Insight Cloud dashboard (localhost:3001)
pnpm insight:build       # Build Insight Cloud
pnpm insight:core        # Build Insight Core package
pnpm autopilot:engine    # Build Autopilot Engine
pnpm guardian:dev        # Start Guardian dashboard (localhost:3002)
pnpm guardian:build      # Build Guardian app
pnpm guardian:workers    # Build Guardian workers

# Unified CLI (globally installed or via workspace)
odavl --help             # Show all commands
odavl insight analyze    # Analyze with Insight detectors
odavl autopilot run      # Run full O-D-A-V-L cycle
odavl guardian test      # Run pre-deploy tests

# CLI Development (without build)
pnpm cli:dev <args>      # Run CLI with tsx (hot reload)
pnpm cli <args>          # Run built CLI from dist/

# VS Code extensions
pnpm extensions:compile  # Build all VS Code extensions
pnpm extensions:package  # Package extensions for distribution
# For individual extension dev:
cd odavl-studio/insight/extension && npm run compile   # Build
cd odavl-studio/insight/extension && npm run watch     # Dev mode
# Press F5 in VS Code to launch Extension Development Host

# Testing & Quality
pnpm test                # Vitest (apps/**/*.{test,spec}.{ts,tsx})
pnpm test:coverage       # Istanbul coverage → reports/test-results.json
pnpm test:integration    # Integration tests
pnpm test:e2e            # End-to-end tests
pnpm test:all            # All test suites
pnpm forensic:all        # Lint + typecheck + coverage (CI workflow)

# Monorepo operations
pnpm build               # Build all packages recursively
pnpm dev                 # Start all dev servers
pnpm lint                # ESLint entire monorepo
pnpm typecheck           # TypeScript check all packages

# Health monitoring
pnpm monitor:health      # Check ODAVL system health
pnpm monitor:health:verbose  # Detailed health report with diagnostics

# PowerShell Tools (Windows - requires PowerShell 7+)
pwsh tools/golden.ps1              # Golden path validation
pwsh tools/policy-guard.ps1        # Policy enforcement checks
pwsh tools/security-scan.ps1       # Security vulnerability scan
```

### Linting & TypeScript

- **ESLint**: Flat config (`eslint.config.mjs`), type-aware rules via `@typescript-eslint/parser`
  - Custom: unused vars as warnings, `_` prefix ignored
  - Enforces: `no-console: error`, `no-debugger: error` (use Logger utility instead)
  - Config location: Root `eslint.config.mjs` for entire monorepo
  - Ignores: `dist/`, `node_modules/`, `reports/`, `.next/`, `out/`, `*.cjs`
  - Run: `pnpm lint` (entire monorepo) or `eslint . -f json` (JSON output for automation)
- **TypeScript**: `ES2022` target, `bundler` module resolution, `strict: true`
  - Paths: `@/*` aliases to `apps/*/src` and `odavl-website/src`
  - Use `tsx` for execution (NOT `tsc`), `noEmit: true` for checks
  - Root `tsconfig.json` extends to all packages/apps
  - Zero tolerance: `tsc --noEmit` must pass with 0 errors before commit

### Testing with Vitest

- Config: `vitest.config.ts` with Istanbul coverage
- Include: `apps/**/*.{test,spec}.{ts,tsx}`, `tests/**/*.{test,spec}.{ts,tsx}`
- Exclude: `odavl-website/**`, `dist/`, `.next/`
- Output: JSON reports to `reports/test-results.json`

## Project-Specific Conventions

### Governance Constraints (MUST FOLLOW)

- **Max 10 files** per automated change (enforced by `RiskBudgetGuard` via micromatch patterns)
- **Max 40 LOC** per file edit (configurable in `.odavl/gates.yml`)
- **Protected paths**: Never auto-edit `security/`, `**/*.spec.*`, `public-api/**`, `auth/**`
  - Throws error BEFORE any file writes if constraint violated
- **Zero type errors**: Verify phase fails if `tsc --noEmit` shows any errors
- **Local governance**: Each product can override with local `.odavl/gates.yml`
- **Recipe blacklisting**: Recipes with 3+ consecutive failures get trust score < 0.2 and are excluded

### Example gates.yml Configuration

```yaml
risk_budget: 100
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
  - "**/*.test.*"
  - auth/**
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  max_consecutive_failures: 3
```

### Recipe Trust System

- Recipes are JSON files in `.odavl/recipes/` with `id` and `trust` fields
- Trust scores updated after each run: `trust = max(0.1, min(1, success_count / run_count))`
- Blacklisted after 3 consecutive failures (trust < 0.2)

### Ledger & Audit Trail

- Every run writes `ledger/run-<runId>.json` with:
  - `startedAt` timestamp, `planPath`, `edits: [{ path, diffLoc }]`, `notes`
- VS Code extension auto-opens latest ledger if `odavl.autoOpenLedger: true`

### Cross-Component Communication

- **CLI → Extension**: VS Code watches `.odavl/ledger/run-*.json` for new files
- **Insight Core**: Dual exports (ESM/CJS) at `odavl-studio/insight/core/dist/`
- **Shared Types**: `packages/types/` for cross-product TypeScript interfaces
- **SDK**: Public API in `packages/sdk/` with subpath exports for each product

## Plugin System Architecture

ODAVL Studio supports extensibility via the plugin system in `packages/plugins/`:

### Plugin Types

1. **Analyzer Plugins** - Custom code analysis detectors
2. **Reporter Plugins** - Custom output formats and destinations
3. **Integration Plugins** - Third-party tool integrations (Jira, Slack, etc.)

### Plugin Development Pattern

```typescript
// packages/plugins/my-plugin/src/index.ts
import type { ODAVLPlugin, AnalyzerContext } from '@odavl/types';

export const myPlugin: ODAVLPlugin = {
  name: 'my-custom-analyzer',
  version: '1.0.0',
  type: 'analyzer',

  async analyze(context: AnalyzerContext) {
    // Custom analysis logic
    return {
      issues: [...],
      metrics: {...}
    };
  }
};
```

### Plugin Registration

```typescript
// .odavl/config/plugins.json
{
  "plugins": [
    "@odavl-studio/plugin-jira",
    "./local-plugins/custom-analyzer"
  ]
}
```

**Critical**: Plugins run in isolated contexts with limited filesystem access. Use provided APIs for all I/O operations.

## VS Code Extension Integration

- **Activation**: Lazy services pattern in `src/extension.ts`
  - `activateOnDemand()` initializes providers (Dashboard, Recipes, Activity, Config, Intelligence)
  - GlobalContainer pattern: `GlobalContainer.register('ODAVLDataService', ds)`
- **Panels**: Insight Panel (`extension/insight-panel.ts`), Governance Panel
  - Use `vscode.window.createWebviewPanel()` with HTML content providers
- **File Watcher**: Auto-opens ledgers on creation (500ms debounce for file write completion)

  ```typescript
  const watcher = vscode.workspace.createFileSystemWatcher(
    "**/.odavl/ledger/run-*.json"
  );
  watcher.onDidCreate(async (uri) => {
    /* wait 500ms, then openTextDocument */
  });
  ```

- **Config**: Settings accessed via `vscode.workspace.getConfiguration('odavl')`
  - `odavl.enablePerfMetrics` - Performance tracking toggle
  - `odavl.autoOpenLedger` - Auto-open ledger files (default: true)
- **Three Extensions**: Separate extensions for Insight, Autopilot, and Guardian
  - Located in `odavl-studio/{insight,autopilot,guardian}/extension/`
  - Each has its own activation events and feature set

## Debugging & Development

- **Logs**: Phase execution logs in `.odavl/logs/odavl.log`
- **Reports**: Runtime snapshots in `reports/` (gitignored, local-only)
- **Snapshot Inspection**: Check `.odavl/undo/<timestamp>.json` for rollback data
- **Trust Debugging**: Inspect `.odavl/recipes-trust.json` for recipe performance
- **Extension Logs**: VS Code Output panel → "ODAVL Studio"
- **PowerShell Tools**:
  - `tools/security-scan.ps1` - Security vulnerability scanning
  - `tools/policy-guard.ps1` - Policy enforcement checks
  - `tools/golden.ps1` - Golden path workflow validation
  - `tools/release.ps1` - Release automation
- **Schema Validation**:
  - `tools/schema-validator.ts` - TypeScript schema validation
  - `tools/validate-odavl-schemas.ts` - ODAVL-specific schema checks
- **Problems Panel Export**: VS Code extension exports diagnostics to `.odavl/problems-panel-export.json`
  - Auto-updated on file save (Ctrl+S)
  - CLI reads via `pnpm odavl:insight` → option 7 (problemspanel)
  - Fast analysis (~1s vs 10-30s for full detectors)

### Practical Debugging Scenarios

#### Scenario 1: "Why did autopilot skip my recipe?"

```bash
# Check recipe trust scores
cat .odavl/recipes-trust.json | grep "my-recipe-id"
# Trust < 0.2 means blacklisted after 3 failures

# Check recent run ledger
cat .odavl/ledger/latest.json
# Look for recipe selection in "decide" phase notes
```

#### Scenario 2: "Extension not detecting errors"

```bash
# Verify extension is activated
# VS Code Output → "ODAVL Studio" channel

# Force re-analysis
# Ctrl+Shift+P → "ODAVL: Analyze Workspace"

# Check Problems Panel export
cat .odavl/problems-panel-export.json
# Should contain recent timestamp and diagnostics
```

#### Scenario 3: "Build failing with module resolution errors"

```bash
# Clear all caches
rm -rf node_modules .pnpm-store dist .next out
pnpm install --frozen-lockfile
pnpm build

# Check TypeScript paths
cat tsconfig.json | grep -A 10 "paths"
# Verify aliases match workspace structure
```

#### Scenario 4: "ML model giving poor trust predictions"

```bash
# Check model accuracy
pnpm ml:model-info
# Target: >80% accuracy, <0.3 loss

# Retrain with more data
pnpm ml:collect-all      # Gather from all workspaces
pnpm ml:prepare-all      # Prepare dataset
pnpm ml:train            # Train new model

# Compare before/after
pnpm ml:list-models
```

## CI/CD & GitHub Workflows

### Branch Naming Convention

All development branches must follow the pattern: `odavl/<task>-<YYYYMMDD>`

```bash
# Examples:
git checkout -b odavl/fix-security-20251127
git checkout -b odavl/feature-ml-20251201
git checkout -b odavl/refactor-autopilot-20251215
```

**Enforced in CI**: The `ci.yml` workflow validates branch names on every push/PR.

### Pull Request Constraints

GitHub Actions enforces these limits (from `.odavl/gates.yml`):

- **Max 10 files** changed per PR
- **Max 40 lines** (additions + deletions) per PR
- **Protected paths**: Cannot modify `security/**`, `auth/**`, `**/*.spec.*`, `**/*.test.*` without review

### Attestation Chain

Every successful CI run generates cryptographic attestation tokens:

```json
{
  "timestamp": "2025-11-27T14:30:45.123Z",
  "branch": "odavl/feature-xyz-20251127",
  "commit": "abc123...",
  "workflow": "ODAVL CI/CD Pipeline",
  "status": "passed"
}
```

Stored in: `evidence/attestation-<run-id>.json`

### Golden Path Validation

The `golden.ps1` script validates repository structure, dependencies, and configuration:

```powershell
# Run locally before pushing
pwsh tools/golden.ps1 -Verbose

# CI runs this automatically on every push
# Generates: reports/golden/golden-snapshot.json
```

### Secret Management

Required GitHub secrets (see `.github/SECRETS_SETUP.md`):

- `DATABASE_URL` - PostgreSQL connection string (Insight Cloud)
- `NEXTAUTH_SECRET` - JWT signing key (32+ chars)
- `NEXTAUTH_URL` - Auth callback URL
- `SENTRY_AUTH_TOKEN` - Error monitoring (optional)

Local setup: Copy `.github/.env.example` to `.env.local` in Next.js apps.

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Build Failures

```bash
# Issue: "Module not found" errors
# Solution: Clear cache and reinstall
rm -rf node_modules .pnpm-store
pnpm install --frozen-lockfile

# Issue: TypeScript errors after update
# Solution: Rebuild all packages
pnpm build
pnpm typecheck

# Issue: Next.js build fails with "output: standalone" error
# Solution: studio-hub uses Next.js 14 (not 15) for production stability
# Check next.config.mjs - output mode removed for SSG compatibility
```

#### 2. Test Failures

```bash
# Issue: Tests timing out
# Solution: Increase timeout in vitest.config.ts
testTimeout: 60000  # Increase from 30000

# Issue: Coverage threshold not met
# Solution: Check current coverage
pnpm test:coverage
# Review reports/test-results.json
```

#### 3. ODAVL Loop Issues

```bash
# Issue: Quality gates failing
# Solution: Check gates.yml constraints
cat .odavl/gates.yml
# Ensure risk_budget: 100 is sufficient

# Issue: Recipes not executing
# Solution: Check trust scores
cat .odavl/recipes-trust.json
# Recipes with trust < 0.2 are blacklisted
```

#### 4. VS Code Extension Issues

```bash
# Issue: Extension not loading
# Solution: Check extension logs
# View → Output → Select "ODAVL Studio"

# Issue: Diagnostics not showing
# Solution: Clear and re-analyze
# Ctrl+Shift+P → "ODAVL: Clear Diagnostics"
# Ctrl+Shift+P → "ODAVL: Analyze Workspace"
```

#### 5. CI/CD Workflow Failures

```yaml
# Issue: pnpm version mismatch
# Solution: Update workflow files to use 9.12.2
- uses: pnpm/action-setup@v4
  with:
    version: 9.12.2

# Issue: GitHub Actions secrets missing
# Solution: Add to repository settings
# Settings → Secrets → Actions → New repository secret
# See .github/.env.example for required secrets

# Issue: Branch name validation fails
# Solution: Use correct pattern: odavl/<task>-<YYYYMMDD>
git checkout -b odavl/my-feature-20251127

# Issue: PR exceeds file/LOC limits
# Solution: Split into smaller PRs (max 10 files, 40 LOC)
# Or request manual review bypass from maintainers

# Issue: Golden path validation fails
# Solution: Run locally first
pwsh tools/golden.ps1 -Verbose
# Fix reported issues before pushing
```

#### 6. Multi-Language Detection Issues

```bash
# Issue: Python detector not working
# Solution: Ensure Python environment is activated
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Issue: Java detector fails
# Solution: Check Java version (requires 11+)
java --version
javac --version
```

## Common Pitfalls & Best Practices

### DO ✅

- Use `pnpm` exclusively (monorepo package manager, locked in `package.json`)
- Run `pnpm forensic:all` before committing (lint + typecheck + coverage)
- Use `tsx` for running TypeScript files (NOT `ts-node`, NOT `tsc + node`)
- Import from centralized wrappers (`fs-wrapper.ts`, `cp-wrapper.ts`) for testability
- Check `.odavl/gates.yml` before making file changes (understand constraints)
- Use `Logger` utility for logging (NOT `console.log` - ESLint error)
- Save undo snapshots before modifying files (see `act.ts` pattern)
- Validate metrics with `tsc --noEmit && eslint . -f json` before claiming "zero errors"

### DON'T ❌

- Use npm/yarn/bun (wrong package manager, will cause lock file conflicts)
- Modify files in `security/**`, `auth/**`, `**/*.spec.*` without manual review
- Skip trust score checks when selecting recipes (can execute blacklisted recipes)
- Write to protected paths without validating against `RiskBudgetGuard` first
- Use `console.log/error` (ESLint enforces `no-console: error`)
- Run TypeScript with `tsc` for execution (use `tsx` - `tsc` is for type checking only)
- Commit without running `pnpm forensic:all` (CI will fail)
- Assume `execSync` won't throw - always wrap with `sh()` helper

## VS Code Problems Panel Integration

ODAVL integrates with VS Code's native Problems Panel for real-time issue detection:

### Features

- **Real-time Analysis**: Auto-runs on file save, displays issues alongside TypeScript/ESLint errors
- **12 Detectors**: TypeScript | ESLint | Import | Package | Runtime | Build | Security | Circular | Network | Performance | Complexity | Isolation
- **Severity Mapping**: Critical→Error, High→Warning, Medium→Info, Low→Hint
- **Click-to-Navigate**: Jump directly to error locations from Problems Panel
- **Export/Import**: Extension exports to `.odavl/problems-panel-export.json`, CLI imports for fast analysis

### Usage (Extension)

```typescript
// Extension auto-registers diagnostics on file save
// Manual commands in VS Code:
// Ctrl+Shift+P → "ODAVL: Analyze Workspace" (scan all files)
// Ctrl+Shift+P → "ODAVL: Clear Diagnostics" (clear ODAVL errors)
```

### Usage (CLI)

```bash
# Read from Problems Panel export (fast, ~1s)
pnpm odavl:insight
# Choose: 7. problemspanel (read from VS Code Problems Panel export)

# Full detector run (slower, 10-30s)
pnpm odavl:insight
# Choose: 1-6 for specific detectors, or "all" for comprehensive analysis

# Or use unified CLI:
odavl insight analyze --detectors typescript,eslint
```

### Implementation Pattern

```typescript
// Extension: DiagnosticsService registers with VS Code
const diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl');

// Export format: .odavl/problems-panel-export.json
{
  "timestamp": "2025-01-09T...",
  "diagnostics": {
    "file:///path/to/file.ts": [
      {
        "severity": "error",
        "message": "Hardcoded API key detected",
        "source": "ODAVL/security",
        "range": { "start": { "line": 6, "character": 0 }, ... }
      }
    ]
  }
}
```

## Key Architectural Patterns

### Dual Package Export (packages/insight-core)

```json
"exports": {
  ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
  "./server": { "import": "./dist/server.js", "require": "./dist/server.cjs" }
}
```

Build with `tsup src/index.ts src/server.ts --format esm,cjs --dts` for universal compatibility.

### Prisma Singleton Pattern (apps/insight-cloud, apps/studio-hub)

```typescript
// lib/prisma.ts - Prevents connection leaks in serverless/dev environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Critical**: Always import from `lib/prisma` (NOT direct `@prisma/client`). Used in:

- `apps/studio-hub/lib/prisma.ts` - Marketing hub database
- `odavl-studio/insight/cloud/lib/prisma.ts` - Insight Cloud database

### VS Code Extension Lazy Loading

```typescript
// odavl-studio/*/extension/src/extension.ts
// Services initialized on-demand, not at activation (reduces startup time)
async function activateOnDemand(context: vscode.ExtensionContext) {
  if (!lazyServices.dataService) {
    const ds = new ODAVLDataService(workspaceRoot);
    GlobalContainer.register("ODAVLDataService", ds);
  }
}
```

## Performance & Optimization Patterns

### Command Execution (Never Throws Pattern)

All CLI commands use `sh()` wrapper that **never throws** - always returns `{ out, err }`:

```typescript
// Bad: Direct execSync (throws on non-zero exit)
const out = execSync("eslint .").toString();

// Good: Wrapped execution (captures all output)
const { out, err } = sh("eslint .");
if (err) handleError(err);
```

### File I/O via Wrappers (Testing-First Design)

**Critical**: Never use `fs` or `child_process` directly in autopilot engine - use wrappers for test mocking:

```typescript
// Bad: Direct Node.js APIs
import * as fs from "node:fs";
import { execSync } from "node:child_process";
fs.writeFileSync(path, content);

// Good: Centralized wrappers (autopilot engine pattern)
import * as fsw from "./phases/fs-wrapper";
import { execSync } from "./phases/cp-wrapper";
await fsw.writeFile(path, content, "utf8");
const { out, err } = sh("eslint ."); // sh() uses cp-wrapper internally
```

**Note**: This pattern is specific to `odavl-studio/autopilot/engine`. Other products may use Node.js APIs directly.

### Dual Export Strategy (insight-core)

Package exports both ESM (`import`) and CJS (`require`) for maximum compatibility:

- Build: `tsup src/index.ts src/server.ts src/detector/index.ts src/learning/index.ts --format esm,cjs --dts`
- Exports: Four subpaths with dual formats
  - `.` → `dist/index.{mjs,js}` + types
  - `./server` → `dist/server.{mjs,js}` + types
  - `./detector` → `dist/detector/index.{mjs,js}` + types
  - `./learning` → `dist/learning/index.{mjs,js}` + types
- File extensions: `.mjs` (ESM), `.js` (CJS)
- Used by: CLI (ESM), VS Code extension (CJS/bundled), Next.js apps (ESM)
- SDK wraps this with simpler exports: `@odavl-studio/sdk/insight`

### ML Training & TensorFlow.js Integration

ODAVL Insight uses TensorFlow.js for trust prediction and pattern recognition:

**Training Pipeline:**

```bash
# Collect ML training data from error patterns
pnpm ml:collect          # Collect from current workspace
pnpm ml:collect-all      # Collect from all projects

# Prepare datasets (feature extraction, normalization)
pnpm ml:prepare          # Prepare single workspace data
pnpm ml:prepare-all      # Prepare all collected data

# Generate mock data for testing (when real data insufficient)
pnpm ml:generate-mock    # Generate synthetic error patterns

# Train TensorFlow.js model
pnpm ml:train            # Train trust predictor model

# Manage trained models
pnpm ml:list-models      # List all trained models
pnpm ml:model-info       # Show model details (accuracy, loss)
pnpm ml:delete-model     # Delete specific model version
```

**Model Storage:**

- **Location**: `.odavl/ml-models/` (gitignored, per-workspace)
- **Format**: TensorFlow.js JSON (model.json + weights)
- **Metrics**: Accuracy (target: >80%), validation loss, training history
- **Usage**: Trust score prediction (recipes), error pattern recognition, fix suggestion ranking

**Training Script Pattern:**

```typescript
// scripts/ml-train-model.ts or odavl-studio/insight/core/scripts/train-tensorflow-v2.ts
import * as tf from "@tensorflow/tfjs-node";

// 1. Load prepared dataset from .odavl/datasets/
const { features, labels } = loadDataset();

// 2. Create sequential model (input → dense → dropout → output)
const model = tf.sequential({
  layers: [
    tf.layers.dense({
      inputShape: [featureCount],
      units: 64,
      activation: "relu",
    }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.dense({ units: 32, activation: "relu" }),
    tf.layers.dense({ units: 1, activation: "sigmoid" }), // Trust score 0-1
  ],
});

// 3. Compile with adam optimizer
model.compile({
  optimizer: "adam",
  loss: "binaryCrossentropy",
  metrics: ["accuracy"],
});

// 4. Train with validation split
await model.fit(features, labels, {
  epochs: 50,
  validationSplit: 0.2,
  callbacks: { onEpochEnd: logProgress },
});

// 5. Save to .odavl/ml-models/trust-predictor-v2/
await model.save("file://.odavl/ml-models/trust-predictor-v2");
```

**Critical ML Patterns:**

- **Feature Extraction**: Normalize error counts, complexity scores, file sizes (0-1 range)
- **Label Encoding**: Trust scores from `recipes-trust.json` (success rate 0.1-1.0)
- **Overfitting Prevention**: Dropout layers (0.3 rate), validation split (20%)
- **Model Versioning**: Timestamped directories, keep best 3 models
- **Error Handling**: Graceful fallback to heuristic scoring if model unavailable

## Authentication & Security Patterns

### NextAuth.js Configuration (apps/studio-hub)

```typescript
// apps/studio-hub/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
};
```

**OAuth Setup Requirements:**

1. GitHub OAuth App: https://github.com/settings/developers (callback: `http://localhost:3000/api/auth/callback/github`)
2. Google OAuth Client: https://console.cloud.google.com/ (callback: `http://localhost:3000/api/auth/callback/google`)
3. Environment variables: `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_ID`, `GOOGLE_SECRET`, `NEXTAUTH_SECRET` (64 chars min)
4. Documentation: `OAUTH_SETUP_GUIDE.md` for step-by-step instructions

### Database Setup Pattern

```powershell
# Automated setup (recommended for first-time setup)
.\setup-database.ps1 -UseDocker

# Manual workflow (if Docker already configured)
cd apps/studio-hub
pnpm db:push              # Apply Prisma schema to database
pnpm db:seed              # Seed with demo data (8 projects, 227 errors)
pnpm db:studio            # Open Prisma Studio (database UI)
```

**Database Connection String Pattern:**

```bash
# Development (Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_hub"

# Production (example)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

**Seeding Pattern** (`apps/studio-hub/prisma/seed.ts`):

- Creates demo workspace projects
- Seeds error signatures with realistic patterns
- Includes TypeScript, security, import errors
- Idempotent: Safe to run multiple times
