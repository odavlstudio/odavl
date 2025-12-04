# ODAVL Studio - Benchmark System

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## 📋 Overview

The benchmark system measures and tracks performance of ODAVL Studio's core components over time:

- **Insight Core:** Detector execution speed and accuracy
- **Autopilot Engine:** O-D-A-V-L cycle timing and throughput
- **Guardian:** Test execution and resource usage

**Purpose:**
- Detect performance regressions
- Compare optimization improvements
- Track performance trends over time
- Ensure consistent performance across environments

---

## 📁 Directory Structure

```
benchmarks/
├── detector-benchmarks.ts       # Insight detector performance
├── odavl-cycle-benchmark.ts     # Autopilot O-D-A-V-L cycle
├── guardian-benchmarks.ts       # Guardian test performance
├── utils/
│   ├── benchmark-runner.ts      # Benchmark execution utilities
│   ├── metrics-collector.ts     # Performance metrics collection
│   └── reporter.ts              # Benchmark report generation
├── results/
│   ├── benchmark-history.json   # Historical benchmark data
│   ├── latest-run.json          # Most recent benchmark results
│   └── baselines.json           # Baseline expectations
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Running Benchmarks

```bash
# Run all benchmarks
pnpm benchmark

# Run specific benchmark suite
pnpm benchmark:detectors    # Insight detectors
pnpm benchmark:odavl        # Autopilot cycle
pnpm benchmark:guardian     # Guardian tests

# Run with custom iterations
pnpm benchmark -- --iterations 10

# Run and save results
pnpm benchmark -- --save

# Compare with baseline
pnpm benchmark -- --compare
```

---

## 📊 Benchmark Suites

### 1. Insight Detector Benchmarks

**File:** `detector-benchmarks.ts`

**What it measures:**
- Detector execution time per file
- Memory usage during analysis
- Issue detection accuracy
- Throughput (files per second)

**Detectors tested:**
- TypeScript detector
- ESLint detector
- Security detector
- Circular dependency detector
- Import detector
- Performance detector
- Complexity detector

**Sample output:**

```
🔍 ODAVL Insight - Detector Benchmarks

TypeScript Detector
  ⏱️  Avg Time: 245ms per file
  📊 Throughput: 4.08 files/sec
  💾 Memory: 45.2 MB peak
  ✅ Issues Found: 12

ESLint Detector
  ⏱️  Avg Time: 189ms per file
  📊 Throughput: 5.29 files/sec
  💾 Memory: 32.1 MB peak
  ✅ Issues Found: 8

Security Detector
  ⏱️  Avg Time: 312ms per file
  📊 Throughput: 3.21 files/sec
  💾 Memory: 28.7 MB peak
  ✅ Issues Found: 3

Overall Performance
  ⏱️  Total Time: 2.34s
  📊 Avg Throughput: 4.27 files/sec
  💾 Total Memory: 106 MB
  ✅ Total Issues: 23
```

### 2. O-D-A-V-L Cycle Benchmarks

**File:** `odavl-cycle-benchmark.ts`

**What it measures:**
- Individual phase timings (Observe, Decide, Act, Verify, Learn)
- Total cycle duration
- Memory usage per phase
- Recipe execution success rate

**Sample output:**

```
🔄 ODAVL Autopilot - Cycle Benchmarks

Phase Timings:
  1️⃣ Observe:  1.2s (metrics collection)
  2️⃣ Decide:   0.3s (recipe selection)
  3️⃣ Act:      2.1s (file modifications)
  4️⃣ Verify:   1.8s (quality checks)
  5️⃣ Learn:    0.4s (trust updates)

Total Cycle: 5.8s
Memory Peak: 128 MB
Files Changed: 3
LOC Changed: 42
Success Rate: 100%
```

### 3. Guardian Test Benchmarks

**File:** `guardian-benchmarks.ts`

**What it measures:**
- Lighthouse test duration
- Playwright test execution time
- Accessibility scan speed
- Memory usage during tests
- Screenshot capture time

**Sample output:**

```
🛡️ ODAVL Guardian - Test Benchmarks

