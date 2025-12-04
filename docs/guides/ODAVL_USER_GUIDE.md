# ODAVL User Guide — Installation, Usage, and Best Practices

**Version:** 1.0 (Post-Phase 10)  
**Last Updated:** November 6, 2025  
**Audience:** Developers, DevOps Engineers, Engineering Teams

---

## 1️⃣ Overview — What ODAVL Is

**ODAVL (Observe-Decide-Act-Verify-Learn)** is an autonomous code quality and governance platform that combines:

- **Self-Healing:** Automatically detects code issues and applies safe fixes
- **Self-Governing:** Adjusts its own risk budgets based on historical success rates
- **Federated Intelligence:** Synchronizes governance data across multiple projects with cryptographic security

### Main Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **CLI** | Core orchestrator for ODAVL loop execution | `apps/cli/` |
| **Insight Cloud** | Federated mesh, consensus, and Guardian verification | `apps/insight-cloud/` |
| **Guardian Bridge** | Cryptographic attestation signing and verification | `apps/insight-cloud/src/lib/Guardian*.ts` |
| **VS Code Extension** | Live dashboards for governance visualization | `apps/vscode-ext/` |

### Core Philosophy: The ODAVL Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  OBSERVE → DECIDE → ACT → VERIFY → LEARN → [REPEAT]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

1. **OBSERVE:** Collect metrics (ESLint warnings, TypeScript errors, test coverage)
2. **DECIDE:** Generate action plan based on governance rules and trust score
3. **ACT:** Execute plan safely with snapshot creation and safety gates
4. **VERIFY:** Validate post-action metrics against success criteria
5. **LEARN:** Update trust score and governance limits based on outcome

**Result:** Every run produces signed attestations, ledger entries, and automatic snapshots.

---

## 2️⃣ Installation & Setup

### Prerequisites

- **Node.js:** ≥18.18 (check with `node --version`)
- **pnpm:** ≥9.12.2 (install with `npm install -g pnpm`)
- **Git:** For version control and .odavl/ directory tracking

### Installation Steps

```bash
# 1. Clone the repository (or navigate to your existing ODAVL project)
cd /path/to/odavl

# 2. Install all dependencies
pnpm install

# 3. Verify installation
pnpm odavl:run --help
```

### Repository Structure

```
odavl/
├── apps/
│   ├── cli/                  # Core ODAVL CLI orchestrator
│   │   ├── src/
│   │   │   ├── commands/     # run.ts, apply-plan.ts, undo.ts, loop.ts
│   │   │   └── phases/       # observe.ts, decide.ts, act.ts, verify.ts, learn.ts
│   │   └── scripts/          # Attestation generators
│   ├── insight-cloud/        # Federated governance layer
│   │   ├── src/lib/          # MeshBridge, ConsensusProtocol, GuardianBridge
│   │   └── scripts/          # attest-mesh.ts, attest-consensus.ts, attest-guardian.ts
│   └── vscode-ext/           # VS Code extension
│       └── src/panels/       # GovernancePanel, ConsensusPanel, GuardianPanel
├── .odavl/                   # ODAVL governance data (COMMIT THIS!)
│   ├── attestations/         # Signed evidence for every operation
│   │   ├── core/
│   │   ├── governance/
│   │   ├── consensus/
│   │   ├── mesh/
│   │   └── guardian/
│   ├── consensus/            # Consensus round results (JSON)
│   ├── history.json          # Learning system memory
│   ├── policy-ledger/        # Governance change history
│   │   └── history.json
│   ├── trust/                # Guardian trust anchor
│   │   └── anchor.json
│   └── undo/                 # Recovery snapshots
│       └── snapshot-{uuid}/
└── package.json              # All pnpm scripts defined here
```

### First-Time Setup

On first run, ODAVL automatically creates:

1. **Trust Anchor:** `.odavl/trust/anchor.json` (256-bit HMAC key for Guardian)
2. **Policy Ledger:** `.odavl/policy-ledger/history.json` (governance tracking)
3. **History File:** `.odavl/history.json` (learning system memory)

**Initial Trust Anchor Creation:**

```bash
pnpm odavl:guardian:attest
# Creates: .odavl/trust/anchor.json
# Example output:
# {
#   "id": "a7acb576-c81f-4ff1-b5ff-5e555e9404e2",
#   "key": "422cabbb2de2af18108239aabcffbe9c476f29838d4536c68cb2c77ed311654f",
#   "createdAt": "2025-11-06T08:41:13.419Z"
# }
```

⚠️ **IMPORTANT:** Commit `.odavl/` to version control for audit trail, but keep `.odavl/trust/anchor.json` secure (add to `.gitignore` for multi-tenant deployments).

---

## 3️⃣ Running ODAVL — Basic Commands

### Core Commands Reference

