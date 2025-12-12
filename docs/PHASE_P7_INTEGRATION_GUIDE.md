# Phase P7 Integration Guide — Guardian File-Type Aware Testing

**Quick Start**: How to use Guardian's new file-type aware test routing

---

## Overview

Guardian now automatically routes tests based on **which files changed**, dramatically reducing test time by skipping irrelevant tests.

**Example**: If only documentation changed, Guardian runs **docs tests only** (30s) instead of all tests (4.5min) — **90% faster**.

---

## Basic Usage

### Option 1: Provide Changed Files (Recommended)

```typescript
import { TestOrchestrator } from '@odavl-studio/guardian-core';

const orchestrator = new TestOrchestrator();

// Provide changed files for intelligent routing
const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles: [
    'src/index.ts',
    'migrations/001_add_users.sql',
    'README.md',
  ],
});

// Guardian automatically:
// 1. Classifies files by type (sourceCode, migrations, documentation)
// 2. Maps to test suites (unit, migration, docs)
// 3. Prioritizes by risk (migration first, docs last)
// 4. Skips irrelevant tests (deployment, ui, securityScan)
// 5. Runs only relevant tests (migration → unit → docs)
```

### Option 2: Fallback to Manifest (No Changed Files)

```typescript
// Without changedFiles, Guardian uses Phase P3 manifest behavior
const report = await orchestrator.runTests({
  url: 'https://example.com',
  // changedFiles not provided → falls back to manifest
});

// Guardian behavior:
// - Uses getActiveSuites() from manifest
// - Runs all active test suites (no skipping)
// - No file-type aware prioritization
```

---

## Integration with Git

### Automatic Changed Files Detection (Future)

```typescript
// TODO: Phase P8 enhancement
import { getChangedFilesFromGit } from '@odavl-studio/guardian-core/git';

const changedFiles = await getChangedFilesFromGit({
  baseBranch: 'main',
  targetBranch: 'feature/my-feature',
});

const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles,
});
```

### Manual Git Integration (Current)

```typescript
import { execSync } from 'child_process';

// Get changed files from git diff
const gitDiff = execSync('git diff --name-only HEAD~1 HEAD', { 
  encoding: 'utf8' 
});
const changedFiles = gitDiff.split('\n').filter(Boolean);

const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles,
});
```

---

## File-Type to Test Suite Mapping

Guardian maps **12 file types** to specific test suites:

| File Type | Test Suites | Priority | Example Files |
|-----------|-------------|----------|---------------|
| sourceCode | unit, lint, integration | 50 (medium) | `src/index.ts`, `lib/utils.js` |
| migrations | migration, integration, smoke | 100 (critical) | `migrations/001.sql` |
| infrastructure | deployment, smoke | 75 (high) | `terraform/main.tf`, `Dockerfile` |
| env | securityScan | 100 (critical) | `.env`, `.env.local` |
| secretCandidates | securityScan | 100 (critical) | `secrets.json` |
| documentation | docs | 25 (low) | `README.md`, `docs/*.md` |
| assets | ui | 25 (low) | `images/*.png`, `styles/*.css` |
| buildArtifacts | *(never tested)* | - | `dist/`, `out/` |
| logs | *(never tested)* | - | `*.log` |
| diagnostics | *(never tested)* | - | `.odavl/diagnostics/` |
| reports | *(never tested)* | - | `.odavl/reports/` |
| tests | meta, unit | 50 (medium) | `*.test.ts`, `*.spec.ts` |
| config | smoke, integration | 50 (medium) | `package.json`, `tsconfig.json` |

---

## Risk-Based Prioritization

Tests are prioritized by file-type risk level:

```
Priority Order (highest to lowest):
1. critical (100) — migrations, env, secrets
2. high (75)      — infrastructure, schema
3. medium (50)    — sourceCode, tests, config
4. low (25)       — documentation, assets
```

**Example**:
```typescript
// Changed files:
const changedFiles = [
  'src/index.ts',        // sourceCode (medium, 50)
  'migrations/001.sql',   // migrations (critical, 100)
  'README.md',            // documentation (low, 25)
];

// Guardian runs tests in this order:
// 1. migration tests (priority 100)
// 2. unit tests (priority 50)
// 3. docs tests (priority 25)
```

---

## Automatic Test Skipping

Guardian automatically skips tests when irrelevant files changed:

| Test Suite | Runs When | Skips When |
|------------|-----------|------------|
| deployment | Infrastructure changed | No infrastructure changed |
| migration | Schema/migrations changed | No schema/migrations changed |
| ui | Assets changed | No assets changed |
| securityScan | Env/secrets changed | No env/secrets changed |
| docs | Documentation changed | No documentation changed |
| unit | Source code changed | Only docs/assets changed |

