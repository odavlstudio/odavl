# ODAVL Insight: VS Code Extension UX Contract

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Contract  
**Audience**: Staff engineers, platform teams, DevEx engineers

---

## 1. Purpose & Non-Goals

### What the VS Code Extension IS For

**Real-Time Quality Feedback**: Integrate ODAVL Insight's deterministic analysis engine into the IDE to surface Critical and High severity issues as developers write code. Issues appear in the Problems Panel with click-to-navigate precision, identical to TypeScript compiler errors and ESLint warnings.

**Local-First Development Experience**: Provide complete analysis functionality without network dependencies. Developers must be able to install the extension, open a workspace, and receive meaningful feedback within 90 seconds—with zero authentication, zero configuration, and zero cloud connectivity.

**Delta-First Problem Detection**: Highlight issues introduced by current changes, not accumulated technical debt. When a developer modifies a file, re-analysis focuses on that file only (500ms debounce). The Problems Panel should clearly distinguish new findings from pre-existing baseline issues.

**Privacy-Preserving Cloud Sync (Optional)**: Allow developers to optionally authenticate and upload sanitized analysis results (file paths, error counts, metrics) to the cloud dashboard for historical tracking. Cloud upload is always explicit, always opt-in, and never blocks local workflows.

### What the Extension Explicitly IS NOT

**Not an Auto-Fix Tool**: The extension never modifies code without explicit user action. No "fix all issues" commands, no aggressive quick fixes, no AI-generated rewrites. Insight detects problems and suggests fixes—implementation is the developer's responsibility.

**Not a Security Scanner Replacement**: The extension detects hardcoded secrets and basic vulnerability patterns but is not a comprehensive SAST tool. It does not scan dependencies for CVEs, does not integrate with vulnerability databases, and does not replace Snyk, Dependabot, or GitHub Advanced Security.

**Not an Always-On Background Worker**: Analysis runs on save (with debounce) or on explicit command invocation. The extension does not consume CPU cycles while the developer is typing, does not perform speculative analysis, and does not preload results in the background.

**Not a Noisy Linter**: The extension does not flag hundreds of low-value warnings. Default configuration shows Critical (secrets, vulnerabilities) and High (complexity hotspots, architectural issues) severity only. Medium and Low issues appear in secondary views, not the main Problems Panel.

**Not a Team Collaboration Platform**: The extension does not provide chat, code review, or team coordination features. Cloud dashboard integration is read-only from the IDE—developers view trends, but do not collaborate or comment on issues within VS Code.

---

## 2. Target Personas & Environments

### Solo Developer (Local-Only, Privacy-Conscious)

**Profile**: Independent developer, 1-3 personal projects, often offline (flights, cafes with unreliable WiFi), privacy-concerned (avoids tools that upload code).

**What Matters Most**:
- **Zero network requirement**: Analysis completes successfully even in airplane mode
- **No authentication friction**: Install extension, open project, get results—no sign-up, no login prompts
- **Minimal noise**: See 3-8 actionable issues, not 200 warnings
- **Fast iteration cycles**: Save file → see results in <2 seconds (cached analysis)

**Environment Characteristics**:
- Laptop (often battery-powered, performance-conscious)
- Single workspace at a time
- No CI/CD integration (manual Git workflow)
- Reluctant to share data externally

**UX Implications**:
- Default mode: Local-only (no cloud features visible until authentication)
- Status bar shows "Insight: 3 issues" (local analysis complete)
- No upsell prompts, no "Sign in to unlock features" messages
- Settings default to `autoAnalyzeOnSave: true`, `defaultAnalysisMode: "local"`

### Small Team Developer (GitHub/GitLab-Driven)

**Profile**: Team of 3-7 developers, GitHub Actions for CI, Slack for coordination, 1-2 hour code review cycles.

**What Matters Most**:
- **CI/local parity**: Issues shown in IDE match CI pipeline results exactly
- **Quick pre-commit validation**: Run analysis on changed files in <10 seconds
- **Context switching**: Jump from Slack message ("Check line 47 in config.ts") to exact issue in VS Code in one click
- **Delta visibility**: Understand which issues are new vs. pre-existing baseline

**Environment Characteristics**:
- Desktop or laptop (office + remote work)
- Multiple projects open simultaneously (microservices)
- GitHub Actions + VS Code + Chrome DevTools workflow
- Team uses cloud dashboard for weekly reviews

**UX Implications**:
- Command: "Analyze Changed Files" (Git working tree changes only)
- Status bar shows "Insight: 3 new, 12 total issues" (delta indicator)
- Cloud sync optional but encouraged (team dashboard visibility)
- Problems Panel filters: "Show New Issues Only" (default)

### Enterprise Developer (Regulated, VPN/Air-Gapped)

