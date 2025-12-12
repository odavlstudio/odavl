# Guardian Cloud - LOCKED BASELINE Configuration

**Date**: December 6, 2025 23:30 UTC+1  
**Status**: ✅ **100% OPERATIONAL** - DO NOT MODIFY  
**Purpose**: Reference configuration for Autopilot alignment

---

## Guardian next.config.mjs (WORKING VERSION)

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // API routes only - no pages
  experimental: {
    appDir: true,
  },
  
  // Transpile workspace packages
  transpilePackages: [
    '@odavl/oplayer',
    '@odavl-studio/guardian-core',
    '@odavl-studio/sdk',
    '@odavl-studio/insight-core'
  ],

  webpack(config) {
    // Direct path resolution to bypass pnpm symlinks (exact match removed for stability)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@odavl-studio/guardian-core': path.resolve(__dirname, '../../odavl-studio/guardian/core/dist'),
      '@odavl-studio/sdk': path.resolve(__dirname, '../../packages/sdk/dist'),
      '@odavl/oplayer/protocols': path.resolve(__dirname, '../../packages/op-layer/dist/protocols.js'),
      '@odavl/oplayer/types': path.resolve(__dirname, '../../packages/op-layer/dist/types.js'),
      '@odavl/oplayer': path.resolve(__dirname, '../../packages/op-layer/dist'),
      '@odavl-studio/insight-core': path.resolve(__dirname, '../../odavl-studio/insight/core/dist'),
    };
    return config;
  },
};

export default nextConfig;
```

**Key Points**:
- ✅ NO `$` suffix on aliases (exact match breaks Guardian)
- ✅ Sub-exports point to `.js` files (`oplayer/protocols`, `oplayer/types`)
- ✅ Main packages point to `dist` folders

---

## Guardian API Route - Initialization Pattern

**File**: `apps/guardian-cloud/app/api/audit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GuardianProtocol } from '@odavl/oplayer/protocols';
import type { GuardianAuditRequest, GuardianAuditResult } from '@odavl/oplayer/types';
import { z } from 'zod';
import { initializeGuardianCloud } from '../../lib/init';

// Initialize Guardian adapter once on server startup (singleton pattern)
initializeGuardianCloud();  // ← CRITICAL: Top of file initialization

export async function GET() {
  const isInitialized = GuardianProtocol.isAdapterRegistered();
  
  if (!isInitialized) {
    return NextResponse.json(
      { status: 'not-initialized', adapter: null },
      { status: 503 }
    );
  }

  const metadata = GuardianProtocol.getAdapterMetadata();
  return NextResponse.json({
    service: 'ODAVL Guardian Cloud API',
    version: '1.0.0',
    status: 'healthy',
    adapter: metadata,
    timestamp: new Date().toISOString(),
  });
}
```

**Key Points**:
- ✅ `initializeGuardianCloud()` called at TOP OF FILE (not in function)
- ✅ Health check via `GuardianProtocol.isAdapterRegistered()`
- ✅ Returns 503 if not initialized

---

## Guardian Initialization Logic

**File**: `apps/guardian-cloud/app/lib/init.ts`

```typescript
import { GuardianProtocol } from '@odavl/oplayer/protocols';
import { GuardianPlaywrightAdapter } from '@odavl/oplayer';

let isInitialized = false;

export function initializeGuardianCloud(): void {
  if (isInitialized) {
    console.log('[Guardian Cloud] Already initialized - skipping');
    return;
  }

  console.log('[Guardian Cloud] Initializing GuardianProtocol adapter...');

  try {
    // Register Playwright adapter for website audits
    const adapter = new GuardianPlaywrightAdapter();
    GuardianProtocol.registerAdapter(adapter);

    const meta = GuardianProtocol.getAdapterMetadata();
    console.log('[Guardian Cloud] Registered adapter:', meta.name, meta.version);
    console.log('[Guardian Cloud] Supported audit kinds:', meta.supportedKinds.join(', '));

    // Performance hooks (optional monitoring)
    GuardianProtocol.on('before', (ctx) => {
      console.log('[Guardian Cloud] Audit started:', ctx.request);
    });

    GuardianProtocol.on('after', (ctx) => {
      console.log('[Guardian Cloud] Audit completed:', ctx.duration);
    });

    isInitialized = true;
  } catch (error) {
    console.error('[Guardian Cloud] Initialization failed:', error);
    throw error;
  }
}
```

**Key Points**:
- ✅ Singleton pattern (`isInitialized` flag)
- ✅ Adapter registration via `GuardianProtocol.registerAdapter()`
- ✅ Performance hooks for monitoring
- ✅ Error handling with throw (fails fast)

---

## Health Check Response (Working)

**Request**: `GET http://localhost:3002/api/audit`  
**Response**: `200 OK`

```json
{
  "service": "ODAVL Guardian Cloud API",
  "version": "1.0.0",
  "status": "healthy",
  "adapter": {
    "name": "GuardianPlaywrightAdapter",
    "version": "1.0.0",
    "supportedKinds": [
      "quick", "full", "accessibility",
      "performance", "security", "seo",
      "visual", "e2e"
    ]
  },
  "timestamp": "2025-12-06T22:11:03.216Z"
}
```

---

## 🔒 LOCKED - DO NOT MODIFY

**Guardian is the BASELINE**. Any changes to Autopilot/Hub must NOT affect Guardian.

**Use this configuration as reference** for:
1. Webpack alias structure
2. Initialization pattern
3. Protocol registration
4. Health check implementation

---

**Verified Working**: December 6, 2025 23:11 UTC+1  
**Status**: ✅ Stable, reproducible, 200 OK
