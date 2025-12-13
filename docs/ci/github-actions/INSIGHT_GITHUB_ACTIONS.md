# ODAVL Insight: GitHub Actions Integration Reference

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Audience**: Platform Engineers, DevOps Teams, CI/CD Architects

---

## Overview

ODAVL Insight integrates with GitHub Actions using standard shell steps that invoke the CLI directly. Unlike typical CI analyzers that default to aggressive failure policies, Insight operates on explicit, predictable rules designed to support forward progress while maintaining quality standards.

### Why Insight Behaves Differently

Most code analysis tools in CI default to blocking behavior: find any issue, fail the build. This approach creates friction in established codebases where legacy technical debt exists but does not justify blocking new work.

Insight uses **delta-first analysis**: compare current PR against baseline (typically `main` branch HEAD) and evaluate only new issues introduced by current changes. Legacy issues are visible but non-blocking. This design rewards incremental improvement without penalizing contributors for historical debt.

### Explicit Statement: "This Will NOT Fail Your Pipeline Unexpectedly"

**Default Behavior**: Insight fails PR checks only when new **Critical** severity issues are introduced. Critical classification is reserved for objective defects:
- Hardcoded secrets (API keys, passwords, tokens)
- Security vulnerabilities (SQL injection, XSS patterns)
- Circular dependencies blocking builds
- Type errors preventing compilation

**Medium and Low severity issues never fail CI by default.** High severity issues (complexity, performance anti-patterns) generate warnings but remain non-blocking.

Teams can tighten failure policies via configuration (`.odavl/gates.yml`), but defaults prioritize pragmatic forward progress over idealistic perfection.

---

## Common Design Rules

### Deterministic Execution

Every workflow execution with identical inputs (commit SHA, Insight version, configuration) produces identical results. No machine learning variability, no heuristic drift, no environmental dependencies.

**Implementation**: Pin Insight CLI version in workflow (`@odavl-studio/cli@1.2.3`) or use lockfile-managed versions. Configuration files (`.odavl/config.json`, `.odavl/gates.yml`) are version-controlled and loaded from repository.

**Verification**: Re-run workflow on same commit after weeks or months—results remain identical.

### Delta-Based Analysis

PR workflows compare current branch analysis against baseline (target branch HEAD). Only issues absent in baseline and present in current branch trigger CI actions.

**Implementation**: Workflows checkout target branch (e.g., `main`), run baseline analysis, checkout PR branch, run current analysis, compute delta via CLI (`--delta-mode --baseline-ref origin/main`).

**Benefit**: Contributors address problems they introduce, not accumulated technical debt from previous work.

### Local/CI Parity

Developers running `odavl insight analyze` locally see identical results to CI execution. No CI-specific configuration, no hidden behavior, no environment-dependent logic.

**Implementation**: Workflows execute same CLI commands developers use locally. Configuration files are version-controlled (not environment variables or GitHub secrets). CI logs include full command invocation for reproducibility.

**Verification**: Developer checks out PR branch, runs logged CLI command verbatim—results match CI output exactly.

### Explicit Failure Rules

Workflows fail only under documented conditions. No silent failures, no ambiguous exit codes, no undocumented behavior.

**PR Workflow Failures**:
1. Delta contains 1+ Critical severity issues (new issues not in baseline)
2. Detector execution fails (crash, timeout, resource exhaustion)
3. Configuration validation fails (invalid YAML schema, contradictory rules)
4. Baseline fetch fails (cannot access target branch, network timeout)

**Main Branch Workflow**: Never fails on quality issues, only operational errors (disk full, out of memory).

**Scheduled Workflow**: Never fails on quality issues, only infrastructure problems.

### No Automatic Uploads

Cloud sync (uploading analysis results to ODAVL dashboard) requires explicit opt-in via `ODAVL_API_TOKEN` secret. Workflows without this secret operate entirely locally—no network requests, no authentication attempts, no degraded functionality.

**Implementation**: Upload step is conditional (`if: env.ODAVL_API_TOKEN != ''`) and runs after analysis completes. Analysis failure does not prevent upload (results uploaded regardless for debugging).

**Privacy**: Teams in air-gapped environments or with data residency requirements can use Insight without modification—simply omit `ODAVL_API_TOKEN` secret.

---

## Required Assumptions

### Insight Installed via npm / pnpm

