# ODAVL Insight - Baseline & Diff System Design

**Phase 5 - Step 1: Design Document**  
**Date**: December 13, 2025  
**Status**: Design Phase (No Implementation)

---

## 📋 Executive Summary

This document proposes a professional baseline & diff system for ODAVL Insight that enables users to:
- Save a baseline snapshot of known issues
- Run future analyses and see ONLY new or changed issues
- Use baselines consistently across CLI, CI, and VS Code
- Track code quality trends over time

**Design Philosophy**: Pragmatic, stable, and CI-friendly with honest tradeoffs.

---

## 1️⃣ AUDIT: Current Capabilities

### 1.1 Available Data Structures

**From CLI Types** (`odavl-studio/insight/cli/src/types.ts`):
```typescript
export interface InsightIssue {
  file: string;          // Absolute or relative file path
  line: number;          // Line number where issue occurs
  column: number;        // Column number (optional precision)
  severity: Severity;    // 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string;       // Human-readable error message
  detector: string;      // Which detector found it (e.g., 'security', 'typescript')
  ruleId?: string;       // Optional rule identifier (e.g., 'SEC001', 'TS2304')
  suggestedFix?: string; // Optional fix suggestion
}
```

**From Core Types** (`odavl-studio/insight/core/src/types.ts`):
```typescript
export interface Issue {
  type: string;          // Issue type
  severity: Severity;    // Severity level
  message: string;       // Error message
  file: string;          // File path
  line?: number;         // Start line
  endLine?: number;      // End line (multi-line issues)
  column?: number;       // Column number
  suggestion?: string;   // Single suggestion
  suggestions?: string[]; // Multiple suggestions
  code?: string;         // Error code
  ruleId?: string;       // Rule ID
  rule?: string;         // Rule name
  category?: string;     // Issue category
  codeSnippet?: string;  // Code context
  details?: string;      // Additional details
}
```

**Key Observations:**
- ✅ **Consistent structure**: Both have file, line, severity, message, ruleId
- ✅ **Line numbers available**: Core location data for matching
- ❌ **NO built-in fingerprint/hash**: Issues don't have stable IDs
- ❌ **NO code snippet hashing**: No content-based matching
- ⚠️ **Line numbers brittle**: Will break on code insertions/deletions

### 1.2 Existing Infrastructure

**HistoricalComparisonEngine** (`odavl-studio/insight/core/src/reporting/historical-comparison.ts`):
- ✅ Already implements baseline comparison logic
- ✅ Has `getIssueFingerprint()` method: `${file}:${line}:${message}`
- ✅ Categorizes issues: new, resolved, unchanged, resurfaced
- ✅ Calculates metrics: delta, percent change, status
- ✅ Detects regressions and improvements
- ❌ **Not integrated with CLI yet**
- ❌ **No persistence layer** (only in-memory comparison)

**IncrementalAnalyzer** (`odavl-studio/insight/core/src/incremental-analyzer.ts`):
- ✅ File-level change detection via SHA-256 hashing
- ✅ `.odavl/cache/file-hashes.json` for file tracking
- ✅ Identifies changed/new/deleted files
- ⚠️ File-level only, not issue-level

**Current Fingerprinting Strategy**:
```typescript
// From historical-comparison.ts line 276
private getIssueFingerprint(issue: Issue): string {
  return `${issue.file}:${issue.line}:${issue.message}`;
}
```

**Weakness**: Breaks when:
- Line numbers change (code insertion/deletion)
- Message text changes (detector updates)
- Files are renamed/moved

### 1.3 Metadata Assessment

**Available for Matching**:
| Field | Stability | Suitability | Notes |
|-------|-----------|-------------|-------|
| `file` | Medium | ⚠️ | Breaks on file renames |
| `line` | Low | ❌ | Changes on code edits |
| `column` | Low | ❌ | Changes on formatting |
| `message` | Medium | ⚠️ | May change on detector updates |
| `severity` | Medium | ✅ | Stable for same rule |
| `ruleId` | High | ✅✅ | Best identifier if present |
| `detector` | High | ✅ | Stable detector name |
| `codeSnippet` | Medium | ⚠️ | Not always available |

**Missing Critical Data**:
- ❌ **No issue UUID**: Issues are not uniquely identified
- ❌ **No content hash**: Can't match by code context
- ❌ **No AST node ID**: Can't track semantic location
- ❌ **No git blame data**: Can't track authorship

