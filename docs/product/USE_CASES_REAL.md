# ODAVL Insight: Real-World Use Cases

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Document Type**: Operational Narratives (Not Marketing Case Studies)

---

## Solo Developer (Local-Only User)

### Project Size

Individual developer maintaining 2-3 active projects: one personal web application (15K lines TypeScript/React), one open-source Python library (8K lines), one experimental Rust CLI tool (3K lines). Total codebase under review: ~26K lines across three languages.

### Why They Use Insight

**Weekly Code Audits**: Runs `odavl insight analyze` every Friday before pushing to GitHub. Takes 45-90 seconds total. Catches hardcoded secrets before they reach public repositories, identifies circular dependencies blocking tree-shaking, and spots complexity hotspots in actively developed modules.

**Pre-Pull Request Validation**: Before opening PRs to upstream open-source projects, runs Insight locally to ensure contributions meet quality standards. Prevents embarrassing "your PR introduces a memory leak" comments from maintainers.

**Learning Tool**: Uses complexity and architecture detectors to understand patterns in mature codebases. "Why is this file flagged as complex?" leads to discovering better design patterns.

### What They Ignore

**Medium and Low Severity Issues**: Focuses on Critical and High severity findings only. Medium issues (code smells, minor performance suggestions) are acknowledged but rarely acted upon unless actively refactoring that module.

**Experimental Detectors**: Python type checking detector is experimental and produces false positives on dynamic typing patterns. Disabled via `.odavl/config.json` after first run.

**Stylistic Suggestions**: Insight flags inconsistent naming conventions, but developer has established preferences that conflict with detector heuristics. Uses `.odavl/ignore` to suppress specific warnings.

### When FREE Is Enough

This developer never upgrades to PRO because:

- **Project Count**: Three active projects fit within FREE tier's 3-project limit
- **Analysis Frequency**: Weekly analysis (4-5 runs/month) stays well below 10 uploads/month quota
- **Local-Only Workflow**: No team collaboration, no dashboard requirements, CLI output is sufficient
- **Cloud Sync Not Needed**: Historical trends tracked via Git commit messages ("Reduced complexity score from 18 to 12")

### When They Stop Using Insight (Important!)

**After 6-12 Months**: Developer's active project count drops to one mature application with infrequent changes. Insight analysis becomes redundant—codebase is stable, patterns are established, new issues are rare.

**Workflow Consolidation**: Migrates to ESLint + custom rules that cover 70% of Insight's findings with tighter editor integration. Insight remains installed but unused for 3+ months.

**Tool Fatigue**: Running multiple analysis tools (Insight, ESLint, TypeScript, pytest, cargo clippy) creates maintenance burden. Consolidates to language-native tooling (tsc, eslint, mypy) that cover "good enough" use cases.

**Reactivation Trigger**: Starts new project in unfamiliar language (Kotlin/Swift). Reinstalls Insight for language-specific detectors unavailable in generic linters.

---

## Small Team (3–7 Developers)

### How Insight Fits Into Reviews

**Pre-Commit Hook** (via Husky): Runs `odavl insight analyze --changed-files --fail-on-critical` on staged files. Takes 5-15 seconds. Blocks commits with Critical severity issues (hardcoded secrets, security vulnerabilities). High/Medium issues generate warnings but do not block.

**Pull Request Checks** (GitHub Actions): Full workspace analysis runs on PR open and every push to PR branch. Results posted as PR comment with issue summary and link to SARIF output. Does NOT block merges—used for visibility, not enforcement.

**Weekly Team Review** (30 minutes): Team lead exports `.odavl/analysis-results.json`, opens in spreadsheet, filters by "introduced last 7 days." Team discusses 3-5 highest-impact issues. Assigns owners for next sprint if issues are worth addressing.

### How Noise Is Handled

**Baseline Suppression**: After first team-wide run, export all existing issues to `.odavl/baseline.json`. Subsequent runs show only *new* issues introduced since baseline. Reduces noise by 80-90% in established codebases.

