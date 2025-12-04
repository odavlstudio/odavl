# Quick Start Guide: Guardian Observability

## 🚀 Get Started in 5 Minutes

### Step 1: Start Observability Stack

```bash
# Navigate to Guardian directory
cd apps/guardian

# Start Jaeger, Prometheus, and Grafana
docker-compose -f docker-compose.observability.yml up -d

# Verify all services are running
docker-compose -f docker-compose.observability.yml ps
```

Expected output:

```
NAME                  STATUS              PORTS
guardian-jaeger       Up                  4317-4318, 14250, 14268, 16686
guardian-prometheus   Up                  9090
guardian-grafana      Up                  3000
guardian-postgres     Up                  5432
guardian-redis        Up                  6379
```

### Step 2: Configure Guardian

Create `.env.local` file:

```bash
# Enable tracing
ENABLE_TRACING=true
OTEL_SERVICE_NAME=guardian-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/odavl_guardian?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"
```

### Step 3: Start Guardian

```bash
# Install dependencies (if not already done)
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

Guardian will start on <http://localhost:3003>

### Step 4: Access Observability Tools

Open in your browser:

| Tool | URL | Purpose |
|------|-----|---------|
| **Guardian API** | <http://localhost:3003> | Application |
| **Metrics Endpoint** | <http://localhost:3003/api/metrics> | Prometheus metrics |
| **Traces Endpoint** | <http://localhost:3003/api/traces> | Tracing info |
| **Jaeger UI** | <http://localhost:16686> | View traces |
| **Prometheus** | <http://localhost:9090> | Query metrics |
| **Grafana** | <http://localhost:3000> | Dashboards (admin/admin) |

### Step 5: Generate Some Traffic

```bash
# Create a test
curl -X POST http://localhost:3003/api/tests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Homepage Test",
    "type": "e2e",
    "url": "https://example.com",
    "organizationId": "org_123"
  }'

# Run the test
curl -X POST http://localhost:3003/api/tests/{testId}/run

# Check metrics
curl http://localhost:3003/api/metrics?format=json | jq .
```

### Step 6: View Traces in Jaeger

1. Open <http://localhost:16686>
2. Select **Service**: `guardian-api`
3. Click **Find Traces**
4. Click on any trace to see details

### Step 7: Query Metrics in Prometheus

1. Open <http://localhost:9090>
2. Go to **Graph** tab
3. Try these queries:

```promql
# Request rate
rate(http_requests_total[5m])

# P95 response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Test pass rate
test_pass_rate{type="e2e"}

# Active tests
active_tests
```

## 📊 Common Use Cases

### Monitor API Performance

```promql
# Average response time by route
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Request throughput
sum(rate(http_requests_total[5m]))
```

### Track Test Executions

```promql
# Tests per minute
rate(test_runs_total[1m]) * 60

# Test success rate
sum(rate(test_runs_total{status="passed"}[5m])) / sum(rate(test_runs_total[5m]))

# Average test duration
rate(test_duration_seconds_sum[5m]) / rate(test_duration_seconds_count[5m])
```

### Monitor Database Performance

```promql
# Query latency (P95)
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))

# Active connections
database_connections

# Query rate by operation
sum by (operation) (rate(database_query_duration_seconds_count[5m]))
```

### Find Slow Requests in Jaeger

1. **Service**: `guardian-api`
2. **Operation**: `http.request`
3. **Min Duration**: `1s` (or higher)
4. **Lookback**: `1h`
5. Click **Find Traces**

Look for:

- Long-running database queries
- Multiple sequential operations (N+1 queries)
- External API calls blocking requests
- Cache misses causing slow responses

## 🔧 Troubleshooting

### Metrics Not Showing in Prometheus

```bash
# Check if Guardian is serving metrics
curl http://localhost:3003/api/metrics

# Check Prometheus targets
# Go to http://localhost:9090/targets
# Should show 'guardian-api' as UP

# If DOWN, check Docker network
docker network inspect guardian-observability
```

### Traces Not Appearing in Jaeger

```bash
# Verify tracing is enabled
grep ENABLE_TRACING apps/guardian/.env.local

# Check Guardian logs for initialization
# Should see: "OpenTelemetry tracing initialized"

# Test OTLP endpoint
curl http://localhost:4318/v1/traces

# Check Jaeger logs
docker logs guardian-jaeger
```

### Grafana Can't Connect to Prometheus

```bash
# Verify Prometheus is accessible
curl http://localhost:9090

# Check if services are on same network
docker network ls
docker network inspect guardian-observability

# Restart Grafana
docker-compose -f docker-compose.observability.yml restart grafana
```

## 🎯 Next Steps

1. **Create Grafana Dashboards**: Import pre-built dashboards or create custom ones
2. **Set Up Alerts**: Configure Prometheus alerting rules for critical metrics
3. **Add Custom Spans**: Use span helpers in your business logic
4. **Optimize Performance**: Use traces to identify bottlenecks
5. **Production Setup**: Configure external OTLP collector and Prometheus storage

## 📚 Additional Resources

- [Full Documentation](./OBSERVABILITY.md)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Jaeger Tutorials](https://www.jaegertracing.io/docs/latest/getting-started/)
- [OpenTelemetry Best Practices](https://opentelemetry.io/docs/concepts/instrumentation/)
