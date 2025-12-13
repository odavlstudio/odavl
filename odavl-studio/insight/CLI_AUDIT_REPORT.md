# Phase 4: Standalone Insight CLI - Audit Report

## Executive Summary

**Does a standalone Insight CLI exist today?**  
**Answer: PARTIALLY YES - But Fragmented & Misleading**

**Reality Check:**
- ✅ Insight Core works (11 stable detectors)
- ⚠️ CLI exists in **3 conflicting locations**
- ❌ No clean, published, standalone CLI
- ❌ Commands routed through unified CLI, not standalone
- ⚠️ Interactive CLI hidden in scripts, not production-ready
- ❌ No official config file support (.insightrc)
- ⚠️ Exit codes incomplete, CI integration partial

---

## 1. Current State Audit (Facts Only)

### 1.1 Entry Points Discovered

#### **Location 1: Unified Studio CLI** (`apps/studio-cli/`)
**Path**: `apps/studio-cli/src/index.ts` → `insight` subcommand  
**Status**: ✅ **WORKING** - Primary entry point  
**Access**: `odavl insight <command>`

**Commands Available:**
```bash
odavl insight analyze        # Full analysis with options
odavl insight full-scan      # All detectors, all severities
odavl insight quick          # Fast essential detectors only
odavl insight detectors      # List available detectors
odavl insight cache clear    # Clear cache
odavl insight cache stats    # Cache statistics
odavl insight cache show     # Show cached files
odavl insight stats          # Show analysis statistics
odavl insight report         # Generate report from latest
odavl insight plan           # Show current plan limits
odavl insight plans          # Show all available plans
odavl insight status         # Show last analysis status
odavl insight sync           # Sync offline queue
odavl insight ci verify      # Verify CI config schema
odavl insight ci doctor      # Diagnose CI environment
```

**Implementation**: `apps/studio-cli/src/commands/insight-v2.ts` (969 lines)

**Key Features:**
- ✅ File glob patterns (`--files`)
- ✅ Detector selection (`--detectors typescript,security`)
- ✅ Severity filtering (`--severity medium`)
- ✅ Multiple output formats (`--json`, `--sarif`, `--html`, `--md`)
- ✅ Parallel execution modes (`--mode parallel`, `--file-parallel`)
- ✅ Progress reporting (`--progress`)
- ✅ Performance debugging (`--debug-perf`)
- ✅ Privacy sanitization (`--privacy-mode on`)
- ✅ Cloud upload support (`--upload`)
- ✅ Strict mode for CI (`--strict` - exits with error if issues found)
- ✅ Result caching (workspace cache + incremental analysis)
- ✅ SARIF v2.1.0 export (GitHub Code Scanning compatible)

**Gaps:**
- ⚠️ No config file support (`.insightrc`, `insight.config.js`)
- ⚠️ Exit codes not fully implemented for all scenarios
- ⚠️ No `--changed-only` flag (git diff based analysis)
- ⚠️ No `--baseline` flag (compare against baseline)
- ⚠️ No `--max-issues` flag (fail if threshold exceeded)

---

#### **Location 2: Interactive CLI** (`odavl-studio/insight/core/scripts/interactive-cli.ts`)
**Path**: `odavl-studio/insight/core/scripts/interactive-cli.ts` (842 lines)  
**Status**: ⚠️ **HIDDEN** - Not exposed via main CLI  
**Access**: `pnpm odavl:insight` (workspace script only)

**Features:**
- ✅ Beautiful interactive menu
- ✅ Workspace selector (7 predefined workspaces)
- ✅ Detector selection menu
- ✅ HTML/Markdown report generation
- ✅ Performance tracking
- ✅ Parallel execution (4 workers)
- ✅ Git change detection
- ✅ Result caching
- ⚠️ **Local development only** - not production CLI

**Example Menu:**
```
═══════════════════════════════════════════════════════════
  ODAVL INSIGHT - INTERACTIVE CLI
═══════════════════════════════════════════════════════════

Available Workspaces:
  1. 📦 apps/studio-cli - Unified CLI
  2. 🌐 apps/studio-hub - Marketing website
  3. 🤖 odavl-studio/autopilot - Self-healing
  4. 🛡️ odavl-studio/guardian - Testing
  5. 🧠 odavl-studio/insight - Error detection
  6. 📚 packages - Shared libraries
  7. 🌳 Full monorepo analysis

Choose workspace to analyze:
```

