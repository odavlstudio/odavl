# ODAVL Insight: CI Integration Philosophy

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Audience**: Platform Engineers, DevOps Teams, CI/CD Architects

---

## Purpose of CI Integration

### Why Insight Exists in CI

ODAVL Insight operates in continuous integration pipelines to provide automated, deterministic code quality feedback before changes merge to protected branches. The primary goals are:

**Early Detection**: Identify critical issues (hardcoded secrets, circular dependencies, security vulnerabilities) before code review begins. Reduces manual review burden and prevents obvious problems from reaching production.

**Consistency Enforcement**: Ensure all contributions meet minimum quality thresholds regardless of individual developer local tooling configuration. Centralized CI execution eliminates "works on my machine" quality gaps.

**Historical Baseline**: Establish objective, reproducible quality measurements at each commit. Enable trend analysis ("Is complexity increasing?") and regression detection ("This PR introduced 3 new Critical issues").

**Audit Trail**: Generate immutable records of code quality state at merge time. Compliance requirements (SOC 2, ISO 27001) often mandate evidence of quality controls in development workflows.

### What Insight Is Explicitly NOT Responsible For

**Security Scanning**: Insight detects hardcoded secrets and common vulnerability patterns but is not a dedicated security scanner. Use Snyk, Dependabot, or GitHub Advanced Security for comprehensive dependency vulnerability management and CVE tracking.

**Test Execution**: Insight analyzes code structure and patterns but does not execute tests or validate runtime behavior. Test suites (unit, integration, end-to-end) remain separate CI stages.

**Build Validation**: Insight confirms code compiles (TypeScript, Java) as part of analysis but does not replace build processes. Compilation failures are detected incidentally, not as primary function.

**Performance Benchmarking**: Insight identifies performance anti-patterns (synchronous I/O in loops, inefficient algorithms) but does not measure runtime performance. Use dedicated benchmarking tools for latency, throughput, and resource consumption validation.

**Code Formatting**: Insight flags complexity and architectural issues but does not enforce code style. Use Prettier, Black, or rustfmt for formatting consistency.

---

## Core Principles

### Determinism (Same Input = Same Result)

Running Insight on commit `abc123` with detector version `1.2.3` must produce identical results across all environments (local developer machine, CI runner, scheduled job). No machine learning, no heuristic drift, no environmental dependencies.

**Implementation**: Detectors use static analysis only. Results depend solely on code structure, not training data, API responses, or system state. Configuration is version-controlled in `.odavl/config.json` and `.odavl/gates.yml`.

**Validation**: CI logs include Insight version, detector versions, and configuration hash (SHA-256). Any result discrepancy between local and CI runs with identical inputs indicates a defect requiring immediate investigation.

### Delta-First Analysis (New Issues Only)

CI pipelines evaluate changes introduced by current PR or commit, not accumulated technical debt in base branch. Legacy issues are acknowledged but do not block new work unless explicitly configured.

**Implementation**: Insight compares current analysis against baseline (typically `main` branch HEAD). Only issues absent in baseline and present in current branch trigger CI actions. Baseline stored in `.odavl/baseline.json` or fetched from cloud dashboard.

**Rationale**: Blocking PRs with pre-existing issues creates false urgency ("Why am I responsible for fixing code I didn't touch?") and undermines developer trust. Delta-first analysis rewards incremental improvement without penalizing contributors for historical debt.

### Local Parity (CI Results Must Match Local Runs)

Developers running `odavl insight analyze` locally must see identical results to CI execution. No "CI-only" checks, no hidden configuration, no environment-specific behavior.

**Implementation**: CI uses same CLI commands developers run locally: `odavl insight analyze --format sarif --output results.sarif`. Configuration files (`.odavl/config.json`, `.odavl/gates.yml`) are version-controlled and identical across environments.

**Verification**: CI logs include full command invocation with arguments. Developers can reproduce CI failures by checking out the same commit and running the logged command verbatim.

### No Silent Uploads or Hidden Behavior

Cloud upload (if enabled) requires explicit authentication and opt-in configuration. CI pipelines do not perform hidden data transmission, background telemetry, or undocumented network requests.

**Implementation**: Cloud upload is separate CLI command (`odavl insight upload`) executed only when `ODAVL_API_TOKEN` environment variable is present. Analysis (`odavl insight analyze`) operates entirely locally without network access.