**Profile**: Developer at financial services firm, air-gapped development environment (no internet from workstations), strict data residency requirements, compliance audits quarterly.

**What Matters Most**:
- **Air-gap compatibility**: Extension functions without any network calls (including telemetry)
- **Audit trail**: Analysis results exportable as JSON/SARIF for compliance evidence
- **No telemetry leakage**: Zero network activity unless explicitly configured
- **Deterministic behavior**: Same code + same extension version = identical results every time

**Environment Characteristics**:
- Desktop (Windows 10/11, locked-down corporate image)
- Internal Git server (GitLab self-hosted)
- No external network access from development VMs
- Extension installed via offline VSIX file

**UX Implications**:
- Zero network activity unless cloud upload explicitly enabled via settings
- No OAuth redirect flows (breaks in air-gapped environments)
- Status bar: "Insight: Offline (3 issues)" (clear offline indicator)
- Export command: "Save Analysis as SARIF" (file path selector, no network)

---

## 3. Primary Workflows (Top 3 Only)

### Workflow 1: Real-Time Feedback During Active Development

**Trigger**: Developer saves file (Ctrl+S / Cmd+S) after making changes.

**Expected Timeline**: 
- 200-800ms: Analysis completes for single file
- 1-3 seconds: Analysis completes for 10-20 related files (if imports changed)
- 5-10 seconds: Full workspace re-analysis (if configuration changed)

**Surfaces Involved**:
1. **Status Bar** (right side): "$(flame) Insight: Analyzing..." → "$(flame) Insight: 3 issues" (click to filter Problems Panel)
2. **Problems Panel**: Issues appear/disappear with 500ms debounce (avoid flashing)
3. **Inline Diagnostics**: Squiggly underlines in editor at issue locations
4. **Hover Tooltips**: Show detector name, severity, description, suggested fix (if available)

**What We Show**:
- Critical issues: Red squiggles + error icon in Problems Panel
- High issues: Yellow squiggles + warning icon
- File-level grouping: Issues grouped by file, then by severity within file
- Line-precise location: Exact line/column, not whole-file warning

**What We NEVER Show**:
- Medium/Low issues in default Problems Panel view (require explicit filter toggle)
- Duplicate issues across files (deduplicate import-related errors)
- False positives with <60% confidence (security detector threshold)
- Legacy issues from baseline (unless "Show All Issues" filter enabled)

### Workflow 2: Pre-Commit Delta Analysis

**Trigger**: Developer invokes command "Insight: Analyze Changed Files" before `git add` / `git commit`.

**Expected Timeline**:
- 2-5 seconds: Analysis completes for files in Git working tree
- 10-15 seconds: Analysis completes if >20 changed files

**Surfaces Involved**:
1. **Command Palette**: `Ctrl+Shift+P` → "ODAVL Insight: Analyze Changed Files"
2. **Progress Notification**: Bottom-right toast: "Analyzing 7 changed files..."
3. **Problems Panel**: Shows ONLY issues in changed files (auto-filtered)
4. **Status Bar**: "$(git-commit) Insight: 2 new issues in 7 files"

**What We Show**:
- Delta indicator: "2 new issues" (not present in baseline)
- Changed file list: Expandable tree view showing which files have new issues
- Comparison summary: "Previous: 12 issues → Current: 14 issues (+2)"
- Actionable CTA: "Fix Critical issues before commit" (if any exist)

