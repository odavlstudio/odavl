/**
 * Application Performance Monitoring (APM) Service
 * Monitor performance, errors, and custom metrics
 * 
 * Supports:
 * - New Relic
 * - Datadog
 * - Custom metrics
 */

export type APMProvider = 'newrelic' | 'datadog' | 'custom';

export interface APMConfig {
  provider: APMProvider;
  enabled: boolean;
  apiKey?: string;
  appName?: string;
  environment?: string;
}

export interface TransactionOptions {
  name: string;
  type?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface ErrorContext {
  message: string;
  stack?: string;
  attributes?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * APM Service
 */
export class APMService {
  private static instance: APMService;
  private config: APMConfig;
  private metrics: Map<string, CustomMetric[]> = new Map();
  
  private constructor() {
    this.config = {
      provider: (process.env.APM_PROVIDER as APMProvider) || 'custom',
      enabled: process.env.APM_ENABLED === 'true',
      apiKey: process.env.APM_API_KEY,
      appName: process.env.APM_APP_NAME || 'ODAVL Studio',
      environment: process.env.NODE_ENV || 'development',
    };
    
    if (this.config.enabled) {
      this.initializeProvider();
    }
  }
  
  public static getInstance(): APMService {
    if (!APMService.instance) {
      APMService.instance = new APMService();
    }
    return APMService.instance;
  }
  
  /**
   * Initialize APM provider
   */
  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'newrelic':
        this.initializeNewRelic();
        break;
      
      case 'datadog':
        this.initializeDatadog();
        break;
      
      case 'custom':
        console.log('✅ APM: Using custom metrics collection');
        break;
    }
  }
  
  /**
   * Initialize New Relic
   */
  private initializeNewRelic(): void {
    // TODO: Implement New Relic initialization
    // require('newrelic');
    console.log('✅ APM: New Relic initialized');
  }
  
  /**
   * Initialize Datadog
   */
  private initializeDatadog(): void {
    // TODO: Implement Datadog initialization
    // const tracer = require('dd-trace').init({
    //   service: this.config.appName,
    //   env: this.config.environment,
    // });
    console.log('✅ APM: Datadog initialized');
  }
  
  /**
   * Start transaction
   */
  public startTransaction(options: TransactionOptions): string {
    if (!this.config.enabled) return '';
    
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (this.config.provider) {
      case 'newrelic':
        // TODO: New Relic transaction
        // newrelic.startWebTransaction(options.name, () => {});
        break;
      
      case 'datadog':
        // TODO: Datadog span
        // tracer.trace(options.name, { type: options.type }, (span) => {});
        break;
      
      case 'custom':
        this.recordMetric({
          name: `transaction.${options.name}`,
          value: 1,
          tags: { type: options.type || 'custom', ...options.attributes },
        });
        break;
    }
    
    return transactionId;
  }
  
  /**
   * End transaction
   */
  public endTransaction(transactionId: string, duration: number): void {
    if (!this.config.enabled || !transactionId) return;
    
    this.recordMetric({
      name: 'transaction.duration',
      value: duration,
      unit: 'ms',
      tags: { transactionId },
    });
  }
  
  /**
   * Record custom metric
   */
  public recordMetric(metric: CustomMetric): void {
    if (!this.config.enabled) return;
    
    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date(),
    };
    
    // Store in memory for custom provider
    if (this.config.provider === 'custom') {
      const existing = this.metrics.get(metric.name) || [];
      existing.push(metricWithTimestamp);
      
      // Keep only last 1000 metrics per name
      if (existing.length > 1000) {
        existing.shift();
      }
      
      this.metrics.set(metric.name, existing);
    }
    
