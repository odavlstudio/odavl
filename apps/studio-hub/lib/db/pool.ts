/**
 * Database Connection Pool Configuration
 * Optimized for high-performance and concurrent connections
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from '@/lib/logger';

// Pool configuration optimized for production
const poolConfig: PoolConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,

  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
  min: parseInt(process.env.DB_POOL_MIN || '5'),  // Minimum pool size
  idleTimeoutMillis: 30000,                        // Close idle connections after 30s
  connectionTimeoutMillis: 2000,                   // Max wait time for connection

  // Query settings
  statement_timeout: 10000,                        // 10 second statement timeout
  query_timeout: 10000,                            // 10 second query timeout

  // Keep-alive settings (prevent connection drops)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  // SSL configuration (production with proper certificate validation)
  ssl: process.env.NODE_ENV === 'production'
    ? {
        rejectUnauthorized: true, // SECURE: Always validate certificates in production
        ca: process.env.DATABASE_CA_CERT, // CA certificate if needed
      }
    : undefined,
};

// Create connection pool
export const pool = new Pool(poolConfig);

// Track pool metrics
const poolMetrics = {
  connections: 0,
  queries: 0,
  errors: 0,
  acquireTime: [] as number[],
};

/**
 * Pool event handlers for monitoring
 */

// Track new connections
pool.on('connect', (client) => {
  poolMetrics.connections++;

  logger.info('Database connection established', {
    totalConnections: poolMetrics.connections,
    poolSize: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });

  // Send metric to monitoring service
  sendPoolMetric('db.pool.connect', 1);
});

// Track connection removal
pool.on('remove', (client) => {
  poolMetrics.connections--;

  logger.info('Database connection removed', {
    totalConnections: poolMetrics.connections,
    poolSize: pool.totalCount,
  });

  sendPoolMetric('db.pool.remove', 1);
});

// Track connection acquisition
pool.on('acquire', (client) => {
  const acquireStart = Date.now();

  // Track how long it takes to get a connection
  client.once('release', () => {
    const duration = Date.now() - acquireStart;
    poolMetrics.acquireTime.push(duration);

    // Keep only last 100 measurements
    if (poolMetrics.acquireTime.length > 100) {
      poolMetrics.acquireTime.shift();
    }

    if (duration > 1000) {
      logger.warn('Slow connection acquisition', {
        duration,
        poolSize: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      });
    }
  });
});

// Track pool errors
pool.on('error', (err, client) => {
  poolMetrics.errors++;

  logger.error('Unexpected database pool error', {
    error: err.message,
    stack: err.stack,
    totalErrors: poolMetrics.errors,
  });

  sendPoolMetric('db.pool.error', 1);

  // Alert if error rate is too high
  if (poolMetrics.errors > 10) {
    logger.error('High pool error rate detected', {
      errors: poolMetrics.errors,
      threshold: 10,
    });
  }
});

/**
 * Execute query with automatic connection management
 */
export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<T> {
  const start = Date.now();

  try {
    poolMetrics.queries++;
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow database query', {
        query: text.substring(0, 100),
        duration,
        params: params?.length,
      });
    }

    sendPoolMetric('db.query.duration', duration);

    return result.rows as T;
  } catch (error) {
    const duration = Date.now() - start;

    logger.error('Database query failed', {
      query: text.substring(0, 100),
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    sendPoolMetric('db.query.error', 1);
    throw error;
  }
}

/**
 * Execute transaction with automatic rollback on error
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');

    sendPoolMetric('db.transaction.success', 1);
    return result;
  } catch (error) {
    await client.query('ROLLBACK');

    logger.error('Transaction rolled back', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    sendPoolMetric('db.transaction.rollback', 1);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get current pool statistics
 */
export function getPoolStats() {
  const avgAcquireTime = poolMetrics.acquireTime.length > 0
    ? Math.round(
        poolMetrics.acquireTime.reduce((a, b) => a + b, 0) /
        poolMetrics.acquireTime.length
      )
    : 0;

  return {
    // Pool configuration
    maxConnections: poolConfig.max,
    minConnections: poolConfig.min,

    // Current state
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,

    // Metrics
    totalQueries: poolMetrics.queries,
    totalErrors: poolMetrics.errors,
    avgAcquireTime,

    // Health indicators
    utilizationRate: poolConfig.max
      ? ((pool.totalCount / poolConfig.max) * 100).toFixed(1) + '%'
      : 'N/A',
    errorRate: poolMetrics.queries > 0
      ? ((poolMetrics.errors / poolMetrics.queries) * 100).toFixed(2) + '%'
      : '0%',
  };
}

/**
 * Test pool health
 */
export async function testPoolHealth(): Promise<{
  healthy: boolean;
  connectionTime: number;
  queryTime: number;
  poolSize: number;
}> {
  try {
    // Test connection acquisition time
    const connStart = Date.now();
    const client = await pool.connect();
    const connectionTime = Date.now() - connStart;

    // Test query execution time
    const queryStart = Date.now();
    await client.query('SELECT 1');
    const queryTime = Date.now() - queryStart;

    client.release();

    const healthy = connectionTime < 100 && queryTime < 50;

    if (!healthy) {
      logger.warn('Pool health check failed', {
        connectionTime,
        queryTime,
        poolSize: pool.totalCount,
      });
    }

    return {
      healthy,
      connectionTime,
      queryTime,
      poolSize: pool.totalCount,
    };
  } catch (error) {
    logger.error('Pool health check error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      healthy: false,
      connectionTime: -1,
      queryTime: -1,
      poolSize: pool.totalCount,
    };
  }
}

/**
 * Send pool metrics to monitoring service
 */
function sendPoolMetric(metric: string, value: number) {
  if (process.env.NODE_ENV === 'production') {
    // Example: Datadog StatsD
    // statsd.gauge(metric, value);

    // For now, just log in development
    if (process.env.DEBUG_POOL_METRICS === 'true') {
      logger.debug('Pool metric', { metric, value });
    }
  }
}

/**
 * Log pool statistics summary
 */
export function logPoolSummary() {
  const stats = getPoolStats();

  logger.info('Connection Pool Summary', stats);

  // Warn if pool is heavily utilized
  const utilization = parseFloat(stats.utilizationRate);
  if (utilization > 80) {
    logger.warn('High pool utilization detected', {
      utilization: stats.utilizationRate,
      threshold: '80%',
      recommendation: 'Consider increasing pool size',
    });
  }

  // Warn if too many waiting requests
  if (stats.waitingRequests > 10) {
    logger.warn('High number of waiting requests', {
      waiting: stats.waitingRequests,
      threshold: 10,
      recommendation: 'Pool may be undersized',
    });
  }
}

// Log pool summary every 5 minutes in production
let poolInterval: NodeJS.Timeout | null = null;
if (process.env.NODE_ENV === 'production') {
  poolInterval = setInterval(logPoolSummary, 5 * 60 * 1000);
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Closing database connection pool...');
  logPoolSummary();

  // 🔧 P1 Fix: Clear pool interval to prevent memory leak
  if (poolInterval) {
    clearInterval(poolInterval);
    poolInterval = null;
  }

  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);
