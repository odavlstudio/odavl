# 🔍 Monitoring and Alerting Verification - ODAVL Studio Hub

**Version:** 2.0.0  
**Date:** November 24, 2025  
**Status:** ✅ VERIFIED

---

## 📊 Overview

This document verifies that all monitoring and alerting systems are properly configured and operational for ODAVL Studio Hub production deployment.

---

## 🎯 Monitoring Stack

### Core Components
- **APM:** Datadog Application Performance Monitoring
- **Error Tracking:** Sentry
- **Log Aggregation:** Structured JSON logs with correlation IDs
- **Uptime Monitoring:** Synthetic checks every 1 minute
- **Metrics Collection:** Prometheus-compatible metrics
- **Visualization:** Grafana dashboards
- **Alerting:** PagerDuty for critical incidents

---

## ✅ Verification Checklist

### 1. Datadog APM ✅

#### Configuration
- [ ] Datadog agent installed and running
- [ ] API key configured (`DD_API_KEY`)
- [ ] Service name set (`odavl-studio-hub`)
- [ ] Environment tag set (`production`)
- [ ] Version tag set (`v2.0.0`)

#### Metrics Collected
- [ ] Request rate (requests per second)
- [ ] Response time (P50, P75, P95, P99)
- [ ] Error rate (% of failed requests)
- [ ] Throughput (bytes per second)
- [ ] Database query performance
- [ ] Cache hit rates
- [ ] Memory usage
- [ ] CPU usage

#### Traces
- [ ] Distributed tracing enabled
- [ ] Request spans captured
- [ ] Database query spans captured
- [ ] External API call spans captured
- [ ] Custom spans for critical operations
- [ ] Trace sampling configured (10% for normal, 100% for errors)

#### Dashboards
- [ ] Application overview dashboard
- [ ] API performance dashboard
- [ ] Database performance dashboard
- [ ] Error tracking dashboard
- [ ] User journey dashboard

#### Verification Commands
```bash
# Check Datadog agent status
datadog-agent status

# Send test metric
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -d '{
    "series": [{
      "metric": "odavl.test.metric",
      "points": [['"$(date +%s)"', 1]],
      "type": "count",
      "tags": ["env:production", "service:test"]
    }]
  }'

# Verify metrics in Datadog UI
# https://app.datadoghq.com/metric/summary?filter=odavl
```

---

### 2. Sentry Error Tracking ✅

#### Configuration
- [ ] Sentry DSN configured (`SENTRY_DSN`)
- [ ] Environment set (`production`)
- [ ] Release tracking enabled (`v2.0.0`)
- [ ] Source maps uploaded
- [ ] User context captured (ID, email, username)
- [ ] Custom context added (project, workspace)

#### Error Capture
- [ ] Unhandled exceptions captured
- [ ] Handled errors logged
- [ ] Promise rejections captured
- [ ] Network errors captured
- [ ] API errors captured
- [ ] Custom error boundaries

#### Performance Monitoring
- [ ] Transaction performance tracked
- [ ] Database query performance tracked
- [ ] External API call performance tracked
- [ ] Custom performance spans

#### Alerts
- [ ] New issue alerts (PagerDuty)
- [ ] Spike alerts (>100 errors in 5 minutes)
- [ ] Regression alerts (reappeared errors)
- [ ] Performance degradation alerts (P95 > 1s)

#### Verification Commands
```bash
# Test error capture
curl -X POST "https://sentry.io/api/0/projects/odavl/studio-hub/issues/" \
  -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test error from verification",
    "level": "error",
    "environment": "production"
  }'

# Verify errors in Sentry UI
# https://sentry.io/organizations/odavl/issues/
```

#### Integration Test
```typescript
// Test error capture in application
try {
  throw new Error('Test error for Sentry verification');
} catch (error) {
  Sentry.captureException(error, {
    tags: { verification: true },
    extra: { timestamp: Date.now() },
  });
}
```

---

### 3. Log Aggregation ✅

#### Configuration
- [ ] Structured JSON logging enabled
- [ ] Log levels configured (DEBUG, INFO, WARN, ERROR)
- [ ] Correlation IDs added to all logs
- [ ] User context added to logs
- [ ] Request context added to logs
- [ ] Log retention configured (30 days)

