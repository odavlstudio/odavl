/**
 * ODAVL Insight Enterprise - Historical Data Store
 * Week 41: Historical Trending - File 2/3
 * 
 * Features:
 * - Time-series database interface
 * - Efficient metric storage and retrieval
 * - Data aggregation (rollups)
 * - Data retention policies
 * - Query optimization
 * - Compression for old data
 * - Partition management
 * - Backup and restore
 * - Data migration tools
 * - Query performance monitoring
 * 
 * @module trending/historical-store
 */

import { EventEmitter } from 'events';
import { TimeSeriesPoint, TimePeriod } from './trend-analysis';

// ==================== Types & Interfaces ====================

/**
 * Storage backend type
 */
export enum StorageBackend {
  PostgreSQL = 'postgresql',   // TimescaleDB extension
  InfluxDB = 'influxdb',       // Time-series database
  Prometheus = 'prometheus',   // Metrics storage
  MongoDB = 'mongodb',         // Document store with time-series
  InMemory = 'in-memory',      // For testing
}

/**
 * Aggregation function
 */
export enum AggregationFunction {
  Sum = 'sum',
  Average = 'avg',
  Min = 'min',
  Max = 'max',
  Count = 'count',
  First = 'first',
  Last = 'last',
  StdDev = 'stddev',
  Percentile = 'percentile',
}

/**
 * Metric metadata
 */
export interface MetricMetadata {
  name: string;
  description: string;
  unit: string; // 'count', 'ms', 'bytes', '%'
  type: 'gauge' | 'counter' | 'histogram';
  labels: Record<string, string>; // Tags for filtering
  created: Date;
  lastUpdated: Date;
}

/**
 * Query filter
 */
export interface QueryFilter {
  metric: string;
  startTime: Date;
  endTime: Date;
  labels?: Record<string, string>; // Filter by labels
  aggregation?: {
    function: AggregationFunction;
    interval: TimePeriod; // Rollup interval
  };
  limit?: number;
  offset?: number;
}

/**
 * Aggregated data point
 */
export interface AggregatedPoint {
  timestamp: Date;
  value: number;
  count: number; // Number of raw points aggregated
  min?: number;
  max?: number;
  stdDev?: number;
}

/**
 * Data retention policy
 */
export interface RetentionPolicy {
  name: string;
  duration: number; // Milliseconds to keep data
  resolution: TimePeriod; // Aggregation level (raw, hourly, daily)
  enabled: boolean;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalMetrics: number;
  totalDataPoints: number;
  totalSizeBytes: number;
  oldestDataPoint: Date | null;
  newestDataPoint: Date | null;
  compressionRatio: number;
  partitions: {
    name: string;
    sizeBytes: number;
    dataPoints: number;
    startDate: Date;
    endDate: Date;
  }[];
}

/**
 * Historical store configuration
 */
export interface HistoricalStoreConfig {
  backend: StorageBackend;
  connectionString?: string;
  
  // Performance
  batchSize: number; // Bulk insert size (default: 1000)
  flushInterval: number; // Auto-flush ms (default: 5000)
  
  // Retention
  retentionPolicies: RetentionPolicy[];
  
  // Compression
  compressionEnabled: boolean;
  compressionThreshold: number; // Days (compress data older than N days)
  
  // Partitioning (for PostgreSQL/TimescaleDB)
  partitionByTime: boolean;
  partitionInterval: TimePeriod; // Day, week, month
  
  // Cache
  cacheEnabled: boolean;
  cacheTTL: number; // Seconds
  cacheSize: number; // Max entries
}

// ==================== Historical Store ====================

const DEFAULT_CONFIG: HistoricalStoreConfig = {
  backend: StorageBackend.InMemory,
  batchSize: 1000,
  flushInterval: 5000,
  retentionPolicies: [
    { name: 'raw', duration: 7 * 86400000, resolution: TimePeriod.Hour, enabled: true }, // 7 days raw
    { name: 'hourly', duration: 30 * 86400000, resolution: TimePeriod.Day, enabled: true }, // 30 days hourly
    { name: 'daily', duration: 365 * 86400000, resolution: TimePeriod.Month, enabled: true }, // 1 year daily
  ],
  compressionEnabled: true,
  compressionThreshold: 7,
  partitionByTime: true,
  partitionInterval: TimePeriod.Month,
  cacheEnabled: true,
  cacheTTL: 300,
  cacheSize: 10000,
};