**Transparency**: CI logs show exact commands executed. Developers auditing CI configuration can verify no hidden upload steps exist. Privacy-conscious organizations can run Insight in network-isolated CI runners.

---

## CI Execution Modes

### Pull Request (PR) Mode

**Trigger**: Every push to PR branch after PR creation.

**Analysis Scope**: Analyze entire workspace (not just changed files). Compare results against baseline (target branch HEAD, typically `main`).

**Evaluation Focus**: Delta issues only—what new problems does this PR introduce?

**Reporting**:
- Post summary comment to PR with new Critical and High issues
- Upload SARIF to GitHub Code Scanning (if configured)
- Set commit status: `success`, `failure`, or `neutral`

**Failure Conditions**: PR CI fails if delta contains Critical issues (hardcoded secrets, security vulnerabilities, circular dependencies blocking builds). High severity issues generate warnings but do not block merge by default.

**Rationale**: PRs are pre-merge gates. Contributors must address Critical issues before approval. High issues are visible for review but do not hard-block workflow.

### Main / Protected Branch Mode

**Trigger**: Every push to `main`, `develop`, or configured protected branches.

**Analysis Scope**: Full workspace analysis with no delta filtering—report all issues regardless of historical presence.

**Evaluation Focus**: Current quality state of protected branch. Establishes new baseline for future PR comparisons.

**Reporting**:
- Upload results to cloud dashboard (if authenticated)
- Store baseline snapshot in `.odavl/baseline.json` or equivalent
- No PR comments (not applicable)

**Failure Conditions**: Protected branch CI fails only if analysis itself fails (detector crash, configuration error, resource exhaustion). Quality issues do not fail protected branch CI—they inform quality dashboards.

**Rationale**: Protected branches should reflect merged work. Failing main branch CI due to quality issues creates ambiguity ("Is the branch broken or just low quality?"). Quality metrics are informational, not blocking.

### Scheduled / Nightly Mode

**Trigger**: Cron schedule (typically daily at 2 AM UTC).

**Analysis Scope**: Full workspace analysis across all configured projects. Compare against previous scheduled run to identify trends.

**Evaluation Focus**: Long-term quality trends, slow-accumulating technical debt, dependency freshness (if package detector enabled).

**Reporting**:
- Upload results to cloud dashboard with trend annotations
- Generate summary report emailed to team leads (optional)
- No commit status (no specific commit evaluated)

**Failure Conditions**: Scheduled jobs fail only on infrastructure issues (disk space, memory exhaustion, network timeout for cloud upload). Quality degradation does not fail scheduled jobs.

**Rationale**: Scheduled runs provide historical context and early warning for quality decay. Failure semantics differ from commit-triggered CI—operational success is goal, not quality threshold enforcement.

---

## Failure Policy (Critical Section)

### Decision Table

| Issue Severity | Delta (New Issue) | Legacy (Baseline) | PR CI Outcome | Main CI Outcome |
|---------------|-------------------|-------------------|---------------|-----------------|
| **Critical** | Yes | N/A | **FAIL** | PASS (report) |
| **Critical** | No | Yes | PASS | PASS (report) |
| **High** | Yes | N/A | **WARN** | PASS (report) |
| **High** | No | Yes | PASS | PASS (report) |
| **Medium** | Yes | N/A | PASS (report) | PASS (report) |
| **Medium** | No | Yes | PASS | PASS (report) |
| **Low** | Yes | N/A | PASS | PASS (report) |
| **Low** | No | Yes | PASS | PASS (report) |
| **Detector Error** | N/A | N/A | **FAIL** | **FAIL** |
| **Config Invalid** | N/A | N/A | **FAIL** | **FAIL** |

### Exact Rules for FAIL

**PR CI fails when**:
1. Delta contains 1+ Critical severity issues (new issues not present in baseline)
2. Detector execution fails (crash, timeout >5 minutes, resource exhaustion)
3. Configuration validation fails (`.odavl/gates.yml` invalid schema, contradictory rules)
4. Baseline comparison fails (cannot fetch baseline, network timeout, corrupted baseline file)

**Exit Code**: Non-zero exit from `odavl insight analyze --fail-on-critical --delta-mode`.

**User Experience**: PR status check shows red X. PR comment lists Critical issues with file paths, line numbers, descriptions, and suggested fixes. Merge button remains enabled (GitHub policy decision), but status check failure is visible to reviewers.

