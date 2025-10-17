import { PerformanceInsight } from '../types/IntelligenceTypes';

interface PerformanceMetric {
  timestamp: number;
  category: string;
  value: number;
  metadata: Record<string, string>;
}

type TrendType = 'increasing' | 'stable' | 'decreasing';

interface PerformanceStats {
  avgValue: number;
  trend: TrendType;
  dataPoints: number;
}

/**
 * Performance Analytics - Enhanced performance monitoring for ODAVL Phase 3
 * Tracks system resources, detects bottlenecks, and provides optimization recommendations
 */
export class PerformanceAnalytics {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;

  /**
   * Record performance metric with timestamp
   */
  public recordMetric(category: string, value: number, metadata?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      category,
      value,
      metadata: metadata || {}
    };

    this.metrics.push(metric);

    // Keep only recent metrics to manage memory
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Analyze performance trends and generate insights
   */
  public analyzePerformance(): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];

    // Memory usage analysis
    const memoryInsight = this.analyzeMemoryTrend();
    if (memoryInsight) insights.push(memoryInsight);

    // Timing analysis
    const timingInsight = this.analyzeTimingTrend();
    if (timingInsight) insights.push(timingInsight);

    // I/O analysis
    const ioInsight = this.analyzeIOTrend();
    if (ioInsight) insights.push(ioInsight);

    return insights;
  }

  /**
   * Get current performance statistics
   */
  public getCurrentStats(): PerformanceStats {
    const recent = this.metrics.slice(-10);

    if (recent.length === 0) {
      return { avgValue: 0, trend: 'stable', dataPoints: 0 };
    }

    const avgValue = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

    let trend: TrendType = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';

    return { avgValue, trend, dataPoints: recent.length };
  }

  private analyzeMemoryTrend(): PerformanceInsight | null {
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory').slice(-10);
    if (memoryMetrics.length < 3) return null;

    const stats = this.calculateTrend(memoryMetrics);
    return {
      category: 'memory',
      current: stats.current,
      trend: stats.trend,
      prediction: stats.predicted,
      optimization: stats.trend === 'increasing' ?
        ['Enable memory pooling', 'Clear unused caches', 'Optimize data structures'] :
        ['Memory usage optimal']
    };
  }

  private analyzeTimingTrend(): PerformanceInsight | null {
    const timingMetrics = this.metrics.filter(m => m.category === 'timing').slice(-10);
    if (timingMetrics.length < 3) return null;

    const stats = this.calculateTrend(timingMetrics);
    return {
      category: 'timing',
      current: stats.current,
      trend: stats.trend,
      prediction: stats.predicted,
      optimization: stats.trend === 'increasing' ?
        ['Enable parallel processing', 'Optimize algorithms', 'Add result caching'] :
        ['Performance optimal']
    };
  }

  private analyzeIOTrend(): PerformanceInsight | null {
    const ioMetrics = this.metrics.filter(m => m.category === 'io').slice(-10);
    if (ioMetrics.length < 3) return null;

    const stats = this.calculateTrend(ioMetrics);
    return {
      category: 'io',
      current: stats.current,
      trend: stats.trend,
      prediction: stats.predicted,
      optimization: stats.trend === 'increasing' ?
        ['Batch file operations', 'Enable file caching', 'Optimize read patterns'] :
        ['I/O performance optimal']
    };
  }

  private calculateTrend(metrics: PerformanceMetric[]): { current: number; trend: 'increasing' | 'stable' | 'decreasing'; predicted: number } {
    if (metrics.length === 0) return { current: 0, trend: 'stable', predicted: 0 };

    const current = metrics.at(-1)?.value || 0;
    const previous = metrics.at(-2)?.value || current;
    const predicted = current + (current - previous);

    let trend: TrendType = 'stable';
    if (current > previous * 1.1) trend = 'increasing';
    else if (current < previous * 0.9) trend = 'decreasing';

    return { current, trend, predicted: Math.max(0, predicted) };
  }
}