Workflows assume Insight CLI is installed via Node.js package manager. Two installation patterns supported:

**Global Installation**:
```bash
npm install -g @odavl-studio/cli
odavl insight analyze
```

**Local npx Execution** (no installation):
```bash
npx @odavl-studio/cli@1.2.3 insight analyze
```

**Lockfile-Managed** (recommended for determinism):
```json
// package.json
{
  "devDependencies": {
    "@odavl-studio/cli": "1.2.3"
  }
}
```
```bash
pnpm install
pnpm exec odavl insight analyze
```

### Repo Checkout Already Done

Workflows assume `actions/checkout@v4` runs before Insight analysis. Checkout must include sufficient Git history for baseline comparison:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Full history (required for delta analysis)
```

**Shallow Checkouts**: If repository is large (>1GB), use `fetch-depth: 100` to include recent history. Delta analysis requires target branch HEAD to be present in local Git history.

### No Secrets Required by Default

Insight operates without authentication for local analysis. Workflows run successfully without any GitHub secrets configured.

**Optional Secrets** (for cloud features):
- `ODAVL_API_TOKEN`: Authentication token for cloud dashboard upload (opt-in)

**Not Required**:
- Database credentials (analysis is local-only)
- API keys for external services (no third-party integrations)
- License keys (Insight is usage-based, not license-based)

---

## Workflow: Pull Request (insight-pr.yml)

### Trigger

```yaml
on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]
```

**Event Types**:
- `opened`: PR created
- `synchronize`: New commits pushed to PR branch
- `reopened`: Previously closed PR reopened

**Branch Filter**: Analyze only PRs targeting protected branches (`main`, `develop`). Feature-to-feature PRs skip analysis to reduce CI load.

### Execution Flow

1. **Checkout with Full History**: Fetch complete Git history for baseline comparison
2. **Install Insight CLI**: Via npm/pnpm or npx
3. **Run Delta Analysis**: Compare PR branch against target branch HEAD
4. **Upload SARIF**: Integrate with GitHub Code Scanning (optional)
5. **Post PR Comment**: Summarize findings with file paths and line numbers
6. **Set Commit Status**: Pass (green), fail (red), or neutral (yellow warning)

### Fail ONLY On

**New Critical Issues**:
- Hardcoded secrets detected in changed files
- Security vulnerabilities introduced by PR changes
- Circular dependencies created by new imports
- Type errors preventing compilation (TypeScript, Java)

**Detector Execution Errors**:
- Detector crash (uncaught exception)
- Analysis timeout (>5 minutes by default)
- Resource exhaustion (out of memory, disk full)
- Invalid configuration (`.odavl/gates.yml` schema violation)

**Exit Code**: Non-zero from `odavl insight analyze --fail-on-critical --delta-mode`

### Warn (But Pass) on New High Issues

**High Severity Examples**:
- Functions with cyclomatic complexity >20 (threshold configurable)
- Performance anti-patterns (synchronous I/O in loops)
- Architectural violations (imports from forbidden paths)
- Unused exports in public APIs

**Behavior**: Workflow exits successfully (status check green or neutral), but PR comment includes "⚠️ Quality Concerns" section listing High issues. Merge button remains enabled without friction.

**Rationale**: High issues indicate significant technical debt but not objective defects. Blocking merges on subjective quality judgments erodes trust. Reviewer can assess context and approve merge with justification.

### Explicitly Ignore Legacy Findings

Delta analysis automatically filters baseline issues. PR check evaluates only new problems introduced by current changes.

**Implementation**: Baseline snapshot fetched from target branch HEAD (`origin/main`) or cloud dashboard (if configured). Only issues absent in baseline trigger CI actions.

**Example**: Baseline contains 47 complexity warnings. PR introduces 2 new complexity warnings and fixes 3 existing ones. CI evaluates only the 2 new warnings—net change is improvement despite absolute count remaining high.

### Use Annotations (Not Dashboard Links)

Findings are presented as GitHub PR comments and Code Scanning annotations—no requirement to visit external dashboards.

**PR Comment Format**:
```markdown
## 🔍 ODAVL Insight Analysis

### ❌ Critical Issues (1)
- **Hardcoded Secret**: API key detected in `src/config.ts:23`
  ```
  const API_KEY = "sk-prod-abc123..."  // ❌ Exposed credential
  ```
  **Fix**: Move to environment variable (`process.env.API_KEY`)

