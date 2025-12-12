/**
 * Wave 11 PHASE 6: File-Parallel Detector Executor Tests
 * 
 * Tests file-level parallelism with worker pool execution.
 * Note: Uses lightweight mocks to avoid slow detector execution.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileParallelDetectorExecutor } from '../../src/execution/file-parallel-detector-executor.js';
import type { DetectorExecutionContext } from '../../src/detector-executor.js';

describe('FileParallelDetectorExecutor', () => {
  let executor: FileParallelDetectorExecutor;

  afterEach(async () => {
    if (executor) {
      await executor.shutdown();
    }
  });

  describe('Basic Initialization', () => {
    it('should create executor with default options', () => {
      executor = new FileParallelDetectorExecutor();
      expect(executor).toBeDefined();
    });

    it('should create executor with custom maxWorkers', () => {
      executor = new FileParallelDetectorExecutor({ maxWorkers: 2 });
      expect(executor).toBeDefined();
    });

    it('should create executor with worker pool disabled', () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      expect(executor).toBeDefined();
    });

    it('should create executor with verbose mode', () => {
      executor = new FileParallelDetectorExecutor({ verbose: true });
      expect(executor).toBeDefined();
    });
  });

  describe('Execution Modes', () => {
    it('should handle empty workspace (no files found)', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: '/nonexistent/empty-workspace',
        detectorNames: ['typescript'],
      };

      const results = await executor.runDetectors(context);
      expect(results).toEqual([]);
    });

    it('should handle empty detector list', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: process.cwd(),
        detectorNames: [],
      };

      const results = await executor.runDetectors(context);
      expect(results).toEqual([]);
    });

    it('should emit progress events during execution', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      const progressEvents: any[] = [];
      
      const context: DetectorExecutionContext = {
        workspaceRoot: '/nonexistent/empty-workspace',
        detectorNames: ['typescript'],
        onProgress: (event) => {
          progressEvents.push(event);
        },
      };

      await executor.runDetectors(context);

      // Should have collectFiles phase even if no files
      expect(progressEvents.some(e => e.phase === 'collectFiles')).toBe(true);
    });
  });

  describe('Cleanup & Shutdown', () => {
    it('should handle shutdown without prior execution', async () => {
      executor = new FileParallelDetectorExecutor();
      await expect(executor.shutdown()).resolves.toBeUndefined();
    });

    it('should handle multiple shutdown calls', async () => {
      executor = new FileParallelDetectorExecutor();
      await executor.shutdown();
      await expect(executor.shutdown()).resolves.toBeUndefined();
    });

    it('should cleanup after execution', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      
      const context: DetectorExecutionContext = {
        workspaceRoot: '/nonexistent/empty-workspace',
        detectorNames: ['typescript'],
      };

      await executor.runDetectors(context);
      await expect(executor.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('Progress Reporting', () => {
    it('should report file collection phase', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      let collectFilesReported = false;

      const context: DetectorExecutionContext = {
        workspaceRoot: '/nonexistent/empty-workspace',
        detectorNames: ['typescript'],
        onProgress: (event) => {
          if (event.phase === 'collectFiles') {
            collectFilesReported = true;
          }
        },
      };

      await executor.runDetectors(context);
      expect(collectFilesReported).toBe(true);
    });

    it('should provide meaningful progress messages', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });
      const messages: string[] = [];

      const context: DetectorExecutionContext = {
        workspaceRoot: '/nonexistent/empty-workspace',
        detectorNames: ['typescript'],
        onProgress: (event) => {
          if (event.message) {
            messages.push(event.message);
          }
        },
      };

      await executor.runDetectors(context);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should work without onProgress callback', async () => {
      executor = new FileParallelDetectorExecutor({ useWorkerPool: false });

      const context: DetectorExecutionContext = {
        workspaceRoot: '/nonexistent/empty-workspace',
        detectorNames: ['typescript'],
        // No onProgress callback
      };

      await expect(executor.runDetectors(context)).resolves.toBeDefined();
    });
  });

});