---

## 2️⃣ PROPOSED BASELINE DESIGN

### 2.1 File Format: JSON with Structured Metadata

**Chosen Format**: JSON (not YAML)

**Rationale**:
- ✅ Fast parsing (critical for CI)
- ✅ Standard schema validation (JSON Schema)
- ✅ Machine-readable (no ambiguity)
- ✅ Diff-friendly with tools like `jq`
- ❌ YAML is human-friendly but slow and error-prone

**Schema Structure**:
```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "2025-12-13T10:30:00Z",
    "createdBy": "odavl-insight@1.0.0",
    "projectName": "my-project",
    "gitCommit": "abc123...",
    "gitBranch": "main",
    "totalFiles": 245,
    "totalIssues": 127
  },
  "config": {
    "detectors": ["typescript", "security", "performance"],
    "ignorePatterns": ["**/*.test.ts", "**/node_modules/**"]
  },
  "issues": [
    {
      "fingerprint": "sha256:abc123...",
      "file": "src/utils/auth.ts",
      "line": 42,
      "endLine": 42,
      "column": 10,
      "severity": "high",
      "message": "Hardcoded API key detected",
      "detector": "security",
      "ruleId": "SEC001",
      "codeContext": {
        "snippet": "const API_KEY = 'secret123';",
        "hash": "sha256:def456..."
      },
      "firstSeen": "2025-12-13T10:30:00Z"
    }
  ]
}
```

**Field Rationale**:
- `version`: Schema versioning for future migrations
- `metadata.gitCommit`: Ties baseline to exact code state
- `fingerprint`: Unique ID for issue matching (see 2.3)
- `codeContext.snippet`: For human review
- `codeContext.hash`: For content-based matching
- `firstSeen`: Tracks issue age for prioritization

### 2.2 Storage Location: `.odavl/baselines/`

**Chosen Location**: `.odavl/baselines/<name>.json`

**Alternatives Considered**:
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| `.odavl/baseline.json` | Simple | Single baseline only | ❌ Rejected |
| `.insight-baseline/` | Product-specific | Clutters repo root | ❌ Rejected |
| `.odavl/baselines/` | Multi-baseline support | Requires naming | ✅ **CHOSEN** |
| `reports/baselines/` | With reports | Not gitignored | ❌ Rejected |

**File Naming Strategy**:
```bash
.odavl/baselines/
├── main.json               # Default baseline (main branch)
├── develop.json            # Development branch baseline
├── release-v2.0.json       # Release-specific baseline
├── 2025-12-13-123456.json  # Timestamped snapshot
└── .gitkeep                # Track directory in git
```

**Gitignore Recommendation**:
```gitignore
# Ignore timestamped snapshots (too noisy)
.odavl/baselines/*.json

# Keep named baselines (main, develop) in git
!.odavl/baselines/main.json
!.odavl/baselines/develop.json
```

**Rationale**:
- ✅ Multi-baseline support (different branches, releases)
- ✅ Centralized with other ODAVL data
- ✅ Clear naming convention
- ✅ Optional git tracking (via negated .gitignore)

### 2.3 Issue Matching: Multi-Strategy Fingerprinting

**Problem**: Issues don't have stable IDs. How do we match them across runs?

**Proposed Fingerprinting Algorithm** (Tiered Fallback):

**Tier 1: Content-Based (Most Stable)**
```typescript
function generateFingerprint(issue: InsightIssue, codeSnippet?: string): string {
  // SHA-256 hash of:
  // - ruleId (if available)
  // - detector
  // - code snippet (3 lines: before, issue, after)
  // - severity
  
  const components = [
    issue.ruleId || '',
    issue.detector,
    codeSnippet || '',
    issue.severity,
  ];
  
  const input = components.join(':');
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex')}`;
}
```

**Tier 2: Location-Based (Fallback if no snippet)**
```typescript
function generateLocationFingerprint(issue: InsightIssue): string {
  // Normalize file path (strip project root)
  const relativePath = normalizeFilePath(issue.file);
  
  // Hash: file + line range + detector + ruleId
  const input = `${relativePath}:${issue.line}:${issue.detector}:${issue.ruleId || ''}`;
  return `loc:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}
```

**Tier 3: Message-Based (Last Resort)**
```typescript
function generateMessageFingerprint(issue: InsightIssue): string {
  // Fallback for when everything else fails
  // Uses current HistoricalComparisonEngine approach
  const normalized = normalizeFilePath(issue.file);
  const input = `${normalized}:${issue.line}:${issue.message}`;
  return `msg:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}