### ⚠️ Quality Concerns (2 High)
- **High Complexity**: `processPayment()` in `src/payment.ts:145-312` (cyclomatic: 23, threshold: 10)
- **Performance**: Synchronous file read in loop (`src/loader.ts:67`)

### ✅ Delta Summary
- New issues: 3 (1 Critical, 2 High)
- Resolved issues: 5 (baseline comparison)
- Net change: +3 issues
```

**Code Scanning Integration**: Upload SARIF to GitHub Advanced Security (if enabled) for inline annotations in Files Changed view.

---

## Workflow: Main Branch (insight-main.yml)

### Trigger

```yaml
on:
  push:
    branches: [main]
```

**Event**: Every push to `main` branch (typically after PR merge).

**Purpose**: Establish new baseline for future PR comparisons, generate quality trend data, archive historical snapshots.

### Execution Flow

1. **Checkout Main Branch**: No history required (analyzing current state)
2. **Install Insight CLI**
3. **Run Full Analysis**: No delta filtering—report all issues
4. **Generate Baseline Artifact**: Export results to JSON or SARIF
5. **Upload to Cloud Dashboard** (optional): Historical trend tracking
6. **Archive Artifact**: Store results for compliance/audit

### NEVER Fail the Build

**Exit Code Handling**: Workflow always exits successfully unless operational failure occurs (out of memory, disk full, detector crash).

**Rationale**: Main branch reflects merged work approved through PR process. Failing main branch CI creates ambiguity ("Is the branch broken or just low quality?"). Quality metrics are informational, not blocking.

**Quality Issues**: Reported to cloud dashboard or stored as artifacts but do not fail CI. Teams monitor quality trends over time ("Is complexity increasing?") without blocking deployments.

### Generate Baseline Artifact

**Output Formats**:
- **JSON**: Machine-readable, suitable for custom tooling and analysis scripts
- **SARIF**: Standard format for code scanning integration

**Storage**: Upload as GitHub Actions artifact with 90-day retention (configurable). Teams can download historical baselines for compliance audits.

**Example**:
```yaml
- name: Archive Baseline
  uses: actions/upload-artifact@v4
  with:
    name: insight-baseline-${{ github.sha }}
    path: .odavl/baseline.json
    retention-days: 90
```

### Why Blocking Main Is Forbidden

**Scenario**: Main branch CI starts failing on quality issues after configuration change (lower complexity threshold). Deployments blocked until threshold reverted or all issues fixed.

**Problem**: Configuration changes should inform refactoring priorities, not block production releases. Failing main branch conflates operational health (build system functional) with quality posture (technical debt level).

**Solution**: Main branch CI always succeeds operationally. Quality degradation triggers alerts (Slack, email) and appears in dashboards but does not prevent deployments. Teams address quality issues through prioritized refactoring, not emergency fixes under deployment pressure.

---

## Workflow: Scheduled / Nightly (insight-nightly.yml)

### Trigger

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:     # Manual trigger option
```

**Frequency**: Daily at 2 AM UTC (adjust per team preference). Avoids business hours to reduce resource contention.

**Manual Trigger**: `workflow_dispatch` allows on-demand execution for testing or emergency analysis.

### Execution Flow

1. **Checkout Main Branch**: Analyze current production state
2. **Install Insight CLI**
3. **Run Full Analysis**: All detectors, all projects
4. **Compare Against Previous Run**: Trend analysis (issues added/resolved since yesterday)
5. **Generate Summary Report**: Markdown or HTML summary
6. **Upload to Cloud Dashboard** (optional): Long-term trend tracking
7. **Send Notification** (optional): Email or Slack summary to team leads

### Trend-Oriented Output

**Focus**: Week-over-week and month-over-month trends, not absolute issue counts.

**Metrics**:
- **Velocity**: Issues resolved vs introduced (net change)
- **Hotspots**: Files with increasing complexity or issue density
- **Staleness**: Issues unaddressed for >90 days
- **Detector Coverage**: New detectors enabled, deprecated detectors removed

