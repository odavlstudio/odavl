# 🚀 Performance Optimization Guide

Complete guide to ODAVL Studio's performance optimization features.

## 📋 Table of Contents

- [Overview](#overview)
- [Redis Caching](#redis-caching)
- [CDN Integration](#cdn-integration)
- [Rate Limiting](#rate-limiting)
- [Database Optimization](#database-optimization)
- [APM Monitoring](#apm-monitoring)
- [Best Practices](#best-practices)

## Overview

ODAVL Studio uses multiple layers of performance optimization:

1. **Redis Cache** - Fast in-memory caching for API responses, sessions, and rate limiting
2. **CDN** - Global content delivery for static assets
3. **Rate Limiting** - Protect APIs from abuse
4. **Database Optimization** - Query caching, connection pooling, indexes
5. **APM Monitoring** - Real-time performance tracking

**Target Performance Metrics:**
- API Response Time: < 100ms (p95)
- Cache Hit Rate: > 90%
- Database Query Time: < 50ms (p95)
- CDN Hit Rate: > 95%
- Page Load Time: < 2 seconds

---

## Redis Caching

### Setup

```bash
# Docker (Development)
docker run -d -p 6379:6379 redis:7-alpine

# Environment Variable
REDIS_URL=redis://localhost:6379
```

### Usage

```typescript
import { cacheService, CacheNamespace } from '@/packages/core/src/services/cache';

// Simple cache
const user = await cacheService.getOrSet(
  'user:123',
  async () => await prisma.user.findUnique({ where: { id: '123' } }),
  {
    namespace: CacheNamespace.USER,
    ttl: 3600, // 1 hour
    tags: ['user:123'],
  }
);

// Session management
await cacheService.setSession('session-abc', { userId: '123', role: 'admin' });
const session = await cacheService.getSession('session-abc');

// Rate limiting
const result = await cacheService.checkRateLimit('user:123', {
  windowSeconds: 60,
  maxRequests: 10,
});

if (!result.allowed) {
  throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
}
```

### Invalidation Strategies

```typescript
// By tag
await cacheService.invalidateByTag('user:123'); // Clear all user:123 data

// By namespace
await cacheService.invalidateByNamespace(CacheNamespace.USER); // Clear all users

// Specific key
await cacheService.delete('user:123', { namespace: CacheNamespace.USER });
```

### Cache Warming

```typescript
// Preload critical data
await cacheService.warm([
  {
    key: 'org:abc',
    fetcher: async () => await prisma.organization.findUnique({ where: { id: 'abc' } }),
    options: { namespace: CacheNamespace.ORGANIZATION, ttl: 3600 },
  },
  {
    key: 'projects:abc',
    fetcher: async () => await prisma.project.findMany({ where: { organizationId: 'abc' } }),
    options: { namespace: CacheNamespace.PROJECT, ttl: 1800 },
  },
]);
```

### Statistics

```typescript
const stats = cacheService.getStats();
console.log({
  hits: stats.hits,
  misses: stats.misses,
  hitRate: stats.hitRate, // %
  totalKeys: stats.totalKeys,
  memoryUsage: stats.memoryUsage, // bytes
});
```

---

## CDN Integration

### Supported Providers

- **CloudFlare** (Recommended)
- **AWS CloudFront**
- **Azure CDN**

### Setup

```bash
# Environment Variables
CDN_ENABLED=true
CDN_PROVIDER=CLOUDFLARE
CDN_DOMAIN=cdn.odavl.studio
CLOUDFLARE_ZONE_ID=your-zone-id
CDN_API_KEY=your-api-key
```

### Usage

```typescript
import { cdnService } from '@/packages/core/src/services/cdn';

// Get asset URL
const url = cdnService.getAssetUrl('/static/logo.png');
// → https://cdn.odavl.studio/static/logo.png

// Optimized image
const optimizedUrl = cdnService.getOptimizedImageUrl('/images/hero.jpg', {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85,
});

// Preload critical assets
const headers = cdnService.preloadAssets([
  '/static/main.css',
  '/static/main.js',
  '/fonts/inter-var.woff2',
]);
```

### Cache Purging

```typescript
// Purge specific files
await cdnService.purge({
  paths: [
    'https://cdn.odavl.studio/static/old-logo.png',
    'https://cdn.odavl.studio/api/v1/status',
  ],
});

// Purge by tag
await cdnService.purge({
  tags: ['product-images', 'api-responses'],
});

// Purge everything (emergency)
await cdnService.purge({
  purgeEverything: true,
});
```

### Recommended Cache Rules

```typescript
const rules = cdnService.getRecommendedRules();

// Static assets: 1 year
// Images: 1 week
// Fonts: 1 month
// CSS/JS: 1 day
// API responses: 5 minutes
// Reports: 1 hour
```

---

## Rate Limiting

### Tiers

| Tier | Per Minute | Per Hour | Per Day |
|------|------------|----------|---------|
| Free | 10 | 100 | 1,000 |
| Pro | 60 | 1,000 | 10,000 |
| Team | 120 | 5,000 | 50,000 |
| Enterprise | 300 | 20,000 | 200,000 |

### Usage

```typescript
import { rateLimitMiddleware, withRateLimit } from '@/packages/core/src/middleware/rate-limit';

// Next.js API route
export const GET = withRateLimit({
  windowSeconds: 60,
  maxRequests: 10,
  identifier: 'apiKey',
})(async (request: NextRequest) => {
  // Your handler
  return NextResponse.json({ success: true });
});

// Manual check
const rateLimitResponse = await rateLimitMiddleware(request, {
  windowSeconds: 300,
  maxRequests: 5,
});

if (rateLimitResponse) {
  return rateLimitResponse; // 429 Too Many Requests
}
```

### Response Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-01-10T12:00:00.000Z
Retry-After: 45
```

---

## Database Optimization

### Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Environment
DATABASE_URL="postgresql://user:pass@localhost:5432/odavl?connection_limit=10&pool_timeout=5"
```

### Query Caching

```typescript
import { cachedQuery } from '@/packages/core/src/utils/database';

const users = await cachedQuery(
  'org:abc:users',
  async () => await prisma.user.findMany({ where: { organizationId: 'abc' } }),
  {
    cache: true,
    cacheTTL: 600, // 10 minutes
    tags: ['org:abc', 'users'],
  }
);

// Invalidate on mutation
await prisma.user.create({ data: { ... } });
await invalidateQueryCache('users');
```

### Recommended Indexes

```prisma
model User {
  id             String  @id @default(cuid())
  email          String  @unique
  organizationId String
  createdAt      DateTime @default(now())
  
  @@index([email])
  @@index([organizationId])
  @@index([createdAt])
}

model Project {
  id             String @id @default(cuid())
  slug           String
  organizationId String
  createdAt      DateTime @default(now())
  
  @@index([organizationId])
  @@index([slug])
  @@index([createdAt])
  @@unique([organizationId, slug])
}
```

### Slow Query Logging

```typescript
import { withQueryLogging } from '@/packages/core/src/utils/database';

const result = await withQueryLogging(
  'findManyProjects',
  async () => await prisma.project.findMany()
);

// Logs: 🐌 Slow query detected (1234ms): findManyProjects
```

---

## APM Monitoring

### Setup

```bash
# New Relic
APM_ENABLED=true
APM_PROVIDER=newrelic
APM_API_KEY=your-new-relic-key
APM_APP_NAME=ODAVL Studio

# Datadog
APM_PROVIDER=datadog
APM_API_KEY=your-datadog-key
```

### Usage

```typescript
import { apmService, traced, ODAPVLMetrics } from '@/packages/core/src/services/apm';

// Automatic transaction tracking
class SyncService {
  @traced('SyncService.processInsight')
  async processInsight(data: InsightData) {
    // Automatically tracked
  }
}

// Manual metrics
ODAPVLMetrics.syncJobStarted('insight');
ODAPVLMetrics.cacheHit('user');
ODAPVLMetrics.rateLimitExceeded('user:123', '/api/v1/sync/insight');

// Custom metrics
apmService.recordMetric({
  name: 'custom.metric',
  value: 42,
  unit: 'count',
  tags: { environment: 'production' },
});

// Error tracking
try {
  await riskyOperation();
} catch (error) {
  apmService.recordError({
    message: error.message,
    stack: error.stack,
    severity: 'high',
  });
}
```

### Performance Summary

```typescript
const summary = apmService.getPerformanceSummary();
console.log({
  totalTransactions: summary.totalTransactions,
  averageDuration: summary.averageDuration, // ms
  errorRate: summary.errorRate, // %
  metrics: summary.metrics,
});
```

---

## Best Practices

### 1. Cache Strategy

```typescript
// Cache frequently accessed data
✅ User profiles (1 hour TTL)
✅ Organization settings (30 minutes TTL)
✅ Project metadata (15 minutes TTL)
✅ API responses (5 minutes TTL)

// Don't cache
❌ Sensitive data (passwords, tokens)
❌ Real-time data (live metrics)
❌ User-specific actions (mutations)
```

### 2. Rate Limiting

```typescript
// Tier-based limits
✅ Different limits per subscription tier
✅ Lower limits for auth endpoints
✅ Higher limits for sync endpoints
✅ Organization-level quotas

// Response strategy
✅ Return 429 with Retry-After header
✅ Include X-RateLimit-* headers
✅ Log rate limit violations
```

### 3. Database Queries

```typescript
// Optimize queries
✅ Select only needed fields
✅ Use pagination (take/skip)
✅ Add indexes on filtered columns
✅ Eager load relations (include)
✅ Cache expensive queries

// Avoid
❌ SELECT * (use select clause)
❌ N+1 queries (use include)
❌ Full table scans (add WHERE)
❌ Unbounded results (add LIMIT)
```

### 4. CDN Usage

```typescript
// Use CDN for
✅ Static assets (/static/*)
✅ Images, fonts, CSS, JS
✅ API responses (with short TTL)
✅ Reports and exports

// Cache times
✅ Static assets: 1 year
✅ Images: 1 week
✅ CSS/JS: 1 day
✅ API: 5 minutes
```

### 5. Monitoring

```typescript
// Track metrics
✅ API response times (p50, p95, p99)
✅ Cache hit rates
✅ Database query durations
✅ CDN bandwidth usage
✅ Rate limit violations
✅ Error rates

// Set alerts
✅ Response time > 1s
✅ Cache hit rate < 80%
✅ Error rate > 1%
✅ Database connections > 80%
```

---

## Performance Checklist

- [ ] Redis cache configured
- [ ] CDN enabled and purging tested
- [ ] Rate limiting applied to all endpoints
- [ ] Database indexes created
- [ ] Query caching implemented
- [ ] APM monitoring active
- [ ] Slow query logging enabled
- [ ] Cache warming for critical data
- [ ] Performance tests passing
- [ ] Monitoring dashboards set up

---

## Troubleshooting

### Cache Not Working

```bash
# Check Redis connection
redis-cli ping
# → PONG

# Check cache stats
const stats = cacheService.getStats();
console.log(stats.hitRate); // Should be > 80%
```

### High API Latency

```typescript
// Check slow queries
const summary = apmService.getPerformanceSummary();
console.log(summary.averageDuration); // Should be < 100ms

// Enable query logging
await withQueryLogging('findUsers', async () => {
  // Query here
});
```

### Rate Limit False Positives

```typescript
// Check rate limit info
const info = await getRateLimitInfo('user:123', 'PRO');
console.log(info.limits);

// Reset rate limit
await resetRateLimit('user:123');
```

---

## Additional Resources

- [Redis Documentation](https://redis.io/docs)
- [CloudFlare CDN Guide](https://developers.cloudflare.com/cdn/)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [New Relic APM](https://docs.newrelic.com/docs/apm/)

---

**Need help?** Contact support at support@odavl.studio
