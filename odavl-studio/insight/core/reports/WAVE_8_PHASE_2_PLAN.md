# Wave 8 Phase 2: Process Isolation Plan
## ODAVL Insight - Crash-Resistant Architecture

**Date**: December 8, 2025  
**Branch**: `odavl/insight-wave8-phase2-20251208`  
**Status**: PLANNING COMPLETE - Ready for Implementation

---

## Current State Summary

✅ **Wave 7 Complete**: Runtime helpers converted to sync (globSync)  
✅ **Wave 8 Phase 1 Complete**: All safety fixes applied:
- Zero unsafe `fs.readFileSync` calls
- Timeout protection (TypeScript 2min, ESLint 2min, Build 5min)
- 50MB file size guards in 4 detectors
- All `safeReadFile` calls have null guards

❌ **Critical Gaps**:
- Detector crashes kill Brain
- Heavy detectors (TypeScript, ESLint, Security, Circular) block execution
- No JSONL streaming protocol
- Full CJS bundling → can't isolate detectors
- No centralized error aggregation

---

## Phase 2 Goals

Transform Insight into **process-isolated, crash-resistant analyzer**:

1. **Process Isolation**: Heavy detectors run in isolated workers
2. **Hybrid Bundling**: CLI bundled, detectors unbundled
3. **JSONL Protocol**: Streaming communication between processes
4. **Error Aggregation**: Centralized error collection and recovery
5. **Worker Health**: Auto-restart crashed workers

**Target Detectors for Isolation**:
- TypeScript (tsc - slow)
- ESLint (slow)
- Security (high memory)
- Build (external processes)
- Circular (graph algorithms)

**Fast Detectors Stay In-Process**:
- Import, Package, Network, Isolation, Performance, Complexity

---

## Implementation Steps

### Step 1: Worker Protocol Types [P0]
**File**: `src/core/worker-protocol.ts` (NEW, ~80 LOC)

```typescript
// Parent → Worker
interface ExecuteDetectorMessage {
  type: 'execute';
  detector: string;
  workspace: string;
}

// Worker → Parent (streaming)
interface ProgressMessage { type: 'progress'; detector: string; processed: number; total: number; }
interface IssueMessage { type: 'issue'; detector: string; issue: any; }
interface CompleteMessage { type: 'complete'; detector: string; issuesCount: number; }
interface ErrorMessage { type: 'error'; detector: string; message: string; code: string; }
```

**Validation**: `pnpm exec tsc --noEmit src/core/worker-protocol.ts`

---

### Step 2: Error Aggregation Layer [P0]
**File**: `src/core/error-aggregator.ts` (NEW, ~120 LOC)

```typescript
interface NormalizedDetectorError {
  detector: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  code: string;
  message: string;
  timestamp: string;
}

class DetectorErrorAggregator {
  addTimeoutError(detector: string, durationMs: number): void;
  addWorkerCrashError(detector: string, exitCode: number): void;
  addExternalToolError(detector: string, tool: string, error: any): void;
  getErrorsByDetector(): Map<string, NormalizedDetectorError[]>;
}
```

**Validation**: `pnpm exec tsc --noEmit src/core/error-aggregator.ts`

---

### Step 3: Detector Worker Entry [P0]
**File**: `src/core/detector-worker.ts` (NEW, ~150 LOC)

```typescript
// Worker process entry point - receives JSONL, emits JSONL
import { parentPort } from 'node:worker_threads';
import { loadDetector } from '../detector/detector-loader.js';

if (parentPort) {
  parentPort.on('message', async (msg: ExecuteDetectorMessage) => {
    const DetectorClass = await loadDetector(msg.detector);
    const detector = new DetectorClass(msg.workspace);
    const issues = await detector.detect();
    
    // Stream results
    for (const issue of issues) {
      parentPort.postMessage({ type: 'issue', detector: msg.detector, issue });
    }
    parentPort.postMessage({ type: 'complete', detector: msg.detector, issuesCount: issues.length });
  });
}
```

**Validation**: `pnpm exec tsc --noEmit src/core/detector-worker.ts`

---

### Step 4: Worker Pool Manager [P0]
**File**: `src/core/detector-worker-pool.ts` (NEW, ~200 LOC)

```typescript
import { Worker } from 'node:worker_threads';

class DetectorWorkerPool {
  private workers: Worker[] = [];
  private maxWorkers: number; // Default: cpus / 2
  
  async executeDetector(detector: string, workspace: string): Promise<DetectorResult>;
  async executeDetectors(detectors: string[], workspace: string): Promise<Map<string, DetectorResult>>;
  async shutdown(): Promise<void>;
}
```

**Validation**: `pnpm exec tsc --noEmit src/core/detector-worker-pool.ts`

