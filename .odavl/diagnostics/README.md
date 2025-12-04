# 🔍 ODAVL Diagnostic System

**Purpose:** Comprehensive error tracking, crash dumps, heap snapshots, and performance monitoring

---

## 📁 Directory Structure

```
.odavl/diagnostics/
├── crash-dumps/        # Full crash reports with environment context
├── heap-snapshots/     # V8 heap snapshots for memory analysis
├── error-traces/       # Lightweight error traces with ODAVL context
└── performance-logs/   # Operation timing and memory usage
```

---

## 🚀 Quick Start

### Initialize at Startup

```typescript
import { initializeDiagnostics } from '@odavl-studio/core/diagnostics';

// Call at application entry point
await initializeDiagnostics();
```

This will:
- ✅ Create diagnostic directories
- ✅ Register global error handlers
- ✅ Cleanup old dumps (keep last 50)

---

## 📊 Features

### 1. **Crash Dumps** - Full Context on Errors

Automatically captured on:
- ✅ Unhandled promise rejections
- ✅ Uncaught exceptions
- ✅ Manual calls to `saveDiagnosticDump()`

**What's Included:**
- Error details (name, message, stack)
- Environment (Node version, platform, cwd, argv)
- Memory usage snapshot
- Last 100 log lines
- Custom context data
- Call stack

**Example:**
```typescript
import { saveDiagnosticDump } from '@odavl-studio/core/diagnostics';

try {
  dangerousOperation();
} catch (error) {
  await saveDiagnosticDump(error, {
    operation: 'dangerousOperation',
    input: { foo: 'bar' },
    phase: 'act',
  });
  throw error; // Re-throw if needed
}
```

**Output:** `.odavl/diagnostics/crash-dumps/crash-1732612345678-abc123.json`

```json
{
  "id": "crash-1732612345678-abc123",
  "timestamp": "2025-11-26T10:05:45.678Z",
  "error": {
    "name": "TypeError",
    "message": "Cannot read property 'x' of undefined",
    "stack": "TypeError: Cannot read property 'x'...",
    "code": "ERR_INVALID_ARG_TYPE"
  },
  "environment": {
    "nodeVersion": "v20.10.0",
    "platform": "win32",
    "arch": "x64",
    "cwd": "/project",
    "argv": ["node", "index.js"],
    "env": { "NODE_ENV": "production", "API_KEY": "***REDACTED***" }
  },
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "recentLogs": [
    "[2025-11-26T10:05:40Z] Starting operation...",
    "[2025-11-26T10:05:43Z] Processing file...",
    "[2025-11-26T10:05:45Z] Error occurred!"
  ],
  "context": {
    "operation": "dangerousOperation",
    "input": { "foo": "bar" },
    "phase": "act"
  }
}
```

---

### 2. **Error Traces** - Lightweight ODAVL-Specific Errors

Use for ODAVL-specific errors during O-D-A-V-L cycle:

```typescript
import { saveErrorTrace } from '@odavl-studio/core/diagnostics';

await saveErrorTrace(
  new Error('Recipe failed'),
  {
    file: '/project/src/index.ts',
    function: 'fixImports',
    line: 42,
  },
  {
    runId: 'run-20251126-123456',
    recipeId: 'fix-imports',
    trustScore: 0.85,
    filesModified: ['src/index.ts', 'src/utils.ts'],
  }
);
```

**Output:** `.odavl/diagnostics/error-traces/trace-1732612345678-xyz789.json`

```json
{
  "id": "trace-1732612345678-xyz789",
  "timestamp": "2025-11-26T10:05:45.678Z",
  "error": {
    "type": "Error",
    "message": "Recipe failed",
    "stack": "Error: Recipe failed\n    at fixImports...",
    "phase": "act"
  },
  "context": {
    "file": "/project/src/index.ts",
    "function": "fixImports",
    "line": 42
  },
  "odavl": {
    "runId": "run-20251126-123456",
    "recipeId": "fix-imports",
    "trustScore": 0.85,
    "filesModified": ["src/index.ts", "src/utils.ts"]
  }
}
```

---

### 3. **Performance Logs** - Operation Timing

Track slow operations:

```typescript
import { startPerformanceTracking } from '@odavl-studio/core/diagnostics';

const endTracking = startPerformanceTracking('analyze-typescript');

// ... perform operation ...

await endTracking(); // Saves performance log
```

**Output:** `.odavl/diagnostics/performance-logs/perf-1732612345678-def456.json`

```json
{
  "id": "perf-1732612345678-def456",
  "timestamp": "2025-11-26T10:05:45.678Z",
  "operation": "analyze-typescript",
  "duration": 3245.67,
  "memoryBefore": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640
  },
  "memoryAfter": {
    "rss": 52428800,
    "heapTotal": 22020096,
    "heapUsed": 17825792
  }
}
```

---

### 4. **Heap Snapshots** - Memory Leak Detection

Capture V8 heap for analysis in Chrome DevTools:

```typescript
import { takeHeapSnapshot } from '@odavl-studio/core/diagnostics';

// When memory usage is high
if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
  await takeHeapSnapshot();
}
```

**Output:** `.odavl/diagnostics/heap-snapshots/heap-1732612345678-ghi789.heapsnapshot`

