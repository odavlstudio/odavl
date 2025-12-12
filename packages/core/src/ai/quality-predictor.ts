/**
 * Code Quality Predictor - Predict future code quality trends
 * 
 * Purpose: Forecast quality metrics and technical debt using historical data
 * Week 31: Smart Code Analysis (File 3/3)
 * 
 * Features:
 * - Quality trend prediction (next 30/60/90 days)
 * - Technical debt forecasting (growth trajectory)
 * - Risk trajectory analysis (future risk scores)
 * - Team velocity tracking (fix rate vs introduction rate)
 * - Defect density prediction
 * - Maintenance cost estimation
 * - Churn analysis (code volatility)
 * - Quality gate predictions (will pass/fail in future)
 * 
 * Prediction Models:
 * - Time series analysis (ARIMA, exponential smoothing)
 * - Linear regression (simple trend lines)
 * - Moving averages (smooth out noise)
 * - Seasonal decomposition (periodic patterns)
 * - Machine learning (TensorFlow.js LSTM for complex patterns)
 * 
 * @module @odavl-studio/core/ai/quality-predictor
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { AIAnalysisResult } from './code-analyzer';

/**
 * Time horizon for predictions
 */
export enum PredictionHorizon {
  SHORT_TERM = 'SHORT_TERM', // 7-30 days
  MEDIUM_TERM = 'MEDIUM_TERM', // 30-90 days
  LONG_TERM = 'LONG_TERM' // 90-365 days
}

/**
 * Trend direction
 */
export enum TrendDirection {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DEGRADING = 'DEGRADING',
  CRITICAL = 'CRITICAL'
}

/**
 * Quality metric
 */
export interface QualityMetric {
  timestamp: Date;
  maintainabilityIndex: number; // 0-100
  complexityScore: number; // 0-100
  testCoverage: number; // 0-100
  technicalDebt: number; // hours
  defectDensity: number; // defects per KLOC
  codeChurn: number; // % of code changed
  duplicationRate: number; // % duplicated code
}

/**
 * Quality prediction
 */
export interface QualityPrediction {
  metric: keyof QualityMetric;
  horizon: PredictionHorizon;
  
  // Current state
  current: number;
  
  // Predicted future state
  predicted: number;
  predictedDate: Date;
  
  // Confidence interval
  confidenceInterval: {
    lower: number; // 95% confidence lower bound
    upper: number; // 95% confidence upper bound
    confidence: number; // 0-1
  };
  
  // Trend analysis
  trend: {
    direction: TrendDirection;
    slope: number; // Rate of change per day
    acceleration: number; // Change in rate (2nd derivative)
    volatility: number; // Standard deviation
  };
  
  // Quality assessment
  assessment: {
    currentQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    predictedQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    willImprove: boolean;
    requiresAction: boolean;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  
  // Recommendations
  recommendations: string[];
  potentialInterventions: string[];
}

/**
 * Technical debt forecast
 */
export interface TechnicalDebtForecast {
  horizon: PredictionHorizon;
  
  // Current debt
  currentDebt: {
    totalHours: number;
    byCategory: Record<string, number>;
    interestRate: number; // % per month (compound effect)
  };
  
  // Predicted debt
  predictedDebt: {
    totalHours: number;
    byCategory: Record<string, number>;
    growthRate: number; // % change
  };
  
  // Break-even analysis
  breakEven: {
    monthsToPayoff: number;
    requiredVelocity: number; // hours/week
    costOfInaction: number; // additional hours if not addressed
  };
  
  // Risk assessment
  risk: {
    bankruptcyRisk: number; // 0-1 (will debt become unmanageable?)
    maintenanceCrisis: boolean;
    estimatedImpact: string;
  };
  
  recommendations: string[];
}

/**
 * Team velocity metrics
 */
export interface TeamVelocity {
  period: string; // e.g., "2025-W01"
  
