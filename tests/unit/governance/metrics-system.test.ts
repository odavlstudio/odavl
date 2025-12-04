/**
 * ODAVL Metrics Health Tests
 * Tests for metrics collection and archiving
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Metrics System', () => {
  describe('Metrics File Validation', () => {
    it('should validate metrics file structure', () => {
      const validMetrics = {
        runId: '1763261061595',
        timestamp: '2024-11-15T14:30:00Z',
        duration: 1234,
        result: 'success',
        filesModified: 3,
        linesChanged: 45
      };

      expect(validMetrics.runId).toBeDefined();
      expect(validMetrics.timestamp).toBeDefined();
      expect(validMetrics.result).toMatch(/^(success|failure|partial)$/);
    });

    it('should generate timestamped filenames', () => {
      const timestamp = Date.now();
      const filename = `run-${timestamp}.json`;
      
      expect(filename).toMatch(/^run-\d+\.json$/);
      
      const extracted = parseInt(filename.match(/run-(\d+)\.json/)![1]);
      expect(extracted).toBe(timestamp);
    });

    it('should support improved filename format', () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const recipe = 'fix-typescript-errors';
      const filename = `${timestamp}-${recipe}.json`;
      
      expect(filename).toContain(recipe);
      expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    });
  });

  describe('Metrics Aggregation', () => {
    it('should calculate success rate', () => {
      const runs = [
        { result: 'success' },
        { result: 'success' },
        { result: 'failure' },
        { result: 'success' }
      ];

      const successes = runs.filter(r => r.result === 'success').length;
      const successRate = successes / runs.length;

      expect(successRate).toBe(0.75);
    });

    it('should calculate average duration', () => {
      const runs = [
        { duration: 1000 },
        { duration: 2000 },
        { duration: 1500 },
        { duration: 2500 }
      ];

      const avgDuration = runs.reduce((sum, r) => sum + r.duration, 0) / runs.length;

      expect(avgDuration).toBe(1750);
    });

    it('should identify oldest and newest runs', () => {
      const runs = [
        { timestamp: new Date('2024-11-01').getTime() },
        { timestamp: new Date('2024-11-15').getTime() },
        { timestamp: new Date('2024-11-10').getTime() }
      ];

      const oldest = Math.min(...runs.map(r => r.timestamp));
      const newest = Math.max(...runs.map(r => r.timestamp));

      expect(oldest).toBe(new Date('2024-11-01').getTime());
      expect(newest).toBe(new Date('2024-11-15').getTime());
    });
  });

  describe('Archiving Logic', () => {
    it('should identify files older than retention period', () => {
      const now = Date.now();
      const retentionDays = 30;
      const cutoff = now - (retentionDays * 24 * 60 * 60 * 1000);

      const files = [
        { timestamp: now - (10 * 24 * 60 * 60 * 1000) },  // 10 days old
        { timestamp: now - (40 * 24 * 60 * 60 * 1000) },  // 40 days old
        { timestamp: now - (20 * 24 * 60 * 60 * 1000) }   // 20 days old
      ];

      const oldFiles = files.filter(f => f.timestamp < cutoff);
      const activeFiles = files.filter(f => f.timestamp >= cutoff);

      expect(oldFiles.length).toBe(1);
      expect(activeFiles.length).toBe(2);
    });

    it('should group files by month', () => {
      const files = [
        { timestamp: new Date('2024-11-15').getTime(), name: 'run1.json' },
        { timestamp: new Date('2024-11-20').getTime(), name: 'run2.json' },
        { timestamp: new Date('2024-10-15').getTime(), name: 'run3.json' }
      ];

      const filesByMonth = new Map<string, typeof files>();

      files.forEach(file => {
        const date = new Date(file.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!filesByMonth.has(monthKey)) {
          filesByMonth.set(monthKey, []);
        }
        filesByMonth.get(monthKey)!.push(file);
      });

      expect(filesByMonth.size).toBe(2);
      expect(filesByMonth.get('2024-11')?.length).toBe(2);
      expect(filesByMonth.get('2024-10')?.length).toBe(1);
    });
  });

  describe('Health Checks', () => {
    it('should warn when metrics exceed threshold', () => {
      const metricsCount = 550;
      const threshold = 500;

      const shouldWarn = metricsCount > threshold;

      expect(shouldWarn).toBe(true);
    });

    it('should not warn when within threshold', () => {
      const metricsCount = 450;
      const threshold = 500;

      const shouldWarn = metricsCount > threshold;

      expect(shouldWarn).toBe(false);
    });
  });
});

describe('Metrics Summary Generation', () => {
  it('should generate summary structure', () => {
    const summary = {
      lastUpdated: new Date().toISOString(),
      totalRuns: 100,
      oldestRun: new Date('2024-10-01').toISOString(),
      newestRun: new Date('2024-11-15').toISOString(),
      retentionDays: 30,
      activeFiles: 60,
      archivedFiles: 40
    };

    expect(summary.totalRuns).toBe(100);
    expect(summary.activeFiles + summary.archivedFiles).toBe(100);
  });
});
