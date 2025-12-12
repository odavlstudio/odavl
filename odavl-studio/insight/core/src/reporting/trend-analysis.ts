/**
 * @fileoverview Trend Analysis Engine
 * Analyzes code quality trends over time with historical data
 * Provides insights into improvement/degradation patterns
 * 
 * Features:
 * - Time-series analysis
 * - Trend detection (improving, degrading, stable)
 * - Moving averages (7-day, 30-day, 90-day)
 * - Velocity calculations
 * - Anomaly detection
 * - Forecasting (linear regression)
 * - Historical comparisons
 * - Custom time ranges
 * 
 * @module reporting/trend-analysis
 */

import type { AnalysisResult } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Trend analysis configuration
 */
export interface TrendConfig {
  /** Historical data points */
  historicalData: AnalysisResult[];
  
  /** Time range for analysis (days) */
  timeRange?: number;
  
  /** Moving average windows (days) */
  movingAverageWindows?: number[];
  
  /** Enable anomaly detection */
  detectAnomalies?: boolean;
  
  /** Anomaly threshold (standard deviations) */
  anomalyThreshold?: number;
  
  /** Enable forecasting */
  enableForecasting?: boolean;
  
  /** Forecast periods ahead (days) */
  forecastPeriods?: number;
}

/**
 * Trend direction
 */
export type TrendDirection = 'improving' | 'degrading' | 'stable';

/**
 * Trend analysis result
 */
export interface TrendAnalysisResult {
  /** Time range analyzed */
  timeRange: {
    start: Date;
    end: Date;
    days: number;
  };
  
  /** Overall trend direction */
  overallTrend: TrendDirection;
  
  /** Trend confidence (0-100) */
  trendConfidence: number;
  
  /** Metrics trends */
  metrics: {
    totalIssues: MetricTrend;
    critical: MetricTrend;
    high: MetricTrend;
    medium: MetricTrend;
    low: MetricTrend;
    filesAnalyzed: MetricTrend;
    linesOfCode: MetricTrend;
  };
  
  /** Moving averages */
  movingAverages: {
    window: number;
    totalIssues: number;
    critical: number;
    high: number;
  }[];
  
  /** Velocity (issues per day) */
  velocity: {
    current: number;
    average: number;
    trend: TrendDirection;
  };
  
  /** Anomalies detected */
  anomalies: Anomaly[];
  
  /** Forecast (if enabled) */
  forecast?: Forecast;
  
  /** Summary */
  summary: string;
}

/**
 * Metric trend details
 */
export interface MetricTrend {
  /** Current value */
  current: number;
  
  /** Previous value (7 days ago) */
  previous: number;
  
  /** Change amount */
  change: number;
  
  /** Change percentage */
  changePercent: number;
  
  /** Trend direction */
  direction: TrendDirection;
  
  /** Highest value in range */
  highest: number;
  
  /** Lowest value in range */
  lowest: number;
  
  /** Average value */
  average: number;
  
  /** Standard deviation */
  stdDev: number;
}

/**
 * Detected anomaly
 */
export interface Anomaly {
  /** Anomaly date */
  date: Date;
  
  /** Metric name */
  metric: string;
  
  /** Actual value */
  value: number;
  
  /** Expected value */
  expected: number;
  
  /** Deviation (standard deviations) */
  deviation: number;
  
  /** Severity */
  severity: 'minor' | 'moderate' | 'severe';
  
  /** Description */
  description: string;
}

/**
 * Forecast data
 */
export interface Forecast {
  /** Forecast method */
  method: 'linear-regression';
  
  /** Predicted values */
  predictions: Array<{
    date: Date;
    totalIssues: number;
    critical: number;
    high: number;
  }>;
  
  /** Confidence interval (%) */
  confidence: number;
  
  /** R-squared (goodness of fit) */
  rSquared: number;
}

// ============================================================================
// Trend Analysis Engine
// ============================================================================

/**
 * Trend analysis engine for code quality metrics
 */
export class TrendAnalysisEngine {
  private config: Required<TrendConfig>;