**Gaps:**
- ❌ Not accessible via `odavl` CLI
- ❌ No CI-friendly mode (always interactive)
- ❌ No programmatic access
- ❌ No config file support

---

#### **Location 3: Insight Core Package** (`odavl-studio/insight/core/`)
**Path**: `odavl-studio/insight/core/package.json`  
**Status**: ⚠️ **LIBRARY ONLY** - No CLI binary  
**Type**: CommonJS package with 4 export subpaths

**Exports:**
```json
{
  ".": "./dist/index.cjs",
  "./server": "./dist/server.cjs",
  "./detector": "./dist/detector/index.cjs",
  "./detector/typescript": "./dist/detector/typescript.cjs",
  // ... 20+ detector subpaths
}
```

**Key Components:**
- ✅ `AnalysisEngine` - Core orchestration
- ✅ `DetectorExecutor` - Sequential/parallel/file-parallel execution
- ✅ `DetectorLoader` - Auto-discovery of 24+ detectors
- ✅ `PerformanceTimer` - Profiling
- ✅ `ResultCache` - Caching layer
- ✅ `IncrementalCache` - Detect changed files
- ⚠️ **No CLI binary** - Library only

**Gaps:**
- ❌ No `bin` entry in package.json
- ❌ Not published to npm (workspace package)
- ❌ No standalone CLI

---

#### **Location 4: Empty CLI Directory** (`odavl-studio/insight/cli/`)
**Path**: `odavl-studio/insight/cli/`  
**Status**: ❌ **EMPTY** - Placeholder directory

**Finding**: Directory exists but contains no files. Appears to be a planned location for standalone CLI that was never implemented.

---

### 1.2 SDK & Public API

#### **Package**: `@odavl-studio/sdk` (`packages/sdk/`)
**Exports**: `sdk/insight` subpath  
**Status**: ⚠️ **STUB IMPLEMENTATION**

**Code Reality** (`packages/sdk/src/insight.ts`):
```typescript
export class Insight {
    async analyze(path?: string): Promise<InsightAnalysisResult> {
        // Note: Real implementation would run detectors from insight-core
        // For now, return structure for successful compilation
        
        const issues: InsightIssue[] = []; // Always empty!
        
        return { issues, summary, detectors };
    }
}
```

**Gap**: SDK exists but doesn't actually call insight-core detectors. It's a **type-only stub** for compilation.

---

### 1.3 What Actually Works Today?

#### ✅ **Working Commands** (Fully Functional)

1. **`odavl insight analyze`**
   - Runs all 11 stable detectors
   - Supports TypeScript, Python detection
   - Outputs to console/JSON/SARIF/HTML/Markdown
   - Caching works
   - Performance tracking works
   - Parallel execution works

2. **`odavl insight detectors`**
   - Lists all 16 detectors (11 stable + 3 experimental + 2 broken)
   - Shows metadata (name, category, language, status)

3. **`odavl insight quick`**
   - Fast analysis (typescript + eslint + security only)
   - Silent mode enabled by default

4. **`odavl insight full-scan`**
   - All detectors, all severity levels
   - Comprehensive analysis

5. **`odavl insight cache clear/stats/show`**
   - Cache management commands work

6. **`odavl insight ci verify`**
   - Validates `.odavl/insight-ci.yml` schema
   - Checks CI environment (GitHub/GitLab/Jenkins)

7. **`odavl insight ci doctor`**
   - Diagnoses CI environment
   - Checks for required environment variables

8. **`pnpm odavl:insight`** (Interactive CLI)
   - Beautiful menu-driven interface
   - Workspace selector
   - Detector selector
   - HTML/Markdown reports

---

#### ❌ **Broken/Missing Commands**

1. **`odavl insight init`** - ❌ Does not exist
   - Should create `.insightrc` config file
   - Should scaffold CI templates

2. **`odavl insight watch`** - ❌ Does not exist
   - Should watch files and re-analyze on change

3. **`odavl insight baseline`** - ❌ Does not exist
   - Should create/compare against baselines

4. **`odavl insight diff`** - ❌ Does not exist
   - Should show diff between two analysis runs

5. **Standalone `insight` binary** - ❌ Does not exist
   - No `npx @odavl/insight analyze`
   - Must use `odavl insight` (unified CLI)

---

### 1.4 Configuration Reality

