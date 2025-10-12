/**
 * Advanced Intelligence Types for ODAVL Phase 3
 * Defines interfaces for AI insights, predictive analytics, and smart notifications
 */

// Quality Forecasting and Trend Analysis
export interface QualityForecast {
  metric: 'eslintWarnings' | 'typeErrors';
  currentValue: number;
  predicted7Days: number[];
  confidence: number;
  trendDirection: 'improving' | 'degrading' | 'stable';
  recommendedActions: string[];
}

export interface TrendAnalysis {
  timeRange: string;
  patterns: Array<{
    type: 'daily' | 'weekly' | 'session';
    strength: number;
    description: string;
  }>;
  anomalies: QualityAnomaly[];
  predictions: QualityForecast[];
}

// Recipe Recommendation and Effectiveness
export interface RecipeRecommendation {
  recipeId: string;
  successProbability: number;
  expectedImpact: { eslint: number; types: number };
  confidence: number;
  reasoning: string[];
  alternativeOptions: RecipeRecommendation[];
}

// Anomaly Detection and Quality Monitoring
export interface QualityAnomaly {
  type: 'degradation' | 'improvement' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high';
  metrics: string[];
  detectedAt: string;
  likelihood: number;
  suggestedActions: string[];
}

// Performance Analytics and System Monitoring
export interface PerformanceInsight {
  category: 'memory' | 'cpu' | 'io' | 'timing';
  current: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  prediction: number;
  optimization: string[];
}

// Smart Notifications and Alert System
export interface SmartAlert {
  id: string;
  type: 'quality_degradation' | 'optimization' | 'achievement';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  actions: Array<{ label: string; command: string }>;
  metadata: Record<string, string | number | boolean>;
}