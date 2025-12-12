/**
 * ODAVL Insight Enterprise - Trend Analysis Engine
 * Week 41: Historical Trending - File 1/3
 * 
 * Features:
 * - Time-series analysis of code quality metrics
 * - Trend detection (upward, downward, stable)
 * - Moving averages (SMA, EMA, WMA)
 * - Linear regression for trend lines
 * - Anomaly detection (statistical outliers)
 * - Period-over-period comparison
 * - Seasonality detection
 * - Forecasting (short-term predictions)
 * - Metric correlation analysis
 * - Change point detection
 * 
 * @module trending/trend-analysis
 */

import { EventEmitter } from 'events';

// ==================== Types & Interfaces ====================

/**
 * Time period for trend analysis
 */
export enum TimePeriod {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
}

/**
 * Trend direction
 */
export enum TrendDirection {
  Upward = 'upward',       // Metric improving
  Downward = 'downward',   // Metric degrading
  Stable = 'stable',       // No significant change
  Volatile = 'volatile',   // High variance
  Unknown = 'unknown',     // Insufficient data
}

/**
 * Moving average type
 */
export enum MovingAverageType {
  Simple = 'simple',         // SMA: Equal weights
  Exponential = 'exponential', // EMA: Recent data weighted more
  Weighted = 'weighted',     // WMA: Linear weights
}

/**
 * Data point in time series
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  metric: string;
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  direction: TrendDirection;
  confidence: number; // 0-1 (statistical confidence)
  slope: number; // Rate of change
  correlation: number; // R² value
  
  // Statistics
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  
  // Trend line (linear regression)
  trendLine: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  
  // Moving averages
  movingAverages?: {
    sma?: number[];
    ema?: number[];
    wma?: number[];
  };
  
  // Anomalies
  anomalies: TimeSeriesPoint[];
  
  // Change points (sudden shifts)
  changePoints: Date[];
  
  // Forecast (next N periods)
  forecast?: TimeSeriesPoint[];
}

/**
 * Period comparison result
 */
export interface PeriodComparison {
  metric: string;
  currentPeriod: {
    start: Date;
    end: Date;
    value: number;
  };
  previousPeriod: {
    start: Date;
    end: Date;
    value: number;
  };
  change: {
    absolute: number; // Current - Previous
    percentage: number; // (Current - Previous) / Previous * 100
    direction: 'increase' | 'decrease' | 'stable';
  };
  significance: 'significant' | 'not-significant'; // t-test result
}

/**
 * Correlation analysis result
 */
export interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  correlation: number; // Pearson correlation (-1 to 1)
  pValue: number; // Statistical significance
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
}

/**
 * Seasonality detection result
 */
export interface SeasonalityAnalysis {
  metric: string;
  hasSeasonality: boolean;
  period: TimePeriod | null; // Daily, weekly, monthly patterns
  confidence: number;
  peaks: Date[]; // Recurring high points
  troughs: Date[]; // Recurring low points
}

/**
 * Trend analyzer configuration
 */
export interface TrendAnalyzerConfig {
  // Moving average window sizes
  smaWindow: number; // Default: 7
  emaWindow: number; // Default: 7
  wmaWindow: number; // Default: 7
  
  // Anomaly detection
  anomalyThreshold: number; // Std devs from mean (default: 2)
  
  // Change point detection
  changePointSensitivity: number; // 0-1 (default: 0.5)
  
  // Forecasting
  forecastHorizon: number; // Periods to forecast (default: 7)
  
  // Statistical significance
  significanceLevel: number; // p-value threshold (default: 0.05)
  
  // Minimum data points
  minDataPoints: number; // Default: 10
  
  // Cache settings
  cacheTTL: number; // Seconds (default: 300)
  enableCache: boolean;
}

// ==================== Trend Analyzer ====================

const DEFAULT_CONFIG: TrendAnalyzerConfig = {
  smaWindow: 7,
  emaWindow: 7,
  wmaWindow: 7,
  anomalyThreshold: 2,
  changePointSensitivity: 0.5,
  forecastHorizon: 7,
  significanceLevel: 0.05,
  minDataPoints: 10,
  cacheTTL: 300,
  enableCache: true,
};

/**
 * Trend Analysis Engine
 * Analyzes time-series data to detect trends, anomalies, and patterns
 */