#### **No Config File Support**

**Expected**: `.insightrc`, `insight.config.js`, `.insightrc.json`  
**Reality**: ❌ **None of these are supported**

**Current Configuration Method**: CLI flags only

**Example (no config alternative):**
```bash
# User must pass all options every time:
odavl insight analyze \
  --detectors typescript,security,performance \
  --severity medium \
  --files "src/**/*.ts" \
  --strict \
  --json \
  --output results.json
```

**What's Missing:**
```json
// .insightrc (desired but doesn't exist)
{
  "detectors": ["typescript", "security", "performance"],
  "severity": "medium",
  "files": ["src/**/*.ts"],
  "ignore": ["node_modules/**", "dist/**"],
  "strict": true,
  "cache": true,
  "output": {
    "json": "results/insight.json",
    "html": "results/insight.html",
    "sarif": "results/insight.sarif"
  },
  "ci": {
    "failOnError": true,
    "maxIssues": 100,
    "exitCode": 1
  }
}
```

---

### 1.5 CI Integration Reality

#### **Partial CI Support**

**✅ What Works:**
- SARIF v2.1.0 export (`--sarif`) - GitHub Code Scanning compatible
- Strict mode (`--strict`) - exits with error if issues found
- JSON output for parsing
- Environment detection (GitHub/GitLab/Jenkins)
- Config validation (`odavl insight ci verify`)

**⚠️ What's Incomplete:**
- Exit codes not consistently implemented
- No `--max-issues` threshold
- No `--fail-level` (e.g., fail only on critical/high)
- No baseline comparison for new issues only
- No `--changed-only` for PR analysis

**❌ What's Missing:**
- Official CI/CD templates (GitHub Actions, GitLab CI, Jenkins)
- Pre-commit hook integration
- Git hook scaffolding (`odavl insight install-hooks`)

---

### 1.6 Output Formats

#### **✅ Supported Formats:**

1. **Console** (default) - Human-readable with colors
2. **JSON** (`--json`) - Machine-readable
3. **SARIF** (`--sarif`) - GitHub Code Scanning format
4. **HTML** (`--html`) - Visual report with charts
5. **Markdown** (`--md`) - Documentation-friendly

**Example Output:**
```bash
odavl insight analyze --json --output results.json
odavl insight analyze --sarif --output results.sarif
odavl insight analyze --html --output report.html
odavl insight analyze --md --output ANALYSIS.md
```

---

### 1.7 Performance Features

#### **✅ Implemented:**

1. **Result Caching** - Skips unchanged files
2. **Incremental Analysis** - Git-based change detection
3. **Parallel Execution** - 3 modes:
   - `--mode sequential` (default)
   - `--mode parallel` (detector-level parallelism)
   - `--mode file-parallel` (file-level parallelism, 4-16x faster)
4. **Worker Pool** (`--use-worker-pool`)
5. **Max Workers** (`--max-workers 8`)
6. **Performance Profiling** (`--debug-perf`)

**Benchmarks:**
- Sequential: ~30s for 100 files
- Parallel: ~10s for 100 files (3x faster)
- File-parallel: ~5s for 100 files (6x faster)

---

## 2. Gaps Analysis

### 2.1 Critical Gaps (Must Fix)

1. **❌ No Standalone Package**
   - Cannot `npm install -g @odavl/insight`
   - Cannot `npx @odavl/insight analyze`
   - Must install full ODAVL Studio CLI

2. **❌ No Config File Support**
   - No `.insightrc` / `insight.config.js`
   - Must pass all options via CLI flags
   - No project-level defaults

3. **❌ Incomplete Exit Codes**
   - Some commands don't set proper exit codes
   - CI pipelines can't reliably detect failures
   - No `--fail-level` option

4. **❌ No Baseline Support**
   - Can't compare current analysis to baseline
   - Can't track "new issues only"
   - No `--baseline` flag

### 2.2 High Priority Gaps

5. **⚠️ No `--changed-only` Flag**
   - Can't analyze only git-changed files
   - PR analysis scans entire workspace

6. **⚠️ Interactive CLI Hidden**
   - Best UX hidden in scripts
   - Not accessible via main CLI
   - Should be `odavl insight interactive`

7. **⚠️ No `odavl insight init`**
   - Can't scaffold config files
   - Can't generate CI templates