### Exact Rules for WARN

**PR CI warns when**:
1. Delta contains 1+ High severity issues
2. Quality gates show degradation (complexity increased >20% vs baseline)
3. Package detector finds 3+ new unused dependencies

**Exit Code**: Zero (successful execution). Warning state communicated via PR comment and neutral commit status.

**User Experience**: PR status check shows yellow warning icon or neutral status. PR comment includes "⚠️ Quality Concerns" section with High issues and gate violations. Merge button remains enabled without friction.

### Exact Rules for PASS Silently

**PR CI passes without comment when**:
1. Delta is empty (no new Critical, High, Medium, or Low issues)
2. Only Medium or Low severity issues in delta (below noise threshold)
3. Quality gates all pass (complexity stable, no new technical debt)

**Exit Code**: Zero.

**User Experience**: PR status check shows green checkmark. No PR comment posted (reduces noise). Developers can inspect detailed results via CI logs or SARIF upload to Code Scanning.

---

## Severity Mapping

### How Insight Severities Map to CI Outcomes

**Critical → FAIL (Blocking)**:
- Hardcoded secrets (API keys, passwords, tokens)
- Security vulnerabilities (SQL injection, XSS patterns)
- Circular dependencies blocking tree-shaking or module resolution
- Type errors preventing compilation (TypeScript, Java)

**Rationale**: Critical issues represent objective, immediate risks. Hardcoded secrets expose credentials. Security vulnerabilities create attack vectors. Circular dependencies cause bundler failures. These are not debatable quality opinions—they are defects requiring immediate fix.

**High → WARN (Non-Blocking)**:
- High complexity functions (cyclomatic >20, cognitive >30)
- Performance anti-patterns (synchronous I/O in loops)
- Architectural violations (import from forbidden paths)
- Unused exports in public APIs

**Rationale**: High issues indicate significant technical debt or performance risk but do not represent immediate breakage. Developers should address them, but blocking merges creates friction for subjective judgments ("Is complexity 22 truly unacceptable?").

**Medium → PASS (Informational)**:
- Code smells (long functions, deep nesting)
- Minor performance issues (inefficient algorithms on small datasets)
- Stylistic inconsistencies

**Rationale**: Medium issues are worth addressing during active development but do not justify blocking PRs. Developers see them in VS Code editor and can fix opportunistically.

**Low → PASS (Informational)**:
- Suggestions (potential future improvements)
- Stylistic preferences (naming conventions)

**Rationale**: Low issues are noise in CI context. Developers address them if convenient, ignore otherwise.

### Why "High ≠ Fail by Default"

High severity classification indicates significant concern but not objective defect. Consider high complexity function example:

- **Complexity 18** (just above threshold 15): Debatable whether refactoring justifies effort
- **Complexity 45** (extreme): Clearly requires refactoring

Both are "High" severity but have different urgency levels. Hard-blocking PRs on High issues forces premature optimization or threshold gaming ("I'll refactor after merge"). Warning state allows reviewer judgment.

Teams requiring strict quality enforcement can override defaults in `.odavl/gates.yml`:

```yaml
failure_policy:
  fail_on:
    - critical
    - high  # Opt-in strict mode
```

---

## Quality Gates

### Delta-Based Gates

**Definition**: Enforce constraints on changes introduced by current PR, not absolute codebase state.

**Example Rules**:
- "No new Critical issues" (default, always enforced)
- "No increase in total issue count by >10%" (opt-in)
- "No new High issues in changed files" (opt-in strict mode)
- "No new circular dependencies" (default for TypeScript/JavaScript projects)

**Configuration** (`.odavl/gates.yml`):
```yaml
delta_gates:
  max_new_critical: 0    # Hard limit
  max_new_high: 3        # Soft limit (warn only)
  max_issue_increase_pct: 10
  allow_new_cycles: false
```

**Evaluation**: Gates compare current analysis against baseline. Only delta metrics are evaluated, not absolute counts.

### Threshold-Based Gates

**Definition**: Enforce absolute limits on quality metrics regardless of historical state.

**Example Rules**:
- "No function with complexity >30"
- "No file larger than 500 lines"
- "No more than 5 unused dependencies"

**Configuration**:
```yaml
threshold_gates:
  max_function_complexity: 30
  max_file_lines: 500
  max_unused_dependencies: 5
```