```

**Matching Algorithm**:
```typescript
function matchIssue(currentIssue: InsightIssue, baseline: BaselineIssue[]): BaselineIssue | null {
  const fingerprint = generateFingerprint(currentIssue);
  
  // 1. Exact fingerprint match (best case)
  let match = baseline.find(b => b.fingerprint === fingerprint);
  if (match) return match;
  
  // 2. Fuzzy line match (±3 lines, same file, same rule)
  const fuzzyMatches = baseline.filter(b => 
    b.file === currentIssue.file &&
    b.ruleId === currentIssue.ruleId &&
    Math.abs(b.line - currentIssue.line) <= 3
  );
  
  if (fuzzyMatches.length === 1) return fuzzyMatches[0];
  
  // 3. No match - new issue
  return null;
}
```

**Rationale**:
- ✅ **Tier 1 (content)**: Survives line number changes, file renames
- ✅ **Tier 2 (location)**: Works without code snippets
- ✅ **Tier 3 (message)**: Backwards compatible with current approach
- ✅ **Fuzzy matching**: Handles small code shifts (±3 lines)
- ❌ **Still breaks on**: Major refactors, detector message changes

### 2.4 Handling Moved Lines & Renamed Files

**Moved Lines (Code Insertions/Deletions)**:

**Strategy**: Fuzzy line matching (±3 lines)
```typescript
// If issue was on line 42, check lines 39-45 for same rule
const LINE_TOLERANCE = 3;

function isFuzzyMatch(current: InsightIssue, baseline: BaselineIssue): boolean {
  return (
    current.file === baseline.file &&
    current.ruleId === baseline.ruleId &&
    Math.abs(current.line - baseline.line) <= LINE_TOLERANCE &&
    current.detector === baseline.detector
  );
}
```

**Trade-offs**:
- ✅ Handles small code changes (adding/removing lines)
- ✅ Prevents false "new issue" reports
- ❌ May miss real line-specific fixes
- ❌ Tolerance window arbitrary (3 lines chosen pragmatically)

**Renamed Files**:

**Strategy**: Git integration + fallback heuristics
```typescript
// 1. Use git to detect renames
async function detectFileRenames(): Promise<Map<string, string>> {
  const output = execSync('git diff --name-status HEAD~1 HEAD').toString();
  const renames = new Map<string, string>();
  
  for (const line of output.split('\n')) {
    if (line.startsWith('R')) {
      const [_, oldPath, newPath] = line.split('\t');
      renames.set(oldPath, newPath);
    }
  }
  
  return renames;
}

// 2. Apply renames before matching
function normalizeFilePathWithRenames(
  file: string, 
  renames: Map<string, string>
): string {
  return renames.get(file) || file;
}
```

**Fallback Heuristics** (if not a git repo):
```typescript
// Match by:
// - Similar filename (Levenshtein distance < 5)
// - Same directory structure
// - Same number of issues with same rules
function findLikelyRenamedFile(
  oldFile: string, 
  currentFiles: string[]
): string | null {
  // Implementation: fuzzy string matching + heuristics
  // (Not production-critical, best-effort only)
}
```

**Trade-offs**:
- ✅ Git rename detection: Accurate for versioned codebases
- ✅ Preserves issue history across renames
- ❌ Requires git (fails gracefully for non-git projects)
- ❌ Heuristics may produce false matches

---

## 3️⃣ CLI DESIGN

### 3.1 New Commands

**Command 1: Create Baseline**
```bash
odavl-insight baseline create [options]

Options:
  --name <name>          Baseline name (default: 'main')
  --output <path>        Output path (default: .odavl/baselines/<name>.json)
  --detectors <list>     Comma-separated detectors to run
  --format json|yaml     Output format (default: json)
  
Examples:
  odavl-insight baseline create
  odavl-insight baseline create --name develop
  odavl-insight baseline create --name release-v2.0 --detectors typescript,security
```

**Command 2: List Baselines**
```bash
odavl-insight baseline list

