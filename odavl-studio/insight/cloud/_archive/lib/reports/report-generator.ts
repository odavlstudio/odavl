/**
 * Report Generator Service
 * Week 10 Day 3: Reports & Insights
 * 
 * Generates various types of reports (summary, detailed, team, security).
 */

import type { Report, ReportSection, ReportType, ReportFormat } from './types';
import type { DashboardSummary } from '../metrics/types';
import { insightsEngine } from './insights-engine';

export class ReportGenerator {
  /**
   * Generate a project summary report
   */
  generateSummaryReport(
    projectId: string,
    summary: DashboardSummary,
    userId: string
  ): Report {
    const insights = insightsEngine.generateInsights(summary);
    const recommendations = insightsEngine.generateRecommendations(summary, insights);
    const metrics = insightsEngine.calculateProjectMetrics(summary);

    const sections: ReportSection[] = [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        content: this.generateExecutiveSummary(summary, metrics)
      },
      {
        id: 'health-overview',
        title: 'Project Health Overview',
        content: this.generateHealthOverview(summary, metrics),
        data: {
          healthScore: summary.healthScore.score,
          trend: summary.healthScore.trend
        },
        chartType: 'line'
      },
      {
        id: 'issue-breakdown',
        title: 'Issue Breakdown by Severity',
        content: this.generateIssueBreakdown(summary),
        data: {
          critical: summary.issues.critical,
          high: summary.issues.high,
          medium: summary.issues.medium,
          low: summary.issues.low
        },
        chartType: 'pie'
      },
      {
        id: 'key-insights',
        title: 'Key Insights',
        content: this.generateInsightsSection(insights)
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        content: this.generateRecommendationsSection(recommendations)
      }
    ];