**What We NEVER Show**:
- Issues in unchanged files (irrelevant to current commit)
- Baseline issues (developer didn't introduce them)
- Git history or commit messages (privacy)
- Automatic staging or commit suggestions

### Workflow 3: Understanding Why CI Failed

**Trigger**: Developer receives notification "CI check failed: ODAVL Insight" from GitHub/GitLab, clicks through to VS Code.

**Expected Timeline**:
- 0-1 seconds: Open file at exact line from CI log link
- 3-5 seconds: Local analysis matches CI result (if extension version matches CI)

**Surfaces Involved**:
1. **Deep Link Handler**: `vscode://odavl.insight/open?file=src/config.ts&line=47&issue=hardcoded-api-key`
2. **Problems Panel**: Auto-filtered to show issue matching CI failure
3. **Hover Tooltip**: Displays full CI error context + suggested fix
4. **Output Channel**: Shows diff between local and CI analysis (if mismatch detected)

**What We Show**:
- Exact issue that failed CI: Highlighted in editor with red squiggle
- CI context: "This issue failed your PR check" banner in hover tooltip
- Local/CI version comparison: "Extension v1.0.0 | CI v1.0.0 ✓" (or ⚠️ if mismatch)
- Suggested action: "Fix this issue or add to `.odavl/ignore` if false positive"

**What We NEVER Show**:
- Full CI log dump (overwhelming, belongs in CI dashboard)
- Unrelated issues from same file (focus on CI failure root cause)
- "Upgrade to PRO to see full CI results" upsell (anti-pattern)

---

## 4. Signal-to-Noise Contract

### Grouping Strategy

**File-Level Grouping** (Default):
```
PROBLEMS (3)
└─ src/config.ts (2 issues)
   ├─ Line 47: Hardcoded API key detected (Critical)
   └─ Line 103: Function complexity: 18 (threshold: 10) (High)
└─ src/utils/auth.ts (1 issue)
   └─ Line 23: Circular dependency: config.ts → auth.ts → config.ts (Critical)
```

**Detector-Level Grouping** (Optional via filter):
```
PROBLEMS (3)
└─ ODAVL/security (2 issues)
   ├─ src/config.ts:47 - Hardcoded API key
   └─ src/api/client.ts:89 - SQL injection pattern
└─ ODAVL/complexity (1 issue)
   └─ src/config.ts:103 - High cyclomatic complexity
```

**Severity-Level Grouping** (Secondary view only):
```
Critical (2)
├─ Hardcoded API key (src/config.ts:47)
└─ Circular dependency (src/utils/auth.ts:23)

High (1)
└─ Function complexity (src/config.ts:103)
```

### Problems Panel Rules

**Allowed in Default View**:
- Critical severity: Always visible (red error icon)
- High severity: Visible (yellow warning icon)
- Maximum 50 issues total (pagination if exceeded)
- Issues from last 7 days of analysis (configurable)

**Forbidden in Default View**:
- Medium severity: Hidden unless "Show Medium" filter enabled
- Low severity: Hidden unless "Show All Levels" filter enabled
- Duplicate issues: If same issue appears in multiple files (import-related), show once with "Affects 3 files" indicator
- Repeated issues: If same line flagged by multiple detectors, merge into single diagnostic with combined explanation

### Noise Reduction Rules

**Maximum N Diagnostics Per File**: 10 diagnostics per file by default. If file has >10 issues, show top 10 by severity + confidence, then add summary: "+7 more issues (click to expand)".

**Duplicate Handling**: Security detector flags same hardcoded secret in 3 files (config.ts, config.test.ts, config.example.ts). Show as single diagnostic: "Hardcoded API key detected in 3 locations" with expandable list.

**Repeated Issue Suppression**: If complexity warning appears for same function in consecutive 5 analysis runs without code changes, auto-suppress with message: "Stable issue (not recently changed)".

**Low-Value Hint Filtering**: Detector flags "Variable name could be more descriptive" (Low severity, 45% confidence). Automatically filtered unless "Show All Issues" explicitly enabled.

### New vs Legacy Distinction

**Visual Indicators**:
- New issues: Standard severity icon (🔥 red, ⚠️ yellow)
- Legacy issues: Dimmed icon (50% opacity) + text prefix "[Baseline]"
- Status bar: "$(flame) 3 new, 12 total" (new count emphasized)

**Filter Toggle**:
- Default: Show new issues only
- Filter button: "Show Baseline Issues" (opt-in, not default)
- Keyboard shortcut: `Ctrl+Shift+I` toggles baseline visibility

### Change Tracking

**Between Analysis Runs**:
- Store previous analysis hash in workspace state
- On new analysis completion, diff against previous
- Highlight issues that disappeared: "5 issues resolved since last run" (notification)
- Highlight new issues: Yellow glow animation in Problems Panel (1-second fade)

---

## 5. Local vs Cloud Behavior

### What Runs 100% Locally

**Core Analysis Engine**:
- All 16 detectors (TypeScript, security, performance, complexity, circular, import, package, runtime, build, network, isolation, Python, Java, Next.js, database, infrastructure)
- File system scanning and parsing
- Diagnostics generation and deduplication
- Problems Panel integration
- Hover tooltip rendering
- Export to JSON/SARIF format

**Local-Only Guarantees**:
- No network requests during analysis (can be verified via network monitor)
- No authentication required to analyze workspace
- Works in airplane mode / air-gapped environments
- Zero latency overhead from cloud APIs

### What Requires Auth + Explicit Opt-In

**Cloud Upload** (POST `/api/cli/upload`):
- Requires: Valid JWT access token (OAuth 2.0 flow)
- Requires: User-initiated action: Command "Send to Cloud" or setting `defaultAnalysisMode: "cloud"`
- Uploads: Sanitized JSON (file paths, error counts, metrics) — never source code
- Fails gracefully: If network unavailable, analysis completes locally, upload queued for retry

**Historical Trends** (GET `/api/cli/projects/:id/history`):
- Requires: Authentication + project ID from cloud
- Displays: Line chart overlay in VS Code sidebar showing issue count over last 30 days
- Cached: 5-minute cache to avoid excessive API calls
- Fallback: If offline, shows "Historical data unavailable (offline)" instead of error

**Team Dashboard Links**:
- Requires: Authentication + TEAM tier plan
- Behavior: Status bar button "Open in Dashboard" opens browser to cloud dashboard filtered to current file
- Privacy: Only sends file path (relative, sanitized) + line number — no code content

### Privacy Contract in IDE

**Never Upload Without Explicit Consent**:
- First-time user: No cloud features visible until "Sign In" command invoked
- Status bar indicator: "(Local)" suffix when offline mode active
- Settings UI: "Cloud Upload: Disabled" with toggle button (off by default)
- Upload confirmation: First cloud upload shows modal: "Send sanitized analysis results to cloud? (No source code uploaded)"

**Always Show When Upload Happening**:
- Progress notification: "Uploading analysis to cloud..." with spinner
- Status bar: "$(cloud-upload) Uploading..." (replaces issue count during upload)
- Output channel log: "Uploaded 127 KB sanitized JSON to project 'my-app' (duration: 1.2s)"
- Network failure: "Upload failed: Network unreachable. Results saved locally." (retry button)

### Quota / Plan Limits in IDE

**What We MAY Show**:
- Status bar tooltip: "FREE plan: 3/10 uploads this month" (on hover)
- Command failure notification: "Upload failed: Monthly quota exceeded (10/10). Upgrade to PRO for 100 uploads/month."
- Sidebar indicator: Small icon showing plan tier (💎 for PRO, ⭐ for TEAM)

**What We MUST NOT Show**:
- Upsell modals blocking analysis workflows
- Nag screens on every file save
- Fake "upgrade required" errors when local analysis works fine
- Payment forms or pricing tables inside VS Code (link to website instead)

**Graceful Degradation**:
- If upload quota exceeded: Analysis completes locally, upload fails silently (with opt-in notification)
- If plan expired: Cloud features hidden, local analysis continues unaffected
- If authentication expires: Refresh token flow attempts silent renewal, falls back to local mode if refresh fails

---

## 6. Interaction & Feedback Design

### Status Bar

**What We Show**:
- Issue count with icon: `$(flame) Insight: 7 issues` (click to open Problems Panel filtered)
- Analysis state: `$(sync~spin) Analyzing...` (during active analysis)
- Plan indicator (if authenticated): `$(account) FREE` (hover for quota tooltip)
- Offline mode: `$(plug) Offline` (when network unavailable, even if authenticated)

**What We NEVER Show**:
- Animated ads or promotional banners
- Real-time CPU/memory usage (not relevant to code quality)
- Version update nag ("New version available")
- Time since last analysis (creates anxiety)

**Interaction**:
- Click: Opens Problems Panel filtered to ODAVL diagnostics
- Right-click: Context menu with "Analyze Workspace", "Clear Diagnostics", "Settings"
- Hover: Tooltip shows breakdown: "3 Critical, 4 High, 0 Medium, 0 Low"

### Notifications

**When to Use Info Popups**:
- First analysis complete: "ODAVL Insight found 7 issues. View in Problems Panel."
- Major improvement: "5 Critical issues resolved since last run!"
- Authentication success: "Signed in as user@example.com (FREE plan)"

**When to Use Warning Popups**:
- Upload quota exceeded: "Cloud upload failed: Monthly limit reached (10/10). Analysis saved locally."
- Configuration error: "Invalid .odavl/config.json syntax on line 23. Using defaults."
- Detector crash: "Security detector failed. Other detectors completed successfully."

**When to Use Error Popups**:
- CLI not found: "ODAVL Insight CLI not installed. Install via 'npm install -g @odavl-studio/cli'."
- Workspace not supported: "No supported files detected. ODAVL Insight requires TypeScript, Python, Java, or other supported languages."
- Fatal extension error: "Extension activation failed: [error details]. View logs for details."

**When NEVER to Popup**:
- Every file save (too noisy)
- Low/Medium severity issues found (use Problems Panel)
- Cloud sync success (use status bar indicator)
- Telemetry events (silent)

### Problems Panel

**Structure**:
```
PROBLEMS (7) — Showing: ODAVL Insight ▼
├─ src/config.ts (3 issues)
│  ├─ [47:15] Hardcoded API key detected (Critical) — ODAVL/security
│  ├─ [103:8] Function complexity: 18 (threshold: 10) (High) — ODAVL/complexity
│  └─ [127:22] Circular import: config.ts → auth.ts → config.ts (Critical) — ODAVL/circular
├─ src/utils/auth.ts (2 issues)
│  └─ [23:1] Circular dependency (see config.ts:127) (Critical) — ODAVL/circular
└─ tests/api.test.ts (2 issues)
   ├─ [89:18] SQL injection pattern (High) — ODAVL/security
   └─ [102:5] Unused import: 'crypto' (Low) — ODAVL/import
```

**Metadata per Diagnostic**:
- Source: "ODAVL/security" (detector name)
- Severity: Icon (🔥 red, ⚠️ yellow, ℹ️ blue, 💡 gray) + label
- Message: Concise (50-100 chars), actionable
- Code: Detector-specific rule ID (e.g., "ODAVL-SEC-001")
- Related Information: Link to docs (https://docs.odavl.studio/detectors/security#hardcoded-credentials)

### Custom Views (Sidebar)

**What Belongs in Sidebar**:
- Detector status list: Shows which detectors are enabled/disabled + last run time
- Issue statistics: Bar chart showing issue count by severity (last 7 days)
- Configuration preview: Current `.odavl/config.json` settings (read-only view)
- Quick actions: Buttons for "Analyze Workspace", "Clear Cache", "Export SARIF"

**What Belongs in Browser Dashboard**:
- Historical trends (30+ day charts)
- Cross-project comparisons
- Team collaboration features
- Detailed issue tracking with comments

**Sidebar Tree View Example**:
```
ODAVL INSIGHT
├─ 📊 Statistics
│  ├─ Total Issues: 7
│  ├─ Critical: 3
│  ├─ High: 4
│  └─ Trend: -2 since last week ↓
├─ 🔍 Detectors (11 enabled)
│  ├─ ✅ TypeScript (last run: 2m ago)
│  ├─ ✅ Security (last run: 2m ago)
│  ├─ ⚠️ Python (disabled - no Python files)
│  └─ 🔧 Configuration...
└─ ⚙️ Quick Actions
   ├─ ▶️ Analyze Workspace
   ├─ 🗑️ Clear Diagnostics
   └─ 📤 Export SARIF
```

### Keyboard Shortcuts

**Only Where Truly Adding Value**:
- `Ctrl+Shift+I` (Win/Linux) / `Cmd+Shift+I` (Mac): Toggle baseline issue visibility
- `Ctrl+Shift+A` (Win/Linux) / `Cmd+Shift+A` (Mac): Analyze workspace
- `F8` / `Shift+F8`: Navigate between ODAVL diagnostics (native VS Code behavior, no override)

**Explicitly Avoided**:
- Custom shortcuts for opening dashboard (use Command Palette)
- Shortcuts for individual detector toggles (use settings UI)
- Shortcuts for authentication (infrequent action)

---

## 7. Error UX & Failure Modes

### Analysis Engine Crashes

**Symptom**: Detector throws uncaught exception during analysis.

**UX Response**:
1. Other detectors continue execution (isolated failure)
2. Status bar: `$(warning) Insight: Partial results (1 detector failed)`
3. Notification: "Security detector crashed. View logs for details." (with "View Logs" button)
4. Output channel: Full stack trace + detector version + project characteristics
5. Problems Panel: Shows issues from successful detectors, omits failed detector results

**What MUST Still Work**:
- Problems Panel integration (remaining diagnostics displayed)
- File navigation (click on issues to open files)
- Export functionality (export partial results with warning metadata)

### CLI Not Installed / Misconfigured

**Symptom**: Extension cannot find `odavl` CLI in PATH.

**UX Response**:
1. First activation: "ODAVL Insight CLI not found. Install via 'npm install -g @odavl-studio/cli'?" (with "Install" and "Dismiss" buttons)
2. "Install" button: Opens integrated terminal and runs `npm install -g @odavl-studio/cli`
3. Post-install: "CLI installed successfully. Analyzing workspace..." (auto-triggers first analysis)
4. If installation fails: Link to manual installation docs (https://docs.odavl.studio/cli/installation)

**Alternative Path**:
- Settings: `odavl-insight.cliPath` allows custom path (for self-compiled CLI or non-standard installations)
- Validation: On setting change, extension verifies CLI is executable and correct version

### Missing / Invalid Config

**Symptom**: `.odavl/config.json` exists but has JSON syntax error.

**UX Response**:
1. Warning notification: "Invalid config.json syntax on line 23. Using default settings. Fix syntax?"
2. "Fix syntax" button: Opens config.json in editor with cursor at error line
3. Status bar: `$(warning) Config error` (hover shows details)
4. Analysis proceeds with defaults (does NOT block workflow)
5. Output channel: Logs full parse error for debugging

**Fallback Behavior**:
- Analysis uses DEFAULT_CI_CONFIG from `insight-ci-config` package
- User can fix config.json at any time, extension watches for changes (reloads automatically)

### Cloud Upload Failures

**Local Analysis Success, Upload Failed**:
1. Notification: "Analysis complete (7 issues). Cloud upload failed: Network unreachable." (dismissible)
2. Status bar: `$(cloud-x) Upload failed` (3-second display, then reverts to issue count)
3. Output channel: Logs upload error details (HTTP status, error message)
4. Retry mechanism: "Retry Upload" button in notification (manual trigger)
5. Queue for retry: If network comes back online, extension auto-retries failed uploads (max 3 attempts)

**What MUST Still Work Offline**:
- Local analysis completes successfully
- Problems Panel shows all issues
- Export to JSON/SARIF (local file system)
- Diagnostics remain visible until workspace closes

**Authentication Expired During Upload**:
1. Silent token refresh attempt (using refresh token)
2. If refresh succeeds: Upload retries automatically (user sees no error)
3. If refresh fails: Notification: "Authentication expired. Sign in again to enable cloud upload." (with "Sign In" button)
4. Local analysis unaffected (diagnostics remain visible)

### Detector Timeout

**Symptom**: Detector runs >30 seconds (TypeScript compilation on 100K LOC project).

**UX Response**:
1. Progress notification updates: "Analyzing... (TypeScript detector: 15s)" (live timer)
2. At 30s: Detector auto-cancels, logs warning, analysis completes without TypeScript results
3. Notification: "TypeScript detector timed out (>30s). Try analyzing smaller file subsets or increasing timeout."
4. Settings: `odavl-insight.analysisTimeout` allows custom timeout (default: 30s, max: 300s)

**User Confidence Signals**:
- Clear distinction: "Insight broke" vs "Your code is broken"
- Error messages never blame user's code for extension failures
- Example: "Security detector crashed due to internal error (not your code)" vs "Security detector found 3 vulnerabilities in your code"
- Logs always include extension version, detector version, project size for debugging

---

## 8. Performance & Resource Constraints

### Target Performance Bounds

**Time to First Analysis** (typical 50K LOC TypeScript project):
- Extension activation: <200ms (lazy loading, no heavy services)
- First workspace scan: 30-90 seconds (11 detectors running in parallel)
- Cached re-analysis: 2-5 seconds (single file change, 500ms debounce)

**Memory Impact**:
- Extension process: <50 MB RSS (no heavy data structures in memory)
- Analysis child process: <200 MB peak (detectors run in isolated process, exit after completion)
- Long-running session (8 hours): <100 MB extension process (no memory leaks)

**Background Work**:
- File watcher: Monitors `**/*.{ts,js,py,java,go,rs}` for changes (native VS Code API, minimal overhead)
- Auto-analysis debounce: 500ms after last file save (avoids analysis storm during rapid edits)
- Cache cleanup: Every 60 minutes, purge analysis results >5 minutes old (lightweight GC)

### Avoiding Editor Blocking

**Child Process Execution**:
- Analysis runs in separate Node.js process (spawned via `child_process.spawn`)
- Extension remains responsive during analysis (UI thread never blocks)
- Progress notifications use streaming output (incremental updates, not blocking waits)

**Cancellation Support**:
- User action (e.g., typing in file, opening new file) cancels in-progress analysis
- Cancel signal sent to child process (SIGTERM), waits 2s for graceful exit, then SIGKILL
- Status bar: "$(x) Analysis cancelled" (3-second display)

**Incremental Analysis**:
- On file save: Analyze only saved file + immediate dependencies (typically 1-5 files)
- On workspace open: Analyze only files changed since last Git commit (delta-first)
- On command invocation: Full workspace scan (user-initiated, expected latency)

### When to Ask Confirmation for Long-Running Analysis

**Automatic Analysis** (no confirmation):
- Single file save: Always analyze (expected <2s)
- Changed files (Git working tree <20 files): Always analyze (expected <10s)

**Prompted Analysis** (confirmation required):
- Full workspace >100K LOC: "Analyze 1,247 files (estimated 2-3 minutes)? Cancel"
- First-time analysis on unknown project: "Analyze workspace to enable real-time feedback? Cancel"
- Manual "Analyze Workspace" command: No confirmation (user-initiated)

**Progress Transparency**:
- Notification shows: "Analyzing 1,247 files... (47/1247) — TypeScript detector" (live progress)
- Cancel button: Always available during long-running analysis
- Estimated time: Shown if analysis >10 seconds (based on project size heuristics)

---

## 9. Accessibility & Internationalization

### Minimum a11y Contract

**Color Contrast**:
- Severity icons: Minimum 4.5:1 contrast ratio (WCAG AA standard)
- Status bar text: Readable in both light and dark themes (VS Code theme variables)
- Error messages: Never rely on color alone (use icon + text label)

**Icons + Text Redundancy**:
- Status bar: `$(flame) Insight: 7 issues` (icon + text, not icon-only)
- Severity: 🔥 Critical (not just red color)
- Problems Panel: "Critical" label + red icon (screen reader announces "Critical severity issue")

**Screen Reader Friendliness**:
- ARIA labels on all interactive elements
- Status bar: `aria-label="ODAVL Insight: 7 issues. Click to filter Problems Panel"`
- Progress notifications: `aria-live="polite"` (non-intrusive announcements)
- Diagnostics: VS Code native accessibility (no custom rendering that breaks screen readers)

**Keyboard Navigation**:
- All commands accessible via Command Palette (no mouse-only actions)
- Problems Panel: Standard VS Code keyboard navigation (arrow keys, Enter to open file)
- No custom keyboard traps (modals must support Escape key to dismiss)

### Internationalization (Future-Proofing)

**Current State** (v1.0):
- English-only UI strings
- All user-facing text stored in `package.nls.json` (VS Code i18n convention)
- Detector messages hardcoded in English (not translated)

**Future-Proofing Strategy**:
- Use VS Code's `vscode-nls` API for all UI strings: `localize('analyzeWorkspace.title', 'Analyze Workspace')`
- Avoid hardcoded concatenation: `localize('issueCount', 'Found {0} issues', count)` (not `"Found " + count + " issues"`)
- Date/time formatting: Use `Intl.DateTimeFormat` (locale-aware)
- Number formatting: Use `Intl.NumberFormat` (handles thousands separators, decimals)

**Avoiding Color-Only Severity Signals**:
- Severity always has icon + text label
- Never use "red means critical" without textual indication
- Color-blind safe palette: Red (critical), yellow (high), blue (medium), gray (low) tested with Coblis simulator

---

## 10. Telemetry, Logging & Privacy (in the IDE)

### What Telemetry MAY Be Collected

**Usage Metrics** (with explicit opt-in):
- Command invocations: Count of "Analyze Workspace" executions per session
- Detector enablement: Which detectors are enabled/disabled by users
- Analysis duration: Time to complete analysis (bucketed: <5s, 5-30s, 30s+)
- Error rates: Count of detector failures (no error details, just counts)

**System Context** (anonymous):
- VS Code version
- Extension version
- Operating system (Windows, macOS, Linux)
- Workspace size category (small: <10K LOC, medium: 10-50K, large: >50K)

### What Extension MUST NOT Collect

**Forbidden Data**:
- Source code content (never transmitted)
- File paths (even relative paths are too identifying)
- Error messages containing variable names, function names, or code snippets
- Environment variables (even sanitized)
- Git commit SHAs, branch names, or repository URLs
- User email addresses or authentication tokens
- Network requests to non-ODAVL domains (no 3rd party analytics)

**Alignment with SECURITY_AND_PRIVACY.md**:
- All telemetry follows same sanitization rules as cloud upload
- Telemetry disabled by default (opt-in only)
- Telemetry respects VS Code global telemetry setting (`telemetryLevel`)
- No telemetry in air-gapped environments (no network requests if offline)

### Opt-Out Mechanism

**First Activation Prompt**:
```
📊 Help improve ODAVL Insight by sending anonymous usage data?

We collect anonymous usage statistics to improve the extension.
No personal information, workspace paths, or code is ever sent.

[ Enable ]  [ Disable ]  [ Learn More ]
```

**Settings Control**:
- Setting: `odavl-insight.telemetry.enabled` (default: `false`)
- Respects: `telemetry.telemetryLevel` (global VS Code setting)
- If global telemetry is "off", extension never prompts and never collects

**Runtime Behavior**:
- Telemetry check on every command execution: `if (!isTelemetryEnabled()) { return; }`
- No background telemetry processes
- No buffering or retry of failed telemetry uploads (fail silently, never retry)

### Logging Best Practices

**Output Channel Logs**:
- Always logged: Extension activation time, analysis start/complete, detector failures
- Privacy-safe: File counts (e.g., "Analyzed 47 TypeScript files") but never file names
- Debugging: Full error stack traces (but sanitize variable names in traces)

**Local File Logs** (`.odavl/logs/extension.log`):
- Opt-in: `odavl-insight.logging.enabled` (default: `false`, not created unless enabled)
- Rotation: 10 MB max, 3 files retained (automatically cleaned up)
- Privacy: Same sanitization rules as Output Channel

**User Control**:
- Command: "ODAVL Insight: Open Output Channel" (shows logs in VS Code)
- Command: "ODAVL Insight: Clear Logs" (deletes `.odavl/logs/`)
- Settings: `odavl-insight.logging.level` (`error` | `warn` | `info` | `debug`)

---

## 11. Roadmap & Non-Goals for v1

### MUST Be in First "World-Class" Release

**Core Analysis Features**:
- ✅ Local analysis with 11 stable detectors (TypeScript, security, complexity, etc.)
- ✅ Real-time feedback on file save (500ms debounce, <2s analysis)
- ✅ Problems Panel integration with click-to-navigate
- ✅ Status bar with issue count and analysis state
- ✅ Command: "Analyze Workspace", "Analyze Changed Files", "Clear Diagnostics"
- ✅ Settings: Auto-analyze on save, enabled detectors, severity minimum

**Privacy & Offline**:
- ✅ Complete functionality without authentication
- ✅ Zero network requests in local-only mode
- ✅ Air-gap compatibility (VSIX offline installation)
- ✅ Explicit cloud upload consent (modal on first upload)

**Performance**:
- ✅ Extension activation <200ms (lazy loading)
- ✅ Single file analysis <2s (cached results)
- ✅ Memory footprint <50 MB (extension process)
- ✅ No editor blocking during analysis (child process)

**UX Polish**:
- ✅ Inline diagnostics with hover tooltips
- ✅ Severity icons (🔥 Critical, ⚠️ High, ℹ️ Medium, 💡 Low)
- ✅ Progress notifications for long-running analysis
- ✅ Graceful error handling (detector failures don't crash extension)

### Explicitly Out-of-Scope for v1

**Auto-Fix / Code Actions**:
- ❌ "Fix All Issues" command (too risky, breaks trust)
- ❌ Quick fixes for most issues (except trivial: unused imports)
- ❌ AI-generated code suggestions (not deterministic)
- ❌ Automatic refactoring (manual review required)

**Team Collaboration**:
- ❌ In-IDE code review workflows
- ❌ Issue comments or discussions
- ❌ Real-time multiplayer editing
- ❌ Team notifications (use Slack/email instead)

**Advanced Intelligence**:
- ❌ ML-based pattern learning (SimpleTrustPredictor only, not real TensorFlow.js model)
- ❌ Context-aware security scanning (rule-based only)
- ❌ Adaptive threshold tuning (static thresholds in v1)
- ❌ Historical trend analysis in sidebar (cloud dashboard feature)

**Platform Integrations**:
- ❌ GitHub Issues integration (file issues manually)
- ❌ Jira ticket creation
- ❌ Slack notifications on issue detection
- ❌ Jenkins/CircleCI/Travis CI plugins (use CLI in CI)

### Future Enhancements (Aligned with Contract)

**v1.1 (Q1 2026)**:
- Quick fixes for unused imports (safe, deterministic)
- Baseline issue filtering UI (toggle "Show Baseline Issues")
- Multi-language workspace detection (currently assumes primary language)

**v1.2 (Q2 2026)**:
- Historical trend chart in sidebar (read-only, cloud data)
- Export diagnostics to GitHub Issues format (markdown)
- Custom detector configuration UI (currently settings.json only)

**v2.0 (Q3 2026)**:
- Real ML trust predictor (TensorFlow.js model, replaces SimpleTrustPredictor)
- Context-aware quick fixes (AI-assisted, user-reviewed)
- Advanced filtering: "Show issues introduced this week", "Show high-confidence only"

**All Future Work**:
- Must respect privacy contract (no source code uploads)
- Must maintain offline functionality (cloud features optional)
- Must avoid noise (quality over quantity)
- Must remain deterministic (no unpredictable AI behavior)

---

## Appendix: Anti-Patterns (Explicit Prohibitions)

### Forbidden UX Patterns

1. **Auto-Fixing Without Confirmation**: Never modify code without explicit user action (Ctrl+S to save is not consent for code changes)

2. **Blocking Modals for Upsells**: Never show "Upgrade to PRO to continue" modals that block analysis workflows

3. **Noisy Telemetry**: Never send telemetry on every keystroke, file save, or hover action (coarse-grained events only)

4. **Hidden Network Requests**: Never make network calls without visible status bar indicator or log entry

5. **Color-Only Severity Indication**: Never use color as sole indicator of severity (always include icon + text label)

6. **Overwhelming Diagnostics**: Never show >50 issues in Problems Panel by default (paginate or filter)

7. **Ambiguous Error Messages**: Never show generic "Analysis failed" without context (always include detector name + error type)

8. **Long Activation Times**: Never block extension activation on network requests, authentication, or heavy computation (lazy load)

9. **Undismissible Notifications**: Never show non-dismissible popups (always include X button or auto-dismiss after 10s)

10. **Mouse-Only Actions**: Never create features accessible only via mouse (keyboard shortcuts or Command Palette required)

---

**End of UX Contract**
