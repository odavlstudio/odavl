# ODAVL Insight Performance Benchmarks

## Overview

Benchmark suite for measuring ODAVL Insight analysis performance.

## Setup

```bash
cd scripts/benchmark
pnpm install
```

## Running Benchmarks

```bash
# Run full benchmark suite
pnpm benchmark

# Run specific size
pnpm benchmark:small   # 10k LOC
pnpm benchmark:medium  # 50k LOC
pnpm benchmark:large   # 100k LOC

# Compare results
pnpm benchmark:compare
```

## Test Fixtures

Benchmark uses three test fixture sizes:

- **Small**: 100 files, 10k LOC (100 lines/file)
- **Medium**: 250 files, 50k LOC (200 lines/file)
- **Large**: 500 files, 100k LOC (200 lines/file)

Fixtures are auto-generated in `fixtures/benchmark/`.

## Metrics

Each benchmark measures:

- **Duration**: Total execution time (ms)
- **Throughput**: Lines of code analyzed per second (LOC/s)
- **Memory**: Peak memory usage (MB)
- **CPU**: Average CPU utilization (%)

## Test Cases

### Single-Threaded Baseline

Uses `StreamAnalyzer` to process files sequentially:

```typescript
const analyzer = createStreamAnalyzer();
for (const file of files) {
  await analyzer.analyzeFile(file);
}
```

### Multi-Threaded Optimized

Uses `WorkerPool` to process files in parallel:

```typescript
const pool = await createWorkerPool();
const tasks = files.map(file => ({
  id: file,
  type: 'analyze-file',
  data: { filePath: file, detectors: ['console-log'] },
}));
await pool.process(tasks);
```

## Expected Results

**Target Performance (Phase 1 Week 19):**

| Size   | LOC    | Single-Threaded | Multi-Threaded | Speedup |
| ------ | ------ | --------------- | -------------- | ------- |
| Small  | 10k    | ~2s             | ~0.3s          | 6-7x    |
| Medium | 50k    | ~10s            | ~1.5s          | 6-7x    |
| Large  | 100k   | ~20s            | ~3s            | 6-7x    |

_On 8-core machine. Speedup scales with CPU count._

## Output

Results saved to `reports/benchmark-results.json`:

```json
{
  "name": "ODAVL Insight Performance",
  "description": "Performance benchmarks for analysis engine",
  "results": [
    {
      "name": "single-threaded",
      "duration": 2143.5,
      "throughput": 4665,
      "memory": 45.2,
      "cpu": 92.3,
      "timestamp": "2025-12-28T10:30:00.000Z",
      "environment": {
        "os": "Windows_NT 10.0.22631",
        "cpus": 8,
        "memory": 16,
        "nodeVersion": "v20.19.5"
      }
    },
    {
      "name": "multi-threaded",
      "duration": 312.7,
      "throughput": 31980,
      "memory": 120.5,
      "cpu": 650.4,
      "timestamp": "2025-12-28T10:30:05.000Z",
      "environment": { ... }
    }
  ],
  "summary": {
    "totalDuration": 12281.0,
    "avgDuration": 2456.2,
    "minDuration": 298.1,
    "maxDuration": 2201.3,
    "stdDev": 847.5,
    "improvement": 85.4
  }
}
```

## Integration with CI

Add to `.github/workflows/benchmark.yml`:

```yaml
name: Benchmark

on:
  push:
    branches: [main, develop]
  pull_request:

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
      - run: pnpm install
      - run: cd scripts/benchmark && pnpm benchmark
      - uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: reports/benchmark-results.json
```

## Continuous Monitoring

Track performance over time:

```bash
# Save baseline
cp reports/benchmark-results.json reports/benchmark-baseline.json

# Compare after changes
pnpm benchmark:compare
```

## Troubleshooting

### High Memory Usage

Reduce fixture size or worker count:

```typescript
const pool = await createWorkerPool({
  maxWorkers: 4, // Fewer workers
  memoryLimitMB: 512, // Lower limit
});
```

### Inconsistent Results

- Run with `--iterations 10` for more stable avg
- Ensure no other CPU-intensive tasks running
- Use `--warmup` to prime the system

### Worker Pool Errors

Check worker.ts is compiled:

```bash
cd packages/core
pnpm build
```

## Phase 1 Week 19 Goals

✅ **Task 4: Benchmark Suite Setup**

- [x] Benchmark runner implementation
- [x] Test fixture generation
- [x] Single-threaded baseline
- [x] Multi-threaded comparison
- [x] Metrics collection (duration, throughput, memory, CPU)
- [x] JSON report generation
- [x] CLI interface
- [x] Documentation

**Next:** Week 20 - Redis Caching Layer

## Contributing

See `ODAVL_INSIGHT_ENTERPRISE_ROADMAP.md` Phase 1 for context.