Lighthouse Performance Test
  ⏱️  Duration: 8.4s
  💾 Memory: 234 MB
  📊 Performance Score: 98
  
Accessibility Test (Axe)
  ⏱️  Duration: 3.2s
  💾 Memory: 87 MB
  ✅ Violations Found: 2

Screenshot Capture
  ⏱️  Duration: 1.5s per page
  💾 Memory: 45 MB
  📸 Images: 3
```

---

## 📈 Baseline Expectations

**File:** `results/baselines.json`

```json
{
  "version": "2.0.0",
  "updated": "2025-11-26",
  "environment": {
    "os": "Windows 11",
    "cpu": "Intel Core i7-12700K",
    "memory": "32 GB",
    "node": "20.10.0"
  },
  "baselines": {
    "insight": {
      "typescript-detector": {
        "avgTime": 250,
        "throughput": 4.0,
        "memory": 50000000
      },
      "eslint-detector": {
        "avgTime": 200,
        "throughput": 5.0,
        "memory": 35000000
      },
      "security-detector": {
        "avgTime": 300,
        "throughput": 3.3,
        "memory": 30000000
      }
    },
    "autopilot": {
      "observe-phase": { "time": 1200 },
      "decide-phase": { "time": 300 },
      "act-phase": { "time": 2000 },
      "verify-phase": { "time": 1800 },
      "learn-phase": { "time": 400 },
      "total-cycle": { "time": 5700 }
    },
    "guardian": {
      "lighthouse-test": { "time": 8000, "memory": 250000000 },
      "accessibility-test": { "time": 3000, "memory": 90000000 },
      "screenshot-capture": { "time": 1500, "memory": 50000000 }
    }
  },
  "thresholds": {
    "maxRegression": 0.15,
    "minImprovement": 0.05
  }
}
```

---

## 🛠️ Implementation Examples

### Detector Benchmark Example

```typescript
// benchmarks/detector-benchmarks.ts
import { performance } from 'node:perf_hooks';
import { TypeScriptDetector } from '@odavl-studio/insight-core/detector';

interface BenchmarkResult {
  detector: string;
  avgTime: number;
  throughput: number;
  memoryPeak: number;
  issuesFound: number;
}

