# Guardian Observability Stack

Complete monitoring, tracing, and metrics solution for ODAVL Guardian.

## Components

### 1. Prometheus (Metrics)

- **Port**: 9090
- **Endpoint**: <http://localhost:9090>
- **Scrapes**: `/api/metrics` every 10 seconds
- **Metrics Types**:
  - HTTP requests (counter, duration histogram, size histograms)
  - Test executions (counter, duration, pass rate)
  - Monitor checks (counter, response time, uptime)
  - Database queries (duration, connections, errors)
  - Redis operations (duration, connections, errors)
  - Rate limiting (hits, exceeded)
  - Queue jobs (counter, duration, size)
  - Alerts (total, active by severity)
  - Organizations (total by tier, API key usage)
  - Errors (total by type/severity, unhandled)

### 2. Jaeger (Distributed Tracing)

- **UI Port**: 16686
- **OTLP HTTP**: 4318
- **OTLP gRPC**: 4317
- **URL**: <http://localhost:16686>
- **Features**:
  - Distributed request tracing
  - Service dependency mapping
  - Performance bottleneck identification
  - Automatic instrumentation (HTTP, Express, Prisma, Redis)
  - Custom spans for business logic

### 3. Grafana (Dashboards)

- **Port**: 3000
- **URL**: <http://localhost:3000>
- **Credentials**: admin/admin
- **Data Sources**: Prometheus, Jaeger
- **Dashboards**: Custom Guardian dashboards (coming soon)

## Quick Start

### 1. Start Observability Stack

```bash
# Start all services (Jaeger, Prometheus, Grafana, PostgreSQL, Redis)
docker-compose -f docker-compose.observability.yml up -d

# Check status
docker-compose -f docker-compose.observability.yml ps

# View logs
docker-compose -f docker-compose.observability.yml logs -f
```

### 2. Enable Tracing in Guardian

Add to `.env.local`:

```bash
ENABLE_TRACING=true
OTEL_SERVICE_NAME=guardian-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### 3. Start Guardian

```bash
pnpm dev
```

## Accessing UIs

| Service | URL | Purpose |
|---------|-----|---------|
| **Jaeger UI** | <http://localhost:16686> | View distributed traces |
| **Prometheus** | <http://localhost:9090> | Query metrics |
| **Grafana** | <http://localhost:3000> | Visualize dashboards |
| **Guardian API** | <http://localhost:3003> | Application |

## API Endpoints

### Metrics Endpoint

**GET** `/api/metrics`

Query parameters:

- `format`: `prometheus` (default) or `json`
- `type`: `all` (default) or `system`

Examples:

```bash
# Prometheus text format (for scraping)
curl http://localhost:3003/api/metrics

# JSON format (for dashboards)
curl http://localhost:3003/api/metrics?format=json

# System metrics only (backward compatible)
curl http://localhost:3003/api/metrics?type=system
```

### Traces Endpoint

**GET** `/api/traces`

Query parameters:

- `service`: Filter by service name
- `operation`: Filter by operation name
- `traceId`: Get specific trace
- `startTime`: ISO 8601 timestamp
- `endTime`: ISO 8601 timestamp
- `limit`: Max results (default: 100)

Examples:

```bash
# Get trace configuration
curl http://localhost:3003/api/traces

# Filter by service and operation
curl "http://localhost:3003/api/traces?service=guardian-api&operation=test.execute"

# Get specific trace
curl "http://localhost:3003/api/traces?traceId=abc123"
```

## Custom Spans

Use helper functions to add business context to traces:

```typescript
import { traceTestExecution, traceMonitorCheck, addSpanEvent } from '@/lib/spans';

// Trace test execution
await traceTestExecution(testId, 'e2e', async (span) => {
  addSpanEvent('test.started', { testName: 'Login Test' });
  
  // Run test...
  const result = await runTest();
  
  addSpanEvent('test.completed', { status: result.status });
  span.setAttribute('test.duration', result.duration);
  
  return result;
});

