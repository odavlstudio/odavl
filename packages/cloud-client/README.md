# @odavl-studio/cloud-client

🚀 **Official TypeScript SDK for ODAVL Cloud Platform**

Connect your CLI tools to ODAVL Cloud for usage tracking, data sync, and cloud runner capabilities.

## Features

✅ **Authentication**: API Key + OAuth Device Flow  
✅ **Offline Queue**: Auto-retry failed requests when connection restored  
✅ **Usage Tracking**: Check quotas before operations  
✅ **Type-Safe**: Full TypeScript definitions  
✅ **Retry Logic**: Exponential backoff for network errors  
✅ **Secure**: AES-256-GCM encrypted credential storage  

## Installation

```bash
pnpm add @odavl-studio/cloud-client
```

## Quick Start

### 1. Authentication

```typescript
import { ODAVLCloudClient } from '@odavl-studio/cloud-client';

const client = new ODAVLCloudClient();

// Option A: API Key (for CI/CD)
await client.login('odavl_key_...');

// Option B: OAuth Device Flow (for interactive CLI)
const { userCode, verificationUri } = await client.loginDevice();
console.log(`Visit ${verificationUri} and enter code: ${userCode}`);
// Automatically polls for authorization...

// Check if authenticated
const isLoggedIn = await client.isAuthenticated();
```

### 2. Usage Tracking

```typescript
// Check quota before operation
const usage = await client.checkUsage('insightScans');
console.log(`${usage.used}/${usage.limit} scans used`);

if (usage.canContinue) {
  // Perform operation...
  
  // Increment usage after success
  await client.incrementUsage({
    resource: 'insightScans',
    quantity: 1,
    metadata: { workspaceId: '...' }
  });
}
```

### 3. Upload Insight Run

```typescript
await client.uploadInsightRun({
  workspaceId: 'my-project',
  detectors: ['typescript', 'eslint', 'security'],
  results: {
    issues: [...],
    metrics: {...}
  },
  timestamp: Date.now(),
  duration: 12500,
  cliVersion: '2.0.0'
});
```

### 4. Upload Autopilot Run

```typescript
await client.uploadAutopilotRun({
  workspaceId: 'my-project',
  phase: 'verify',
  metrics: {...},
  edits: [...],
  timestamp: Date.now(),
  duration: 5400,
  cliVersion: '2.0.0'
});
```

### 5. Upload Guardian Test

```typescript
await client.uploadGuardianTest({
  workspaceId: 'my-project',
  targetUrl: 'https://example.com',
  tests: ['accessibility', 'performance', 'security'],
  results: {...},
  timestamp: Date.now(),
  duration: 8200,
  cliVersion: '2.0.0'
});
```

### 6. Cloud Runner (Coming in Phase 2)

```typescript
// Create background job
const jobId = await client.createJob({
  type: 'insight-analysis',
  workspaceId: 'my-project',
  config: {...}
});

// Poll for status
const result = await client.waitForJob(jobId, (progress) => {
  console.log(`Progress: ${progress}%`);
});

console.log('Job completed:', result);
```

### 7. Offline Queue

```typescript
// Configure offline queue
const client = new ODAVLCloudClient({
  offlineQueue: true  // Enabled by default
});

// When offline, requests are queued automatically
await client.uploadInsightRun({...}); // Queued if offline

// Later, when back online:
const { success, failed } = await client.syncOfflineQueue();
console.log(`Synced ${success} requests, ${failed} failed`);
```

## Configuration

```typescript
const client = new ODAVLCloudClient({
  baseUrl: 'https://api.odavl.io',  // Default: production
  apiKey: 'odavl_key_...',           // Optional: env var used if not provided
  offlineQueue: true,                // Default: true
  retry: {
    retries: 3,                      // Default: 3
    retryDelay: 1000                 // Default: 1000ms
  },
  timeout: 30000,                    // Default: 30 seconds
  debug: false                       // Default: false
});
```

## Environment Variables

```bash
ODAVL_API_KEY=odavl_key_...        # Auto-detected by SDK
ODAVL_BASE_URL=https://api.odavl.io
```

## Error Handling

```typescript
import {
  AuthenticationError,
  QuotaExceededError,
  NetworkError,
  ValidationError,
  RateLimitError
} from '@odavl-studio/cloud-client';

try {
  await client.uploadInsightRun({...});
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Please login: odavl login');
  } else if (error instanceof QuotaExceededError) {
    console.error(`Quota exceeded. Upgrade: ${error.upgradeUrl}`);
  } else if (error instanceof NetworkError) {
    console.log('Request queued for retry when online');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  }
}
```

## Credential Storage

Credentials are stored encrypted at `~/.odavl/credentials.json` using:
- **Encryption**: AES-256-GCM
- **Password**: Derived from machine ID + hostname
- **Format**: `{ apiKey?, accessToken?, refreshToken?, expiresAt? }`

```typescript
import { CredentialStore } from '@odavl-studio/cloud-client';

const store = new CredentialStore();

// Save credentials
await store.save({
  apiKey: 'odavl_key_...',
  accessToken: 'eyJ...',
  refreshToken: 'refresh_...',
  expiresAt: Date.now() + 3600000
});

// Load credentials
const creds = await store.load();

// Clear credentials
await store.clear();

// Check if credentials exist
const exists = await store.exists();
```

## API Reference

### `ODAVLCloudClient`

**Authentication**
- `login(apiKey: string): Promise<void>`
- `loginDevice(): Promise<DeviceAuthResponse>`
- `logout(): Promise<void>`
- `isAuthenticated(): Promise<boolean>`

**Usage Tracking**
- `checkUsage(resource): Promise<UsageCheckResponse>`
- `incrementUsage(payload): Promise<void>`

**Insight API**
- `uploadInsightRun(payload): Promise<string>`

**Autopilot API**
- `uploadAutopilotRun(payload): Promise<string>`

**Guardian API**
- `uploadGuardianTest(payload): Promise<string>`

**Cloud Runner** (Phase 2)
- `createJob(payload): Promise<string>`
- `getJobStatus(jobId): Promise<JobStatusResponse>`
- `waitForJob(jobId, onProgress?): Promise<JobStatusResponse>`

**Offline Queue**
- `syncOfflineQueue(): Promise<{ success: number; failed: number }>`
- `getQueueSize(): number`
- `clearQueue(): Promise<void>`

## TypeScript Types

All types are exported:

```typescript
import type {
  CloudClientConfig,
  InsightRunPayload,
  AutopilotRunPayload,
  GuardianTestPayload,
  UsageCheckResponse,
  UsageIncrementPayload,
  JobCreatePayload,
  JobStatusResponse,
  ApiResponse
} from '@odavl-studio/cloud-client';
```

## License

MIT

## Support

- Documentation: https://docs.odavl.io
- Issues: https://github.com/odavl/odavl-studio/issues
- Discord: https://discord.gg/odavl