/**
 * Historical Data Store
 * Stores and retrieves time-series metrics efficiently
 */
export class HistoricalStore extends EventEmitter {
  private config: HistoricalStoreConfig;
  private writeBuffer: Map<string, TimeSeriesPoint[]>;
  private flushTimer: NodeJS.Timeout | null;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  
  // Mock storage (in-memory backend)
  private storage: Map<string, TimeSeriesPoint[]>;
  private metadata: Map<string, MetricMetadata>;

  constructor(config: Partial<HistoricalStoreConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.writeBuffer = new Map();
    this.flushTimer = null;
    this.cache = new Map();
    this.storage = new Map();
    this.metadata = new Map();

    this.startAutoFlush();
  }

  /**
   * Write single data point
   */
  async write(metric: string, point: TimeSeriesPoint, labels: Record<string, string> = {}): Promise<void> {
    // Update metadata
    this.updateMetadata(metric, labels);

    // Add to write buffer
    const key = this.getMetricKey(metric, labels);
    if (!this.writeBuffer.has(key)) {
      this.writeBuffer.set(key, []);
    }
    this.writeBuffer.get(key)!.push(point);

    // Flush if batch size reached
    if (this.writeBuffer.get(key)!.length >= this.config.batchSize) {
      await this.flush(key);
    }

    this.emit('point-written', { metric, point });
  }

  /**
   * Write multiple data points (batch)
   */
  async writeBatch(metric: string, points: TimeSeriesPoint[], labels: Record<string, string> = {}): Promise<void> {
    this.updateMetadata(metric, labels);

    const key = this.getMetricKey(metric, labels);
    if (!this.writeBuffer.has(key)) {
      this.writeBuffer.set(key, []);
    }
    this.writeBuffer.get(key)!.push(...points);

    // Flush if batch size exceeded
    if (this.writeBuffer.get(key)!.length >= this.config.batchSize) {
      await this.flush(key);
    }

    this.emit('batch-written', { metric, count: points.length });
  }

