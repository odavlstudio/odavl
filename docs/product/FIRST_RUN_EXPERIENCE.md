# ODAVL Insight: First Run Experience

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Audience**: Developers evaluating ODAVL Insight

---

## What "Success" Means in the First Run

Success in the first five minutes is not about finding hundreds of issues or generating impressive reports. Success means discovering at least one meaningful problem you did not know existed—and understanding why that problem matters.

ODAVL Insight is designed to surface signal, not noise. On a typical project, the first run finds 5-15 actionable issues across security, performance, complexity, and architectural patterns. These are not trivial lint warnings. They are problems with real impact: hardcoded credentials, circular dependencies blocking refactoring, performance bottlenecks in critical paths, or unused code accumulating technical debt.

The signal that Insight is working correctly is specificity. Instead of "this file is complex," you see "method `processPayment()` has cyclomatic complexity 18 (threshold: 10) with 7 nested conditionals." Instead of "potential security issue," you see "hardcoded API key detected on line 47 in `config.ts` with high confidence."

If the first run finds zero issues on a real-world project, that is unusual and worth investigating. Either your codebase is exceptionally clean, or Insight's configuration needs adjustment for your language ecosystem.

---

## First Run – CLI Path

### Exact Mental Model

**What Users Expect**: Running a command-line tool that scans code and prints results to the terminal.

**What Actually Happens**: ODAVL Insight analyzes your project locally, generates structured findings, writes results to `.odavl/analysis-results.json`, and prints a human-readable summary to stdout. No network requests occur. No authentication is required. Nothing leaves your machine.

### Installation and First Command

```bash
# Install globally (or use npx for one-off runs)
npm install -g @odavl-studio/cli

# Navigate to project directory
cd ~/projects/my-app

# Run first analysis
odavl insight analyze
```

**What Happens Next** (30-90 seconds depending on project size):

1. **Language Detection**: Insight identifies TypeScript/JavaScript, Python, Java, Go, Rust, Kotlin, Swift, Ruby, or PHP based on file extensions and configuration files (package.json, requirements.txt, pom.xml, go.mod, etc.).

2. **Detector Selection**: Automatically enables relevant detectors for detected languages. A TypeScript project gets TypeScript, security, performance, complexity, circular dependency, import validation, package analysis, and infrastructure detectors. A Python project gets Python type checking, security, complexity, and general detectors.

3. **Parallel Analysis**: Detectors run concurrently on available CPU cores. Progress indicators show which detectors are active and how many files have been processed.

4. **Result Aggregation**: Findings are deduplicated, sorted by severity (Critical → High → Medium → Low), and grouped by category (Security, Performance, Complexity, Architecture).

5. **Terminal Output**: Summary table shows detector name, issue count, and highest severity. Critical and High severity issues are listed with file path, line number, and description.

6. **File Output**: Complete results written to `.odavl/analysis-results.json` in structured format (SARIF-compatible). This file can be consumed by CI/CD pipelines or other tools.

### What It Does NOT Do

**No Automatic Fixes**: Insight never modifies your code during analysis. It detects problems, explains them, and suggests fixes—but applies nothing without explicit user action.

**No Cloud Upload**: Results stay local by default. The CLI does not prompt for authentication or upload credentials on first run. Cloud sync is opt-in and requires deliberate configuration (`odavl auth login`).

**No Hidden Background Processes**: Analysis completes, writes output, and exits. No daemons, no telemetry, no network connections. You can run Insight in air-gapped environments without warnings or degraded functionality.

**No Configuration Required**: Insight runs with sensible defaults out-of-the-box. You can customize detector settings later via `.odavl/config.json`, but the first run works immediately on most projects.

---

## First Run – VS Code Path

### How Feedback Appears

Installing the ODAVL Insight VS Code extension (`odavl-studio.insight-vscode`) adds real-time analysis to your editor. On first activation:

1. **Activation Trigger**: Extension loads when you open a supported file (`.ts`, `.js`, `.py`, `.java`, `.go`, etc.) in a workspace that Insight recognizes as a project (contains package.json, requirements.txt, or similar).

2. **Initial Scan**: Background analysis runs on workspace open (debounced 500ms to avoid startup lag). Progress notification appears in bottom-right corner: "ODAVL Insight: Analyzing workspace..."

3. **Problems Panel Integration**: Issues appear in VS Code's native Problems Panel alongside TypeScript and ESLint errors. Each issue shows:
   - **Severity Icon**: Red (error), yellow (warning), blue (info), gray (hint)
   - **Message**: Concise description ("Hardcoded API key detected")
   - **Source**: Detector name (`ODAVL/security`)
   - **File Path**: Clickable link to exact location
   - **Line/Column**: Precise position in file