| Command | Purpose | Example Usage |
|---------|---------|---------------|
| `pnpm odavl:run` | Execute full ODAVL loop (Observe→Decide→Act→Verify→Learn) | `pnpm odavl:run` |
| `pnpm odavl:loop` | Continuous monitoring mode (runs loop every 60s) | `pnpm odavl:loop` |
| `pnpm odavl:apply` | Apply a specific plan with safety gates | `pnpm odavl:apply --plan fix-lint.json` |
| `pnpm odavl:undo` | Restore previous snapshot | `pnpm odavl:undo --snapshot <uuid>` |
| `pnpm odavl:observe` | Run observation phase only | `pnpm odavl:observe` |
| `pnpm odavl:decide` | Generate action plan | `pnpm odavl:decide` |
| `pnpm odavl:act` | Execute plan | `pnpm odavl:act` |
| `pnpm odavl:verify` | Verify metrics | `pnpm odavl:verify` |
| `pnpm odavl:attest:core` | Generate core loop attestation | `pnpm odavl:attest:core` |
| `pnpm odavl:governance` | Run adaptive governance update | `pnpm odavl:governance` |
| `pnpm odavl:gov:dashboard` | Create governance dashboard | `pnpm odavl:gov:dashboard` |
| `pnpm odavl:mesh:attest` | Synchronize mesh governance data | `pnpm odavl:mesh:attest` |
| `pnpm odavl:consensus:attest` | Run distributed consensus | `pnpm odavl:consensus:attest` |
| `pnpm odavl:guardian:attest` | Verify all attestations globally | `pnpm odavl:guardian:attest` |

---

### Command Details with Examples

#### `pnpm odavl:run` — Full Self-Healing Cycle

**Use Case:** Run a complete autonomous code quality improvement cycle.

**Execution:**

```bash
pnpm odavl:run
```

**What Happens:**

1. **Observe:** Scans codebase for ESLint warnings, TypeScript errors, test failures
2. **Decide:** Generates action plan (e.g., "Apply ESLint auto-fix to 3 files")
3. **Act:** Executes plan with safety gates (≤40 LOC/file, ≤10 files, 0 type errors)
4. **Verify:** Re-scans metrics to confirm improvement
5. **Learn:** Updates trust score (+0.05 on success, -0.10 on failure)

**Example Output:**

```
[ODAVL] Observe: Found 5 ESLint warnings, 0 TypeScript errors
[ODAVL] Decide: Plan generated — Apply ESLint auto-fix
[ODAVL] Act: Executing plan (3 files modified, 12 LOC changed)
[ODAVL] Verify: ESLint warnings reduced to 0 ✅
[ODAVL] Learn: Trust score updated 0.85 → 0.90 (+0.05)
[ODAVL] Attestation: .odavl/attestations/core/run-1762420000000.md
```

**Created Files:**

- `.odavl/attestations/core/run-{timestamp}.md` (signed evidence)
- `.odavl/undo/snapshot-{uuid}/` (recovery snapshot)
- `.odavl/history.json` (updated trust score)

---

#### `pnpm odavl:apply --plan <file>` — Apply Specific Plan

**Use Case:** Execute a pre-defined action plan with full safety validation.

**Plan File Example (`fix-lint.json`):**

```json
{
  "type": "eslint-autofix",
  "files": ["src/utils/helpers.ts", "src/core/engine.ts"],
  "maxLOC": 40,
  "safetyChecks": ["no-type-errors", "max-files-10"]
}
```

**Execution:**

```bash
pnpm odavl:apply --plan fix-lint.json
```

**Output:**

```
[ODAVL] Plan loaded: eslint-autofix (2 files)
[ODAVL] Safety check: Type errors = 0 ✅
[ODAVL] Safety check: File count = 2 ≤ 10 ✅
[ODAVL] Executing plan...
[ODAVL] Snapshot created: snapshot-5657b44c-349b-4661-b83e-5bd3ca2d6aca
[ODAVL] Plan executed successfully
```

---

#### `pnpm odavl:undo --snapshot <uuid>` — Instant Rollback

**Use Case:** Restore codebase to previous state after failed plan execution.

**Execution:**

```bash
pnpm odavl:undo --snapshot 5657b44c-349b-4661-b83e-5bd3ca2d6aca
```

**What Happens:**

1. Reads snapshot from `.odavl/undo/snapshot-{uuid}/`
2. Restores all modified files to previous state
3. Generates recovery attestation
4. Updates trust score (-0.05 penalty for rollback)

**Output:**

```
[ODAVL] Restoring snapshot: 5657b44c-349b-4661-b83e-5bd3ca2d6aca
[ODAVL] Files restored: 3
[ODAVL] Recovery latency: 24ms
[ODAVL] Attestation: .odavl/attestations/recovery/run-1762420100000.md
```

**Recovery Attestation Example:**

```markdown
# ODAVL Recovery Attestation
- Snapshot ID: 5657b44c-349b-4661-b83e-5bd3ca2d6aca
- Files Restored: 3
- Trigger: TypeScript errors (2) exceeded gate limit (0)
- Outcome: ✅ System restored to known good state
- Recovery Latency: 24ms
```

---

#### `pnpm odavl:governance` — Adaptive Governance Update

**Use Case:** Manually trigger governance limit adjustment based on trust history.

