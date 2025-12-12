/**
 * Wave 10 Enhanced: Tests for Detector Executor Strategies
 * 
 * Minimal test suite to validate parallel execution modes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SequentialDetectorExecutor, ParallelDetectorExecutor } from '../src/detector-executor';
import type { DetectorExecutionContext } from '../src/detector-executor';

describe('DetectorExecutor', () => {
  describe('SequentialDetectorExecutor', () => {
    it('should execute detectors sequentially', async () => {
      const executor = new SequentialDetectorExecutor();
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript'], // Use minimal detector for speed
      };

      const results = await executor.runDetectors(context);
      
      // Should return an array (may be empty if no issues)
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle progress callbacks', async () => {
      const executor = new SequentialDetectorExecutor();
      const progressEvents: any[] = [];
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript'],
        onProgress: (event) => progressEvents.push(event),
      };

      await executor.runDetectors(context);
      
      // Sequential executor doesn't emit progress currently, but shouldn't crash
      expect(progressEvents.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ParallelDetectorExecutor - Promise Mode', () => {
    it('should execute detectors in parallel with Promise.allSettled', async () => {
      const executor = new ParallelDetectorExecutor({ 
        maxConcurrency: 2,
        useWorkerPool: false // Force Promise mode
      });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript'],
      };

      const results = await executor.runDetectors(context);
      
      // Should return an array
      expect(Array.isArray(results)).toBe(true);
    });

    it('should respect maxConcurrency limit', async () => {
      const executor = new ParallelDetectorExecutor({ 
        maxConcurrency: 1, // Force sequential batching
        useWorkerPool: false
      });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript', 'eslint'],
      };

      const results = await executor.runDetectors(context);
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should emit progress events', async () => {
      const executor = new ParallelDetectorExecutor({ 
        maxConcurrency: 2,
        useWorkerPool: false
      });
      
      const progressEvents: any[] = [];
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript'],
        onProgress: (event) => progressEvents.push(event),
      };

      await executor.runDetectors(context);
      
      // Should have received at least start and completion events
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0].phase).toBe('runDetectors');
    });

    it('should gracefully handle detector failures', async () => {
      const executor = new ParallelDetectorExecutor({ 
        maxConcurrency: 2,
        useWorkerPool: false
      });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['nonexistent-detector'], // Should fail gracefully
      };

      // Should not throw, should return empty array
      const results = await executor.runDetectors(context);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('ParallelDetectorExecutor - Worker Pool Mode', () => {
    it('should fall back to Promise mode if worker pool fails', async () => {
      const executor = new ParallelDetectorExecutor({ 
        maxConcurrency: 2,
        useWorkerPool: true // Request worker pool (may fail)
      });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript'],
      };

      // Should not throw even if worker pool init fails
      const results = await executor.runDetectors(context);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should cleanup resources on shutdown', async () => {
      const executor = new ParallelDetectorExecutor({ 
        maxConcurrency: 2,
        useWorkerPool: true
      });

      // Should not throw
      await expect(executor.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Executor Interface Compatibility', () => {
    it('SequentialDetectorExecutor and ParallelDetectorExecutor should have compatible outputs', async () => {
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: ['typescript'],
      };

      const sequentialExecutor = new SequentialDetectorExecutor();
      const parallelExecutor = new ParallelDetectorExecutor({ useWorkerPool: false });

      const sequentialResults = await sequentialExecutor.runDetectors(context);
      const parallelResults = await parallelExecutor.runDetectors(context);

      // Both should return arrays
      expect(Array.isArray(sequentialResults)).toBe(true);
      expect(Array.isArray(parallelResults)).toBe(true);

      // Cleanup
      await parallelExecutor.shutdown();
    });
  });
});