Output:
  📦 Available Baselines:
  
  main.json (default)
    Created: 2025-12-13 10:30 UTC
    Commit: abc123...
    Issues: 127 (12 critical, 45 high, 70 medium)
    
  develop.json
    Created: 2025-12-10 15:45 UTC
    Commit: def456...
    Issues: 135 (15 critical, 48 high, 72 medium)
```

**Command 3: Delete Baseline**
```bash
odavl-insight baseline delete <name>

Examples:
  odavl-insight baseline delete old-release
```

**Command 4: Analyze with Baseline**
```bash
odavl-insight analyze [path] --baseline <name> [options]

Options:
  --baseline <name>          Baseline to compare against (default: 'main')
  --fail-on-new              Exit 1 if ANY new issues found
  --fail-level <severity>    Exit 1 if new issues ≥ severity
  --show-resolved            Include resolved issues in output
  --update-baseline          Update baseline after successful analysis
  
Examples:
  # Basic: show only new issues
  odavl-insight analyze --baseline main
  
  # CI: fail on any new high/critical issues
  odavl-insight analyze --baseline main --fail-on-new --fail-level high --ci
  
  # Development: see resolved issues too
  odavl-insight analyze --baseline develop --show-resolved
```

### 3.2 Exit Code Behavior with Baseline

**Modified Exit Code Logic**:
```typescript
enum ExitCode {
  SUCCESS = 0,                  // No new issues at/above fail-level
  NEW_ISSUES_FOUND = 1,         // New issues found (respects fail-level)
  INTERNAL_ERROR = 2,           // Analysis failed
  BASELINE_NOT_FOUND = 3,       // Baseline file missing
  BASELINE_INVALID = 4,         // Baseline schema validation failed
}

function calculateExitCodeWithBaseline(
  currentIssues: InsightIssue[],
  baseline: Baseline,
  options: { failOnNew: boolean; failLevel: Severity }
): ExitCode {
  const comparison = compareWithBaseline(currentIssues, baseline);
  
  if (options.failOnNew && comparison.newIssues.length > 0) {
    // Fail on ANY new issue
    return ExitCode.NEW_ISSUES_FOUND;
  }
  
  // Fail on new issues at/above fail-level
  const newIssuesAtLevel = comparison.newIssues.filter(
    issue => getSeverityWeight(issue.severity) >= getSeverityWeight(options.failLevel)
  );
  
  return newIssuesAtLevel.length > 0 ? ExitCode.NEW_ISSUES_FOUND : ExitCode.SUCCESS;
}
```

**Key Behavior Changes**:
| Scenario | Without Baseline | With Baseline |
|----------|------------------|---------------|
| 100 old issues, 0 new | Exit 1 (issues exist) | **Exit 0** (no new issues) |
| 100 old issues, 5 new low | Exit 1 (fail-level: high) | Exit 0 (new issues < fail-level) |
| 100 old issues, 1 new high | Exit 1 | Exit 1 |
| 0 old issues, 10 new medium | Exit 1 | Exit 1 |

**Rationale**:
- ✅ **CI-friendly**: Don't fail on pre-existing issues
- ✅ **Progressive improvement**: Focus on preventing regressions
- ✅ **Flexible**: `--fail-on-new` for strict enforcement
- ⚠️ **May hide debt**: Old issues stay invisible (intended behavior)

### 3.3 Output Format Changes

**Human Format** (with baseline):
```
🔍 ODAVL Insight Analysis (vs baseline: main)
═══════════════════════════════════════════════════════════

📊 Comparison Summary:
  Baseline: main.json (2025-12-13 10:30 UTC, commit abc123)
  Current:  2025-12-13 14:45 UTC (commit def456)
  
  Total Issues: 132 (+5 from baseline)
  
📈 Issue Changes:
  ✅ Resolved:  10 issues fixed
  🆕 New:       15 issues introduced
  🔄 Unchanged: 117 issues still present

🚨 New Issues (15):
  Critical: 2
  High:     5
  Medium:   6
  Low:      2

📄 Files with New Issues:
  src/utils/auth.ts         3 new (2 high, 1 medium)
  src/api/handlers.ts       2 new (1 critical, 1 medium)
  ...