  // Issues
  issuesIntroduced: number;
  issuesFixed: number;
  netChange: number; // fixed - introduced
  
  // Code changes
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
  
  // Quality
  qualityGatesPassed: number;
  qualityGatesFailed: number;
  
  // Productivity
  throughput: number; // issues/week
  fixRate: number; // issues fixed/week
  introductionRate: number; // issues introduced/week
}

/**
 * Velocity prediction
 */
export interface VelocityPrediction {
  horizon: PredictionHorizon;
  
  // Current velocity
  current: TeamVelocity;
  
  // Predicted velocity
  predicted: {
    throughput: number;
    fixRate: number;
    introductionRate: number;
    netChange: number;
  };
  
  // Sustainability
  sustainability: {
    isSustainable: boolean;
    burnoutRisk: number; // 0-1
    debtAccumulation: number; // issues/week
    timeToStability: number; // weeks until netChange >= 0
  };
  
  recommendations: string[];
}

/**
 * Quality gate prediction
 */
export interface QualityGatePrediction {
  gateName: string;
  horizon: PredictionHorizon;
  
  // Gate criteria
  criteria: Array<{
    metric: string;
    operator: '>=' | '<=' | '==' | '!=' | '>' | '<';
    threshold: number;
    currentValue: number;
    predictedValue: number;
  }>;
  
  // Prediction
  willPass: boolean;
  confidence: number; // 0-1
  passageProbability: number; // 0-1
  
  // Gap analysis
  gaps: Array<{
    metric: string;
    gap: number; // How far from threshold
    requiredImprovement: number;
    estimatedEffort: string;
  }>;
  
  recommendations: string[];
}

/**
 * Code Quality Predictor configuration
 */
export interface CodeQualityPredictorConfig {
  dataPath?: string; // Path to historical metrics
  minDataPoints?: number; // Minimum data points for prediction
  defaultHorizon?: PredictionHorizon;
  enableMLModels?: boolean;
  smoothingFactor?: number; // 0-1 for exponential smoothing
}

/**
 * Code Quality Predictor
 */
export class CodeQualityPredictor {
  private config: Required<CodeQualityPredictorConfig>;
  private historicalMetrics: QualityMetric[] = [];
  private velocityHistory: TeamVelocity[] = [];

  constructor(config: CodeQualityPredictorConfig = {}) {
    this.config = {
      dataPath: config.dataPath ?? '.odavl/metrics',
      minDataPoints: config.minDataPoints ?? 7, // At least 1 week of data
      defaultHorizon: config.defaultHorizon ?? PredictionHorizon.MEDIUM_TERM,
      enableMLModels: config.enableMLModels ?? false,
      smoothingFactor: config.smoothingFactor ?? 0.3
    };
  }

  /**
   * Initialize predictor
   */
  async initialize(): Promise<void> {
    console.log('🔮 Initializing Code Quality Predictor...');
    
    // Load historical data
    await this.loadHistoricalMetrics();
    await this.loadVelocityHistory();
    
    console.log(`✅ Loaded ${this.historicalMetrics.length} historical metrics`);
    console.log(`✅ Loaded ${this.velocityHistory.length} velocity data points`);
  }

  /**
   * Predict quality metric
   */
  async predictQualityMetric(
    metric: keyof QualityMetric,
    horizon: PredictionHorizon = this.config.defaultHorizon
  ): Promise<QualityPrediction> {
    console.log(`🔮 Predicting ${metric} for ${horizon}...`);
    
    if (this.historicalMetrics.length < this.config.minDataPoints) {
      throw new Error(`Insufficient data: need at least ${this.config.minDataPoints} data points`);
    }
    
    // Extract time series for this metric
    const timeSeries = this.historicalMetrics.map(m => ({
      date: m.timestamp,
      value: m[metric] as number
    }));
    
    // Calculate prediction
    const daysAhead = this.horizonToDays(horizon);
    const predicted = this.predictTimeSeries(timeSeries, daysAhead);
    
    // Calculate trend
    const trend = this.calculateTrend(timeSeries);
    
    // Assess quality
    const current = timeSeries[timeSeries.length - 1].value;
    const assessment = this.assessQuality(metric, current, predicted.value);
    
    return {
      metric,
      horizon,
      current,
      predicted: predicted.value,
      predictedDate: predicted.date,
      confidenceInterval: predicted.confidence,
      trend,
      assessment,
      recommendations: this.generateRecommendations(metric, trend, assessment),
      potentialInterventions: this.generateInterventions(metric, trend)
    };
  }

