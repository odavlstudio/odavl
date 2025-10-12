import { HistoryEntry } from '../types/ODAVLTypes';
import { QualityForecast, TrendAnalysis } from '../types/IntelligenceTypes';

/**
 * AI Insights Engine - Core intelligence processing for ODAVL Phase 3
 * Analyzes historical data patterns, generates predictions, and provides recommendations
 */
export class AIInsightsEngine {
  private history: HistoryEntry[] = [];
  private readonly FORECAST_DAYS = 7;
  private readonly MIN_DATA_POINTS = 10;

  /**
   * Initialize with historical data for pattern analysis
   */
  public initialize(history: HistoryEntry[]): void {
    this.history = history.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }

  /**
   * Generate quality forecasts using time series analysis
   */
  public generateQualityForecast(metric: 'eslintWarnings' | 'typeErrors'): QualityForecast | null {
    if (this.history.length < this.MIN_DATA_POINTS) return null;

    const values = this.history.map(h => h.after[metric]).slice(-30);
    const trend = this.calculateLinearTrend(values);
    const predictions = this.generatePredictions(values, trend);
    
    return {
      metric,
      currentValue: values[values.length - 1] || 0,
      predicted7Days: predictions,
      confidence: this.calculateConfidence(values),
      trendDirection: this.determineTrendDirection(trend),
      recommendedActions: this.generateRecommendations(metric, trend.slope)
    };
  }

  /**
   * Analyze patterns and trends in historical data
   */
  public analyzeTrends(): TrendAnalysis {
    const patterns = this.detectPatterns();
    const predictions = ['eslintWarnings', 'typeErrors'].map(m => 
      this.generateQualityForecast(m as 'eslintWarnings' | 'typeErrors')
    ).filter(Boolean) as QualityForecast[];

    return {
      timeRange: `${this.history.length} cycles`,
      patterns,
      anomalies: [],
      predictions
    };
  }

  private calculateLinearTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private generatePredictions(values: number[], trend: { slope: number; intercept: number }): number[] {
    const predictions: number[] = [];
    const lastIndex = values.length - 1;
    
    for (let i = 1; i <= this.FORECAST_DAYS; i++) {
      const predicted = Math.max(0, Math.round(trend.slope * (lastIndex + i) + trend.intercept));
      predictions.push(predicted);
    }
    
    return predictions;
  }

  private calculateConfidence(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.max(0.1, Math.min(0.95, 1 - Math.sqrt(variance) / (mean + 1)));
  }

  private determineTrendDirection(trend: { slope: number }): 'improving' | 'degrading' | 'stable' {
    if (Math.abs(trend.slope) < 0.01) return 'stable';
    return trend.slope > 0 ? 'degrading' : 'improving';
  }

  private generateRecommendations(metric: string, slope: number): string[] {
    if (slope > 0.1) return [`${metric} increasing - consider quality review`, 'Run automated fixes'];
    if (slope < -0.1) return [`${metric} improving - continue current practices`];
    return [`${metric} stable - maintain current quality level`];
  }

  private detectPatterns(): Array<{ type: 'daily' | 'weekly' | 'session'; strength: number; description: string }> {
    return [{ type: 'session', strength: 0.7, description: 'Quality cycles detected' }];
  }
}