4. **Inline Diagnostics**: Squiggly underlines appear in editor at issue locations. Hovering shows full explanation with code context and suggested fixes.

5. **Auto-Analysis on Save**: After initial scan, Insight re-analyzes changed files on save (Ctrl+S / Cmd+S). Debounced 500ms to prevent analysis storms during rapid edits.

### Why It's Not Noisy

ODAVL Insight applies severity filtering to reduce false positives:

- **Critical**: Confirmed security vulnerabilities, exposed secrets, critical performance regressions
- **High**: High-confidence bugs, architectural violations, significant technical debt
- **Medium**: Code smells, minor performance issues, complexity warnings
- **Low**: Stylistic suggestions, potential future issues

By default, the extension shows Critical and High severity issues prominently. Medium and Low issues appear in the Problems Panel but do not trigger intrusive notifications.

Detectors are tuned for precision, not recall. A hardcoded API key warning means Insight found a literal string matching API key patterns—not "this variable name sounds suspicious." Circular dependency errors mean actual import cycles blocking tree-shaking or causing runtime failures—not "these files reference each other."

### Why It Feels Safe

**No Surprise Uploads**: VS Code extension operates entirely locally. No authentication prompts, no cloud sync, no telemetry. The status bar shows "ODAVL Insight: Local Mode" to confirm offline operation.

**No Auto-Fixes**: Quick-fix suggestions appear in the lightbulb menu (Ctrl+. / Cmd+.), but you must explicitly select them. Insight never modifies code without user action.

**No Performance Impact**: Analysis runs in background worker threads. Editor responsiveness remains unaffected. If analysis takes longer than 10 seconds, it auto-cancels and retries incrementally.

---

## Typical "Aha" Moments

### Examples of Findings That Matter

**Hardcoded Secrets** (Security Detector):
```
File: src/config.ts, Line 23
Issue: Hardcoded API key detected in production configuration
Impact: Credentials exposed in version control, public GitHub repository
Fix: Move to environment variable (process.env.API_KEY)
```

This finding matters because developers often commit secrets accidentally during rapid development. Insight catches these before they reach production or public repositories.

**Circular Dependencies** (Import Detector):
```
Cycle: src/auth.ts → src/user.ts → src/auth.ts
Issue: Circular import prevents tree-shaking and causes bundler warnings
Impact: Increases bundle size by 37 KB, causes module initialization race conditions
Fix: Extract shared types to src/types.ts, break circular reference
```

Circular dependencies are invisible until they cause production failures or bundle size explosions. Insight maps the entire dependency graph and identifies cycles that violate module boundaries.

**Complexity Hotspots** (Complexity Detector):
```
Function: src/payment.ts:processPayment() (lines 145-312)
Complexity: Cyclomatic 23, Cognitive 41 (thresholds: 10/15)
Issue: 9 nested conditionals, 14 early returns, unmaintainable control flow
Impact: High bug risk, difficult to test, blocks team collaboration
Fix: Refactor into state machine or strategy pattern
```

High complexity functions hide bugs and slow development velocity. Insight quantifies complexity objectively and highlights refactoring candidates.

**Unused Dependencies** (Package Detector):
```
Package: lodash (4.17.21)
Status: Installed but never imported
Impact: 72 KB production bundle size, 14 dependency vulnerabilities
Fix: Remove from package.json (pnpm remove lodash)
```

Zombie dependencies accumulate over time as projects evolve. Insight cross-references package.json with actual imports to identify safe removals.

### Why These Are Hard to Catch Otherwise

**Manual Code Review**: Reviewers focus on logic correctness, not architectural patterns. Circular dependencies and complexity metrics require specialized tools.

**Standard Linters**: ESLint and Pylint catch syntax and style issues, not semantic problems like hardcoded secrets or import cycles.

**Runtime Testing**: These problems often pass tests but degrade production performance or security posture over time.

ODAVL Insight combines static analysis, dependency graph analysis, and security pattern matching to find problems that slip through traditional development workflows.

---

## What Does NOT Happen (By Design)

### No Uploads Without Consent

The CLI and VS Code extension operate in **local-only mode** by default. Analysis results never leave your machine unless you explicitly:

1. Run `odavl auth login` to authenticate
2. Run `odavl insight upload` to push results to cloud
3. Enable "Cloud Sync" in VS Code extension settings

Even after authentication, each upload requires deliberate action. There is no background sync, no automatic cloud push, no telemetry collection.