**How to Analyze:**
1. Open Chrome DevTools
2. Go to Memory tab
3. Load profile → Select `.heapsnapshot` file
4. Analyze memory usage, object counts, etc.

---

## 📈 Monitoring & Analysis

### Get Summary

```typescript
import { getDiagnosticsSummary } from '@odavl-studio/core/diagnostics';

const summary = await getDiagnosticsSummary();

console.log(summary);
// {
//   crashDumps: 5,
//   errorTraces: 12,
//   performanceLogs: 45,
//   heapSnapshots: 2,
//   totalSize: 15728640 // bytes
// }
```

### Logging System

Built-in logging with buffer (last 100 lines):

```typescript
import { log } from '@odavl-studio/core/diagnostics';

log('[INFO] Starting analysis...');
log('[DEBUG] Processing file: src/index.ts');
log('[ERROR] Failed to parse file');
```

**Logs are:**
- ✅ Stored in memory (last 100 lines)
- ✅ Included in crash dumps
- ✅ Written to console in development
- ✅ Silent in production (unless crash occurs)

---

## 🛡️ Security & Privacy

### Automatic Redaction

Sensitive environment variables are automatically redacted:

```typescript
// These keys are redacted:
'API_KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'PRIVATE_KEY'

// Example:
env: {
  NODE_ENV: 'production',
  API_KEY: '***REDACTED***',    // ✅ Protected
  DATABASE_URL: '***REDACTED***', // ✅ Protected
  PORT: '3000'                   // ✅ Safe
}
```

### Cleanup Policy

- ✅ Keep last 50 dumps per category
- ✅ Old dumps automatically deleted
- ✅ Runs on initialization

---

## 🔧 Integration with ODAVL

### Autopilot Engine

```typescript
// odavl-studio/autopilot/engine/src/index.ts
import { initializeDiagnostics, log, saveErrorTrace } from '@odavl-studio/core/diagnostics';

await initializeDiagnostics();

// In each phase
try {
  const metrics = await observe();
  log('[OBSERVE] Collected metrics successfully');
} catch (error) {
  await saveErrorTrace(error, {}, {
    runId: currentRunId,
    phase: 'observe',
  });
  throw error;
}
```

### Insight Core

```typescript
// odavl-studio/insight/core/src/detector/index.ts
import { startPerformanceTracking, saveDiagnosticDump } from '@odavl-studio/core/diagnostics';

async analyze(workspace: string) {
  const endTracking = startPerformanceTracking('typescript-detector');
  
  try {
    // ... analysis logic ...
  } catch (error) {
    await saveDiagnosticDump(error, {
      detector: 'typescript',
      workspace,
    });
    throw error;
  } finally {
    await endTracking();
  }
}
```

---

## 📊 Best Practices

### 1. **Initialize Early**
```typescript
// At app entry point (index.ts, main.ts, server.ts)
import { initializeDiagnostics } from '@odavl-studio/core/diagnostics';
await initializeDiagnostics();
```

### 2. **Track Critical Operations**
```typescript
const endTracking = startPerformanceTracking('critical-operation');
// ... operation ...
await endTracking();
```

### 3. **Add Context to Errors**
```typescript
try {
  // risky operation
} catch (error) {
  await saveDiagnosticDump(error, {
    operation: 'fixImports',
    files: ['index.ts'],
    phase: 'act',
  });
  throw error;
}
```

### 4. **Use Error Traces for ODAVL Errors**
```typescript
// Lightweight, ODAVL-specific
await saveErrorTrace(error, context, odavlContext);
```

### 5. **Take Heap Snapshots When Needed**
```typescript
// Memory threshold check
if (process.memoryUsage().heapUsed > 500_000_000) {
  await takeHeapSnapshot();
}
```

---

## 🚫 What NOT to Do

❌ Don't dump on every error (use error traces instead)  
❌ Don't include sensitive data in context  
❌ Don't take heap snapshots frequently (large files)  
❌ Don't commit diagnostics to git (add to .gitignore)

---

## 📝 .gitignore

```gitignore
# Diagnostic files (local only)
.odavl/diagnostics/
```

**Exception:** You might want to commit empty directories with `.gitkeep`:

```bash
touch .odavl/diagnostics/crash-dumps/.gitkeep
touch .odavl/diagnostics/heap-snapshots/.gitkeep
touch .odavl/diagnostics/error-traces/.gitkeep
touch .odavl/diagnostics/performance-logs/.gitkeep
```

---

## 🆘 Troubleshooting

### No Dumps Generated?
1. Check if `initializeDiagnostics()` was called
2. Check if `.odavl/diagnostics/` exists
3. Check file permissions
4. Look for console errors

### Large Heap Snapshots?
- Heap snapshots can be 100MB+ for large applications
- Consider cleanup policy (delete old snapshots)
- Use only for memory leak investigation

### Performance Logs Slowing Down?
- Performance tracking has minimal overhead (~1ms)
- If too many logs, increase cleanup frequency
- Or disable tracking in production

---

**Created:** Phase 1 - Diagnostic Dumps System  
**Status:** ✅ Complete  
**Next:** Screenshot Files System