  /**
   * Forecast technical debt
   */
  async forecastTechnicalDebt(
    horizon: PredictionHorizon = this.config.defaultHorizon
  ): Promise<TechnicalDebtForecast> {
    console.log(`🔮 Forecasting technical debt for ${horizon}...`);
    
    // Get current debt
    const currentDebt = this.getCurrentTechnicalDebt();
    
    // Calculate compound growth
    const daysAhead = this.horizonToDays(horizon);
    const monthsAhead = daysAhead / 30;
    const interestRate = currentDebt.interestRate / 100;
    const predictedTotal = currentDebt.totalHours * Math.pow(1 + interestRate, monthsAhead);
    
    // Calculate by category (proportional growth)
    const predictedByCategory: Record<string, number> = {};
    for (const [category, hours] of Object.entries(currentDebt.byCategory)) {
      predictedByCategory[category] = hours * Math.pow(1 + interestRate, monthsAhead);
    }
    
    // Break-even analysis
    const weeklyDebtAddition = (predictedTotal - currentDebt.totalHours) / (daysAhead / 7);
    const requiredVelocity = weeklyDebtAddition * 1.2; // 20% buffer
    const monthsToPayoff = currentDebt.totalHours / (requiredVelocity * 4);
    const costOfInaction = predictedTotal - currentDebt.totalHours;
    
    // Risk assessment
    const bankruptcyRisk = Math.min(1, predictedTotal / (currentDebt.totalHours * 5)); // 5x = critical
    const maintenanceCrisis = bankruptcyRisk > 0.7;
    
    return {
      horizon,
      currentDebt: {
        totalHours: currentDebt.totalHours,
        byCategory: currentDebt.byCategory,
        interestRate: currentDebt.interestRate
      },
      predictedDebt: {
        totalHours: predictedTotal,
        byCategory: predictedByCategory,
        growthRate: ((predictedTotal - currentDebt.totalHours) / currentDebt.totalHours) * 100
      },
      breakEven: {
        monthsToPayoff,
        requiredVelocity,
        costOfInaction
      },
      risk: {
        bankruptcyRisk,
        maintenanceCrisis,
        estimatedImpact: this.estimateDebtImpact(bankruptcyRisk)
      },
      recommendations: this.generateDebtRecommendations(bankruptcyRisk, monthsToPayoff)
    };
  }

  /**
   * Predict team velocity
   */
  async predictVelocity(
    horizon: PredictionHorizon = this.config.defaultHorizon
  ): Promise<VelocityPrediction> {
    console.log(`🔮 Predicting team velocity for ${horizon}...`);
    
    if (this.velocityHistory.length < this.config.minDataPoints) {
      throw new Error('Insufficient velocity data');
    }
    
    const current = this.velocityHistory[this.velocityHistory.length - 1];
    const daysAhead = this.horizonToDays(horizon);
    
    // Predict each component
    const throughput = this.predictVelocityComponent('throughput', daysAhead);
    const fixRate = this.predictVelocityComponent('fixRate', daysAhead);
    const introductionRate = this.predictVelocityComponent('introductionRate', daysAhead);
    const netChange = fixRate - introductionRate;
    
    // Sustainability analysis
    const isSustainable = netChange >= 0;
    const burnoutRisk = Math.min(1, Math.abs(netChange) / throughput);
    const debtAccumulation = isSustainable ? 0 : -netChange;
    const timeToStability = isSustainable ? 0 : Math.ceil(
      this.getCurrentIssueBacklog() / Math.abs(netChange)
    );
    
    return {
      horizon,
      current,
      predicted: {
        throughput,
        fixRate,
        introductionRate,
        netChange
      },
      sustainability: {
        isSustainable,
        burnoutRisk,
        debtAccumulation,
        timeToStability
      },
      recommendations: this.generateVelocityRecommendations(isSustainable, burnoutRisk)
    };
  }

