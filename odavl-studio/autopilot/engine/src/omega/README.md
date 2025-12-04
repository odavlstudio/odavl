# ODAVL Omega Snapshot System

Final cryptographic seal of ODAVL's intelligence, governance, security, and performance state.

## Overview

The Omega Snapshot creates a complete, immutable capture of ODAVL's critical subsystems with SHA-256 fingerprints for verification and audit trails.

## Architecture

```
.odavl/omega/
├── snapshots/
│   └── omega-snapshot.json      # System state with SHA-256 hashes
├── reports/
│   └── OMEGA_SUMMARY.md         # Human-readable summary
└── attestations/
    └── omega-attest.json        # Cryptographic attestation
```

## Usage

### Create Complete Omega Snapshot

```bash
# Run full sequence
pnpm tsx apps/cli/src/omega/index.ts all

# Or run individual steps
pnpm tsx apps/cli/src/omega/snapshot.ts        # 1. Snapshot
pnpm tsx .odavl/omega/attest-omega.ts          # 2. Attestation
pnpm tsx apps/cli/src/omega/generate-summary.ts # 3. Summary
```

### View Summary Report

```bash
Get-Content .odavl/omega/reports/OMEGA_SUMMARY.md
```

## Files Captured

The snapshot includes SHA-256 hashes of:

1. **Insight Subsystem**
   - `.odavl/insight/live/command-snapshot.json`
   - `.odavl/insight/live/loop-decision.json`
   - `.odavl/insight/live/loop-execution.json`

2. **Security Subsystem**
   - `.odavl/security/lockdown.json`
   - `.odavl/security/keys.json`

3. **Governance Subsystem**
   - `.odavl/recipes-trust.json`
   - `.odavl/history.json`

4. **Core Modules**
   - `apps/cli/src/security/index.ts`
   - `apps/cli/src/omega/snapshot.ts`

## Output Structure

### Snapshot JSON

```json
{
  "timestamp": "2025-11-06T16:28:04.459Z",
  "version": "1.0.0",
  "snapshot": [
    {
      "file": ".odavl/security/lockdown.json",
      "hash": "sha256:0602b0115e63...",
      "size": 260
    }
  ],
  "totalFiles": 9,
  "totalSize": 6027
}
```

### Attestation JSON

```json
{
  "timestamp": "2025-11-06T16:28:12.526Z",
  "snapshotFile": ".odavl/omega/snapshots/omega-snapshot.json",
  "digest": "sha256:32dae546352e88fc...",
  "algorithm": "SHA-256",
  "verified": true,
  "status": "SEALED"
}
```

## Validation

**Final Digest**: `sha256:32dae546352e88fc5e73676a5e9167f37f2718c0e941fc35c30088a42bb27dc7`

This digest cryptographically seals the entire ODAVL system state and can be used to verify system integrity.

## Governance Compliance

✅ **Files**: 6 files (within ≤10 limit)  
✅ **LOC**: All files ≤40 LOC  
✅ **Read-Only**: Only reads from other directories  
✅ **Reports**: Both JSON and MD formats  
✅ **Fingerprints**: SHA-256 for all subsystems

---

**Version**: 1.0.0  
**Status**: ✅ SEALED  
**Last Updated**: 2025-11-06  
**Phase**: 11 — Omega Snapshot (Final Seal)