**Execution:**

```bash
pnpm odavl:governance
```

**Logic:**

- If last 5 runs have avg trust ≥ 0.9 → Increase limits by 10%
- If last 3 runs have avg trust < 0.8 → Decrease limits by 10%
- Otherwise → No change

**Example Output (Success Case):**

```
[ODAVL] Governance Analysis: Last 5 runs avg trust = 0.92
[ODAVL] Adjustment: maxFiles 10 → 11 (+10%)
[ODAVL] Adjustment: maxLOC 40 → 44 (+10%)
[ODAVL] Ledger updated: .odavl/policy-ledger/history.json
[ODAVL] Attestation: .odavl/attestations/governance/run-1762420200000.md
```

**Ledger Entry:**

```json
{
  "timestamp": "2025-11-06T09:30:00.000Z",
  "event": "ADAPTIVE_GOVERNANCE_ADJUSTMENT",
  "changes": {
    "maxFilesPerRun": { "old": 10, "new": 11, "delta": "+10%" },
    "maxLinesOfCodeChange": { "old": 40, "new": 44, "delta": "+10%" }
  },
  "reason": "5 consecutive runs with trust ≥ 0.9",
  "trustScore": 0.92
}
```

---

#### `pnpm odavl:mesh:attest` — Federated Mesh Sync

**Use Case:** Share governance metrics with peer ODAVL nodes (cross-project collaboration).

**Execution:**

```bash
pnpm odavl:mesh:attest
```

**What Happens:**

1. Reads local governance data (`.odavl/policy-ledger/history.json`)
2. Signs data with HMAC-SHA256
3. Broadcasts to configured peer URLs (if any)
4. Computes global trust average
5. Generates mesh attestation

**Output:**

```
[ODAVL] Mesh: Local trust = 1.15, maxFiles = 11
[ODAVL] Mesh: Peer data received (2 peers)
[ODAVL] Mesh: Global avg trust = 1.22
[ODAVL] Attestation: .odavl/attestations/mesh/run-1762420300000.md
```

**Attestation Content:**

```markdown
# ODAVL Mesh Attestation
- Peers: 3
- Global Trust: 1.22
- Max Files (avg): 12
- Timestamp: 2025-11-06T09:45:00.000Z
- Signature: 7a3f8e2b9c4d1a5f... (HMAC-SHA256)
```

---

#### `pnpm odavl:consensus:attest` — Distributed Consensus

**Use Case:** Validate peer governance packets via majority voting.

**Execution:**

```bash
pnpm odavl:consensus:attest
```

**Consensus Algorithm:**

1. Collect signed governance packets from peers
2. Verify HMAC-SHA256 signature for each peer
3. Count approved votes (valid signatures)
4. Consensus achieved if approved/total > 50%

**Output:**

```
[ODAVL] Consensus: Verifying 3 peer packets...
[ODAVL] Consensus: Peer 1 signature ✅ valid
[ODAVL] Consensus: Peer 2 signature ✅ valid
[ODAVL] Consensus: Peer 3 signature ✅ valid
[ODAVL] Consensus: 3/3 approved (100% > 50%)
[ODAVL] Consensus ✅ PASS
```

**Ledger (`consensus/round-{timestamp}.json`):**

```json
{
  "approved": 3,
  "total": 3,
  "ratio": 1,
  "consensus": true
}
```

---

#### `pnpm odavl:guardian:attest` — Global Integrity Verification

**Use Case:** Cryptographically verify all attestations across governance, consensus, and mesh layers.

**Execution:**

```bash
pnpm odavl:guardian:attest
```

**Verification Process:**

1. Scan `.odavl/attestations/governance/`, `consensus/`, `mesh/`
2. Load trust anchor (`.odavl/trust/anchor.json`)
3. Sign each attestation file with Guardian HMAC key
4. Verify signatures match (integrity check)
5. Report verification ratio

**Output:**

```
[ODAVL] Guardian: Scanning attestation directories...
[ODAVL] Guardian: Found 3 attestation files
[ODAVL] Guardian: Verified 3/3 (100.0%)
[ODAVL] Guardian attestation → .odavl/attestations/guardian/run-1762420400000.md
```

**Guardian Attestation:**

```markdown
# ODAVL Guardian Verification
- Total Attestations Checked: 3
- Verified: 3
- Integrity Ratio: 100.0%
- Timestamp: 2025-11-06T10:00:00.000Z
```

---

## 4️⃣ Governance & Learning

### What ODAVL Tracks Automatically

#### 📊 Risk Budget (Dynamic Limits)

ODAVL maintains configurable safety limits that adjust based on performance:

**Initial Limits:**

```yaml
maxFilesPerRun: 10
maxLinesOfCodeChange: 40
maxTypeErrors: 0  # Zero tolerance
maxESLintWarnings: 20
```

**Adaptive Adjustment Rules:**

- **Success Pattern:** 5 consecutive runs with trust ≥ 0.9 → Increase limits by 10%
- **Failure Pattern:** 3 consecutive runs with trust < 0.8 → Decrease limits by 10%