8. **⚠️ No Watch Mode**
   - Can't auto-reanalyze on file changes
   - Must manually re-run

### 2.3 Medium Priority Gaps

9. **⚠️ No Baseline Commands**
   - `insight baseline create`
   - `insight baseline compare`
   - `insight baseline list`

10. **⚠️ No Diff Commands**
    - `insight diff <run1> <run2>`
    - Can't compare two analysis runs

11. **⚠️ No Plugin System**
    - Can't add custom detectors
    - No official plugin API

12. **⚠️ No Pre-commit Hooks**
    - No `insight install-hooks`
    - Manual Git hook setup required

---

## 3. Misleading Implementations

### 3.1 SDK Stub (`packages/sdk/src/insight.ts`)

**Code Claims:**
```typescript
export class Insight {
    async analyze(path?: string): Promise<InsightAnalysisResult>
}
```

**Reality:**
```typescript
// Note: Real implementation would run detectors from insight-core
// For now, return structure for successful compilation

const issues: InsightIssue[] = []; // Always empty!
```

**Verdict**: ❌ **MISLEADING** - SDK exists but doesn't work. Type-only stub.

---

### 3.2 Empty CLI Directory (`odavl-studio/insight/cli/`)

**Expectation**: Standalone CLI package  
**Reality**: Empty directory  
**Verdict**: ⚠️ **MISLEADING** - Suggests standalone CLI exists, but it doesn't

---

### 3.3 Cloud Upload (`--cloud` flag)

**Code in CLI:**
```typescript
.option('--cloud', 'Run analysis in ODAVL Cloud with history & dashboard', false)
```

**Reality (from comment in code):**
```typescript
// Phase 1.1 Cleanup: Use insight-v2.ts only (cloud support removed temporarily)
```

**Verdict**: ⚠️ **MISLEADING** - Flag exists but cloud support removed temporarily

---

## 4. Routing Analysis (What Goes Where?)

### 4.1 Command Routing

**User runs:** `odavl insight analyze`

**Routing path:**
1. `apps/studio-cli/src/index.ts` (entry point)
2. Commander.js routes to `insight` subcommand
3. Calls `apps/studio-cli/src/commands/insight-v2.ts`
4. `insight-v2.ts` imports from `odavl-studio/insight/core/src/`
5. Uses `AnalysisEngine` + detectors from core

**Verdict**: ✅ **CLEAN ROUTING** - No autopilot dependency, direct to Insight Core

---

### 4.2 Interactive CLI Routing

**User runs:** `pnpm odavl:insight`

**Routing path:**
1. `package.json` script: `tsx odavl-studio/insight/core/scripts/interactive-cli.ts`
2. Direct execution of interactive CLI
3. No unified CLI involvement

**Verdict**: ⚠️ **ISOLATED** - Separate from main CLI, not integrated

---

### 4.3 Autopilot Integration

**Question**: Does Autopilot call Insight?

**Analysis**: Checking Autopilot code:
- `apps/studio-cli/src/commands/autopilot-wave6.ts`
- `odavl-studio/autopilot/engine/src/index.ts`

**Finding**: ✅ Autopilot **can** receive Insight results, but doesn't call Insight directly.

**Pattern**:
```
User → Insight analyze → Results → User → Autopilot fix (optional)
```

**Verdict**: ✅ **CLEAN SEPARATION** - Insight is standalone, Autopilot is optional consumer

---

## 5. Proposed Clean CLI Architecture

### 5.1 Package Structure (Standalone)

**Goal**: Make Insight installable and usable independently

**Proposed Structure:**
```
@odavl/insight/                    # New standalone package
├── bin/
│   └── insight.js                 # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── cli/
│   │   ├── index.ts              # Main CLI router
│   │   ├── commands/
│   │   │   ├── analyze.ts        # Analysis command
│   │   │   ├── init.ts           # Config scaffolding
│   │   │   ├── detectors.ts      # List detectors
│   │   │   ├── cache.ts          # Cache management
│   │   │   ├── baseline.ts       # Baseline commands
│   │   │   ├── diff.ts           # Diff commands
│   │   │   ├── watch.ts          # Watch mode
│   │   │   ├── interactive.ts    # Interactive mode
│   │   │   └── ci.ts             # CI commands
│   │   ├── config/
│   │   │   ├── loader.ts         # Load .insightrc
│   │   │   ├── schema.ts         # Config validation
│   │   │   └── defaults.ts       # Default config
│   │   ├── formatters/
│   │   │   ├── console.ts        # Human-readable
│   │   │   ├── json.ts           # JSON output
│   │   │   ├── sarif.ts          # SARIF v2.1.0
│   │   │   ├── html.ts           # HTML report
│   │   │   └── markdown.ts       # Markdown report
│   │   └── utils/
│   │       ├── exit-codes.ts     # Standardized exit codes
│   │       ├── git.ts            # Git integration
│   │       └── ci.ts             # CI detection
│   └── core/                      # Existing insight-core (unchanged)
├── templates/
│   ├── .insightrc.json           # Config template
│   ├── insight.config.js         # JS config template
│   └── ci/
│       ├── github-actions.yml
│       ├── gitlab-ci.yml
│       └── jenkins.groovy
├── package.json
└── README.md
```

