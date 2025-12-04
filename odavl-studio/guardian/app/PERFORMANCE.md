# Guardian Performance Optimization Guide

This document describes the performance optimizations implemented in Guardian and best practices for maintaining optimal performance.

## Overview

Guardian implements multiple layers of performance optimization:

1. **Database Optimization**: Indexes, connection pooling, query optimization
2. **Caching Strategy**: Two-level cache (Memory L1 + Redis L2)
3. **API Optimization**: Response compression, efficient data fetching
4. **Monitoring**: Slow query logging, performance profiling

## Database Optimization

### Indexes

The following indexes have been added to improve query performance:

#### Organizations

```prisma
@@index([slug])
@@index([tier, status])
@@index([status, tier])          // For filtering active orgs by tier
@@index([createdAt])              // For chronological queries
```

**Usage**: Organization lookups by slug, filtering by status/tier, recent organizations

#### Members

```prisma
@@index([organizationId, role])
@@index([email])                  // For user lookups across organizations
@@index([lastActive])             // For activity tracking
```

**Usage**: Permission checks, member lookups, activity tracking

#### Projects

```prisma
@@index([organizationId])
@@index([teamId])
@@index([createdAt])
@@index([organizationId, createdAt]) // Composite for org-specific time queries
```

**Usage**: Project listing by organization, recent projects, team projects

#### Test Runs

```prisma
@@index([projectId, type, status])
@@index([startedAt])
@@index([status, startedAt])       // Filtering by status with time
@@index([completedAt])             // Completed tests queries
```

**Usage**: Test history, filtering by status/type, analytics queries

#### Monitors

```prisma
@@index([projectId, enabled])
@@index([type, enabled])           // Active monitors by type
@@index([updatedAt])               // Recent changes
```

**Usage**: Active monitor checks, monitor listing, configuration changes

#### Monitor Checks

```prisma
@@index([monitorId, checkedAt])
@@index([status])
@@index([status, checkedAt])       // Filtering by status with time
@@index([responseTime])            // Performance analysis
```

**Usage**: Uptime calculations, status filtering, performance trending

#### Alerts

```prisma
@@index([resolved, severity])
@@index([createdAt])
@@index([type, resolved])          // Unresolved alerts by type
@@index([severity, createdAt])     // Critical alerts chronologically
```

**Usage**: Unresolved alert queries, severity filtering, alert history

### Connection Pooling

Prisma connection pooling configured via DATABASE_URL parameters:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=5"
```

**Configuration**:

- `connection_limit=10`: Max 10 concurrent connections (adjust based on load)
- `pool_timeout=5`: 5-second timeout for acquiring connection

**Recommendations**:

- **Development**: 5-10 connections
- **Production (single instance)**: 10-20 connections
- **Production (multiple instances)**: `total_connections / instance_count`
- **Serverless**: 1-2 connections per function (short-lived)

### Slow Query Logger

Automatically tracks database queries exceeding threshold (default: 100ms).

**Configuration**:

```env
SLOW_QUERY_THRESHOLD=100  # milliseconds
```

**Usage**:

```typescript
// Automatically integrated via Prisma middleware
// View slow queries:
const stats = await fetch('/api/performance/slow-queries');

// Statistics include:
// - Total queries executed
// - Slow query count and percentage
// - Average and max duration
// - Top 10 slowest queries
```

**Best Practices**:

1. Review slow queries weekly
2. Add indexes for frequently slow queries
3. Optimize N+1 queries (use `include` or `select`)
4. Consider caching for expensive queries

## Caching Strategy

Guardian implements a two-level caching system:

### Level 1: In-Memory Cache (LRU)

Fast, process-local cache using LRU (Least Recently Used) eviction.

**Configuration**:

- **Default TTL**: 60 seconds (1 minute)
- **Max Items**: 1000 (configurable per cache type)

**Cache Types**:

```typescript
// Organization configs (hot data)
CacheType.ORGANIZATION  // Max: 500 items, TTL: 60s

// API key mappings (rate limit checks)
CacheType.API_KEY       // Max: 2000 items, TTL: 60s

// General-purpose cache
CacheType.GENERAL       // Max: 1000 items, TTL: 60s
```

**Usage**:

```typescript
import { memoryCacheGetOrSet, CacheType, MemoryCacheKeys } from '@/lib/memory-cache';

// Get or compute organization config
const orgConfig = await memoryCacheGetOrSet(
  MemoryCacheKeys.orgConfig(orgId),
  async () => await prisma.organization.findUnique({ where: { id: orgId } }),
  CacheType.ORGANIZATION,
  60000 // 60 seconds
);

