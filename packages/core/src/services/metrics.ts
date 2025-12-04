/**
 * ODAVL Studio - Metrics Collection Service
 * Phase 3.2: Observability Stack
 * 
 * Prometheus-style metrics for:
 * - Request rates and latencies
 * - Error rates
 * - Resource utilization
 * - Business metrics
 * - Custom counters and gauges
 */

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
  help?: string; // Description
}

export interface MetricSnapshot {
  metrics: Metric[];
  timestamp: Date;
  labels: Record<string, string>;
}

class MetricsCollectionService {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  // Request metrics
  private requestCount: Map<string, number> = new Map(); // Key: method:path
  private requestDurations: Map<string, number[]> = new Map();
  private requestErrors: Map<string, number> = new Map();

  // System metrics
  private readonly startTime: Date;

  constructor() {
    this.startTime = new Date();
    
    // Initialize system metrics collection
    this.startSystemMetricsCollection();
    
    console.log('📊 Metrics collection service initialized');
  }

  /**
   * Start periodic system metrics collection
   */
  private startSystemMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Initial collection
    this.collectSystemMetrics();
  }

  /**
   * Collect system metrics (CPU, memory, etc.)
   */
  private collectSystemMetrics(): void {
    const usage = process.memoryUsage();
    
    this.setGauge('system_memory_heap_used_bytes', usage.heapUsed);
    this.setGauge('system_memory_heap_total_bytes', usage.heapTotal);
    this.setGauge('system_memory_rss_bytes', usage.rss);
    this.setGauge('system_memory_external_bytes', usage.external);
    
    // CPU usage (approximation)
    const cpuUsage = process.cpuUsage();
    this.setGauge('system_cpu_user_microseconds', cpuUsage.user);
    this.setGauge('system_cpu_system_microseconds', cpuUsage.system);
    
    // Uptime
    this.setGauge('system_uptime_seconds', (Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    
    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(key, values);
  }

  /**
   * Generate metric key with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }

  /**
   * Parse metric key back to name and labels
   */
  private parseMetricKey(key: string): { name: string; labels?: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{([^}]+)\})?$/);
    if (!match) return { name: key };
    
    const name = match[1];
    const labelsStr = match[2];
    
    if (!labelsStr) return { name };
    
    const labels: Record<string, string> = {};
    labelsStr.split(',').forEach(pair => {
      const [k, v] = pair.split('=');
      labels[k] = v.replace(/"/g, '');
    });
    
    return { name, labels };
  }

  /**
   * Record HTTP request
   */
  recordRequest(req: {
    method: string;
    path: string;
    statusCode: number;
    duration: number; // milliseconds
    error?: boolean;
  }): void {
    const route = this.normalizeRoute(req.path);
    const key = `${req.method}:${route}`;
    
    // Increment request count
    const count = this.requestCount.get(key) || 0;
    this.requestCount.set(key, count + 1);
    
    // Record duration
    const durations = this.requestDurations.get(key) || [];
    durations.push(req.duration);
    if (durations.length > 1000) durations.shift();
    this.requestDurations.set(key, durations);
    
    // Record errors
    if (req.error || req.statusCode >= 500) {
      const errors = this.requestErrors.get(key) || 0;
      this.requestErrors.set(key, errors + 1);
    }
    
    // Update Prometheus-style metrics
    this.incrementCounter('http_requests_total', 1, {
      method: req.method,
      path: route,
      status: req.statusCode.toString()
    });
    
    this.recordHistogram('http_request_duration_milliseconds', req.duration, {
      method: req.method,
      path: route
    });
    
    if (req.error || req.statusCode >= 500) {
      this.incrementCounter('http_requests_errors_total', 1, {
        method: req.method,
        path: route,
        status: req.statusCode.toString()
      });
    }
  }

  /**
   * Normalize route path (remove IDs, params)
   */
  private normalizeRoute(path: string): string {
    return path
      .replace(/\/[0-9a-f-]{36}/gi, '/:id') // UUIDs
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/\?.+$/, ''); // Remove query params
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(query: {
    operation: 'select' | 'insert' | 'update' | 'delete';
    table: string;
    duration: number;
    error?: boolean;
  }): void {
    this.incrementCounter('database_queries_total', 1, {
      operation: query.operation,
      table: query.table
    });
    
    this.recordHistogram('database_query_duration_milliseconds', query.duration, {
      operation: query.operation,
      table: query.table
    });
    
    if (query.error) {
      this.incrementCounter('database_queries_errors_total', 1, {
        operation: query.operation,
        table: query.table
      });
    }
  }

  /**
   * Record business event
   */
  recordEvent(event: {
    type: string;
    action: string;
    value?: number;
  }): void {
    this.incrementCounter('business_events_total', 1, {
      type: event.type,
      action: event.action
    });
    
    if (event.value !== undefined) {
      this.recordHistogram('business_event_value', event.value, {
        type: event.type,
        action: event.action
      });
    }
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): MetricSnapshot {
    const metrics: Metric[] = [];
    
    // Counters
    this.counters.forEach((value, key) => {
      const { name, labels } = this.parseMetricKey(key);
      metrics.push({
        name,
        type: MetricType.COUNTER,
        value,
        labels,
        timestamp: new Date()
      });
    });
    
    // Gauges
    this.gauges.forEach((value, key) => {
      const { name, labels } = this.parseMetricKey(key);
      metrics.push({
        name,
        type: MetricType.GAUGE,
        value,
        labels,
        timestamp: new Date()
      });
    });
    
    // Histograms (calculate percentiles)
    this.histograms.forEach((values, key) => {
      const { name, labels } = this.parseMetricKey(key);
      const sorted = [...values].sort((a, b) => a - b);
      
      // Count
      metrics.push({
        name: `${name}_count`,
        type: MetricType.HISTOGRAM,
        value: values.length,
        labels,
        timestamp: new Date()
      });
      
      // Sum
      metrics.push({
        name: `${name}_sum`,
        type: MetricType.HISTOGRAM,
        value: values.reduce((a, b) => a + b, 0),
        labels,
        timestamp: new Date()
      });
      
      // Percentiles
      if (sorted.length > 0) {
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        
        metrics.push({
          name: `${name}_p50`,
          type: MetricType.HISTOGRAM,
          value: p50,
          labels,
          timestamp: new Date()
        });
        
        metrics.push({
          name: `${name}_p95`,
          type: MetricType.HISTOGRAM,
          value: p95,
          labels,
          timestamp: new Date()
        });
        
        metrics.push({
          name: `${name}_p99`,
          type: MetricType.HISTOGRAM,
          value: p99,
          labels,
          timestamp: new Date()
        });
      }
    });
    
    return {
      metrics,
      timestamp: new Date(),
      labels: {
        service: 'odavl-studio',
        environment: process.env.NODE_ENV || 'development'
      }
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const snapshot = this.getSnapshot();
    const lines: string[] = [];
    
    // Group metrics by name
    const metricsByName = new Map<string, Metric[]>();
    snapshot.metrics.forEach(metric => {
      const existing = metricsByName.get(metric.name) || [];
      existing.push(metric);
      metricsByName.set(metric.name, existing);
    });
    
    // Format each metric
    metricsByName.forEach((metrics, name) => {
      const firstMetric = metrics[0];
      
      // Help text
      if (firstMetric.help) {
        lines.push(`# HELP ${name} ${firstMetric.help}`);
      }
      
      // Type
      lines.push(`# TYPE ${name} ${firstMetric.type}`);
      
      // Values
      metrics.forEach(metric => {
        let line = name;
        
        // Add labels
        if (metric.labels && Object.keys(metric.labels).length > 0) {
          const labelStr = Object.entries(metric.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
          line += `{${labelStr}}`;
        }
        
        line += ` ${metric.value}`;
        lines.push(line);
      });
      
      lines.push(''); // Empty line between metrics
    });
    
    return lines.join('\n');
  }

  /**
   * Get request statistics
   */
  getRequestStats(): Array<{
    route: string;
    count: number;
    avgDuration: number;
    p95Duration: number;
    errorRate: number;
  }> {
    const stats: Array<any> = [];
    
    this.requestCount.forEach((count, key) => {
      const durations = this.requestDurations.get(key) || [];
      const errors = this.requestErrors.get(key) || 0;
      
      const sorted = [...durations].sort((a, b) => a - b);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p95Duration = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const errorRate = count > 0 ? (errors / count) * 100 : 0;
      
      stats.push({
        route: key,
        count,
        avgDuration: Math.round(avgDuration * 100) / 100,
        p95Duration: Math.round(p95Duration * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100
      });
    });
    
    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.requestCount.clear();
    this.requestDurations.clear();
    this.requestErrors.clear();
    
    console.log('📊 Metrics reset');
  }
}

// Export singleton
export const metricsService = new MetricsCollectionService();

// Middleware for Next.js
export function metricsMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  // Override res.end to record metrics
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    metricsService.recordRequest({
      method: req.method,
      path: req.url,
      statusCode: res.statusCode,
      duration,
      error: res.statusCode >= 500
    });
    
    originalEnd.apply(res, args);
  };
  
  next();
}