**Example Evolution:**

```
Run 1: trust=0.85, maxFiles=10, maxLOC=40
Run 2: trust=0.88, maxFiles=10, maxLOC=40
Run 3: trust=0.91, maxFiles=10, maxLOC=40
Run 4: trust=0.94, maxFiles=10, maxLOC=40
Run 5: trust=0.97, maxFiles=10, maxLOC=40
  → ADJUSTMENT TRIGGERED (avg trust ≥ 0.9)
Run 6: trust=1.00, maxFiles=11, maxLOC=44  ← New limits
```

---

#### 🎯 Trust Score (Confidence Metric)

Trust score represents ODAVL's confidence in its own decision-making:

**Calculation:**

```typescript
// After successful run:
newTrust = currentTrust + 0.05

// After failed run (type errors, test failures):
newTrust = currentTrust - 0.10

// After manual rollback:
newTrust = currentTrust - 0.05
```

**Trust Score Ranges:**

- **0.0 - 0.5:** Low confidence (restrictive limits)
- **0.5 - 0.8:** Medium confidence (standard limits)
- **0.8 - 1.0:** High confidence (expanded limits possible)
- **1.0+:** Exceptional performance (maximum limit expansion)

**Stored in:** `.odavl/history.json`

```json
{
  "runs": [
    { "timestamp": "2025-11-06T08:00:00Z", "trust": 0.85, "outcome": "success" },
    { "timestamp": "2025-11-06T09:00:00Z", "trust": 0.90, "outcome": "success" },
    { "timestamp": "2025-11-06T10:00:00Z", "trust": 0.95, "outcome": "success" }
  ]
}
```

---

#### 📚 Policy Ledger (Governance History)

Every governance change is recorded in `.odavl/policy-ledger/history.json`:

**Example Entry:**

```json
{
  "entries": [
    {
      "timestamp": "2025-11-06T09:30:00.000Z",
      "event": "ADAPTIVE_GOVERNANCE_ADJUSTMENT",
      "changes": {
        "maxFilesPerRun": { "old": 10, "new": 11, "delta": "+10%" }
      },
      "reason": "5 consecutive runs with trust ≥ 0.9",
      "trustScore": 0.92
    },
    {
      "timestamp": "2025-11-06T11:00:00.000Z",
      "event": "MANUAL_LIMIT_OVERRIDE",
      "changes": {
        "maxTypeErrors": { "old": 0, "new": 0, "delta": "0%" }
      },
      "reason": "Policy enforcement: zero tolerance maintained"
    }
  ]
}
```

---

#### 🔐 Attestations (Signed Evidence)

Every ODAVL operation produces a signed attestation in `.odavl/attestations/`:

**Directory Structure:**

```
.odavl/attestations/
├── core/            # Full loop executions
│   └── run-1762420000000.md
├── governance/      # Governance adjustments
│   └── run-1762420200000.md
├── recovery/        # Rollback events
│   └── run-1762420100000.md
├── mesh/            # Federated sync
│   └── run-1762420300000.md
├── consensus/       # Distributed voting
│   └── run-1762420350000.md
└── guardian/        # Global verification
    └── run-1762420400000.md
```

---

#### 💾 Snapshots (Recovery Points)

Every plan execution creates a recovery snapshot in `.odavl/undo/`:

**Snapshot Structure:**

```
.odavl/undo/snapshot-5657b44c-349b-4661-b83e-5bd3ca2d6aca/
├── metadata.json          # Snapshot info (timestamp, files, LOC)
├── src/
│   ├── utils/
│   │   └── helpers.ts     # Original file content
│   └── core/
│       └── engine.ts      # Original file content
└── diff.patch             # Git diff of changes
```

**Metadata Example:**

```json
{
  "id": "5657b44c-349b-4661-b83e-5bd3ca2d6aca",
  "timestamp": "2025-11-06T09:15:00.000Z",
  "filesModified": 2,
  "linesChanged": 12,
  "planType": "eslint-autofix"
}
```

---

## 5️⃣ Recovery & Safety

### How ODAVL Prevents Data Loss

#### ✅ Automatic Snapshot Creation

**Trigger:** Every plan execution  
**Location:** `.odavl/undo/snapshot-{uuid}/`

```bash
pnpm odavl:apply --plan fix-lint.json
# Automatically creates snapshot before execution
```

**Snapshot Contains:**

- Full copies of all files to be modified
- Git diff showing planned changes
- Metadata (timestamp, file count, LOC count)

---

#### ✅ Manual Rollback

**Scenario:** Developer realizes a plan execution had unintended consequences.

**Solution:**

```bash
# List available snapshots
ls .odavl/undo/

# Restore specific snapshot
pnpm odavl:undo --snapshot 5657b44c-349b-4661-b83e-5bd3ca2d6aca
```

**Output:**

```
[ODAVL] Restoring snapshot: 5657b44c-349b-4661-b83e-5bd3ca2d6aca
[ODAVL] Files restored:
  - src/utils/helpers.ts
  - src/core/engine.ts
[ODAVL] Recovery latency: 24ms
[ODAVL] Trust score adjusted: 0.90 → 0.85 (-0.05)
```