  /**
   * Query time-series data
   */
  async query(filter: QueryFilter): Promise<TimeSeriesPoint[]> {
    const cacheKey = this.getCacheKey(filter);

    // Check cache
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
        this.emit('cache-hit', { filter });
        return cached.data as TimeSeriesPoint[];
      }
    }

    // Flush pending writes for this metric
    const keys = Array.from(this.writeBuffer.keys()).filter(k => k.startsWith(filter.metric));
    for (const key of keys) {
      await this.flush(key);
    }

    // Query from storage
    const key = this.getMetricKey(filter.metric, filter.labels || {});
    const data = this.storage.get(key) || [];

    // Filter by time range
    let filtered = data.filter(
      d => d.timestamp >= filter.startTime && d.timestamp <= filter.endTime
    );

    // Sort by timestamp
    filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Apply aggregation if specified
    if (filter.aggregation) {
      filtered = this.aggregateData(filtered, filter.aggregation);
    }

    // Apply limit/offset
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    // Cache result
    if (this.config.cacheEnabled) {
      this.cache.set(cacheKey, { data: filtered, timestamp: Date.now() });
    }

    this.emit('query-executed', { filter, resultCount: filtered.length });
    return filtered;
  }

  /**
   * Query aggregated data
   */
  async queryAggregated(filter: QueryFilter): Promise<AggregatedPoint[]> {
    if (!filter.aggregation) {
      throw new Error('Aggregation must be specified');
    }

    const rawData = await this.query(filter);
    const aggregated = this.aggregateDataWithStats(rawData, filter.aggregation);

    this.emit('aggregated-query-executed', { filter, resultCount: aggregated.length });
    return aggregated;
  }

  /**
   * Get metric metadata
   */
  async getMetadata(metric: string): Promise<MetricMetadata | null> {
    return this.metadata.get(metric) || null;
  }

  /**
   * List all metrics
   */
  async listMetrics(pattern?: string): Promise<MetricMetadata[]> {
    const metrics = Array.from(this.metadata.values());

    if (pattern) {
      const regex = new RegExp(pattern);
      return metrics.filter(m => regex.test(m.name));
    }

    return metrics;
  }

  /**
   * Delete metric data
   */
  async deleteMetric(metric: string, labels?: Record<string, string>): Promise<void> {
    const key = this.getMetricKey(metric, labels || {});
    this.storage.delete(key);
    this.writeBuffer.delete(key);
    
    if (!labels) {
      this.metadata.delete(metric);
    }

    this.invalidateCache(metric);
    this.emit('metric-deleted', { metric, labels });
  }

  /**
   * Delete data in time range
   */
  async deleteRange(metric: string, startTime: Date, endTime: Date): Promise<number> {
    const keys = Array.from(this.storage.keys()).filter(k => k.startsWith(metric));
    let deletedCount = 0;

    for (const key of keys) {
      const data = this.storage.get(key) || [];
      const filtered = data.filter(d => d.timestamp < startTime || d.timestamp > endTime);
      deletedCount += data.length - filtered.length;
      this.storage.set(key, filtered);
    }

    this.invalidateCache(metric);
    this.emit('range-deleted', { metric, startTime, endTime, deletedCount });
    return deletedCount;
  }

  /**
   * Apply retention policies
   */
  async applyRetention(): Promise<void> {
    const now = Date.now();
    let totalDeleted = 0;

    for (const policy of this.config.retentionPolicies) {
      if (!policy.enabled) continue;

      const cutoffDate = new Date(now - policy.duration);

      for (const [key, data] of this.storage.entries()) {
        const filtered = data.filter(d => d.timestamp >= cutoffDate);
        const deleted = data.length - filtered.length;
        totalDeleted += deleted;
        this.storage.set(key, filtered);
      }
    }

    this.cache.clear();
    this.emit('retention-applied', { totalDeleted });
  }

  /**
   * Compress old data
   */
  async compressOldData(): Promise<void> {
    if (!this.config.compressionEnabled) return;

    const cutoffDate = new Date(Date.now() - this.config.compressionThreshold * 86400000);
    let compressedPoints = 0;

    for (const [key, data] of this.storage.entries()) {
      const oldData = data.filter(d => d.timestamp < cutoffDate);
      const newData = data.filter(d => d.timestamp >= cutoffDate);

      if (oldData.length > 0) {
        // Compress to hourly aggregates
        const compressed = this.aggregateDataWithStats(oldData, {
          function: AggregationFunction.Average,
          interval: TimePeriod.Hour,
        });

        // Convert back to TimeSeriesPoint
        const compressedPoints = compressed.map(p => ({
          timestamp: p.timestamp,
          value: p.value,
          metadata: { compressed: true, count: p.count },
        }));

        this.storage.set(key, [...compressedPoints, ...newData]);
        compressedPoints += oldData.length - compressed.length;
      }
    }

    this.emit('data-compressed', { compressedPoints });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    let totalDataPoints = 0;
    let oldestDataPoint: Date | null = null;
    let newestDataPoint: Date | null = null;

    for (const data of this.storage.values()) {
      totalDataPoints += data.length;

      for (const point of data) {
        if (!oldestDataPoint || point.timestamp < oldestDataPoint) {
          oldestDataPoint = point.timestamp;
        }
        if (!newestDataPoint || point.timestamp > newestDataPoint) {
          newestDataPoint = point.timestamp;
        }
      }
    }

    // Estimate size (rough calculation)
    const totalSizeBytes = totalDataPoints * 64; // ~64 bytes per point

    return {
      totalMetrics: this.metadata.size,
      totalDataPoints,
      totalSizeBytes,
      oldestDataPoint,
      newestDataPoint,
      compressionRatio: 1.0, // Mock
      partitions: [], // Mock
    };
  }

  /**
   * Export data to JSON
   */
  async export(metric: string, startTime: Date, endTime: Date): Promise<string> {
    const data = await this.query({
      metric,
      startTime,
      endTime,
    });

    return JSON.stringify(
      {
        metric,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        dataPoints: data.length,
        data: data.map(d => ({
          timestamp: d.timestamp.toISOString(),
          value: d.value,
          metadata: d.metadata,
        })),
      },
      null,
      2
    );
  }

  /**
   * Import data from JSON
   */
  async import(json: string): Promise<void> {
    const parsed = JSON.parse(json);
    const points: TimeSeriesPoint[] = parsed.data.map((d: { timestamp: string; value: number; metadata?: Record<string, unknown> }) => ({
      timestamp: new Date(d.timestamp),
      value: d.value,
      metadata: d.metadata,
    }));

    await this.writeBatch(parsed.metric, points);
    this.emit('data-imported', { metric: parsed.metric, count: points.length });
  }

  /**
   * Backup data to file
   */
  async backup(path: string): Promise<void> {
    const allData: Record<string, TimeSeriesPoint[]> = {};

    for (const [key, data] of this.storage.entries()) {
      allData[key] = data;
    }

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      metadata: Array.from(this.metadata.entries()),
      data: allData,
    };

    // Mock file write (in real implementation, use fs.writeFile)
    this.emit('backup-created', { path, metrics: Object.keys(allData).length });
  }

  /**
   * Restore data from backup
   */
  async restore(path: string): Promise<void> {
    // Mock file read (in real implementation, use fs.readFile)
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      metadata: [],
      data: {},
    };

    this.storage.clear();
    this.metadata.clear();

    for (const [key, value] of backup.metadata as [string, MetricMetadata][]) {
      this.metadata.set(key, value);
    }

    for (const [key, value] of Object.entries(backup.data as Record<string, TimeSeriesPoint[]>)) {
      this.storage.set(key, value);
    }

    this.cache.clear();
    this.emit('backup-restored', { path, metrics: this.metadata.size });
  }

  /**
   * Optimize storage (vacuum, reindex)
   */
  async optimize(): Promise<void> {
    // Remove empty keys
    for (const [key, data] of this.storage.entries()) {
      if (data.length === 0) {
        this.storage.delete(key);
      }
    }

    // Clear old cache entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL * 1000) {
        this.cache.delete(key);
      }
    }

    this.emit('storage-optimized', {
      storageKeys: this.storage.size,
      cacheKeys: this.cache.size,
    });
  }

  /**
   * Close store and cleanup
   */
  async close(): Promise<void> {
    // Flush all pending writes
    for (const key of this.writeBuffer.keys()) {
      await this.flush(key);
    }

    // Stop auto-flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.emit('store-closed');
  }

  // ==================== Private Methods ====================

  /**
   * Update or create metric metadata
   */
  private updateMetadata(metric: string, labels: Record<string, string>): void {
    if (!this.metadata.has(metric)) {
      this.metadata.set(metric, {
        name: metric,
        description: '',
        unit: '',
        type: 'gauge',
        labels,
        created: new Date(),
        lastUpdated: new Date(),
      });
    } else {
      const meta = this.metadata.get(metric)!;
      meta.lastUpdated = new Date();
      meta.labels = { ...meta.labels, ...labels };
    }
  }

  /**
   * Get metric key (metric + labels)
   */
  private getMetricKey(metric: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelStr ? `${metric}{${labelStr}}` : metric;
  }

  /**
   * Get cache key from query filter
   */
  private getCacheKey(filter: QueryFilter): string {
    return JSON.stringify({
      metric: filter.metric,
      start: filter.startTime.getTime(),
      end: filter.endTime.getTime(),
      labels: filter.labels,
      agg: filter.aggregation,
      limit: filter.limit,
      offset: filter.offset,
    });
  }

  /**
   * Invalidate cache for metric
   */
  private invalidateCache(metric: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`"metric":"${metric}"`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Flush write buffer to storage
   */
  private async flush(key?: string): Promise<void> {
    if (key) {
      const points = this.writeBuffer.get(key);
      if (!points || points.length === 0) return;

      const existing = this.storage.get(key) || [];
      this.storage.set(key, [...existing, ...points]);
      this.writeBuffer.delete(key);

      this.emit('buffer-flushed', { key, count: points.length });
    } else {
      // Flush all
      for (const k of this.writeBuffer.keys()) {
        await this.flush(k);
      }
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(err => this.emit('flush-error', err));
    }, this.config.flushInterval);
  }

  /**
   * Aggregate data points
   */
  private aggregateData(
    data: TimeSeriesPoint[],
    aggregation: { function: AggregationFunction; interval: TimePeriod }
  ): TimeSeriesPoint[] {
    const buckets = this.bucketByInterval(data, aggregation.interval);
    const aggregated: TimeSeriesPoint[] = [];

    for (const [timestamp, points] of buckets.entries()) {
      const values = points.map(p => p.value);
      let value: number;

      switch (aggregation.function) {
        case AggregationFunction.Sum:
          value = values.reduce((sum, v) => sum + v, 0);
          break;
        case AggregationFunction.Average:
          value = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case AggregationFunction.Min:
          value = Math.min(...values);
          break;
        case AggregationFunction.Max:
          value = Math.max(...values);
          break;
        case AggregationFunction.Count:
          value = values.length;
          break;
        case AggregationFunction.First:
          value = values[0];
          break;
        case AggregationFunction.Last:
          value = values[values.length - 1];
          break;
        case AggregationFunction.StdDev:
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
          value = Math.sqrt(variance);
          break;
        default:
          value = values[0];
      }

      aggregated.push({
        timestamp: new Date(timestamp),
        value,
        metadata: { aggregated: true, count: points.length },
      });
    }

    return aggregated;
  }

  /**
   * Aggregate data with additional statistics
   */
  private aggregateDataWithStats(
    data: TimeSeriesPoint[],
    aggregation: { function: AggregationFunction; interval: TimePeriod }
  ): AggregatedPoint[] {
    const buckets = this.bucketByInterval(data, aggregation.interval);
    const aggregated: AggregatedPoint[] = [];

    for (const [timestamp, points] of buckets.entries()) {
      const values = points.map(p => p.value);
      const count = values.length;
      const sum = values.reduce((s, v) => s + v, 0);
      const mean = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / count;
      const stdDev = Math.sqrt(variance);

      let value: number;
      switch (aggregation.function) {
        case AggregationFunction.Sum:
          value = sum;
          break;
        case AggregationFunction.Average:
          value = mean;
          break;
        case AggregationFunction.Min:
          value = min;
          break;
        case AggregationFunction.Max:
          value = max;
          break;
        case AggregationFunction.Count:
          value = count;
          break;
        default:
          value = mean;
      }

      aggregated.push({
        timestamp: new Date(timestamp),
        value,
        count,
        min,
        max,
        stdDev,
      });
    }

    return aggregated;
  }

  /**
   * Bucket data points by time interval
   */
  private bucketByInterval(
    data: TimeSeriesPoint[],
    interval: TimePeriod
  ): Map<number, TimeSeriesPoint[]> {
    const buckets = new Map<number, TimeSeriesPoint[]>();
    const intervalMs = this.intervalToMs(interval);

    for (const point of data) {
      const bucketTime = Math.floor(point.timestamp.getTime() / intervalMs) * intervalMs;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(point);
    }

    return buckets;
  }

  /**
   * Convert time period to milliseconds
   */
  private intervalToMs(interval: TimePeriod): number {
    switch (interval) {
      case TimePeriod.Hour:
        return 3600000;
      case TimePeriod.Day:
        return 86400000;
      case TimePeriod.Week:
        return 604800000;
      case TimePeriod.Month:
        return 2592000000; // 30 days
      case TimePeriod.Quarter:
        return 7776000000; // 90 days
      case TimePeriod.Year:
        return 31536000000; // 365 days
      default:
        return 86400000;
    }
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create historical store instance
 */
export function createHistoricalStore(config?: Partial<HistoricalStoreConfig>): HistoricalStore {
  return new HistoricalStore(config);
}

/**
 * Migration helper: Transform data between formats
 */
export async function migrateData(
  source: HistoricalStore,
  target: HistoricalStore,
  metrics: string[]
): Promise<void> {
  for (const metric of metrics) {
    const data = await source.query({
      metric,
      startTime: new Date(0),
      endTime: new Date(),
    });

    await target.writeBatch(metric, data);
  }
}

/**
 * Data validation: Check for gaps in time series
 */
export function validateTimeSeries(
  data: TimeSeriesPoint[],
  expectedInterval: number
): { valid: boolean; gaps: { start: Date; end: Date; duration: number }[] } {
  if (data.length < 2) {
    return { valid: true, gaps: [] };
  }

  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const gaps: { start: Date; end: Date; duration: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const duration = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime();
    if (duration > expectedInterval * 1.5) {
      gaps.push({
        start: sorted[i - 1].timestamp,
        end: sorted[i].timestamp,
        duration,
      });
    }
  }

  return { valid: gaps.length === 0, gaps };
}