export class TrendAnalyzer extends EventEmitter {
  private config: TrendAnalyzerConfig;
  private cache: Map<string, { data: unknown; timestamp: number }>;

  constructor(config: Partial<TrendAnalyzerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
  }

  /**
   * Analyze trend in time-series data
   */
  async analyzeTrend(
    metric: string,
    data: TimeSeriesPoint[],
    period: TimePeriod
  ): Promise<TrendAnalysis> {
    // Validate data
    if (data.length < this.config.minDataPoints) {
      throw new Error(`Insufficient data: need at least ${this.config.minDataPoints} points`);
    }

    // Sort by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const values = sortedData.map(d => d.value);

    // Calculate statistics
    const stats = this.calculateStatistics(values);

    // Detect trend direction
    const trendLine = this.calculateTrendLine(sortedData);
    const direction = this.detectTrendDirection(trendLine, stats.stdDev);

    // Calculate moving averages
    const movingAverages = {
      sma: this.calculateSMA(values, this.config.smaWindow),
      ema: this.calculateEMA(values, this.config.emaWindow),
      wma: this.calculateWMA(values, this.config.wmaWindow),
    };

    // Detect anomalies
    const anomalies = this.detectAnomalies(sortedData, stats.mean, stats.stdDev);

    // Detect change points
    const changePoints = this.detectChangePoints(sortedData);

    // Forecast future values
    const forecast = this.forecastValues(sortedData, trendLine, this.config.forecastHorizon);

    const analysis: TrendAnalysis = {
      metric,
      period,
      startDate: sortedData[0].timestamp,
      endDate: sortedData[sortedData.length - 1].timestamp,
      direction,
      confidence: this.calculateConfidence(trendLine.rSquared),
      slope: trendLine.slope,
      correlation: trendLine.rSquared,
      ...stats,
      trendLine,
      movingAverages,
      anomalies,
      changePoints,
      forecast,
    };

    this.emit('trend-analyzed', { metric, analysis });
    return analysis;
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    metric: string,
    currentData: TimeSeriesPoint[],
    previousData: TimeSeriesPoint[]
  ): Promise<PeriodComparison> {
    if (currentData.length === 0 || previousData.length === 0) {
      throw new Error('Both periods must have data');
    }

    // Calculate means
    const currentValues = currentData.map(d => d.value);
    const previousValues = previousData.map(d => d.value);
    const currentMean = this.mean(currentValues);
    const previousMean = this.mean(previousValues);

    // Calculate change
    const absoluteChange = currentMean - previousMean;
    const percentageChange = (absoluteChange / previousMean) * 100;
    const direction = absoluteChange > 0 ? 'increase' : absoluteChange < 0 ? 'decrease' : 'stable';

    // t-test for significance
    const significance = this.tTest(currentValues, previousValues) < this.config.significanceLevel
      ? 'significant'
      : 'not-significant';

    const comparison: PeriodComparison = {
      metric,
      currentPeriod: {
        start: currentData[0].timestamp,
        end: currentData[currentData.length - 1].timestamp,
        value: currentMean,
      },
      previousPeriod: {
        start: previousData[0].timestamp,
        end: previousData[previousData.length - 1].timestamp,
        value: previousMean,
      },
      change: {
        absolute: absoluteChange,
        percentage: percentageChange,
        direction,
      },
      significance,
    };

    this.emit('periods-compared', { metric, comparison });
    return comparison;
  }

  /**
   * Analyze correlation between two metrics
   */
  async analyzeCorrelation(
    metric1: string,
    data1: TimeSeriesPoint[],
    metric2: string,
    data2: TimeSeriesPoint[]
  ): Promise<CorrelationAnalysis> {
    // Align data by timestamp
    const aligned = this.alignTimeSeries(data1, data2);
    const values1 = aligned.map(d => d.value1);
    const values2 = aligned.map(d => d.value2);

    // Calculate Pearson correlation
    const correlation = this.pearsonCorrelation(values1, values2);
    const pValue = this.correlationPValue(correlation, values1.length);

    // Classify correlation strength
    const absCorrelation = Math.abs(correlation);
    let strength: 'strong' | 'moderate' | 'weak' | 'none';
    if (absCorrelation >= 0.7) strength = 'strong';
    else if (absCorrelation >= 0.4) strength = 'moderate';
    else if (absCorrelation >= 0.2) strength = 'weak';
    else strength = 'none';

    const direction = correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'none';

    const analysis: CorrelationAnalysis = {
      metric1,
      metric2,
      correlation,
      pValue,
      strength,
      direction,
    };

    this.emit('correlation-analyzed', { analysis });
    return analysis;
  }