---

#### ✅ Automatic Recovery (On Failure)

**Scenario:** Plan execution violates a safety gate (e.g., introduces TypeScript errors).

**ODAVL Response (No Human Intervention):**

1. **Detect Violation:**

   ```
   [ODAVL] Verify: TypeScript errors = 2 (exceeds gate limit of 0)
   ```

2. **Trigger Rollback:**

   ```
   [ODAVL] Safety gate violated — initiating auto-recovery
   [ODAVL] Restoring snapshot: snapshot-{uuid}
   ```

3. **Confirm Recovery:**

   ```
   [ODAVL] TypeScript errors = 0 ✅
   [ODAVL] System restored to known good state
   ```

4. **Generate Attestation:**

   ```markdown
   # ODAVL Recovery Attestation
   - Trigger: TypeScript errors (2) exceeded gate limit (0)
   - Action: Auto-rollback to snapshot-{uuid}
   - Outcome: ✅ System restored
   - Recovery Latency: 24ms
   - Trust Score: 0.90 → 0.85 (-0.05 penalty)
   ```

---

#### ✅ Signed Recovery Reports

All recovery events are documented in `.odavl/attestations/recovery/`:

**Example:**

```markdown
# ODAVL Recovery Attestation
- Snapshot ID: 5657b44c-349b-4661-b83e-5bd3ca2d6aca
- Trigger: TypeScript errors (2) exceeded gate limit (0)
- Action: Auto-rollback
- Files Restored: 2
- Recovery Latency: 24ms
- Timestamp: 2025-11-06T09:20:00.000Z
- Outcome: ✅ System restored to known good state
```

---

## 6️⃣ Using the VS Code Extension

### Installation

The ODAVL VS Code extension is included in the monorepo:

```bash
# Compile the extension
pnpm ext:compile

# Open VS Code in the workspace
code .

# Press F5 to launch Extension Development Host
```

**Alternatively:** Install from `.vsix` package (if distributed).

---

### Opening Dashboards

**Command Palette:**

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: `ODAVL: Open Governance Dashboard`
3. Select the command

**Shortcut:** Configure custom keybinding in VS Code settings.

---

### Available Panels

#### 📊 Governance Dashboard

**Shows:**

- **Trust Chart:** Line graph of trust scores over last 10 runs
- **Risk Budget Chart:** Current vs max limits (files, LOC, errors)
- **Recent Activity:** Last 5 governance adjustments

**Auto-Refresh:** Updates after every `pnpm odavl:run` or `pnpm odavl:governance`

**Example View:**

```
┌─────────────────────────────────────────┐
│   ODAVL Governance Dashboard            │
├─────────────────────────────────────────┤
│ Trust Score: 0.92 (↑ +0.05)             │
│                                         │
│ Risk Budget:                            │
│ ├─ Max Files:  11/10  [██████████] 110% │
│ ├─ Max LOC:    44/40  [██████████] 110% │
│ └─ Type Errors: 0/0   [          ]   0% │
│                                         │
│ Recent Adjustments:                     │
│ • 2025-11-06 09:30 — Limits +10%        │
│ • 2025-11-05 14:15 — Trust +0.05        │
└─────────────────────────────────────────┘
```

---

#### 🔗 Consensus Panel

**Shows:**

- Peers approved (e.g., 3/3)
- Consensus ratio (e.g., 100%)
- Last consensus timestamp

**Color Coding:**

- **Green:** Consensus ≥ 50% (✅ PASS)
- **Red:** Consensus < 50% (❌ FAIL)

**Example:**

```
┌─────────────────────────────────────────┐
│   ODAVL Consensus Status                │
├─────────────────────────────────────────┤
│ Peers Approved: 3/3                     │
│ Consensus Ratio: 100.0%                 │
│ Status: ✅ PASS                         │
│ Last Run: 2025-11-06 09:45:00           │
└─────────────────────────────────────────┘
```

---

#### 🛡️ Guardian Panel

**Shows:**

- Total attestations checked
- Verified count
- Integrity ratio (target: 100%)

**Example:**

```
┌─────────────────────────────────────────┐
│   ODAVL Guardian Verification           │
├─────────────────────────────────────────┤
│ Total Attestations: 3                   │
│ Verified: 3                             │
│ Integrity: 100.0% ✅                    │
│ Last Verified: 2025-11-06 10:00:00      │
└─────────────────────────────────────────┘
```

---

### Panel Auto-Refresh

The VS Code extension listens for file system changes in `.odavl/`:

**Triggers:**

- New attestation files created
- Ledger updates (`.odavl/policy-ledger/history.json`)
- Trust score changes (`.odavl/history.json`)

**Behavior:** Webview automatically re-renders with latest data (no manual refresh needed).

---

## 7️⃣ Multi-Project Collaboration (Federation)

### Setup for Federated Mesh

**Scenario:** You have 3 projects (Frontend, Backend, ML) and want to synchronize governance data.

