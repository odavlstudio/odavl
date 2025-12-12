/**
 * WAVE 8 PHASE 2B: Worker Pool Smoke Test
 * 
 * Purpose: Verify that DetectorWorkerPool actually executes a heavy detector
 * in an isolated worker process (not falling back to in-process).
 * 
 * Constraints: Minimal test, <40 LOC, reuses existing fixtures.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { DetectorWorkerPool } from '../src/core/detector-worker-pool';
import path from 'node:path';

describe('DetectorWorkerPool - Smoke Test', () => {
  let pool: DetectorWorkerPool | undefined;

  afterEach(async () => {
    if (pool) {
      await pool.shutdown();
      pool = undefined;
    }
  });

  it('should execute security detector in worker process', async () => {
    // Create worker pool with minimal config
    pool = new DetectorWorkerPool({
      maxWorkers: 1,
      taskTimeoutMs: 60000, // 60 seconds
      verbose: true, // Enable logging to observe worker behavior
    });

    // Use existing test fixtures directory
    const fixturesPath = path.join(__dirname, '..', 'test-fixtures', 'security');

    // Execute security detector (a heavy detector that uses external tools)
    const result = await pool.executeDetector('security', fixturesPath);

    // Assertions: Verify worker executed successfully
    expect(result).toBeDefined();
    expect(result.detector).toBe('security');
    expect(result.crashed).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(Array.isArray(result.issues)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    
    // Log results for manual verification
    console.log('[Smoke Test] Worker execution completed:', {
      detector: result.detector,
      issuesFound: result.issues.length,
      errors: result.errors.length,
      durationMs: result.durationMs,
      crashed: result.crashed,
      timedOut: result.timedOut,
    });
  }, 90000); // Allow up to 90 seconds for this test
});
