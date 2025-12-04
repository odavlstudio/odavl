# Grafana Dashboard Setup

**ODAVL Guardian - Monitoring with Prometheus & Grafana**

---

## 📊 Dashboards Included

### 1. Performance Dashboard (`guardian-performance.json`)

**Panels:**

1. **Memory Usage** - Heap used/total, RSS (timeseries)
2. **Heap Usage Percentage** - Visual gauge (0-100%)
3. **CPU Usage** - User + System CPU time (timeseries)
4. **Database Status** - Connected/Disconnected indicator
5. **Redis Status** - Connected/Disconnected indicator
6. **Redis Cache Hit Rate** - Percentage gauge
7. **Database Records** - Count by table (monitors, test_runs, alerts)
8. **Redis Operations** - Commands per second (timeseries)

**Refresh Rate:** 10 seconds  
**Time Range:** Last 1 hour (configurable)

---

## 🚀 Quick Setup

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.monitoring.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: odavl-prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    networks:
      - odavl-network

  grafana:
    image: grafana/grafana:latest
    container_name: odavl-grafana
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - odavl-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  odavl-network:
    external: true
```

**Start monitoring stack:**

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Option 2: Kubernetes (Helm)

```bash
# Add Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Install Grafana dashboard
kubectl create configmap guardian-dashboard \
  --from-file=guardian-performance.json \
  --namespace monitoring

kubectl label configmap guardian-dashboard \
  grafana_dashboard=1 \
  --namespace monitoring
```

---

## ⚙️ Configuration

### Prometheus Configuration (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'guardian'
    static_configs:
      - targets: ['guardian:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s
```

### Grafana Datasource (`datasources/prometheus.yml`)

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

### Grafana Dashboard Provisioning (`dashboards/dashboard.yml`)

```yaml
apiVersion: 1

providers:
  - name: 'ODAVL'
    orgId: 1
    folder: 'ODAVL Guardian'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
      foldersFromFilesStructure: true
```

---

## 📈 Metrics Exposed

### System Metrics

- `nodejs_heap_size_total_bytes` - Total heap size
- `nodejs_heap_size_used_bytes` - Used heap size
- `nodejs_external_memory_bytes` - External memory (buffers, etc.)
- `nodejs_rss_bytes` - Resident set size
- `nodejs_cpu_user_seconds_total` - User CPU time (counter)
- `nodejs_cpu_system_seconds_total` - System CPU time (counter)
- `nodejs_process_uptime_seconds` - Process uptime
- `os_memory_total_bytes` - Total system memory
- `os_memory_used_bytes` - Used system memory
- `os_memory_free_bytes` - Free system memory

### Database Metrics

- `odavl_database_records_total{table="monitors"}` - Monitor count
- `odavl_database_records_total{table="test_runs"}` - Test run count
- `odavl_database_records_total{table="alerts"}` - Alert count
- `odavl_database_connected` - Connection status (1=connected, 0=disconnected)

### Redis Metrics

- `odavl_redis_connected` - Connection status (1=connected, 0=disconnected)
- `odavl_redis_commands_total` - Total commands processed (counter)
- `odavl_redis_cache_hit_rate` - Cache hit rate percentage

### Application Metrics

- `odavl_version{version="1.5.0"}` - Application version
- `odavl_environment{env="production"}` - Current environment
- `odavl_metrics_collection_duration_ms` - Metrics collection time

---

## 🎯 Alert Rules

### Prometheus Alert Rules (`alerts.yml`)

```yaml
groups:
  - name: guardian_alerts
    interval: 30s
    rules:
      # High Memory Usage
      - alert: HighMemoryUsage
        expr: (nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
          service: guardian
        annotations:
          summary: "High memory usage detected"
          description: "Heap usage is above 90% for 5 minutes (current: {{ $value }}%)"

      # Database Disconnected
      - alert: DatabaseDisconnected
        expr: odavl_database_connected == 0
        for: 1m
        labels:
          severity: critical
          service: guardian
        annotations:
          summary: "Database connection lost"
          description: "Guardian cannot connect to PostgreSQL database"

      # Redis Disconnected
      - alert: RedisDisconnected
        expr: odavl_redis_connected == 0
        for: 1m
        labels:
          severity: warning
          service: guardian
        annotations:
          summary: "Redis connection lost"
          description: "Guardian cannot connect to Redis cache"

      # Low Cache Hit Rate
      - alert: LowCacheHitRate
        expr: odavl_redis_cache_hit_rate < 70
        for: 10m
        labels:
          severity: warning
          service: guardian
        annotations:
          summary: "Low Redis cache hit rate"
          description: "Cache hit rate is below 70% for 10 minutes (current: {{ $value }}%)"

      # High CPU Usage
      - alert: HighCPUUsage
        expr: rate(nodejs_cpu_user_seconds_total[5m]) + rate(nodejs_cpu_system_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
          service: guardian
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"
```

---

## 🔍 Querying Metrics

### Useful PromQL Queries

**Memory Growth Rate:**

```promql
rate(nodejs_heap_size_used_bytes[5m])
```

**Memory Usage Percentage:**

```promql
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100
```

**CPU Usage (both user + system):**

```promql
rate(nodejs_cpu_user_seconds_total[5m]) + rate(nodejs_cpu_system_seconds_total[5m])
```

**Redis Commands Per Second:**

```promql
rate(odavl_redis_commands_total[5m])
```

**Cache Hit Rate:**

```promql
odavl_redis_cache_hit_rate
```

**Database Record Growth:**

```promql
increase(odavl_database_records_total[1h])
```

---

## 🚨 Troubleshooting

### Issue 1: Metrics Not Showing

**Check Guardian /api/metrics endpoint:**

```bash
curl http://localhost:3000/api/metrics
# Expected: Prometheus text format output
```

**Check Prometheus targets:**

```bash
# Open Prometheus UI
open http://localhost:9090/targets
# Verify "guardian" target is UP
```

### Issue 2: Grafana Dashboard Empty

**Verify datasource:**

```bash
# Grafana UI → Configuration → Data Sources → Prometheus
# Test connection (should be green)
```

**Check Prometheus query:**

```bash
# Grafana → Explore → Query: nodejs_heap_size_used_bytes
# Should show data
```

### Issue 3: Alerts Not Firing

**Check Alertmanager:**

```bash
# Prometheus UI → Alerts
# Verify alert rules are loaded and evaluating
```

---

## 📚 Related Documentation

- **Week 4 Docker:** `WEEK4_DOCKER_COMPLETE.md`
- **Performance Report:** `PERFORMANCE_OPTIMIZATION_WEEK3.md`
- **Prometheus Docs:** <https://prometheus.io/docs/>
- **Grafana Docs:** <https://grafana.com/docs/>

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Monitoring Infrastructure Complete  
**Dashboards:** 1 (Performance)  
**Alert Rules:** 5 (Memory, DB, Redis, CPU, Cache)