**Evaluation**: Gates fail if any entity (function, file, package) exceeds threshold. Applies to entire workspace, not just changed files.

**Caution**: Threshold gates can block PRs for legacy issues unrelated to current changes. Use sparingly or combine with suppression mechanisms.

### Time-Based Gates (Technical Debt Tolerance)

**Definition**: Allow temporary quality degradation with mandatory remediation timeline.

**Example Rules**:
- "High complexity issues can be merged with 30-day fix deadline"
- "Unused dependencies tolerated for 7 days (cleanup sprints)"

**Configuration**:
```yaml
time_based_gates:
  high_complexity_grace_period_days: 30
  unused_dependency_grace_period_days: 7
```

**Enforcement**: Issues exceeding grace period escalate severity (High → Critical) in subsequent runs. Dashboard flags overdue technical debt.

**Use Case**: Enable pragmatic forward progress without accumulating unbounded debt. Teams commit to cleanup within sprint cycles.

### Override Mechanism with Required Justification

**Trigger**: Developer or reviewer invokes gate override for specific PR.

**Mechanism**: Add comment to PR: `/odavl override <gate_name> reason="<justification>"` or configure in `.odavl/overrides.yml`:

```yaml
overrides:
  - gate: max_function_complexity
    files:
      - src/legacy/payment-processor.ts
    reason: "Legacy code under active refactoring, tracked in JIRA-1234"
    expires: "2026-02-01"
    owner: "@engineering-lead"
```

**Required Metadata**:
- **Reason**: Human-readable justification (50-200 characters)
- **Expiry**: ISO 8601 date when override automatically expires
- **Owner**: GitHub username or team responsible for follow-up

**Audit**: Overrides logged to `.odavl/audit-log.json` with timestamp, PR number, and approver. Compliance teams can review override history.

**Why Overrides Are Auditable, Not Dangerous**: Overrides are not silent bypasses. They are visible, time-limited exceptions with assigned responsibility. Expired overrides re-trigger gate failures, forcing eventual resolution.

---

## Override & Exception Handling

### How Teams Can Override a Gate

**Method 1: Per-File Suppression** (`.odavl/ignore`):
```
# Suppress complexity warnings in legacy modules
src/legacy/**/*.ts:complexity

# Suppress circular dependency in known architecture
src/core/index.ts:circular-dependency
```

**Method 2: Configuration Override** (`.odavl/overrides.yml`):
```yaml
overrides:
  - gate: max_issue_increase_pct
    reason: "Onboarding new detectors, initial spike expected"
    expires: "2026-01-31"
    owner: "@platform-team"
```

**Method 3: PR Comment Directive**:
```
/odavl override max_new_high reason="Hotfix for production incident, refactoring tracked in JIRA-5678"
```

**Precedence**: PR comment > overrides.yml > .odavl/ignore > default gates.

### Required Metadata

**Reason (Mandatory)**:
- Minimum 50 characters, maximum 500 characters
- Must reference tracking ticket (JIRA, GitHub issue) for follow-up
- Generic reasons rejected ("because we need to merge", "doesn't matter")

**Expiry (Mandatory for Time-Limited Overrides)**:
- ISO 8601 date (YYYY-MM-DD)
- Maximum 90 days from override creation
- Extensions require re-approval from `owner`

**Owner (Mandatory)**:
- GitHub username (e.g., `@jane-doe`) or team (e.g., `@org/platform-team`)
- Receives notification when override expires
- Responsible for follow-up remediation or extension request

### Why Overrides Are Auditable, Not Dangerous

**Transparency**: All overrides visible in version control. Code reviewers see override metadata during PR review.

**Accountability**: Owner assignment creates responsibility. Expired overrides without follow-up indicate process breakdown, not silent accumulation.

**Temporal Bounds**: Expiry dates prevent perpetual exceptions. Teams must periodically justify continued override or fix underlying issue.

**Audit Trail**: `.odavl/audit-log.json` records override creation, expiry, extensions, and eventual resolution. Compliance teams audit exception patterns during certification reviews.

**Contrast with Suppression Comments**: Traditional lint suppressions (`// eslint-disable-next-line`) lack metadata, expiry, or accountability. Overrides are structured exceptions with governance.

---

## Anti-Patterns (Explicitly Forbidden)

### Failing Builds on Legacy Issues