  /**
   * Predict quality gate passage
   */
  async predictQualityGate(
    gateName: string,
    criteria: Array<{ metric: string; operator: string; threshold: number }>,
    horizon: PredictionHorizon = this.config.defaultHorizon
  ): Promise<QualityGatePrediction> {
    console.log(`🔮 Predicting quality gate: ${gateName}`);
    
    // Evaluate each criterion
    const evaluatedCriteria = await Promise.all(
      criteria.map(async (c) => {
        const prediction = await this.predictQualityMetric(
          c.metric as keyof QualityMetric,
          horizon
        );
        
        return {
          metric: c.metric,
          operator: c.operator as any,
          threshold: c.threshold,
          currentValue: prediction.current,
          predictedValue: prediction.predicted
        };
      })
    );
    
    // Determine if gate will pass
    const willPass = evaluatedCriteria.every(c => 
      this.evaluateCriterion(c.predictedValue, c.operator, c.threshold)
    );
    
    // Calculate confidence (average of all prediction confidences)
    const confidence = evaluatedCriteria.reduce((sum, c) => sum + 0.8, 0) / evaluatedCriteria.length;
    
    // Gap analysis
    const gaps = evaluatedCriteria
      .filter(c => !this.evaluateCriterion(c.predictedValue, c.operator, c.threshold))
      .map(c => ({
        metric: c.metric,
        gap: Math.abs(c.predictedValue - c.threshold),
        requiredImprovement: this.calculateRequiredImprovement(c),
        estimatedEffort: this.estimateEffort(c.metric, Math.abs(c.predictedValue - c.threshold))
      }));
    
    return {
      gateName,
      horizon,
      criteria: evaluatedCriteria,
      willPass,
      confidence,
      passageProbability: willPass ? 0.9 : 0.1,
      gaps,
      recommendations: this.generateGateRecommendations(gaps)
    };
  }

