# ODAVL CLI Reference

**Version:** 0.1.0  
**Package:** `@odavl-studio/cli`  
**Binary:** `odavl`

---

## Table of Contents

- [Installation](#installation)
- [Global Configuration](#global-configuration)
- [Commands Overview](#commands-overview)
  - [ODAVL Insight Commands](#odavl-insight-commands)
  - [ODAVL Autopilot Commands](#odavl-autopilot-commands)
  - [ODAVL Guardian Commands](#odavl-guardian-commands)
  - [General Commands](#general-commands)
- [Options & Flags](#options--flags)
- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Exit Codes](#exit-codes)
- [Common Workflows](#common-workflows)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g @odavl-studio/cli
```

Verify installation:

```bash
odavl --version
# Output: 2.0.0
```

### Local Installation (Per Project)

```bash
npm install @odavl-studio/cli
```

Run with npx:

```bash
npx odavl --help
```

### System Requirements

- **Node.js:** >= 18.18
- **npm:** >= 9.0 or **pnpm:** >= 9.0
- **OS:** Windows, macOS, Linux

---

## Global Configuration

ODAVL CLI reads configuration from:

1. **`.odavl/` directory** (workspace-specific)
2. **Environment variables** (see [Environment Variables](#environment-variables))
3. **Command-line flags** (highest priority)

### Initialize Workspace

```bash
odavl init
```

Creates `.odavl/` directory with:
- `gates.yml` - Governance rules
- `recipes/` - Improvement recipes
- `history.json` - Run history

---

## Commands Overview

```
odavl <product> <command> [options]
```

### Available Products

- **`insight`** - ML-powered error detection and analysis
- **`autopilot`** - Self-healing code infrastructure (O-D-A-V-L cycle)
- **`guardian`** - Pre-deploy testing and monitoring

---

## ODAVL Insight Commands

**Purpose:** Analyze workspace for errors, security issues, and code quality problems using 12 specialized detectors.

### `odavl insight analyze`

Analyze workspace for errors using selected detectors.

**Usage:**

```bash
odavl insight analyze [options]
```

**Options:**

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `-d, --detectors <list>` | Comma-separated detector list | `typescript,eslint,security` | `--detectors typescript,import` |

**Available Detectors:**

1. **typescript** - TypeScript compiler errors (tsc --noEmit)
2. **eslint** - ESLint rule violations
3. **import** - Import/export issues
4. **package** - Package.json validation
5. **runtime** - Runtime error patterns
6. **build** - Build configuration issues
7. **security** - Security vulnerabilities (hardcoded secrets, XSS)
8. **circular** - Circular dependency detection
9. **network** - Network call patterns
10. **performance** - Performance anti-patterns
11. **complexity** - Code complexity metrics
12. **isolation** - Module isolation violations

**Examples:**

```bash
# Run default detectors (TypeScript + ESLint + Security)
odavl insight analyze

# Run specific detectors
odavl insight analyze --detectors typescript,security

# Run all detectors
odavl insight analyze --detectors all

# Run single detector
odavl insight analyze -d eslint
```

**Output:**

```
✔ Analyzing workspace...
✔ TypeScript: No errors
⚠ ESLint: 12 issues found

Analysis Summary:
  Critical: 0
  High: 3
  Medium: 9
  Low: 2
  Total: 14
```

**Exit Codes:**
- `0` - No critical or high issues
- `1` - Analysis failed or critical issues found

---

### `odavl insight fix`

Get AI-powered fix suggestions for detected issues.

**Usage:**

```bash
odavl insight fix
```

**Requirements:**
- Must run `odavl insight analyze` first
- Requires `.odavl/history.json` with analysis results

**Example:**

```bash
# Analyze first
odavl insight analyze

# Get AI suggestions
odavl insight fix
```

**Output:**

```
⚠ Fix suggestions feature coming soon
✔ Run analysis first with: odavl insight analyze
```

**Status:** 🚧 Coming in v0.2.0 (ML model integration)

---

## ODAVL Autopilot Commands

**Purpose:** Autonomous code improvement through the O-D-A-V-L cycle (Observe, Decide, Act, Verify, Learn).

### `odavl autopilot run`

Execute full O-D-A-V-L improvement cycle.

**Usage:**

```bash
odavl autopilot run [options]
```

**Options:**

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--max-files <number>` | Max files per cycle | `10` | `--max-files 5` |
| `--max-loc <number>` | Max LOC per file | `40` | `--max-loc 20` |

**What It Does:**

1. **Observe:** Collect metrics (TypeScript + ESLint + custom)
2. **Decide:** Select best recipe based on trust scores
3. **Act:** Apply improvements (with undo snapshot)
4. **Verify:** Validate against quality gates (`.odavl/gates.yml`)
5. **Learn:** Update recipe trust scores

**Example:**

```bash
# Run with default limits
odavl autopilot run

# Run with custom governance
odavl autopilot run --max-files 5 --max-loc 20

# Conservative mode (minimal changes)
odavl autopilot run --max-files 3 --max-loc 15
```

**Output:**

```
🚀 ODAVL Autopilot: O-D-A-V-L Cycle

Governance: max 10 files, 40 LOC per file

✔ Observe: Metrics collected
✔ Decide: Recipe selected
✔ Act: 3 files modified
✔ Verify: Quality gates passed
✔ Learn: Trust scores updated

✅ O-D-A-V-L Cycle Complete

Run ID: 1732368000000
Check .odavl/ledger/run-1732368000000.json for details
```

**Safety Features:**

- Undo snapshots created before changes
- Protected paths never modified (see `.odavl/gates.yml`)
- Risk budget enforced (max files/LOC limits)
- Automatic rollback on verification failure

**Exit Codes:**
- `0` - Cycle completed successfully
- `1` - Cycle failed (changes rolled back)

---

### `odavl autopilot observe`

Run Observe phase only (collect metrics).

**Usage:**

```bash
odavl autopilot observe
```

**What It Does:**

- Runs TypeScript compiler (`tsc --noEmit`)
- Runs ESLint (`eslint . --format json`)
- Collects custom metrics
- Writes to `.odavl/metrics/`

**Example:**

```bash
odavl autopilot observe
```

**Output:**

```
✔ Observe: Metrics collected
```

---

### `odavl autopilot decide`

Run Decide phase only (select recipe).

**Usage:**

```bash
odavl autopilot decide
```

**What It Does:**

- Loads recipes from `.odavl/recipes/`
- Reads trust scores from `.odavl/recipes-trust.json`
- Selects highest-trust applicable recipe
- Logs decision to `.odavl/logs/odavl.log`

**Example:**

```bash
odavl autopilot decide
```

**Output:**

```
✔ Decide: Recipe selected
```

---

### `odavl autopilot act`

Run Act phase only (apply improvements).

**Usage:**

```bash
odavl autopilot act
```

**What It Does:**

- Reads selected recipe from Decide phase
- Creates undo snapshot (`.odavl/undo/<timestamp>.json`)
- Applies file modifications
- Writes ledger (`.odavl/ledger/run-<id>.json`)

**Example:**

```bash
odavl autopilot act
```

**Output:**

```
✔ Act: No changes needed (dry run)
```

**Warning:** Only run after `odavl autopilot decide`

---

### `odavl autopilot verify`

Run Verify phase only (check quality gates).

**Usage:**

```bash
odavl autopilot verify
```

**What It Does:**

- Re-runs quality checks (TypeScript, ESLint)
- Validates against `.odavl/gates.yml` rules
- Creates attestation if improved
- Rolls back if verification fails

**Example:**

```bash
odavl autopilot verify
```

**Output:**

```
✔ Verify: Quality gates passed
```

---

### `odavl autopilot learn`

Run Learn phase only (update trust scores).

**Usage:**

```bash
odavl autopilot learn
```

**What It Does:**

- Reads verification results
- Updates `.odavl/recipes-trust.json`
- Adjusts trust scores (0.1-1.0 range)
- Blacklists recipes with 3+ consecutive failures

**Example:**

```bash
odavl autopilot learn
```

**Output:**

```
✔ Learn: Trust scores updated
```

---

### `odavl autopilot undo`

Undo last change or restore specific snapshot.

**Usage:**

```bash
odavl autopilot undo [options]
```

**Options:**

| Flag | Description | Example |
|------|-------------|---------|
| `--snapshot <id>` | Snapshot ID to restore | `--snapshot 1732368000000` |

**Example:**

```bash
# Undo last change
odavl autopilot undo

# Restore specific snapshot
odavl autopilot undo --snapshot 1732368000000

# List available snapshots
ls .odavl/undo/
```

**Output:**

```
✔ Changes reverted successfully
Restored from: 1732368000000.json
```

---

## ODAVL Guardian Commands

**Purpose:** Pre-deploy testing for accessibility, performance, security, and SEO.

### `odavl guardian test`

Run pre-deploy tests on a URL.

**Usage:**

```bash
odavl guardian test <url> [options]
```

**Arguments:**

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `<url>` | Yes | URL to test | `https://example.com` |

**Options:**

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--tests <list>` | Comma-separated test list | `all` | `--tests accessibility,performance` |

**Available Tests:**

1. **accessibility** - WCAG 2.1 AA compliance
2. **performance** - Core Web Vitals (LCP, FID, CLS)
3. **security** - HTTPS, headers, vulnerabilities
4. **seo** - Meta tags, structured data, robots.txt

**Examples:**

```bash
# Run all tests
odavl guardian test https://example.com

# Run specific tests
odavl guardian test https://example.com --tests accessibility,performance

# Run single test
odavl guardian test https://example.com --tests security
```

**Output:**

```
🛡️  ODAVL Guardian: Pre-Deploy Tests

Target: https://example.com
Tests: all

✔ accessibility: 95/100 - Excellent
⚠ performance: 72/100 - Needs improvement
✔ security: 88/100 - Excellent
✔ seo: 91/100 - Excellent

Test Summary:
  Passed: 3
  Failed: 0
  Warnings: 1

✅ Deployment approved
```

**Exit Codes:**
- `0` - All tests passed (score >= 70)
- `1` - One or more tests failed (score < 70)

---

### `odavl guardian accessibility`

Run accessibility tests only.

**Usage:**

```bash
odavl guardian accessibility <url>
```

**Example:**

```bash
odavl guardian accessibility https://example.com
```

**Output:**

```
✔ accessibility: 95/100 - Excellent
```

---

### `odavl guardian performance`

Run performance tests only.

**Usage:**

```bash
odavl guardian performance <url>
```

**Example:**

```bash
odavl guardian performance https://example.com
```

**Output:**

```
⚠ performance: 72/100 - Needs improvement
```

---

### `odavl guardian security`

Run security tests only.

**Usage:**

```bash
odavl guardian security <url>
```

**Example:**

```bash
odavl guardian security https://example.com
```

**Output:**

```
✔ security: 88/100 - Excellent
```

---

## General Commands

### `odavl info`

Show ODAVL Studio information and product overview.

**Usage:**

```bash
odavl info
```

**Output:**

```
🚀 ODAVL Studio v2.0.0

ODAVL Insight:   ML-powered error detection
ODAVL Autopilot: Self-healing code infrastructure
ODAVL Guardian:  Pre-deploy testing & monitoring

Run odavl <command> --help for more information
```

---

### `odavl --version`

Show CLI version.

**Usage:**

```bash
odavl --version
```

**Output:**

```
2.0.0
```

---

### `odavl --help`

Show help for all commands.

**Usage:**

```bash
odavl --help
odavl insight --help
odavl autopilot --help
odavl guardian --help
```

---

## Options & Flags

### Global Options

Available for all commands:

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help for command |
| `-V, --version` | Show CLI version |

### Command-Specific Options

See individual command documentation above.

---

## Configuration Files

### `.odavl/gates.yml`

Governance rules for autopilot.

**Location:** `<workspace>/.odavl/gates.yml`

**Example:**

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

**Fields:**

- `risk_budget` - Maximum risk points per cycle
- `forbidden_paths` - Glob patterns for protected files
- `actions.max_auto_changes` - Max files per cycle
- `actions.max_files_per_cycle` - Alias for max_auto_changes
- `thresholds.max_consecutive_failures` - Blacklist threshold

---

### `.odavl/recipes-trust.json`

Recipe trust scores (0.1-1.0).

**Location:** `<workspace>/.odavl/recipes-trust.json`

**Example:**

```json
{
  "fix-unused-imports": {
    "trust": 0.92,
    "runs": 48,
    "successes": 44,
    "failures": 4,
    "lastRun": "2025-11-23T10:30:00Z"
  },
  "upgrade-dependencies": {
    "trust": 0.15,
    "runs": 8,
    "successes": 1,
    "failures": 7,
    "blacklisted": true,
    "lastRun": "2025-11-22T14:20:00Z"
  }
}
```

**Fields:**

- `trust` - Trust score (0.1-1.0)
- `runs` - Total executions
- `successes` - Successful runs
- `failures` - Failed runs
- `blacklisted` - True if 3+ consecutive failures
- `lastRun` - ISO 8601 timestamp

---

### `.odavl/history.json`

Run history (append-only).

**Location:** `<workspace>/.odavl/history.json`

**Example:**

```json
{
  "runs": [
    {
      "runId": "1732368000000",
      "timestamp": "2025-11-23T10:30:00Z",
      "product": "autopilot",
      "command": "run",
      "status": "success",
      "metrics": {
        "filesModified": 3,
        "linesChanged": 87,
        "errorsFixed": 5
      }
    }
  ]
}
```

---

## Environment Variables

### `ODAVL_LOG_LEVEL`

Set logging verbosity.

**Values:** `debug`, `info`, `warn`, `error`  
**Default:** `info`

**Example:**

```bash
export ODAVL_LOG_LEVEL=debug
odavl autopilot run
```

---

### `ODAVL_CONFIG_PATH`

Override `.odavl/` directory location.

**Default:** `<workspace>/.odavl`

**Example:**

```bash
export ODAVL_CONFIG_PATH=/custom/path/.odavl
odavl insight analyze
```

---

### `ODAVL_NO_COLOR`

Disable colored output.

**Values:** `1`, `true`  
**Default:** (colors enabled)

**Example:**

```bash
export ODAVL_NO_COLOR=1
odavl info
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error or command failed |
| `2` | Invalid arguments or configuration |
| `130` | Interrupted by user (Ctrl+C) |

---

## Common Workflows

### Workflow 1: First-Time Analysis

```bash
# 1. Install CLI
npm install -g @odavl-studio/cli

# 2. Navigate to project
cd /path/to/project

# 3. Run analysis
odavl insight analyze

# 4. Review results in terminal
```

---

### Workflow 2: Automated Improvement Cycle

```bash
# 1. Run full autopilot cycle
odavl autopilot run

# 2. Review ledger
cat .odavl/ledger/run-*.json | tail -1

# 3. If unsatisfied, undo
odavl autopilot undo

# 4. If satisfied, commit
git add .
git commit -m "chore: apply autopilot improvements"
```

---

### Workflow 3: Pre-Deploy Testing

```bash
# 1. Deploy to staging
./deploy-staging.sh

# 2. Run guardian tests
odavl guardian test https://staging.example.com

# 3. If passed, deploy to production
./deploy-production.sh

# 4. Run guardian on production
odavl guardian test https://example.com
```

---

### Workflow 4: CI/CD Integration

```yaml
# .github/workflows/quality.yml
name: ODAVL Quality Check

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Insight Analysis
        run: odavl insight analyze
      
      - name: Run Guardian Tests (if staging URL)
        if: env.STAGING_URL
        run: odavl guardian test ${{ env.STAGING_URL }}
```

---

## Examples

### Example 1: Analyze TypeScript Project

```bash
# Navigate to TypeScript project
cd my-typescript-app

# Run TypeScript and ESLint detectors
odavl insight analyze --detectors typescript,eslint

# Expected output:
# ✔ TypeScript: No errors
# ✔ ESLint: No errors
# Analysis Summary:
#   Total: 0
```

---

### Example 2: Run Autopilot with Conservative Settings

```bash
# Run with strict limits
odavl autopilot run --max-files 3 --max-loc 15

# Review changes
git diff

# Undo if needed
odavl autopilot undo

# Commit if satisfied
git add .
git commit -m "chore: autopilot improvements"
```

---

### Example 3: Test Staging Environment

```bash
# Run all pre-deploy tests
odavl guardian test https://staging.example.com

# If performance warning:
odavl guardian performance https://staging.example.com

# Get detailed performance report
# (Output will show LCP, FID, CLS scores)
```

---

### Example 4: Phase-by-Phase Autopilot

```bash
# Run each phase manually for debugging

# 1. Collect metrics
odavl autopilot observe
cat .odavl/metrics/latest.json

# 2. Select recipe
odavl autopilot decide
cat .odavl/logs/odavl.log | tail -20

# 3. Apply changes
odavl autopilot act
git diff

# 4. Verify quality
odavl autopilot verify

# 5. Update trust scores
odavl autopilot learn
cat .odavl/recipes-trust.json
```

---

## Troubleshooting

### Issue 1: "Command not found: odavl"

**Cause:** CLI not installed globally or PATH issue.

**Solution:**

```bash
# Check if installed
npm list -g @odavl-studio/cli

# Reinstall
npm install -g @odavl-studio/cli

# Verify PATH
which odavl  # Unix
where odavl  # Windows
```

---

### Issue 2: "No .odavl directory found"

**Cause:** Workspace not initialized.

**Solution:**

```bash
# Initialize workspace
mkdir .odavl
echo "risk_budget: 100" > .odavl/gates.yml

# Or run autopilot to auto-create
odavl autopilot run
```

---

### Issue 3: "TypeScript errors: Cannot find module"

**Cause:** Dependencies not installed.

**Solution:**

```bash
# Install dependencies first
npm install
# or
pnpm install

# Then run analysis
odavl insight analyze
```

---

### Issue 4: "Autopilot undo: No snapshots found"

**Cause:** No previous autopilot run.

**Solution:**

```bash
# Run autopilot first
odavl autopilot run

# Then undo
odavl autopilot undo
```

---

### Issue 5: "Guardian test: Invalid URL"

**Cause:** URL missing protocol.

**Solution:**

```bash
# Bad
odavl guardian test example.com

# Good
odavl guardian test https://example.com
```

---

## Additional Resources

- **Documentation:** https://docs.odavl.studio
- **GitHub:** https://github.com/odavl/odavl-studio
- **Issues:** https://github.com/odavl/odavl-studio/issues
- **Discord:** https://discord.gg/odavl

---

**Last Updated:** November 23, 2025  
**CLI Version:** 0.1.0  
**Author:** ODAVL Studio Team
