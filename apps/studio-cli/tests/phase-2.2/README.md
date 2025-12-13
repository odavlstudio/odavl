# Phase 2.2 Verification Tests

Production-grade verification tests for ODAVL Insight Cloud CLI components.

## Overview

These are **behavioral + integration tests** (not just unit tests) that validate real-world usage patterns, error handling, and production guarantees.

**62 tests** covering:
- HTTP Client (10 tests)
- Authentication Flow (8 tests)
- Analysis Upload (11 tests)
- Offline Queue (13 tests)
- Sync Command (8 tests)
- Privacy Sanitization (12 tests)

## Quick Start

### Run All Tests

```bash
# From apps/studio-cli directory
pnpm exec tsx tests/phase-2.2/run-all.ts
```

### Run Individual Test Suites

```bash
# HTTP Client
pnpm exec tsx tests/phase-2.2/verify-http-client.ts

# Auth Flow
pnpm exec tsx tests/phase-2.2/verify-auth-flow.ts

# Analysis Upload
pnpm exec tsx tests/phase-2.2/verify-analysis-upload.ts

# Offline Queue
pnpm exec tsx tests/phase-2.2/verify-offline-queue.ts

# Sync Command
pnpm exec tsx tests/phase-2.2/verify-sync-command.ts

# Privacy Sanitization
pnpm exec tsx tests/phase-2.2/verify-privacy-sanitization.ts
```

## Test Output

**Success**:
```
🧪 Phase 2.2 Verification Tests
Testing all Phase 2.2 components

═══════════════════════════════════════════════════════════

HTTP Client Verification
────────────────────────────────────────────────────────────
  ✓ Retry logic triggers on 429 (rate limit) (125ms)
  ✓ Token injection in Authorization header (15ms)
  ✓ Network error detection (ECONNREFUSED) (38ms)
  ...
────────────────────────────────────────────────────────────
✓ All tests passed (10/10)

📊 Verification Summary
═══════════════════════════════════════════════════════════
✓ HTTP Client Verification: 10/10
✓ Authentication Flow Verification: 8/8
✓ Analysis Upload Verification: 11/11
✓ Offline Queue Verification: 13/13
✓ Sync Command Verification: 8/8
✓ Privacy Sanitization Verification: 12/12

Total: 62/62 tests passed
Duration: 2,456ms

✓ All tests passed!
```

**Failure**:
```
HTTP Client Verification
────────────────────────────────────────────────────────────
  ✓ Retry logic triggers on 429 (rate limit) (125ms)
  ✗ Token injection in Authorization header (15ms)
    Assertion failed: Token should be in Authorization header
────────────────────────────────────────────────────────────
✗ 1 test(s) failed (9/10 passed)

✗ 1 test(s) failed
```

## Test Structure

### Files

```
tests/phase-2.2/
├── test-utils.ts                      # Test infrastructure (320 lines)
├── verify-http-client.ts              # HTTP client tests (10 tests)
├── verify-auth-flow.ts                # Auth flow tests (8 tests)
├── verify-analysis-upload.ts          # Upload tests (11 tests)
├── verify-offline-queue.ts            # Queue tests (13 tests)
├── verify-sync-command.ts             # Sync tests (8 tests)
├── verify-privacy-sanitization.ts     # Privacy tests (12 tests)
├── run-all.ts                         # Test runner
└── README.md                          # This file
```

### Test Utilities

**Core Functions**:
- `runSuite(name, tests)` - Execute test suite
- `runTest(name, fn)` - Execute single test
- `assert(condition, message)` - Basic assertion
- `assertEquals(actual, expected)` - Equality check
- `createTempWorkspace()` - Isolated test workspace
- `cleanupTempWorkspace(path)` - Cleanup after tests

**Mock Helpers**:
- `MockResponse` - HTTP response builder
- `createMockFetch(responses)` - Mock fetch function
- `waitFor(condition, timeout)` - Async waiter

## Test Coverage

### HTTP Client (10 tests)
- ✅ Retry on 429/503 with exponential backoff
- ✅ Token injection in Authorization header
- ✅ Network error detection (ECONNREFUSED)
- ✅ Timeout handling
- ✅ No retry on 4xx errors (except 429)

### Authentication (8 tests)
- ✅ Login stores token in `.odavl/auth.json`
- ✅ Logout deletes token
- ✅ Status reads token correctly
- ✅ Multiple login/logout cycles

### Analysis Upload (11 tests)
- ✅ Small payload → direct JSON upload
- ✅ Large payload → SARIF S3 upload
- ✅ OFFLINE detection and error handling
- ✅ skipQueue prevents infinite loop

### Offline Queue (13 tests)
- ✅ JSONL append-only storage (crash-safe)
- ✅ Corruption tolerance (skips malformed lines)
- ✅ Max 3 retry attempts
- ✅ Persistence across process restart

### Sync Command (8 tests)
- ✅ Removes successfully synced entries
- ✅ Stops on OFFLINE result
- ✅ Marks as failed after 3 attempts
- ✅ Accurate summary stats

### Privacy Sanitization (12 tests)
- ✅ Removes absolute paths
- ✅ Removes usernames
- ✅ Sanitizes variable names
- ✅ Removes code snippets
- ✅ Preserves relative structure

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run Phase 2.2 verification tests
  run: pnpm exec tsx tests/phase-2.2/run-all.ts
  working-directory: apps/studio-cli
```

### Pre-Commit Hook

```bash
#!/bin/bash
cd apps/studio-cli
pnpm exec tsx tests/phase-2.2/run-all.ts
```

## Test Philosophy

1. **Behavioral Testing**: Test WHAT happens, not HOW
2. **Real Filesystems**: Use temporary workspaces, not in-memory mocks
3. **Error Paths**: Every error scenario tested
4. **Boundary Conditions**: Test exact thresholds (5000 issues, 5MB)
5. **Isolation**: Each test creates its own workspace

## Adding New Tests

```typescript
import { runSuite, assert, assertEquals } from './test-utils.js';

export async function verifyNewFeature() {
  const tests = [
    {
      name: 'Feature works correctly',
      fn: async () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = await myFunction(input);
        
        // Assert
        assertEquals(result, 'expected', 'Should return expected value');
      },
    },
  ];

  return await runSuite('New Feature Verification', tests);
}
```

## Troubleshooting

**Tests failing on Windows**:
- Ensure PowerShell 7+ is installed (not Windows PowerShell 5.x)
- Check file paths use forward slashes (`/`) not backslashes (`\`)

**Tests timing out**:
- Default timeout is 5000ms per test
- Increase timeout in `test-utils.ts` if needed

**Cleanup errors**:
- Tests create temporary workspaces in `os.tmpdir()`
- Old workspaces auto-cleaned up on next run

## Documentation

See [PHASE_2.2_TASK_8_VERIFICATION_SUMMARY.md](../../PHASE_2.2_TASK_8_VERIFICATION_SUMMARY.md) for comprehensive documentation.

---

**Questions?** Check the verification summary document or Phase 2.2 status report.