async function benchmarkDetector(
  detector: any,
  files: string[],
  iterations: number = 5
): Promise<BenchmarkResult> {
  const times: number[] = [];
  const memoryUsages: number[] = [];
  let totalIssues = 0;

  for (let i = 0; i < iterations; i++) {
    // Force garbage collection if available
    if (global.gc) global.gc();

    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();

    const result = await detector.analyze(files);
    
    const end = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    times.push(end - start);
    memoryUsages.push(memAfter - memBefore);
    totalIssues += result.issues.length;
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const memoryPeak = Math.max(...memoryUsages);
  const throughput = (files.length / avgTime) * 1000; // files per second

  return {
    detector: detector.constructor.name,
    avgTime: Math.round(avgTime),
    throughput: Number(throughput.toFixed(2)),
    memoryPeak,
    issuesFound: Math.round(totalIssues / iterations)
  };
}

export async function runDetectorBenchmarks() {
  console.log('🔍 ODAVL Insight - Detector Benchmarks\n');

  const testFiles = [
    'test-fixtures/typescript-project/src/index.ts',
    'test-fixtures/typescript-project/src/utils/helpers.ts',
    'test-fixtures/typescript-project/src/api/routes.ts'
  ];

  const detectors = [
    new TypeScriptDetector(),
    // Add other detectors...
  ];

  const results: BenchmarkResult[] = [];

  for (const detector of detectors) {
    const result = await benchmarkDetector(detector, testFiles);
    results.push(result);
    
    console.log(`${detector.constructor.name}`);
    console.log(`  ⏱️  Avg Time: ${result.avgTime}ms per file`);
    console.log(`  📊 Throughput: ${result.throughput} files/sec`);
    console.log(`  💾 Memory: ${(result.memoryPeak / 1024 / 1024).toFixed(1)} MB peak`);
    console.log(`  ✅ Issues Found: ${result.issuesFound}\n`);
  }

  return results;
}
```

### Autopilot Cycle Benchmark Example

```typescript
// benchmarks/odavl-cycle-benchmark.ts
import { performance } from 'node:perf_hooks';

interface PhaseBenchmark {
  phase: string;
  time: number;
  memory: number;
}

async function benchmarkPhase(
  phaseFn: () => Promise<any>,
  phaseName: string
): Promise<PhaseBenchmark> {
  if (global.gc) global.gc();

  const memBefore = process.memoryUsage().heapUsed;
  const start = performance.now();

  await phaseFn();

  const end = performance.now();
  const memAfter = process.memoryUsage().heapUsed;

  return {
    phase: phaseName,
    time: Math.round(end - start),
    memory: memAfter - memBefore
  };
}

export async function runODAVLCycleBenchmark() {
  console.log('🔄 ODAVL Autopilot - Cycle Benchmarks\n');

  const phases = [
    { name: 'Observe', fn: observePhase },
    { name: 'Decide', fn: decidePhase },
    { name: 'Act', fn: actPhase },
    { name: 'Verify', fn: verifyPhase },
    { name: 'Learn', fn: learnPhase }
  ];

  const results: PhaseBenchmark[] = [];

  for (const phase of phases) {
    const result = await benchmarkPhase(phase.fn, phase.name);
    results.push(result);
  }

  const totalTime = results.reduce((sum, r) => sum + r.time, 0);
  const totalMemory = results.reduce((sum, r) => sum + r.memory, 0);

  console.log('Phase Timings:');
  results.forEach((result, index) => {
    const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index];
    console.log(`  ${emoji} ${result.phase}: ${(result.time / 1000).toFixed(1)}s`);
  });

  console.log(`\nTotal Cycle: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`Memory Peak: ${(totalMemory / 1024 / 1024).toFixed(0)} MB`);

  return results;
}
```

---

## 📊 Results Format

**File:** `results/latest-run.json`

```json
{
  "timestamp": "2025-11-26T10:30:00.000Z",
  "version": "2.0.0",
  "environment": {
    "os": "Windows 11",
    "cpu": "Intel Core i7-12700K",
    "memory": 34359738368,
    "node": "20.10.0",
    "pnpm": "9.12.2"
  },
  "insight": {
    "detectors": [
      {
        "name": "TypeScriptDetector",
        "avgTime": 245,
        "throughput": 4.08,
        "memoryPeak": 47505408,
        "issuesFound": 12
      }
    ],
    "overall": {
      "totalTime": 2340,
      "avgThroughput": 4.27,
      "totalMemory": 111149056,
      "totalIssues": 23
    }
  },
  "autopilot": {
    "phases": [
      { "phase": "Observe", "time": 1200, "memory": 25000000 },
      { "phase": "Decide", "time": 300, "memory": 5000000 },
      { "phase": "Act", "time": 2100, "memory": 45000000 },
      { "phase": "Verify", "time": 1800, "memory": 38000000 },
      { "phase": "Learn", "time": 400, "memory": 8000000 }
    ],
    "total": {
      "time": 5800,
      "memory": 121000000,
      "filesChanged": 3,
      "locChanged": 42,
      "successRate": 1.0
    }
  },
  "guardian": {
    "tests": [
      {
        "name": "Lighthouse",
        "time": 8400,
        "memory": 245366784,
        "score": 98
      },
      {
        "name": "Accessibility",
        "time": 3200,
        "memory": 91226112,
        "violations": 2
      },
      {
        "name": "Screenshot",
        "time": 1500,
        "memory": 47185920,
        "images": 3
      }
    ]
  }
}
```

---

## 📈 Historical Tracking

**File:** `results/benchmark-history.json`

```json
{
  "history": [
    {
      "date": "2025-11-26",
      "version": "2.0.0",
      "insight": {
        "avgDetectorTime": 245,
        "totalIssues": 23
      },
      "autopilot": {
        "totalCycleTime": 5800,
        "successRate": 1.0
      },
      "guardian": {
        "avgTestTime": 4367
      }
    },
    {
      "date": "2025-11-20",
      "version": "1.9.0",
      "insight": {
        "avgDetectorTime": 280,
        "totalIssues": 23
      },
      "autopilot": {
        "totalCycleTime": 6200,
        "successRate": 0.95
      },
      "guardian": {
        "avgTestTime": 4800
      }
    }
  ]
}
```

---

## 🎯 Performance Targets

### Insight Detectors

| Detector | Target Time | Target Throughput | Target Memory |
|----------|-------------|-------------------|---------------|
| TypeScript | < 250ms | > 4 files/sec | < 50 MB |
| ESLint | < 200ms | > 5 files/sec | < 35 MB |
| Security | < 300ms | > 3.5 files/sec | < 30 MB |
| Circular | < 150ms | > 7 files/sec | < 25 MB |
| Import | < 100ms | > 10 files/sec | < 20 MB |

### Autopilot Phases

| Phase | Target Time | Target Memory |
|-------|-------------|---------------|
| Observe | < 1500ms | < 30 MB |
| Decide | < 500ms | < 10 MB |
| Act | < 2500ms | < 50 MB |
| Verify | < 2000ms | < 40 MB |
| Learn | < 500ms | < 10 MB |
| **Total** | **< 7000ms** | **< 140 MB** |

### Guardian Tests

| Test | Target Time | Target Memory |
|------|-------------|---------------|
| Lighthouse | < 10s | < 300 MB |
| Accessibility | < 4s | < 100 MB |
| Screenshot | < 2s | < 60 MB |

---

## 🚨 Regression Detection

The benchmark system automatically detects performance regressions:

**Regression Criteria:**
- Performance degradation > 15% (configurable)
- Memory usage increase > 20%
- Success rate decrease > 5%

**Example output:**

```
⚠️  PERFORMANCE REGRESSION DETECTED

TypeScript Detector:
  Previous: 245ms
  Current: 310ms
  Regression: 26.5% ❌ (threshold: 15%)

Recommendations:
  1. Review recent changes to TypeScript detector
  2. Check for new dependencies or algorithms
  3. Profile with Chrome DevTools
  4. Consider optimization strategies
```

---

## 🛠️ Usage in CI/CD

### GitHub Actions Integration

```yaml
# .github/workflows/benchmark.yml
name: Performance Benchmarks

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run benchmarks
        run: pnpm benchmark -- --save --compare
      
      - name: Check for regressions
        run: pnpm benchmark:check-regression
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: benchmarks/results/latest-run.json
```

---

## 📝 Best Practices

### 1. Consistent Environment

Always run benchmarks on the same hardware for accurate comparisons:

```bash
# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--expose-gc"

# Run with garbage collection enabled
node --expose-gc benchmarks/detector-benchmarks.ts
```

### 2. Multiple Iterations

Run benchmarks multiple times and average results:

```typescript
const iterations = 10;
const results = [];

for (let i = 0; i < iterations; i++) {
  results.push(await runBenchmark());
}

const avgResult = averageResults(results);
```

### 3. Warm-up Runs

Perform warm-up runs before actual benchmarking:

```typescript
// Warm-up: 3 runs
for (let i = 0; i < 3; i++) {
  await runBenchmark();
}

// Actual benchmark runs
for (let i = 0; i < 10; i++) {
  results.push(await runBenchmark());
}
```

---

## 🔍 Profiling & Optimization

### Chrome DevTools Profiling

```bash
# Generate CPU profile
node --inspect-brk benchmarks/detector-benchmarks.ts

# Open chrome://inspect in Chrome
# Click "inspect" and start profiling
```

### Memory Profiling

```typescript
// Take heap snapshot
import { writeHeapSnapshot } from 'node:v8';

writeHeapSnapshot('./benchmarks/results/heap-snapshot.heapsnapshot');
```

---

## 📚 Resources

- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [V8 Memory Profiling](https://v8.dev/docs/memory-profiler)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**Next Steps:**
1. Run baseline benchmarks for all components
2. Set up CI/CD benchmark automation
3. Monitor performance trends over time
4. Optimize components that exceed targets
5. Document performance improvements