// Trace monitor check
await traceMonitorCheck(monitorId, 'http', async (span) => {
  addSpanEvent('check.started');
  
  const response = await fetch(url);
  
  span.setAttribute('http.status_code', response.status);
  span.setAttribute('http.response_time', responseTime);
  
  return response;
});
```

## Available Span Helpers

- `traceTestExecution(testId, testType, fn)` - Trace test execution
- `traceMonitorCheck(monitorId, monitorType, fn)` - Trace monitor checks
- `traceReportGeneration(reportType, organizationId, fn)` - Trace report generation
- `traceMLAnalysis(analysisType, dataPoints, fn)` - Trace ML analysis
- `traceDatabaseOperation(operation, model, fn)` - Trace database operations
- `traceCacheOperation(operation, key, fn)` - Trace cache operations
- `addSpanEvent(name, attributes)` - Add event to current span
- `setSpanAttribute(key, value)` - Set attribute on current span
- `recordSpanException(error)` - Record exception on current span

## Recording Metrics

Use helper functions to record metrics:

```typescript
import { 
  recordHttpMetrics, 
  recordTestMetrics, 
  recordMonitorMetrics,
  recordDatabaseMetrics 
} from '@/lib/metrics';

// Record HTTP request
recordHttpMetrics('POST', '/api/tests', 200, 125, 1024, 2048);

// Record test execution
recordTestMetrics('e2e', 'passed', 45.5);

// Record monitor check
recordMonitorMetrics('mon_123', 'success', 0.85);

// Record database query
recordDatabaseMetrics('findMany', 'Test', 12.5);
```

## Prometheus Queries

Useful PromQL queries:

```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# P95 response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Test pass rate
test_pass_rate{type="e2e"}

# Monitor uptime percentage
monitor_uptime{monitor_id="mon_123"}

# Database connection count
database_connections

# Redis operations per second
rate(redis_operation_duration_seconds_count[5m])

# Active alerts by severity
active_alerts{severity="critical"}
```

## Jaeger Queries

Search traces in Jaeger UI:

1. **Service**: Select `guardian-api`
2. **Operation**: Choose operation type (e.g., `test.execute`, `monitor.check`)
3. **Tags**: Filter by attributes (e.g., `test.type=e2e`, `monitor.id=mon_123`)
4. **Lookback**: Set time range
5. **Min/Max Duration**: Filter by response time

## Troubleshooting

### Metrics not appearing in Prometheus

1. Check Guardian is running: `curl http://localhost:3003/api/metrics`
2. Check Prometheus targets: <http://localhost:9090/targets>
3. Verify `host.docker.internal` resolves (Docker Desktop required)
4. Check Prometheus logs: `docker logs guardian-prometheus`

### Traces not appearing in Jaeger

1. Verify tracing is enabled: `ENABLE_TRACING=true` in `.env.local`
2. Check OTLP endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces`
3. Check Jaeger is receiving traces: `docker logs guardian-jaeger`
4. Verify instrumentation loaded: Check Guardian logs for "OpenTelemetry tracing initialized"

### Grafana can't connect to Prometheus

1. Check Prometheus is accessible: `curl http://localhost:9090`
2. Verify network connectivity: `docker network inspect guardian-observability`
3. Check Grafana logs: `docker logs guardian-grafana`

## Architecture

```
┌─────────────────┐
│  Guardian API   │
│  (Next.js App)  │
└────────┬────────┘
         │
         ├─── Metrics → /api/metrics ───┐
         │                               │
         └─── Traces → OTLP HTTP ────────┤
                                         │
         ┌───────────────────────────────┴──────┐
         │                                      │
┌────────▼─────────┐                  ┌────────▼─────────┐
│   Prometheus     │                  │     Jaeger       │
│  (Port 9090)     │                  │   (Port 16686)   │
└────────┬─────────┘                  └──────────────────┘
         │
         │
┌────────▼─────────┐
│     Grafana      │
│   (Port 3000)    │
│   Dashboards     │
└──────────────────┘
```

## Next Steps

1. **Week 9 Task 1**: ✅ Prometheus metrics implemented
2. **Week 9 Task 1**: ✅ OpenTelemetry tracing implemented
3. **Week 9 Task 1**: 🔄 Create Grafana dashboards
4. **Week 9 Task 1**: 🔄 Implement performance profiling
5. **Week 9 Task 2**: Database optimization with query analysis
6. **Week 9 Task 3**: Security hardening (CSRF, headers, audit logging)

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [Grafana Documentation](https://grafana.com/docs/)