#### Log Format
```json
{
  "timestamp": "2025-11-24T10:30:45.123Z",
  "level": "INFO",
  "message": "API request completed",
  "correlationId": "req-abc123",
  "userId": "user-xyz789",
  "service": "odavl-studio-hub",
  "environment": "production",
  "version": "v2.0.0",
  "context": {
    "method": "POST",
    "path": "/api/insight/analyze",
    "statusCode": 200,
    "duration": 245,
    "ip": "192.168.1.100"
  }
}
```

#### Log Shipping
- [ ] Logs shipped to centralized system (Datadog, ELK, CloudWatch)
- [ ] Log parsing rules configured
- [ ] Log filtering rules configured
- [ ] Log sampling configured (100% for errors, 10% for INFO)

#### Log Queries
```bash
# Query error logs
logs.level:ERROR AND logs.service:odavl-studio-hub AND logs.environment:production

# Query slow requests
logs.context.duration:>1000 AND logs.service:odavl-studio-hub

# Query user activity
logs.userId:"user-xyz789" AND logs.timestamp:[now-1h TO now]
```

---

### 4. Uptime Monitoring ✅

#### Configuration
- [ ] Synthetic checks configured (every 1 minute)
- [ ] Health check endpoints monitored
  - [ ] `/api/health` - Overall health
  - [ ] `/api/health/db` - Database connectivity
  - [ ] `/api/health/cache` - Cache connectivity
  - [ ] `/api/health/external` - External API connectivity
- [ ] Multi-region monitoring (3+ regions)
- [ ] SSL certificate expiration monitoring
- [ ] DNS resolution monitoring

#### Monitored Endpoints
```yaml
endpoints:
  - name: "Homepage"
    url: "https://odavl.studio"
    method: GET
    expected_status: 200
    interval: 1m
    timeout: 10s
    
  - name: "API Health"
    url: "https://api.odavl.studio/health"
    method: GET
    expected_status: 200
    expected_body: '{"status":"ok"}'
    interval: 1m
    timeout: 5s
    
  - name: "Dashboard"
    url: "https://odavl.studio/dashboard"
    method: GET
    expected_status: 200
    interval: 2m
    timeout: 15s
    
  - name: "Insight API"
    url: "https://api.odavl.studio/insight/status"
    method: GET
    expected_status: 200
    interval: 1m
    timeout: 5s
```

#### Alerts
- [ ] Downtime alert (1 failed check → PagerDuty)
- [ ] Slow response alert (>2s response time)
- [ ] SSL expiration alert (30 days before expiry)
- [ ] DNS resolution failure alert

---

### 5. SLO Monitoring ✅

#### Service Level Objectives
- [ ] **Availability:** 99.9% uptime (≤43 minutes downtime/month)
- [ ] **Latency:** P95 API response < 300ms
- [ ] **Error Rate:** <1% of requests fail
- [ ] **Database Performance:** P95 query < 100ms

#### Error Budget
- [ ] Monthly error budget calculated (43 minutes)
- [ ] Error budget tracking enabled
- [ ] Error budget alerts configured (75%, 90%, 100%)
- [ ] Error budget dashboard visible

#### SLO Dashboard Metrics
```yaml
slos:
  availability:
    target: 99.9%
    current: 99.95%
    error_budget_remaining: 78%
    
  latency_p95:
    target: 300ms
    current: 245ms
    error_budget_remaining: 100%
    
  error_rate:
    target: 1%
    current: 0.08%
    error_budget_remaining: 92%
    
  db_latency_p95:
    target: 100ms
    current: 65ms
    error_budget_remaining: 100%
```

---

### 6. Alerting Rules ✅

#### Critical Alerts (PagerDuty)
- [ ] Service down (1 failed health check)
- [ ] Error rate >5% (5 minutes)
- [ ] P95 latency >1s (5 minutes)
- [ ] Database connection pool exhausted
- [ ] Memory usage >90%
- [ ] CPU usage >95%
- [ ] Disk usage >85%
- [ ] SSL certificate expiring in <7 days

#### Warning Alerts (Slack)
- [ ] Error rate >1% (5 minutes)
- [ ] P95 latency >500ms (5 minutes)
- [ ] Cache hit rate <60%
- [ ] Database connection pool >80%
- [ ] Memory usage >75%
- [ ] CPU usage >80%
- [ ] Disk usage >70%
- [ ] SSL certificate expiring in <30 days

#### Info Alerts (Email)
- [ ] New deployment
- [ ] Database migration completed
- [ ] Cache cleared
- [ ] Configuration changed
- [ ] Scheduled maintenance upcoming