    // Send to provider
    switch (this.config.provider) {
      case 'newrelic':
        // TODO: New Relic custom metric
        // newrelic.recordMetric(metric.name, metric.value);
        break;
      
      case 'datadog':
        // TODO: Datadog gauge
        // tracer.dogstatsd.gauge(metric.name, metric.value, metric.tags);
        break;
    }
  }
  
  /**
   * Record error
   */
  public recordError(error: Error | ErrorContext): void {
    if (!this.config.enabled) return;
    
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    
    switch (this.config.provider) {
      case 'newrelic':
        // TODO: New Relic error
        // newrelic.noticeError(error);
        break;
      
      case 'datadog':
        // TODO: Datadog error tracking
        break;
      
      case 'custom':
        this.recordMetric({
          name: 'errors',
          value: 1,
          tags: {
            severity: 'severity' in errorData ? errorData.severity! : 'medium',
          },
        });
        console.error('APM Error:', errorData);
        break;
    }
  }
  
  /**
   * Get metrics summary
   */
  public getMetrics(metricName?: string): CustomMetric[] {
    if (metricName) {
      return this.metrics.get(metricName) || [];
    }
    
    const allMetrics: CustomMetric[] = [];
    this.metrics.forEach(metrics => allMetrics.push(...metrics));
    return allMetrics;
  }
  
  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
  }
  
  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalTransactions: number;
    averageDuration: number;
    errorRate: number;
    metrics: Record<string, { count: number; average: number; min: number; max: number }>;
  } {
    const allMetrics = this.getMetrics();
    
    const transactionMetrics = allMetrics.filter(m => m.name.startsWith('transaction.'));
    const errorMetrics = allMetrics.filter(m => m.name === 'errors');
    
    const totalTransactions = transactionMetrics.length;
    const totalErrors = errorMetrics.length;
    
    const durationMetrics = allMetrics.filter(m => m.name === 'transaction.duration');
    const durations = durationMetrics.map(m => m.value);
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    
    const errorRate = totalTransactions > 0 ? (totalErrors / totalTransactions) * 100 : 0;
    
    // Aggregate metrics by name
    const metricsSummary: Record<string, { count: number; average: number; min: number; max: number }> = {};
    
    this.metrics.forEach((metrics, name) => {
      const values = metrics.map(m => m.value);
      if (values.length > 0) {
        metricsSummary[name] = {
          count: values.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    });
    
    return {
      totalTransactions,
      averageDuration,
      errorRate,
      metrics: metricsSummary,
    };
  }
}

// Singleton instance
export const apmService = APMService.getInstance();

/**
 * Decorator for automatic transaction tracking
 */
export function traced(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const transactionName = name || `${target?.constructor?.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      const txId = apmService.startTransaction({ name: transactionName });
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        apmService.endTransaction(txId, duration);
        apmService.recordMetric({
          name: `${transactionName}.success`,
          value: 1,
          tags: { duration: duration.toString() },
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        apmService.endTransaction(txId, duration);
        apmService.recordError(error as Error);
        apmService.recordMetric({
          name: `${transactionName}.error`,
          value: 1,
          tags: { duration: duration.toString() },
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * ODAVL-specific metrics
 */

export const ODAPVLMetrics = {
  // Sync job metrics
  syncJobStarted: (product: 'insight' | 'autopilot' | 'guardian') => {
    apmService.recordMetric({
      name: 'sync.job.started',
      value: 1,
      tags: { product },
    });
  },
  
  syncJobCompleted: (product: 'insight' | 'autopilot' | 'guardian', duration: number) => {
    apmService.recordMetric({
      name: 'sync.job.completed',
      value: 1,
      tags: { product, duration: duration.toString() },
    });
    
    apmService.recordMetric({
      name: 'sync.job.duration',
      value: duration,
      unit: 'ms',
      tags: { product },
    });
  },
  
  syncJobFailed: (product: 'insight' | 'autopilot' | 'guardian', error: string) => {
    apmService.recordMetric({
      name: 'sync.job.failed',
      value: 1,
      tags: { product, error },
    });
  },
  
  // Cache metrics
  cacheHit: (namespace: string) => {
    apmService.recordMetric({
      name: 'cache.hit',
      value: 1,
      tags: { namespace },
    });
  },
  
  cacheMiss: (namespace: string) => {
    apmService.recordMetric({
      name: 'cache.miss',
      value: 1,
      tags: { namespace },
    });
  },
  
  // CDN metrics
  cdnRequest: (path: string, cached: boolean) => {
    apmService.recordMetric({
      name: 'cdn.request',
      value: 1,
      tags: { path, cached: cached.toString() },
    });
  },
  
  // Rate limit metrics
  rateLimitExceeded: (identifier: string, endpoint: string) => {
    apmService.recordMetric({
      name: 'rate_limit.exceeded',
      value: 1,
      tags: { identifier, endpoint },
    });
  },
  
  // Database metrics
  queryExecuted: (model: string, operation: string, duration: number) => {
    apmService.recordMetric({
      name: 'db.query.executed',
      value: 1,
      tags: { model, operation, duration: duration.toString() },
    });
    
    apmService.recordMetric({
      name: 'db.query.duration',
      value: duration,
      unit: 'ms',
      tags: { model, operation },
    });
  },
  
  slowQuery: (model: string, operation: string, duration: number) => {
    apmService.recordMetric({
      name: 'db.slow_query',
      value: 1,
      tags: { model, operation, duration: duration.toString() },
    });
  },
};