#### Step 1: Configure Peer URLs

Edit `apps/insight-cloud/src/lib/MeshSyncService.ts`:

```typescript
export async function syncGovernance() {
  const peerUrls = [
    "https://frontend-odavl.example.com/mesh",
    "https://backend-odavl.example.com/mesh",
    "https://ml-odavl.example.com/mesh"
  ];
  
  // ... rest of sync logic
}
```

#### Step 2: Run Mesh Sync on Each Project

**Frontend Project:**

```bash
pnpm odavl:mesh:attest
# Broadcasts: { trust: 1.15, maxFiles: 11, signature: "..." }
```

**Backend Project:**

```bash
pnpm odavl:mesh:attest
# Broadcasts: { trust: 1.28, maxFiles: 13, signature: "..." }
```

**ML Project:**

```bash
pnpm odavl:mesh:attest
# Broadcasts: { trust: 1.42, maxFiles: 15, signature: "..." }
```

#### Step 3: Global Trust Aggregation

Each node receives peer data and computes global average:

```
Frontend: Receives [Backend, ML] → avgTrust = (1.15 + 1.28 + 1.42) / 3 = 1.28
Backend:  Receives [Frontend, ML] → avgTrust = 1.28
ML:       Receives [Frontend, Backend] → avgTrust = 1.28
```

#### Step 4: Consensus Verification

Run consensus to validate peer signatures:

```bash
pnpm odavl:consensus:attest
# Verifies 3 peer signatures: ✅ ✅ ✅
# Consensus: 3/3 (100% > 50%) ✅ PASS
```

---

### Privacy & Security Rules

#### 🔒 What Gets Shared

**Shared (Signed):**

- Trust score (e.g., `1.15`)
- Governance limits (e.g., `maxFiles: 11`)
- Timestamp
- HMAC-SHA256 signature

**Example Packet:**

```json
{
  "trustScore": 1.15,
  "maxFiles": 11,
  "maxLOC": 44,
  "timestamp": "2025-11-06T09:00:00.000Z",
  "signature": "7a3f8e2b9c4d1a5f..." // HMAC-SHA256
}
```

#### 🔒 What NEVER Gets Shared

- Source code
- File names
- ESLint/TypeScript error details
- Test results
- Snapshot contents
- Trust anchor private key

**Principle:** Only anonymized governance metrics and cryptographic signatures leave the project.

---

### Federation Benefits

1. **Global Benchmarking:** Compare your project's trust score against peer average
2. **Anomaly Detection:** Identify if your project's governance limits are outliers
3. **Distributed Validation:** Consensus ensures no single node can manipulate global metrics
4. **Network Resilience:** System functions with partial peer availability (>50% consensus)

---

## 8️⃣ Guardian Verification (Global Security)

### What is the Guardian Bridge?

The **Guardian Bridge** is ODAVL's cryptographic verification layer that ensures:

- Every attestation is signed with a 256-bit HMAC key
- Signatures can be independently verified
- 100% integrity ratio confirms no tampering

---

### How Guardian Works

#### 1️⃣ Trust Anchor Creation (First Run)

```bash
pnpm odavl:guardian:attest
```

**Creates:** `.odavl/trust/anchor.json`

```json
{
  "id": "a7acb576-c81f-4ff1-b5ff-5e555e9404e2",
  "key": "422cabbb2de2af18108239aabcffbe9c476f29838d4536c68cb2c77ed311654f",
  "createdAt": "2025-11-06T08:41:13.419Z"
}
```

⚠️ **Security:** Keep this file secure. Compromise of the `key` allows signature forgery.

---

#### 2️⃣ Attestation Signing

Every ODAVL operation signs its attestation with the Guardian key:

```typescript
// GuardianBridge.ts
export function guardianSign(data: any) {
  const { key } = loadTrustAnchor();
  const sig = crypto.createHmac("sha256", key).update(JSON.stringify(data)).digest("hex");
  return { ...data, guardianSig: sig };
}
```

**Example Signed Attestation:**

```json
{
  "file": "run-1762420000000.md",
  "dir": "governance",
  "guardianSig": "7a3f8e2b9c4d1a5f3e8d6c4b2a1f9e7d5c3b1a0f8e6d4c2b0a9f7e5d3c1b"
}
```

---

#### 3️⃣ Global Verification

```bash
pnpm odavl:guardian:attest
```

**Process:**

1. Scans `.odavl/attestations/governance/`, `consensus/`, `mesh/`
2. For each attestation file, creates signed packet
3. Verifies signature matches (integrity check)
4. Reports verification ratio

**Output:**

```
[ODAVL] Guardian: Scanning attestation directories...
[ODAVL] Guardian: Found 3 attestation files
[ODAVL] Guardian: Verifying signatures...
[ODAVL] Guardian: governance/run-1762420200000.md ✅ verified
[ODAVL] Guardian: consensus/run-1762420350000.md ✅ verified
[ODAVL] Guardian: mesh/run-1762420300000.md ✅ verified
[ODAVL] Guardian: 3/3 (100.0%) ✅
```