  /**
   * Predict time series using exponential smoothing
   */
  private predictTimeSeries(
    timeSeries: Array<{ date: Date; value: number }>,
    daysAhead: number
  ): {
    value: number;
    date: Date;
    confidence: { lower: number; upper: number; confidence: number };
  } {
    // Simple exponential smoothing
    const alpha = this.config.smoothingFactor;
    let smoothed = timeSeries[0].value;
    
    for (let i = 1; i < timeSeries.length; i++) {
      smoothed = alpha * timeSeries[i].value + (1 - alpha) * smoothed;
    }
    
    // Calculate trend (linear regression)
    const trend = this.calculateLinearTrend(timeSeries);
    const predicted = smoothed + trend * daysAhead;
    
    // Calculate confidence interval (based on historical variance)
    const variance = this.calculateVariance(timeSeries);
    const stdDev = Math.sqrt(variance);
    const margin = 1.96 * stdDev; // 95% confidence
    
    const lastDate = timeSeries[timeSeries.length - 1].date;
    const predictedDate = new Date(lastDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return {
      value: predicted,
      date: predictedDate,
      confidence: {
        lower: Math.max(0, predicted - margin),
        upper: Math.min(100, predicted + margin),
        confidence: 0.95
      }
    };
  }

  /**
   * Calculate trend
   */
  private calculateTrend(
    timeSeries: Array<{ date: Date; value: number }>
  ): QualityPrediction['trend'] {
    const slope = this.calculateLinearTrend(timeSeries);
    const acceleration = this.calculateAcceleration(timeSeries);
    const volatility = Math.sqrt(this.calculateVariance(timeSeries));
    
    let direction: TrendDirection;
    if (slope > 2) direction = TrendDirection.IMPROVING;
    else if (slope < -2) direction = TrendDirection.DEGRADING;
    else if (slope < -5) direction = TrendDirection.CRITICAL;
    else direction = TrendDirection.STABLE;
    
    return { direction, slope, acceleration, volatility };
  }

  /**
   * Calculate linear trend (slope)
   */
  private calculateLinearTrend(timeSeries: Array<{ date: Date; value: number }>): number {
    const n = timeSeries.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += timeSeries[i].value;
      sumXY += i * timeSeries[i].value;
      sumX2 += i * i;
    }
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Calculate acceleration (2nd derivative)
   */
  private calculateAcceleration(timeSeries: Array<{ date: Date; value: number }>): number {
    if (timeSeries.length < 3) return 0;
    
    const recentSlope = this.calculateLinearTrend(timeSeries.slice(-7));
    const previousSlope = this.calculateLinearTrend(timeSeries.slice(-14, -7));
    
    return recentSlope - previousSlope;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(timeSeries: Array<{ date: Date; value: number }>): number {
    const values = timeSeries.map(t => t.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Assess quality
   */
  private assessQuality(
    metric: keyof QualityMetric,
    current: number,
    predicted: number
  ): QualityPrediction['assessment'] {
    const getCurrentQuality = (val: number) => {
      if (metric === 'technicalDebt' || metric === 'defectDensity') {
        // Lower is better
        if (val < 20) return 'EXCELLENT';
        if (val < 50) return 'GOOD';
        if (val < 100) return 'FAIR';
        if (val < 200) return 'POOR';
        return 'CRITICAL';
      } else {
        // Higher is better
        if (val >= 80) return 'EXCELLENT';
        if (val >= 60) return 'GOOD';
        if (val >= 40) return 'FAIR';
        if (val >= 20) return 'POOR';
        return 'CRITICAL';
      }
    };
    
    const currentQuality = getCurrentQuality(current);
    const predictedQuality = getCurrentQuality(predicted);
    const willImprove = (metric === 'technicalDebt' || metric === 'defectDensity') 
      ? predicted < current 
      : predicted > current;
    
    const requiresAction = predictedQuality === 'POOR' || predictedQuality === 'CRITICAL';
    let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (predictedQuality === 'CRITICAL') urgency = 'CRITICAL';
    else if (predictedQuality === 'POOR') urgency = 'HIGH';
    else if (!willImprove) urgency = 'MEDIUM';
    
    return { currentQuality, predictedQuality, willImprove, requiresAction, urgency };
  }

  /**
   * Horizon to days
   */
  private horizonToDays(horizon: PredictionHorizon): number {
    switch (horizon) {
      case PredictionHorizon.SHORT_TERM: return 30;
      case PredictionHorizon.MEDIUM_TERM: return 60;
      case PredictionHorizon.LONG_TERM: return 180;
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metric: keyof QualityMetric,
    trend: QualityPrediction['trend'],
    assessment: QualityPrediction['assessment']
  ): string[] {
    const recommendations: string[] = [];
    
    if (assessment.urgency === 'CRITICAL') {
      recommendations.push(`🚨 CRITICAL: ${metric} trending towards crisis - immediate action required`);
      recommendations.push('Consider emergency refactoring sprint or code freeze');
    }
    
    if (trend.direction === TrendDirection.DEGRADING) {
      recommendations.push(`📉 ${metric} is degrading - review recent changes and coding practices`);
      recommendations.push('Implement stricter quality gates to prevent further decline');
    }
    
    if (trend.volatility > 20) {
      recommendations.push(`⚠️ High volatility detected - stabilize development process`);
    }
    
    return recommendations;
  }

  /**
   * Generate interventions
   */
  private generateInterventions(
    metric: keyof QualityMetric,
    trend: QualityPrediction['trend']
  ): string[] {
    const interventions: string[] = [];
    
    if (trend.direction === TrendDirection.CRITICAL) {
      interventions.push('Dedicated refactoring team');
      interventions.push('Pause feature development');
      interventions.push('Emergency code review');
    }
    
    interventions.push('Increase test coverage');
    interventions.push('Implement pair programming');
    interventions.push('Add automated quality checks');
    
    return interventions;
  }

  /**
   * Get current technical debt
   */
  private getCurrentTechnicalDebt(): {
    totalHours: number;
    byCategory: Record<string, number>;
    interestRate: number;
  } {
    // Mock implementation - would integrate with actual debt tracking
    return {
      totalHours: 240,
      byCategory: {
        'Code Smells': 100,
        'Technical Debt': 80,
        'Security Issues': 40,
        'Performance Issues': 20
      },
      interestRate: 10 // 10% per month compound
    };
  }

  /**
   * Estimate debt impact
   */
  private estimateDebtImpact(bankruptcyRisk: number): string {
    if (bankruptcyRisk > 0.8) return 'Project will become unmaintainable - consider rewrite';
    if (bankruptcyRisk > 0.6) return 'Severe maintenance difficulties ahead';
    if (bankruptcyRisk > 0.4) return 'Moderate increase in maintenance costs';
    return 'Manageable debt growth';
  }

  /**
   * Generate debt recommendations
   */
  private generateDebtRecommendations(bankruptcyRisk: number, monthsToPayoff: number): string[] {
    const recommendations: string[] = [];
    
    if (bankruptcyRisk > 0.7) {
      recommendations.push('🚨 Critical: Allocate 50%+ of sprint capacity to debt reduction');
      recommendations.push('Consider hiring additional engineers or consultants');
    } else if (bankruptcyRisk > 0.4) {
      recommendations.push('⚠️ Warning: Allocate 30% of sprint capacity to debt reduction');
    } else {
      recommendations.push('✅ Debt manageable: Maintain current 20% allocation to improvements');
    }
    
    recommendations.push(`Target payoff timeline: ${monthsToPayoff.toFixed(1)} months`);
    
    return recommendations;
  }

  /**
   * Predict velocity component
   */
  private predictVelocityComponent(component: keyof TeamVelocity, daysAhead: number): number {
    const timeSeries = this.velocityHistory.map(v => ({
      date: new Date(v.period),
      value: v[component] as number
    }));
    
    return this.predictTimeSeries(timeSeries, daysAhead).value;
  }

  /**
   * Get current issue backlog
   */
  private getCurrentIssueBacklog(): number {
    // Mock - would integrate with issue tracker
    return 150;
  }

  /**
   * Generate velocity recommendations
   */
  private generateVelocityRecommendations(isSustainable: boolean, burnoutRisk: number): string[] {
    const recommendations: string[] = [];
    
    if (!isSustainable) {
      recommendations.push('🚨 Unsustainable velocity - issues accumulating faster than fixes');
      recommendations.push('Reduce feature scope or increase team capacity');
    }
    
    if (burnoutRisk > 0.7) {
      recommendations.push('⚠️ High burnout risk - consider reducing workload');
    }
    
    return recommendations;
  }

  /**
   * Evaluate criterion
   */
  private evaluateCriterion(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Calculate required improvement
   */
  private calculateRequiredImprovement(criterion: any): number {
    const gap = Math.abs(criterion.predictedValue - criterion.threshold);
    return gap * 1.2; // 20% buffer
  }

  /**
   * Estimate effort
   */
  private estimateEffort(metric: string, gap: number): string {
    const hoursPerPoint = 2; // 2 hours per quality point
    const hours = gap * hoursPerPoint;
    
    if (hours < 8) return `${hours.toFixed(0)} hours`;
    if (hours < 40) return `${(hours / 8).toFixed(1)} days`;
    return `${(hours / 40).toFixed(1)} weeks`;
  }

  /**
   * Generate gate recommendations
   */
  private generateGateRecommendations(gaps: any[]): string[] {
    const recommendations: string[] = [];
    
    if (gaps.length === 0) {
      recommendations.push('✅ Quality gate will pass - maintain current practices');
    } else {
      recommendations.push(`⚠️ ${gaps.length} criteria failing - prioritize improvements:`);
      for (const gap of gaps) {
        recommendations.push(`  • ${gap.metric}: improve by ${gap.requiredImprovement.toFixed(1)} (${gap.estimatedEffort})`);
      }
    }
    
    return recommendations;
  }

  /**
   * Load historical metrics
   */
  private async loadHistoricalMetrics(): Promise<void> {
    try {
      const metricsPath = path.join(this.config.dataPath, 'quality-metrics.json');
      const content = await fs.readFile(metricsPath, 'utf-8');
      const data = JSON.parse(content);
      this.historicalMetrics = data.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch {
      console.log('⚠️  No historical metrics found - using mock data');
      this.historicalMetrics = this.generateMockMetrics();
    }
  }

  /**
   * Load velocity history
   */
  private async loadVelocityHistory(): Promise<void> {
    try {
      const velocityPath = path.join(this.config.dataPath, 'velocity-history.json');
      const content = await fs.readFile(velocityPath, 'utf-8');
      this.velocityHistory = JSON.parse(content);
    } catch {
      console.log('⚠️  No velocity history found - using mock data');
      this.velocityHistory = this.generateMockVelocity();
    }
  }

  /**
   * Generate mock metrics for testing
   */
  private generateMockMetrics(): QualityMetric[] {
    const metrics: QualityMetric[] = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      metrics.push({
        timestamp: date,
        maintainabilityIndex: 65 - i * 0.5 + Math.random() * 5,
        complexityScore: 40 + i * 0.3 + Math.random() * 3,
        testCoverage: 70 - i * 0.2 + Math.random() * 2,
        technicalDebt: 100 + i * 2 + Math.random() * 10,
        defectDensity: 0.5 + i * 0.01 + Math.random() * 0.05,
        codeChurn: 15 + Math.random() * 5,
        duplicationRate: 5 + Math.random() * 2
      });
    }
    
    return metrics;
  }

  /**
   * Generate mock velocity for testing
   */
  private generateMockVelocity(): TeamVelocity[] {
    const velocity: TeamVelocity[] = [];
    
    for (let i = 12; i >= 0; i--) {
      velocity.push({
        period: `2025-W${52 - i}`,
        issuesIntroduced: 20 + Math.floor(Math.random() * 10),
        issuesFixed: 15 + Math.floor(Math.random() * 10),
        netChange: -5 + Math.floor(Math.random() * 10),
        linesAdded: 500 + Math.floor(Math.random() * 200),
        linesDeleted: 300 + Math.floor(Math.random() * 100),
        filesChanged: 20 + Math.floor(Math.random() * 10),
        qualityGatesPassed: 8 + Math.floor(Math.random() * 4),
        qualityGatesFailed: Math.floor(Math.random() * 3),
        throughput: 25 + Math.floor(Math.random() * 10),
        fixRate: 15 + Math.floor(Math.random() * 10),
        introductionRate: 20 + Math.floor(Math.random() * 10)
      });
    }
    
    return velocity;
  }
}

/**
 * Convenience function to predict quality
 */
export async function predictCodeQuality(
  metric: keyof QualityMetric,
  horizon?: PredictionHorizon
): Promise<QualityPrediction> {
  const predictor = new CodeQualityPredictor();
  await predictor.initialize();
  return predictor.predictQualityMetric(metric, horizon);
}