    return {
      id: `report-${Date.now()}`,
      projectId,
      type: 'summary',
      title: 'Project Summary Report',
      description: `Comprehensive overview of project health and metrics as of ${new Date().toLocaleDateString()}`,
      format: 'html',
      status: 'completed',
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      sections
    };
  }

  /**
   * Generate a detailed analysis report
   */
  generateDetailedReport(
    projectId: string,
    summary: DashboardSummary,
    userId: string
  ): Report {
    const sections: ReportSection[] = [
      {
        id: 'detailed-metrics',
        title: 'Detailed Metrics',
        content: this.generateDetailedMetrics(summary)
      },
      {
        id: 'analysis-performance',
        title: 'Analysis Performance',
        content: this.generateAnalysisPerformance(summary)
      },
      {
        id: 'top-issues',
        title: 'Top 10 Issues',
        content: this.generateTopIssuesSection(summary)
      },
      {
        id: 'team-activity',
        title: 'Team Activity',
        content: this.generateTeamActivity(summary)
      }
    ];

    return {
      id: `report-${Date.now()}`,
      projectId,
      type: 'detailed',
      title: 'Detailed Analysis Report',
      description: 'In-depth analysis of all project metrics and issues',
      format: 'html',
      status: 'completed',
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      sections
    };
  }

  /**
   * Generate a team performance report
   */
  generateTeamReport(
    projectId: string,
    summary: DashboardSummary,
    userId: string
  ): Report {
    const sections: ReportSection[] = [
      {
        id: 'team-overview',
        title: 'Team Overview',
        content: this.generateTeamOverview(summary)
      },
      {
        id: 'collaboration-metrics',
        title: 'Collaboration Metrics',
        content: this.generateCollaborationMetrics(summary)
      },
      {
        id: 'productivity-analysis',
        title: 'Productivity Analysis',
        content: this.generateProductivityAnalysis(summary)
      }
    ];

    return {
      id: `report-${Date.now()}`,
      projectId,
      type: 'team',
      title: 'Team Performance Report',
      description: 'Analysis of team collaboration and productivity',
      format: 'html',
      status: 'completed',
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      sections
    };
  }

  // Private helper methods

  private generateExecutiveSummary(summary: DashboardSummary, metrics: any): string {
    return `
This report provides a comprehensive overview of the project's code quality and team performance.

**Key Highlights:**
- Health Score: ${summary.healthScore.score}/100 (${summary.healthScore.trend})
- Total Issues: ${summary.issues.total} (${summary.issues.resolved} resolved)
- Analysis Success Rate: ${metrics.analysisSuccessRate}%
- Active Team Members: ${summary.team.activeUsers}

The project is currently ${summary.healthScore.trend === 'improving' ? 'showing positive trends' : summary.healthScore.trend === 'declining' ? 'requiring attention' : 'maintaining stability'}.
    `.trim();
  }

  private generateHealthOverview(summary: DashboardSummary, metrics: any): string {
    return `
The project health score is **${summary.healthScore.score}/100**, indicating ${
      summary.healthScore.score >= 85 ? 'excellent' :
      summary.healthScore.score >= 70 ? 'good' :
      summary.healthScore.score >= 60 ? 'fair' : 'poor'
    } code quality.

**Health Metrics:**
- Issue Resolution Rate: ${metrics.issueResolutionRate}%
- Critical Issue Ratio: ${metrics.criticalIssueRatio}%
- Team Productivity: ${metrics.teamProductivity} analyses per member

**Trend:** ${summary.healthScore.trend.charAt(0).toUpperCase() + summary.healthScore.trend.slice(1)}
    `.trim();
  }

  private generateIssueBreakdown(summary: DashboardSummary): string {
    const total = summary.issues.total;
    return `
**Total Issues:** ${total}

**By Severity:**
- Critical: ${summary.issues.critical} (${((summary.issues.critical / total) * 100).toFixed(1)}%)
- High: ${summary.issues.high} (${((summary.issues.high / total) * 100).toFixed(1)}%)
- Medium: ${summary.issues.medium} (${((summary.issues.medium / total) * 100).toFixed(1)}%)
- Low: ${summary.issues.low} (${((summary.issues.low / total) * 100).toFixed(1)}%)

**Resolution Status:**
- Resolved: ${summary.issues.resolved} (${((summary.issues.resolved / total) * 100).toFixed(1)}%)
- Unresolved: ${summary.issues.unresolved} (${((summary.issues.unresolved / total) * 100).toFixed(1)}%)
    `.trim();
  }

  private generateInsightsSection(insights: any[]): string {
    if (insights.length === 0) {
      return 'No significant insights detected at this time.';
    }

    return insights.map((insight, index) => `
**${index + 1}. ${insight.title}** (${insight.category} - ${insight.impact} impact)
${insight.description}
${insight.recommendation ? `\n*Recommendation:* ${insight.recommendation}` : ''}
    `.trim()).join('\n\n');
  }

  private generateRecommendationsSection(recommendations: any[]): string {
    if (recommendations.length === 0) {
      return 'No recommendations at this time. Keep up the good work!';
    }

    return recommendations.map((rec, index) => `
**${index + 1}. ${rec.title}** (Priority: ${rec.priority})
${rec.description}

*Impact:* ${rec.impact}
*Effort:* ${rec.effort}
*Category:* ${rec.category}
    `.trim()).join('\n\n');
  }

  private generateDetailedMetrics(summary: DashboardSummary): string {
    return `
**Analysis Metrics:**
- Total Analyses: ${summary.analysis.totalAnalyses}
- Success Rate: ${summary.analysis.successRate.toFixed(1)}%
- Average Duration: ${(summary.analysis.averageDuration / 1000).toFixed(2)}s
- Last Analysis: ${summary.analysis.lastAnalysis ? new Date(summary.analysis.lastAnalysis).toLocaleString() : 'Never'}

**Issue Metrics:**
- Total: ${summary.issues.total}
- Critical: ${summary.issues.critical}
- High: ${summary.issues.high}
- Medium: ${summary.issues.medium}
- Low: ${summary.issues.low}
- Resolved: ${summary.issues.resolved}
- Unresolved: ${summary.issues.unresolved}

**Team Metrics:**
- Active Users: ${summary.team.activeUsers}
- Total Comments: ${summary.team.totalComments}
- Unresolved Comments: ${summary.team.unresolvedComments}
- Recent Activities: ${summary.team.recentActivities}
    `.trim();
  }

  private generateAnalysisPerformance(summary: DashboardSummary): string {
    return `
**Performance Overview:**
- Average analysis time: ${(summary.analysis.averageDuration / 1000).toFixed(2)} seconds
- Success rate: ${summary.analysis.successRate.toFixed(1)}%
- Total analyses completed: ${summary.analysis.totalAnalyses}

${summary.analysis.successRate < 95 ? '⚠️ *Note:* Success rate is below the recommended 95% threshold.' : '✅ Success rate meets expectations.'}
    `.trim();
  }

  private generateTopIssuesSection(summary: DashboardSummary): string {
    return summary.topIssues.map((issue, index) => `
**${index + 1}. ${issue.title}**
- Severity: ${issue.severity}
- Occurrences: ${issue.occurrences}
- Affected Files: ${issue.files}
- First Seen: ${new Date(issue.firstSeen).toLocaleDateString()}
- Last Seen: ${new Date(issue.lastSeen).toLocaleDateString()}
    `.trim()).join('\n\n');
  }

  private generateTeamActivity(summary: DashboardSummary): string {
    return `
**Team Engagement:**
- Active Members: ${summary.team.activeUsers}
- Comments Posted: ${summary.team.totalComments}
- Pending Discussions: ${summary.team.unresolvedComments}
- Recent Activities: ${summary.team.recentActivities}

**Engagement Rate:** ${((summary.team.activeUsers / 10) * 100).toFixed(0)}% (assuming 10 team members)
    `.trim();
  }

  private generateTeamOverview(summary: DashboardSummary): string {
    return `
The team currently has **${summary.team.activeUsers} active members** contributing to the project.

**Activity Summary:**
- Total Comments: ${summary.team.totalComments}
- Unresolved Discussions: ${summary.team.unresolvedComments}
- Recent Activities: ${summary.team.recentActivities}

The team is ${summary.team.activeUsers >= 5 ? 'highly engaged' : 'moderately engaged'} with the code quality process.
    `.trim();
  }

  private generateCollaborationMetrics(summary: DashboardSummary): string {
    const commentResolutionRate = ((summary.team.totalComments - summary.team.unresolvedComments) / summary.team.totalComments) * 100;
    
    return `
**Collaboration Health:**
- Comment Resolution Rate: ${commentResolutionRate.toFixed(1)}%
- Active Discussions: ${summary.team.unresolvedComments}
- Team Size: ${summary.team.activeUsers} active members

${commentResolutionRate < 70 ? '⚠️ Consider dedicating time to resolve pending discussions.' : '✅ Good collaboration and discussion resolution.'}
    `.trim();
  }

  private generateProductivityAnalysis(summary: DashboardSummary): string {
    const analysesPerMember = summary.analysis.totalAnalyses / Math.max(summary.team.activeUsers, 1);
    
    return `
**Productivity Metrics:**
- Analyses per Member: ${analysesPerMember.toFixed(1)}
- Total Analyses: ${summary.analysis.totalAnalyses}
- Issues Resolved: ${summary.issues.resolved}
- Average Resolution Time: N/A (coming soon)

The team is ${analysesPerMember >= 10 ? 'highly productive' : analysesPerMember >= 5 ? 'moderately productive' : 'getting started'} with code analysis activities.
    `.trim();
  }
}

export const reportGenerator = new ReportGenerator();