**Example Summary**:
```markdown
# ODAVL Insight Nightly Report
Date: 2025-12-12

## Trend Analysis (Last 7 Days)
- Issues resolved: 23
- Issues introduced: 15
- Net improvement: -8 issues (5.2% reduction)

## Hotspots (Increasing Complexity)
1. `src/payment/processor.ts`: Complexity +12% (18 → 22)
2. `src/auth/validator.ts`: Complexity +8% (14 → 16)

## Staleness Alert
- 12 High-severity issues unaddressed >90 days
- Oldest issue: Circular dependency in `src/core` (introduced 2024-09-15)
```

### No Gating

Scheduled workflows never block deployments or set commit statuses. Purpose is observability, not enforcement.

**Failure Conditions**: Workflow fails only on infrastructure issues (network timeout, disk full, API unavailable). Quality issues do not fail workflow.

**Rationale**: Nightly runs provide early warning for quality decay. Teams review trends during sprint planning ("Complexity increasing—prioritize refactoring next sprint") without immediate action requirements.

### Optional Artifact Retention

**Short-Term Artifacts** (7-30 days):
- Daily analysis results for trend calculation
- SARIF outputs for historical comparison

**Long-Term Storage** (1+ years):
- Monthly snapshots uploaded to cloud dashboard
- Quarterly summary reports archived for compliance

**Configuration**:
```yaml
retention-days: 30  # GitHub Actions artifact retention
```

Cloud dashboard (if configured) provides unlimited retention with no workflow artifact costs.

---

## Exit Code Mapping

### Exact Meaning of Each Exit Code

**Exit Code 0 (Success)**:
- Analysis completed successfully
- Quality issues may exist but are handled per configuration (warnings only, no blocking issues)
- Baseline comparison succeeded (delta analysis valid)
- All detectors executed without errors

**Exit Code 1 (Analysis Failure)**:
- Detector execution failed (crash, uncaught exception)
- Configuration validation failed (invalid YAML, contradictory rules)
- Resource exhaustion (out of memory, timeout >5 minutes)
- Baseline fetch failed (cannot access target branch, network timeout)

**Exit Code 2 (Quality Gate Failure)**:
- Delta contains 1+ Critical severity issues (PR mode only)
- Configured gates exceeded (custom threshold violations)
- Override expired without renewal (time-limited exceptions)

**Exit Code 3 (Configuration Error)**:
- Invalid command-line arguments
- Missing required files (`.odavl/config.json` not found)
- Conflicting options (e.g., `--delta-mode` without `--baseline-ref`)

### How GitHub Actions Interprets Exit Codes

**Non-Zero Exit → Step Failure**:
- Workflow execution stops (unless `continue-on-error: true`)
- Commit status set to "failure" (red X)
- Subsequent steps skipped (unless `if: always()` condition)

**Zero Exit → Step Success**:
- Workflow continues to next step
- Commit status set to "success" (green checkmark) or "neutral" (gray dot, if warnings present)

**Conditional Execution**:
```yaml
- name: Run Analysis
  id: insight
  run: odavl insight analyze --fail-on-critical --delta-mode
  continue-on-error: true  # Prevent workflow abort on failure

- name: Upload Results
  if: always()  # Run even if analysis failed
  run: odavl insight upload
```

---

## Anti-Patterns (Explicitly Forbidden)

### Failing PRs on Medium/Low Severity

**Anti-Pattern**:
```yaml
# ❌ FORBIDDEN
run: odavl insight analyze --fail-on medium --delta-mode
```

**Why Forbidden**: Medium and Low severity classifications represent subjective quality opinions, not objective defects. Blocking PRs for stylistic disagreements erodes developer trust and creates gatekeeping friction.

**Correct Approach**: Fail only on Critical issues (default). Teams requiring stricter enforcement should fail on High severity via configuration (`.odavl/gates.yml`), not command-line flags.

### Uploading Results Automatically Without Opt-In

**Anti-Pattern**:
```yaml
# ❌ FORBIDDEN
env:
  ODAVL_API_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Wrong token type
run: |
  odavl insight analyze
  odavl insight upload --force  # Automatic upload
```

**Why Forbidden**: Automatic uploads without explicit opt-in violate privacy-first design. Teams in regulated environments or air-gapped deployments cannot use workflows that require cloud connectivity.

**Correct Approach**: Cloud upload is conditional and requires dedicated secret:
```yaml
- name: Upload Results (Optional)
  if: env.ODAVL_API_TOKEN != ''
  env:
    ODAVL_API_TOKEN: ${{ secrets.ODAVL_API_TOKEN }}
  run: odavl insight upload
```

