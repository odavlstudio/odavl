/**
 * Database Optimization Utilities
 * Performance improvements for Prisma queries
 * 
 * Features:
 * - Connection pooling
 * - Query optimization
 * - Index recommendations
 * - Query caching
 * - Slow query logging
 */

import { cacheService, CacheNamespace } from '../services/cache';

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number; // Seconds
  cacheKey?: string;
  tags?: string[];
}

export interface ConnectionPoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds
};

// Recommended indexes for ODAVL tables
export const RECOMMENDED_INDEXES = {
  User: [
    { fields: ['email'], unique: true },
    { fields: ['organizationId'] },
    { fields: ['createdAt'] },
  ],
  Organization: [
    { fields: ['slug'], unique: true },
    { fields: ['createdAt'] },
  ],
  Project: [
    { fields: ['organizationId'] },
    { fields: ['slug'] },
    { fields: ['createdAt'] },
    { fields: ['organizationId', 'slug'], unique: true },
  ],
  InsightAnalysis: [
    { fields: ['projectId'] },
    { fields: ['organizationId'] },
    { fields: ['timestamp'] },
    { fields: ['projectId', 'timestamp'] },
  ],
  AutopilotLedger: [
    { fields: ['projectId'] },
    { fields: ['organizationId'] },
    { fields: ['runId'], unique: true },
    { fields: ['timestamp'] },
    { fields: ['projectId', 'timestamp'] },
  ],
  GuardianTestResult: [
    { fields: ['projectId'] },
    { fields: ['organizationId'] },
    { fields: ['testRunId'], unique: true },
    { fields: ['url'] },
    { fields: ['environment'] },
    { fields: ['timestamp'] },
    { fields: ['projectId', 'timestamp'] },
  ],
  Invitation: [
    { fields: ['email'] },
    { fields: ['organizationId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
  AuditLog: [
    { fields: ['organizationId'] },
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['timestamp'] },
    { fields: ['organizationId', 'timestamp'] },
  ],
  Report: [
    { fields: ['organizationId'] },
    { fields: ['projectId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] },
    { fields: ['organizationId', 'createdAt'] },
  ],
};

/**
 * Cached query wrapper
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: QueryOptions
): Promise<T> {
  if (!options?.cache) {
    return fetcher();
  }
  
  const cacheKey = options.cacheKey || `query:${key}`;
  
  return cacheService.getOrSet(
    cacheKey,
    fetcher,
    {
      namespace: CacheNamespace.QUERY_RESULT,
      ttl: options.cacheTTL || 300, // 5 minutes default
      tags: options.tags,
    }
  );
}

/**
 * Invalidate query cache by tag
 */
export async function invalidateQueryCache(tag: string): Promise<number> {
  return cacheService.invalidateByTag(tag);
}

/**
 * Slow query logger
 */
export function logSlowQuery(
  query: string,
  duration: number,
  threshold: number = 1000 // 1 second default
): void {
  if (duration > threshold) {
    console.warn(`🐌 Slow query detected (${duration}ms):`, query);
  }
}

/**
 * Query performance wrapper
 */
export async function withQueryLogging<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    logSlowQuery(queryName, duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query failed after ${duration}ms:`, queryName, error);
    throw error;
  }
}

/**
 * Batch query optimization
 */
export async function batchQuery<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Common query patterns
 */

// Paginated query with caching
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function paginatedQuery<T>(
  fetcher: (skip: number, take: number) => Promise<T[]>,
  counter: () => Promise<number>,
  options: {
    page: number;
    pageSize: number;
    cache?: boolean;
    cacheTTL?: number;
    cacheKey?: string;
  }
): Promise<PaginatedResult<T>> {
  const skip = (options.page - 1) * options.pageSize;
  const take = options.pageSize;
  
  const fetchData = async () => {
    const [data, total] = await Promise.all([
      fetcher(skip, take),
      counter(),
    ]);
    
    return {
      data,
      total,
      page: options.page,
      pageSize: options.pageSize,
      hasMore: skip + data.length < total,
    };
  };
  
  if (!options.cache) {
    return fetchData();
  }
  
  const cacheKey = options.cacheKey || `paginated:${options.page}:${options.pageSize}`;
  
  return cacheService.getOrSet(
    cacheKey,
    fetchData,
    {
      namespace: CacheNamespace.QUERY_RESULT,
      ttl: options.cacheTTL || 300,
    }
  );
}

/**
 * Index checking utilities
 */

export interface IndexInfo {
  table: string;
  fields: string[];
  unique?: boolean;
  exists: boolean;
}

export function checkMissingIndexes(
  existingIndexes: IndexInfo[],
  table: keyof typeof RECOMMENDED_INDEXES
): IndexInfo[] {
  const recommended = RECOMMENDED_INDEXES[table];
  if (!recommended) return [];
  
  const missing: IndexInfo[] = [];
  
  for (const rec of recommended) {
    const exists = existingIndexes.some(
      idx =>
        idx.table === table &&
        JSON.stringify(idx.fields) === JSON.stringify(rec.fields) &&
        idx.unique === rec.unique
    );
    
    if (!exists) {
      missing.push({
        table,
        fields: rec.fields,
        unique: rec.unique,
        exists: false,
      });
    }
  }
  
  return missing;
}

/**
 * Generate Prisma schema indexes
 */
export function generateIndexSchema(table: keyof typeof RECOMMENDED_INDEXES): string[] {
  const recommended = RECOMMENDED_INDEXES[table];
  if (!recommended) return [];
  
  return recommended.map(idx => {
    const fields = idx.fields.join(', ');
    const unique = idx.unique ? '[unique]' : '';
    return `  @@index([${fields}])${unique}`;
  });
}

/**
 * Query optimization suggestions
 */

export interface QueryOptimization {
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export function analyzeQuery(
  queryString: string,
  duration: number
): QueryOptimization[] {
  const suggestions: QueryOptimization[] = [];
  
  // Check for SELECT *
  if (queryString.includes('SELECT *')) {
    suggestions.push({
      issue: 'Selecting all columns',
      suggestion: 'Select only required fields using Prisma select clause',
      impact: 'medium',
    });
  }
  
  // Check for missing WHERE clause
  if (!queryString.includes('WHERE') && duration > 500) {
    suggestions.push({
      issue: 'Full table scan detected',
      suggestion: 'Add WHERE clause to filter results',
      impact: 'high',
    });
  }
  
  // Check for N+1 queries
  if (queryString.includes('LEFT JOIN') && duration > 1000) {
    suggestions.push({
      issue: 'Possible N+1 query',
      suggestion: 'Use Prisma include/select to eager load relations',
      impact: 'high',
    });
  }
  
  // Check for missing LIMIT
  if (!queryString.includes('LIMIT') && !queryString.includes('OFFSET')) {
    suggestions.push({
      issue: 'Unbounded result set',
      suggestion: 'Add pagination with take/skip',
      impact: 'medium',
    });
  }
  
  return suggestions;
}

/**
 * Connection pool monitoring
 */

export interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  total: number;
}

export function getPoolStats(): PoolStats {
  // TODO: Implement actual pool monitoring with Prisma
  return {
    active: 3,
    idle: 2,
    waiting: 0,
    total: 5,
  };
}

/**
 * Database health check
 */

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  responseTime: number;
  activeConnections: number;
  slowQueries: number;
}> {
  const startTime = Date.now();
  
  try {
    // TODO: Implement actual health check with Prisma
    // await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    const poolStats = getPoolStats();
    
    return {
      connected: true,
      responseTime,
      activeConnections: poolStats.active,
      slowQueries: 0, // TODO: Track from logs
    };
  } catch (error) {
    return {
      connected: false,
      responseTime: Date.now() - startTime,
      activeConnections: 0,
      slowQueries: 0,
    };
  }
}

/**
 * Query builder helpers
 */

// Build WHERE clause for date range
export function dateRangeFilter(field: string, start?: Date, end?: Date) {
  const filters: Record<string, unknown> = {};
  
  if (start) {
    filters[field] = { ...filters[field], gte: start };
  }
  
  if (end) {
    filters[field] = { ...filters[field], lte: end };
  }
  
  return Object.keys(filters).length > 0 ? filters : undefined;
}

// Build search filter for multiple fields
export function searchFilter(fields: string[], searchTerm: string) {
  if (!searchTerm) return undefined;
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    })),
  };
}

// Build sort clause
export function sortClause(
  field: string,
  direction: 'asc' | 'desc' = 'desc'
) {
  return { [field]: direction };
}
