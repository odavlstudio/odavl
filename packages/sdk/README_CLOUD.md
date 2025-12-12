# ODAVL Studio SDK

**Official SDK for ODAVL Studio** - Integrate code analysis, self-healing, and website testing into your applications.

## Phase 3C: Cloud-Ready Architecture 🚀

The SDK automatically detects your environment and chooses the best execution path:

- **✅ Local OPLayer** → Direct protocol access (fastest, offline-ready)
- **☁️ Cloud API** → HTTP fallback (works anywhere, no installation needed)

---

## Installation

```bash
# npm
npm install @odavl-studio/sdk

# pnpm
pnpm add @odavl-studio/sdk

# yarn
yarn add @odavl-studio/sdk
```

**Optional:** Install `@odavl/oplayer` for local-first execution:

```bash
pnpm add @odavl/oplayer @odavl-studio/insight-core
```

---

## Quick Start

### Smart Client (Recommended)

Auto-detects local OPLayer and falls back to Cloud API:

```typescript
import { getSmartClient } from '@odavl-studio/sdk';

// Initialize SDK
const sdk = getSmartClient({
  // Optional: Cloud API URLs (default: localhost)
  insightUrl: 'https://insight.odavl.studio',
  guardianUrl: 'https://guardian.odavl.studio',
  autopilotUrl: 'https://autopilot.odavl.studio',
  
  // Optional: API key for cloud services
  apiKey: process.env.ODAVL_API_KEY,
});

await sdk.initialize();

// 1. Code Analysis (Insight)
const analysisResult = await sdk.analyze({
  workspaceRoot: '/path/to/your/project',
  detectors: ['typescript', 'eslint', 'security'],
  enabledOnly: false,
});

console.log(`Found ${analysisResult.issues.length} issues`);
console.log(`Critical: ${analysisResult.summary.bySeverity.critical}`);

// 2. Website Audit (Guardian)
const auditResult = await sdk.audit({
  url: 'https://your-website.com',
  kind: 'full',
  browsers: ['chromium', 'firefox'],
  devices: ['desktop', 'mobile'],
});

console.log(`Overall Score: ${auditResult.scores.overall}/100`);
console.log(`Accessibility: ${auditResult.scores.accessibility}/100`);

// 3. Self-Healing (Autopilot)
const fixResult = await sdk.fix({
  workspaceRoot: '/path/to/your/project',
  mode: 'loop', // observe → decide → act → verify → learn
  maxFiles: 10,
  maxLOC: 40,
});

console.log(`Fixed issues:`, fixResult);

// 4. Health Check
const health = await sdk.healthCheck();
console.log(`Using local: ${health.local}`);
console.log(`Cloud services:`, health.cloud);
```

---

## Cloud-Only Mode

Force cloud API usage (skip local detection):

```typescript
import { getSmartClient } from '@odavl-studio/sdk';

const sdk = getSmartClient({
  forceCloud: true, // Always use cloud APIs
  insightUrl: 'https://insight.odavl.studio',
  guardianUrl: 'https://guardian.odavl.studio',
  autopilotUrl: 'https://autopilot.odavl.studio',
  apiKey: process.env.ODAVL_API_KEY,
});

await sdk.initialize();

// All calls go through Cloud API
const result = await sdk.analyze({ workspaceRoot: process.cwd() });
```

---

## Direct Cloud Client

Use Cloud API directly (no auto-detection):

```typescript
import { getCloudClient } from '@odavl-studio/sdk/cloud-client';

const client = getCloudClient({
  insightUrl: 'https://insight.odavl.studio',
  guardianUrl: 'https://guardian.odavl.studio',
  autopilotUrl: 'https://autopilot.odavl.studio',
  apiKey: process.env.ODAVL_API_KEY,
  timeout: 60000, // 60 seconds
  enableRetry: true,
  maxRetries: 3,
});

// Direct API calls
const analysis = await client.analyze({
  workspaceRoot: '/path/to/project',
  detectors: ['typescript', 'security'],
});

const audit = await client.audit({
  url: 'https://example.com',
  kind: 'accessibility',
});

const fix = await client.fix({
  workspaceRoot: '/path/to/project',
  mode: 'observe',
});
```

