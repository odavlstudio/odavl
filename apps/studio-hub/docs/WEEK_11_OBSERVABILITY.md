# Observability & Monitoring Setup

## Week 11 Implementation Complete ✅

### Features Implemented

1. **Sentry Error Tracking**
   - Automatic error capture with source maps
   - Performance monitoring with distributed tracing
   - Profiling for CPU bottlenecks
   - Custom error filtering and enrichment

2. **Performance Monitoring**
   - Web Vitals tracking (LCP, FID, CLS, TTFB, INP)
   - API call performance tracking
   - Database query monitoring
   - Component render time tracking
   - Automatic metric aggregation

3. **Database Monitoring**
   - Query performance tracking
   - Slow query detection (>1000ms)
   - Connection pool monitoring
   - Health check endpoint
   - Query result size monitoring

4. **Middleware Instrumentation**
   - Request ID tracking for distributed tracing
   - Security headers (CSP, X-Frame-Options, etc.)
   - Performance metric collection
   - Request duration tracking

5. **Health Check Endpoint**
   - `/api/health` - System health status
   - Database connectivity check
   - Memory usage monitoring
   - System uptime tracking
   - Status: healthy/degraded/unhealthy

6. **Custom Metrics API**
   - `/api/analytics/metrics` - Store and retrieve metrics
   - Automatic aggregation (avg, min, max)
   - Time range filtering (24h, 7d, 30d)
   - User-scoped metrics

7. **Monitoring Dashboard**
   - `/monitoring` - Real-time system status
   - Database health visualization
   - Memory usage graphs
   - Performance metrics display
   - 24-hour metric history

### Configuration

**Environment Variables Required:**
```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=studio-hub

# App Version
NEXT_PUBLIC_APP_VERSION=2.0.0

# Performance
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1
```

**Prisma Migration:**
```bash
cd apps/studio-hub
pnpm prisma migrate dev --name add_performance_metrics
pnpm prisma generate
```

### Usage Examples

**Track Custom Metric:**
```typescript
import { performanceMonitor } from '@/lib/monitoring/performance';

performanceMonitor.track({
  name: 'custom.metric',
  value: 42,
  unit: 'count',
  tags: { feature: 'dashboard' }
});
```

**Track API Call:**
```typescript
import { trackedFetch } from '@/lib/monitoring/performance';

const response = await trackedFetch('/api/data');
```

**Monitor Component:**
```typescript
import { usePerformanceTracking } from '@/lib/monitoring/performance';

function MyComponent() {
  const trackComplete = usePerformanceTracking('MyComponent');
  
  useEffect(() => {
    return () => trackComplete?.();
  }, []);
}
```

**Database Query with Monitoring:**
```typescript
import { prisma } from '@/lib/monitoring/database';

const users = await prisma.user.findMany(); // Auto-tracked
```

### Monitoring Endpoints

- **Health Check:** `GET /api/health`
  - Returns: status, database health, memory usage, uptime
  
- **Metrics Storage:** `POST /api/analytics/metrics`
  - Body: `{ metrics: [{ name, value, unit, tags }] }`
  
- **Metrics Query:** `GET /api/analytics/metrics?name=X&range=24h`
  - Returns: aggregated metrics (avg, min, max, count)
  
- **Dashboard:** `GET /monitoring`
  - Visual interface for all metrics

### Performance Thresholds

- **Slow Queries:** >1000ms (warning logged)
- **Large Results:** >1MB (warning logged)
- **Memory Usage:** >90% (degraded status)
- **Database Response:** >500ms (degraded status)

### Sentry Integration

- **Automatic Capture:**
  - Unhandled exceptions
  - Promise rejections
  - Console errors (production)
  - Slow queries
  - Failed database connections

- **Custom Context:**
  - User ID
  - Organization ID
  - Request ID
  - Environment
  - Release version

### Next Steps (Week 12)

1. Security Hardening
   - Rate limiting with Redis
   - CSRF protection
   - API authentication
   - Input validation

2. Additional Monitoring
   - Log aggregation
   - Custom dashboards
   - Alerting rules
   - SLO tracking

### Files Created (8 files)

1. `instrumentation.ts` - Sentry initialization
2. `lib/monitoring/performance.ts` - Performance tracking
3. `lib/monitoring/database.ts` - Database monitoring
4. `app/api/health/route.ts` - Health check endpoint
5. `app/api/analytics/metrics/route.ts` - Metrics API
6. `app/(dashboard)/monitoring/page.tsx` - Monitoring dashboard
7. `.env.monitoring.example` - Environment template
8. `sentry.config.ts` - Sentry Next.js config
9. `prisma/schema.prisma` - Added PerformanceMetric model

### Packages Installed

- `@sentry/nextjs@10.23.0` - Error tracking
- `@sentry/profiling-node@10.26.0` - CPU profiling
- `@opentelemetry/api@1.9.0` - Tracing API
- `@opentelemetry/sdk-node@0.208.0` - Node SDK
- `@opentelemetry/auto-instrumentations-node@0.67.0` - Auto-instrumentation
- `@opentelemetry/instrumentation@0.208.0` - Instrumentation helpers
- `@opentelemetry/exporter-trace-otlp-http@0.208.0` - OTLP exporter