**Example**:
```typescript
// Only documentation changed
const changedFiles = ['README.md', 'docs/guide.md'];

// Guardian behavior:
// ✓ Run: docs tests
// ⏭️  Skip: deployment, migration, unit, integration, ui, securityScan
// Result: 30 seconds instead of 4.5 minutes (90% faster)
```

---

## Baseline Enforcement Modes

Guardian enforces baselines with **3 modes** based on file type:

### 1. Strict Mode (infrastructure, migrations, schema)

**Behavior**: ANY regression = FAIL

```typescript
// Example: Infrastructure changed, performance regressed
const changedFiles = ['terraform/main.tf'];
const testResults = { performance: { score: 75 } };

// Baseline: performance.score = 85
// Result: FAIL (strict mode does not allow regression)
```

### 2. Adaptive Mode (sourceCode, tests, config)

**Behavior**: <10% regression = PASS

```typescript
// Example: Source code changed, 7% performance regression
const changedFiles = ['src/index.ts'];
const testResults = { performance: { score: 78 } };

// Baseline: performance.score = 85
// Regression: 7% (within 10% threshold)
// Result: PASS (adaptive mode allows small regression)
```

### 3. Learning Mode (documentation, assets)

**Behavior**: ANY regression = PASS (update baseline)

```typescript
// Example: Documentation changed, docs coverage dropped
const changedFiles = ['README.md'];
const testResults = { docs: { coverage: 60 } };

// Baseline: docs.coverage = 80
// Regression: 20%
// Result: PASS (learning mode updates baseline to 60)
```

---

## Audit Logging

All decisions are logged to console (color-coded) and exported as JSON:

### Console Output

```bash
[Guardian] 🧠 Analyzing 3 changed files for intelligent test routing
[Guardian] 📊 File-type breakdown: { sourceCode: 1, migrations: 1, documentation: 1 }
[Guardian] 🎯 Routed 3 test suites based on file types
[Guardian] 🔺 Priority order: migration (100) → unit (50) → docs (25)
[Guardian] ⏭️  Skipped suite "deployment" (No infrastructure files changed)
[Guardian] 🎯 Running 3 test suites: migration, unit, docs
[Guardian] ✅ File-type aware baseline validation passed (mode: adaptive)
[Guardian] 📄 Audit log exported: .odavl/audit/guardian-run-abc123.json
```

### JSON Export

**Location**: `.odavl/audit/guardian-run-<runId>.json`

```json
{
  "timestamp": "2025-12-06T14:30:00.000Z",
  "runId": "abc123",
  "entries": [
    {
      "timestamp": "2025-12-06T14:30:00.123Z",
      "type": "routedSuites",
      "details": {
        "suites": [
          { "suite": "migration", "priority": 100, "reason": "Critical migration files" }
        ]
      }
    },
    {
      "timestamp": "2025-12-06T14:30:00.456Z",
      "type": "skippedSuite",
      "details": { "suite": "deployment", "reason": "No infrastructure files changed" }
    }
  ],
  "stats": {
    "totalEntries": 2,
    "routedSuites": 1,
    "skippedSuites": 1
  }
}
```

---

## Common Scenarios

### Scenario 1: Documentation-Only PR

```typescript
const changedFiles = ['README.md', 'docs/api-reference.md'];

const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles,
});

// Guardian behavior:
// - Classify: documentation (low risk, 25 priority)
// - Recommend: ['docs']
// - Skip: deployment, migration, unit, integration, ui, securityScan
// - Run: docs tests ONLY
// - Time: 30 seconds (instead of 4.5 minutes)
// - Baseline: learning mode (auto-update)
```

### Scenario 2: Critical Migration PR

```typescript
const changedFiles = ['migrations/002_add_payments.sql'];

const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles,
});

// Guardian behavior:
// - Classify: migrations (critical risk, 100 priority)
// - Recommend: ['migration', 'integration', 'smoke']
// - Prioritize: migration first (critical)
// - Skip: deployment (no infra), ui (no assets), docs (no docs)
// - Run: migration → integration → smoke
// - Time: 2 minutes (instead of 4.5 minutes)
// - Baseline: strict mode (ANY regression = FAIL)
```

### Scenario 3: Mixed Source Code + Infrastructure

```typescript
const changedFiles = [
  'src/api/payments.ts',
  'terraform/azure-deploy.bicep',
];

const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles,
});

// Guardian behavior:
// - Classify: sourceCode (medium, 50), infrastructure (high, 75)
// - Recommend: ['deployment', 'smoke', 'unit', 'lint', 'integration']
// - Prioritize: deployment (75) → unit/lint/integration (50)
// - Skip: migration (no schema), docs (no docs), ui (no assets)
// - Run: deployment → unit → lint → integration
// - Time: 3 minutes (instead of 4.5 minutes)
// - Baseline: strict for infrastructure, adaptive for sourceCode
```

---

## Manifest Compatibility (Phase P3)