**Severity Calibration**: Adjust detector thresholds in `.odavl/config.json` to match team standards. Example: Increase cyclomatic complexity threshold from 10 to 15 for legacy modules under active refactoring.

**Selective Detector Enablement**: Disable noisy detectors (experimental Python type checker) and enable high-signal detectors (security, circular dependencies, unused code). Configuration reviewed quarterly.

### Why Not Every Finding Is Acted On

**Technical Debt Triage**: Team identifies 47 Medium-severity complexity issues in first run. Only 5 are in "hot path" code (executed frequently, changed often). Remaining 42 are acknowledged but not prioritized—stable code with acceptable complexity.

**False Positives**: Performance detector flags "synchronous file read in hot loop" in configuration loading code that executes once at startup. Team adds `// odavl-ignore-next-line` comment with justification. False positive rate: ~5-10% of flagged issues.

**Resource Constraints**: Team prioritizes feature delivery over technical debt reduction. Insight findings inform future refactoring plans but do not drive immediate action unless issues are Critical.

### When PRO Makes Sense

**After 6 Months**: Team grows to 7 developers across 8 active microservices. Project count exceeds FREE tier's 3-project limit. Weekly PR analysis exhausts 10 uploads/month quota by week 3.

**Decision Trigger**: Product manager asks "Show me code quality trends for Q3" for board presentation. Team lead realizes historical data retention (10 GB on PRO) enables quarter-over-quarter reporting.

**Upgrade Path**: Subscribes to PRO tier (€49/month). All 8 microservices sync to cloud dashboard. Weekly analysis cadence fits within 100 uploads/month quota. No workflow changes required—just increased quotas.

**Alternative**: Team debates between PRO subscription and using local JSON output with custom scripts. Chooses PRO because dashboard visualization saves 2-3 hours/month of manual reporting.

---

## Growing Company (15–50 Developers)

### CI/CD Integration Model

**GitHub Actions Workflow** (`.github/workflows/insight.yml`):

```yaml
- name: ODAVL Insight Analysis
  run: |
    pnpm install -g @odavl-studio/cli
    odavl insight analyze --format sarif --output insight-results.sarif
    odavl insight upload --project ${{ github.repository }}
```

Runs on every PR to `main`, `develop`, and release branches. Does NOT run on every commit to feature branches (too noisy, quota exhaustion). Results uploaded to cloud dashboard for historical tracking.

**Quality Gates**: Merge is blocked if Critical issues are introduced. High-severity issues trigger Slack notification to PR author but do not block. Medium/Low issues are informational only.

**Analysis Time Budget**: Insight analysis adds 60-120 seconds to CI pipeline (parallel with test suite). Team accepts this overhead because failures are caught pre-merge, reducing production incidents.

### Cloud Upload Decision

**Privacy Review** (2 weeks): Security team reviews SECURITY_AND_PRIVACY.md documentation. Key concerns:
- What data leaves developer machines?
- Where are cloud servers located?
- How is data encrypted?
- Can we export/delete data?

**Pilot Program**: 3 projects (non-customer-facing internal tools) upload to cloud for 30 days. Security team audits network traffic, inspects uploaded JSON, validates sanitization (no absolute paths, no source code, no secrets).

**Approval with Constraints**:
- Approved for internal projects and open-source repositories
- Prohibited for customer-facing services handling PII until TEAM tier with audit logging
- Requires quarterly review of uploaded data via export API

### Security & Privacy Review

**Data Sanitization Validation**: Security engineer examines uploaded JSON. Confirms:
- File paths are relative (`src/auth/login.ts`, not `/Users/dev/company-app/src/auth/login.ts`)
- No source code snippets (only issue metadata: type, severity, line numbers)
- No developer names, commit messages, or Git metadata
- No environment variables or secrets

**Compliance Alignment**: Data handling aligns with GDPR requirements (EU datacenters, 30-day deletion guarantee, data export API). No blockers for EU deployment.

