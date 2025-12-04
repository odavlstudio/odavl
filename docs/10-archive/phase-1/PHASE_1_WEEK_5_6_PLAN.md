# Phase 1 Weeks 5-6: Performance & Optimization

**Duration:** 10-14 Days (January 10-24, 2025)  
**Status:** 🚧 IN PROGRESS  
**Goal:** Optimize performance, reduce analysis time, improve memory usage, refactor code

---

## Overview

Weeks 5-6 focus on **performance optimization** and **code quality improvements** to prepare ODAVL Studio for production deployment.

### Key Objectives

1. **Analysis Speed**: Reduce from 10-30s to <5s
2. **Memory Usage**: Keep under 200MB for typical projects
3. **Extension Startup**: Reduce from ~1s to <500ms
4. **Code Quality**: Refactor, remove dead code, improve maintainability
5. **Security**: Audit dependencies, fix vulnerabilities

---

## Week 5: Performance Improvements (Days 1-7)

### Day 1: Performance Baseline & Analysis

**Goal:** Establish current performance metrics and identify bottlenecks

**Tasks:**
- [ ] Create performance testing script
- [ ] Measure analysis time for different project sizes
- [ ] Profile memory usage during analysis
- [ ] Measure extension startup time
- [ ] Identify top 5 performance bottlenecks
- [ ] Document baseline metrics

**Deliverables:**
- `scripts/performance-test.ts` - Performance testing script
- `reports/performance-baseline.md` - Baseline metrics report

**Baseline Targets:**
```
Current State:
- Full analysis: 10-30s
- Memory usage: Unknown
- Extension startup: ~1s
- ML inference: 0.57ms ✅

Target State:
- Full analysis: <5s (50-83% faster)
- Memory usage: <200MB
- Extension startup: <500ms (50% faster)
- ML inference: <1ms (already achieved!)
```

---

### Days 2-3: Analysis Speed Optimization

**Goal:** Reduce full analysis time from 10-30s to <5s

#### Task 1: Parallel Detector Execution

**Current:** Detectors run sequentially
**Target:** Run detectors in parallel using Worker threads

**Implementation:**

```typescript
// odavl-studio/insight/core/src/parallel-executor.ts

import { Worker } from 'node:worker_threads';
import type { Detector, Issue } from './types';

export class ParallelExecutor {
  private maxWorkers: number;

  constructor(maxWorkers = 4) {
    this.maxWorkers = Math.min(maxWorkers, require('os').cpus().length);
  }

  async runDetectors(
    detectors: Detector[],
    workspacePath: string
  ): Promise<Map<string, Issue[]>> {
    const chunks = this.chunkArray(detectors, this.maxWorkers);
    const results = new Map<string, Issue[]>();

    // Run detector chunks in parallel
    await Promise.all(
      chunks.map(async (chunk) => {
        for (const detector of chunk) {
          const issues = await detector.analyze(workspacePath);
          results.set(detector.name, issues);
        }
      })
    );

    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Usage in main analyzer
const executor = new ParallelExecutor(4);
const results = await executor.runDetectors(detectors, workspace);
```

**Expected Improvement:** 50-70% faster analysis

#### Task 2: Incremental Analysis

**Current:** Analyzes all files on every run
**Target:** Only analyze changed files

**Implementation:**

```typescript
// odavl-studio/insight/core/src/incremental-analyzer.ts

import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';

export class IncrementalAnalyzer {
  private cacheFile = '.odavl/cache/file-hashes.json';
  private cache: Map<string, string> = new Map();

  async loadCache(): Promise<void> {
    try {
      const content = await fs.readFile(this.cacheFile, 'utf-8');
      this.cache = new Map(Object.entries(JSON.parse(content)));
    } catch {
      // Cache doesn't exist, start fresh
    }
  }

  async getChangedFiles(files: string[]): Promise<string[]> {
    const changed: string[] = [];

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const cachedHash = this.cache.get(file);

      if (hash !== cachedHash) {
        changed.push(file);
        this.cache.set(file, hash);
      }
    }

    return changed;
  }

  async saveCache(): Promise<void> {
    const cacheData = Object.fromEntries(this.cache);
    await fs.mkdir('.odavl/cache', { recursive: true });
    await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2));
  }
}

// Usage
const analyzer = new IncrementalAnalyzer();
await analyzer.loadCache();
const changedFiles = await analyzer.getChangedFiles(allFiles);
// Only analyze changedFiles
await analyzer.saveCache();
```

**Expected Improvement:** 80-90% faster for incremental runs

#### Task 3: Smart Caching

**Current:** No caching of analysis results
**Target:** Cache results for unchanged files

**Implementation:**