[Detailed issue list follows...]
```

**JSON Format** (with baseline):
```json
{
  "issues": [...],
  "summary": {
    "total": 132,
    "critical": 12,
    "high": 45,
    ...
  },
  "baseline": {
    "name": "main",
    "path": ".odavl/baselines/main.json",
    "timestamp": "2025-12-13T10:30:00Z",
    "commit": "abc123...",
    "totalIssues": 127
  },
  "comparison": {
    "newIssues": 15,
    "resolvedIssues": 10,
    "unchangedIssues": 117,
    "deltaPercent": 3.9
  },
  "newIssues": [
    {
      "file": "src/utils/auth.ts",
      "line": 42,
      "severity": "high",
      "message": "Hardcoded API key detected",
      "detector": "security",
      "ruleId": "SEC001",
      "firstDetected": "2025-12-13T14:45:00Z"
    }
  ],
  "resolvedIssues": [...]
}
```

---

## 4️⃣ CI BEHAVIOR

### 4.1 Baseline Strategy for CI

**Recommended Workflow**:
```yaml
# .github/workflows/insight-analysis.yml
name: ODAVL Insight Analysis

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Need full history for git diff
      
      - name: Install ODAVL Insight CLI
        run: npm install -g @odavl/insight-cli
      
      # On main branch: update baseline
      - name: Create/Update Baseline (main only)
        if: github.ref == 'refs/heads/main'
        run: |
          odavl-insight baseline create --name main
          git add .odavl/baselines/main.json
          git commit -m "chore: update Insight baseline [skip ci]"
          git push
      
      # On PRs: analyze against main baseline
      - name: Analyze PR (compare to main)
        if: github.event_name == 'pull_request'
        run: |
          odavl-insight analyze \
            --baseline main \
            --fail-on-new \
            --fail-level high \
            --ci \
            --format sarif \
            > insight-results.sarif
      
      - name: Upload SARIF to GitHub
        if: always()
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: insight-results.sarif
```

**Alternative: Branch-Specific Baselines**
```yaml
      # Use branch-specific baselines
      - name: Determine Baseline
        id: baseline
        run: |
          if [ "${{ github.base_ref }}" == "main" ]; then
            echo "name=main" >> $GITHUB_OUTPUT
          elif [ "${{ github.base_ref }}" == "develop" ]; then
            echo "name=develop" >> $GITHUB_OUTPUT
          else
            echo "name=main" >> $GITHUB_OUTPUT
          fi
      
      - name: Analyze with Appropriate Baseline
        run: |
          odavl-insight analyze --baseline ${{ steps.baseline.outputs.name }}
```

### 4.2 Fail-Level Interaction

**Scenario Matrix**:

| Baseline | Fail-Level | New High Issue | New Medium Issue | Old Critical Issue | Exit Code | Rationale |
|----------|------------|----------------|------------------|--------------------|-----------|-----------|
| ❌ None | high | ✅ Present | ❌ None | ✅ Present | 1 | Fails on any high+ issue |
| ✅ main.json | high | ✅ **New** | ❌ None | ✅ Old (baseline) | 1 | Fails on **new** high+ issue |
| ✅ main.json | high | ❌ None | ✅ **New** | ✅ Old | 0 | New issue below fail-level |
| ✅ main.json | medium | ❌ None | ✅ **New** | ✅ Old | 1 | New medium ≥ fail-level |
| ✅ main.json | high | ❌ None | ❌ None | ✅ Old | 0 | No new issues |

**Key Rules**:
1. **Baseline overrides total issue count**: Focus on new issues only
2. **Fail-level still applies**: But only to new issues, not baseline
3. **`--fail-on-new` is strict**: Fails on ANY new issue (ignores fail-level)

### 4.3 Baseline Update Strategy

**Options**:

**Option A: Manual Update (Safest)**
```bash
# Developer manually updates baseline when intentional
git checkout main
odavl-insight baseline create --name main
git add .odavl/baselines/main.json
git commit -m "chore: accept new baseline"
git push
```

**Option B: Auto-Update on Main Merge (Recommended)**
```yaml
# Only update baseline on successful main branch merge
- name: Update Baseline (main only)
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: |
    odavl-insight baseline create --name main
    # Commit back to repo (with [skip ci] to prevent loop)
