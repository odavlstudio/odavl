/**
 * Metrics Service - Analytics Dashboard Data Provider
 * Created: 2025-01-12
 * Week 10 Day 1: Analytics Dashboard
 * 
 * Aggregates metrics from analysis results, comments, activities, and presence.
 */

import type {
  TimeRange,
  DashboardSummary,
  HealthScore,
  IssueStats,
  AnalysisMetrics,
  TeamMetrics,
  IssueTrend,
  TopIssue,
  DetectorPerformance,
  UserContribution,
  TrendDataPoint,
  IssueSeverity
} from './types';

/**
 * Mock data for demonstration - replace with real database queries
 */
export class MetricsService {
  /**
   * Calculate project health score (0-100)
   * Based on: issue resolution rate, code quality, team activity
   */
  calculateHealthScore(projectId: string): HealthScore {
    // Mock calculation - replace with real logic
    const issueResolutionRate = 0.75; // 75% resolved
    const codeQualityScore = 0.85; // 85 quality score
    const teamActivityScore = 0.90; // 90% team engagement
    
    const score = Math.round(
      (issueResolutionRate * 0.4 + codeQualityScore * 0.4 + teamActivityScore * 0.2) * 100
    );

    // Determine trend (mock - compare with previous period)
    const previousScore = 80;
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (score > previousScore + 2) trend = 'improving';
    if (score < previousScore - 2) trend = 'declining';

    return {
      score,
      trend,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get issue statistics by severity
   */
  getIssueStats(projectId: string, timeRange: TimeRange = '7d'): IssueStats {
    // Mock data - replace with database aggregation
    const stats: IssueStats = {
      total: 127,
      critical: 8,
      high: 23,
      medium: 56,
      low: 40,
      resolved: 95,
      unresolved: 32
    };

    return stats;
  }

  /**
   * Get analysis performance metrics
   */
  getAnalysisMetrics(projectId: string, timeRange: TimeRange = '7d'): AnalysisMetrics {
    // Mock data - replace with database queries
    const metrics: AnalysisMetrics = {
      totalAnalyses: 45,
      successRate: 97.8,
      averageDuration: 12500, // 12.5 seconds
      lastAnalysis: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 min ago
    };

    return metrics;
  }

  /**
   * Get team activity metrics
   */
  getTeamMetrics(projectId: string): TeamMetrics {
    // Mock data - replace with real service calls
    const metrics: TeamMetrics = {
      activeUsers: 8,
      totalComments: 156,
      unresolvedComments: 12,
      recentActivities: 34
    };

    return metrics;
  }

  /**
   * Get issue trend over time
   */
  getIssueTrend(projectId: string, timeRange: TimeRange = '7d'): IssueTrend {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dataPoints: TrendDataPoint[] = [];

    // Generate mock trend data
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate decreasing trend (improving code quality)
      const baseValue = 150;
      const trend = -2; // issues decreasing by 2 per day
      const noise = Math.random() * 10 - 5; // random variance
      const value = Math.max(0, Math.round(baseValue + trend * (days - i) + noise));

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    const totalIssues = dataPoints.reduce((sum, dp) => sum + dp.value, 0);
    const firstValue = dataPoints[0]?.value || 0;
    const lastValue = dataPoints[dataPoints.length - 1]?.value || 0;
    const change = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      period: timeRange,
      dataPoints,
      totalIssues,
      change
    };
  }

  /**
   * Get top issues by occurrences
   */
  getTopIssues(projectId: string, limit = 10): TopIssue[] {
    // Mock data - replace with database queries
    const topIssues: TopIssue[] = [
      {
        id: '1',
        title: 'Unused import detected',
        severity: 'medium',
        occurrences: 45,
        files: 18,
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '2',
        title: 'Missing error handling',
        severity: 'high',
        occurrences: 23,
        files: 12,
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: '3',
        title: 'Security: Hardcoded API key',
        severity: 'critical',
        occurrences: 8,
        files: 3,
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: '4',
        title: 'Circular dependency detected',
        severity: 'high',
        occurrences: 15,
        files: 8,
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: '5',
        title: 'Performance: Large bundle size',
        severity: 'medium',
        occurrences: 12,
        files: 6,
        firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      }
    ];

    return topIssues.slice(0, limit);
  }

  /**
   * Get detector performance statistics
   */
  getDetectorPerformance(projectId: string): DetectorPerformance[] {
    // Mock data - replace with real metrics
    const detectors: DetectorPerformance[] = [
      {
        name: 'TypeScript',
        executions: 45,
        averageDuration: 2300,
        issuesFound: 67,
        successRate: 100
      },
      {
        name: 'ESLint',
        executions: 45,
        averageDuration: 3200,
        issuesFound: 89,
        successRate: 100
      },
      {
        name: 'Security',
        executions: 45,
        averageDuration: 1800,
        issuesFound: 12,
        successRate: 100
      },
      {
        name: 'Import',
        executions: 45,
        averageDuration: 1500,
        issuesFound: 34,
        successRate: 97.8
      },
      {
        name: 'Circular',
        executions: 45,
        averageDuration: 2800,
        issuesFound: 15,
        successRate: 95.6
      }
    ];

    return detectors;
  }

  /**
   * Get user contribution statistics
   */
  getUserContributions(projectId: string, limit = 10): UserContribution[] {
    // Mock data - replace with database queries
    const users: UserContribution[] = [
      {
        userId: '1',
        userName: 'Alice Johnson',
        analyses: 18,
        comments: 45,
        issuesResolved: 23,
        lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        userId: '2',
        userName: 'Bob Smith',
        analyses: 12,
        comments: 32,
        issuesResolved: 18,
        lastActive: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        userId: '3',
        userName: 'Carol Lee',
        analyses: 9,
        comments: 28,
        issuesResolved: 15,
        lastActive: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ];

    return users.slice(0, limit);
  }

  /**
   * Get complete dashboard summary
   */
  async getDashboardSummary(projectId: string, timeRange: TimeRange = '7d'): Promise<DashboardSummary> {
    // Aggregate all metrics
    const summary: DashboardSummary = {
      projectId,
      timeRange,
      healthScore: this.calculateHealthScore(projectId),
      issues: this.getIssueStats(projectId, timeRange),
      analysis: this.getAnalysisMetrics(projectId, timeRange),
      team: this.getTeamMetrics(projectId),
      issueTrend: this.getIssueTrend(projectId, timeRange),
      topIssues: this.getTopIssues(projectId, 10),
      generatedAt: new Date().toISOString()
    };

    return summary;
  }

  /**
   * Get severity color for charts
   */
  static getSeverityColor(severity: IssueSeverity): string {
    const colors: Record<IssueSeverity, string> = {
      critical: '#ef4444', // red-500
      high: '#f97316',     // orange-500
      medium: '#f59e0b',   // amber-500
      low: '#84cc16'       // lime-500
    };
    return colors[severity];
  }

  /**
   * Format duration in human-readable format
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format large numbers with K/M suffixes
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  /**
   * Get analysis performance data over time
   */
  getAnalysisPerformanceData(projectId: string, timeRange: TimeRange = '7d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Mock data - replace with real queries
      const baseDuration = 12000; // 12 seconds
      const variance = Math.random() * 3000 - 1500;
      const duration = Math.max(5000, baseDuration + variance);
      
      const totalAnalyses = Math.floor(Math.random() * 10) + 5;
      const success = Math.floor(totalAnalyses * (0.95 + Math.random() * 0.05));
      const failed = totalAnalyses - success;

      data.push({
        date: date.toISOString().split('T')[0],
        duration,
        success,
        failed,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    return data;
  }

  /**
   * Get team activity data over time
   */
  getTeamActivityData(projectId: string, timeRange: TimeRange = '7d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Mock data - replace with real queries
      const analyses = Math.floor(Math.random() * 8) + 2;
      const comments = Math.floor(Math.random() * 15) + 5;
      const issuesResolved = Math.floor(Math.random() * 10) + 3;

      data.push({
        date: date.toISOString().split('T')[0],
        analyses,
        comments,
        issuesResolved,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    return data;
  }

  /**
   * Get code quality trend data
   */
  getCodeQualityTrendData(projectId: string, timeRange: TimeRange = '7d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Mock improving trend
      const baseQuality = 65;
      const improvement = (days - i) * 0.3;
      const qualityScore = Math.min(95, baseQuality + improvement + Math.random() * 5);
      
      const baseIssueDensity = 8;
      const reduction = (days - i) * 0.05;
      const issueDensity = Math.max(2, baseIssueDensity - reduction + Math.random() * 0.5);

      data.push({
        date: date.toISOString().split('T')[0],
        qualityScore,
        issueDensity,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    return data;
  }

  /**
   * Get issue resolution rate data
   */
  getIssueResolutionData(projectId: string, timeRange: TimeRange = '7d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Mock data with improving resolution rate
      const opened = Math.floor(Math.random() * 12) + 5;
      const resolutionRate = 0.7 + (days - i) / days * 0.2; // Improving over time
      const resolved = Math.floor(opened * resolutionRate);

      data.push({
        date: date.toISOString().split('T')[0],
        opened,
        resolved,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    return data;
  }
}

/**
 * Singleton instance
 */
export const metricsService = new MetricsService();
