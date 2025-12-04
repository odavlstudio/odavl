/**
 * Database Performance Monitoring
 * Tracks slow queries, connection pool health, and database metrics
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: Date;
  params?: string;
  model?: string;
  action?: string;
}

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  connectionErrors: number;
  avgQueryDuration: number;
}

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = 1000; // 1 second
const WARNING_QUERY_THRESHOLD = 500; // 500ms

// Store recent slow queries for analysis
const slowQueries: QueryMetric[] = [];
const MAX_SLOW_QUERIES_STORED = 100;

// Track query statistics
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  failedQueries: 0,
  totalDuration: 0,
  queryDurations: [] as number[],
};

// Create Prisma client with query logging
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Monitor query performance
interface PrismaQueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

prisma.$on('query', (e: PrismaQueryEvent) => {
  queryStats.totalQueries++;
  queryStats.totalDuration += e.duration;
  queryStats.queryDurations.push(e.duration);

  // Keep only last 1000 durations for percentile calculations
  if (queryStats.queryDurations.length > 1000) {
    queryStats.queryDurations.shift();
  }

  // Log slow queries
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    queryStats.slowQueries++;

    const metric: QueryMetric = {
      query: e.query,
      duration: e.duration,
      timestamp: new Date(),
      params: e.params,
    };

    // Store for analysis
    slowQueries.push(metric);
    if (slowQueries.length > MAX_SLOW_QUERIES_STORED) {
      slowQueries.shift();
    }

    logger.error('Slow query detected', {
      query: e.query.substring(0, 200),
      duration: e.duration,
      params: e.params,
      threshold: SLOW_QUERY_THRESHOLD,
    });

    // Send to monitoring service
    sendToMonitoring({
      metric: 'db.query.slow',
      value: e.duration,
      tags: {
        query_type: extractQueryType(e.query),
      },
    });
  } else if (e.duration > WARNING_QUERY_THRESHOLD) {
    logger.warn('Query approaching slow threshold', {
      query: e.query.substring(0, 100),
      duration: e.duration,
      threshold: WARNING_QUERY_THRESHOLD,
    });
  }

  // Track all query durations for percentile metrics
  sendToMonitoring({
    metric: 'db.query.duration',
    value: e.duration,
    tags: {
      query_type: extractQueryType(e.query),
    },
  });
});

// Monitor database errors
interface PrismaErrorEvent {
  timestamp: Date;
  message: string;
  target: string;
}

prisma.$on('error', (e: PrismaErrorEvent) => {
  queryStats.failedQueries++;

  logger.error('Database error', {
    message: e.message,
    target: e.target,
  });

  sendToMonitoring({
    metric: 'db.error',
    value: 1,
    tags: {
      error_type: e.message?.substring(0, 50) || 'unknown',
    },
  });
});

// Monitor warnings
interface PrismaWarnEvent {
  timestamp: Date;
  message: string;
  target: string;
}

prisma.$on('warn', (e: PrismaWarnEvent) => {
  logger.warn('Database warning', {
    message: e.message,
  });
});

/**
 * Extract query type from SQL query
 */
function extractQueryType(query: string): string {
  const trimmed = query.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  return 'OTHER';
}

/**
 * Get current database statistics
 */
export function getDatabaseStats() {
  const durations = [...queryStats.queryDurations].sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

  return {
    totalQueries: queryStats.totalQueries,
    slowQueries: queryStats.slowQueries,
    failedQueries: queryStats.failedQueries,
    avgDuration: queryStats.totalQueries > 0
      ? Math.round(queryStats.totalDuration / queryStats.totalQueries)
      : 0,
    p50Duration: Math.round(p50),
    p95Duration: Math.round(p95),
    p99Duration: Math.round(p99),
    slowQueryRate: queryStats.totalQueries > 0
      ? ((queryStats.slowQueries / queryStats.totalQueries) * 100).toFixed(2) + '%'
      : '0%',
    errorRate: queryStats.totalQueries > 0
      ? ((queryStats.failedQueries / queryStats.totalQueries) * 100).toFixed(2) + '%'
      : '0%',
  };
}

/**
 * Get recent slow queries for analysis
 */
export function getSlowQueries(limit: number = 10): QueryMetric[] {
  return slowQueries
    .slice(-limit)
    .sort((a, b) => b.duration - a.duration);
}

/**
 * Send metrics to monitoring service (Datadog, Prometheus, etc.)
 */
function sendToMonitoring(data: {
  metric: string;
  value: number;
  tags?: Record<string, string>;
}) {
  // In production, send to your monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Datadog StatsD
    // statsd.histogram(data.metric, data.value, data.tags);

    // Example: Prometheus
    // prometheusRegistry.histogram(data.metric).observe(data.value);

    // For now, just log in development
    if (process.env.DEBUG_DB_METRICS === 'true') {
      logger.debug('DB metric', data);
    }
  }
}

/**
 * Monitor connection pool health
 * Note: Prisma doesn't expose pool metrics directly, but we can infer from query patterns
 */
export async function getPoolMetrics(): Promise<Partial<PoolMetrics>> {
  try {
    // Execute a simple query to check connection health
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - start;

    return {
      avgQueryDuration: queryStats.totalQueries > 0
        ? Math.round(queryStats.totalDuration / queryStats.totalQueries)
        : 0,
      connectionErrors: queryStats.failedQueries,
    };
  } catch (error) {
    logger.error('Failed to get pool metrics', { error });
    return {
      connectionErrors: queryStats.failedQueries,
    };
  }
}

/**
 * Test database connection and performance
 */
export async function testDatabasePerformance(): Promise<{
  connectionTime: number;
  queryTime: number;
  healthy: boolean;
}> {
  try {
    // Test connection
    const connStart = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - connStart;

    // Test query performance
    const queryStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - queryStart;

    const healthy = connectionTime < 100 && queryTime < 50;

    return {
      connectionTime,
      queryTime,
      healthy,
    };
  } catch (error) {
    logger.error('Database performance test failed', { error });
    return {
      connectionTime: -1,
      queryTime: -1,
      healthy: false,
    };
  }
}

/**
 * Reset query statistics (for testing)
 */
export function resetQueryStats() {
  queryStats.totalQueries = 0;
  queryStats.slowQueries = 0;
  queryStats.failedQueries = 0;
  queryStats.totalDuration = 0;
  queryStats.queryDurations = [];
  slowQueries.length = 0;
}

/**
 * Log current database performance summary
 */
export function logDatabaseSummary() {
  const stats = getDatabaseStats();

  logger.info('Database Performance Summary', {
    ...stats,
    recentSlowQueries: slowQueries.length,
  });

  // Log warnings if performance is degraded
  if (stats.p95Duration > 200) {
    logger.warn('High P95 query duration detected', {
      p95: stats.p95Duration,
      threshold: 200,
    });
  }

  if (parseFloat(stats.slowQueryRate) > 5) {
    logger.warn('High slow query rate detected', {
      rate: stats.slowQueryRate,
      threshold: '5%',
    });
  }

  if (parseFloat(stats.errorRate) > 1) {
    logger.error('High database error rate detected', {
      rate: stats.errorRate,
      threshold: '1%',
    });
  }
}

// Log summary every 5 minutes in production
let monitoringInterval: NodeJS.Timeout | null = null;
if (process.env.NODE_ENV === 'production') {
  monitoringInterval = setInterval(logDatabaseSummary, 5 * 60 * 1000);
}

// Graceful shutdown
process.on('beforeExit', async () => {
  // 🔧 P1 Fix: Clear monitoring interval to prevent memory leak
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }

  logDatabaseSummary();
  await prisma.$disconnect();
});
