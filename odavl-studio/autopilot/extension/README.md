# ODAVL Autopilot Extension

**Self-healing code infrastructure** - Autonomous code quality improvements with the O-D-A-V-L cycle.

## Installation

**From .vsix file:**
```bash
code --install-extension odavl-autopilot-vscode-2.0.0.vsix
```

**Or manually in VS Code:**
1. Open Extensions (`Ctrl+Shift+X`)
2. Click `...` menu → "Install from VSIX..."
3. Select `odavl-autopilot-vscode-2.0.0.vsix`

**Requirements:**
- VS Code 1.80.0+
- Node.js 18.18+

## Features

- **O-D-A-V-L Cycle**: Observe → Decide → Act → Verify → Learn
- **Auto-open Ledgers**: View execution details after each run
- **Recipe Viewer**: Browse available improvement recipes
- **Undo Functionality**: Rollback any automated changes
- **Trust Scoring**: Recipes learn from success/failure

## Commands

- `ODAVL Autopilot: Run Full Cycle` - Run complete O-D-A-V-L cycle
- `ODAVL Autopilot: Run Single Phase` - Execute specific phase
- `ODAVL Autopilot: Undo Last Change` - Revert last improvement
- `ODAVL Autopilot: View Ledger` - Open execution ledger

## Configuration

```json
{
  "odavl-autopilot.autoOpenLedger": true,
  "odavl-autopilot.maxFiles": 10,
  "odavl-autopilot.maxLOC": 40
}
```

## The O-D-A-V-L Cycle

**Five-phase autonomous improvement:**

1. **Observe** 🔍 - Detect issues (eslint, tsc, metrics)
2. **Decide** 🧠 - Select best recipe (ML trust scoring)
3. **Act** ⚡ - Apply improvements (with undo snapshot)
4. **Verify** ✅ - Enforce quality gates (.odavl/gates.yml)
5. **Learn** 📊 - Update trust scores (ML feedback loop)

### Example Cycle Output

```
🔍 [OBSERVE] Detected 48 issues
  - Security: 12
  - Complexity: 28
  - Performance: 8

🧠 [DECIDE] Selected: security-hardening
  - Trust score: 0.85
  - Priority: 10 (highest)
  - Safety: Within risk budget ✅

⚡ [ACT] Applying improvements...
  - Undo snapshot: .odavl/undo/1736889600.json
  - Modified 3 files (42 LOC)

✅ [VERIFY] Quality gates check...
  - Security: 12 → 8 (33% improvement)
  - Attestation: SHA-256 saved

📊 [LEARN] Updated trust scores
  - security-hardening: 0.85 → 0.88 (+3%)

✅ Cycle complete!
```

## Safety Features (Triple-Layer Protection)

### 1. Risk Budget Guard
- **Max 10 files** per cycle
- **Max 40 LOC** per file modification
- **Protected paths**: `security/**`, `auth/**`, `**/*.spec.*`
- Enforced BEFORE any file writes

### 2. Undo Snapshots
- Automatic backups before every change
- Stored in `.odavl/undo/<timestamp>.json`
- One-click rollback: `Ctrl+Shift+P` → "Undo Last Change"

### 3. Attestation Chain
- SHA-256 cryptographic proofs
- Every improvement auditable
- Stored in `.odavl/attestation/`
- Links recipes to verified outcomes

## Recipe Trust System

**Machine learning feedback loop:**
- Recipes start with neutral trust (0.5)
- Trust increases with success (0.1–1.0 range)
- Failed recipes lose trust
- 3 consecutive failures → blacklisted (trust < 0.2)

## Performance

- **Bundle Size**: 3.2 KB
- **Compilation**: 10-12ms
- **Auto-open Ledgers**: FileSystemWatcher on `.odavl/ledger/`
- **Undo Restore**: Instant rollback from snapshots

## License

MIT
