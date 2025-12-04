# ODAVL Governance Directory

This directory contains all governance, audit, and ML infrastructure for ODAVL Studio's autonomous code improvement system.

## 📁 Directory Structure

### Core Configuration Files

#### `gates.yml` - Risk Budget & Governance Rules
Defines risk budget constraints and protected paths for automated changes.

```yaml
risk_budget: 100              # Maximum risk points per cycle
forbidden_paths:              # Paths that must not be modified
  - security/**
  - auth/**
  - "**/*.spec.*"
  - public-api/**
actions:
  max_auto_changes: 10        # Max changes per cycle
  max_files_per_cycle: 10     # Max files to modify
```

**Validation:** JSON Schema at `schemas/gates.schema.json`

---

#### `history.json` - Run History
Append-only record of all ODAVL runs with trust scoring.

```json
{
  "version": "1.0.0",
  "runs": [
    {
      "runId": "unique-id",
      "timestamp": "2024-11-15T14:30:00Z",
      "recipe": "fix-typescript-errors",
      "result": "success",
      "trustScoreBefore": 0.75,
      "trustScoreAfter": 0.80
    }
  ]
}
```

**Validation:** JSON Schema at `schemas/history.schema.json`  
**Rotation:** Automatically rotated when exceeds 1000 runs

---

#### `recipes-trust.json` - ML Trust Scoring
Trust scores for all improvement recipes with success/failure tracking.

```json
{
  "version": "1.0.0",
  "recipes": {
    "fix-typescript-errors": {
      "trust": 0.85,
      "runs": 20,
      "successes": 17,
      "failures": 3,
      "consecutiveFailures": 0,
      "blacklisted": false,
      "lastRun": "2024-11-15T14:30:00Z"
    }
  }
}
```

**ML Feedback Loop:**
- Trust score = `successes / (successes + failures)`
- Clamped between 0.1 and 1.0
- Blacklisted after 3 consecutive failures

**Validation:** JSON Schema at `schemas/recipes-trust.schema.json`

---

#### `trust-history.json` - Historical Trust Evolution
Long-term tracking of trust score changes over time.

---

### Audit & Attestation

#### `audit/autoapproval.jsonl`
Append-only audit log in JSONL format (one JSON object per line).

```jsonl
{"timestamp":"2024-11-15T14:30:00Z","decision":"approved","reason":"trust_score_high","runId":"abc123"}
{"timestamp":"2024-11-15T14:35:00Z","decision":"rejected","reason":"risk_exceeded","runId":"def456"}
```

**Format:** JSONL (JSON Lines) - industry standard for append-only logs  
**Integrity:** HMAC-SHA256 verification (see `packages/core/src/crypto/audit-log.ts`)

---

#### `attestation/`
Cryptographic proofs of successful improvements using SHA-256 hashes.

**Multi-layer attestation:**
- **Core:** Basic cryptographic proof
- **Mesh:** Distributed verification
- **Consensus:** Multi-node agreement
- **Guardian:** Pre-deploy validation

**Example attestation:**
```json
{
  "attestationType": "core",
  "commitHash": "abc123...",
  "timestamp": "2024-11-15T14:30:00Z",
  "proof": "sha256:def456...",
  "verifiedBy": "odavl-autopilot-v2.0.0"
}
```

---

### Machine Learning Infrastructure

#### `datasets/`
Training data for ML-powered recipe prediction.

- `mock-training-data.json` - Mock data for development
- `typescript-fixes.json` - Real-world TypeScript fix patterns

**Format:**
```json
{
  "version": "1.0.0",
  "description": "Training data for recipe prediction",
  "samples": [
    {
      "features": {
        "errorType": "TS2304",
        "fileSize": 1024,
        "complexity": 5
      },
      "label": {
        "recipeId": "fix-typescript-errors",
        "expectedSuccess": 0.85
      }
    }
  ]
}
```

---

#### `ml-models/`
Versioned TensorFlow.js models for recipe prediction.

**Structure:**
```
ml-models/
├── recipe-predictor/
│   ├── v1.0.0/
│   │   ├── model.json
│   │   ├── weights.bin
│   │   └── metadata.json
│   └── v2.0.0/
│       └── ...
└── trust-scorer/
    └── v1.0.0/
```

**Metadata example:**
```json
{
  "name": "recipe-predictor",
  "version": "2.0.0",
  "savedAt": "2024-11-15T14:30:00Z",
  "accuracy": 0.95,
  "trainingDataVersion": "2.0.0"
}
```

---