  /**
   * Detect seasonality in time-series data
   */
  async detectSeasonality(
    metric: string,
    data: TimeSeriesPoint[],
    period: TimePeriod
  ): Promise<SeasonalityAnalysis> {
    if (data.length < 2 * this.periodToPoints(period)) {
      return {
        metric,
        hasSeasonality: false,
        period: null,
        confidence: 0,
        peaks: [],
        troughs: [],
      };
    }

    // Decompose time series (trend + seasonal + residual)
    const decomposed = this.decomposeTimeSeries(data, period);

    // Detect repeating patterns
    const autocorrelation = this.calculateAutocorrelation(decomposed.seasonal);
    const hasSeasonality = Math.abs(autocorrelation) > 0.5;

    // Find peaks and troughs
    const peaks = this.findPeaks(data);
    const troughs = this.findTroughs(data);

    const analysis: SeasonalityAnalysis = {
      metric,
      hasSeasonality,
      period: hasSeasonality ? period : null,
      confidence: Math.abs(autocorrelation),
      peaks: peaks.map(p => p.timestamp),
      troughs: troughs.map(t => t.timestamp),
    };

    this.emit('seasonality-detected', { metric, analysis });
    return analysis;
  }

  /**
   * Get multiple trends for comparison
   */
  async getMultipleTrends(
    metrics: string[],
    dataMap: Map<string, TimeSeriesPoint[]>,
    period: TimePeriod
  ): Promise<TrendAnalysis[]> {
    const trends = await Promise.all(
      metrics.map(metric => {
        const data = dataMap.get(metric);
        if (!data) throw new Error(`No data for metric: ${metric}`);
        return this.analyzeTrend(metric, data, period);
      })
    );

    this.emit('multiple-trends-analyzed', { metrics, trends });
    return trends;
  }

  // ==================== Statistics ====================