```typescript
// odavl-studio/insight/core/src/result-cache.ts

import type { Issue } from './types';

export class ResultCache {
  private cache = new Map<string, { hash: string; issues: Issue[] }>();
  private cacheFile = '.odavl/cache/results.json';

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.cacheFile, 'utf-8');
      const data = JSON.parse(content);
      this.cache = new Map(Object.entries(data));
    } catch {
      // No cache exists
    }
  }

  getCached(filePath: string, fileHash: string): Issue[] | null {
    const cached = this.cache.get(filePath);
    if (cached && cached.hash === fileHash) {
      return cached.issues;
    }
    return null;
  }

  set(filePath: string, fileHash: string, issues: Issue[]): void {
    this.cache.set(filePath, { hash: fileHash, issues });
  }

  async save(): Promise<void> {
    const data = Object.fromEntries(this.cache);
    await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2));
  }
}
```

**Expected Improvement:** Near-instant results for unchanged files

**Deliverables:**
- [ ] `parallel-executor.ts` - Parallel detector execution
- [ ] `incremental-analyzer.ts` - Incremental analysis
- [ ] `result-cache.ts` - Result caching
- [ ] Tests for all new features
- [ ] Performance benchmarks

---

### Days 4-5: Memory Optimization

**Goal:** Keep memory usage under 200MB for typical projects

#### Task 1: Stream Large Files

**Current:** Loads entire files into memory
**Target:** Stream files for analysis

**Implementation:**

```typescript
// odavl-studio/insight/core/src/stream-analyzer.ts

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export class StreamAnalyzer {
  async analyzeFile(filePath: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const stream = createReadStream(filePath);
    const rl = createInterface({ input: stream });

    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber++;
      // Analyze line by line without loading full file
      const lineIssues = this.analyzeLine(line, lineNumber);
      issues.push(...lineIssues);
    }

    return issues;
  }

  private analyzeLine(line: string, lineNumber: number): Issue[] {
    // Detector-specific line analysis
    return [];
  }
}
```

#### Task 2: Release Memory After Analysis

**Implementation:**

```typescript
// Force garbage collection after analysis
export class MemoryManager {
  releaseMemory(): void {
    if (global.gc) {
      global.gc();
    }
  }

  async analyzeWithCleanup<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.releaseMemory();
      return result;
    } catch (error) {
      this.releaseMemory();
      throw error;
    }
  }
}
```

#### Task 3: Limit Concurrent Operations

**Implementation:**

```typescript
// odavl-studio/insight/core/src/concurrency-limiter.ts

export class ConcurrencyLimiter {
  private running = 0;

  constructor(private maxConcurrent: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
    }
  }
}

// Usage: Limit to 4 concurrent file analyses
const limiter = new ConcurrencyLimiter(4);
await Promise.all(
  files.map((file) => limiter.run(() => analyzeFile(file)))
);
```

**Deliverables:**
- [ ] `stream-analyzer.ts` - Streaming file analysis
- [ ] `memory-manager.ts` - Memory management
- [ ] `concurrency-limiter.ts` - Concurrency control
- [ ] Memory usage tests
- [ ] Memory profiling reports

---

### Days 6-7: Extension Startup Optimization

**Goal:** Reduce extension startup time from ~1s to <500ms

#### Task 1: Lazy Load Detectors

**Current:** All detectors loaded at activation
**Target:** Load detectors on-demand

**Implementation:**

```typescript
// odavl-studio/insight/extension/src/lazy-detector-loader.ts

export class LazyDetectorLoader {
  private detectors = new Map<string, () => Promise<Detector>>();
  private loaded = new Map<string, Detector>();

  register(name: string, loader: () => Promise<Detector>): void {
    this.detectors.set(name, loader);
  }

  async get(name: string): Promise<Detector> {
    if (this.loaded.has(name)) {
      return this.loaded.get(name)!;
    }

    const loader = this.detectors.get(name);
    if (!loader) {
      throw new Error(`Detector ${name} not found`);
    }

    const detector = await loader();
    this.loaded.set(name, detector);
    return detector;
  }
}

// Register detectors with lazy loading
loader.register('typescript', async () => {
  const { TypeScriptDetector } = await import('./detector/typescript-detector');
  return new TypeScriptDetector();
});
```

#### Task 2: Defer Non-Critical Initialization

**Implementation:**

```typescript
// odavl-studio/insight/extension/src/extension.ts

export async function activate(context: vscode.ExtensionContext) {
  // Critical: Register commands immediately
  registerCommands(context);

  // Non-critical: Defer initialization
  setTimeout(() => {
    initializeDataService();
    loadDetectors();
    setupFileWatcher();
  }, 100);
}
```

#### Task 3: Bundle Optimization

**Implementation:**

```javascript
// extension/webpack.config.js

module.exports = {
  // ... existing config
  optimization: {
    minimize: true,
    usedExports: true, // Tree shaking
    sideEffects: false,
  },
  externals: {
    vscode: 'commonjs vscode', // Don't bundle VS Code API
  },
};
```

**Deliverables:**
- [ ] Lazy detector loading
- [ ] Deferred initialization
- [ ] Optimized webpack config
- [ ] Startup time benchmarks

---

## Week 6: Code Quality & Security (Days 8-10)

### Days 8-9: Refactoring & Cleanup

**Goal:** Improve code quality and maintainability

#### Task 1: Remove Dead Code

