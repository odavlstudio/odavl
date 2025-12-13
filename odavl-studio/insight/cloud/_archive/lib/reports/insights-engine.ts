/**
 * Insights Engine Service
 * Week 10 Day 3: Reports & Insights
 * 
 * Analyzes trends, detects anomalies, and generates recommendations.
 */

import type { Insight, Anomaly, Recommendation } from './types';
import type { DashboardSummary, TrendDataPoint } from '../metrics/types';

export class InsightsEngine {
  /**
   * Generate insights from dashboard summary
   */
  generateInsights(summary: DashboardSummary): Insight[] {
    const insights: Insight[] = [];

    // Health Score Insights
    if (summary.healthScore.score >= 85) {
      insights.push({
        id: `insight-health-${Date.now()}`,
        type: 'positive',
        category: 'quality',
        title: 'Excellent Code Health',
        description: `Your project maintains an excellent health score of ${summary.healthScore.score}/100, indicating high code quality and low technical debt.`,
        impact: 'high',
        metrics: { healthScore: summary.healthScore.score },
        timestamp: new Date().toISOString()
      });
    } else if (summary.healthScore.score < 60) {
      insights.push({
        id: `insight-health-${Date.now()}`,
        type: 'warning',
        category: 'quality',
        title: 'Code Health Needs Attention',
        description: `Your project's health score is ${summary.healthScore.score}/100, which is below the recommended threshold. Immediate action is needed.`,
        impact: 'high',
        recommendation: 'Focus on resolving critical and high-severity issues first.',
        metrics: { healthScore: summary.healthScore.score },
        timestamp: new Date().toISOString()
      });
    }

    // Issue Trend Insights
    if (summary.issueTrend.change < -10) {
      insights.push({
        id: `insight-issues-${Date.now()}`,
        type: 'positive',
        category: 'trend',
        title: 'Issues Declining',
        description: `Issue count has decreased by ${Math.abs(summary.issueTrend.change).toFixed(1)}% in the selected period. Great progress!`,
        impact: 'medium',
        metrics: { change: summary.issueTrend.change },
        timestamp: new Date().toISOString()
      });
    } else if (summary.issueTrend.change > 20) {
      insights.push({
        id: `insight-issues-${Date.now()}`,
        type: 'negative',
        category: 'trend',
        title: 'Rising Issue Count',
        description: `Issues have increased by ${summary.issueTrend.change.toFixed(1)}% recently. Consider increasing code review rigor.`,
        impact: 'high',
        recommendation: 'Schedule a team review to identify root causes and implement preventive measures.',
        metrics: { change: summary.issueTrend.change },
        timestamp: new Date().toISOString()
      });
    }

    // Analysis Performance Insights
    if (summary.analysis.successRate < 95) {
      insights.push({
        id: `insight-analysis-${Date.now()}`,
        type: 'warning',
        category: 'performance',
        title: 'Analysis Success Rate Below Target',
        description: `Current success rate is ${summary.analysis.successRate.toFixed(1)}%, below the 95% target. Some analyses may be failing.`,
        impact: 'medium',
        recommendation: 'Review failed analysis logs to identify and fix common issues.',
        metrics: { successRate: summary.analysis.successRate },
        timestamp: new Date().toISOString()
      });
    }

    // Team Activity Insights
    if (summary.team.unresolvedComments > summary.team.totalComments * 0.3) {
      insights.push({
        id: `insight-comments-${Date.now()}`,
        type: 'neutral',
        category: 'team',
        title: 'High Unresolved Comment Ratio',
        description: `${summary.team.unresolvedComments} out of ${summary.team.totalComments} comments remain unresolved (${((summary.team.unresolvedComments / summary.team.totalComments) * 100).toFixed(0)}%).`,
        impact: 'medium',
        recommendation: 'Dedicate time in your next sprint to address pending discussions.',
        metrics: {
          unresolved: summary.team.unresolvedComments,
          total: summary.team.totalComments
        },
        timestamp: new Date().toISOString()
      });
    }

    // Security Insights
    if (summary.issues.critical > 0) {
      insights.push({
        id: `insight-security-${Date.now()}`,
        type: 'negative',
        category: 'security',
        title: 'Critical Security Issues Detected',
        description: `${summary.issues.critical} critical security issues require immediate attention. These could pose serious risks.`,
        impact: 'high',
        recommendation: 'Address all critical security issues within 24 hours.',
        metrics: { critical: summary.issues.critical },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * Detect anomalies in trend data
   */
  detectAnomalies(trendData: TrendDataPoint[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (trendData.length < 3) return anomalies;

    // Calculate mean and standard deviation
    const values = trendData.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomalies (values > 2 standard deviations from mean)
    trendData.forEach((point, index) => {
      const deviation = Math.abs(point.value - mean);
      const deviationPercent = (deviation / mean) * 100;

      if (deviation > 2 * stdDev) {
        const type = point.value > mean ? 'spike' : 'drop';
        const severity = deviationPercent > 50 ? 'critical' : deviationPercent > 30 ? 'high' : 'medium';

        anomalies.push({
          id: `anomaly-${index}-${Date.now()}`,
          type,
          metric: 'Issue Count',
          detectedAt: point.date,
          severity,
          description: `Unusual ${type} detected: ${point.value} issues (expected ~${mean.toFixed(0)})`,
          expectedValue: Math.round(mean),
          actualValue: point.value,
          deviation: deviationPercent
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate recommendations based on insights
   */
  generateRecommendations(summary: DashboardSummary, insights: Insight[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Critical issues recommendation
    if (summary.issues.critical > 0) {
      recommendations.push({
        id: `rec-critical-${Date.now()}`,
        priority: 'high',
        category: 'security',
        title: 'Address Critical Security Issues',
        description: `${summary.issues.critical} critical security vulnerabilities need immediate attention. These represent significant risks to your application.`,
        impact: 'Reduces security risk and protects sensitive data',
        effort: 'medium',
        status: 'open'
      });
    }

    // Code quality recommendation
    if (summary.healthScore.score < 70) {
      recommendations.push({
        id: `rec-quality-${Date.now()}`,
        priority: 'high',
        category: 'code-quality',
        title: 'Improve Code Quality Score',
        description: 'Current health score is below acceptable levels. Focus on reducing technical debt through systematic refactoring.',
        impact: 'Improves maintainability and reduces future bugs',
        effort: 'high',
        status: 'open'
      });
    }

    // Performance recommendation
    if (summary.analysis.averageDuration > 20000) {
      recommendations.push({
        id: `rec-performance-${Date.now()}`,
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Analysis Performance',
        description: `Average analysis time is ${(summary.analysis.averageDuration / 1000).toFixed(1)}s. Consider optimizing detector configurations or excluding unnecessary paths.`,
        impact: 'Faster feedback loops for developers',
        effort: 'low',
        status: 'open'
      });
    }

    // Team collaboration recommendation
    if (summary.team.activeUsers < 3) {
      recommendations.push({
        id: `rec-team-${Date.now()}`,
        priority: 'low',
        category: 'team-process',
        title: 'Increase Team Engagement',
        description: 'Only a few team members are actively using the platform. Organize a training session to encourage adoption.',
        impact: 'Better team collaboration and knowledge sharing',
        effort: 'low',
        status: 'open'
      });
    }

    // Unresolved issues recommendation
    const resolutionRate = summary.issues.resolved / summary.issues.total;
    if (resolutionRate < 0.7) {
      recommendations.push({
        id: `rec-resolution-${Date.now()}`,
        priority: 'medium',
        category: 'code-quality',
        title: 'Improve Issue Resolution Rate',
        description: `Only ${(resolutionRate * 100).toFixed(0)}% of issues are resolved. Allocate dedicated time for issue cleanup in upcoming sprints.`,
        impact: 'Reduces technical debt accumulation',
        effort: 'medium',
        status: 'open'
      });
    }

    return recommendations;
  }

  /**
   * Calculate project metrics summary for report
   */
  calculateProjectMetrics(summary: DashboardSummary) {
    const issueResolutionRate = (summary.issues.resolved / summary.issues.total) * 100;
    const criticalIssueRatio = (summary.issues.critical / summary.issues.total) * 100;
    const teamProductivity = summary.analysis.totalAnalyses / Math.max(summary.team.activeUsers, 1);

    return {
      healthScore: summary.healthScore.score,
      issueResolutionRate: issueResolutionRate.toFixed(1),
      criticalIssueRatio: criticalIssueRatio.toFixed(1),
      teamProductivity: teamProductivity.toFixed(1),
      analysisSuccessRate: summary.analysis.successRate.toFixed(1),
      activeUserRatio: ((summary.team.activeUsers / 10) * 100).toFixed(0) // Assuming 10 total users
    };
  }
}

export const insightsEngine = new InsightsEngine();