Guardian Phase P7 is **fully compatible** with Phase P3 manifest integration:

```yaml
# odavl.manifest.json
guardian:
  testSuites:
    - name: "unit"
      enabled: true
    - name: "migration"
      enabled: true
    - name: "deployment"
      enabled: false  # ← Manifest disables deployment
```

**Behavior**:
- File-type recommendations are **intersected** with manifest active suites
- If manifest disables a suite, file-type routing **will not enable it**
- Example: Even if infrastructure changed, deployment tests won't run if manifest disables them

---

## Configuration

### Baseline Policy (Optional)

Configure baseline enforcement modes in manifest:

```yaml
# odavl.manifest.json
guardian:
  baselinePolicy:
    baselines:
      performance: { score: 85 }
      migrationTests: { passed: 10, total: 10 }
    modes:
      infrastructure: "strict"
      sourceCode: "adaptive"
      documentation: "learning"
    thresholds:
      adaptive: 10  # 10% regression threshold
```

**Defaults** (if not configured):
- All modes default to `adaptive`
- Adaptive threshold defaults to `10%`

---

## Performance Tips

### 1. Provide Changed Files When Possible

```typescript
// Good: 60% faster on average
const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles: ['src/index.ts'],
});

// Bad: Runs all tests
const report = await orchestrator.runTests({
  url: 'https://example.com',
  // No changedFiles → no skipping
});
```

### 2. Use Git Integration in CI/CD

```yaml
# .github/workflows/ci.yml
- name: Run Guardian Tests
  run: |
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | tr '\n' ',')
    node scripts/run-guardian.js --changedFiles="$CHANGED_FILES"
```

### 3. Optimize Test Suite Order

Prioritize critical tests first for early failure detection:
- Migration tests run first (critical priority)
- Documentation tests run last (low priority)

---

## Troubleshooting

### Issue: Tests not being skipped

**Cause**: Changed files not provided or empty

**Solution**:
```typescript
// Ensure changedFiles is provided and non-empty
console.log('Changed files:', changedFiles);
const report = await orchestrator.runTests({
  url: 'https://example.com',
  changedFiles: changedFiles.length > 0 ? changedFiles : undefined,
});
```

### Issue: Unexpected test suite running

**Cause**: Manifest active suites override file-type recommendations

**Solution**: Check manifest configuration
```typescript
import { getActiveSuites } from './config/manifest-config';
console.log('Active suites from manifest:', getActiveSuites());
```

### Issue: Baseline validation always failing

**Cause**: Baseline policy set to strict mode for all file types

**Solution**: Use adaptive mode for non-critical file types
```yaml
guardian:
  baselinePolicy:
    modes:
      infrastructure: "strict"    # Critical files
      sourceCode: "adaptive"      # Allow 10% regression
      documentation: "learning"   # Auto-update baseline
```

---

## API Reference

### Core Functions

```typescript
import {
  classifyTestSuitesByFileTypes,
  getRecommendedTestSuites,
  prioritizeTestSuites,
  shouldSkipTestSuite,
  validateAgainstBaseline,
  getGuardianFileTypeAuditor,
} from '@odavl-studio/guardian-core/filetype';

// 1. Classify changed files by type
const stats = classifyTestSuitesByFileTypes(['src/index.ts', 'README.md']);
// → { byType: { sourceCode: 1, documentation: 1 }, byRisk: { medium: 1, low: 1 }, totalFiles: 2 }

// 2. Get recommended test suites
const recommendations = getRecommendedTestSuites(stats);
// → [{ suite: 'unit', priority: 50, reason: '...' }, { suite: 'docs', priority: 25, reason: '...' }]

// 3. Prioritize test suites by risk
const prioritized = prioritizeTestSuites(recommendations);
// → Sorted by priority (highest first)

// 4. Check if test suite should be skipped
const skipDecision = shouldSkipTestSuite('deployment', stats);
// → { shouldSkip: true, reason: 'No infrastructure files changed' }

// 5. Validate against baseline with file-type awareness
const result = validateAgainstBaseline(testResults, ['sourceCode'], baselinePolicy);
// → { passed: true, violations: [], mode: 'adaptive' }

// 6. Get auditor singleton
const auditor = getGuardianFileTypeAuditor();
auditor.logRoutedSuites(recommendations);
auditor.export(); // → JSON audit log path
```

---

## Next Steps

1. **Update CI/CD workflows** to provide `changedFiles` parameter
2. **Configure baseline policy** in manifest for optimal enforcement
3. **Monitor audit logs** to validate test routing decisions
4. **Track performance gains** (compare test times before/after)

**Coming in Phase P8**:
- Brain integration for deployment confidence adjustment
- Automatic git diff integration
- ML-based test prioritization
- Real-time test result streaming

---

**Phase P7 Status**: ✅ Complete and ready for production use

