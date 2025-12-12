# Phase 3C - Autopilot Diagnostic Report

**Date**: December 6, 2025 23:45 UTC+1  
**Goal**: Debug why Autopilot Cloud fails with ModuleParseError while Guardian works perfectly  
**Status**: ❌ **UNRESOLVED** - Root cause identified but solution unclear

---

## Executive Summary

**Guardian Cloud**: ✅ **100% OPERATIONAL** (locked baseline, never touched)  
**Autopilot Cloud**: ❌ **FAILED** - ModuleParseError persists despite matching Guardian's exact configuration  
**Root Cause**: Webpack attempting to load HTML file instead of JavaScript module

---

## 🔬 PHASE 1: Guardian Locked Baseline

### Files Backed Up
1. `apps/guardian-cloud/next.config.mjs` - Working webpack alias configuration
2. `apps/guardian-cloud/app/api/audit/route.ts` - Initialization pattern
3. `apps/guardian-cloud/app/lib/init.ts` - Protocol adapter registration

**Backup Location**: `GUARDIAN_LOCKED_BASELINE.md`

**Guardian Health Check** (verified working):
```json
{
  "service": "ODAVL Guardian Cloud API",
  "version": "1.0.0",
  "status": "healthy",
  "adapter": {
    "name": "GuardianPlaywrightAdapter",
    "version": "1.0.0",
    "supportedKinds": ["quick", "full", "accessibility", "performance", "security", "seo", "visual", "e2e"]
  },
  "timestamp": "2025-12-06T22:11:03.216Z"
}
```

**Status**: ✅ Guardian remained stable throughout entire diagnostic session

---

## 🔬 PHASE 2: Module Resolution Diagnostic

### Node.js Resolution Test

**Script**: `apps/autopilot-cloud/autopilot-log-resolve.js`

**Results**:
```
✅ RESOLVED: @odavl-studio/autopilot-engine
   → C:\Users\sabou\dev\odavl\odavl-studio\autopilot\engine\dist\index.js

✅ RESOLVED: @odavl/oplayer
   → C:\Users\sabou\dev\odavl\packages\op-layer\dist\index.cjs

✅ RESOLVED: @odavl/oplayer/protocols
   → C:\Users\sabou\dev\odavl\packages\op-layer/dist/protocols.cjs

✅ RESOLVED: @odavl/oplayer/types
   → C:\Users\sabou\dev\odavl\packages\op-layer\dist\types.cjs

❌ FAILED: @odavl-studio/sdk
   Error: Cannot find module '@odavl-studio/sdk'

❌ FAILED: @odavl-studio/guardian-core
   Error: Cannot find module '@odavl-studio/guardian-core'
```

### 🔥 CRITICAL DISCOVERY #1

**Node.js resolves `oplayer` to `.cjs` files (CommonJS), but Guardian uses `.js` files (ESM)!**

This mismatch suggests Webpack and Node.js resolution strategies differ fundamentally.

---

## 🔬 PHASE 3: Webpack Alias Iterations

### Attempt 1: Match Node.js Resolution (.cjs files)

**Configuration**:
```javascript
webpack(config, { isServer }) {
  config.resolve.alias = {
    '@odavl-studio/autopilot-engine': '../../odavl-studio/autopilot/engine/dist/index.js',
    '@odavl/oplayer/protocols': '../../packages/op-layer/dist/protocols.cjs', // ← .cjs
    '@odavl/oplayer/types': '../../packages/op-layer/dist/types.cjs',       // ← .cjs
    '@odavl/oplayer': '../../packages/op-layer/dist/index.cjs',              // ← .cjs
  };
}
```

**Result**: ❌ **ModuleParseError: Unexpected token <!doctype html>**

---

### Attempt 2: Match Guardian Exactly (.js files)