---

## Environment Variables

Configure cloud services via environment variables:

```bash
# Cloud API URLs
INSIGHT_CLOUD_URL=https://insight.odavl.studio
GUARDIAN_CLOUD_URL=https://guardian.odavl.studio
AUTOPILOT_CLOUD_URL=https://autopilot.odavl.studio

# API Key (for authentication)
ODAVL_API_KEY=your_api_key_here
```

---

## API Reference

### SmartClient

#### `analyze(request: AnalysisRequest): Promise<AnalysisSummary>`

Analyze workspace for code issues.

**Request:**
```typescript
{
  workspaceRoot: string;          // Path to project
  detectors?: string[];           // ['typescript', 'eslint', 'security', ...]
  enabledOnly?: boolean;          // Default: false
}
```

**Response:**
```typescript
{
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    file: string;
    line: number;
    detector: string;
  }>;
  summary: {
    total: number;
    bySeverity: { critical, high, medium, low };
    byDetector: Record<string, number>;
  };
}
```

---

#### `audit(request: GuardianAuditRequest): Promise<GuardianAuditResult>`

Audit website for quality, accessibility, performance, and security.

**Request:**
```typescript
{
  url: string;                                    // Website URL
  kind: 'quick' | 'full' | 'accessibility' | 'performance' | 'security' | 'seo';
  browsers?: ['chromium', 'firefox', 'webkit'];   // Default: ['chromium']
  devices?: ['desktop', 'mobile', 'tablet'];      // Default: ['desktop']
  timeout?: number;                               // Default: 30000
}
```

**Response:**
```typescript
{
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'accessibility' | 'performance' | 'security' | 'seo';
    message: string;
    element?: string;
  }>;
  scores: {
    overall: number;          // 0-100
    accessibility: number;
    performance: number;
    seo: number;
    security: number;
  };
}
```

---

#### `fix(request: AutopilotRequest): Promise<AutopilotResult>`

Execute self-healing code fixes.

**Request:**
```typescript
{
  workspaceRoot: string;
  mode?: 'observe' | 'decide' | 'act' | 'verify' | 'learn' | 'loop';  // Default: 'loop'
  maxFiles?: number;        // Default: 10
  maxLOC?: number;          // Default: 40
  recipe?: string;          // Optional: specific recipe to execute
}
```

**Response:**
```typescript
{
  observe?: { totalIssues, eslint, typescript };
  decide?: { recipe };
  act?: { actionsExecuted, errors };
  verify?: { gatesPassed, deltas, attestation };
  learn?: { message, trustUpdated };
}
```

---

## Local Development

Run cloud services locally:

```bash
# Terminal 1: Insight Cloud
cd apps/insight-cloud
pnpm dev  # Port 3001

# Terminal 2: Guardian Cloud
cd apps/guardian-cloud
pnpm dev  # Port 3002

# Terminal 3: Autopilot Cloud
cd apps/autopilot-cloud
pnpm dev  # Port 3003
```

SDK will auto-detect localhost services:
- Insight: `http://localhost:3001`
- Guardian: `http://localhost:3002`
- Autopilot: `http://localhost:3003`

---

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  AnalysisRequest,
  AnalysisSummary,
  GuardianAuditRequest,
  GuardianAuditResult,
  SmartClientConfig,
  CloudConfig,
} from '@odavl-studio/sdk';
```

---

## License

MIT © ODAVL Studio Team

---

## Links

- [Documentation](https://docs.odavl.studio)
- [GitHub](https://github.com/odavlstudio/odavl)
- [Cloud Dashboard](https://odavl.studio)
