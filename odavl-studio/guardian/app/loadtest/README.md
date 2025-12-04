# Guardian Load Testing

## Prerequisites

```bash
# Install k6 (Mac)
brew install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install k6 (Windows)
choco install k6

# Or use Docker
docker pull grafana/k6
```

## Test Scenarios

### 1. API Load Test (loadtest-api.js)

**Purpose**: Gradual load increase to measure normal capacity

**Profile**:

- Ramp: 0 → 50 → 100 → 200 users over 24 minutes
- Tests: Health check, test runs, monitors, metrics
- Thresholds: P95 < 500ms, P99 < 1s, Error rate < 1%

**Run**:

```bash
# Local
k6 run loadtest-api.js

# Against staging
BASE_URL=https://guardian-staging.odavl.com k6 run loadtest-api.js

# With Docker
docker run -v $(pwd):/scripts grafana/k6 run /scripts/loadtest-api.js
```

### 2. Stress Test (loadtest-stress.js)

**Purpose**: Find breaking points and system limits

**Profile**:

- Ramp: 0 → 100 → 300 → 500 → 1000 → 1500 users
- Duration: 11 minutes
- Thresholds: P95 < 2s, Error rate < 5%

**Run**:

```bash
k6 run loadtest-stress.js
```

### 3. Spike Test (loadtest-spike.js)

**Purpose**: Test recovery from sudden traffic spikes

**Profile**:

- Normal (50 users) → SPIKE (1000 users) → Recovery
- Two spikes: 1000 users, then 1200 users
- Tests system elasticity and rate limiting

**Run**:

```bash
k6 run loadtest-spike.js
```

## Interpreting Results

### Key Metrics

**http_req_duration**: Response time

- P95 < 500ms: ✅ Excellent
- P95 < 1s: ✅ Good
- P95 > 2s: ⚠️ Needs optimization

**http_req_failed**: Error rate

- < 1%: ✅ Excellent
- 1-5%: ⚠️ Acceptable under stress
- > 5%: ❌ System overloaded

**http_reqs**: Requests per second (RPS)

- Target: 1000+ RPS for production

### Example Output

```
     ✓ health check status is 200
     ✓ health check response time < 200ms

     checks.........................: 98.45% ✓ 59070    ✗ 930
     data_received..................: 15 MB  62 kB/s
     data_sent......................: 5.3 MB 22 kB/s
     http_req_blocked...............: avg=1.23ms   p(95)=2.45ms   p(99)=5.12ms
     http_req_connecting............: avg=0.87ms   p(95)=1.89ms   p(99)=3.45ms
     http_req_duration..............: avg=245.67ms p(95)=489.23ms p(99)=987.45ms
     http_req_failed................: 1.55%  ✗ 930      ✓ 59070
     http_req_receiving.............: avg=0.45ms   p(95)=0.89ms   p(99)=1.23ms
     http_req_sending...............: avg=0.12ms   p(95)=0.23ms   p(99)=0.45ms
     http_req_tls_handshaking.......: avg=0ms      p(95)=0ms      p(99)=0ms
     http_req_waiting...............: avg=245.10ms p(95)=488.67ms p(99)=986.89ms
     http_reqs......................: 60000  250/s
     iteration_duration.............: avg=1.25s    p(95)=1.49s    p(99)=1.99s
     iterations.....................: 60000  250/s
     vus............................: 200    min=0      max=200
     vus_max........................: 200    min=200    max=200
```

## Cloud Load Testing

### K6 Cloud (Managed)

```bash
# Sign up at https://k6.io/cloud
k6 login cloud

# Run test in cloud
k6 cloud loadtest-api.js

# View results at https://app.k6.io
```

### Distributed Testing

For higher loads, run multiple k6 instances:

```bash
# Terminal 1
k6 run --out csv=results1.csv loadtest-api.js

# Terminal 2
k6 run --out csv=results2.csv loadtest-api.js

# Combine results
cat results1.csv results2.csv > combined-results.csv
```

## Grafana Integration

k6 can send metrics to Prometheus/Grafana:

```bash
# Run with output to Prometheus
k6 run --out prometheus=http://localhost:9090 loadtest-api.js

# Or use InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 loadtest-api.js
```

## Best Practices

1. **Start Small**: Run with 10 users first to verify test logic
2. **Use Realistic Data**: Test with production-like payloads
3. **Monitor Resources**: Watch CPU, memory, database connections
4. **Test Incrementally**: Fix bottlenecks before increasing load
5. **Run Regularly**: Include in CI/CD for performance regression detection
6. **Test Off-Hours**: Avoid impacting real users

## Troubleshooting

### Rate Limiting Triggered

```
✗ status is 200
      ↳  50% — ✗ 5000 / ✓ 5000
```

**Solution**: Increase rate limits or reduce load

### Timeouts

```
http_req_duration..........: avg=30s p(95)=60s
```

**Solution**: Check database queries, add caching, increase timeouts

### Connection Refused

```
✗ status is 200
      ↳  0% — ✗ 10000 / ✓ 0
```

**Solution**: Check if Guardian is running, firewall rules

## Next Steps

After load testing:

1. Review Prometheus/Grafana dashboards
2. Identify bottlenecks (database, Redis, CPU)
3. Optimize slow endpoints
4. Increase resources if needed
5. Re-test with fixes applied