---

#### 4️⃣ Guardian Attestation

**Created:** `.odavl/attestations/guardian/run-{timestamp}.md`

**Content:**

```markdown
# ODAVL Guardian Verification
- Total Attestations Checked: 3
- Verified: 3
- Integrity Ratio: 100.0%
- Timestamp: 2025-11-06T10:00:00.000Z
```

---

### When to Run Guardian Verification

**Recommended Frequency:**

- **Daily:** For high-security projects
- **Weekly:** For standard projects
- **Monthly:** For low-risk projects
- **Before Audits:** Always verify 100% integrity before compliance reviews

**Best Practice:** Add to CI/CD pipeline:

```yaml
# .github/workflows/guardian.yml
name: Guardian Verification
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm odavl:guardian:attest
      - run: |
          INTEGRITY=$(cat .odavl/attestations/guardian/run-*.md | grep "Integrity Ratio" | awk '{print $4}')
          if [ "$INTEGRITY" != "100.0%" ]; then
            echo "❌ Integrity check failed: $INTEGRITY"
            exit 1
          fi
```

---

## 9️⃣ Typical Workflow Example

### Daily Developer Workflow

**Morning:** Developer arrives, checks project health.

```bash
# Step 1: Pull latest changes
git pull origin main

# Step 2: Run ODAVL health check
pnpm odavl:run
```

**ODAVL Executes:**

1. **Observe Phase:**

   ```
   [ODAVL] Scanning codebase...
   [ODAVL] ESLint warnings: 3
   [ODAVL] TypeScript errors: 0
   [ODAVL] Test coverage: 87%
   ```

2. **Decide Phase:**

   ```
   [ODAVL] Generating plan...
   [ODAVL] Plan: Apply ESLint auto-fix to 2 files (8 LOC)
   [ODAVL] Risk assessment: LOW (within governance limits)
   ```

3. **Act Phase:**

   ```
   [ODAVL] Creating snapshot: snapshot-abc123...
   [ODAVL] Executing plan...
   [ODAVL] Modified: src/utils/helpers.ts (4 LOC)
   [ODAVL] Modified: src/core/engine.ts (4 LOC)
   ```

4. **Verify Phase:**

   ```
   [ODAVL] Re-scanning metrics...
   [ODAVL] ESLint warnings: 0 ✅ (-3)
   [ODAVL] TypeScript errors: 0 ✅
   [ODAVL] Test coverage: 87% ✅ (unchanged)
   ```

5. **Learn Phase:**

   ```
   [ODAVL] Outcome: SUCCESS
   [ODAVL] Trust score: 0.85 → 0.90 (+0.05)
   [ODAVL] Updating history: .odavl/history.json
   ```

6. **Attestation:**

   ```
   [ODAVL] Attestation created: .odavl/attestations/core/run-1762425000000.md
   ```

---

**Mid-Day:** Developer opens VS Code to review progress.

```bash
# Open VS Code
code .

# Open governance dashboard
# Press Ctrl+Shift+P → "ODAVL: Open Governance Dashboard"
```

**Dashboard Shows:**

```
Trust Score: 0.90 (↑ +0.05)
Risk Budget:
├─ Max Files:  10/10  [██████████] 100%
├─ Max LOC:    40/40  [██████████] 100%
└─ Type Errors: 0/0   [          ]   0%

Recent Activity:
• 2025-11-06 09:00 — ESLint auto-fix (SUCCESS)
• 2025-11-05 16:30 — Test coverage improvement (SUCCESS)
```

---

**End of Day:** Developer commits changes and runs weekly governance update.

```bash
# Step 3: Commit ODAVL changes
git add .odavl/
git commit -m "chore: ODAVL auto-fix ESLint warnings (trust +0.05)"

# Step 4: Weekly governance check
pnpm odavl:governance
```

**Output:**

```
[ODAVL] Governance Analysis: Last 5 runs avg trust = 0.88
[ODAVL] No adjustment needed (threshold: 0.90)
[ODAVL] Current limits maintained: maxFiles=10, maxLOC=40
```

---

**Weekly:** Run mesh sync and Guardian verification.

```bash
# Step 5: Federated mesh sync
pnpm odavl:mesh:attest

# Step 6: Guardian integrity check
pnpm odavl:guardian:attest
```

**Guardian Output:**

```
[ODAVL] Guardian: Verified 5/5 attestations (100.0%) ✅
[ODAVL] Attestation: .odavl/attestations/guardian/run-1762430000000.md
```

---

## 🔟 Best Practices

### ✅ DO

1. **Commit `.odavl/` directory**

   ```bash
   git add .odavl/
   git commit -m "chore: ODAVL governance updates"
   ```

   **Reason:** Preserves audit trail and learning history across team.

2. **Keep Trust Anchor secure**

   ```bash
   # Add to .gitignore for multi-tenant deployments
   echo ".odavl/trust/anchor.json" >> .gitignore
   ```

   **Reason:** Private key compromise allows signature forgery.

