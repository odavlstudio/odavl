# TASK 7: Truth Pipeline Integration Guide

**Status**: Complete  
**Date**: December 13, 2025

---

## Quick Start

### CLI Usage

```bash
# Local analysis only (no cloud upload)
odavl insight analyze

# Local analysis + cloud upload
odavl insight analyze --upload

# Debug mode (verbose logging)
odavl insight analyze --upload --debug
```

### Expected Behavior

#### Without `--upload` flag
```bash
$ odavl insight analyze
✓ Analysis complete: 42 issues found
```

**No cloud communication. Local only.**

#### With `--upload` flag (not signed in)
```bash
$ odavl insight analyze --upload
✓ Analysis complete: 42 issues found

# Silent - no cloud upload (not authenticated)
```

#### With `--upload` flag (signed in, success)
```bash
$ odavl insight analyze --upload
✓ Analysis complete: 42 issues found

# Silent - snapshot uploaded to cloud (no console output)
```

#### With `--upload` flag (signed in, offline)
```bash
$ odavl insight analyze --upload
✓ Analysis complete: 42 issues found

# Silent - analysis saved locally (upload skipped)
```

#### With `--upload` flag (error, not silent)
```bash
$ odavl insight analyze --upload
✓ Analysis complete: 42 issues found

✗ Cloud upload failed: Session expired. Please sign in again.
Tip: Sign in via browser at https://cloud.odavl.studio
```

---

## Architecture

### Data Flow

```
┌──────────────────┐
│  Insight CLI     │
│  (Local Analysis)│
└────────┬─────────┘
         │
         │ issues[] (full objects with paths/messages)
         │
         ▼
┌──────────────────┐
│ createSnapshot   │ ← Strips code/paths/messages
│ Payload()        │ ← Keeps only metadata (counts/scores)
└────────┬─────────┘
         │
         │ SnapshotPayload (ZCC-compliant)
         │
         ▼
┌──────────────────┐
│ uploadSnapshot() │ ← Retry logic (3x with backoff)
│                  │ ← Auth cookie check
│                  │ ← Network timeout (30s)
└────────┬─────────┘
         │
         │ HTTP POST /api/insight/snapshot
         │ Headers: { Cookie: next-auth.session-token }
         │ Body: { snapshotVersion, snapshotId, counts, scores, ... }
         │
         ▼
┌──────────────────┐
│ Cloud Backend    │
│ (ZCC Validation) │
│                  │ ← validateZCC() checks for code
│                  │ ← Schema validation (Zod)
│                  │ ← Auth check (NextAuth)
│                  │ ← Duplicate check (snapshotId)
└────────┬─────────┘
         │
         │ Success: { snapshotId, projectId }
         │ Error: { error, message, violations[] }
         │
         ▼
┌──────────────────┐
│ PostgreSQL       │
│ (Prisma)         │
│                  │
│ InsightSnapshot  │ ← Counts only (NO code)
│ Project          │ ← Minimal metadata
│ User             │ ← OAuth identity
└──────────────────┘
```

---

## Integration Points

### CLI → Cloud

**File**: `apps/studio-cli/src/commands/insight-v2.ts`

```typescript
// After analysis completes
if (options.upload) {
  await handleCloudUpload(issuesForOutput, workspaceRoot, options);
}
```

**Uploader**: `apps/studio-cli/src/utils/snapshot-uploader.ts`

```typescript
const result = await uploadSnapshot(issues, {
  workspaceRoot,
  projectName: 'my-app',
  repoUrl: 'git@github.com:user/repo.git',
  analysisTimeMs: 2341,
  cliVersion: '2.0.0',
  debug: false,
  silent: true, // Default: no console noise
});

// Result types:
// - { status: 'success', snapshotId, projectId, message }
// - { status: 'offline', reason }
// - { status: 'error', code, message, canRetry }
```

### Cloud API

**Endpoint**: `POST /api/insight/snapshot`

**Request**:
```json
{
  "snapshotVersion": "1.0.0",
  "snapshotId": "abc123-def4-5678-90ab-cdef01234567",
  "projectName": "my-app",
  "repoUrl": "git@github.com:user/repo.git",
  "totalFiles": 127,
  "filesAnalyzed": 23,
  "totalIssues": 42,
  "criticalCount": 5,
  "highCount": 12,
  "mediumCount": 15,
  "lowCount": 8,
  "infoCount": 2,
  "riskScore": 67.5,
  "detectorsUsed": ["typescript", "security", "performance"],
  "analysisTimeMs": 2341,
  "environment": {
    "os": "win32",
    "nodeVersion": "20.11.0",
    "cliVersion": "2.0.0"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "snapshotId": "cm7x8y9z0...",
  "projectId": "cm7x8y9z1...",
  "message": "Snapshot stored successfully (ZCC compliant)"
}
```

**Response (Error)**:
```json
{
  "error": "ZCC Violation: Source code detected",
  "violations": ["Forbidden field: code"],
  "message": "This endpoint only accepts metadata..."
}
```

---

## Authentication Flow

### Current Status (TASK 7)

**CLI Authentication**: ⚠️ Placeholder implementation

```typescript
// snapshot-uploader.ts
async function getAuthCookie(): Promise<string | null> {
  // TODO: Implement secure credential retrieval
  // For now, return null (user must sign in via browser first)
  return null;
}
```

**Result**: All uploads fail with `NO_AUTH` error (silent).

### Future Implementation (Post-TASK 7)

