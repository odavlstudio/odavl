# 🧠 ODAVL Insight — Quick Start & Usage Guide (v1.0-GA)

**Production-Ready Self-Learning Code Quality & Auto-Fix System**

---

## Overview

**ODAVL Insight** is an autonomous code quality intelligence system that continuously monitors your codebase, learns from errors, and automatically suggests or applies fixes. It operates as part of the ODAVL ecosystem, integrating deeply with the Guardian verification layer and the ODAVL cycle (Observe-Decide-Act-Verify-Learn).

Unlike traditional linters or static analysis tools, ODAVL Insight **learns from your specific codebase**. It builds a machine learning model that recognizes error patterns, identifies root causes, and generates contextual fix recommendations. Over time, it becomes more accurate at predicting issues and suggesting solutions tailored to your project's coding patterns.

The system runs in the background, capturing runtime errors, TypeScript issues, and code quality problems. It stores this intelligence in a searchable memory, generates fix suggestions with confidence scores, and can automatically apply safe fixes with full audit trails. Every action is verified by the Guardian attestation system, ensuring production safety and compliance.

---

## Installation

ODAVL Insight is built into the ODAVL monorepo. If you're starting a new ODAVL project:

```bash
# Clone or initialize ODAVL project
git clone <your-odavl-repo>
cd odavl

# Install dependencies
pnpm install

# Initialize Insight directories (auto-created on first run)
# Creates: .odavl/insight/{memory,learning,fixes,tests}
```

**Directory Structure After Setup:**

```
.odavl/insight/
├── memory/
│   ├── insight-memory.json      # Error pattern database
│   └── memory-report.md          # Human-readable summary
├── learning/
│   └── model.json                # ML weights and predictions
├── fixes/
│   ├── suggestions.json          # Proposed fixes with confidence
│   └── ledger.json               # Applied fix audit trail (SHA-256)
└── tests/
    ├── fixtures/                 # Test cases for auto-fix validation
    ├── *.log                     # Test execution logs
    └── *.ts                      # Test harness scripts
```

---

## Running Insight

ODAVL Insight operates through several CLI commands, each corresponding to a phase in the autonomous cycle.

### 🔍 Start Live Error Watcher

Monitor your codebase in real-time for errors and quality issues:

```bash
pnpm insight:watch
```

**What it does:**

- Watches file changes across the workspace
- Captures errors from TypeScript, ESLint, test failures, runtime crashes
- Stores observations in `.odavl/insight/memory/insight-memory.json`
- Triggers Live Notifier updates in VS Code panel
- Average latency: **~13ms** (detection → notification)

**When to use:** Keep this running during development for continuous monitoring.

---

### 📊 Analyze Captured Errors

Process raw error data to extract patterns and categorize issues:

```bash
pnpm insight:analyze
```

**What it does:**

- Loads all captured errors from memory
- Groups by error type, file, and root cause
- Calculates frequency and severity scores
- Updates `memory-report.md` with statistics
- Identifies recurring patterns for ML training

**Output example:**

```
Analyzed 47 errors across 12 files
Top patterns:
  - ImportError: 18 occurrences (confidence: 0.92)
  - NullReferenceError: 12 occurrences (confidence: 0.89)
  - TypeError: 8 occurrences (confidence: 0.85)
```

---

### 🔬 Detect Root Causes

Run deep analysis to identify underlying causes of errors:

```bash
pnpm insight:root
```

**What it does:**

- Uses ML model to predict root causes
- Analyzes code context (imports, dependencies, types)
- Generates fix hints with confidence scores
- Prioritizes high-impact issues
- Updates suggestions.json with recommendations

**Output example:**

```
Root cause analysis complete:
  ✓ Missing import detected in components/Button.tsx
    → Suggestion: Add 'import { Button } from "@/components/ui/button"'
    → Confidence: 93%
  
  ✓ Null reference in utils/formatter.ts
    → Suggestion: Add null check '(data || []).map(...)'
    → Confidence: 89%
```

---

### 🛠️ Generate Fix Suggestions

Create actionable fix recommendations (without applying them):

```bash
pnpm insight:fix
```

**What it does:**

- Generates fix suggestions based on root cause analysis
- Assigns confidence scores (0.0 - 1.0)
- Includes code snippets showing before/after
- Stores in `suggestions.json` for review
- Does NOT modify source files

**When to use:** Review suggestions before applying with `insight:autofix`.

---

### ⚡ Apply Fixes Automatically

Apply high-confidence fixes automatically with full audit trail:

```bash
pnpm insight:autofix
```

**What it does:**