3. **Run `pnpm odavl:governance` weekly**

   ```bash
   # Cron job example (Linux/Mac):
   0 9 * * 1 cd /path/to/project && pnpm odavl:governance
   ```

   **Reason:** Ensures adaptive limits stay aligned with performance trends.

4. **Review governance dashboard monthly**

   ```bash
   pnpm odavl:gov:dashboard
   cat .odavl/dashboards/governance-dashboard.md
   ```

   **Reason:** Identify long-term trust score trends and anomalies.

5. **Verify Guardian integrity before audits**

   ```bash
   pnpm odavl:guardian:attest
   # Confirm: Integrity Ratio: 100.0%
   ```

   **Reason:** Compliance teams require cryptographic proof of system integrity.

6. **Use snapshots for experimental changes**

   ```bash
   # Before risky refactor:
   pnpm odavl:apply --plan risky-refactor.json
   # Creates automatic snapshot for instant rollback if needed
   ```

7. **Monitor VS Code dashboard during development**
   - Keep dashboard open in secondary editor column
   - Watch trust score and risk budget in real-time
   - Identify when governance limits expand/contract

---

### ❌ DON'T

1. **Don't ignore TypeScript errors**
   - ODAVL enforces zero tolerance (`maxTypeErrors: 0`)
   - Auto-rollback triggers on any type error introduction

2. **Don't manually edit `.odavl/` files**
   - Ledger and attestation integrity depends on ODAVL-generated content
   - Manual edits may break Guardian verification

3. **Don't skip `pnpm odavl:undo` after failed runs**
   - ODAVL auto-recovers, but check `.odavl/attestations/recovery/` for details
   - Understand *why* failure occurred before re-running

4. **Don't share trust anchor key**
   - Treat `.odavl/trust/anchor.json` like SSH private key
   - Regenerate if compromised (invalidates all prior attestations)

5. **Don't bypass safety gates**
   - LOC/file limits exist for incremental, safe changes
   - Large refactors should be broken into multiple ODAVL runs

6. **Don't delete `.odavl/undo/` snapshots prematurely**
   - Retain at least last 10 snapshots for recovery options
   - Snapshots are compressed (minimal disk space)

7. **Don't run ODAVL on uncommitted changes**
   - Commit baseline state first to ensure clean rollback point
   - Use feature branches for ODAVL-managed changes

---

### 🔧 Maintenance Tasks

#### Daily

- [x] Run `pnpm odavl:run` (automated or manual)
- [x] Check VS Code dashboard for trust trends

#### Weekly

- [x] Run `pnpm odavl:governance` for adaptive limit updates
- [x] Review `.odavl/policy-ledger/history.json` for governance changes
- [x] Run `pnpm odavl:mesh:attest` (if using federation)

#### Monthly

- [x] Run `pnpm odavl:guardian:attest` for integrity verification
- [x] Generate governance report: `pnpm odavl:gov:dashboard`
- [x] Clean old snapshots (keep last 20): `rm -rf .odavl/undo/snapshot-{old}*/`
- [x] Review trust score trends and adjust policies if needed

#### Quarterly

- [x] Audit `.odavl/attestations/` for completeness
- [x] Verify 100% Guardian integrity for compliance
- [x] Backup `.odavl/trust/anchor.json` to secure storage
- [x] Review and update peer URLs for mesh federation

---

## 📚 Additional Resources

### Documentation Files

- `ARCHITECTURE.md` — Technical architecture deep-dive
- `ODAVL_SYSTEM_EVOLUTION_REPORT.md` — Before/after comparison (Phases 1-10)
- `API_REFERENCE.md` — Complete API documentation
- `DEVELOPER_GUIDE.md` — Contribution guide for ODAVL developers

### Support Channels

- **GitHub Issues:** Bug reports and feature requests
- **Discussions:** Q&A and best practices sharing
- **Slack/Discord:** Real-time community support (if applicable)

### Training Materials

- **Video Tutorials:** (Coming soon)
- **Interactive Workshop:** (Coming soon)
- **Certification Program:** (Coming soon)

---

## 🎓 Conclusion

You now have a complete understanding of ODAVL's:

- **Installation & Setup** (pnpm, trust anchor, .odavl/ structure)
- **Core Commands** (run, apply, undo, governance, mesh, consensus, guardian)
- **Learning System** (trust scores, adaptive limits, ledger tracking)
- **Recovery Mechanisms** (snapshots, auto-rollback, signed attestations)
- **Visualization** (VS Code dashboards, live monitoring)
- **Federation** (multi-project mesh, distributed consensus)
- **Security** (Guardian Bridge, HMAC-SHA256, 100% integrity)

**Next Steps:**

1. Run your first ODAVL cycle: `pnpm odavl:run`
2. Open the governance dashboard in VS Code
3. Review the attestation in `.odavl/attestations/core/`
4. Set up weekly governance checks
5. Explore federation with peer projects (if applicable)

**Welcome to autonomous, self-verifying code governance!** 🚀

---

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Maintained By:** ODAVL Core Team