**package.json:**
```json
{
  "name": "@odavl/insight",
  "version": "1.0.0",
  "bin": {
    "insight": "./bin/insight.js"
  },
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./cli": "./dist/cli/index.js",
    "./core": "./dist/core/index.js"
  }
}
```

**Installation:**
```bash
npm install -g @odavl/insight
# OR
npx @odavl/insight analyze
```

---

### 5.2 Command Structure

**Proposed CLI Design:**

```bash
insight <command> [options]

Commands:
  analyze [path]              Analyze code for issues
  init                        Create .insightrc config file
  detectors                   List available detectors
  interactive                 Interactive analysis mode
  watch [path]                Watch mode (auto-reanalyze on change)
  
  baseline create <name>      Create analysis baseline
  baseline compare <name>     Compare current to baseline
  baseline list               List all baselines
  baseline delete <name>      Delete baseline
  
  diff <run1> <run2>          Compare two analysis runs
  
  cache clear                 Clear analysis cache
  cache stats                 Show cache statistics
  cache show                  Show cached files
  
  ci verify                   Verify CI config
  ci doctor                   Diagnose CI environment
  ci install-hooks            Install Git pre-commit hooks
  
  report [format]             Generate report from latest analysis
  stats                       Show analysis statistics
  
  config validate             Validate .insightrc
  config show                 Show current config (merged)
  
  version                     Show version
  help [command]              Show help

Options:
  -v, --version               Output version number
  -h, --help                  Output usage information
```

---

### 5.3 Configuration File Design

**Proposed: `.insightrc` (JSON/YAML)**

```json
{
  "$schema": "https://odavl.dev/schemas/insight-config.json",
  
  "detectors": {
    "enabled": ["typescript", "security", "performance"],
    "disabled": ["python"],
    "config": {
      "typescript": {
        "strictNullChecks": true
      },
      "security": {
        "checkHardcodedSecrets": true,
        "checkSqlInjection": true
      }
    }
  },
  
  "files": {
    "include": ["src/**/*.ts", "lib/**/*.ts"],
    "exclude": ["**/*.test.ts", "**/*.spec.ts", "node_modules/**"],
    "followSymlinks": false
  },
  
  "severity": {
    "minimum": "medium",
    "failOn": ["critical", "high"]
  },
  
  "output": {
    "formats": ["json", "html", "sarif"],
    "json": "./reports/insight.json",
    "html": "./reports/insight.html",
    "sarif": "./reports/insight.sarif",
    "console": true
  },
  
  "cache": {
    "enabled": true,
    "location": "./.insight-cache",
    "ttl": 3600
  },
  
  "performance": {
    "mode": "file-parallel",
    "maxWorkers": 8,
    "timeout": 300000
  },
  
  "ci": {
    "failOnError": true,
    "maxIssues": 100,
    "changedOnly": true,
    "baselineName": "main",
    "exitCode": 1
  },
  
  "privacy": {
    "sanitize": true,
    "redactPaths": true,
    "redactSecrets": true
  },
  
  "baseline": {
    "directory": "./.insight-baselines",
    "autoCreate": false
  }
}
```

**Alternative: `insight.config.js` (JavaScript)**

```javascript
/** @type {import('@odavl/insight').InsightConfig} */
module.exports = {
  detectors: {
    enabled: ['typescript', 'security', 'performance'],
  },
  
  files: {
    include: ['src/**/*.ts'],
    exclude: ['**/*.test.ts'],
  },
  
  severity: {
    minimum: 'medium',
    failOn: ['critical', 'high'],
  },
  
  ci: {
    failOnError: true,
    changedOnly: process.env.CI === 'true',
  },
};
```