**Remaining Concerns**: Audit logs not available on PRO tier—cannot track "who uploaded analysis for project X on date Y." This limitation is acceptable for internal tools but blocks customer-facing service deployment.

### How Insight Avoids Becoming Another Dashboard

**Dashboard Access Frequency**: Team lead checks dashboard 2-3 times per month (quarterly reviews, board presentations). Developers never access dashboard directly—they consume results via GitHub PR comments and Slack notifications.

**Integration Over Portal**: Team prefers Insight integration with existing tools (GitHub, Slack, Jira) over standalone portal. Dashboard exists for historical reporting, not daily workflows.

**Actionability Focus**: Insight findings must be actionable within current sprint. Issues that require multi-month refactoring are acknowledged but not tracked in dashboard—they move to Jira epic for long-term planning.

**Alert Fatigue Prevention**: Slack notifications configured to trigger only on Critical issues or when issue count increases >20% week-over-week. No daily digests, no "you have 5 new issues" noise.

---

## Enterprise Security / Platform Team

### Why Insight Is Evaluated

**Compliance Mandate**: Organization must demonstrate continuous code quality monitoring for SOC 2 Type II certification. Auditors require evidence of automated security scanning, technical debt tracking, and remediation timelines.

**Existing Tool Gaps**: Current tooling (SonarQube, Checkmarx) covers security but lacks architectural analysis (circular dependencies, complexity trends). Insight fills gap for deterministic, reproducible analysis across 200+ repositories.

**Developer Adoption Challenge**: Platform team needs tool that developers will actually use. Previous mandated tools (heavyweight IDE plugins, intrusive pre-commit hooks) were disabled or circumvented. Insight's local-first model reduces friction.

### What Data Is Allowed to Leave the Environment

**Initial Constraint**: No code analysis results may leave corporate network. Regulations prohibit cloud upload even if data is sanitized. This eliminates PRO and TEAM tiers immediately.

**Evaluation Criteria**:
- Can Insight run fully air-gapped (no internet access)?
- Can results be stored in on-premise database?
- Can analysis be reproduced exactly for audit purposes?
- Can corporate security team audit source code of analysis engine?

**Air-Gap Validation**: Platform team runs Insight on isolated network segment with no internet access. Confirms:
- CLI operates normally without network
- VS Code extension functions without authentication
- Analysis results written to local `.odavl/` directory
- No warnings, errors, or degraded functionality

### Audit, Determinism, Reproducibility

**Deterministic Analysis Requirement**: Auditors require proof that analysis on commit `abc123` produces identical results if re-run 6 months later. Variable analysis results (ML-based, non-deterministic) are unacceptable for compliance.

**Reproducibility Test**: Platform team runs Insight v1.2.3 on commit `abc123` (December 2025), stores results. Runs identical analysis in June 2026 (same Insight version, same commit). Diff output: zero differences. Requirement satisfied.

**Audit Trail**: Platform team requires proof of "who ran analysis X on date Y with which configuration." Insight's `.odavl/audit-log.json` (ENTERPRISE tier) captures:
- Timestamp (ISO 8601)
- User ID (from corporate SSO)
- Detector versions
- Configuration hash (SHA-256)
- Analysis result hash (SHA-256)

### When Self-Hosted or ENTERPRISE Tier Is Required

**Decision Point**: Air-gapped deployment + audit logging + custom detectors exceed TEAM tier capabilities. Platform team contacts sales@odavl.studio for ENTERPRISE discussion.

**Requirements**:
- Self-hosted analysis engine (on-premise Kubernetes deployment)
- Integration with corporate SSO (Okta SAML)
- Custom detectors for proprietary framework patterns
- 7-year audit log retention
- SLA: 99.5% uptime, 4-hour critical incident response

**Pricing**: Custom quote (€5,000/month for 50 developers, 200 repositories, on-premise deployment, 3-year contract).