```

**Option C: Auto-Update with Approval (Enterprise)**
```yaml
# Create PR with baseline update, require approval
- name: Create Baseline Update PR
  if: github.event_name == 'schedule'  # Weekly cron job
  run: |
    git checkout -b chore/update-baseline-$(date +%Y%m%d)
    odavl-insight baseline create --name main
    git add .odavl/baselines/main.json
    git commit -m "chore: weekly baseline update"
    gh pr create --title "Update Insight Baseline" --body "Auto-generated"
```

**Recommendation**: **Option B** for most teams (auto-update on main)

---

## 5️⃣ RISK ANALYSIS

### 5.1 False Negatives

**Risk**: Missing real new issues due to fingerprinting limitations.

**Scenarios**:

1. **Detector Message Change**:
   - **Example**: Security detector updates message from "Hardcoded secret" to "Hardcoded API key"
   - **Impact**: Issue re-flagged as "new" even though code unchanged
   - **Likelihood**: Medium (detector updates happen)
   - **Mitigation**: Use `ruleId` (stable) instead of message text in fingerprint

2. **Major Refactor**:
   - **Example**: File renamed, code restructured, line numbers completely changed
   - **Impact**: All issues appear "new" after refactor
   - **Likelihood**: Low-Medium (happens during rewrites)
   - **Mitigation**: Git rename detection, fuzzy matching (±3 lines)

3. **Fuzzy Matching Too Aggressive**:
   - **Example**: Issue on line 42 matches baseline issue on line 45 (different issue)
   - **Impact**: Real new issue hidden
   - **Likelihood**: Low (requires same file + same rule + nearby lines)
   - **Mitigation**: Combine fuzzy match with ruleId + code snippet hash

**Overall False Negative Risk**: **Medium-Low**

**Mitigation Strategy**:
- ✅ Use multi-tier fingerprinting (content > location > message)
- ✅ Provide `--ignore-baseline` flag for "fresh eyes" analysis
- ✅ Warn users when baseline is >30 days old
- ✅ Recommend periodic baseline recreation (monthly)

### 5.2 False Positives

**Risk**: Flagging issues as "new" when they're actually old.

**Scenarios**:

1. **Line Number Shift**:
   - **Example**: Adding 10 lines at top of file shifts issue from line 42 → 52
   - **Impact**: Fuzzy match may fail (>3 line tolerance)
   - **Likelihood**: Medium (happens on every code addition)
   - **Mitigation**: Increase tolerance to ±5 lines? (Trade-off: more false negatives)

2. **Baseline Corruption**:
   - **Example**: Baseline file manually edited, fingerprints broken
   - **Impact**: All issues appear "new"
   - **Likelihood**: Low (user error)
   - **Mitigation**: Schema validation, checksum verification

3. **Detector Addition**:
   - **Example**: User enables new detector not in baseline
   - **Impact**: All issues from new detector flagged as "new" (correct behavior)
   - **Likelihood**: High (expected use case)
   - **Mitigation**: None needed (intended behavior), but warn user

**Overall False Positive Risk**: **Medium**

**Mitigation Strategy**:
- ✅ Conservative fuzzy matching (±3 lines default)
- ✅ Schema validation on baseline load
- ✅ Warn when detectors differ from baseline config
- ✅ Provide `--show-unchanged` to review all issues

### 5.3 Performance Impact

**Baseline Load Time**:
```
Baseline Size: ~500 KB (1000 issues × ~500 bytes each)
Parse Time: ~50 ms (JSON.parse)
Impact: Negligible (<100ms added to analysis)
```

**Fingerprint Generation**:
```
SHA-256 Hash: ~1ms per issue
1000 issues: ~1 second
Impact: Low (parallelize hash generation)
```

**Fuzzy Matching**:
```
Worst Case: O(n × m) where n = current issues, m = baseline issues
1000 current × 1000 baseline: 1M comparisons
With early-exit optimizations: ~100ms
Impact: Medium (acceptable for CLI, critical for CI)
```

**Optimization Strategy**:
```typescript
// 1. Index baseline by file + ruleId for O(1) lookup
const baselineIndex = new Map<string, BaselineIssue[]>();
for (const issue of baseline.issues) {
  const key = `${issue.file}:${issue.ruleId}`;
  if (!baselineIndex.has(key)) {
    baselineIndex.set(key, []);
  }
  baselineIndex.get(key)!.push(issue);
}