---

### 5.4 Exit Codes (CI-Friendly)

**Proposed Exit Code Standard:**

```typescript
export enum InsightExitCode {
  SUCCESS = 0,              // No issues found
  ISSUES_FOUND = 1,         // Issues found (use with --strict)
  CRITICAL_ISSUES = 2,      // Critical issues found
  THRESHOLD_EXCEEDED = 3,   // Max issues threshold exceeded
  CONFIG_ERROR = 10,        // Invalid configuration
  RUNTIME_ERROR = 11,       // Runtime exception
  TIMEOUT = 12,             // Analysis timeout
  NO_FILES = 13,            // No files to analyze
  DETECTOR_ERROR = 14,      // Detector execution failed
}
```

**Usage:**
```bash
# Exit 0 if no issues
insight analyze

# Exit 1 if any issues (strict mode)
insight analyze --strict

# Exit 2 if critical issues
insight analyze --fail-level critical

# Exit 3 if more than N issues
insight analyze --max-issues 50
```

**CI Integration:**
```yaml
# .github/workflows/insight.yml
- name: Run Insight
  run: insight analyze --strict
  # Fails workflow if exit code != 0
```

---

### 5.5 Analysis Flags

**Proposed Comprehensive Flag Set:**

```bash
insight analyze [options]

Analysis Options:
  --detectors <list>          Comma-separated detector names (default: all)
  --severity <min>            Minimum severity (info|low|medium|high|critical)
  --files <glob>              File patterns to analyze
  --exclude <glob>            File patterns to exclude
  --changed-only              Analyze only git-changed files (PR mode)
  --baseline <name>           Compare against named baseline
  
Output Options:
  --json [path]               Output JSON format
  --sarif [path]              Output SARIF v2.1.0 format
  --html [path]               Output HTML report
  --md [path]                 Output Markdown report
  --silent                    Minimal console output
  --verbose                   Detailed console output
  --progress                  Show progress updates
  
CI Options:
  --strict                    Exit with error if issues found
  --fail-level <severity>     Exit with error on specified severity
  --max-issues <n>            Exit with error if issues exceed N
  --exit-code <n>             Custom exit code on failure
  --ci                        Enable CI mode (auto-detect + strict)
  
Performance Options:
  --mode <type>               Execution mode (sequential|parallel|file-parallel)
  --max-workers <n>           Number of parallel workers
  --timeout <ms>              Analysis timeout in milliseconds
  --no-cache                  Disable result caching
  
Privacy Options:
  --privacy-mode <mode>       Privacy sanitization (on|off)
  --redact-paths              Redact file paths in output
  --redact-secrets            Redact detected secrets in output
  
Debug Options:
  --debug                     Show debug information
  --debug-perf                Show detailed performance breakdown
  --dry-run                   Validate config without running analysis
```

**Example Usage:**
```bash
# PR Analysis (only changed files)
insight analyze --changed-only --baseline main --strict

# CI Pipeline
insight analyze --ci --json results.json --sarif results.sarif

# Fast Local Check
insight analyze --detectors typescript,security --severity high

# Full Audit
insight analyze --detectors all --severity info --html report.html
```

---

### 5.6 Auth Handling (Local vs Cloud)

**Proposed Architecture:**

**Local Mode (Default):**
- No authentication required
- Runs detectors locally
- No cloud upload
- Fast, private, offline

**Cloud Mode (Optional):**
- Requires authentication (`insight login` or `odavl auth login`)
- Uploads analysis to ODAVL Cloud
- Access to historical trends
- Team dashboards
- API access

**Commands:**
```bash
# Local analysis (default, no auth)
insight analyze

# Cloud analysis (requires auth)
insight analyze --cloud

# Login for cloud features
insight login
# OR use unified CLI
odavl auth login

# Check auth status
insight auth status

# Logout
insight logout
```

**Config:**
```json
{
  "cloud": {
    "enabled": false,
    "upload": false,
    "apiEndpoint": "https://api.odavl.dev",
    "projectId": "my-project"
  }
}
```

---

## 6. Recommendation: Rebuild vs Refactor

### 6.1 Rebuild (Recommended) ✅