**Configuration**:
```javascript
webpack(config, { isServer }) {
  config.resolve.alias = {
    '@odavl-studio/autopilot-engine': '../../odavl-studio/autopilot/engine/dist/index.js',
    '@odavl/oplayer/protocols': '../../packages/op-layer/dist/protocols.js', // ← .js (Guardian)
    '@odavl/oplayer/types': '../../packages/op-layer/dist/types.js',       // ← .js (Guardian)
    '@odavl/oplayer': '../../packages/op-layer/dist/index.js',              // ← .js (Guardian)
  };
}
```

**Result**: ❌ **ModuleParseError: Unexpected token <!doctype html>**

---

### 🔥 CRITICAL DISCOVERY #2

**The exact same Webpack alias strategy that works for Guardian FAILS for Autopilot!**

This proves the issue is **NOT** in the alias configuration itself, but in:
1. How Autopilot imports modules (static import)
2. Autopilot-specific Next.js configuration
3. Difference in API route structure

---

## 🔬 PHASE 4: Import Strategy Comparison

### Guardian (WORKING) ✅

**API Route**: `apps/guardian-cloud/app/api/audit/route.ts`
```typescript
import { GuardianProtocol } from '@odavl/oplayer/protocols';
import type { GuardianAuditRequest, GuardianAuditResult } from '@odavl/oplayer/types';
import { initializeGuardianCloud } from '../../lib/init';

// Initialize Guardian adapter once on server startup (singleton pattern)
initializeGuardianCloud();

export async function GET() {
  const isInitialized = GuardianProtocol.isAdapterRegistered();
  // ... returns 200 OK
}
```

**Key Points**:
- Static imports only
- Protocol-based architecture
- Initialization at top of file
- No dynamic imports

---

### Autopilot (FAILING) ❌

**API Route**: `apps/autopilot-cloud/app/api/fix/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// Changed from dynamic to static import to fix Webpack alias resolution
import * as autopilot from '@odavl-studio/autopilot-engine';

type AutopilotPhases = typeof autopilot;

export async function GET(): Promise<NextResponse> {
  // Check if autopilot engine is available (using static import at top)
  let engineAvailable = false;
  let engineFunctions: string[] = [];

  try {
    engineAvailable = typeof autopilot === 'object';
    engineFunctions = Object.keys(autopilot).filter(k => typeof autopilot[k as keyof typeof autopilot] === 'function');
  } catch (error) {
    console.error('[Autopilot Cloud] Engine check failed:', error);
    engineAvailable = false;
  }

  return NextResponse.json({
    service: 'ODAVL Autopilot Cloud API',
    status: engineAvailable ? 'healthy' : 'engine-not-available',
    engine: { available: engineAvailable, functions: engineFunctions },
  });
}
```

**Key Points**:
- Static import at top (changed from dynamic)
- Direct engine import (no protocol layer)
- Health check via object inspection
- **Result**: Still gets ModuleParseError!

---

## 🔍 Error Analysis

### Full Error Stack

```
ModuleParseError: Module parse failed: Unexpected token (1:0)
You may need an appropriate loader to handle this file type, 
currently no loaders are configured to process this file. 
See https://webpack.js.org/concepts#loaders

> <!doctype html>
| <html>
| <head>
```

**Interpretation**:
- Webpack is trying to load an **HTML file** as a JavaScript module
- This happens when Webpack resolves import to wrong file path
- Likely falling back to 404 error page or public HTML file

### Possible Root Causes

1. **Alias Not Applied**: Webpack ignoring alias configuration completely
2. **Import Order Issue**: Autopilot engine importing something that breaks resolution
3. **Circular Dependency**: Autopilot engine has circular imports
4. **transpilePackages Conflict**: `@odavl-studio/autopilot-engine` in transpilePackages interferes
5. **Next.js Cache**: .next cache corruption

---

## 📊 Configuration Comparison