**Anti-Pattern**: Configure CI to fail if total issue count exceeds threshold (e.g., "fail if >50 issues exist").

**Why Forbidden**: Blocks forward progress on legacy codebases. Contributors fixing unrelated bugs become responsible for historical technical debt. Discourages refactoring (adding detectors or lowering thresholds triggers cascading failures).

**Correct Approach**: Use delta-based gates. Fail only on new issues introduced by current PR. Legacy issues are tracked, reported, and addressed incrementally.

### Blocking PRs with Low/Medium Findings

**Anti-Pattern**: Configure CI to fail on Medium or Low severity issues.

**Why Forbidden**: Medium and Low classifications represent subjective code quality opinions, not objective defects. Blocking PRs for stylistic disagreements ("this function is slightly complex") erodes developer trust and creates gate-keeping friction.

**Correct Approach**: Surface Medium/Low issues in PR comments and VS Code editor. Allow developers to address opportunistically. Reserve failure state for Critical issues only.

### Treating Insight as a Security Scanner

**Anti-Pattern**: Rely solely on Insight for security vulnerability detection. Skip dedicated security tools (Snyk, Dependabot).

**Why Forbidden**: Insight detects common security patterns (hardcoded secrets, SQL injection templates) but lacks CVE database, dependency vulnerability tracking, and real-time threat intelligence. False confidence leads to security gaps.

**Correct Approach**: Use Insight for code-level security patterns. Complement with dedicated security tools for dependency management and vulnerability tracking. Treat security as defense-in-depth, not single-tool responsibility.

### Using Dashboards as Success Metrics

**Anti-Pattern**: Evaluate team performance by dashboard metrics ("Team A has 200 issues, Team B has 50, therefore Team B is better").

**Why Forbidden**: Issue counts lack context. Mature codebases accumulate legitimate complexity. New projects have fewer issues due to small size, not superior quality. Teams game metrics by disabling detectors or suppressing findings.

**Correct Approach**: Use dashboards for trend analysis ("Is quality improving over time?"), not absolute comparisons. Focus on delta metrics (issues introduced vs resolved) and remediation velocity.

---

## CI Contract Summary

### Guarantees from Insight

**Determinism**: Analyzing commit `X` with Insight version `Y` produces identical results across all environments, now and in future.

**Local Parity**: CI execution matches local developer runs exactly. No hidden configuration, no CI-specific behavior.

**Privacy Preservation**: Analysis runs entirely locally unless explicit cloud upload configured. No telemetry, no background data transmission.

**Graceful Degradation**: Network failures, cloud service outages, or configuration errors do not fail CI unless explicitly configured. Analysis continues with local-only operation.

**Performance Bounds**: Analysis completes within 5 minutes for projects <500K lines of code. Timeout-based failure prevents indefinite hangs.

**Exit Code Semantics**: Zero exit indicates successful analysis (quality issues may exist but are handled per configuration). Non-zero exit indicates operational failure (crash, timeout, invalid configuration).

### Non-Guarantees from Insight

**Security Completeness**: Insight is not comprehensive security scanner. Does not replace dedicated vulnerability management tools.

**Test Coverage**: Insight analyzes code structure, not test execution. Does not validate test suite quality or coverage thresholds.

**Runtime Behavior**: Insight performs static analysis only. Does not detect race conditions, memory leaks, or other runtime-only issues.

**Performance Validation**: Insight identifies performance anti-patterns but does not measure actual execution time or resource consumption.

**Build Success**: Insight confirms code compiles but does not replace build systems. Complex build failures (linker errors, resource bundling issues) are outside scope.

**Absolute Quality Scoring**: Insight provides raw metrics (complexity, issue counts) but does not abstract into single "quality score." Teams define quality thresholds per project context.

### Contract Between Insight and CI Pipeline

**Pipeline Responsibilities**:
- Provide stable execution environment (Node.js 18+, sufficient disk/memory)
- Configure authentication for cloud features (optional, `ODAVL_API_TOKEN`)
- Version-control Insight configuration (`.odavl/config.json`, `.odavl/gates.yml`)
- Handle Insight exit codes per organizational policy (fail build, post comment, continue)
- Archive SARIF output for historical reference or upload to code scanning

**Insight Responsibilities**:
- Execute deterministic analysis within performance bounds (5 minutes)
- Generate structured output (SARIF, JSON) for CI integration
- Respect configured failure policies (fail on Critical, warn on High, etc.)
- Log execution details for debugging (detector versions, configuration hash)
- Exit cleanly with appropriate status code (0=success, 1=failure, 2=invalid config)

