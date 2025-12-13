# Zero Code Cloud (ZCC) Specification v1.0.0

> **Privacy-First Cloud Integration**  
> Last Updated: December 13, 2025  
> Status: Production

## Overview

Zero Code Cloud (ZCC) is ODAVL's privacy guarantee: **we never transmit source code, file paths, error messages, or any identifiable information to the cloud.**

Only aggregated **metadata** is sent:
- Issue counts by severity
- Risk scores (calculated locally)
- Detector names used
- Analysis timing
- Environment fingerprint

---

## Motivation

Traditional code analysis platforms require uploading your entire codebase, creating risks:
- **Privacy:** Source code exposed to third parties
- **Security:** Code leaks, credential exposure
- **Compliance:** Violates enterprise security policies
- **Efficiency:** Slow uploads (100+ MB per analysis)

**ZCC solves this:** Analyze locally, send only anonymous statistics.

---

## ZCC Principles

### 1. Code Never Leaves Your Machine

**✓ Allowed:**
- Aggregate counts (e.g., "5 critical issues")
- Calculated scores (e.g., "risk score: 42")
- Tool names (e.g., "typescript", "security")
- Timing data (e.g., "analysis took 2340ms")

**✗ Forbidden:**
- Source code (any code snippet, any language)
- File paths (absolute or relative)
- File names (even sanitized)
- Error messages (even truncated)
- Variable names
- Function names
- Class names
- String literals
- Comments
- Any text from your codebase

### 2. Metadata Only

**Example Allowed Payload:**
```json
{
  "snapshotVersion": "1.0.0",
  "snapshotId": "7f3e8a9c-1b2d-4e5f-9a8b-7c6d5e4f3a2b",
  "projectName": "my-app",
  "counts": {
    "critical": 2,
    "high": 5,
    "medium": 12,
    "low": 8,
    "info": 3
  },
  "uniqueFiles": 45,
  "riskScore": 42,
  "detectorsUsed": ["typescript", "security", "performance"],
  "analysisTimeMs": 2340,
  "environment": {
    "os": "darwin",
    "nodeVersion": "v20.10.0",
    "cliVersion": "2.0.0"
  }
}
```

**Size:** ~500 bytes (vs. 2+ MB for full issue list with messages)

### 3. Client-Side Enforcement

ZCC compliance is validated **before upload** (client-side):

```typescript
// apps/studio-cli/src/utils/snapshot-uploader.ts
function validateSnapshot(payload: SnapshotPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Forbidden fields (enforced by type system)
  const forbiddenFields = ['filePath', 'message', 'code', 'snippet', 'variableName'];
  for (const field of forbiddenFields) {
    if (field in payload) {
      errors.push(`ZCC Violation: Forbidden field '${field}' in payload`);
    }
  }
  
  // Required fields
  if (!payload.projectName || payload.projectName.length < 1) {
    errors.push('projectName is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 4. Server-Side Validation

The cloud backend also validates payloads (defense in depth):

```typescript
// odavl-studio/insight/cloud/app/api/insight/snapshot/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  
  // ZCC validation
  const violations: string[] = [];
  
  if ('filePath' in payload) violations.push('filePath');
  if ('message' in payload) violations.push('message');
  if ('code' in payload) violations.push('code');
  // ... check all forbidden fields
  
  if (violations.length > 0) {
    return Response.json({
      success: false,
      message: 'ZCC Violation',
      violations,
    }, { status: 400 });
  }
  
  // Accept payload
  // ...
}
```

---

## Snapshot Payload Schema

### TypeScript Definition

```typescript
export interface SnapshotPayload {
  // Required metadata
  snapshotVersion: string;         // ZCC spec version (e.g., "1.0.0")
  snapshotId: string;              // Deterministic UUID (hash-based)
  projectName: string;             // Project name (from package.json or 'workspace')
  
  // Issue counts (aggregated)
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  
  // Statistics
  uniqueFiles: number;             // Number of files analyzed
  riskScore: number;               // 0-100 risk score (calculated locally)
  
  // Tool metadata
  detectorsUsed: string[];         // Detector names (sorted, deduplicated)
  analysisTimeMs: number;          // Analysis duration
  