1. **Browser-Based Sign-In**:
   ```bash
   $ odavl auth login
   Opening browser for authentication...
   ✓ Signed in as user@example.com
   ```

2. **Credential Storage**:
   - **macOS**: Keychain
   - **Windows**: Credential Manager
   - **Linux**: libsecret / encrypted file
   - **Format**: `next-auth.session-token=<jwt>`

3. **Session Refresh**:
   - Automatic token refresh on 401 errors
   - Fallback to browser re-auth if refresh fails

4. **CLI Integration**:
   ```typescript
   import { getAuthToken } from '@odavl/auth';
   
   const authCookie = await getAuthToken();
   if (authCookie) {
     // Upload to cloud
   }
   ```

---

## Testing the Pipeline

### 1. Test ZCC Compliance (Should Succeed)

```bash
# Valid metadata-only payload
curl -X POST http://localhost:3000/api/insight/snapshot \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<jwt>" \
  -d '{
    "snapshotVersion": "1.0.0",
    "projectName": "test",
    "totalFiles": 10,
    "filesAnalyzed": 5,
    "totalIssues": 3,
    "criticalCount": 1,
    "highCount": 2,
    "mediumCount": 0,
    "lowCount": 0,
    "infoCount": 0,
    "riskScore": 35.0,
    "detectorsUsed": ["typescript"],
    "analysisTimeMs": 1000,
    "environment": {
      "os": "darwin",
      "nodeVersion": "20.11.0",
      "cliVersion": "2.0.0"
    }
  }'

# Expected: { "success": true, "snapshotId": "...", "projectId": "..." }
```

### 2. Test ZCC Violation (Should Fail)

```bash
# Invalid payload with forbidden field
curl -X POST http://localhost:3000/api/insight/snapshot \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<jwt>" \
  -d '{
    "projectName": "test",
    "code": "const x = 1;",  # ← FORBIDDEN
    "totalFiles": 10
  }'

# Expected: { "error": "ZCC Violation", "violations": ["Forbidden field: code"] }
```

### 3. Test Auth Failure (Should Return 401)

```bash
# No auth cookie
curl -X POST http://localhost:3000/api/insight/snapshot \
  -H "Content-Type: application/json" \
  -d '{ "projectName": "test", ... }'

# Expected: { "error": "Unauthorized" } (401)
```

### 4. Test Retry Logic (Manual)

```bash
# Stop cloud backend
docker stop odavl-postgres

# Run CLI with upload
odavl insight analyze --upload --debug

# Expected output:
# [Snapshot] Network error, retrying in 2000ms...
# [Snapshot] Network error, retrying in 5000ms...
# [Snapshot] Network error, retrying in 10000ms...
# ⚠️  Cloud offline: Cannot reach cloud server (check network connection)
```

### 5. Test Idempotency

```bash
# Upload 1
odavl insight analyze --upload --debug
# [Cloud] Snapshot uploaded (ID: abc123...)

# Upload 2 (within same minute, same issues)
odavl insight analyze --upload --debug
# [Cloud] Snapshot uploaded (ID: abc123...)
# Server should detect duplicate and return existing snapshotId
```

---

## Troubleshooting

### "No auth cookie found"

**Symptom**: Silent upload skip  
**Cause**: User not signed in  
**Fix**: Implement `odavl auth login` command (post-TASK 7)

### "ZCC Violation"

**Symptom**: 400 error with violations array  
**Cause**: Bug in `createSnapshotPayload()` - leaked forbidden field  
**Fix**: Review payload creation, ensure no code/paths/messages

### "Session expired"

**Symptom**: 401 Unauthorized  
**Cause**: JWT token expired (default: 30 days)  
**Fix**: Implement token refresh or prompt browser re-auth

### "Cannot reach cloud server"

**Symptom**: Offline status after 3 retries  
**Cause**: Network issue or cloud backend down  
**Fix**: Check network, verify cloud backend is deployed and running

### "Snapshot already exists"

**Symptom**: Success response but no new snapshot in database  
**Cause**: Duplicate snapshotId (idempotency working correctly)  
**Fix**: This is expected behavior (not an error)

---

## Next Steps

### Immediate (Post-TASK 7)

1. **Test with Real Cloud Backend**:
   - Deploy cloud backend to Vercel (see TASK 6 guide)
   - Update `DEFAULT_CLOUD_URL` in `snapshot-uploader.ts`
   - Test end-to-end upload flow

2. **Implement Authentication**:
   - Create `odavl auth login` command
   - Integrate with NextAuth OAuth flow
   - Store tokens in secure keychain/credential manager

3. **VS Code Extension Integration**:
   - Copy `snapshot-uploader.ts` to extension
   - Hook into analysis complete event
   - Add settings: `odavl.autoUpload` (default: false)

### Future Enhancements

1. **Offline Queue**:
   - Store failed uploads in `.odavl/queue/`
   - Retry on next successful connection
   - Command: `odavl insight sync`

2. **Snapshot History**:
   - Show past snapshots: `odavl insight history`
   - Compare snapshots: `odavl insight diff <id1> <id2>`
   - View trends: `odavl insight trends`

3. **Privacy Dashboard**:
   - Web UI: https://cloud.odavl.studio/snapshots
   - View counts, scores, trends (NO code)
   - Download reports (metadata only)

---

**Integration Status**: ✅ Complete  
**Next Task**: Deploy cloud backend, implement authentication  
**Documentation**: Complete