---

### Step 5: Update tsup Config [P1]
**File**: `tsup.config.ts` (~30 LOC changes)

```typescript
export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'core/detector-worker': 'src/core/detector-worker.ts', // NEW worker entry
    'detector/index': 'src/detector/index.ts',
  },
  format: ['cjs'],
  bundle: true,
  splitting: true, // Enable for better code reuse
});
```

**Validation**: `pnpm build && ls dist/core/`

---

### Step 6: Integrate with Brain [P0]
**File**: `packages/odavl-brain/src/adapters/insight-adapter.ts` (~40 LOC)

```typescript
import { DetectorWorkerPool } from '@odavl-studio/insight-core/core/detector-worker-pool';

let workerPool: DetectorWorkerPool | null = null;

export async function runInsight(projectRoot: string, detectors?: string[]) {
  if (!workerPool) {
    workerPool = new DetectorWorkerPool({ maxWorkers: Math.max(1, os.cpus().length / 2) });
  }
  
  // Heavy detectors → workers
  const heavyDetectors = ['typescript', 'eslint', 'security', 'circular', 'build'];
  const workerResults = await workerPool.executeDetectors(
    detectors.filter(d => heavyDetectors.includes(d)),
    projectRoot
  );
  
  // Fast detectors → in-process (existing code)
  // ...
}
```

**Validation**: `pnpm odavl:brain --skip-autopilot --skip-guardian --verbose`

---

### Step 7: Worker Health Monitoring [P1]
**File**: `src/core/detector-worker-pool.ts` (+60 LOC)

```typescript
interface WorkerHealth {
  memoryMB: number;
  cpuPercent: number;
  tasksCompleted: number;
  consecutiveCrashes: number;
}

// Monitor every 5s, restart if memory >1GB or >3 crashes
private async restartWorker(id: number): Promise<void> {
  this.workers[id]?.terminate();
  this.workers[id] = this.createWorker();
}
```

**Validation**: `pnpm test src/core/detector-worker-pool.test.ts`

---

### Step 8: Integration Tests [P1]
**File**: `src/core/detector-worker-pool.test.ts` (NEW, ~150 LOC)

Tests:
- Execute TypeScript detector in isolated worker
- Recover from worker crash
- Run multiple detectors in parallel
- Verify memory isolation (<200MB per worker)

**Validation**: `pnpm test src/core/`

---

## Execution Order

### Phase A: Foundation [FIRST]
**Steps 1-2** (Protocol + Error Aggregator)  
**Time**: 1-2 hours | **Risk**: None

### Phase B: Worker Infrastructure [CORE]
**Steps 3-4** (Worker Entry + Pool Manager)  
**Time**: 4-6 hours | **Risk**: Medium

### Phase C: Integration [PROVE IT]
**Step 6** (Brain Integration)  
**Time**: 2-3 hours | **Risk**: Medium  
**Skip Step 5 for now** - current bundling works

### Phase D: Hardening [OPTIONAL]
**Steps 5, 7, 8** (Bundling + Monitoring + Tests)  
**Time**: 4-5 hours | **Risk**: Low

---

## Success Criteria

✅ Zero Brain crashes from detector failures  
✅ TypeScript/ESLint run in isolated workers  
✅ Worker restart under 1 second  
✅ Memory per worker <200MB  
✅ Parallel execution 2-4x faster  
✅ JSONL streaming protocol working  
✅ Centralized error collection

---

## File Change Summary

| Step | File | Type | LOC | Priority |
|------|------|------|-----|----------|
| 1 | `src/core/worker-protocol.ts` | NEW | ~80 | P0 |
| 2 | `src/core/error-aggregator.ts` | NEW | ~120 | P0 |
| 3 | `src/core/detector-worker.ts` | NEW | ~150 | P0 |
| 4 | `src/core/detector-worker-pool.ts` | NEW | ~200 | P0 |
| 5 | `tsup.config.ts` | MODIFY | ~30 | P1 |
| 6 | `packages/odavl-brain/src/adapters/insight-adapter.ts` | MODIFY | ~40 | P0 |
| 7 | `src/core/detector-worker-pool.ts` | MODIFY | +60 | P1 |
| 8 | `src/core/detector-worker-pool.test.ts` | NEW | ~150 | P1 |

**Total P0**: ~670 LOC across 5 steps  
**Total P1**: ~240 LOC across 3 steps

---

## Next Action

**AWAITING APPROVAL** to begin **Phase A (Steps 1-2)**:
- Create worker protocol types
- Create error aggregator

These are pure type definitions and utilities with zero risk.

**Command to start**: `git checkout -b odavl/insight-wave8-phase2-20251208`