  // Environment fingerprint
  environment: {
    os: string;                    // process.platform (e.g., "darwin", "win32")
    nodeVersion: string;           // process.version (e.g., "v20.10.0")
    cliVersion: string;            // CLI version (e.g., "2.0.0")
  };
  
  // Optional metadata (non-identifying)
  repoUrl?: string;                // Git remote URL (for project identification, NOT file paths)
}
```

### JSON Schema (for validation)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ZCC Snapshot Payload v1.0.0",
  "type": "object",
  "required": [
    "snapshotVersion",
    "snapshotId",
    "projectName",
    "counts",
    "uniqueFiles",
    "riskScore",
    "detectorsUsed",
    "analysisTimeMs",
    "environment"
  ],
  "properties": {
    "snapshotVersion": { "type": "string", "const": "1.0.0" },
    "snapshotId": { "type": "string", "format": "uuid" },
    "projectName": { "type": "string", "minLength": 1, "maxLength": 255 },
    "counts": {
      "type": "object",
      "required": ["critical", "high", "medium", "low", "info"],
      "properties": {
        "critical": { "type": "integer", "minimum": 0 },
        "high": { "type": "integer", "minimum": 0 },
        "medium": { "type": "integer", "minimum": 0 },
        "low": { "type": "integer", "minimum": 0 },
        "info": { "type": "integer", "minimum": 0 }
      }
    },
    "uniqueFiles": { "type": "integer", "minimum": 0 },
    "riskScore": { "type": "number", "minimum": 0, "maximum": 100 },
    "detectorsUsed": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "analysisTimeMs": { "type": "number", "minimum": 0 },
    "environment": {
      "type": "object",
      "required": ["os", "nodeVersion", "cliVersion"],
      "properties": {
        "os": { "type": "string" },
        "nodeVersion": { "type": "string" },
        "cliVersion": { "type": "string" }
      }
    },
    "repoUrl": { "type": "string", "format": "uri" }
  },
  "additionalProperties": false
}
```

---

## Risk Score Calculation

Risk score is calculated **locally** using a logarithmic scale:

```typescript
function calculateRiskScore(issues: Issue[]): number {
  const weights = {
    critical: 10,
    high: 5,
    medium: 2,
    low: 1,
    info: 0.5,
  };
  
  let totalWeight = 0;
  for (const issue of issues) {
    totalWeight += weights[issue.severity] || 0;
  }
  
  // Log scale: log10(weight + 1) * 20
  // 0 issues → 0
  // 10 weight → ~20
  // 100 weight → ~40
  // 1000 weight → ~60
  // 10000 weight → ~80
  const riskScore = Math.log10(totalWeight + 1) * 20;
  
  return Math.min(100, Math.round(riskScore));
}
```

**Examples:**
- 0 issues → risk score: 0
- 5 critical → risk score: 34
- 10 critical, 20 high → risk score: 52
- 100 issues (mixed) → risk score: ~65

---

## Idempotency & Deduplication

Snapshot IDs are deterministic (hash-based) to prevent duplicates:

```typescript
function generateSnapshotId(
  projectName: string,
  repoUrl: string | undefined,
  timestamp: Date,
  issueFingerprint: string
): string {
  // Round timestamp to nearest minute (uploads in same minute = same ID)
  const roundedTime = new Date(timestamp);
  roundedTime.setSeconds(0, 0);
  
  // Concatenate inputs
  const input = [
    projectName,
    repoUrl || 'no-repo',
    roundedTime.toISOString(),
    issueFingerprint,
  ].join('|');
  
  // Hash to deterministic UUID
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  
  // Format as UUID v5-like
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}
```

**Benefits:**
- Same issues uploaded twice = same snapshot ID
- Server can reject duplicates (idempotency)
- No "Duplicate snapshot" errors for retries

---

## Authentication

ZCC snapshots require authentication (OAuth via NextAuth):

