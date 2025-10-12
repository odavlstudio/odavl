import { EvidenceReader, type EvidenceFile } from './evidence-reader.js';
import { MetricsAggregator, type CycleMetrics } from './metrics-aggregator.js';
import { DashboardFormatter, type AnalyticsData, type DashboardOptions } from './dashboard-formatter.js';

/**
 * Analytics report interface for comprehensive insights
 */
export interface AnalyticsReport {
  metrics: CycleMetrics;
  evidenceCount: number;
  generatedAt: string;
  insights: string[];
  recommendations: string[];
}

/**
 * ODAVL Evidence Analytics Module
 * Main entry point for evidence-based insights and reporting
 */
export class AnalyticsDashboard {
  private reader = new EvidenceReader();
  private aggregator = new MetricsAggregator();
  private formatter = new DashboardFormatter();

  /**
   * Generate comprehensive insights from evidence directory
   * @param evidenceDir Path to evidence directory (default: './evidence')
   * @returns Complete analytics report with metrics and recommendations
   */
  async generateInsights(evidenceDir = './evidence'): Promise<AnalyticsReport> {
    const evidence = await this.reader.readEvidenceFiles(evidenceDir);
    const metrics = this.aggregator.aggregateCycleMetrics(evidence);
    const insights = this.generateInsightsList(metrics, evidence);
    const recommendations = this.generateRecommendations(metrics);

    return {
      metrics,
      evidenceCount: evidence.length,
      generatedAt: new Date().toISOString(),
      insights,
      recommendations
    };
  }

  /**
   * Display formatted analytics dashboard to console
   * @param _options Dashboard formatting options
   */
  async displayDashboard(_options: DashboardOptions = {}): Promise<void> {
    try {
      const report = await this.generateInsights();
      const analyticsData: AnalyticsData = {
        metrics: report.metrics,
        insights: report.insights,
        recommendations: report.recommendations
      };

      const output = this.formatter.generateAnalyticsReport(analyticsData);
      console.log(output);
    } catch {
      console.log('🔍 ODAVL Analytics Dashboard\n');
      console.log('⚠️  Unable to load evidence data');
      console.log('   Please ensure evidence files exist in ./evidence/');
    }
  }

  private generateInsightsList(metrics: CycleMetrics, evidence: EvidenceFile[]): string[] {
    const insights: string[] = [];
    
    if (metrics.totalCycles > 0) {
      insights.push(`Analyzed ${evidence.length} evidence files across ${metrics.totalCycles} cycles`);
      insights.push(`System maintained ${metrics.successRate.toFixed(1)}% success rate`);
      
      if (metrics.trendDirection === 'improving') {
        insights.push('Performance trending upward - system learning effectively');
      }
    }

    return insights;
  }

  private generateRecommendations(metrics: CycleMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.totalCycles === 0) {
      recommendations.push('Run ODAVL cycles to generate performance insights');
      recommendations.push('Evidence collection will enable trend analysis');
    } else {
      recommendations.push('Continue monitoring cycle performance');
      if (metrics.successRate < 90) {
        recommendations.push('Review failed cycles for optimization opportunities');
      }
    }

    return recommendations;
  }
}

// Re-export types and classes for external use
export { EvidenceReader, type EvidenceFile } from './evidence-reader.js';
export { MetricsAggregator, type CycleMetrics } from './metrics-aggregator.js';
export { DashboardFormatter } from './dashboard-formatter.js';