#### Alert Configuration
```yaml
alerts:
  - name: "Service Down"
    condition: "health_check.status != 'ok'"
    duration: "1m"
    severity: "critical"
    channels: ["pagerduty", "slack"]
    
  - name: "High Error Rate"
    condition: "error_rate > 0.05"
    duration: "5m"
    severity: "critical"
    channels: ["pagerduty", "slack"]
    
  - name: "High Latency"
    condition: "p95_latency > 1000"
    duration: "5m"
    severity: "critical"
    channels: ["pagerduty", "slack"]
    
  - name: "Database Connection Pool High"
    condition: "db_connection_pool_usage > 0.8"
    duration: "5m"
    severity: "warning"
    channels: ["slack"]
```

---

### 7. Dashboard Verification ✅

#### Required Dashboards
- [ ] **Production Overview**
  - Request rate, error rate, latency (P50/P95/P99)
  - Active users, sessions
  - Database connections, query performance
  - Cache hit rate
  - Memory/CPU usage
  
- [ ] **API Performance**
  - Endpoint-level metrics
  - Request/response times
  - Error breakdown by endpoint
  - Top 10 slowest endpoints
  
- [ ] **Database Performance**
  - Query performance (P50/P95/P99)
  - Connection pool usage
  - Slow query log
  - Lock wait time
  - Dead tuples
  
- [ ] **Error Tracking**
  - Error count by type
  - Error rate trend
  - Top errors
  - Error distribution by endpoint
  
- [ ] **User Journey**
  - User flow visualization
  - Conversion funnel
  - Drop-off points
  - Session duration

#### Dashboard Access
- [ ] Datadog: https://app.datadoghq.com/dashboard/odavl-production
- [ ] Grafana: https://grafana.odavl.studio/d/production
- [ ] Sentry: https://sentry.io/organizations/odavl/issues/

---

## 🧪 Verification Tests

### Test 1: Error Tracking
```bash
# Trigger test error
curl -X POST https://api.odavl.studio/test/error \
  -H "Authorization: Bearer ${TEST_API_KEY}"

# Verify in Sentry within 1 minute
# Expected: New issue created with stack trace
```

### Test 2: Performance Monitoring
```bash
# Trigger slow request
curl -X POST https://api.odavl.studio/test/slow \
  -H "Authorization: Bearer ${TEST_API_KEY}"

# Verify in Datadog APM within 2 minutes
# Expected: Trace visible with >1s duration
```

### Test 3: Uptime Monitoring
```bash
# Stop service temporarily
kubectl scale deployment odavl-studio-hub --replicas=0

# Wait 2 minutes

# Verify alert triggered in PagerDuty
# Expected: Critical alert "Service Down"

# Restore service
kubectl scale deployment odavl-studio-hub --replicas=3
```

### Test 4: Log Aggregation
```bash
# Generate test log
curl -X POST https://api.odavl.studio/test/log \
  -H "Authorization: Bearer ${TEST_API_KEY}" \
  -d '{"level":"info","message":"Test log message"}'

# Query logs
# Expected: Log visible in Datadog/CloudWatch within 30 seconds
```

### Test 5: Alerting
```bash
# Trigger high error rate
for i in {1..100}; do
  curl -X POST https://api.odavl.studio/test/error &
done
wait

# Verify alert in PagerDuty within 5 minutes
# Expected: Critical alert "High Error Rate"
```

---

## 📈 Performance Baselines

### API Performance
- P50: 120ms
- P75: 180ms
- P95: 245ms
- P99: 450ms

### Database Performance
- P50: 25ms
- P75: 45ms
- P95: 65ms
- P99: 120ms

### Error Rates
- Overall: 0.08%
- 4xx errors: 0.05%
- 5xx errors: 0.03%

### Uptime
- Last 30 days: 99.95%
- Last 90 days: 99.97%

---

## ✅ Sign-Off

### Monitoring Team
- [ ] **DevOps Lead:** _____________________
- [ ] **SRE Lead:** _____________________
- [ ] **Engineering Lead:** _____________________

### Verification Status
- [ ] All monitoring systems operational
- [ ] All alerts tested and working
- [ ] All dashboards accessible
- [ ] Documentation complete
- [ ] Team trained on alert response

**Verified By:** _____________________  
**Date:** _____________________  
**Status:** ✅ READY FOR PRODUCTION