### Using Insight as a Security Scanner

**Anti-Pattern**:
```yaml
# ❌ MISLEADING
- name: Security Scan
  run: odavl insight analyze --detectors security
```

**Why Forbidden**: Insight detects common security patterns (hardcoded secrets, SQL injection templates) but lacks CVE database and dependency vulnerability tracking. Relying solely on Insight for security creates false confidence.

**Correct Approach**: Use Insight for code-level security patterns. Complement with dedicated security tools (Snyk, Dependabot, GitHub Advanced Security) for comprehensive vulnerability management.

### Blocking Releases on Historical Debt

**Anti-Pattern**:
```yaml
# ❌ FORBIDDEN
on:
  push:
    tags: ['v*']  # Release tags
jobs:
  insight:
    steps:
      - run: odavl insight analyze --fail-on high  # Blocks release
```

**Why Forbidden**: Release tags represent vetted, approved code. Failing release builds on quality issues (especially legacy debt) blocks production deployments without corresponding bug fixes.

**Correct Approach**: Analyze releases for observability but never block. Quality metrics inform post-release refactoring priorities, not release decisions.

---

## Customization Section

### How Teams Can Tighten Gates Responsibly

**Gradual Enforcement**: Start with default gates (fail on Critical only), observe false positive rate and team friction for 1-2 sprints, then incrementally tighten if justified.

**Configuration-Based Tightening** (`.odavl/gates.yml`):
```yaml
failure_policy:
  fail_on:
    - critical      # Default
    - high          # Opt-in strict mode (added after team consensus)
  
quality_gates:
  max_new_critical: 0        # Hard limit (default)
  max_new_high: 3            # Soft limit (warn beyond 3)
  max_complexity_increase: 20  # Percent increase threshold
```

**Avoid Workflow-Level Overrides**: Do not tighten gates via command-line flags in workflow YAML. Configuration belongs in version-controlled `.odavl/gates.yml` where teams can review, discuss, and adjust via PR process.

**Team Consensus Required**: Changing failure policy from "Critical only" to "Critical + High" affects all contributors. Require team discussion, vote, and 2-week trial period before permanent adoption.

### Where Overrides Belong (Config, Not YAML Hacks)

**Correct: Configuration Files**:
```yaml
# .odavl/overrides.yml (version-controlled)
overrides:
  - gate: max_function_complexity
    files:
      - src/legacy/payment-processor.ts
    reason: "Legacy module under active refactoring (JIRA-1234)"
    expires: "2026-02-01"
    owner: "@platform-team"
```

**Incorrect: Workflow Inline Comments**:
```yaml
# ❌ FORBIDDEN
- name: Run Analysis
  run: |
    # Temporarily disable complexity checks for hotfix
    odavl insight analyze --disable-detector complexity
```

**Why Configuration Is Correct**:
- Version-controlled: Overrides reviewed in PR process
- Auditable: Clear history of who added override and why
- Temporal: Expiry dates force periodic re-evaluation
- Visible: All team members see overrides in repository

**Why Workflow Hacks Are Forbidden**:
- Hidden: Inline comments in workflow YAML are not discoverable
- Unmaintained: No expiry mechanism—overrides accumulate indefinitely
- Unaudited: No clear ownership or justification
- Fragile: Workflow changes can accidentally remove or modify overrides

---

## Using insight-ci.config.json

### Overview

Workflows respect `insight-ci.config.json` if present in repository root. If absent, built-in defaults apply (fail only on Critical, delta-first analysis).

### Configuration File

Create `insight-ci.config.json` for explicit CI behavior control:

```json
{
  "version": "1",
  "modes": {
    "pr": {
      "enabled": true,
      "failOn": {
        "critical": true,
        "high": false,
        "medium": false,
        "low": false
      },
      "allowOverrides": true
    },
    "main": {
      "enabled": true,
      "blockOnQuality": false
    },
    "nightly": {
      "enabled": false,
      "trackTrends": true
    }
  },
  "severityPolicy": {
    "critical": { "description": "Security vulnerabilities, secrets, circular deps" },
    "high": { "description": "Code quality issues that degrade maintainability" },
    "medium": { "description": "Minor code smells" },
    "low": { "description": "Informational findings" }
  },
  "antiPatterns": {
    "failOnLegacy": false,
    "failOnMediumOrLow": false,
    "autoUploadWithoutConsent": false
  }
}
```