// 2. Only fuzzy-match within same file + ruleId
function findMatch(current: InsightIssue): BaselineIssue | null {
  const key = `${current.file}:${current.ruleId}`;
  const candidates = baselineIndex.get(key) || [];
  // Now only compare against ~10 candidates instead of 1000
  return candidates.find(c => isFuzzyMatch(current, c));
}
```

**Expected Performance**: <200ms overhead for 1000 issues

### 5.4 Migration Strategy

**Problem**: Existing users have no baselines. How do they adopt?

**Strategy 1: Auto-Create on First Use**
```bash
# First time user runs --baseline
$ odavl-insight analyze --baseline main

⚠️  Baseline 'main' not found. Creating from current analysis...
✅ Baseline created: .odavl/baselines/main.json (127 issues)
📊 Analyzing against new baseline...

Summary: 0 new issues (baseline just created)
```

**Strategy 2: Explicit Opt-In**
```bash
# User must create baseline explicitly
$ odavl-insight analyze --baseline main
❌ Error: Baseline 'main' not found.

Run: odavl-insight baseline create --name main
```

**Strategy 3: Learning Mode**
```bash
# First run: create baseline, don't fail
$ odavl-insight analyze --baseline main --learn

📚 Learning mode: Creating baseline from current state...
✅ Baseline created: .odavl/baselines/main.json
⚠️  Exit code 0 (learning mode, not enforcing baseline)

# Subsequent runs: enforce baseline
$ odavl-insight analyze --baseline main
```

**Recommendation**: **Strategy 1** (auto-create) for best UX

---

## 6️⃣ INTEGRATION WITH EXISTING COMPONENTS

### 6.1 HistoricalComparisonEngine

**Reuse Strategy**:
```typescript
// CLI will use existing comparison logic
import { HistoricalComparisonEngine } from '@odavl-studio/insight-core';

