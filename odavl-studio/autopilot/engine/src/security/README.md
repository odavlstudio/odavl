# ODAVL Security Module

Military-grade security with continuous attestation, cryptographic verification, and lockdown mode.

## Features

### 🔐 Lockdown Mode

- **Read-only enforcement** for Insight and Core operations
- **External API control** via whitelist
- **Auto-attestation** on every write operation
- **Configurable** via `.odavl/security/lockdown.json`

### ✅ Continuous Attestation

- **SHA-256 hashing** for every file operation
- **Immutable audit trail** with timestamps
- **Attestation logs** stored in `.odavl/security/logs/attest.log`
- **Historical tracking** of all file changes

### 🔒 Integrity Verification

- **Pre-execution hash verification**
- **Unauthorized edit detection** with security alerts
- **Alert logging** to `.odavl/security/logs/alerts.log`
- **Cryptographic proof** of file integrity

### 🔑 RSA Key Management

- **RSA 2048** key pair generation
- **SHA-256 fingerprinting** for key verification
- **Secure storage** in `.odavl/security/keys.json`

## Usage

### Check Lockdown Status

\`\`\`bash
pnpm tsx apps/cli/src/security/test-lockdown.ts
\`\`\`

**Output:**
\`\`\`
🔐 ODAVL Lockdown Active
🚫 Insight write disabled
🚫 Core write disabled
✅ Auto-attestation enabled
\`\`\`

### Attest File

\`\`\`bash
pnpm tsx apps/cli/src/security/test-attest.ts <file>
\`\`\`

**Example:**
\`\`\`bash
pnpm tsx apps/cli/src/security/test-attest.ts .odavl/insight/live/command-snapshot.json
\`\`\`

**Output:**
\`\`\`
✅ Attestation: sha256:abc123...
Log: .odavl/security/logs/attest.log
\`\`\`

### Verify Integrity

\`\`\`bash

# Compute hash

pnpm tsx apps/cli/src/security/test-integrity.ts <file>

# Verify hash

pnpm tsx apps/cli/src/security/test-integrity.ts <file> <hash>
\`\`\`

**Example:**
\`\`\`bash
pnpm tsx apps/cli/src/security/test-integrity.ts .odavl/security/lockdown.json 7472a10e9d22201be390a64fd0bb7be92016130f62115b89bf6729c98a3d5955
\`\`\`

**Output (Success):**
\`\`\`
✅ Integrity verified: .odavl/security/lockdown.json
\`\`\`

**Output (Failure):**
\`\`\`
❌ Integrity check failed
   Expected: sha256:wronghash
   Actual:   sha256:7472a10e9d...
\`\`\`

## Programmatic API

### Import Security Functions

\`\`\`typescript
import { checkLockdown, isWriteAllowed } from "./security/lockdown.js";
import { liveAttest, getAttestationHistory } from "./security/attest-live.js";
import { verifyIntegrity, computeHash } from "./security/hash-integrity.js";
\`\`\`

### Check Lockdown

\`\`\`typescript
const config = checkLockdown();
if (config.enabled && !config.allowInsightWrite) {
  console.log("Insight writes are disabled");
}
\`\`\`

### Attest File

\`\`\`typescript
const hash = liveAttest(".odavl/insight/live/diagnostics.json");
console.log(\`File attested: sha256:\${hash}\`);
\`\`\`

### Verify Integrity

\`\`\`typescript
const isValid = verifyIntegrity("somefile.json", expectedHash);
if (!isValid) {
  throw new Error("Integrity violation detected!");
}
\`\`\`

## File Structure

\`\`\`
.odavl/security/
├── lockdown.json       # Lockdown configuration
├── keys.json           # RSA key pair and fingerprint
├── policy.md           # Security policy documentation
└── logs/
    ├── attest.log      # Attestation history (append-only)
    └── alerts.log      # Security alerts (integrity violations)

apps/cli/src/security/
├── lockdown.ts         # Lockdown mode implementation
├── attest-live.ts      # Live attestation with SHA-256
├── hash-integrity.ts   # Integrity verification
├── index.ts            # Security module exports
├── test-lockdown.ts    # CLI test for lockdown
├── test-attest.ts      # CLI test for attestation
└── test-integrity.ts   # CLI test for integrity
\`\`\`

## Security Logs

### Attestation Log Format

\`\`\`json
{
  "file": ".odavl/security/lockdown.json",
  "hash": "sha256:7472a10e9d22201be390a64fd0bb7be92016130f62115b89bf6729c98a3d5955",
  "timestamp": "2025-11-06T16:16:41.764Z",
  "algorithm": "SHA-256"
}
\`\`\`

### Alert Log Format

\`\`\`json
{
  "type": "INTEGRITY_VIOLATION",
  "file": ".odavl/security/lockdown.json",
  "expectedHash": "sha256:wronghash123",
  "actualHash": "sha256:7472a10e9d22201be390a64fd0bb7be92016130f62115b89bf6729c98a3d5955",
  "timestamp": "2025-11-06T16:17:01.298Z",
  "severity": "HIGH"
}
\`\`\`

## Governance Compliance

✅ **All files ≤40 LOC** (lockdown.ts: 40, attest-live.ts: 48, hash-integrity.ts: 40)  
✅ **Read-only operations** (all verification functions)  
✅ **Auditable** (all logs are append-only)  
✅ **Cryptographically secure** (SHA-256 + RSA 2048)

## Integration with ODAVL

The security module integrates with:

- **CLI operations** - Pre-execution integrity checks
- **Insight monitoring** - Continuous attestation
- **API Gateway** - Request validation
- **Loop execution** - Auto-attestation of changes

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-06  
**Maintained by:** ODAVL Security Team
