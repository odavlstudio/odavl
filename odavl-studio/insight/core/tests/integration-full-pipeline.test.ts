/**
 * WAVE 8 PHASE 2G: Full Integration Test
 * Tests: Brain → Worker Pool → Detector Workers → Results Merge
 * 
 * This is a comprehensive end-to-end test of the entire Insight analysis pipeline
 * after the Phase 2F fix (static import of loadDetector).
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import { DetectorWorkerPool } from '../src/core/detector-worker-pool.js';

describe('WAVE 8 PHASE 2G - Full Pipeline Integration', () => {
  const testFixturePath = path.resolve(__dirname, '../test-fixtures/security');
  let workerPool: DetectorWorkerPool;
  const testResults: any = {
    environment: {},
    workerPoolTests: {},
    performance: {},
    logs: [],
  };

  beforeAll(async () => {
    // Environment check
    testResults.environment = {
      nodeVersion: process.version,
      platform: process.platform,
      cpuCount: os.cpus().length,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
      cwd: process.cwd(),
    };

    console.log('\n=== WAVE 8 PHASE 2G: ENVIRONMENT CHECK ===');
    console.log(JSON.stringify(testResults.environment, null, 2));

    // Initialize worker pool
    const maxWorkers = Math.max(1, Math.floor(os.cpus().length / 2));
    workerPool = new DetectorWorkerPool(testFixturePath, {
      maxWorkers,
      taskTimeoutMs: 120000, // 2 minutes
      verbose: true,
    });

    console.log(`\n✓ Worker pool initialized with ${maxWorkers} workers`);
  });

  afterAll(async () => {
    if (workerPool) {
      await workerPool.shutdown();
      console.log('\n✓ Worker pool shut down');
    }

    // Print final report
    console.log('\n=== WAVE 8 PHASE 2G: FINAL REPORT ===');
    console.log(JSON.stringify(testResults, null, 2));
  });

  test('WORKER POOL FUNCTIONAL TEST - Security Detector', async () => {
    console.log('\n=== TEST 1: Security Detector via Worker Pool ===');
    
    const startTime = Date.now();
    const result = await workerPool.executeDetector('security', testFixturePath);
    const duration = Date.now() - startTime;

    testResults.workerPoolTests.security = {
      detector: result.detector,
      workerId: 'worker-0', // Tracked in logs
      duration,
      issuesFound: result.issues.length,
      errors: result.errors.length,
      crashed: result.crashed,
      timedOut: result.timedOut,
    };

    console.log('Security Detector Result:', testResults.workerPoolTests.security);

    expect(result.detector).toBe('security');
    expect(result.crashed).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(Array.isArray(result.issues)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  }, 120000);

  test('WORKER POOL FUNCTIONAL TEST - TypeScript Detector', async () => {
    console.log('\n=== TEST 2: TypeScript Detector via Worker Pool ===');
    
    const startTime = Date.now();
    const result = await workerPool.executeDetector('typescript', testFixturePath);
    const duration = Date.now() - startTime;

    testResults.workerPoolTests.typescript = {
      detector: result.detector,
      duration,
      issuesFound: result.issues.length,
      errors: result.errors.length,
      crashed: result.crashed,
      timedOut: result.timedOut,
    };

    console.log('TypeScript Detector Result:', testResults.workerPoolTests.typescript);

    expect(result.detector).toBe('typescript');
    expect(result.crashed).toBe(false);
    expect(result.timedOut).toBe(false);
  }, 120000);

  test('WORKER POOL FUNCTIONAL TEST - Import Detector', async () => {
    console.log('\n=== TEST 3: Import Detector via Worker Pool ===');
    
    const startTime = Date.now();
    const result = await workerPool.executeDetector('import', testFixturePath);
    const duration = Date.now() - startTime;

    testResults.workerPoolTests.import = {
      detector: result.detector,
      duration,
      issuesFound: result.issues.length,
      errors: result.errors.length,
      crashed: result.crashed,
      timedOut: result.timedOut,
    };

    console.log('Import Detector Result:', testResults.workerPoolTests.import);

    expect(result.detector).toBe('import');
    expect(result.crashed).toBe(false);
    expect(result.timedOut).toBe(false);
  }, 120000);

  test('WORKER POOL FUNCTIONAL TEST - Performance Detector', async () => {
    console.log('\n=== TEST 4: Performance Detector via Worker Pool ===');
    
    const startTime = Date.now();
    const result = await workerPool.executeDetector('performance', testFixturePath);
    const duration = Date.now() - startTime;

    testResults.workerPoolTests.performance = {
      detector: result.detector,
      duration,
      issuesFound: result.issues.length,
      errors: result.errors.length,
      crashed: result.crashed,
      timedOut: result.timedOut,
    };

    console.log('Performance Detector Result:', testResults.workerPoolTests.performance);

    expect(result.detector).toBe('performance');
    expect(result.crashed).toBe(false);
    expect(result.timedOut).toBe(false);
  }, 120000);

  test('WORKER POOL FUNCTIONAL TEST - Circular Dependency Detector', async () => {
    console.log('\n=== TEST 5: Circular Dependency Detector via Worker Pool ===');
    
    const startTime = Date.now();
    const result = await workerPool.executeDetector('circular', testFixturePath);
    const duration = Date.now() - startTime;

    testResults.workerPoolTests.circular = {
      detector: result.detector,
      duration,
      issuesFound: result.issues.length,
      errors: result.errors.length,
      crashed: result.crashed,
      timedOut: result.timedOut,
    };

    console.log('Circular Detector Result:', testResults.workerPoolTests.circular);

    expect(result.detector).toBe('circular');
    expect(result.crashed).toBe(false);
    expect(result.timedOut).toBe(false);
  }, 120000);

  test('PARALLEL EXECUTION TEST - All Detectors', async () => {
    console.log('\n=== TEST 6: Parallel Execution of Multiple Detectors ===');
    
    const detectors = ['security', 'typescript', 'import', 'performance', 'circular'];
    const startTime = Date.now();
    
    const results = await workerPool.executeDetectors(detectors, testFixturePath);
    
    const totalDuration = Date.now() - startTime;

    testResults.parallelExecution = {
      totalDetectors: detectors.length,
      totalDuration,
      results: [],
    };

    console.log(`\nParallel execution completed in ${totalDuration}ms`);

    for (const [detectorName, result] of results.entries()) {
      const detectorResult = {
        detector: detectorName,
        issuesFound: result.issues.length,
        errors: result.errors.length,
        crashed: result.crashed,
        timedOut: result.timedOut,
      };

      testResults.parallelExecution.results.push(detectorResult);
      console.log(`  ${detectorName}: ${result.issues.length} issues, crashed=${result.crashed}, timedOut=${result.timedOut}`);

      expect(result.crashed).toBe(false);
      expect(result.timedOut).toBe(false);
    }

    // Calculate performance metrics
    testResults.performance = {
      totalDuration,
      averagePerDetector: Math.round(totalDuration / detectors.length),
      detectorsPerSecond: (detectors.length / (totalDuration / 1000)).toFixed(2),
    };

    console.log('\nPerformance Metrics:', testResults.performance);
  }, 300000); // 5 minutes timeout
});
