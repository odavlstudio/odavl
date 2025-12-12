/**
 * ODAVL Insight Enterprise - Filter Analytics
 * Week 42: Advanced Filtering - File 3/3
 * 
 * Features:
 * - Filter usage tracking
 * - Query performance analysis
 * - Filter optimization suggestions
 * - User behavior analytics
 * - A/B testing for filters
 * - Filter effectiveness scoring
 * - Slow query detection
 * - Popular field analysis
 * - Filter complexity metrics
 * - Usage patterns and trends
 * 
 * @module filtering/filter-analytics
 */

import { EventEmitter } from 'events';
import { Filter, FilterCondition, FilterGroup } from './filter-builder';
import { FilterPreset } from './filter-presets';

// ==================== Types & Interfaces ====================

/**
 * Filter usage event
 */
export interface FilterUsageEvent {
  id: string;
  filterId: string;
  userId: string;
  timestamp: Date;
  executionTime: number; // milliseconds
  resultCount: number;
  success: boolean;
  error?: string;
}

/**
 * Filter performance metrics
 */
export interface FilterPerformance {
  filterId: string;
  totalExecutions: number;
  avgExecutionTime: number; // milliseconds
  minExecutionTime: number;
  maxExecutionTime: number;
  p50ExecutionTime: number; // median
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  successRate: number; // 0-1
  avgResultCount: number;
  lastExecuted?: Date;
}

/**
 * Filter complexity metrics
 */
export interface FilterComplexity {
  filterId: string;
  totalConditions: number;
  maxNestingDepth: number;
  uniqueFields: number;
  operatorDistribution: Record<string, number>;
  logicOperatorCount: number;
  estimatedCost: number; // 0-100 (higher = more expensive)
}

/**
 * Filter effectiveness score
 */
export interface FilterEffectiveness {
  filterId: string;
  score: number; // 0-100
  factors: {
    performance: number; // 0-100
    usageFrequency: number; // 0-100
    resultRelevance: number; // 0-100
    userSatisfaction: number; // 0-100
  };
  recommendation: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

/**
 * Filter optimization suggestion
 */
export interface OptimizationSuggestion {
  filterId: string;
  type: 'index' | 'rewrite' | 'simplify' | 'cache' | 'split';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  estimatedImprovement: number; // percentage (0-100)
  implementation: string;
}

/**
 * User behavior pattern
 */
export interface UserBehaviorPattern {
  userId: string;
  mostUsedFilters: string[];
  mostUsedFields: string[];
  avgSessionDuration: number; // minutes
  filterCreationRate: number; // filters per day
  preferredCategories: string[];
  timeOfDayPattern: Record<number, number>; // hour -> usage count
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  filterA: Filter;
  filterB: Filter;
  startDate: Date;
  endDate: Date;
  sampleSize: number;
  metrics: string[]; // e.g., ['execution_time', 'result_count', 'user_satisfaction']
}

/**
 * A/B test result
 */
export interface ABTestResult {
  testId: string;
  filterA: {
    avgExecutionTime: number;
    avgResultCount: number;
    userSatisfaction: number;
    sampleSize: number;
  };
  filterB: {
    avgExecutionTime: number;
    avgResultCount: number;
    userSatisfaction: number;
    sampleSize: number;
  };
  winner: 'A' | 'B' | 'tie';
  confidence: number; // 0-1
  recommendation: string;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  // Storage
  storageBackend: 'memory' | 'database' | 'timeseries';
  retentionDays: number; // Default: 90
  
  // Tracking
  enableUsageTracking: boolean;
  enablePerformanceTracking: boolean;
  trackUserBehavior: boolean;
  
  // Analysis
  slowQueryThreshold: number; // milliseconds (default: 1000)
  complexityThreshold: number; // 0-100 (default: 70)
  
