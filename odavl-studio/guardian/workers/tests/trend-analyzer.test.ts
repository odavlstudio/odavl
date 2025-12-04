import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrendAnalyzer } from '../src/trend-analyzer.js';
import type { TestResult } from '@odavl-studio/guardian-core';
import fs from 'node:fs';

describe('TrendAnalyzer', () => {
  const testDbPath = './test-trends.db';
  let analyzer: TrendAnalyzer;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    analyzer = new TrendAnalyzer(testDbPath);
  });

  afterEach(() => {
    analyzer.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  const createMockResult = (overrides?: Partial<TestResult>): TestResult => ({
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    score: 85,
    passed: 5,
    failed: 2,
    details: [
      {
        detector: 'performance',
        category: 'performance',
        title: 'LCP: 2.5s',
        severity: 'medium',
        message: 'Largest Contentful Paint is 2.5s',
        fix: 'Optimize images'
      },
      {
        detector: 'accessibility',
        category: 'accessibility',
        title: 'Missing alt text',
        severity: 'high',
        message: '3 images missing alt text',
        fix: 'Add alt attributes'
      }
    ],
    ...overrides
  });

  describe('processResult', () => {
    it('should create daily metrics entry', () => {
      const result = createMockResult();
      analyzer.processResult('test-1', result);

      const trend = analyzer.getTrend('test-1', 1);
      expect(trend).toHaveLength(1);
      expect(trend[0].score).toBe(85);
      expect(trend[0].issuesCount).toBe(2);
    });

    it('should aggregate multiple results for same day', () => {
      const result1 = createMockResult({ score: 80 });
      const result2 = createMockResult({ score: 90 });

      analyzer.processResult('test-1', result1);
      analyzer.processResult('test-1', result2);

      const trend = analyzer.getTrend('test-1', 1);
      expect(trend).toHaveLength(1);
      expect(trend[0].score).toBe(85); // Average of 80 and 90
    });

    it('should track issue frequency', () => {
      const result = createMockResult();
      analyzer.processResult('test-1', result);
      analyzer.processResult('test-1', result);

      const topIssues = analyzer.getTopIssues('test-1', 30, 10);
      expect(topIssues.length).toBeGreaterThan(0);
      expect(topIssues[0].count).toBeGreaterThan(0);
    });
  });

  describe('getTrend', () => {
    it('should return trend data ordered by date', () => {
      const result = createMockResult();
      analyzer.processResult('test-1', result);

      const trend = analyzer.getTrend('test-1', 30);
      expect(Array.isArray(trend)).toBe(true);
      
      if (trend.length > 1) {
        for (let i = 1; i < trend.length; i++) {
          expect(trend[i].timestamp.getTime()).toBeGreaterThanOrEqual(
            trend[i - 1].timestamp.getTime()
          );
        }
      }
    });

    it('should return empty array for non-existent test', () => {
      const trend = analyzer.getTrend('non-existent', 30);
      expect(trend).toEqual([]);
    });
  });

  describe('getTopIssues', () => {
    it('should return most frequent issues', () => {
      const result = createMockResult();
      
      // Process multiple times to create frequency data
      for (let i = 0; i < 5; i++) {
        analyzer.processResult('test-1', result);
      }

      const topIssues = analyzer.getTopIssues('test-1', 30, 5);
      expect(topIssues.length).toBeGreaterThan(0);
      expect(topIssues[0].count).toBeGreaterThan(0);
    });

    it('should limit results to specified count', () => {
      const result = createMockResult();
      analyzer.processResult('test-1', result);

      const topIssues = analyzer.getTopIssues('test-1', 30, 1);
      expect(topIssues.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getPerformanceTrend', () => {
    it('should calculate average performance metrics', () => {
      const result = createMockResult({
        details: [
          {
            detector: 'performance',
            category: 'performance',
            title: 'LCP: 2.5s',
            severity: 'medium',
            message: 'Test',
            fix: 'Fix'
          },
          {
            detector: 'performance',
            category: 'performance',
            title: 'FCP: 1.2s',
            severity: 'medium',
            message: 'Test',
            fix: 'Fix'
          }
        ]
      });

      analyzer.processResult('test-1', result);

      const perfTrend = analyzer.getPerformanceTrend('test-1', 30);
      expect(perfTrend).toHaveProperty('avgLCP');
      expect(perfTrend).toHaveProperty('avgFCP');
      expect(perfTrend).toHaveProperty('trend');
      expect(['improving', 'degrading', 'stable']).toContain(perfTrend.trend);
    });
  });

  describe('getSummary', () => {
    it('should provide summary statistics', () => {
      const result = createMockResult();
      analyzer.processResult('test-1', result);

      const summary = analyzer.getSummary('test-1', 30);
      expect(summary).toHaveProperty('totalExecutions');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('avgScore');
      expect(summary).toHaveProperty('avgDuration');
      expect(summary).toHaveProperty('totalIssues');
      expect(summary).toHaveProperty('trendDirection');
      expect(['up', 'down', 'stable']).toContain(summary.trendDirection);
    });

    it('should handle empty data gracefully', () => {
      const summary = analyzer.getSummary('non-existent', 30);
      expect(summary.totalExecutions).toBe(0);
      expect(summary.successRate).toBe(0);
      expect(summary.avgScore).toBe(0);
    });
  });

  describe('compare', () => {
    it('should compare two time periods', () => {
      const result = createMockResult();
      analyzer.processResult('test-1', result);

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const comparison = analyzer.compare(
        'test-1',
        { start: yesterday, end: yesterday },
        { start: now, end: now }
      );

      expect(comparison).toHaveProperty('period1');
      expect(comparison).toHaveProperty('period2');
      expect(comparison).toHaveProperty('change');
      expect(comparison.change).toHaveProperty('score');
      expect(comparison.change).toHaveProperty('duration');
      expect(comparison.change).toHaveProperty('issues');
    });
  });
});