// Get cache statistics
const stats = memoryCacheAllStats();
console.log('Organization cache:', stats.organization.size, '/', stats.organization.max);
```

**Best Practices**:

1. Use for **hot data** (frequently accessed)
2. Keep TTL short (30-60 seconds) to balance freshness vs performance
3. Monitor cache hit rate (should be > 80% for hot data)
4. Clear cache on relevant mutations (e.g., org update → clear org cache)

### Level 2: Redis Cache

Distributed cache shared across all instances.

**Configuration**:

```env
REDIS_URL="redis://localhost:6379"
```

**Default TTL**: 300 seconds (5 minutes)

**Usage**:

```typescript
import { cacheGetOrSet, CacheKeys } from '@/lib/cache';

// Cache expensive query results
const testStats = await cacheGetOrSet(
  CacheKeys.testRunStats(projectId),
  async () => {
    // Expensive aggregation query
    return await prisma.testRun.aggregate({
      where: { projectId },
      _count: true,
      _avg: { duration: true }
    });
  },
  { ttl: 300 } // 5 minutes
);

// Invalidate cache on mutation
await cacheDelete(CacheKeys.testRunStats(projectId));
```

**Cache Key Patterns**:

```typescript
CacheKeys.organization(id)           // org:${id}
CacheKeys.project(id)                // project:${id}
CacheKeys.testRunStats(projectId)    // project:${projectId}:stats
CacheKeys.analytics(orgId, period)   // analytics:${orgId}:${period}
```

**Best Practices**:

1. Use for **expensive queries** (aggregations, joins)
2. Set appropriate TTL based on data freshness requirements
3. Use pattern-based invalidation (e.g., `org:${id}:*`)
4. Monitor Redis memory usage (set `maxmemory` + eviction policy)

### Multi-Level Caching

Combine both caches for optimal performance:

```typescript
import { multiLevelCache } from '@/lib/memory-cache';

const orgData = await multiLevelCache(
  'org:123:config',
  async () => await fetchOrgConfig('123'),
  {
    memoryType: CacheType.ORGANIZATION,
    memoryTTL: 60000,   // 60 seconds in memory
    redisTTL: 300,      // 5 minutes in Redis
    redisPrefix: 'guardian'
  }
);
```

**Flow**:

1. Check memory cache (L1) → **~1ms latency**
2. If miss, check Redis (L2) → **~5ms latency**
3. If miss, compute value → **100-1000ms latency**
4. Store in both caches

**Best Practices**:

1. Use multi-level cache for **most frequently accessed data**
2. Memory TTL < Redis TTL (e.g., 60s vs 300s)
3. Memory cache hit rate should be > 90% for hot data

## API Response Compression

Guardian automatically compresses API responses using gzip/Brotli.

**Configuration**:

- **Threshold**: 1KB (responses < 1KB not compressed)
- **Level**: 6 (balanced speed vs size)
- **Algorithms**: Brotli (preferred) or gzip (fallback)

**Excluded Content Types**:

- Images (JPEG, PNG, GIF, WebP, SVG)
- Videos (MP4, WebM)
- Audio (MP3, WAV)
- Archives (ZIP, GZIP, TAR)
- PDFs

**Compression Ratios** (typical):

- JSON responses: **60-80% reduction**
- HTML responses: **70-90% reduction**
- CSV exports: **80-90% reduction**

**Best Practices**:

1. Always send `Accept-Encoding: gzip, br` header
2. Cache compressed responses in CDN
3. Add `Vary: Accept-Encoding` header
4. Monitor compression ratio in metrics

## Performance Profiling

### CPU Profiling

Identify performance bottlenecks and hot code paths.

**Usage**:

```bash
# Start CPU profiling
curl -X POST http://localhost:3000/api/performance/profile \
  -d '{"action": "start-cpu"}'

# Perform the operation to profile
# (e.g., run load test, execute slow endpoint)

# Stop profiling and save
curl -X POST http://localhost:3000/api/performance/profile \
  -d '{"action": "stop-cpu"}'

# Open .cpuprofile file in Chrome DevTools Performance panel
```

**Analysis**:

1. Sort by "Self Time" to find hotspots
2. Look for unexpected synchronous operations
3. Check for excessive object allocations
4. Optimize or parallelize heavy computations

### Heap Snapshots

Detect memory leaks and analyze object retention.

**Usage**:

```bash
# Take baseline snapshot
curl -X POST http://localhost:3000/api/performance/profile \
  -d '{"action": "heap-snapshot"}'

# Perform memory-intensive operation

# Take second snapshot
curl -X POST http://localhost:3000/api/performance/profile \
  -d '{"action": "heap-snapshot"}'

# Compare snapshots in Chrome DevTools Memory panel
```

**Analysis**:

1. Use "Comparison" view to see memory growth
2. Look for unexpected object retention
3. Check for large arrays/objects not being garbage collected
4. Identify circular references

## Performance Monitoring

### Metrics (Prometheus)

Key performance metrics exposed at `/api/metrics`:

```promql
# Database query duration (95th percentile)
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))