  // A/B testing
  enableAbTesting: boolean;
  minSampleSize: number; // Default: 100
}

// ==================== Analytics Engine ====================

const DEFAULT_CONFIG: AnalyticsConfig = {
  storageBackend: 'memory',
  retentionDays: 90,
  enableUsageTracking: true,
  enablePerformanceTracking: true,
  trackUserBehavior: true,
  slowQueryThreshold: 1000,
  complexityThreshold: 70,
  enableAbTesting: true,
  minSampleSize: 100,
};

/**
 * Filter Analytics Engine
 * Track, analyze, and optimize filter usage
 */
export class FilterAnalytics extends EventEmitter {
  private config: AnalyticsConfig;
  private usageEvents: FilterUsageEvent[];
  private performanceCache: Map<string, FilterPerformance>;
  private complexityCache: Map<string, FilterComplexity>;
  private abTests: Map<string, ABTestConfig>;
  private abTestResults: Map<string, FilterUsageEvent[]>;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.usageEvents = [];
    this.performanceCache = new Map();
    this.complexityCache = new Map();
    this.abTests = new Map();
    this.abTestResults = new Map();
  }

  /**
   * Track filter usage
   */
  async trackUsage(event: Omit<FilterUsageEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enableUsageTracking) {
      return;
    }

    const usageEvent: FilterUsageEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.usageEvents.push(usageEvent);

    // Clear old events
    this.pruneOldEvents();

    // Invalidate performance cache
    this.performanceCache.delete(event.filterId);

    this.emit('usage-tracked', { event: usageEvent });