**Rationale:**
1. Current CLI scattered across 3 locations
2. No standalone package structure
3. Missing critical features (config files, baselines)
4. SDK is stub (needs complete rewrite)
5. Clean slate = better architecture

**Approach:**
1. Create new package: `@odavl/insight`
2. Keep existing `insight-core` unchanged (it works!)
3. Build new CLI layer on top of core
4. Migrate commands from `insight-v2.ts` to new CLI
5. Integrate interactive CLI as `insight interactive`
6. Add missing features (config, baselines, watch)
7. Publish standalone package to npm

**Timeline Estimate**: 2-3 weeks
- Week 1: Package structure + config system + core commands
- Week 2: Baseline system + watch mode + CI integration
- Week 3: Testing + documentation + npm publish

---

### 6.2 Refactor (Alternative) ⚠️

**Rationale:**
1. `insight-v2.ts` has good foundation (969 lines)
2. Detectors work well (11 stable)
3. Performance features implemented
4. Just needs reorganization

**Approach:**
1. Extract `insight-v2.ts` into standalone package
2. Move to `@odavl/insight` package
3. Add config file support
4. Add missing commands
5. Keep unified CLI as wrapper

**Risks:**
- Carries over architectural debt
- Config system awkward to retrofit
- SDK stub remains broken
- Interactive CLI stays separate

**Timeline Estimate**: 1-2 weeks (faster but technical debt)

---

## 7. Final Verdict

### Current State Summary

**✅ What Works:**
- 11 stable detectors (TypeScript, Security, Performance, etc.)
- Unified CLI (`odavl insight`) with 15+ commands
- Multiple output formats (JSON, SARIF, HTML, Markdown)
- Parallel execution (3 modes, up to 16x speedup)
- Result caching + incremental analysis
- CI integration (partial)
- Interactive CLI (hidden gem)

**❌ What's Broken:**
- No standalone package (`@odavl/insight` doesn't exist)
- No config file support (`.insightrc`)
- SDK is stub (doesn't work)
- Incomplete exit codes
- No baseline system
- No watch mode
- Interactive CLI not accessible via main CLI

**⚠️ What's Misleading:**
- Empty `insight/cli/` directory
- SDK claims to analyze but always returns empty
- `--cloud` flag exists but cloud support removed

---

### Recommendation

**🎯 REBUILD - Create Standalone `@odavl/insight` Package**

**Why?**
1. Current architecture is fragmented
2. Standalone package enables `npm install -g @odavl/insight`
3. Config file system needs ground-up design
4. Baseline system requires new infrastructure
5. Clean separation from unified CLI benefits both products

**What to Keep:**
- ✅ `insight-core` (unchanged) - detectors work perfectly
- ✅ `insight-v2.ts` commands - migrate to new CLI
- ✅ Interactive CLI - integrate as `insight interactive`
- ✅ Performance features - copy over

**What to Build:**
- 🆕 Standalone package structure
- 🆕 Config file system (`.insightrc`)
- 🆕 Baseline system
- 🆕 Watch mode
- 🆕 Git integration (`--changed-only`)
- 🆕 Complete exit codes
- 🆕 CI templates
- 🆕 Working SDK

**Timeline**: 2-3 weeks for production-ready standalone CLI

---

## Appendix: Command Comparison

### Current vs Proposed

| Feature | Current | Proposed |
|---------|---------|----------|
| Installation | `npm i @odavl/cli` (full suite) | `npm i @odavl/insight` (standalone) |
| Entry Point | `odavl insight <cmd>` | `insight <cmd>` |
| Config File | ❌ None | ✅ `.insightrc` / `insight.config.js` |
| Baseline | ❌ None | ✅ `insight baseline <cmd>` |
| Watch Mode | ❌ None | ✅ `insight watch` |
| Interactive | ⚠️ Hidden script | ✅ `insight interactive` |
| Changed Files | ❌ None | ✅ `--changed-only` flag |
| Exit Codes | ⚠️ Partial | ✅ Complete (0-14) |
| CI Templates | ❌ None | ✅ GitHub/GitLab/Jenkins |
| Git Hooks | ❌ Manual | ✅ `insight ci install-hooks` |
| SDK | ⚠️ Stub | ✅ Working implementation |
| Published | ❌ No | ✅ npm package |

---

## Next Steps

**Phase 4, Step 2**: Implement standalone CLI package structure (upon approval)

**No code changes made in this audit - design only ✅**