**Deployment**: Platform team deploys Insight on internal Kubernetes cluster, configures PostgreSQL for results storage, integrates with GitLab CI. Developers use CLI and VS Code extension connecting to internal API (no cloud dependency).

---

## When ODAVL Insight Is NOT the Right Tool

### Explicit Non-Fit Cases

**1. Real-Time Collaboration / Pair Programming**

Insight is designed for asynchronous, periodic analysis—not real-time collaborative editing. Tools like VS Code Live Share or JetBrains Code With Me provide instant feedback during pair programming. Insight's 30-90 second analysis cycle is too slow for sub-second feedback loops.

**Non-Fit Signal**: Team says "we need to see code quality issues as we type, with <1 second latency." Insight's architecture (full workspace scan, detector orchestration) cannot meet this requirement.

**Alternative**: Language-specific LSP servers (typescript-language-server, rust-analyzer, pylance) provide sub-second diagnostics for syntax and type errors.

---

**2. Dynamic Language Runtime Analysis**

Insight performs static analysis only—parsing source code without executing it. Dynamic languages with heavy runtime metaprogramming (Ruby's `method_missing`, Python's `__getattr__`, JavaScript's Proxy) are not fully analyzable statically.

**Non-Fit Signal**: Team relies on Ruby on Rails with extensive metaprogramming. Insight's Ruby detector finds basic issues but misses dynamically defined routes, methods, and validations. Confidence in results drops below 60%.

**Alternative**: Runtime analysis tools (RuboCop with execution tracing, Python coverage.py with branch analysis) capture dynamic behavior.

---

**3. Compliance-Specific Code Patterns**

Organizations in heavily regulated industries (healthcare HIPAA, finance PCI-DSS, defense ITAR) require industry-specific code validators. Insight's security detector finds generic vulnerabilities (SQL injection, XSS) but does not validate HIPAA-specific PHI handling or PCI-DSS encryption requirements.

**Non-Fit Signal**: Compliance officer asks "Does Insight validate PCI-DSS 4.0 Requirement 3.5.1 (encryption key rotation)?" Insight does not include compliance-specific rulesets.

**Alternative**: Specialized compliance tools (Veracode for HIPAA, Fortify for PCI-DSS) or ENTERPRISE tier with custom detectors.

---

**4. Legacy Codebases with High Noise**

Insight works best on codebases with <50% technical debt. Legacy systems (20+ years old, millions of lines) generate thousands of issues with low signal-to-noise ratio. Team cannot distinguish critical issues from acceptable legacy patterns.

**Non-Fit Signal**: First run finds 3,400 issues. Team cannot prioritize—everything is flagged. Insight becomes ignored background noise.

**Alternative**: Incremental adoption strategies (analyze only new code, create strict baseline, suppress legacy issues) or defer Insight until after major refactoring milestone.

---

**5. Teams Seeking "One-Click Fix-All"**

Insight detects problems and suggests fixes but does not apply automated refactoring at scale. Teams expecting "click button, entire codebase is fixed" will be disappointed.

**Non-Fit Signal**: Manager asks "Can Insight automatically refactor our 500K-line codebase to reduce complexity?" Insight cannot—automatic large-scale refactoring risks introducing bugs.

**Alternative**: Dedicated refactoring tools (IntelliJ IDEA's automated refactorings, Sourcegraph Batch Changes) or consultant-led refactoring engagements.

---

## Decision Triggers

### What Makes Users Upgrade

**FREE → PRO**:
- **Project Count Pressure**: Managing 5-7 projects, manually rotating which 3 sync to cloud becomes tedious
- **CI/CD Quota Exhaustion**: Daily PR analysis hits 10 uploads/month limit by week 2
- **Historical Data Request**: Manager asks for quarter-over-quarter quality trends—FREE tier's 1 GB stores only 6 months

**PRO → TEAM**:
- **Onboarding Friction**: Team grows to 10 developers, managing individual PRO subscriptions becomes administrative burden
- **Audit Requirement**: Security audit requires tracking "who uploaded analysis X" for compliance—PRO lacks audit logs
- **Shared Dashboard**: Multiple developers need simultaneous dashboard access without credential sharing

**TEAM → ENTERPRISE**:
- **Data Residency Mandate**: Regulatory requirement prohibits cloud storage—must deploy on-premise
- **Custom Detectors**: Organization-specific patterns (proprietary framework, internal security standards) require bespoke detection logic
- **SLA Enforcement**: Production deployment requires contractual uptime guarantee and dedicated support

### What Makes Them Churn

**Workflow Misalignment**: Developers prefer fast, language-native tooling (ESLint, mypy, clippy) over multi-language platform. Insight's 30-90 second analysis is "too slow" compared to <1 second linting.

**Integration Overhead**: Team lacks engineering time to integrate Insight into CI/CD, configure detectors, and tune noise levels. Tool sits unused after initial evaluation period.

**Dashboard Fatigue**: Company already uses SonarQube, Snyk, Dependabot, GitHub Advanced Security. Adding another dashboard with similar metrics feels redundant. Team cancels subscription after 3 months.

**Cost vs Value**: PRO tier (€49/month) is not justified for solo developer managing 4 projects with monthly analysis. Downgrades to FREE, accepts manual project rotation as acceptable trade-off.

**Tool Consolidation**: Company standardizes on single vendor for security scanning, compliance, and code quality (e.g., GitHub Advanced Security or Snyk). Insight is deprecated to reduce tool sprawl.

### What Makes Them Trust the Tool Long-Term

**Deterministic Results**: Running Insight on same commit produces identical output months later. No "AI magic" that changes recommendations unpredictably. Builds confidence for audit and compliance scenarios.

**Transparent Severity Scoring**: Clear explanation for why issue X is Critical vs Medium. Developers can reproduce severity calculation by reading documentation—no black-box scoring.

**Privacy Commitments Honored**: Data export API works as documented. Downgrading does not delete data. No surprise telemetry or tracking. Security team re-audits annually, finds no violations.

**Responsive False Positive Handling**: When detector produces false positives, team reports issue via GitHub. Fix appears in next release (2-4 weeks). Demonstrates maintainer responsiveness.

**No Feature Regression**: Features available in FREE tier remain free across versions. No "bait-and-switch" where formerly free features become paid. Builds trust that commitments are stable.

**Offline Functionality**: Insight works identically on laptops during flights, in secure facilities without internet, and in home offices with flaky WiFi. No degraded experience when disconnected.

---

## Summary

ODAVL Insight succeeds when:
- Users value deterministic, reproducible analysis over AI-powered "smart suggestions"
- Teams prefer local-first tools with optional cloud sync
- Privacy and security posture align with corporate policies
- Workflow integrates cleanly with existing CI/CD and code review processes

ODAVL Insight fails when:
- Real-time feedback (<1 second) is required
- Dynamic language runtime analysis is critical
- Compliance-specific validation (HIPAA, PCI-DSS) is mandatory
- Automated large-scale refactoring is expected
- Tool sprawl forces consolidation to single vendor

Honest evaluation of fit/non-fit scenarios prevents wasted evaluation time and ensures users adopt Insight where it provides genuine value.

---

## Next Steps

**Related Documentation**:
- [FIRST_RUN_EXPERIENCE.md](./FIRST_RUN_EXPERIENCE.md) – What happens in first 5 minutes
- [PRICING_AND_PLANS.md](./PRICING_AND_PLANS.md) – Transparent pricing philosophy
- [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) – Data handling details
- [ODAVL_INSIGHT_OVERVIEW.md](./ODAVL_INSIGHT_OVERVIEW.md) – Product definition

**Contact**:
- **Evaluation Support**: sales@odavl.studio
- **Technical Questions**: support@odavl.studio
- **ENTERPRISE Inquiries**: enterprise@odavl.studio