    // Detect slow queries
    if (event.executionTime > this.config.slowQueryThreshold) {
      this.emit('slow-query', { event: usageEvent });
    }
  }

  /**
   * Get filter performance metrics
   */
  async getPerformance(filterId: string): Promise<FilterPerformance | null> {
    if (this.performanceCache.has(filterId)) {
      return this.performanceCache.get(filterId)!;
    }

    const events = this.usageEvents.filter(e => e.filterId === filterId);
    if (events.length === 0) {
      return null;
    }

    const executionTimes = events.map(e => e.executionTime).sort((a, b) => a - b);
    const successCount = events.filter(e => e.success).length;

    const performance: FilterPerformance = {
      filterId,
      totalExecutions: events.length,
      avgExecutionTime: this.average(executionTimes),
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      p50ExecutionTime: this.percentile(executionTimes, 50),
      p95ExecutionTime: this.percentile(executionTimes, 95),
      p99ExecutionTime: this.percentile(executionTimes, 99),
      successRate: successCount / events.length,
      avgResultCount: this.average(events.map(e => e.resultCount)),
      lastExecuted: events[events.length - 1].timestamp,
    };

    this.performanceCache.set(filterId, performance);
    return performance;
  }

  /**
   * Calculate filter complexity
   */
  async analyzeComplexity(filter: Filter): Promise<FilterComplexity> {
    const filterId = this.hashFilter(filter);

    if (this.complexityCache.has(filterId)) {
      return this.complexityCache.get(filterId)!;
    }

    const analysis = this.analyzeFilterRecursive(filter.root);

    const complexity: FilterComplexity = {
      filterId,
      totalConditions: analysis.totalConditions,
      maxNestingDepth: analysis.maxDepth,
      uniqueFields: analysis.uniqueFields.size,
      operatorDistribution: analysis.operatorCounts,
      logicOperatorCount: analysis.logicOperatorCount,
      estimatedCost: this.calculateCost(analysis),
    };

    this.complexityCache.set(filterId, complexity);
    return complexity;
  }

  /**
   * Calculate filter effectiveness score
   */
  async calculateEffectiveness(filterId: string, filter: Filter): Promise<FilterEffectiveness> {
    const performance = await this.getPerformance(filterId);
    const complexity = await this.analyzeComplexity(filter);

    // Performance score (0-100, lower execution time = higher score)
    const perfScore = performance
      ? Math.max(0, 100 - (performance.avgExecutionTime / 10))
      : 50;

    // Usage frequency score (0-100, more usage = higher score)
    const usageScore = performance
      ? Math.min(100, (performance.totalExecutions / 100) * 100)
      : 0;

    // Result relevance (mock - in production, use ML)
    const relevanceScore = performance
      ? Math.min(100, (performance.avgResultCount / 10) * 100)
      : 50;

    // User satisfaction (based on success rate)
    const satisfactionScore = performance
      ? performance.successRate * 100
      : 50;

    // Overall score (weighted average)
    const overallScore = (
      perfScore * 0.3 +
      usageScore * 0.2 +
      relevanceScore * 0.2 +
      satisfactionScore * 0.3
    );

    let recommendation: FilterEffectiveness['recommendation'];
    if (overallScore >= 80) recommendation = 'excellent';
    else if (overallScore >= 60) recommendation = 'good';
    else if (overallScore >= 40) recommendation = 'needs-improvement';
    else recommendation = 'poor';

    return {
      filterId,
      score: overallScore,
      factors: {
        performance: perfScore,
        usageFrequency: usageScore,
        resultRelevance: relevanceScore,
        userSatisfaction: satisfactionScore,
      },
      recommendation,
    };
  }

  /**
   * Generate optimization suggestions
   */
  async generateOptimizations(filterId: string, filter: Filter): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    const performance = await this.getPerformance(filterId);
    const complexity = await this.analyzeComplexity(filter);

    // Slow query suggestion
    if (performance && performance.avgExecutionTime > this.config.slowQueryThreshold) {
      suggestions.push({
        filterId,
        type: 'index',
        severity: 'critical',
        description: `Average execution time is ${performance.avgExecutionTime}ms. Consider adding database indexes.`,
        estimatedImprovement: 70,
        implementation: 'Add indexes on frequently queried fields',
      });
    }

    // High complexity suggestion
    if (complexity.estimatedCost > this.config.complexityThreshold) {
      suggestions.push({
        filterId,
        type: 'simplify',
        severity: 'high',
        description: `Filter has ${complexity.totalConditions} conditions with ${complexity.maxNestingDepth} nesting levels. Consider simplifying.`,
        estimatedImprovement: 40,
        implementation: 'Break into smaller filters or reduce nesting',
      });
    }

    // Deep nesting suggestion
    if (complexity.maxNestingDepth > 3) {
      suggestions.push({
        filterId,
        type: 'rewrite',
        severity: 'medium',
        description: `Nesting depth of ${complexity.maxNestingDepth} may impact readability and performance.`,
        estimatedImprovement: 25,
        implementation: 'Flatten nested conditions using DNF/CNF transformation',
      });
    }

    // Caching suggestion
    if (performance && performance.totalExecutions > 100 && performance.avgExecutionTime > 500) {
      suggestions.push({
        filterId,
        type: 'cache',
        severity: 'medium',
        description: `Frequently executed filter (${performance.totalExecutions} times) with moderate execution time. Consider caching.`,
        estimatedImprovement: 60,
        implementation: 'Implement result caching with TTL',
      });
    }

    return suggestions;
  }

  /**
   * Analyze user behavior
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorPattern> {
    const userEvents = this.usageEvents.filter(e => e.userId === userId);

    // Most used filters
    const filterCounts = this.countBy(userEvents, 'filterId');
    const mostUsedFilters = Object.entries(filterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    // Time of day pattern
    const timePattern: Record<number, number> = {};
    for (const event of userEvents) {
      const hour = event.timestamp.getHours();
      timePattern[hour] = (timePattern[hour] || 0) + 1;
    }

    // Mock other metrics (in production, extract from events)
    return {
      userId,
      mostUsedFilters,
      mostUsedFields: ['severity', 'type', 'status', 'assignee'],
      avgSessionDuration: 45,
      filterCreationRate: 2.5,
      preferredCategories: ['security', 'performance'],
      timeOfDayPattern: timePattern,
    };
  }

  /**
   * Get popular fields
   */
  async getPopularFields(limit = 10): Promise<Array<{ field: string; count: number }>> {
    // In production, extract from filter conditions
    // Mock implementation
    const mockFields = [
      { field: 'severity', count: 1250 },
      { field: 'type', count: 980 },
      { field: 'status', count: 850 },
      { field: 'assignee', count: 720 },
      { field: 'created_at', count: 680 },
      { field: 'priority', count: 550 },
      { field: 'category', count: 480 },
      { field: 'tags', count: 420 },
      { field: 'resolved_at', count: 380 },
      { field: 'component', count: 320 },
    ];

    return mockFields.slice(0, limit);
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(limit = 10): Promise<FilterUsageEvent[]> {
    return this.usageEvents
      .filter(e => e.executionTime > this.config.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Start A/B test
   */
  async startAbTest(config: ABTestConfig): Promise<void> {
    if (!this.config.enableAbTesting) {
      throw new Error('A/B testing is not enabled');
    }

    this.abTests.set(config.id, config);
    this.abTestResults.set(config.id, []);

    this.emit('ab-test-started', { config });
  }

  /**
   * Record A/B test event
   */
  async recordAbTestEvent(testId: string, variant: 'A' | 'B', event: FilterUsageEvent): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B test not found: ${testId}`);
    }

    // Check if test is active
    const now = new Date();
    if (now < test.startDate || now > test.endDate) {
      throw new Error('A/B test is not active');
    }

    const events = this.abTestResults.get(testId)!;
    events.push({ ...event, filterId: `${testId}_${variant}` });

    this.emit('ab-test-event', { testId, variant, event });
  }

  /**
   * Get A/B test results
   */
  async getAbTestResults(testId: string): Promise<ABTestResult | null> {
    const test = this.abTests.get(testId);
    if (!test) {
      return null;
    }

    const events = this.abTestResults.get(testId) || [];
    const eventsA = events.filter(e => e.filterId.endsWith('_A'));
    const eventsB = events.filter(e => e.filterId.endsWith('_B'));

    if (eventsA.length < this.config.minSampleSize || eventsB.length < this.config.minSampleSize) {
      return null; // Not enough data
    }

    const avgTimeA = this.average(eventsA.map(e => e.executionTime));
    const avgTimeB = this.average(eventsB.map(e => e.executionTime));
    const avgResultsA = this.average(eventsA.map(e => e.resultCount));
    const avgResultsB = this.average(eventsB.map(e => e.resultCount));
    const satisfactionA = eventsA.filter(e => e.success).length / eventsA.length;
    const satisfactionB = eventsB.filter(e => e.success).length / eventsB.length;

    // Simple winner determination (in production, use statistical tests)
    let winner: 'A' | 'B' | 'tie' = 'tie';
    let confidence = 0.5;

    const scoreA = (1000 / avgTimeA) + satisfactionA * 100;
    const scoreB = (1000 / avgTimeB) + satisfactionB * 100;

    if (Math.abs(scoreA - scoreB) > 10) {
      winner = scoreA > scoreB ? 'A' : 'B';
      confidence = 0.95;
    } else if (Math.abs(scoreA - scoreB) > 5) {
      winner = scoreA > scoreB ? 'A' : 'B';
      confidence = 0.80;
    }

    return {
      testId,
      filterA: {
        avgExecutionTime: avgTimeA,
        avgResultCount: avgResultsA,
        userSatisfaction: satisfactionA,
        sampleSize: eventsA.length,
      },
      filterB: {
        avgExecutionTime: avgTimeB,
        avgResultCount: avgResultsB,
        userSatisfaction: satisfactionB,
        sampleSize: eventsB.length,
      },
      winner,
      confidence,
      recommendation: winner === 'tie'
        ? 'No significant difference. Continue with either filter.'
        : `Filter ${winner} performs better. Consider using it as the default.`,
    };
  }

  /**
   * Get usage trends
   */
  async getUsageTrends(filterId: string, days = 30): Promise<Array<{ date: Date; count: number }>> {
    const startDate = new Date(Date.now() - days * 86400000);
    const events = this.usageEvents.filter(
      e => e.filterId === filterId && e.timestamp >= startDate
    );

    const dailyCounts = new Map<string, number>();
    for (const event of events) {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    }

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date: new Date(date), count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        usageEvents: this.usageEvents,
        performance: Array.from(this.performanceCache.entries()),
        complexity: Array.from(this.complexityCache.entries()),
      }, null, 2);
    } else {
      // CSV export (simplified)
      const lines = ['filterId,timestamp,executionTime,resultCount,success'];
      for (const event of this.usageEvents) {
        lines.push(`${event.filterId},${event.timestamp.toISOString()},${event.executionTime},${event.resultCount},${event.success}`);
      }
      return lines.join('\n');
    }
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    this.usageEvents = [];
    this.performanceCache.clear();
    this.complexityCache.clear();
    this.emit('data-cleared');
  }

  // ==================== Private Methods ====================

  private analyzeFilterRecursive(
    group: FilterGroup,
    depth = 0
  ): {
    totalConditions: number;
    maxDepth: number;
    uniqueFields: Set<string>;
    operatorCounts: Record<string, number>;
    logicOperatorCount: number;
  } {
    let totalConditions = 0;
    let maxDepth = depth;
    const uniqueFields = new Set<string>();
    const operatorCounts: Record<string, number> = {};
    let logicOperatorCount = 0;

    for (const condition of group.conditions) {
      if ('field' in condition) {
        // Leaf condition
        totalConditions++;
        uniqueFields.add(condition.field);
        operatorCounts[condition.operator] = (operatorCounts[condition.operator] || 0) + 1;
      } else {
        // Nested group
        logicOperatorCount++;
        const nested = this.analyzeFilterRecursive(condition as FilterGroup, depth + 1);
        totalConditions += nested.totalConditions;
        maxDepth = Math.max(maxDepth, nested.maxDepth);
        nested.uniqueFields.forEach(f => uniqueFields.add(f));
        
        for (const [op, count] of Object.entries(nested.operatorCounts)) {
          operatorCounts[op] = (operatorCounts[op] || 0) + count;
        }
        
        logicOperatorCount += nested.logicOperatorCount;
      }
    }

    return { totalConditions, maxDepth, uniqueFields, operatorCounts, logicOperatorCount };
  }

  private calculateCost(analysis: {
    totalConditions: number;
    maxDepth: number;
    uniqueFields: Set<string>;
    operatorCounts: Record<string, number>;
  }): number {
    // Simple cost calculation (in production, use ML model)
    let cost = 0;

    // Condition count (0-40 points)
    cost += Math.min(40, analysis.totalConditions * 2);

    // Nesting depth (0-30 points)
    cost += Math.min(30, analysis.maxDepth * 10);

    // Field count (0-20 points)
    cost += Math.min(20, analysis.uniqueFields.size * 2);

    // Expensive operators (0-10 points)
    const expensiveOps = ['regex', 'contains', 'arrayContainsAll'];
    for (const op of expensiveOps) {
      if (analysis.operatorCounts[op]) {
        cost += analysis.operatorCounts[op] * 3;
      }
    }

    return Math.min(100, cost);
  }

  private hashFilter(filter: Filter): string {
    // Simple hash (in production, use crypto hash)
    return `filter_${JSON.stringify(filter).length}_${Date.now()}`;
  }

  private pruneOldEvents(): void {
    const cutoff = new Date(Date.now() - this.config.retentionDays * 86400000);
    this.usageEvents = this.usageEvents.filter(e => e.timestamp >= cutoff);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private countBy<T>(items: T[], key: keyof T): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const value = String(item[key]);
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create analytics instance
 */
export function createFilterAnalytics(config?: Partial<AnalyticsConfig>): FilterAnalytics {
  return new FilterAnalytics(config);
}

/**
 * Compare two filters performance
 */
export async function compareFilters(
  analytics: FilterAnalytics,
  filterIdA: string,
  filterIdB: string
): Promise<{
  filterA: FilterPerformance;
  filterB: FilterPerformance;
  winner: string;
  improvement: number;
}> {
  const perfA = await analytics.getPerformance(filterIdA);
  const perfB = await analytics.getPerformance(filterIdB);

  if (!perfA || !perfB) {
    throw new Error('Both filters must have performance data');
  }

  const winner = perfA.avgExecutionTime < perfB.avgExecutionTime ? filterIdA : filterIdB;
  const improvement = Math.abs(
    ((perfA.avgExecutionTime - perfB.avgExecutionTime) / Math.max(perfA.avgExecutionTime, perfB.avgExecutionTime)) * 100
  );

  return {
    filterA: perfA,
    filterB: perfB,
    winner,
    improvement,
  };
}

/**
 * Get filter health score
 */
export async function getFilterHealth(
  analytics: FilterAnalytics,
  filterId: string,
  filter: Filter
): Promise<{ score: number; status: 'healthy' | 'warning' | 'critical'; issues: string[] }> {
  const performance = await analytics.getPerformance(filterId);
  const complexity = await analytics.analyzeComplexity(filter);
  const suggestions = await analytics.generateOptimizations(filterId, filter);

  let score = 100;
  const issues: string[] = [];

  // Performance penalty
  if (performance && performance.avgExecutionTime > 1000) {
    score -= 30;
    issues.push('Slow execution time');
  }

  // Complexity penalty
  if (complexity.estimatedCost > 70) {
    score -= 20;
    issues.push('High complexity');
  }

  // Success rate penalty
  if (performance && performance.successRate < 0.95) {
    score -= 25;
    issues.push('Low success rate');
  }

  // Critical suggestions penalty
  const criticalSuggestions = suggestions.filter(s => s.severity === 'critical');
  if (criticalSuggestions.length > 0) {
    score -= 15;
    issues.push(`${criticalSuggestions.length} critical optimization needed`);
  }

  let status: 'healthy' | 'warning' | 'critical';
  if (score >= 80) status = 'healthy';
  else if (score >= 50) status = 'warning';
  else status = 'critical';

  return { score: Math.max(0, score), status, issues };
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  analytics: FilterAnalytics,
  filterId: string,
  filter: Filter
): Promise<string> {
  const performance = await analytics.getPerformance(filterId);
  const complexity = await analytics.analyzeComplexity(filter);
  const effectiveness = await analytics.calculateEffectiveness(filterId, filter);
  const suggestions = await analytics.generateOptimizations(filterId, filter);
  const health = await getFilterHealth(analytics, filterId, filter);

  const lines: string[] = [
    '# Filter Analytics Report',
    '',
    `**Filter ID:** ${filterId}`,
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Health Status',
    `- **Score:** ${health.score}/100`,
    `- **Status:** ${health.status.toUpperCase()}`,
    `- **Issues:** ${health.issues.length > 0 ? health.issues.join(', ') : 'None'}`,
    '',
    '## Performance Metrics',
  ];

  if (performance) {
    lines.push(
      `- **Total Executions:** ${performance.totalExecutions}`,
      `- **Avg Execution Time:** ${performance.avgExecutionTime.toFixed(2)}ms`,
      `- **P95 Execution Time:** ${performance.p95ExecutionTime.toFixed(2)}ms`,
      `- **Success Rate:** ${(performance.successRate * 100).toFixed(1)}%`,
      `- **Avg Result Count:** ${performance.avgResultCount.toFixed(0)}`
    );
  } else {
    lines.push('No performance data available');
  }

  lines.push(
    '',
    '## Complexity Analysis',
    `- **Total Conditions:** ${complexity.totalConditions}`,
    `- **Max Nesting Depth:** ${complexity.maxNestingDepth}`,
    `- **Unique Fields:** ${complexity.uniqueFields}`,
    `- **Estimated Cost:** ${complexity.estimatedCost}/100`,
    '',
    '## Effectiveness',
    `- **Overall Score:** ${effectiveness.score.toFixed(1)}/100`,
    `- **Recommendation:** ${effectiveness.recommendation}`,
    `- **Performance Factor:** ${effectiveness.factors.performance.toFixed(1)}/100`,
    `- **Usage Factor:** ${effectiveness.factors.usageFrequency.toFixed(1)}/100`,
    '',
    '## Optimization Suggestions'
  );

  if (suggestions.length > 0) {
    for (const suggestion of suggestions) {
      lines.push(
        `### ${suggestion.type.toUpperCase()} (${suggestion.severity})`,
        suggestion.description,
        `- **Estimated Improvement:** ${suggestion.estimatedImprovement}%`,
        `- **Implementation:** ${suggestion.implementation}`,
        ''
      );
    }
  } else {
    lines.push('No optimizations needed');
  }

  return lines.join('\n');
}