async function analyzeWithBaseline(path: string, baselineName: string) {
  // 1. Load baseline from disk
  const baseline = await loadBaseline(baselineName);
  
  // 2. Run analysis
  const current = await engine.analyze(path);
  
  // 3. Use HistoricalComparisonEngine for comparison
  const comparison = new HistoricalComparisonEngine({
    current,
    baseline: baseline.analysisResult,
    detailedComparison: true,
  });
  
  const result = comparison.compare();
  
  // 4. Format and display
  return formatComparisonResult(result);
}
```

**Changes Needed to Core**:
- ✅ None! Existing engine works
- ⚠️ May want to enhance fingerprint algorithm (add ruleId)

### 6.2 IncrementalAnalyzer

**Complementary Use**:
```typescript
// Combine file-level + issue-level tracking
async function smartAnalysis(path: string, baselineName: string) {
  // 1. Use IncrementalAnalyzer to find changed files
  const incremental = new IncrementalAnalyzer('.odavl/cache');
  await incremental.loadCache();
  const { changedFiles, unchangedFiles } = await incremental.analyze(allFiles);
  
  // 2. Only analyze changed files (fast)
  const currentIssues = await analyzeFiles(changedFiles);
  
  // 3. Load baseline issues for unchanged files
  const baseline = await loadBaseline(baselineName);
  const unchangedIssues = baseline.issues.filter(i => unchangedFiles.includes(i.file));
  
  // 4. Merge results
  return [...currentIssues, ...unchangedIssues];
}
```

**Performance Gain**:
```
Scenario: 1000 files, 50 changed since baseline
Without incremental: Analyze 1000 files (~30 seconds)
With incremental: Analyze 50 files (~1.5 seconds)
Speedup: 20x faster
```

---

## 7️⃣ FUTURE ENHANCEMENTS (Out of Scope for Phase 5)

**Phase 6+ Considerations**:

1. **Multi-Baseline Comparison**:
   ```bash
   odavl-insight compare main develop release-v2.0
   # Show trend across multiple baselines
   ```

2. **Baseline Expiration**:
   ```bash
   # Warn when baseline >30 days old
   ⚠️  Baseline 'main' is 45 days old. Consider recreating.
   ```

3. **Smart Baseline Merging**:
   ```bash
   # Merge baseline from feature branch into main
   odavl-insight baseline merge feature-xyz main
   ```

4. **AST-Based Matching**:
   ```typescript
   // Match by semantic AST node ID (survives line number changes)
   function getASTFingerprint(issue: Issue): string {
     const ast = parseFile(issue.file);
     const node = findNodeAtLine(ast, issue.line);
     return `ast:${node.type}:${node.name}:${node.parent.name}`;
   }
   ```

5. **ML-Based Issue Clustering**:
   ```typescript
   // Group similar issues for easier triage
   const clusters = clusterIssues(issues, { method: 'embedding', threshold: 0.8 });
   ```

6. **Baseline Snapshots (Time Travel)**:
   ```bash
   odavl-insight baseline snapshot --name "pre-refactor"
   # Later: restore or compare
   odavl-insight analyze --baseline pre-refactor
   ```

---

## 8️⃣ RECOMMENDATIONS & NEXT STEPS

### Immediate Action Items (Phase 5 Step 2):

1. ✅ **Implement baseline creation**: `baseline create` command
2. ✅ **Implement baseline loading**: Read JSON, validate schema
3. ✅ **Integrate HistoricalComparisonEngine**: Reuse existing comparison
4. ✅ **Add CLI flags**: `--baseline`, `--fail-on-new`, `--show-resolved`
5. ✅ **Update formatters**: Show comparison results in human/JSON/SARIF
6. ✅ **Write tests**: Baseline creation, loading, matching, CI scenarios

### Open Questions for User Feedback:

1. **Fuzzy line tolerance**: ±3 lines good? Or too aggressive?
2. **Auto-create baseline**: On first use, or require explicit creation?
3. **Baseline storage**: Commit to git, or keep local only?
4. **Update frequency**: Manual, auto on main, or scheduled PR?

### Success Criteria:

- ✅ Users can create/list/delete baselines
- ✅ `--baseline` flag reduces noise from known issues
- ✅ CI pipelines fail only on new regressions
- ✅ Fuzzy matching handles typical code changes
- ✅ Performance overhead <200ms for 1000 issues
- ✅ Schema validation prevents corrupted baselines

---

## 9️⃣ APPENDIX: Alternative Approaches Considered

### Alternative 1: Database-Backed Baselines

**Idea**: Store baselines in SQLite/PostgreSQL instead of JSON files.

**Pros**:
- ✅ Fast querying (indexed lookups)
- ✅ Multi-baseline comparison
- ✅ Historical trend analysis

**Cons**:
- ❌ Requires database setup (non-portable)
- ❌ Not git-friendly (can't track in VCS)
- ❌ Overkill for CLI use case

**Decision**: ❌ Rejected (JSON files sufficient for Phase 5)

### Alternative 2: Git-Based Baselines

**Idea**: Store baselines in git commits, not files.

**Pros**:
- ✅ Automatic versioning (git history)
- ✅ No file clutter

**Cons**:
- ❌ Requires git (not universal)
- ❌ Harder to inspect/edit
- ❌ Breaks `git bisect` workflows

**Decision**: ❌ Rejected (JSON files more flexible)

### Alternative 3: SARIF-Based Baselines

**Idea**: Use SARIF format for baselines (instead of custom JSON).

**Pros**:
- ✅ Standard format (GitHub, SARIF viewers)
- ✅ Interoperable with other tools

**Cons**:
- ❌ SARIF spec complex (overkill for baseline)
- ❌ Doesn't include all metadata we need
- ❌ Harder to extend with custom fields

**Decision**: ❌ Rejected (custom JSON simpler)

---

## 🏁 CONCLUSION

This design proposes a **pragmatic, CI-friendly baseline system** with:

- ✅ **JSON-based storage** (.odavl/baselines/)
- ✅ **Multi-tier fingerprinting** (content > location > message)
- ✅ **Fuzzy matching** (±3 lines for code shifts)
- ✅ **Git rename detection** (preserves history across file moves)
- ✅ **CI-first exit codes** (fail on new issues only)
- ✅ **Reuses existing HistoricalComparisonEngine** (no core changes)

**Trade-offs Accepted**:
- ⚠️ Fingerprinting not perfect (false negatives on major refactors)
- ⚠️ Fuzzy matching arbitrary (±3 lines chosen pragmatically)
- ⚠️ Git-dependent features (degrade gracefully without git)

**Next Step**: Phase 5 Step 2 - Implement baseline creation and loading commands.

---

**Document Version**: 1.0  
**Last Updated**: December 13, 2025  
**Status**: Design Complete, Ready for Implementation