### No Fixes Applied Automatically

ODAVL Insight suggests fixes but never modifies code during analysis. Quick-fix actions in VS Code are gated behind user confirmation. CLI provides fix suggestions in output but requires separate commands to apply changes.

The philosophy is "detect and explain, never surprise." Automated fixes risk introducing bugs or breaking functionality. Insight provides context and suggestions, but developers make final decisions.

### No Data Leaving By Default

Analysis runs entirely on your machine using local tools (TypeScript compiler, Python AST parser, etc.). Results are written to `.odavl/analysis-results.json` in your project directory. No network requests occur unless you explicitly enable cloud features.

This design supports air-gapped environments, offline development, and privacy-sensitive workflows (defense contractors, financial institutions, healthcare).

---

## After the First Run

### What Users Usually Do Next

**Immediate Next Steps** (minutes after first run):

1. **Investigate Critical Issues**: Open files referenced in Critical/High severity findings, read explanations, assess impact.
2. **Apply Quick Fixes**: Use VS Code quick-fix actions or manual edits to resolve obvious issues (remove unused imports, fix hardcoded secrets).
3. **Run Second Analysis**: Re-run `odavl insight analyze` or save files in VS Code to verify fixes reduced issue count.

**Short-Term Actions** (hours to days):

1. **Configure Detectors**: Adjust thresholds in `.odavl/config.json` to tune noise levels (e.g., raise complexity threshold from 10 to 15 for specific files).
2. **Integrate with CI/CD**: Add `odavl insight analyze --fail-on-critical` to GitHub Actions, GitLab CI, or Jenkins pipelines to block merges with Critical issues.
3. **Explore Language-Specific Detectors**: Enable Python type checking, Java stream analysis, or Go concurrency detectors for polyglot projects.

### When They Consider Cloud Upload

Most users stay in local-only mode for days or weeks. Cloud sync becomes attractive when:

- **Team Collaboration**: Multiple developers need shared visibility into analysis trends ("Who introduced this complexity spike?").
- **Historical Tracking**: Tracking code quality improvements over time ("Did last quarter's refactoring reduce technical debt?").
- **Dashboard Reporting**: Executives or tech leads need aggregated metrics for reporting or OKRs.

Cloud upload is opt-in via `odavl auth login` followed by `odavl insight upload`. The FREE tier supports 3 projects and 10 uploads per month, which covers weekly analysis cadence for small teams.

### When FREE Is Enough vs Not

**FREE Tier Is Sufficient**:

- Individual developers working on 1-3 projects
- Weekly or monthly analysis cadence
- Local-only workflows without team collaboration
- CI/CD integration using local JSON/SARIF output

**Upgrade to PRO Becomes Relevant**:

- Managing 5-10 active projects
- Daily CI/CD analysis exhausting 10 uploads/month quota
- Need for 2-3 years of historical data retention
- Email support for technical issues or detector customization

**Upgrade to TEAM Makes Sense**:

- Team of 5+ developers sharing analysis results
- Compliance requirements for audit logs
- SSO integration for streamlined authentication
- Centralized dashboard for leadership reporting

The transition from FREE to paid tiers happens naturally when operational scale exceeds quotas, not when features become useful. Local analysis remains unlimited across all tiers.

---

## Key Takeaways

**First Five Minutes**: Run analysis, see structured findings, understand what problems exist and why they matter.

**No Surprises**: Nothing uploads, nothing modifies code, nothing requires authentication.

**Immediate Value**: Find 5-15 actionable issues (secrets, complexity, dependencies) that matter.

**Safe Exploration**: Local-only by default, opt-in cloud sync, no lock-in.

**Natural Progression**: Start local → explore findings → integrate CI/CD → consider cloud sync → upgrade when scale demands.

ODAVL Insight is designed for developers who value control, transparency, and gradual adoption over aggressive onboarding or feature paywalls.

---

## Next Steps

**Documentation**:
- [ODAVL_INSIGHT_OVERVIEW.md](./ODAVL_INSIGHT_OVERVIEW.md) – Product definition
- [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) – Security architecture
- [PRICING_AND_PLANS.md](./PRICING_AND_PLANS.md) – Tier comparison

**Getting Started**:
- [Installation Guide](../getting-started/INSTALLATION.md)
- [CLI Reference](../reference/CLI.md)
- [VS Code Extension Guide](../getting-started/VSCODE_EXTENSION.md)

**Support**:
- support@odavl.studio
- [Community Forum](https://community.odavl.studio)
- [GitHub Issues](https://github.com/odavlstudio/odavl/issues)
