import Database from 'better-sqlite3';
import type { TestResult } from '@odavl-studio/guardian-core';

interface TrendDataPoint {
  timestamp: Date;
  score: number;
  duration: number;
  issuesCount: number;
}

interface IssueTrend {
  issueType: string;
  severity: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface PerformanceMetrics {
  avgLCP: number;
  avgFCP: number;
  avgCLS: number;
  avgTTFB: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export class TrendAnalyzer {
  private db: Database.Database;

  constructor(dbPath: string = './guardian-data.db') {
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables(): void {
    // Aggregated metrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        date TEXT NOT NULL,
        avg_score REAL,
        avg_duration REAL,
        total_executions INTEGER,
        successful_executions INTEGER,
        failed_executions INTEGER,
        total_issues INTEGER,
        critical_issues INTEGER,
        high_issues INTEGER,
        medium_issues INTEGER,
        low_issues INTEGER,
        avg_lcp REAL,
        avg_fcp REAL,
        avg_cls REAL,
        avg_ttfb REAL,
        UNIQUE(test_id, date)
      )
    `);

    // Issue frequency tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS issue_frequency (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        issue_title TEXT NOT NULL,
        severity TEXT NOT NULL,
        date TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        UNIQUE(test_id, issue_type, issue_title, date)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_metrics_daily_test_date 
      ON metrics_daily(test_id, date DESC)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_issue_frequency_test_date 
      ON issue_frequency(test_id, date DESC)
    `);
  }

  /**
   * Process a test result and update daily metrics
   */
  processResult(testId: string, result: TestResult): void {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Extract performance metrics
    const perfIssues = result.details.filter(d => d.category === 'performance');
    const lcpIssue = perfIssues.find(i => i.title.includes('LCP'));
    const fcpIssue = perfIssues.find(i => i.title.includes('FCP'));
    const clsIssue = perfIssues.find(i => i.title.includes('CLS'));
    const ttfbIssue = perfIssues.find(i => i.title.includes('TTFB'));

    // Count issues by severity
    const severityCounts = {
      critical: result.details.filter(d => d.severity === 'critical').length,
      high: result.details.filter(d => d.severity === 'high').length,
      medium: result.details.filter(d => d.severity === 'medium').length,
      low: result.details.filter(d => d.severity === 'low').length
    };

    // Upsert daily metrics
    const stmt = this.db.prepare(`
      INSERT INTO metrics_daily (
        test_id, date, avg_score, avg_duration, total_executions, 
        successful_executions, failed_executions, total_issues,
        critical_issues, high_issues, medium_issues, low_issues,
        avg_lcp, avg_fcp, avg_cls, avg_ttfb
      )
      VALUES (?, ?, ?, ?, 1, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(test_id, date) DO UPDATE SET
        avg_score = (avg_score * total_executions + ?) / (total_executions + 1),
        avg_duration = (avg_duration * total_executions + ?) / (total_executions + 1),
        total_executions = total_executions + 1,
        successful_executions = successful_executions + 1,
        total_issues = total_issues + ?,
        critical_issues = critical_issues + ?,
        high_issues = high_issues + ?,
        medium_issues = medium_issues + ?,
        low_issues = low_issues + ?,
        avg_lcp = CASE WHEN ? IS NOT NULL THEN (COALESCE(avg_lcp * total_executions, 0) + ?) / (total_executions + 1) ELSE avg_lcp END,
        avg_fcp = CASE WHEN ? IS NOT NULL THEN (COALESCE(avg_fcp * total_executions, 0) + ?) / (total_executions + 1) ELSE avg_fcp END,
        avg_cls = CASE WHEN ? IS NOT NULL THEN (COALESCE(avg_cls * total_executions, 0) + ?) / (total_executions + 1) ELSE avg_cls END,
        avg_ttfb = CASE WHEN ? IS NOT NULL THEN (COALESCE(avg_ttfb * total_executions, 0) + ?) / (total_executions + 1) ELSE avg_ttfb END
    `);

    const extractMetric = (issue: any) => {
      if (!issue) return null;
      const match = issue.title.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : null;
    };

    const lcp = extractMetric(lcpIssue);
    const fcp = extractMetric(fcpIssue);
    const cls = extractMetric(clsIssue);
    const ttfb = extractMetric(ttfbIssue);

    stmt.run(
      testId, date, result.summary.score, result.summary.duration,
      result.details.length,
      severityCounts.critical, severityCounts.high, severityCounts.medium, severityCounts.low,
      lcp, fcp, cls, ttfb,
      // UPDATE SET values
      result.summary.score, result.summary.duration,
      result.details.length,
      severityCounts.critical, severityCounts.high, severityCounts.medium, severityCounts.low,
      lcp, lcp,
      fcp, fcp,
      cls, cls,
      ttfb, ttfb
    );

    // Track issue frequency
    for (const detail of result.details) {
      const issueStmt = this.db.prepare(`
        INSERT INTO issue_frequency (test_id, issue_type, issue_title, severity, date, count)
        VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(test_id, issue_type, issue_title, date) DO UPDATE SET
          count = count + 1
      `);

      issueStmt.run(
        testId,
        detail.category,
        detail.title,
        detail.severity,
        date
      );
    }
  }

  /**
   * Get trend data for a test over time period
   */
  getTrend(testId: string, days: number = 30): TrendDataPoint[] {
    const stmt = this.db.prepare(`
      SELECT 
        date as timestamp,
        avg_score as score,
        avg_duration as duration,
        total_issues as issuesCount
      FROM metrics_daily
      WHERE test_id = ? AND date >= date('now', '-${days} days')
      ORDER BY date ASC
    `);

    const rows = stmt.all(testId) as any[];
    return rows.map(row => ({
      timestamp: new Date(row.timestamp),
      score: row.score,
      duration: row.duration,
      issuesCount: row.issuesCount
    }));
  }

  /**
   * Get most frequent issues over time period
   */
  getTopIssues(testId: string, days: number = 30, limit: number = 10): IssueTrend[] {
    const stmt = this.db.prepare(`
      SELECT 
        issue_type as issueType,
        issue_title as issueTitle,
        severity,
        SUM(count) as totalCount,
        MIN(date) as firstSeen,
        MAX(date) as lastSeen
      FROM issue_frequency
      WHERE test_id = ? AND date >= date('now', '-${days} days')
      GROUP BY issue_type, issue_title, severity
      ORDER BY totalCount DESC
      LIMIT ?
    `);

    const rows = stmt.all(testId, limit) as any[];
    
    return rows.map(row => {
      // Calculate trend by comparing first half vs second half
      const midDate = new Date();
      midDate.setDate(midDate.getDate() - days / 2);
      
      const trendStmt = this.db.prepare(`
        SELECT 
          CASE 
            WHEN date < ? THEN 'first'
            ELSE 'second'
          END as period,
          SUM(count) as count
        FROM issue_frequency
        WHERE test_id = ? 
          AND issue_type = ? 
          AND issue_title = ?
          AND date >= date('now', '-${days} days')
        GROUP BY period
      `);

      const trendData = trendStmt.all(
        midDate.toISOString().split('T')[0],
        testId,
        row.issueType,
        row.issueTitle
      ) as any[];

      const first = trendData.find(d => d.period === 'first')?.count || 0;
      const second = trendData.find(d => d.period === 'second')?.count || 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (second > first * 1.2) trend = 'increasing';
      else if (second < first * 0.8) trend = 'decreasing';
      else trend = 'stable';

      return {
        issueType: row.issueType,
        severity: row.severity,
        count: row.totalCount,
        firstSeen: new Date(row.firstSeen),
        lastSeen: new Date(row.lastSeen),
        trend
      };
    });
  }

  /**
   * Get performance metrics trend
   */
  getPerformanceTrend(testId: string, days: number = 30): PerformanceMetrics {
    const stmt = this.db.prepare(`
      SELECT 
        AVG(avg_lcp) as avgLCP,
        AVG(avg_fcp) as avgFCP,
        AVG(avg_cls) as avgCLS,
        AVG(avg_ttfb) as avgTTFB
      FROM metrics_daily
      WHERE test_id = ? AND date >= date('now', '-${days} days')
    `);

    const row = stmt.get(testId) as any;

    // Compare first half vs second half to determine trend
    const midDate = new Date();
    midDate.setDate(midDate.getDate() - days / 2);

    const trendStmt = this.db.prepare(`
      SELECT 
        CASE 
          WHEN date < ? THEN 'first'
          ELSE 'second'
        END as period,
        AVG(avg_lcp) as avgLCP,
        AVG(avg_fcp) as avgFCP,
        AVG(avg_cls) as avgCLS
      FROM metrics_daily
      WHERE test_id = ? AND date >= date('now', '-${days} days')
      GROUP BY period
    `);

    const trendData = trendStmt.all(
      midDate.toISOString().split('T')[0],
      testId
    ) as any[];

    const first = trendData.find(d => d.period === 'first');
    const second = trendData.find(d => d.period === 'second');

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (first && second) {
      const avgFirst = (first.avgLCP + first.avgFCP + first.avgCLS) / 3;
      const avgSecond = (second.avgLCP + second.avgFCP + second.avgCLS) / 3;
      
      if (avgSecond < avgFirst * 0.9) trend = 'improving';
      else if (avgSecond > avgFirst * 1.1) trend = 'degrading';
    }

    return {
      avgLCP: row.avgLCP || 0,
      avgFCP: row.avgFCP || 0,
      avgCLS: row.avgCLS || 0,
      avgTTFB: row.avgTTFB || 0,
      trend
    };
  }

  /**
   * Compare two time periods
   */
  compare(
    testId: string,
    period1: { start: Date; end: Date },
    period2: { start: Date; end: Date }
  ): {
    period1: any;
    period2: any;
    change: {
      score: number;
      duration: number;
      issues: number;
    };
  } {
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const getStats = (start: Date, end: Date) => {
      const stmt = this.db.prepare(`
        SELECT 
          AVG(avg_score) as avgScore,
          AVG(avg_duration) as avgDuration,
          SUM(total_issues) as totalIssues,
          SUM(total_executions) as totalExecutions
        FROM metrics_daily
        WHERE test_id = ? 
          AND date >= ? 
          AND date <= ?
      `);

      return stmt.get(testId, formatDate(start), formatDate(end));
    };

    const stats1 = getStats(period1.start, period1.end) as any;
    const stats2 = getStats(period2.start, period2.end) as any;

    return {
      period1: stats1,
      period2: stats2,
      change: {
        score: stats2.avgScore - stats1.avgScore,
        duration: stats2.avgDuration - stats1.avgDuration,
        issues: stats2.totalIssues - stats1.totalIssues
      }
    };
  }

  /**
   * Get summary statistics
   */
  getSummary(testId: string, days: number = 30): {
    totalExecutions: number;
    successRate: number;
    avgScore: number;
    avgDuration: number;
    totalIssues: number;
    trendDirection: 'up' | 'down' | 'stable';
  } {
    const stmt = this.db.prepare(`
      SELECT 
        SUM(total_executions) as totalExecutions,
        SUM(successful_executions) as successfulExecutions,
        AVG(avg_score) as avgScore,
        AVG(avg_duration) as avgDuration,
        SUM(total_issues) as totalIssues
      FROM metrics_daily
      WHERE test_id = ? AND date >= date('now', '-${days} days')
    `);

    const row = stmt.get(testId) as any;

    // Determine trend
    const trendData = this.getTrend(testId, days);
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    
    if (trendData.length > 1) {
      const firstScore = trendData[0].score;
      const lastScore = trendData[trendData.length - 1].score;
      
      if (lastScore > firstScore * 1.1) trendDirection = 'up';
      else if (lastScore < firstScore * 0.9) trendDirection = 'down';
    }

    return {
      totalExecutions: row.totalExecutions || 0,
      successRate: row.totalExecutions > 0 
        ? (row.successfulExecutions / row.totalExecutions) * 100 
        : 0,
      avgScore: row.avgScore || 0,
      avgDuration: row.avgDuration || 0,
      totalIssues: row.totalIssues || 0,
      trendDirection
    };
  }

  close(): void {
    this.db.close();
  }
}
