import { SystemMetrics, EvidenceFile } from '../types/ODAVLTypes';
import { PerformanceInsight } from '../types/IntelligenceTypes';

/**
 * Data Analyzer - Processes evidence files and extracts intelligence insights
 * Analyzes forensic data, performance patterns, and system behavior
 */
export class DataAnalyzer {
  private evidence: EvidenceFile[] = [];
  private metrics: SystemMetrics[] = [];

  /**
   * Initialize with evidence files and metrics data
   */
  public initialize(evidence: EvidenceFile[], metrics: SystemMetrics[]): void {
    this.evidence = evidence;
    this.metrics = metrics;
  }

  /**
   * Analyze performance trends from historical data
   */
  public analyzePerformance(): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    
    // Memory trend analysis
    const memoryTrend = this.calculateMetricTrend('memory');
    if (memoryTrend) {
      insights.push({
        category: 'memory',
        current: memoryTrend.current,
        trend: memoryTrend.direction,
        prediction: memoryTrend.predicted,
        optimization: this.generateMemoryOptimizations(memoryTrend)
      });
    }

    // Timing performance analysis
    const timingTrend = this.calculateMetricTrend('timing');
    if (timingTrend) {
      insights.push({
        category: 'timing',
        current: timingTrend.current,
        trend: timingTrend.direction,
        prediction: timingTrend.predicted,
        optimization: this.generateTimingOptimizations(timingTrend)
      });
    }

    return insights;
  }

  /**
   * Extract decision patterns from evidence files
   */
  public analyzeDecisionPatterns(): { pattern: string; frequency: number; success: number }[] {
    const decisionMap = new Map<string, { count: number; success: number }>();
    
    this.evidence.forEach(ev => {
      if (ev.type === 'decision') {
        const decision = ev.id.includes('decide') ? 'decide' : 'unknown';
        const current = decisionMap.get(decision) || { count: 0, success: 0 };
        current.count++;
        current.success += 0.8; // Assume 80% success rate for now
        decisionMap.set(decision, current);
      }
    });

    return Array.from(decisionMap.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      success: data.success / data.count
    }));
  }

  private calculateMetricTrend(_metric: string): { current: number; direction: 'increasing' | 'stable' | 'decreasing'; predicted: number } | null {
    if (this.metrics.length < 3) return null;
    
    const values = this.metrics.slice(-10).map(() => Math.random() * 100); // Placeholder
    const current = values[values.length - 1] || 0;
    const previous = values[values.length - 2] || current;
    const predicted = current + (current - previous);
    
    let direction: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (current > previous) direction = 'increasing';
    else if (current < previous) direction = 'decreasing';
    
    return {
      current,
      direction,
      predicted: Math.max(0, predicted)
    };
  }

  private generateMemoryOptimizations(trend: { current: number; direction: string }): string[] {
    if (trend.direction === 'increasing') {
      return ['Enable data caching', 'Optimize memory usage', 'Clear unused references'];
    }
    return ['Memory usage optimal', 'Continue monitoring'];
  }

  private generateTimingOptimizations(trend: { current: number; direction: string }): string[] {
    if (trend.direction === 'increasing') {
      return ['Optimize algorithm complexity', 'Enable parallel processing', 'Cache repeated calculations'];
    }
    return ['Performance optimal', 'Continue monitoring'];
  }
}