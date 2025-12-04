/**
 * Metric Types for Analytics Dashboard
 * Created: 2025-01-12
 * Week 10 Day 1: Analytics Dashboard
 */

/**
 * Time range for metrics
 */
export type TimeRange = '7d' | '30d' | '90d' | 'all';

/**
 * Severity levels for issues
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Project health score (0-100)
 */
export interface HealthScore {
  score: number; // 0-100
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

/**
 * Issue statistics by severity
 */
export interface IssueStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  unresolved: number;
}

/**
 * Analysis performance metrics
 */
export interface AnalysisMetrics {
  totalAnalyses: number;
  successRate: number; // 0-100
  averageDuration: number; // milliseconds
  lastAnalysis: string | null;
}

/**
 * Team activity metrics
 */
export interface TeamMetrics {
  activeUsers: number;
  totalComments: number;
  unresolvedComments: number;
  recentActivities: number;
}

/**
 * Code quality trend data point
 */
export interface TrendDataPoint {
  date: string; // ISO date
  value: number;
  label?: string;
}

/**
 * Issue trend over time
 */
export interface IssueTrend {
  period: TimeRange;
  dataPoints: TrendDataPoint[];
  totalIssues: number;
  change: number; // percentage change
}

/**
 * Top issues summary
 */
export interface TopIssue {
  id: string;
  title: string;
  severity: IssueSeverity;
  occurrences: number;
  files: number;
  firstSeen: string;
  lastSeen: string;
}

/**
 * Dashboard summary (all metrics)
 */
export interface DashboardSummary {
  projectId: string;
  timeRange: TimeRange;
  healthScore: HealthScore;
  issues: IssueStats;
  analysis: AnalysisMetrics;
  team: TeamMetrics;
  issueTrend: IssueTrend;
  topIssues: TopIssue[];
  generatedAt: string;
}

/**
 * Detector performance
 */
export interface DetectorPerformance {
  name: string;
  executions: number;
  averageDuration: number;
  issuesFound: number;
  successRate: number;
}

/**
 * User contribution stats
 */
export interface UserContribution {
  userId: string;
  userName: string;
  analyses: number;
  comments: number;
  issuesResolved: number;
  lastActive: string;
}