#### `data-collection/`
Prediction logs for continuous learning.

- `predictions-2025-11-21.jsonl` - Daily prediction logs in JSONL format

**Format:**
```jsonl
{"timestamp":"2024-11-15T14:30:00Z","recipeId":"fix-ts","predicted":0.85,"actual":0.90}
```

---

### Operational Data

#### `metrics/`
Performance metrics and run statistics.

**Structure (after archiving):**
```
metrics/
├── active/                   # Last 30 days
│   ├── 2024-11-15T14-30-45-typescript-fix.json
│   └── 2024-11-16T10-15-20-eslint-fix.json
├── archived/                 # >30 days (compressed)
│   ├── metrics-2024-10.tar.gz
│   └── metrics-2024-09.tar.gz
└── summary.json              # Aggregated statistics
```

**Retention:** 30 days active, older files archived monthly  
**Archiving:** Run `pnpm archive:metrics` or GitHub Actions monthly cron

**Metrics file format:**
```json
{
  "runId": "1763261061595",
  "timestamp": "2024-11-15T14:30:00Z",
  "duration": 1234,
  "result": "success",
  "filesModified": 3,
  "linesChanged": 45,
  "recipe": "fix-typescript-errors"
}
```

---

#### `ledger/`
Run ledgers with detailed edit summaries.

**Format:**
```json
{
  "runId": "abc123",
  "startedAt": "2024-11-15T14:30:00Z",
  "completedAt": "2024-11-15T14:31:15Z",
  "edits": [
    {
      "path": "src/utils/helper.ts",
      "diffLoc": 12,
      "operation": "fix-type-error"
    }
  ],
  "notes": "Automated improvement via ODAVL Autopilot"
}
```

**Monitoring:** VS Code extension auto-opens ledgers when created

---

#### `logs/`
Phase execution logs for debugging.

- `odavl.log` - Main execution log with all phases (Observe, Decide, Act, Verify, Learn)

**Log rotation:** Daily rotation, 7-day retention

---

#### `undo/`
File snapshots for instant rollback capability.

**Structure:**
```
undo/
├── 2024-11-15T14-30-00.json
├── 2024-11-15T14-35-00.json
├── 2024-11-15T14-40-00.json
└── latest.json              # Symlink to most recent
```

**Snapshot format:**
```json
{
  "timestamp": "2024-11-15T14:30:00Z",
  "files": {
    "src/utils/helper.ts": {
      "originalContent": "...",
      "hash": "sha256:abc123..."
    }
  }
}
```

**Retention:** 30 days, older snapshots deleted automatically  
**Restore:** `odavl autopilot undo` command

---

#### `recipes/`
Improvement recipe definitions with trust scores.

**Recipe format:**
```json
{
  "id": "fix-typescript-errors",
  "version": "2.0.0",
  "schema": "https://odavl.studio/schemas/recipe-v2.json",
  "command": "tsc --noEmit",
  "trust": 0.85,
  "category": "type-safety",
  "estimatedImpact": "high"
}
```

---

#### `reports/`
Analysis reports and diagnostics (gitignored, local-only).

**Note:** This directory is in `.gitignore` - reports are generated locally and not committed.

---

### Schema Validation

#### `schemas/`
JSON schemas for all configuration files.

- `gates.schema.json` - Validates `gates.yml`
- `history.schema.json` - Validates `history.json`
- `recipes-trust.schema.json` - Validates `recipes-trust.json`

**Validation:** Run `pnpm validate:odavl` before commit

---

## 🔒 Security & Integrity

### Triple-Layer Safety System

1. **Risk Budget Guard** - Prevents excessive changes
   - Max 10 files per cycle
   - Protected paths enforcement
   - Risk point calculation

2. **Undo Snapshots** - Instant rollback capability
   - File contents captured before edits
   - 30-day retention
   - One-command restore

3. **Attestation Chain** - Cryptographic verification
   - SHA-256 proof of improvements
   - Multi-layer verification
   - Immutable audit trail

### Audit Log Integrity

All audit logs use **HMAC-SHA256** for integrity verification:

```typescript
import { SecureAuditLog } from '@odavl-studio/core/crypto';

const log = new SecureAuditLog(process.env.AUDIT_SECRET);
const entry = log.append({ decision: 'approved', reason: 'high_trust' });

// Verify integrity
const isValid = log.verify(auditLogContent);
```

---

## 📊 Metrics & Monitoring

### Health Checks

Run hourly via `.github/workflows/monitoring.yml`:

- **Metrics directory size** - Warns if >500 files
- **Audit log integrity** - Verifies HMAC signatures
- **Trust score anomalies** - Detects sudden drops

### Performance Tracking

- **Inference time:** Tracked in `metrics/inference-time-v2.json`
- **Run duration:** Per-run metrics in `metrics/active/`
- **Success rate:** Calculated from `history.json`

### Alerts

Automated alerts via GitHub Issues:
- Metrics directory exceeds 500 files → Archive reminder
- Audit log integrity failure → Critical alert
- 5+ recipes with low trust (<0.3) → Review required

---

## 🧪 Validation & Testing

### Schema Validation

```bash
# Validate all ODAVL configuration files
pnpm validate:odavl

# Manual validation with detailed output
tsx tools/validate-odavl-schemas.ts
```

### Unit Tests

```bash
# Run governance tests
pnpm test tests/unit/governance

# Run with coverage
pnpm test:coverage tests/unit/governance
```

**Test coverage:**
- Risk budget guard logic
- Trust scoring calculations
- Blacklisting rules
- Metrics aggregation
- Archiving logic

---

## 🔧 Maintenance

### Monthly Tasks

1. **Archive old metrics** (automated via GitHub Actions)
   ```bash
   pnpm archive:metrics
   ```

2. **Validate configurations**
   ```bash
   pnpm validate:odavl
   ```

3. **Review trust scores**
   ```bash
   cat .odavl/recipes-trust.json | jq '.recipes | to_entries | map(select(.value.trust < 0.3))'
   ```

### Quarterly Tasks

1. **Audit log review** - Verify integrity and patterns
2. **ML model retraining** - Update with new data
3. **Schema updates** - Add new validation rules if needed

---

## 📚 Related Documentation

- **Autopilot Engine:** `odavl-studio/autopilot/engine/README.md`
- **ML Training Guide:** `docs/ML_PRODUCTION_INTEGRATION.md`
- **Governance Rules:** `docs/DESIGN_PATTERNS.md`
- **CI/CD Integration:** `.github/workflows/monitoring.yml`

---

## 🛠️ Troubleshooting

### Issue: Schema validation fails

```bash
# Check schema errors
tsx tools/validate-odavl-schemas.ts

# Common fixes:
# 1. Ensure gates.yml has required fields
# 2. Check forbidden_paths are strings
# 3. Verify trust scores are 0.1-1.0
```

### Issue: Metrics directory too large

```bash
# Check current size
ls -1 .odavl/metrics | wc -l

# Archive immediately
pnpm archive:metrics
```

### Issue: Audit log corruption

```bash
# Verify integrity
node -e "
const log = require('./packages/core/dist/crypto/audit-log.js');
const fs = require('fs');
const content = fs.readFileSync('.odavl/audit/autoapproval.jsonl', 'utf8');
console.log('Valid:', log.verify(content));
"
```

---

## 🚀 Quick Start

### For New Developers

1. **Understand the structure:**
   ```bash
   # View this README
   cat .odavl/README.md
   
   # List all directories
   ls -la .odavl/
   ```

2. **Validate configuration:**
   ```bash
   pnpm validate:odavl
   ```

3. **Run tests:**
   ```bash
   pnpm test tests/unit/governance
   ```

4. **Check metrics:**
   ```bash
   cat .odavl/metrics/summary.json
   ```

### For CI/CD Integration

1. **Add validation to pre-commit:**
   ```bash
   # In .husky/pre-commit
   pnpm validate:odavl
   ```

2. **Add monthly archiving:**
   ```yaml
   # In .github/workflows/maintenance.yml
   - name: Archive old metrics
     run: pnpm archive:metrics
   ```

3. **Add health checks:**
   ```yaml
   # In .github/workflows/monitoring.yml
   - name: Check ODAVL health
     run: tsx scripts/monitor-odavl-health.ts
   ```

---

## 🎯 Success Metrics

### System Health Indicators

- ✅ **Metrics directory** <500 files (active)
- ✅ **Average trust score** >0.7 across all recipes
- ✅ **Success rate** >85% in last 100 runs
- ✅ **Blacklisted recipes** <5
- ✅ **Audit log integrity** 100%

### Performance Targets

- ⚡ **Inference time** <100ms per recipe prediction
- ⚡ **Validation time** <500ms for all schemas
- ⚡ **Archiving time** <5s for 500 metrics files

---

**Last Updated:** 2024-11-24  
**ODAVL Studio v2.0** - Autonomous Code Quality Platform  
**Documentation Version:** 1.0.0