- Loads suggestions from `suggestions.json`
- Filters by confidence threshold (default: ≥0.85)
- Applies fixes to source files
- Generates SHA-256 signatures for each change
- Records in `ledger.json` with timestamps
- Auto-rotates ledger to last 50 entries
- Runs verification checks post-application

**Safety features:**

- Only applies fixes with confidence ≥85%
- Creates ledger entry with SHA-256 hash
- Skips fixes that fail pre-flight validation
- Reports success/failure for each fix

**Example ledger entry:**

```json
{
  "timestamp": "2025-11-05T10:23:45.123Z",
  "file": "components/Button.tsx",
  "fixType": "add-import",
  "confidence": 0.93,
  "signature": "a3f2e1d890bc23c4",
  "status": "applied"
}
```

---

### 🧠 Train ML Model

Update the learning model with new error patterns:

```bash
pnpm insight:learn
```

**What it does:**

- Loads error patterns from memory
- Normalizes weights across all error types
- Updates `learning/model.json` with new predictions
- Calculates average confidence per pattern
- Improves accuracy for future predictions

**Model statistics (v1.0-GA):**

- **12 error types** trained
- Weights: 0.275 - 1.0 (normalized)
- Average weight: **0.605**
- Highest: ImportError (1.0)
- Training corpus: 50+ synthetic + real-world errors

---

### 🛡️ Verify with Guardian

Sync Insight state with Guardian attestation system:

```bash
pnpm insight:verify
```

**What it does:**

- Generates attestation document with current system state
- Calculates risk score (0 = safe, 10 = critical)
- Validates ledger integrity (SHA-256 checksums)
- Checks model health and memory consistency
- Creates `attestation.json` with STABLE/WARNING/CRITICAL status

**Attestation states:**

- **STABLE**: All checks passed, production ready (RiskScore: 0)
- **WARNING**: Minor issues detected, review recommended (RiskScore: 1-5)
- **CRITICAL**: Failures detected, immediate action required (RiskScore: 6-10)

---

## How It Works (Under the Hood)

ODAVL Insight follows the **Observe-Decide-Act-Verify-Learn** cycle:

```
┌──────────────────────────────────────────────────────────────┐
│                    ODAVL Insight Cycle                       │
└──────────────────────────────────────────────────────────────┘

    1. OBSERVE                    2. DECIDE
    ┌─────────┐                   ┌─────────┐
    │ Watcher │ ─── errors ────► │ Analyze │
    │  (13ms) │                   │ Root    │
    └─────────┘                   │ Cause   │
         │                        └─────────┘
         │                             │
         ▼                             ▼
    3. ACT                         4. VERIFY
    ┌─────────┐                   ┌─────────┐
    │ Auto    │ ◄─── fixes ────── │ Guardian│
    │ Fix     │                   │ Attest  │
    └─────────┘                   └─────────┘
         │                             │
         └────────► 5. LEARN ◄─────────┘
                    ┌─────────┐
                    │ Retrain │
                    │ Model   │
                    └─────────┘
```

### Key Components

**1. Live Watcher (`insight:watch`)**

- File system monitoring via VS Code API
- TypeScript/ESLint/Runtime error capture
- Sub-30ms latency from detection to notification
- Updates VS Code panel in real-time

**2. Memory System (`.odavl/insight/memory/`)**

- **insight-memory.json**: Structured error database
  - Error types, timestamps, confidence scores
  - Root cause patterns
  - Occurrence frequency
- **memory-report.md**: Human-readable statistics

**3. Learning Model (`.odavl/insight/learning/model.json`)**

- Normalized ML weights per error type
- Prediction confidence scores
- Trained on synthetic + real-world corpus
- Continuous improvement via `insight:learn`

**4. Fix System (`.odavl/insight/fixes/`)**

- **suggestions.json**: Proposed fixes with metadata
  - File path, line range, fixType, confidence
  - Before/after code snippets
- **ledger.json**: Audit trail of applied fixes
  - SHA-256 signatures for integrity
  - Timestamps, status (applied/failed/skipped)
  - Auto-rotates to last 50 entries

**5. Guardian Bridge**

- Generates cryptographic attestations
- Validates system integrity
- Calculates risk scores
- Produces `attestation.json` with STABLE/WARNING/CRITICAL status

---

## Example Workflow

Here's a typical development session with ODAVL Insight:

```bash
# 1. Start live monitoring
pnpm insight:watch
# Terminal: "Live Notifier started. Monitoring workspace..."

# 2. Write code, make changes (errors detected automatically)
# VS Code panel updates in ~13ms

# 3. Analyze captured errors
pnpm insight:analyze
# Output: "Analyzed 23 errors across 8 files"

# 4. Detect root causes
pnpm insight:root
# Output: "3 high-confidence suggestions generated"

# 5. Review suggestions (optional)
cat .odavl/insight/fixes/suggestions.json

# 6. Apply safe fixes automatically
pnpm insight:autofix
# Output: "Applied 2/3 fixes (avg confidence: 91%)"
# Ledger updated with SHA-256 signatures

# 7. Train model with new patterns
pnpm insight:learn
# Output: "Model retrained: 12 error types, avg weight 0.605"

# 8. Verify system integrity
pnpm insight:verify
# Output: "Attestation: STABLE, RiskScore: 0"
```

---

## How to View Results

### 📁 File System Locations

**Error Memory & Analysis:**

```bash
# View captured errors
cat .odavl/insight/memory/insight-memory.json

# Read human-friendly summary
cat .odavl/insight/memory/memory-report.md
```

**Fix Suggestions & Ledger:**

```bash
# Review proposed fixes
cat .odavl/insight/fixes/suggestions.json

# Audit applied fixes (with SHA-256 signatures)
cat .odavl/insight/fixes/ledger.json
```

**ML Model:**

```bash
# View trained model weights
cat .odavl/insight/learning/model.json
```

**Guardian Attestation:**

```bash
# Check system verification status
cat .odavl/guardian/verify/hardening-attestation.json
```

**Reports:**

```bash
# Auto-fix execution summary
cat reports/auto-fix-report.md

# Full hardening validation report (v1.0-GA)
cat reports/insight-final-hardening.md
```

---

### 🖥️ VS Code Integration

**Open Insight Panel:**

Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac), then:

```
> ODAVL: Open Insight Panel
```

**Panel Features:**

- **Live Health Card**: Real-time error count, model accuracy, fix success rate
- **Error Timeline**: Chronological error stream with timestamps
- **Fix Suggestions**: Interactive list of proposed fixes with confidence badges
- **Model Stats**: Training progress, weight distribution, pattern coverage
- **Guardian Status**: Attestation state (STABLE/WARNING/CRITICAL)

**Live Updates:**

- Error detection → Panel update: **~13ms average**
- Auto-refresh on file save
- Click errors to jump to source location

---

## Troubleshooting Tips

### 🔄 Restart Watchers

If Live Notifier stops responding:

```bash
# Stop current watcher (Ctrl+C)
# Then restart:
pnpm insight:watch
```

### 🧹 Clean State

To reset Insight to a fresh state:

```bash
# Remove test artifacts (keeps production memory/model)
rm -rf .odavl/insight/tests/*.log
rm -rf .odavl/insight/tests/fixtures/*

# Full reset (WARNING: deletes all learned patterns)
rm -rf .odavl/insight/memory/*
rm -rf .odavl/insight/learning/*
rm -rf .odavl/insight/fixes/*
# Then re-run: pnpm insight:learn
```

### 🛡️ Check System Health

View Guardian attestation status:

```bash
cat .odavl/guardian/verify/hardening-attestation.json | grep status
```

**Expected output:**

```json
"status": "STABLE",
"riskScore": 0
```

**If WARNING or CRITICAL:**

1. Check `.odavl/insight/fixes/ledger.json` for failed fixes
2. Review `reports/auto-fix-report.md` for errors
3. Re-run `pnpm insight:verify` after fixes
4. Consult `reports/insight-final-hardening.md` for validation details

### 📊 Verify Ledger Integrity

Check for ledger corruption:

```bash
# View last 10 ledger entries
cat .odavl/insight/fixes/ledger.json | tail -20

# Verify SHA-256 signatures exist
grep -c "signature" .odavl/insight/fixes/ledger.json
# Should match number of applied fixes
```

### 🧠 Retrain Model

If predictions seem inaccurate:

```bash
# 1. Capture more errors (run tests, make changes)
pnpm test
# Errors auto-captured by watcher

# 2. Analyze new patterns
pnpm insight:analyze

# 3. Retrain with expanded corpus
pnpm insight:learn

# 4. Verify improvement
cat .odavl/insight/learning/model.json | grep avgWeight
# Should show increased weights for common patterns
```

### 🚨 Auto-Fix Not Applying

**Symptoms:** `pnpm insight:autofix` reports "0 fixes applied"

**Troubleshooting:**

1. **Check confidence threshold:**

   ```bash
   cat .odavl/insight/fixes/suggestions.json | grep confidence
   # All values should be ≥0.85
   ```

2. **Verify file paths:**

   ```bash
   cat .odavl/insight/fixes/suggestions.json | grep filePath
   # Paths must be absolute and exist
   ```