**Shared Responsibilities**:
- Quality threshold definition (teams configure gates per project needs)
- Override governance (teams define approval process, expiry policies)
- Baseline management (teams decide baseline strategy: main branch, tagged release, time-based)
- Audit compliance (teams export logs, configure retention, satisfy regulatory requirements)

---

## Implementation Checklist

**For Platform Teams Implementing CI Integration**:

- [ ] Install Insight CLI in CI environment (`npm install -g @odavl-studio/cli`)
- [ ] Version-control configuration files (`.odavl/config.json`, `.odavl/gates.yml`)
- [ ] Configure delta-based analysis with baseline source (main branch, cloud dashboard)
- [ ] Set failure policy: fail on Critical, warn on High (default), or customize
- [ ] Generate SARIF output: `odavl insight analyze --format sarif --output results.sarif`
- [ ] Integrate with code scanning (GitHub, GitLab, Bitbucket)
- [ ] Configure PR comments for visibility (use CI platform's comment API)
- [ ] Document override process (how developers request exceptions)
- [ ] Set up audit log retention (store `.odavl/audit-log.json` in artifact repository)
- [ ] Test determinism: verify local run matches CI with identical inputs
- [ ] Validate offline operation: run CI without network access (no cloud upload)
- [ ] Define dashboard review cadence (weekly, monthly, quarterly)
- [ ] Train developers on interpreting Insight results and override process

**For Developers Using Insight in CI**:

- [ ] Run `odavl insight analyze` locally before pushing to PR
- [ ] Review CI failure reasons in PR comments (not just "build failed")
- [ ] Understand override process for legitimate exceptions
- [ ] Use `.odavl/ignore` for intentional suppressions (with comments explaining why)
- [ ] Validate fixes locally: ensure issue no longer appears before re-pushing
- [ ] Reference JIRA/GitHub issues in override reasons for traceability
- [ ] Respect expiry dates: follow up on overrides before deadline

---

## Appendix: Example CI Configurations

### GitHub Actions

```yaml
name: ODAVL Insight Analysis
on:
  pull_request:
    branches: [main, develop]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for baseline comparison
      
      - name: Install Insight CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Analysis
        id: insight
        run: |
          odavl insight analyze \
            --format sarif \
            --output insight-results.sarif \
            --fail-on-critical \
            --delta-mode \
            --baseline-ref origin/main
      
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: insight-results.sarif
      
      - name: Post PR Comment
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('insight-results.sarif'));
            // Parse and format comment (implementation omitted)
```

### GitLab CI

```yaml
insight-analysis:
  stage: quality
  image: node:18
  script:
    - npm install -g @odavl-studio/cli
    - |
      odavl insight analyze \
        --format sarif \
        --output insight-results.sarif \
        --fail-on-critical \
        --delta-mode \
        --baseline-ref origin/main
  artifacts:
    reports:
      sast: insight-results.sarif
    expire_in: 30 days
  only:
    - merge_requests
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any
  stages {
    stage('Insight Analysis') {
      steps {
        sh 'npm install -g @odavl-studio/cli'
        sh '''
          odavl insight analyze \
            --format sarif \
            --output insight-results.sarif \
            --fail-on-critical \
            --delta-mode \
            --baseline-ref origin/main
        '''
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'insight-results.sarif', fingerprint: true
    }
  }
}
```

---

## Related Documentation

- [ODAVL_INSIGHT_OVERVIEW.md](../product/ODAVL_INSIGHT_OVERVIEW.md) – Product definition and capabilities
- [SECURITY_AND_PRIVACY.md](../product/SECURITY_AND_PRIVACY.md) – Privacy architecture and data handling
- [FIRST_RUN_EXPERIENCE.md](../product/FIRST_RUN_EXPERIENCE.md) – Developer onboarding expectations
- [USE_CASES_REAL.md](../product/USE_CASES_REAL.md) – Realistic operational scenarios
- [WHY_INSIGHT_WINS.md](../product/WHY_INSIGHT_WINS.md) – Competitive positioning

**Support**:
- **CI Integration Questions**: support@odavl.studio
- **Configuration Guidance**: docs@odavl.studio
- **Bug Reports**: GitHub Issues
