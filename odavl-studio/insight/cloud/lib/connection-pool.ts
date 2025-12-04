/**
 * Database Connection Pool Configuration
 * Optimizes PostgreSQL connections for production workloads
 */

import { Pool, PoolConfig } from 'pg';
import { Redis } from '@upstash/redis';

/**
 * Pool configuration based on environment
 */
export const getPoolConfig = (): PoolConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Connection string
    connectionString: process.env.DATABASE_URL,

    // Pool size configuration
    max: isProduction ? 20 : 10, // Maximum connections in pool
    min: isProduction ? 5 : 2, // Minimum connections to maintain
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // Return error if connection takes > 5s

    // Performance optimizations
    allowExitOnIdle: false, // Keep pool alive
    maxUses: 7500, // Close connection after 7500 uses (prevents memory leaks)

    // SSL configuration
    ssl: isProduction
      ? {
          rejectUnauthorized: true,
          ca: process.env.DATABASE_CA_CERT,
        }
      : false,

    // Application name for monitoring
    application_name: 'odavl-insight-cloud',

    // Query timeout
    query_timeout: 30000, // 30 seconds

    // Statement timeout (server-side)
    statement_timeout: 60000, // 60 seconds
  };
};

/**
 * Global connection pool instance
 */
let pool: Pool | null = null;

/**
 * Get or create connection pool
 */
export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool(getPoolConfig());

    // Handle pool errors
    pool.on('error', (err, client) => {
      console.error('Unexpected pool error:', err);
    });

    // Log pool events in development
    if (process.env.NODE_ENV === 'development') {
      pool.on('connect', (client) => {
        console.log('New client connected to pool');
      });

      pool.on('acquire', (client) => {
        console.log('Client acquired from pool');
      });

      pool.on('remove', (client) => {
        console.log('Client removed from pool');
      });
    }
  }

  return pool;
};

/**
 * Connection pool statistics
 */
export const getPoolStats = () => {
  if (!pool) {
    return null;
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

/**
 * Query cache using Redis
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Cached query execution
 * Caches query results in Redis for faster subsequent requests
 */
export async function cachedQuery<T = any>(
  query: string,
  params: any[] = [],
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  const pool = getPool();

  // Generate cache key from query and params
  const cacheKey = `query:${Buffer.from(query + JSON.stringify(params)).toString('base64')}`;

  // Try to get from cache first
  const cached = await redis.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Execute query
  const result = await pool.query(query, params);

  // Cache the result
  await redis.set(cacheKey, result.rows, { ex: ttl });

  return result.rows as T;
}

/**
 * Prepared statement cache
 * Improves performance by reusing parsed queries
 */
const preparedStatements = new Map<string, string>();

/**
 * Execute query with prepared statement
 */
export async function preparedQuery<T = any>(
  name: string,
  query: string,
  params: any[] = []
): Promise<T> {
  const pool = getPool();

  // Check if statement is already prepared
  if (!preparedStatements.has(name)) {
    // Prepare statement
    await pool.query({
      name,
      text: query,
    });
    preparedStatements.set(name, query);
  }

  // Execute prepared statement
  const result = await pool.query({
    name,
    values: params,
  });

  return result.rows as T;
}

/**
 * Transaction helper with automatic rollback
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Batch insert optimization
 * Inserts multiple rows in a single query
 */
export async function batchInsert(
  table: string,
  columns: string[],
  rows: any[][]
): Promise<void> {
  if (rows.length === 0) return;

  const pool = getPool();

  // Build VALUES clause
  const values = rows
    .map((row, i) => {
      const placeholders = columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ');
      return `(${placeholders})`;
    })
    .join(', ');

  // Flatten rows array
  const params = rows.flat();

  // Execute batch insert
  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${values}
  `;

  await pool.query(query, params);
}

/**
 * Graceful pool shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  latency: number;
  poolStats: ReturnType<typeof getPoolStats>;
}> {
  const start = Date.now();

  try {
    const pool = getPool();
    await pool.query('SELECT 1');

    return {
      healthy: true,
      latency: Date.now() - start,
      poolStats: getPoolStats(),
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      poolStats: getPoolStats(),
    };
  }
}

export default getPool;
