/**
 * Worker Pool Tests
 * 
 * Comprehensive test suite for WorkerPool class.
 * 
 * @since Phase 1 Week 19 (December 2025)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerPool, createWorkerPool } from './worker-pool';
import * as os from 'node:os';

describe('WorkerPool', () => {
  let pool: WorkerPool;

  afterEach(async () => {
    if (pool) {
      await pool.shutdown();
    }
  });

  describe('Configuration', () => {
    it('should use CPU count as default maxWorkers', async () => {
      pool = await createWorkerPool();
      const stats = pool.getStats();
      
      expect(stats.totalWorkers).toBe(os.cpus().length);
    });

    it('should respect custom configuration', async () => {
      pool = await createWorkerPool({
        maxWorkers: 4,
        memoryLimitMB: 512,
        taskTimeoutMs: 15000,
      });
      
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(4);
    });

    it('should throw on invalid configuration', async () => {
      await expect(async () => {
        pool = await createWorkerPool({ maxWorkers: 0 });
      }).rejects.toThrow();
    });
  });

  describe('Initialization', () => {
    it('should create N workers on initialize()', async () => {
      pool = new WorkerPool({ maxWorkers: 4 });
      await pool.initialize();
      
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(4);
      expect(stats.idleWorkers).toBe(4);
    });

    it('should emit ready event when initialized', async () => {
      let readyEmitted = false;
      
      pool = new WorkerPool({ maxWorkers: 2 });
      pool.on('ready', () => {
        readyEmitted = true;
      });
      
      await pool.initialize();
      expect(readyEmitted).toBe(true);
    });
  });

  describe('Task Processing', () => {
    beforeEach(async () => {
      pool = await createWorkerPool({ maxWorkers: 4 });
    });

    it('should process single task', async () => {
      const task = {
        id: 'task1',
        type: 'read-file',
        data: { filePath: __filename },
      };
      
      const result = await pool.submit(task);
      
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task1');
      expect(result.data).toBeDefined();
    });

    it('should process multiple tasks in parallel', async () => {
      const tasks = Array.from({ length: 8 }, (_, i) => ({
        id: `task${i}`,
        type: 'read-file',
        data: { filePath: __filename },
      }));
      
      const startTime = Date.now();
      const results = await pool.process(tasks);
      const duration = Date.now() - startTime;
      
      expect(results.length).toBe(8);
      expect(results.every(r => r.success)).toBe(true);
      
      // Should be faster than sequential (rough check)
      expect(duration).toBeLessThan(5000);
    });

    it('should respect task priorities', async () => {
      const tasks = [
        { id: 'low', type: 'sleep', data: { ms: 100 }, priority: 1 },
        { id: 'high', type: 'sleep', data: { ms: 100 }, priority: 10 },
        { id: 'medium', type: 'sleep', data: { ms: 100 }, priority: 5 },
      ];
      
      const completionOrder: string[] = [];
      
      pool.on('taskComplete', (result) => {
        completionOrder.push(result.taskId);
      });
      
      await pool.process(tasks);
      
      // High priority should complete first
      expect(completionOrder[0]).toBe('high');
    });

    it('should handle task timeout', async () => {
      const pool = await createWorkerPool({
        maxWorkers: 2,
        taskTimeoutMs: 500,
      });
      
      const task = {
        id: 'timeout-task',
        type: 'sleep',
        data: { ms: 2000 }, // Will timeout
      };
      
      const result = await pool.submit(task);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      
      await pool.shutdown();
    }, 10000);

    it('should return results in correct order', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task${i}`,
        type: 'echo',
        data: { value: i },
      }));
      
      const results = await pool.process(tasks);
      
      results.forEach((result, i) => {
        expect(result.taskId).toBe(`task${i}`);
      });
    });
  });

  describe('Worker Management', () => {
    beforeEach(async () => {
      pool = await createWorkerPool({ maxWorkers: 4 });
    });

    it('should restart crashed worker', async () => {
      let errorEmitted = false;
      
      pool.on('workerError', () => {
        errorEmitted = true;
      });
      
      // Submit task that crashes worker
      const task = {
        id: 'crash-task',
        type: 'crash',
        data: {},
      };
      
      await pool.submit(task);
      
      expect(errorEmitted).toBe(true);
      
      // Pool should still be functional
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(4);
    }, 10000);

    it('should handle worker error gracefully', async () => {
      const task = {
        id: 'error-task',
        type: 'throw-error',
        data: {},
      };
      
      const result = await pool.submit(task);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Pool should still work
      const stats = pool.getStats();
      expect(stats.idleWorkers).toBeGreaterThan(0);
    });

    it('should recover from multiple worker failures', async () => {
      const tasks = Array.from({ length: 4 }, (_, i) => ({
        id: `crash${i}`,
        type: 'crash',
        data: {},
      }));
      
      await pool.process(tasks);
      
      // All workers should be restarted
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(4);
      
      // Should still process normal tasks
      const normalTask = {
        id: 'normal',
        type: 'echo',
        data: { value: 1 },
      };
      
      const result = await pool.submit(normalTask);
      expect(result.success).toBe(true);
    }, 15000);
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      pool = await createWorkerPool({ maxWorkers: 4 });
    });

    it('should track worker utilization', async () => {
      const stats1 = pool.getStats();
      expect(stats1.utilizationRate).toBe(0);
      
      // Submit long-running tasks
      const tasks = Array.from({ length: 4 }, (_, i) => ({
        id: `task${i}`,
        type: 'sleep',
        data: { ms: 1000 },
      }));
      
      const promise = pool.process(tasks);
      
      // Check utilization while running
      await new Promise(resolve => setTimeout(resolve, 100));
      const stats2 = pool.getStats();
      expect(stats2.utilizationRate).toBeGreaterThan(0);
      
      await promise;
    }, 10000);

    it('should report accurate memory usage', async () => {
      const stats = pool.getStats();
      
      expect(stats.memoryUsageMB).toBeGreaterThan(0);
      expect(stats.memoryUsageMB).toBeLessThan(5000); // Sanity check
    });

    it('should track active tasks', async () => {
      const tasks = Array.from({ length: 8 }, (_, i) => ({
        id: `task${i}`,
        type: 'sleep',
        data: { ms: 500 },
      }));
      
      const promise = pool.process(tasks);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = pool.getStats();
      expect(stats.activeTasks).toBeGreaterThan(0);
      expect(stats.busyWorkers).toBeGreaterThan(0);
      
      await promise;
    }, 10000);
  });

  describe('Shutdown', () => {
    it('should gracefully shutdown with active tasks', async () => {
      pool = await createWorkerPool({ maxWorkers: 4 });
      
      // Submit long-running tasks
      const tasks = Array.from({ length: 4 }, (_, i) => ({
        id: `task${i}`,
        type: 'sleep',
        data: { ms: 500 },
      }));
      
      const promise = pool.process(tasks);
      
      // Shutdown while tasks running
      const shutdownPromise = pool.shutdown();
      
      // Should wait for tasks
      await Promise.all([promise, shutdownPromise]);
      
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(0);
    }, 10000);

    it('should force terminate on shutdown timeout', async () => {
      pool = await createWorkerPool({
        maxWorkers: 2,
        taskTimeoutMs: 60000, // Long timeout
      });
      
      // Submit very long tasks
      const tasks = [
        { id: 'long1', type: 'sleep', data: { ms: 60000 } },
        { id: 'long2', type: 'sleep', data: { ms: 60000 } },
      ];
      
      const promise = pool.process(tasks);
      
      // Shutdown with short wait
      const startTime = Date.now();
      await pool.shutdown();
      const duration = Date.now() - startTime;
      
      // Should force terminate around 30s
      expect(duration).toBeLessThan(35000);
      expect(duration).toBeGreaterThan(25000);
    }, 40000);

    it('should emit shutdown event', async () => {
      pool = await createWorkerPool({ maxWorkers: 2 });
      
      let shutdownEmitted = false;
      pool.on('shutdown', () => {
        shutdownEmitted = true;
      });
      
      await pool.shutdown();
      
      expect(shutdownEmitted).toBe(true);
    });
  });

  describe('Load Balancing', () => {
    it('should distribute tasks evenly', async () => {
      pool = await createWorkerPool({ maxWorkers: 4 });
      
      const taskCounts = new Map<number, number>();
      
      pool.on('taskComplete', (result) => {
        const count = taskCounts.get(result.workerId) || 0;
        taskCounts.set(result.workerId, count + 1);
      });
      
      // Submit many tasks
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task${i}`,
        type: 'echo',
        data: { value: i },
      }));
      
      await pool.process(tasks);
      
      // Check distribution is relatively even
      const counts = Array.from(taskCounts.values());
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      
      counts.forEach(count => {
        expect(Math.abs(count - avg)).toBeLessThan(3); // Within 3 tasks
      });
    });
  });
});