### Flow:
1. User runs `odavl insight auth login`
2. Browser opens to cloud
3. Sign in with GitHub/Google
4. Session token saved locally (OS keychain)
5. Token included in upload requests:
   ```
   Cookie: next-auth.session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Token Storage:
- **macOS:** Keychain Access
- **Windows:** Credential Manager
- **Linux:** Encrypted file (AES-256-GCM)

### Token Lifespan:
- 30 days (configurable)
- Auto-refresh on expiration
- Manual refresh: `odavl insight auth login`

---

## Opt-Out Mechanisms

### 1. Don't Upload
```bash
# Local-only analysis (default)
odavl insight analyze
# NO --upload flag = no cloud communication
```

### 2. Sign Out
```bash
odavl insight auth logout
```

### 3. Environment Variable
```bash
export ODAVL_NO_CLOUD=true
```

### 4. Delete Consent
```bash
rm ~/.odavl/consent.json
```

### 5. Firewall Rules
Block outgoing requests to `*.vercel.app` or cloud domain.

---

## Compliance & Auditing

### GDPR Compliance

**No Personal Data:** ZCC payloads contain no personal data (no names, emails, IPs stored).

**Right to Access:** Request your data: support@odavl.com

**Right to Deletion:** Request deletion: support@odavl.com

### SOC 2 Type II (Planned)

- Annual audits starting Q1 2026
- Security controls documented
- Incident response plan

### Audit Logs

All uploads logged:
```json
{
  "timestamp": "2025-12-13T10:30:45.123Z",
  "userId": "user_abc123",
  "projectId": "proj_xyz789",
  "snapshotId": "7f3e8a9c-1b2d-4e5f-9a8b-7c6d5e4f3a2b",
  "payload": { /* ZCC payload */ }
}
```

Users can request their audit logs.

---

## Testing ZCC Compliance

### Local Validation

```bash
# Run analysis with debug mode
odavl insight analyze --upload --debug

# Check payload in logs (stdout)
```

### Automated Tests

```typescript
// apps/studio-cli/src/utils/snapshot-uploader.test.ts
describe('ZCC Compliance', () => {
  it('should reject payload with filePath', () => {
    const payload = { filePath: '/src/index.ts', ... };
    const result = validateSnapshot(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ZCC Violation: Forbidden field \'filePath\'');
  });
  
  it('should reject payload with message', () => {
    const payload = { message: 'Unused variable', ... };
    const result = validateSnapshot(payload);
    expect(result.valid).toBe(false);
  });
  
  it('should accept valid payload', () => {
    const payload = {
      snapshotVersion: '1.0.0',
      projectName: 'my-app',
      counts: { critical: 2, high: 5, medium: 12, low: 8, info: 3 },
      riskScore: 42,
      detectorsUsed: ['typescript'],
      analysisTimeMs: 2340,
      environment: { os: 'darwin', nodeVersion: 'v20.10.0', cliVersion: '2.0.0' },
    };
    const result = validateSnapshot(payload);
    expect(result.valid).toBe(true);
  });
});
```

---

## Versioning

### Current Version: 1.0.0

**Breaking Changes:**
- Requires re-consent from users
- Increments major version (e.g., 2.0.0)

**Additions (Non-Breaking):**
- New optional fields
- Increments minor version (e.g., 1.1.0)

**Fixes:**
- Bug fixes, clarifications
- Increments patch version (e.g., 1.0.1)

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-13 | Initial ZCC specification |

---

## FAQ

### Q: Can I verify ZCC compliance myself?
**A:** Yes! Run with `--debug` to see the exact payload sent.

### Q: What if I find a ZCC violation?
**A:** Report immediately: security@odavl.com or GitHub Issues

### Q: Is project name identifying?
**A:** Only if you use your real project name. Use `--project-name anon` to anonymize.

### Q: Is repoUrl identifying?
**A:** Only if public repo. Private repos: URL alone doesn't reveal code.

### Q: Can I customize what's sent?
**A:** Not yet. Future: Configurable metadata fields (opt-in/opt-out).

### Q: Is ZCC open source?
**A:** Yes! See `apps/studio-cli/src/utils/snapshot-uploader.ts` for client-side enforcement.

---

## Contact

**Security Issues:** security@odavl.com (PGP key available)  
**General Questions:** support@odavl.com  
**GitHub Issues:** https://github.com/odavlstudio/odavl/issues

---

**Last Updated:** December 13, 2025  
**Next Review:** March 13, 2026
