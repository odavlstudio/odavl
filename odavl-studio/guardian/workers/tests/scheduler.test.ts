import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GuardianScheduler } from '../src/scheduler.js';
import fs from 'node:fs';

describe('GuardianScheduler', () => {
  const testDbPath = './test-guardian.db';
  let scheduler: GuardianScheduler;

  beforeEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    scheduler = new GuardianScheduler(testDbPath);
  });

  afterEach(() => {
    scheduler.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('createTest', () => {
    it('should create a scheduled test with valid cron pattern', () => {
      const testId = scheduler.createTest({
        name: 'Daily Test',
        url: 'https://example.com',
        schedule: '0 0 * * *', // Daily at midnight
        enabled: true
      });

      expect(testId).toMatch(/^test-\d+-[a-z0-9]+$/);
      
      const test = scheduler.getTest(testId);
      expect(test).toBeDefined();
      expect(test?.name).toBe('Daily Test');
      expect(test?.url).toBe('https://example.com');
      expect(test?.schedule).toBe('0 0 * * *');
      expect(test?.enabled).toBe(true);
    });

    it('should reject invalid cron pattern', () => {
      expect(() => {
        scheduler.createTest({
          name: 'Invalid Test',
          url: 'https://example.com',
          schedule: 'invalid-pattern',
          enabled: true
        });
      }).toThrow('Invalid cron pattern');
    });

    it('should store test with detectors array', () => {
      const testId = scheduler.createTest({
        name: 'Performance Test',
        url: 'https://example.com',
        schedule: '*/5 * * * *', // Every 5 minutes
        enabled: true,
        detectors: ['white-screen', 'performance', 'accessibility']
      });

      const test = scheduler.getTest(testId);
      expect(test?.detectors).toEqual(['white-screen', 'performance', 'accessibility']);
    });
  });

  describe('listTests', () => {
    it('should list all scheduled tests', () => {
      scheduler.createTest({
        name: 'Test 1',
        url: 'https://example1.com',
        schedule: '0 0 * * *',
        enabled: true
      });

      scheduler.createTest({
        name: 'Test 2',
        url: 'https://example2.com',
        schedule: '0 12 * * *',
        enabled: false
      });

      const tests = scheduler.listTests();
      expect(tests).toHaveLength(2);
      expect(tests.map(t => t.name)).toEqual(['Test 2', 'Test 1']); // DESC order
    });

    it('should return empty array when no tests exist', () => {
      const tests = scheduler.listTests();
      expect(tests).toEqual([]);
    });
  });

  describe('updateTest', () => {
    it('should update test properties', () => {
      const testId = scheduler.createTest({
        name: 'Original Name',
        url: 'https://example.com',
        schedule: '0 0 * * *',
        enabled: true
      });

      scheduler.updateTest(testId, {
        name: 'Updated Name',
        url: 'https://new-example.com',
        enabled: false
      });

      const test = scheduler.getTest(testId);
      expect(test?.name).toBe('Updated Name');
      expect(test?.url).toBe('https://new-example.com');
      expect(test?.enabled).toBe(false);
      expect(test?.schedule).toBe('0 0 * * *'); // Unchanged
    });

    it('should validate cron pattern on update', () => {
      const testId = scheduler.createTest({
        name: 'Test',
        url: 'https://example.com',
        schedule: '0 0 * * *',
        enabled: true
      });

      expect(() => {
        scheduler.updateTest(testId, {
          schedule: 'invalid'
        });
      }).toThrow('Invalid cron pattern');
    });

    it('should throw if test not found', () => {
      expect(() => {
        scheduler.updateTest('non-existent-id', { name: 'New Name' });
      }).toThrow('Test not found');
    });
  });

  describe('deleteTest', () => {
    it('should delete a test', () => {
      const testId = scheduler.createTest({
        name: 'Test to Delete',
        url: 'https://example.com',
        schedule: '0 0 * * *',
        enabled: true
      });

      scheduler.deleteTest(testId);

      const test = scheduler.getTest(testId);
      expect(test).toBeNull();
    });
  });

  describe('getTestStats', () => {
    it('should return zero stats for test with no executions', () => {
      const testId = scheduler.createTest({
        name: 'Stats Test',
        url: 'https://example.com',
        schedule: '0 0 * * *',
        enabled: false
      });

      const stats = scheduler.getTestStats(testId);
      expect(stats.totalExecutions).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.lastExecution).toBeUndefined();
    });
  });

  describe('cron patterns', () => {
    it('should accept every minute pattern', () => {
      const testId = scheduler.createTest({
        name: 'Every Minute',
        url: 'https://example.com',
        schedule: '* * * * *',
        enabled: false // Disabled to avoid actual execution
      });

      const test = scheduler.getTest(testId);
      expect(test?.schedule).toBe('* * * * *');
    });

    it('should accept every hour pattern', () => {
      const testId = scheduler.createTest({
        name: 'Every Hour',
        url: 'https://example.com',
        schedule: '0 * * * *',
        enabled: false
      });

      const test = scheduler.getTest(testId);
      expect(test?.schedule).toBe('0 * * * *');
    });

    it('should accept specific time patterns', () => {
      const patterns = [
        '0 9 * * 1-5',  // Weekdays at 9am
        '0 0 1 * *',    // First day of month
        '*/15 * * * *', // Every 15 minutes
        '0 */6 * * *'   // Every 6 hours
      ];

      patterns.forEach((pattern, i) => {
        const testId = scheduler.createTest({
          name: `Pattern Test ${i}`,
          url: 'https://example.com',
          schedule: pattern,
          enabled: false
        });

        const test = scheduler.getTest(testId);
        expect(test?.schedule).toBe(pattern);
      });
    });
  });
});