# HTTP request duration by endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route)

# Cache hit rate (memory)
rate(memory_cache_hits_total[5m]) / (rate(memory_cache_hits_total[5m]) + rate(memory_cache_misses_total[5m]))

# Slow query rate
rate(slow_queries_total[5m])
```

### Slow Query Statistics

View slow query statistics:

```bash
curl http://localhost:3000/api/performance/slow-queries
```

**Response**:

```json
{
  "success": true,
  "stats": {
    "threshold": 100,
    "totalQueries": 1250,
    "slowQueries": 18,
    "slowQueryPercentage": 1.44,
    "avgDuration": 45.2,
    "maxDuration": 234.5,
    "slowestQueries": [
      {
        "query": "TestRun.findMany",
        "duration": 234.5,
        "timestamp": "2025-01-09T..."
      }
    ]
  }
}
```

## Performance Best Practices

### Database Queries

1. **Use indexes** for frequently queried fields
2. **Avoid N+1 queries** (use `include` or batch queries)
3. **Limit result sets** (always use `take` parameter)
4. **Select only needed fields** (use `select` instead of fetching all)
5. **Use pagination** for large result sets

**Bad**:

```typescript
// N+1 query antipattern
const projects = await prisma.project.findMany();
for (const project of projects) {
  const tests = await prisma.testRun.findMany({ where: { projectId: project.id } });
}
```

**Good**:

```typescript
// Single query with include
const projects = await prisma.project.findMany({
  include: { testRuns: { take: 10, orderBy: { startedAt: 'desc' } } }
});
```

### API Design

1. **Paginate large responses** (use cursor or offset pagination)
2. **Implement field filtering** (allow clients to request specific fields)
3. **Use ETags** for conditional requests (304 Not Modified)
4. **Batch operations** (combine multiple requests into one)
5. **Stream large responses** (use chunked transfer encoding)

### Caching

1. **Cache expensive operations** (aggregations, complex joins)
2. **Set appropriate TTLs** (balance freshness vs performance)
3. **Invalidate on mutation** (clear cache when data changes)
4. **Use cache warming** (preload hot data on startup)
5. **Monitor cache hit rates** (should be > 80%)

### Resource Management

1. **Close connections** (database, Redis, HTTP)
2. **Limit concurrent requests** (use rate limiting)
3. **Set timeouts** (avoid hanging requests)
4. **Use connection pooling** (reuse connections)
5. **Clean up resources** (remove expired data, old snapshots)

## Troubleshooting

### High Database Load

**Symptoms**: Slow query times, connection timeouts, high CPU on database

**Solutions**:

1. Check slow query log (`/api/performance/slow-queries`)
2. Add missing indexes (run `EXPLAIN` on slow queries)
3. Increase connection pool size (if connections exhausted)
4. Optimize N+1 queries (use `include` or batch)
5. Add caching for expensive queries

### High Memory Usage

**Symptoms**: Out of memory errors, slow performance, process crashes

**Solutions**:

1. Take heap snapshot (`/api/performance/profile`)
2. Identify memory leaks (compare snapshots)
3. Reduce cache size (lower `max` config)
4. Clear old data (implement cleanup jobs)
5. Increase Node.js memory limit (`NODE_OPTIONS=--max-old-space-size=4096`)

### Low Cache Hit Rate

**Symptoms**: Cache hit rate < 70%, high database load

**Solutions**:

1. Check cache statistics (`memoryCacheAllStats()`)
2. Increase cache size (higher `max` value)
3. Increase TTL (if data freshness allows)
4. Review cache key patterns (ensure consistent keys)
5. Add cache warming (preload on startup)

### Slow API Responses

**Symptoms**: High latency (> 200ms), timeout errors

**Solutions**:

1. Check Prometheus metrics (identify slow endpoints)
2. Run CPU profiling (find hotspots)
3. Add caching (expensive operations)
4. Optimize database queries (add indexes)
5. Enable compression (reduce bandwidth)

## Production Checklist

- [ ] Database indexes created and migrated
- [ ] Connection pooling configured (`connection_limit`)
- [ ] Slow query logger enabled (`SLOW_QUERY_THRESHOLD`)
- [ ] Redis cache configured and tested
- [ ] Memory cache limits set appropriately
- [ ] API response compression enabled
- [ ] Prometheus metrics endpoint exposed
- [ ] Slow query monitoring alerts configured
- [ ] Performance profiling tools documented
- [ ] Cache invalidation implemented for mutations
- [ ] CDN configured for static assets
- [ ] Rate limiting enabled
- [ ] Resource cleanup jobs scheduled

## Additional Resources

- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Index Tuning](https://www.postgresql.org/docs/current/indexes.html)
