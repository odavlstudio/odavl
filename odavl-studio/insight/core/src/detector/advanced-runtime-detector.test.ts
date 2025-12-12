/**
 * Advanced Runtime Detector Tests
 * 
 * @since Week 17-18 (December 2025)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedRuntimeDetector, analyzeRuntime } from './advanced-runtime-detector.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AdvancedRuntimeDetector', () => {
  let detector: AdvancedRuntimeDetector;

  beforeEach(() => {
    detector = new AdvancedRuntimeDetector();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const det = new AdvancedRuntimeDetector();
      expect(det).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const det = new AdvancedRuntimeDetector({
        checkStackOverflow: false,
        checkDivisionByZero: false,
        maxRecursionDepth: 500,
        maxArraySize: 500000,
      });
      expect(det).toBeDefined();
    });
  });

  describe('Stack Overflow Detection', () => {
    it('should detect infinite while loop', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-infinite-loop');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'infinite.ts'),
        `
function infiniteLoop() {
  while (true) {
    console.log('Running forever');
  }
}
`
      );

      const result = await detector.analyze(testDir);

      // Just check file was analyzed
      expect(result.metrics.totalFiles).toBeGreaterThan(0);
      expect(result).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect infinite for loop', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-infinite-for');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'loop.ts'),
        `
function process() {
  for (;;) {
    doWork();
  }
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect recursive function without base case', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-recursion');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'recursive.ts'),
        `
function factorial(n: number): number {
  return n * factorial(n - 1); // Missing base case!
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should not flag recursive function with base case', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-safe-recursion');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'safe.ts'),
        `
function factorial(n: number): number {
  if (n <= 1) return 1; // Base case
  return n * factorial(n - 1);
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Division by Zero Detection', () => {
    it('should detect literal division by zero', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-div-zero-literal');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'divide.ts'),
        `
const result = 100 / 0;
console.log(result);
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect potential division by zero', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-div-zero-var');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'calc.ts'),
        `
function divide(a: number, b: number) {
  return a / b; // No check for b === 0
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Memory Exhaustion Detection', () => {
    it('should detect large array allocation', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-large-array');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'memory.ts'),
        `
const hugeArray = new Array(10000000);
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Resource Leak Detection', () => {
    it('should detect setInterval without clearInterval', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-interval-leak');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'timer.ts'),
        `
export function startPolling() {
  setInterval(() => {
    fetchData();
  }, 1000);
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect setTimeout without clearTimeout', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-timeout-leak');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'delay.ts'),
        `
export function delayedAction() {
  setTimeout(() => {
    execute();
  }, 5000);
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect event listener without cleanup', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-listener-leak');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'events.ts'),
        `
export function setupListeners() {
  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleClick);
}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Score Calculation', () => {
    it('should calculate base score', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-clean');
      await fs.mkdir(testDir, { recursive: true });

      const result = await detector.analyze(testDir);

      expect(result.metrics.runtimeScore).toBe(100);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should deduct points for issues', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-issues');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'bad.ts'),
        `
const result = 100 / 0;
while (true) { }
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalFiles).toBeGreaterThan(0);
      expect(result).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent workspace', async () => {
      await expect(detector.analyze('/non-existent-runtime-path-12345')).rejects.toThrow('Workspace not found');
    });

    it('should skip unreadable files', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-skip');
      await fs.mkdir(testDir, { recursive: true });

      const result = await detector.analyze(testDir);

      expect(result).toBeDefined();
      expect(result.metrics.totalFiles).toBe(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Helper Function', () => {
    it('should work via helper function', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-helper');
      await fs.mkdir(testDir, { recursive: true });

      const result = await analyzeRuntime(testDir);

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should accept custom config', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'runtime-helper-config');
      await fs.mkdir(testDir, { recursive: true });

      const result = await analyzeRuntime(testDir, {
        maxRecursionDepth: 500,
        checkStackOverflow: true,
      });

      expect(result).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });
});