**Analysis Tools:**
- ts-prune (find unused exports)
- knip (detect unused files)
- ESLint unused-imports plugin

**Script:**

```bash
# Install tools
pnpm add -D ts-prune knip

# Find unused exports
pnpm ts-prune

# Find unused files
pnpm knip

# Remove dead code
# (Manual review + deletion)
```

#### Task 2: Simplify Complex Functions

**Targets:**
- Functions with cyclomatic complexity > 10
- Functions > 50 lines
- Nested callbacks (convert to async/await)

**Tool:**

```bash
# Find complex functions
pnpm eslint . --ext .ts --rule 'complexity: ["error", 10]'
```

#### Task 3: Improve Naming

**Standards:**
- Use descriptive names (avoid abbreviations)
- Boolean variables: is/has/should prefix
- Functions: verb-noun pattern
- Classes: PascalCase nouns

#### Task 4: Add Missing Comments

**Focus:**
- Complex algorithms (explain WHY, not WHAT)
- Public APIs (JSDoc with examples)
- Edge cases (document assumptions)

#### Task 5: Extract Reusable Utilities

**Candidates:**
- File system operations
- Error handling
- Logging
- Validation

**Deliverables:**
- [ ] Dead code removal report
- [ ] Refactored functions list
- [ ] Updated naming conventions
- [ ] Documentation improvements
- [ ] New utility modules

---

### Day 10: Security Audit

**Goal:** Fix all security vulnerabilities

#### Task 1: Dependency Audit

**Commands:**

```bash
# pnpm audit
pnpm audit

# Fix auto-fixable issues
pnpm audit --fix

# Generate report
pnpm audit --json > reports/security-audit.json
```

#### Task 2: Snyk Scan

**Setup:**

```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test project
snyk test

# Monitor for future vulnerabilities
snyk monitor
```

#### Task 3: Code Security Review

**Focus Areas:**
- Input validation (path traversal, injection)
- Secret management (no hardcoded secrets)
- Authentication (JWT expiry, secure cookies)
- File operations (validate paths)
- Command execution (use execFile, not exec)

#### Task 4: Add Security Checks to CI

**GitHub Actions:**

```yaml
# .github/workflows/security.yml
name: Security Audit

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      - name: Run pnpm audit
        run: pnpm audit
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Deliverables:**
- [ ] Security audit report
- [ ] Vulnerability fixes
- [ ] Security CI workflow
- [ ] Updated security documentation

---

## Success Criteria

### Performance Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Full Analysis Time | 10-30s | <5s | 🎯 |
| Incremental Analysis | N/A | <1s | 🎯 |
| Memory Usage | Unknown | <200MB | 🎯 |
| Extension Startup | ~1s | <500ms | 🎯 |
| ML Inference | 0.57ms | <1ms | ✅ |

### Code Quality Targets

| Metric | Target | Status |
|--------|--------|--------|
| Dead Code Removed | 100% | 🎯 |
| Complex Functions Refactored | 100% | 🎯 |
| Test Coverage | 80%+ | 🎯 |
| Security Vulnerabilities | 0 | 🎯 |
| ESLint Warnings | 0 | 🎯 |
| TypeScript Errors | 0 | ✅ |

---

## Timeline

```
Week 5 (Days 1-7):
Day 1:    Performance baseline
Days 2-3: Analysis speed optimization
Days 4-5: Memory optimization
Days 6-7: Extension startup optimization

Week 6 (Days 8-10):
Days 8-9: Refactoring & cleanup
Day 10:   Security audit

Total: 10 working days
```

---

## Deliverables

### Code
- [ ] `parallel-executor.ts` - Parallel detector execution
- [ ] `incremental-analyzer.ts` - Incremental analysis
- [ ] `result-cache.ts` - Result caching
- [ ] `stream-analyzer.ts` - Streaming file analysis
- [ ] `memory-manager.ts` - Memory management
- [ ] `concurrency-limiter.ts` - Concurrency control
- [ ] `lazy-detector-loader.ts` - Lazy loading
- [ ] Refactored utility modules

### Documentation
- [ ] `reports/performance-baseline.md` - Baseline metrics
- [ ] `reports/performance-improvements.md` - Final results
- [ ] `reports/refactoring-summary.md` - Code changes
- [ ] `reports/security-audit.md` - Security report

### Tests
- [ ] Performance benchmarks
- [ ] Memory usage tests
- [ ] Integration tests for new features
- [ ] Security tests

---

## Phase 1 Completion

After Weeks 5-6, Phase 1 will be **100% complete**:

✅ Week 1: Build Errors Fixed (100%)  
✅ Week 2: Testing & Quality (100%)  
✅ Week 3: ML Model V2 (80%)  
✅ Week 4: Documentation (100%)  
🎯 Weeks 5-6: Performance & Optimization (0% → 100%)

**Next:** Phase 2 - Infrastructure & Security

---

**Status:** 🚧 IN PROGRESS  
**Start Date:** January 10, 2025  
**Target End Date:** January 24, 2025