3. **Review project type detection:**

   ```bash
   # Add debug output (already included in AutoFixEngine.ts)
   pnpm insight:autofix
   # Check console for "Project type: unknown"
   # If unknown, files won't be processed
   ```

4. **Manual verification:**

   ```bash
   # Apply one fix manually to test
   # Then check ledger:
   cat .odavl/insight/fixes/ledger.json
   # Should show new entry with "status": "applied"
   ```

---

## Production Deployment Checklist

Before deploying Insight in production:

- [ ] **Run full validation:**

  ```bash
  pnpm insight:analyze
  pnpm insight:root
  pnpm insight:fix
  pnpm insight:autofix
  pnpm insight:learn
  pnpm insight:verify
  ```

- [ ] **Verify Guardian attestation:**

  ```bash
  # Must show STABLE status
  cat .odavl/guardian/verify/hardening-attestation.json
  ```

- [ ] **Check model training:**

  ```bash
  # Should have ≥10 error types
  cat .odavl/insight/learning/model.json | grep -c "errorType"
  ```

- [ ] **Validate ledger integrity:**

  ```bash
  # All entries must have SHA-256 signatures
  grep -c "signature" .odavl/insight/fixes/ledger.json
  ```

- [ ] **Test crash recovery:**

  ```bash
  cd .odavl/insight/tests
  pnpm exec tsx test-crash-recovery.ts
  # Should show: "5/5 tests PASSED"
  ```

- [ ] **Measure latency:**

  ```bash
  cd .odavl/insight/tests
  pnpm exec tsx measure-latency.ts
  # Should show: "<30ms average"
  ```

- [ ] **Review final report:**

  ```bash
  cat reports/insight-final-hardening.md
  # Should show: "Health Score: 10/10"
  ```

---

## Advanced Usage

### Custom Confidence Thresholds

Override default auto-fix confidence threshold:

```typescript
// packages/insight-core/src/cli/autofix.ts
const engine = new AutoFixEngine(workspaceRoot);
await engine.run(workspaceRoot, {
  minConfidence: 0.90  // Only apply fixes ≥90% confidence
});
```

### Manual Fix Application

Apply specific fix from suggestions:

```typescript
import { FixApplier } from "@odavl/insight-core";

const applier = new FixApplier();
const result = await applier.apply(
  "/absolute/path/to/file.ts",
  {
    type: "add-import",
    data: { import: "Button", from: "@/components/ui/button" },
    lineRange: [1, 1]
  }
);

console.log(result.success); // true/false
```

### Programmatic Memory Access

Query error memory:

```typescript
import { readFileSync } from "fs";
import { join } from "path";

const memoryPath = join(process.cwd(), ".odavl/insight/memory/insight-memory.json");
const memory = JSON.parse(readFileSync(memoryPath, "utf8"));

// Find all ImportErrors
const importErrors = memory.patterns.filter(
  (p: any) => p.errorType === "ImportError"
);

console.log(`Found ${importErrors.length} import errors`);
```

---

## Version History

**v1.0-GA (Current)**

- ✅ Auto-fix ledger with SHA-256 signatures
- ✅ Crash recovery resilience (5-phase validated)
- ✅ ML model trained on 12 error types
- ✅ Sub-30ms latency (<13ms average)
- ✅ Guardian attestation (STABLE)
- ✅ Production-ready with 10/10 health score

**v1.0-rc1**

- Initial release candidate
- 8.5/10 health score
- 2 error types, limited testing

---

## Getting Help

**Documentation:**

- Architecture: `docs/ARCHITECTURE.md`
- Developer Guide: `DEVELOPER_GUIDE.md`
- Full Validation Report: `reports/insight-final-hardening.md`

**Commands Reference:**

```bash
pnpm insight:watch     # Live error monitoring
pnpm insight:analyze   # Error pattern analysis
pnpm insight:root      # Root cause detection
pnpm insight:fix       # Generate suggestions
pnpm insight:autofix   # Apply safe fixes
pnpm insight:learn     # Train ML model
pnpm insight:verify    # Guardian attestation
```

**Common Issues:**

- Watcher not responding → Restart with `pnpm insight:watch`
- Auto-fix skipping files → Check confidence scores in `suggestions.json`
- Model inaccurate → Retrain with `pnpm insight:learn`
- Attestation WARNING → Review `ledger.json` for failures

---

## License

Part of ODAVL — See `LICENSE` for full terms.

---

**🎉 You're ready to use ODAVL Insight v1.0-GA!**

Start with `pnpm insight:watch` and let the system learn from your codebase. Over time, it will become your most valuable code quality assistant.