| Aspect | Guardian (✅ Working) | Autopilot (❌ Failing) |
|--------|----------------------|------------------------|
| **Webpack Alias** | `.js` files | `.js` files (identical) |
| **Static Imports** | Yes (`oplayer/protocols`) | Yes (`autopilot-engine`) |
| **Dynamic Imports** | None | Originally yes, changed to static |
| **transpilePackages** | `oplayer`, `guardian-core`, `sdk`, `insight-core` | `oplayer`, `autopilot-engine`, `sdk`, `guardian-core` |
| **Initialization** | `initializeGuardianCloud()` at top | No initialization (engine direct) |
| **Protocol Layer** | Yes (`GuardianProtocol`) | No (direct engine import) |
| **Health Check** | `200 OK` | `500 ModuleParseError` |

---

## 🧪 Experiments Performed

### Experiment 1: .cjs vs .js Files
- **Hypothesis**: Webpack needs .cjs files (match Node.js resolution)
- **Result**: ❌ Failed - same error

### Experiment 2: Exact Guardian Configuration
- **Hypothesis**: Guardian's alias pattern works universally
- **Result**: ❌ Failed - Guardian works, Autopilot doesn't

### Experiment 3: Remove Dynamic Imports
- **Hypothesis**: Dynamic imports break Webpack alias resolution
- **Result**: ❌ Failed - static import still gets ModuleParseError

### Experiment 4: Diagnostic Logging
- **Added**: Console logging in webpack() function
- **Result**: ⏸️ No output captured yet (need to check CMD window)

---

## 💡 Hypotheses for Next Session

### Hypothesis A: Autopilot Engine Has Circular Dependencies

**Test**:
```bash
cd odavl-studio/autopilot/engine
pnpm exec madge --circular dist/
```

**If true**: Circular imports cause Webpack to fail resolution

---

### Hypothesis B: transpilePackages Interferes

**Test**: Remove `@odavl-studio/autopilot-engine` from transpilePackages

```javascript
transpilePackages: [
  '@odavl/oplayer',
  // '@odavl-studio/autopilot-engine', // ← Remove this
  '@odavl-studio/sdk',
  '@odavl-studio/guardian-core'
],
```

**Rationale**: Guardian doesn't have `@odavl-studio/guardian-core` in transpilePackages

---

### Hypothesis C: Autopilot Engine Needs Rebuild

**Test**:
```bash
cd odavl-studio/autopilot/engine
pnpm build --force
```

**Rationale**: Dist output may be corrupted or stale

---

### Hypothesis D: Relative Import Bypass

**Test**: Use ugly relative import temporarily

```typescript
// Bypass Webpack alias completely
import * as autopilot from '../../../../../../odavl-studio/autopilot/engine/dist/index.js';
```

**If works**: Confirms Webpack alias is broken specifically for Autopilot

---

### Hypothesis E: Autopilot Needs Separate Port/Process

**Test**: Deploy Autopilot as standalone Express/Fastify server instead of Next.js

**Rationale**: Next.js + Webpack + pnpm workspace = too many layers

---

## 📝 Diagnostic Logging Added

### Webpack Logging (next.config.mjs)

```javascript
webpack(config, { isServer }) {
  console.log("========================================");
  console.log("WEBPACK-AUTOPILOT-RESOLVE-START");
  console.log("IsServer:", isServer);
  console.log("========================================");
  
  // ... alias configuration
  
  console.log("ALIAS AFTER OVERRIDE:");
  console.log("  autopilot-engine →", config.resolve.alias['@odavl-studio/autopilot-engine']);
  console.log("  oplayer →", config.resolve.alias['@odavl/oplayer']);
  console.log("========================================");
  return config;
}
```

**Status**: Added but output not captured yet (need CMD window access)

---

## 🎯 Success Criteria (Not Met)

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| **Autopilot Health** | 200 OK | 500 ModuleParseError | ❌ Failed |
| **Static Import Works** | Yes | No | ❌ Failed |
| **Webpack Alias Applied** | Yes | Unknown | ⏸️ TBD |
| **Guardian Stability** | Maintained | ✅ 200 OK | ✅ Success |

