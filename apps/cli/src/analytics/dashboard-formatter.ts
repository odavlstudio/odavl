import type { CycleMetrics, PhaseMetrics, TrendAnalysis } from './metrics-aggregator.js';

/**
 * Analytics data interface for dashboard display
 */
export interface AnalyticsData {
  metrics: CycleMetrics;
  insights: string[];
  recommendations: string[];
}

/**
 * Dashboard formatting options
 */
export interface DashboardOptions {
  colorOutput?: boolean;
  includeRecommendations?: boolean;
  compact?: boolean;
}

/**
 * Dashboard formatting for ODAVL analytics output
 * Provides human-readable summaries of evidence analytics
 */
export class DashboardFormatter {
  /**
   * Format complete cycle overview with key metrics
   * @param metrics Aggregated cycle metrics
   * @returns Formatted cycle overview string
   */
  formatCycleOverview(metrics: CycleMetrics): string {
    const trendEmoji = this.getTrendEmoji(metrics.trendDirection);
    const { totalDays } = metrics.timespan;
    
    return `📊 Cycle Overview
  Total Cycles: ${metrics.totalCycles}
  Average Duration: ${metrics.averageDuration}s
  Success Rate: ${metrics.successRate.toFixed(1)}%
  Trend: ${trendEmoji} ${metrics.trendDirection} (${totalDays} days)`;
  }

  /**
   * Format phase performance breakdown
   * @param phases Array of phase metrics
   * @returns Formatted phase breakdown string
   */
  formatPhaseBreakdown(phases: PhaseMetrics[]): string {
    const lines = phases.map(phase => {
      const emoji = this.getPhaseEmoji(phase.phase, phase.reliability);
      const name = phase.phase.toUpperCase().padEnd(7);
      return `  ${name}: avg ${phase.averageDuration}s ${emoji} ${phase.reliability}`;
    });
    
    return `⚡ Phase Performance\n${lines.join('\n')}`;
  }

  /**
   * Format trend analysis with recommendations
   * @param trends Trend analysis data
   * @returns Formatted trend analysis string
   */
  formatTrendAnalysis(trends: TrendAnalysis): string {
    const emoji = this.getTrendEmoji(trends.direction);
    return `📈 Trend Analysis
  Direction: ${emoji} ${trends.direction}
  Confidence: ${(trends.confidence * 100).toFixed(1)}%
  Change: ${trends.changePercent > 0 ? '+' : ''}${trends.changePercent}%
  Recommendation: ${trends.recommendation}`;
  }

  /**
   * Generate complete analytics report
   * @param data Complete analytics data
   * @returns Formatted analytics report
   */
  generateAnalyticsReport(data: AnalyticsData): string {
    const sections = [
      '🔍 ODAVL Evidence Analytics Dashboard',
      '=====================================',
      '',
      this.formatCycleOverview(data.metrics),
      '',
      this.formatPhaseBreakdown(data.metrics.phaseBreakdown),
    ];

    if (data.recommendations.length > 0) {
      sections.push('', '🎯 Recommendations');
      data.recommendations.forEach(rec => {
        sections.push(`  • ${rec}`);
      });
    }

    return sections.join('\n');
  }

  private getTrendEmoji(direction: string): string {
    switch (direction) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      default: return '→';
    }
  }

  private getPhaseEmoji(phase: string, _reliability: string): string {
    switch (phase) {
      case 'observe': return '🔍';
      case 'decide': return '🎯';
      case 'act': return '⚡';
      case 'verify': return '✅';
      case 'learn': return '📚';
      default: return '⭕';
    }
  }
}