  /**
   * Calculate basic statistics
   */
  private calculateStatistics(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = this.mean(values);
    const variance = this.variance(values, mean);
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median: this.median(sorted),
      stdDev,
      variance,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private median(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  private variance(values: number[], mean: number): number {
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  // ==================== Trend Detection ====================

  /**
   * Calculate linear regression trend line
   */
  private calculateTrendLine(data: TimeSeriesPoint[]) {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i); // Time index
    const y = data.map(d => d.value);

    const xMean = this.mean(x);
    const yMean = this.mean(y);

    // Calculate slope (beta1)
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    const slope = numerator / denominator;

    // Calculate intercept (beta0)
    const intercept = yMean - slope * xMean;

    // Calculate R² (goodness of fit)
    const predicted = x.map(xi => slope * xi + intercept);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, intercept, rSquared };
  }

  /**
   * Detect trend direction from trend line
   */
  private detectTrendDirection(
    trendLine: { slope: number; rSquared: number },
    stdDev: number
  ): TrendDirection {
    const { slope, rSquared } = trendLine;

    // Low R² = volatile/unknown
    if (rSquared < 0.3) {
      return TrendDirection.Volatile;
    }

    // Normalize slope by standard deviation
    const normalizedSlope = slope / stdDev;

    if (Math.abs(normalizedSlope) < 0.1) {
      return TrendDirection.Stable;
    } else if (normalizedSlope > 0) {
      return TrendDirection.Upward;
    } else {
      return TrendDirection.Downward;
    }
  }

  /**
   * Calculate confidence from R²
   */
  private calculateConfidence(rSquared: number): number {
    return Math.max(0, Math.min(1, rSquared));
  }

  // ==================== Moving Averages ====================

  /**
   * Simple Moving Average (SMA)
   */
  private calculateSMA(values: number[], window: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        sma.push(NaN); // Not enough data
      } else {
        const slice = values.slice(i - window + 1, i + 1);
        sma.push(this.mean(slice));
      }
    }
    return sma;
  }

  /**
   * Exponential Moving Average (EMA)
   */
  private calculateEMA(values: number[], window: number): number[] {
    const alpha = 2 / (window + 1);
    const ema: number[] = [values[0]];

    for (let i = 1; i < values.length; i++) {
      ema.push(alpha * values[i] + (1 - alpha) * ema[i - 1]);
    }

    return ema;
  }

  /**
   * Weighted Moving Average (WMA)
   */
  private calculateWMA(values: number[], window: number): number[] {
    const wma: number[] = [];
    const weights = Array.from({ length: window }, (_, i) => i + 1);
    const weightSum = weights.reduce((sum, w) => sum + w, 0);

    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        wma.push(NaN);
      } else {
        const slice = values.slice(i - window + 1, i + 1);
        const weighted = slice.reduce((sum, v, j) => sum + v * weights[j], 0);
        wma.push(weighted / weightSum);
      }
    }

    return wma;
  }

  // ==================== Anomaly Detection ====================

  /**
   * Detect statistical outliers (Z-score method)
   */
  private detectAnomalies(
    data: TimeSeriesPoint[],
    mean: number,
    stdDev: number
  ): TimeSeriesPoint[] {
    const threshold = this.config.anomalyThreshold;
    return data.filter(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      return zScore > threshold;
    });
  }

  // ==================== Change Point Detection ====================

  /**
   * Detect sudden shifts in mean (CUSUM algorithm)
   */
  private detectChangePoints(data: TimeSeriesPoint[]): Date[] {
    const values = data.map(d => d.value);
    const mean = this.mean(values);
    const stdDev = Math.sqrt(this.variance(values, mean));
    const threshold = this.config.changePointSensitivity * stdDev;

    const changePoints: Date[] = [];
    let cusum = 0;

    for (let i = 1; i < values.length; i++) {
      cusum += values[i] - mean;

      if (Math.abs(cusum) > threshold) {
        changePoints.push(data[i].timestamp);
        cusum = 0; // Reset after detection
      }
    }

    return changePoints;
  }

  // ==================== Forecasting ====================

  /**
   * Forecast future values using linear regression
   */
  private forecastValues(
    data: TimeSeriesPoint[],
    trendLine: { slope: number; intercept: number },
    horizon: number
  ): TimeSeriesPoint[] {
    const lastTimestamp = data[data.length - 1].timestamp;
    const period = this.estimatePeriod(data);
    const forecast: TimeSeriesPoint[] = [];

    for (let i = 1; i <= horizon; i++) {
      const x = data.length + i;
      const value = trendLine.slope * x + trendLine.intercept;
      const timestamp = new Date(lastTimestamp.getTime() + period * i);

      forecast.push({ timestamp, value });
    }

    return forecast;
  }

  /**
   * Estimate average period between data points (milliseconds)
   */
  private estimatePeriod(data: TimeSeriesPoint[]): number {
    if (data.length < 2) return 86400000; // 1 day default

    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i].timestamp.getTime() - data[i - 1].timestamp.getTime());
    }

    return this.mean(intervals);
  }

  // ==================== Correlation ====================

  /**
   * Calculate Pearson correlation coefficient
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const xMean = this.mean(x);
    const yMean = this.mean(y);

    let numerator = 0;
    let xDenom = 0;
    let yDenom = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenom += xDiff * xDiff;
      yDenom += yDiff * yDiff;
    }

    return numerator / Math.sqrt(xDenom * yDenom);
  }

  /**
   * Calculate p-value for correlation (approximate)
   */
  private correlationPValue(r: number, n: number): number {
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    // Simplified p-value approximation
    return 2 * (1 - this.studentTCDF(Math.abs(t), n - 2));
  }

  /**
   * Student's t-distribution CDF (approximate)
   */
  private studentTCDF(t: number, df: number): number {
    // Simplified approximation
    const x = df / (df + t * t);
    return 1 - 0.5 * Math.pow(x, df / 2);
  }

  // ==================== t-Test ====================

  /**
   * Independent samples t-test
   */
  private tTest(sample1: number[], sample2: number[]): number {
    const mean1 = this.mean(sample1);
    const mean2 = this.mean(sample2);
    const var1 = this.variance(sample1, mean1);
    const var2 = this.variance(sample2, mean2);
    const n1 = sample1.length;
    const n2 = sample2.length;

    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const t = (mean1 - mean2) / Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
    const df = n1 + n2 - 2;

    return 2 * (1 - this.studentTCDF(Math.abs(t), df));
  }

  // ==================== Time Series Alignment ====================

  /**
   * Align two time series by timestamp
   */
  private alignTimeSeries(
    data1: TimeSeriesPoint[],
    data2: TimeSeriesPoint[]
  ): { timestamp: Date; value1: number; value2: number }[] {
    const map1 = new Map(data1.map(d => [d.timestamp.getTime(), d.value]));
    const map2 = new Map(data2.map(d => [d.timestamp.getTime(), d.value]));

    const commonTimestamps = Array.from(map1.keys()).filter(t => map2.has(t));

    return commonTimestamps.map(t => ({
      timestamp: new Date(t),
      value1: map1.get(t)!,
      value2: map2.get(t)!,
    }));
  }

  // ==================== Seasonality ====================

  /**
   * Decompose time series into trend, seasonal, and residual
   */
  private decomposeTimeSeries(
    data: TimeSeriesPoint[],
    period: TimePeriod
  ): { trend: number[]; seasonal: number[]; residual: number[] } {
    const values = data.map(d => d.value);
    const periodLength = this.periodToPoints(period);

    // Calculate trend (moving average)
    const trend = this.calculateSMA(values, periodLength);

    // Calculate seasonal component
    const seasonal = values.map((v, i) => {
      if (isNaN(trend[i])) return 0;
      return v - trend[i];
    });

    // Calculate residual
    const residual = values.map((v, i) => {
      if (isNaN(trend[i])) return 0;
      return v - trend[i] - seasonal[i];
    });

    return { trend, seasonal, residual };
  }

  /**
   * Calculate autocorrelation at lag 1
   */
  private calculateAutocorrelation(values: number[]): number {
    const n = values.length;
    const mean = this.mean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - 1; i++) {
      numerator += (values[i] - mean) * (values[i + 1] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return numerator / denominator;
  }

  /**
   * Convert period to number of data points
   */
  private periodToPoints(period: TimePeriod): number {
    switch (period) {
      case TimePeriod.Hour:
        return 24;
      case TimePeriod.Day:
        return 7;
      case TimePeriod.Week:
        return 4;
      case TimePeriod.Month:
        return 12;
      case TimePeriod.Quarter:
        return 4;
      case TimePeriod.Year:
        return 5;
      default:
        return 7;
    }
  }

  // ==================== Peak/Trough Detection ====================

  /**
   * Find local peaks in time series
   */
  private findPeaks(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
    const peaks: TimeSeriesPoint[] = [];

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].value > data[i - 1].value && data[i].value > data[i + 1].value) {
        peaks.push(data[i]);
      }
    }

    return peaks;
  }

  /**
   * Find local troughs in time series
   */
  private findTroughs(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
    const troughs: TimeSeriesPoint[] = [];

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].value < data[i - 1].value && data[i].value < data[i + 1].value) {
        troughs.push(data[i]);
      }
    }

    return troughs;
  }

  // ==================== Cache Management ====================

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.config.cacheTTL,
    };
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create trend analyzer instance
 */