  constructor(config: TrendConfig) {
    this.config = {
      historicalData: config.historicalData,
      timeRange: config.timeRange || 30,
      movingAverageWindows: config.movingAverageWindows || [7, 30, 90],
      detectAnomalies: config.detectAnomalies ?? true,
      anomalyThreshold: config.anomalyThreshold || 2.5,
      enableForecasting: config.enableForecasting ?? true,
      forecastPeriods: config.forecastPeriods || 7,
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Analyze trends in historical data
   */
  analyze(): TrendAnalysisResult {
    console.log('📊 Analyzing code quality trends...');

    // Filter data by time range
    const filteredData = this.filterByTimeRange(this.config.historicalData, this.config.timeRange);

    if (filteredData.length < 2) {
      throw new Error('Insufficient historical data for trend analysis (minimum 2 data points required)');
    }

    // Extract metrics
    const totalIssuesTrend = this.analyzeTrend(filteredData, 'totalIssues');
    const criticalTrend = this.analyzeTrend(filteredData, 'critical');
    const highTrend = this.analyzeTrend(filteredData, 'high');
    const mediumTrend = this.analyzeTrend(filteredData, 'medium');
    const lowTrend = this.analyzeTrend(filteredData, 'low');
    const filesAnalyzedTrend = this.analyzeTrend(filteredData, 'filesAnalyzed');
    const linesOfCodeTrend = this.analyzeTrend(filteredData, 'linesOfCode');

    // Calculate moving averages
    const movingAverages = this.calculateMovingAverages(filteredData);

    // Calculate velocity
    const velocity = this.calculateVelocity(filteredData);

    // Detect anomalies
    const anomalies = this.config.detectAnomalies
      ? this.detectAnomalies(filteredData)
      : [];

    // Generate forecast
    const forecast = this.config.enableForecasting
      ? this.generateForecast(filteredData)
      : undefined;

    // Determine overall trend
    const overallTrend = this.determineOverallTrend(criticalTrend, highTrend, totalIssuesTrend);
    const trendConfidence = this.calculateTrendConfidence(filteredData);

    // Generate summary
    const summary = this.generateSummary(overallTrend, totalIssuesTrend, criticalTrend);

    const result: TrendAnalysisResult = {
      timeRange: {
        start: new Date(filteredData[0].timestamp),
        end: new Date(filteredData[filteredData.length - 1].timestamp),
        days: this.config.timeRange,
      },
      overallTrend,
      trendConfidence,
      metrics: {
        totalIssues: totalIssuesTrend,
        critical: criticalTrend,
        high: highTrend,
        medium: mediumTrend,
        low: lowTrend,
        filesAnalyzed: filesAnalyzedTrend,
        linesOfCode: linesOfCodeTrend,
      },
      movingAverages,
      velocity,
      anomalies,
      forecast,
      summary,
    };

    console.log(`✅ Trend analysis complete (${overallTrend})`);
    return result;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Trend Analysis
  // --------------------------------------------------------------------------

  private analyzeTrend(data: AnalysisResult[], metric: string): MetricTrend {
    const values = data.map(d => this.extractMetric(d, metric));
    const current = values[values.length - 1];
    const previous = values.length > 7 ? values[values.length - 8] : values[0];
    
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;
    const direction = this.determineTrendDirection(change, changePercent);

    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const average = this.mean(values);
    const stdDev = this.standardDeviation(values, average);

    return {
      current,
      previous,
      change,
      changePercent,
      direction,
      highest,
      lowest,
      average,
      stdDev,
    };
  }

  private extractMetric(result: AnalysisResult, metric: string): number {
    switch (metric) {
      case 'totalIssues':
        return result.issues?.length || 0;
      case 'critical':
        return result.issues?.filter(i => i.severity === 'critical').length || 0;
      case 'high':
        return result.issues?.filter(i => i.severity === 'high').length || 0;
      case 'medium':
        return result.issues?.filter(i => i.severity === 'medium').length || 0;
      case 'low':
        return result.issues?.filter(i => i.severity === 'low').length || 0;
      case 'filesAnalyzed':
        return result.metrics?.filesAnalyzed || 0;
      case 'linesOfCode':
        return result.metrics?.linesOfCode || 0;
      default:
        return 0;
    }
  }

  private determineTrendDirection(change: number, changePercent: number): TrendDirection {
    // For issues, decrease is improvement
    if (Math.abs(changePercent) < 5) return 'stable';
    return change < 0 ? 'improving' : 'degrading';
  }

  private determineOverallTrend(
    critical: MetricTrend,
    high: MetricTrend,
    total: MetricTrend
  ): TrendDirection {
    // Weight critical issues more heavily
    const criticalWeight = critical.direction === 'improving' ? -3 : critical.direction === 'degrading' ? 3 : 0;
    const highWeight = high.direction === 'improving' ? -2 : high.direction === 'degrading' ? 2 : 0;
    const totalWeight = total.direction === 'improving' ? -1 : total.direction === 'degrading' ? 1 : 0;

    const score = criticalWeight + highWeight + totalWeight;

    if (score < -2) return 'improving';
    if (score > 2) return 'degrading';
    return 'stable';
  }

  private calculateTrendConfidence(data: AnalysisResult[]): number {
    // More data points = higher confidence
    const dataPointScore = Math.min((data.length / 30) * 50, 50);
    
    // Lower variance = higher confidence
    const values = data.map(d => d.issues?.length || 0);
    const variance = this.standardDeviation(values, this.mean(values));
    const varianceScore = Math.max(50 - (variance / 10), 0);

    return Math.round(dataPointScore + varianceScore);
  }

  // --------------------------------------------------------------------------
  // Private Methods - Moving Averages
  // --------------------------------------------------------------------------

  private calculateMovingAverages(data: AnalysisResult[]): TrendAnalysisResult['movingAverages'] {
    return this.config.movingAverageWindows.map(window => {
      const recentData = data.slice(-window);
      
      return {
        window,
        totalIssues: this.mean(recentData.map(d => d.issues?.length || 0)),
        critical: this.mean(recentData.map(d => d.issues?.filter(i => i.severity === 'critical').length || 0)),
        high: this.mean(recentData.map(d => d.issues?.filter(i => i.severity === 'high').length || 0)),
      };
    });
  }

  // --------------------------------------------------------------------------
  // Private Methods - Velocity
  // --------------------------------------------------------------------------

  private calculateVelocity(data: AnalysisResult[]): TrendAnalysisResult['velocity'] {
    if (data.length < 2) {
      return { current: 0, average: 0, trend: 'stable' };
    }

    // Calculate daily issue changes
    const dailyChanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].issues?.length || 0;
      const curr = data[i].issues?.length || 0;
      dailyChanges.push(curr - prev);
    }

    const current = dailyChanges[dailyChanges.length - 1];
    const average = this.mean(dailyChanges);

    const trend = current < -1 ? 'improving' :
                  current > 1 ? 'degrading' : 'stable';

    return { current, average, trend };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Anomaly Detection
  // --------------------------------------------------------------------------

  private detectAnomalies(data: AnalysisResult[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const metrics = ['totalIssues', 'critical', 'high'];

    for (const metric of metrics) {
      const values = data.map(d => this.extractMetric(d, metric));
      const mean = this.mean(values);
      const stdDev = this.standardDeviation(values, mean);

      for (let i = 0; i < data.length; i++) {
        const value = values[i];
        const deviation = Math.abs((value - mean) / stdDev);

        if (deviation > this.config.anomalyThreshold) {
          const severity = deviation > 4 ? 'severe' :
                          deviation > 3 ? 'moderate' : 'minor';

          anomalies.push({
            date: new Date(data[i].timestamp),
            metric,
            value,
            expected: mean,
            deviation,
            severity,
            description: `${metric} spike detected: ${value} (expected ~${Math.round(mean)}, ${deviation.toFixed(1)}σ deviation)`,
          });
        }
      }
    }

    return anomalies;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Forecasting
  // --------------------------------------------------------------------------

  private generateForecast(data: AnalysisResult[]): Forecast {
    // Simple linear regression for forecasting
    const totalIssuesValues = data.map(d => d.issues?.length || 0);
    const criticalValues = data.map(d => d.issues?.filter(i => i.severity === 'critical').length || 0);
    const highValues = data.map(d => d.issues?.filter(i => i.severity === 'high').length || 0);

    const totalIssuesModel = this.linearRegression(totalIssuesValues);
    const criticalModel = this.linearRegression(criticalValues);
    const highModel = this.linearRegression(highValues);

    const predictions: Forecast['predictions'] = [];
    const lastDate = new Date(data[data.length - 1].timestamp);

    for (let i = 1; i <= this.config.forecastPeriods; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      const x = data.length + i;
      predictions.push({
        date: forecastDate,
        totalIssues: Math.max(0, Math.round(totalIssuesModel.slope * x + totalIssuesModel.intercept)),
        critical: Math.max(0, Math.round(criticalModel.slope * x + criticalModel.intercept)),
        high: Math.max(0, Math.round(highModel.slope * x + highModel.intercept)),
      });
    }

    return {
      method: 'linear-regression',
      predictions,
      confidence: Math.round(totalIssuesModel.rSquared * 100),
      rSquared: totalIssuesModel.rSquared,
    };
  }

  private linearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return { slope, intercept, rSquared };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private filterByTimeRange(data: AnalysisResult[], days: number): AnalysisResult[] {
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    return data.filter(d => new Date(d.timestamp).getTime() >= cutoff);
  }

  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private standardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private generateSummary(
    overall: TrendDirection,
    total: MetricTrend,
    critical: MetricTrend
  ): string {
    if (overall === 'improving') {
      return `✅ Code quality is improving! Total issues decreased by ${Math.abs(total.changePercent).toFixed(1)}% and critical issues by ${Math.abs(critical.changePercent).toFixed(1)}%.`;
    } else if (overall === 'degrading') {
      return `⚠️ Code quality is degrading. Total issues increased by ${total.changePercent.toFixed(1)}% with ${critical.change} new critical issues.`;
    } else {
      return `📊 Code quality is stable with ${total.current} total issues (${critical.current} critical).`;
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create trend analysis engine
 */
export function createTrendAnalysisEngine(config: TrendConfig): TrendAnalysisEngine {
  return new TrendAnalysisEngine(config);
}

/**
 * Quick trend analysis
 */
export function analyzeTrends(historicalData: AnalysisResult[], timeRange?: number): TrendAnalysisResult {
  const engine = createTrendAnalysisEngine({ historicalData, timeRange });
  return engine.analyze();
}

/**
 * Get trend summary for CLI output
 */
export function getTrendSummary(historicalData: AnalysisResult[]): string {
  if (historicalData.length < 2) {
    return 'Insufficient data for trend analysis';
  }

  const result = analyzeTrends(historicalData, 30);
  
  return `
📊 Trend Analysis Summary (Last 30 Days)

Overall Trend: ${result.overallTrend.toUpperCase()} (${result.trendConfidence}% confidence)

Metrics:
  Total Issues: ${result.metrics.totalIssues.current} (${result.metrics.totalIssues.changePercent > 0 ? '+' : ''}${result.metrics.totalIssues.changePercent.toFixed(1)}%)
  Critical: ${result.metrics.critical.current} (${result.metrics.critical.changePercent > 0 ? '+' : ''}${result.metrics.critical.changePercent.toFixed(1)}%)
  High: ${result.metrics.high.current} (${result.metrics.high.changePercent > 0 ? '+' : ''}${result.metrics.high.changePercent.toFixed(1)}%)

Moving Averages (7-day):
  Total Issues: ${result.movingAverages[0]?.totalIssues.toFixed(1)}
  Critical: ${result.movingAverages[0]?.critical.toFixed(1)}

Velocity: ${result.velocity.current.toFixed(1)} issues/day (${result.velocity.trend})

${result.anomalies.length > 0 ? `⚠️ Anomalies Detected: ${result.anomalies.length}` : ''}

${result.summary}
  `.trim();
}