---

## 🚨 Critical Findings

### Finding 1: Guardian Configuration ≠ Universal Solution

**What We Learned**: The exact Webpack alias strategy that works perfectly for Guardian **does NOT work** for Autopilot, despite:
- Identical alias syntax
- Same Next.js version (14.2.21)
- Same project structure
- Same pnpm workspace

**Implication**: There's a fundamental difference in how Guardian and Autopilot modules are structured/imported.

---

### Finding 2: Node.js vs Webpack Resolution Mismatch

**What We Learned**:
- Node.js resolves `oplayer` → `index.cjs` (CommonJS)
- Guardian uses Webpack alias → `index.js` (ESM)
- Both work, but for different reasons

**Implication**: Webpack resolution is independent of Node.js resolution.

---

### Finding 3: HTML Error Suggests Fallback Failure

**What We Learned**: The error `<!doctype html>` indicates Webpack is:
1. Failing to resolve the import
2. Falling back to some default/error page
3. Trying to parse HTML as JavaScript

**Implication**: The alias is either not applied or resolves to wrong location.

---

## 🔄 Next Actions (Priority Order)

1. **Check CMD Window Logs** 🔥 HIGH PRIORITY
   - See what Webpack diagnostic logging says
   - Verify if alias is actually applied

2. **Test Hypothesis B** (Remove from transpilePackages)
   - Simple config change
   - Low risk, high potential

3. **Test Hypothesis D** (Relative Import)
   - Proves if alias is the problem
   - Quick verification

4. **Test Hypothesis C** (Rebuild Engine)
   - Clean rebuild of autopilot-engine
   - Rule out stale build artifacts

5. **Test Hypothesis A** (Circular Dependencies)
   - Run madge analysis
   - Identify circular imports if any

6. **Consider Hypothesis E** (Alternative Architecture)
   - Long-term solution if Webpack proves intractable
   - Deploy Autopilot as standalone service

---

## 📈 Progress Metrics

**Time Spent**: ~2 hours  
**Attempts**: 5 different alias configurations  
**Cache Clears**: 8+ times  
**Restarts**: 10+ service restarts  
**Success Rate**: 0% (Autopilot), 100% (Guardian)

**Compilation Time**: 60-90 seconds per attempt (slower than Guardian's 30-50s)

---

## 🔒 Guardian Status (Locked)

**Final Verification**: December 6, 2025 23:40 UTC+1

```bash
Invoke-WebRequest http://localhost:3002/api/audit -TimeoutSec 8
```

**Response**:
```
StatusCode: 200
Status: healthy
```

**Configuration**: UNCHANGED throughout entire session  
**Stability**: 100% - never broke during Autopilot debugging

---

## 📄 Conclusion

**Phase 3C Autopilot Diagnostic**: ❌ **INCOMPLETE**

**What Worked**:
- ✅ Guardian locked and stable
- ✅ Diagnostic logging added
- ✅ Module resolution paths identified
- ✅ Multiple alias strategies tested

**What Failed**:
- ❌ Autopilot still gets ModuleParseError
- ❌ No clear root cause identified
- ❌ Guardian's solution doesn't transfer to Autopilot

**Key Insight**: **Autopilot and Guardian have fundamentally different module import patterns** that prevent a one-size-fits-all Webpack alias solution.

**Recommendation**:
1. Focus on **Hypothesis B** (transpilePackages) first
2. If that fails, use **Hypothesis D** (relative imports) as temporary workaround
3. Long-term: Consider **Hypothesis E** (separate architecture for Autopilot)

---

**Generated**: December 6, 2025 23:50 UTC+1  
**Diagnostic Session**: Phase 3C Recovery & Autopilot Diagnostic Mode  
**Status**: Ready for next iteration with actionable hypotheses  
**Guardian**: ✅ LOCKED AND STABLE  
**Autopilot**: ❌ Requires alternative approach