export function createTrendAnalyzer(config?: Partial<TrendAnalyzerConfig>): TrendAnalyzer {
  return new TrendAnalyzer(config);
}

/**
 * Generate mock time-series data for testing
 */
export function generateMockTimeSeries(
  count: number,
  startDate: Date,
  period: TimePeriod,
  trend: 'upward' | 'downward' | 'stable' = 'stable'
): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  const baseValue = 100;
  let currentValue = baseValue;

  const periodMs = {
    [TimePeriod.Hour]: 3600000,
    [TimePeriod.Day]: 86400000,
    [TimePeriod.Week]: 604800000,
    [TimePeriod.Month]: 2592000000,
    [TimePeriod.Quarter]: 7776000000,
    [TimePeriod.Year]: 31536000000,
  };

  const step = periodMs[period];
  const trendSlope = trend === 'upward' ? 0.5 : trend === 'downward' ? -0.5 : 0;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(startDate.getTime() + i * step);
    const noise = (Math.random() - 0.5) * 10; // ±5 noise
    currentValue = baseValue + i * trendSlope + noise;

    data.push({
      timestamp,
      value: currentValue,
      metadata: { index: i },
    });
  }

  return data;
}

/**
 * Export time-series data to CSV
 */
export function exportToCSV(data: TimeSeriesPoint[]): string {
  const header = 'timestamp,value\n';
  const rows = data.map(d => `${d.timestamp.toISOString()},${d.value}`).join('\n');
  return header + rows;
}