See: `docs/ci/CI_CONFIG_REFERENCE.md` for complete schema documentation.

### Pre-Flight Validation

Add config validation step to workflows:

```yaml
- name: Verify CI Config
  run: npx @odavl-studio/cli insight ci verify
  if: hashFiles('insight-ci.config.json') != ''
```

**Purpose**: Catch schema violations before running analysis. Only runs if config file exists.

### Environment Diagnosis

Optional debugging step for troubleshooting:

```yaml
- name: Diagnose CI Environment
  if: failure()
  run: npx @odavl-studio/cli insight ci doctor
```

**Purpose**: Display detected CI mode, active fail-on rules, and config consistency. Runs only on workflow failure.

### No Breaking Changes

Workflows without `insight-ci.config.json` continue to function with built-in defaults. No migration required.

---

## Quick Start Guide

### Minimum Viable Integration

**1. Add Insight CLI to Dependencies**:
```json
// package.json
{
  "devDependencies": {
    "@odavl-studio/cli": "^1.2.0"
  }
}
```

**2. Copy Reference Workflow** (`.github/workflows/insight.yml`):
```yaml
name: ODAVL Insight
on:
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - run: npm install
      - run: npx odavl insight analyze --fail-on-critical --delta-mode --baseline-ref origin/main
```

**3. Commit and Push**: Workflow activates on next PR.

**4. Observe and Tune**: Monitor false positive rate for 1-2 weeks, adjust detector thresholds in `.odavl/config.json` if needed.

### Gradual Adoption Path

**Week 1-2**: Run analysis in **observability mode** (no failures, comment-only reporting). Team reviews findings, adjusts thresholds.

**Week 3-4**: Enable **Critical-only blocking**. PR checks fail on hardcoded secrets, security vulnerabilities, critical architectural issues.

**Month 2**: Evaluate **High severity blocking** (optional). Requires team consensus and demonstrated low false positive rate.

**Month 3+**: Integrate with cloud dashboard (optional). Enable trend tracking, scheduled analysis, historical reporting.

---

## Troubleshooting

### Common Issues

**Issue**: "Baseline fetch failed—cannot access origin/main"

**Cause**: Shallow checkout (fetch-depth: 1) does not include target branch history.

**Fix**: Use full checkout:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

---

**Issue**: "Analysis timeout after 5 minutes"

**Cause**: Large repository (>500K LOC) or slow CI runner.

**Fix**: Increase timeout in configuration:
```yaml
# .odavl/config.json
{
  "execution": {
    "timeout_minutes": 10
  }
}
```

---

**Issue**: "SARIF upload failed—missing permissions"

**Cause**: `github.token` lacks `security-events: write` permission.

**Fix**: Add permissions to workflow:
```yaml
jobs:
  analyze:
    permissions:
      contents: read
      security-events: write
```

---

**Issue**: "Delta analysis shows 0 issues, but PR has problems"

**Cause**: Baseline is stale or mismatched (analyzing wrong target branch).

**Fix**: Verify baseline reference:
```yaml
run: odavl insight analyze --delta-mode --baseline-ref origin/${{ github.base_ref }}
```

---

## Reference Workflows

See companion workflow files in this directory:

- **`insight-pr.yml`**: Pull request analysis with delta-based failure
- **`insight-main.yml`**: Main branch baseline generation
- **`insight-nightly.yml`**: Scheduled trend analysis

Each workflow is fully commented and ready for copy-paste integration.

---

## Related Documentation

- [CI_PHILOSOPHY.md](../CI_PHILOSOPHY.md) – CI integration principles and contracts
- [ODAVL_INSIGHT_OVERVIEW.md](../../product/ODAVL_INSIGHT_OVERVIEW.md) – Product overview
- [SECURITY_AND_PRIVACY.md](../../product/SECURITY_AND_PRIVACY.md) – Privacy architecture
- [FIRST_RUN_EXPERIENCE.md](../../product/FIRST_RUN_EXPERIENCE.md) – Developer onboarding

**Support**:
- **GitHub Actions Questions**: ci@odavl.studio
- **Configuration Help**: support@odavl.studio
- **Bug Reports**: GitHub Issues
