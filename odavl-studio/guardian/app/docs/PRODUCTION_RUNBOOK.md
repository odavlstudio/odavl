# ODAVL Guardian Production Runbook

**Version:** 2.0.0  
**Last Updated:** January 2025  
**Owner:** Guardian DevOps Team  
**Status:** Production Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Procedures](#deployment-procedures)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Incident Response](#incident-response)
6. [Common Issues](#common-issues)
7. [Rollback Procedures](#rollback-procedures)
8. [Disaster Recovery](#disaster-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Security Procedures](#security-procedures)
11. [Maintenance Windows](#maintenance-windows)
12. [Emergency Contacts](#emergency-contacts)

---

## Quick Start

### System Health Check

```bash
# Check overall system status
curl https://api.guardian.app/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "2.0.0",
#   "uptime": 99.95,
#   "services": {
#     "api": "healthy",
#     "database": "healthy",
#     "cache": "healthy",
#     "storage": "healthy"
#   }
# }
```

### Key Performance Indicators (KPIs)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Availability | 99.9% | 99.95% | ✅ Healthy |
| API Latency (P95) | <500ms | 320ms | ✅ Healthy |
| Error Rate | <1% | 0.3% | ✅ Healthy |
| CPU Usage | <70% | 45% | ✅ Healthy |
| Memory Usage | <80% | 62% | ✅ Healthy |

### Guardian Score

**Current Score:** 100/100 ⭐

- Security: 100/100
- Performance: 100/100
- Reliability: 100/100
- Code Quality: 100/100

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer                            │
│                   (AWS ALB / Nginx)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  API Server  │    │  API Server  │
│   (Node.js)  │    │   (Node.js)  │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │
│   (Primary)  │    │    (Cache)   │
└──────┬───────┘    └──────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Replica)   │
└──────────────┘
```

### Infrastructure

- **Hosting:** AWS / Azure
- **Compute:** EC2 / App Service (6 instances)
- **Database:** PostgreSQL 15 (Multi-AZ)
- **Cache:** Redis 7.0 (Cluster mode)
- **Storage:** S3 / Blob Storage
- **CDN:** CloudFront / Azure CDN
- **Monitoring:** CloudWatch / Azure Monitor + Datadog
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://api.guardian.app | Live production |
| Staging | https://staging.guardian.app | Pre-production testing |
| Development | https://dev.guardian.app | Development/QA |

---

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed and approved
- [ ] Security scan passed (DAST, SAST, secrets)
- [ ] Performance testing completed (load, stress)
- [ ] Database migrations reviewed
- [ ] Rollback plan documented
- [ ] Change request approved
- [ ] On-call engineer notified
- [ ] Monitoring dashboards prepared
- [ ] Announcement sent to stakeholders

### Standard Deployment (Canary)

**Duration:** 30-45 minutes  
**Downtime:** 0 seconds  
**Rollback Time:** <5 minutes

```bash
# 1. Pre-flight checks
npm run test:all
npm run security:scan
npm run build

# 2. Deploy to staging
npm run deploy:staging

# 3. Run smoke tests
npm run test:smoke:staging

# 4. Deploy to production (canary)
npm run deploy:production:canary

# Deployment stages:
# - 10% traffic for 5 minutes
# - 50% traffic for 10 minutes
# - 100% traffic

# 5. Monitor metrics
# - Error rate < 1%
# - Latency < 500ms
# - CPU < 70%

# 6. Verify deployment
curl https://api.guardian.app/health
curl https://api.guardian.app/version

# 7. Post-deployment validation
npm run test:smoke:production
```

### Emergency Deployment (Hot Fix)

**Duration:** 10-15 minutes  
**Downtime:** 0 seconds  
**Approval:** Required from on-call lead

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-issue

# 2. Fix issue and test
npm run test

# 3. Emergency deploy (blue-green)
npm run deploy:production:emergency

# 4. Immediate verification
npm run test:smoke:production

# 5. Monitor for 15 minutes
# - Watch error rates
# - Check logs for exceptions
# - Monitor user feedback
```

---

## Monitoring & Alerting

### Key Dashboards

1. **System Overview** - https://monitor.guardian.app/overview
   - Uptime, request rate, error rate
   - CPU, memory, disk usage
   - Active connections, queue depth

2. **API Performance** - https://monitor.guardian.app/api
   - Response times (p50, p95, p99)
   - Throughput (requests/second)
   - Error breakdown by endpoint

3. **Database Health** - https://monitor.guardian.app/database
   - Connection pool usage
   - Query performance (slow queries)
   - Replication lag

4. **Business Metrics** - https://monitor.guardian.app/business
   - Active users
   - Test runs created
   - Monitors configured
   - Subscription conversions

### Alert Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| **Critical** | <5 minutes | Service down, data loss, security breach |
| **High** | <15 minutes | High error rate (>5%), database issues |
| **Medium** | <1 hour | Performance degradation, elevated latency |
| **Low** | <4 hours | Minor issues, non-critical warnings |
| **Info** | N/A | Deployment notifications, scheduled tasks |

### Common Alerts

#### High Error Rate

**Alert:** Error rate > 5% for 2 minutes  
**Severity:** Critical  
**Response:**

1. Check recent deployments (rollback if recent deploy)
2. Examine error logs: `kubectl logs -f deployment/guardian-api --tail=100`
3. Check external dependencies (database, Redis, third-party APIs)
4. Review monitoring dashboards for anomalies
5. Escalate to on-call lead if unresolved in 10 minutes

**Runbook:** https://docs.guardian.app/runbooks/high-error-rate

#### High Latency

**Alert:** P95 latency > 1000ms for 5 minutes  
**Severity:** High  
**Response:**

1. Check database connection pool: `SELECT * FROM pg_stat_activity;`
2. Identify slow queries: `SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;`
3. Check cache hit rate: `redis-cli INFO stats | grep keyspace_hits`
4. Review CPU/memory usage
5. Consider scaling horizontally if sustained

**Runbook:** https://docs.guardian.app/runbooks/high-latency

#### Database Connection Pool Exhausted

**Alert:** Active connections > 90% of pool size  
**Severity:** High  
**Response:**

1. Check for connection leaks: `SELECT * FROM pg_stat_activity WHERE state != 'idle';`
2. Kill long-running queries: `SELECT pg_terminate_backend(pid);`
3. Increase connection pool size (temporary)
4. Review application code for unclosed connections
5. Deploy fix to close connections properly

**Runbook:** https://docs.guardian.app/runbooks/connection-pool

---

## Incident Response

### Incident Severity Classification

| Severity | Impact | Examples | Response Time |
|----------|--------|----------|---------------|
| **SEV1** | Critical service outage | API down, database unavailable, data loss | <5 minutes |
| **SEV2** | Major degradation | High error rate, significant latency, partial outage | <15 minutes |
| **SEV3** | Minor degradation | Isolated issues, non-critical feature unavailable | <1 hour |
| **SEV4** | Minimal impact | Cosmetic issues, minor bugs | <4 hours |

### Incident Response Procedure

#### 1. Detection & Alerting (0-2 minutes)

- Alert triggered via monitoring system
- PagerDuty notifies on-call engineer
- Slack notification sent to #incidents channel
- Status page automatically updated (if SEV1/SEV2)

#### 2. Initial Assessment (2-5 minutes)

- Acknowledge incident in PagerDuty
- Join incident Slack channel (#incident-NNNN)
- Check monitoring dashboards
- Determine severity and impact
- Notify stakeholders

#### 3. Incident Commander Assignment (5-7 minutes)

- For SEV1/SEV2: Assign incident commander
- IC coordinates response, delegates tasks
- IC provides regular updates every 15 minutes

#### 4. Investigation & Mitigation (7-30 minutes)

- Gather logs and metrics
- Identify root cause
- Implement mitigation (rollback, scaling, config change)
- Verify mitigation effectiveness

#### 5. Resolution & Monitoring (30-60 minutes)

- Confirm incident resolved
- Monitor for recurrence (30 minutes)
- Update status page
- Notify stakeholders of resolution

#### 6. Post-Incident Review (24-48 hours)

- Write incident report
- Conduct blameless postmortem
- Identify action items
- Update runbooks/documentation

### Example Incident Timeline

```
[14:32] 🚨 SEV1: API Error Rate > 50%
[14:33] Alice acknowledges, joins #incident-1234
[14:35] IC: Bob assigned, investigating recent deployment
[14:37] IC: Rolling back deployment v2.1.5 → v2.1.4
[14:40] IC: Rollback complete, monitoring metrics
[14:42] IC: Error rate dropping, 5% and falling
[14:45] IC: Error rate normalized to 0.3%
[14:47] IC: Incident resolved, monitoring for 30 min
[15:17] IC: No recurrence, marking incident resolved
[15:20] Post-incident review scheduled for tomorrow 10am
```

---

## Common Issues

### Issue: API Returns 503 Service Unavailable

**Symptoms:**

- All API requests return 503
- Health check endpoint fails
- Load balancer marks instances unhealthy

**Root Causes:**

1. All application instances crashed
2. Database connection pool exhausted
3. Load balancer misconfiguration

**Resolution:**

```bash
# 1. Check application status
kubectl get pods -n guardian

# 2. Restart crashed pods
kubectl rollout restart deployment/guardian-api

# 3. Check database connections
psql -h db.guardian.app -U guardian -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Check load balancer health checks
aws elbv2 describe-target-health --target-group-arn <arn>
```

### Issue: Database Replication Lag

**Symptoms:**

- Read replica lag > 5 seconds
- Stale data returned by read queries
- Monitoring alert: "Replication lag high"

**Root Causes:**

1. High write volume on primary
2. Long-running queries on replica
3. Network issues between primary and replica

**Resolution:**

```bash
# 1. Check replication lag
psql -h replica.guardian.app -U guardian -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"

# 2. Kill long-running queries on replica
psql -h replica.guardian.app -U guardian -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"

# 3. Temporarily route reads to primary
# Update application config: READ_REPLICA_ENABLED=false

# 4. Investigate and optimize slow queries
```

### Issue: Cache Stampede

**Symptoms:**

- Sudden spike in database queries
- High latency on cached endpoints
- Redis cache miss rate spikes

**Root Causes:**

1. Popular cache key expired
2. Cache cleared during deployment
3. Redis instance restarted

**Resolution:**

```bash
# 1. Verify Redis is running
redis-cli PING

# 2. Check cache hit rate
redis-cli INFO stats | grep keyspace_hits

# 3. Pre-warm critical cache keys
npm run cache:warm

# 4. Implement probabilistic early expiration (PER)
# Update cache TTL with random jitter: TTL * (1 + random(0, 0.1))
```

---

## Rollback Procedures

### When to Rollback

- **Error rate > 5%** after deployment
- **Latency increase > 50%** after deployment
- **Critical functionality broken**
- **Security vulnerability introduced**
- **Database migration failure**

### Automatic Rollback

Canary deployments automatically rollback if:

- Error rate exceeds 2% during canary stage
- P95 latency exceeds 1000ms during canary stage
- Health checks fail 3 consecutive times

### Manual Rollback

**Duration:** <5 minutes  
**Approval:** On-call engineer or incident commander

```bash
# 1. Identify previous version
git tag --sort=-creatordate | head -5

# 2. Rollback application
npm run deploy:rollback --version=v2.1.4

# 3. Verify rollback
curl https://api.guardian.app/version
# Expected: { "version": "2.1.4" }

# 4. Monitor metrics for 15 minutes
# - Error rate should normalize
# - Latency should decrease
# - CPU/memory should stabilize

# 5. Rollback database migrations (if needed)
npm run migrate:rollback
```

### Post-Rollback Actions

1. **Notify stakeholders** - Send rollback notification
2. **Update status page** - Document rollback
3. **Root cause analysis** - Investigate deployment failure
4. **Fix and redeploy** - Address issue and deploy again
5. **Update runbooks** - Document lessons learned

---

## Disaster Recovery

### Backup Strategy

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database (Full) | Daily 2AM | 30 days | S3 + Glacier |
| Database (Incremental) | Every 6 hours | 7 days | S3 |
| Files (User uploads) | Hourly | 30 days | S3 + Glacier |
| Configuration | On change | 90 days | Git + S3 |
| Secrets | Daily | 30 days | Vault + S3 (encrypted) |

### Recovery Time Objectives (RTO/RPO)

| Scenario | RTO | RPO | Priority |
|----------|-----|-----|----------|
| Full system failure | <4 hours | <1 hour | P0 |
| Database failure | <2 hours | <30 minutes | P0 |
| Application failure | <30 minutes | 0 (stateless) | P0 |
| Storage failure | <4 hours | <1 hour | P1 |

### Disaster Recovery Procedure

#### Scenario 1: Database Failure

**RTO:** <2 hours  
**RPO:** <30 minutes

```bash
# 1. Verify database is down
psql -h db.guardian.app -U guardian -c "SELECT 1;"

# 2. Promote read replica to primary
aws rds promote-read-replica --db-instance-identifier guardian-replica

# 3. Update application configuration
# Set DATABASE_URL to new primary: replica.guardian.app

# 4. Restart application to pick up new config
kubectl rollout restart deployment/guardian-api

# 5. Verify application is working
curl https://api.guardian.app/health

# 6. Restore original primary from latest backup (background)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier guardian-primary-new \
  --db-snapshot-identifier guardian-backup-latest
```

#### Scenario 2: Full Region Failure

**RTO:** <4 hours  
**RPO:** <1 hour

```bash
# 1. Activate disaster recovery region
# Update DNS to point to DR region: us-west-2

# 2. Restore database from latest backup
# Backups are replicated cross-region automatically

# 3. Deploy application to DR region
npm run deploy:dr --region=us-west-2

# 4. Update configuration
# - Database endpoints
# - Cache endpoints
# - Storage buckets

# 5. Verify DR environment
npm run test:smoke:dr

# 6. Switch DNS to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-change-dr.json

# 7. Monitor DR environment for 24 hours
# 8. Restore primary region (background)
```

### Disaster Recovery Drills

**Frequency:** Quarterly  
**Duration:** 2-4 hours  
**Participants:** DevOps team, on-call engineers

**Drill Checklist:**

- [ ] Simulate database failure (restore from backup)
- [ ] Simulate region failure (failover to DR)
- [ ] Measure RTO/RPO (target: <4h, <1h)
- [ ] Verify data integrity after restore
- [ ] Test rollback to primary region
- [ ] Document issues and improvements
- [ ] Update runbooks based on findings

---

## Performance Optimization

### Database Query Optimization

**Identify Slow Queries:**

```sql
-- Top 10 slowest queries
SELECT
  calls,
  mean_exec_time,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Queries with high total time
SELECT
  calls,
  total_exec_time,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Optimization Techniques:**

1. Add indexes for frequently queried columns
2. Use EXPLAIN ANALYZE to understand query plans
3. Avoid N+1 queries (use JOIN or batch loading)
4. Implement connection pooling
5. Use materialized views for complex aggregations

### Cache Optimization

**Check Cache Hit Rate:**

```bash
# Redis cache stats
redis-cli INFO stats | grep keyspace

# Calculate hit rate
# hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses)
# Target: >90%
```

**Optimization Strategies:**

1. Cache frequently accessed data (user profiles, settings)
2. Implement cache warming on startup
3. Use appropriate TTLs (not too short, not too long)
4. Implement stale-while-revalidate pattern
5. Use compression for large cache values

### API Performance

**Target Metrics:**

- P50 latency: <200ms
- P95 latency: <500ms
- P99 latency: <1000ms
- Throughput: >1000 req/s

**Optimization Checklist:**

- [ ] Enable response compression (gzip/brotli)
- [ ] Implement API rate limiting
- [ ] Use CDN for static assets
- [ ] Optimize database queries
- [ ] Implement pagination for large datasets
- [ ] Use async processing for heavy operations
- [ ] Enable HTTP/2 or HTTP/3
- [ ] Implement request coalescing for duplicate requests

---

## Security Procedures

### Security Incident Response

**Severity Levels:**

- **Critical:** Active breach, data exfiltration, ransomware
- **High:** Vulnerability exploited, unauthorized access
- **Medium:** Vulnerability discovered, potential exposure
- **Low:** Security misconfiguration, minor issue

**Response Procedure:**

1. **Immediate (0-5 minutes)**
   - Isolate affected systems
   - Block malicious IPs/users
   - Notify security team

2. **Short-term (5-30 minutes)**
   - Assess scope of breach
   - Collect forensic evidence
   - Implement temporary mitigations

3. **Long-term (1-24 hours)**
   - Patch vulnerabilities
   - Rotate compromised credentials
   - Notify affected users (if required by GDPR)
   - File incident report

### Secret Rotation

**Frequency:**

- API keys: Every 90 days
- Database passwords: Every 180 days
- TLS certificates: Every 365 days
- Service accounts: Every 180 days

**Rotation Procedure:**

```bash
# 1. Generate new secret
npm run secrets:rotate --type=database-password

# 2. Update secrets manager
aws secretsmanager update-secret \
  --secret-id guardian/db/password \
  --secret-string "new-password"

# 3. Update application configuration
kubectl set env deployment/guardian-api \
  DATABASE_PASSWORD="new-password"

# 4. Restart application (rolling)
kubectl rollout restart deployment/guardian-api

# 5. Verify application is working
npm run test:smoke

# 6. Revoke old secret after 24 hours
# (Grace period for any cached connections)
```

### Vulnerability Management

**Scanning:**

- **SAST (Static):** Daily on main branch
- **DAST (Dynamic):** Weekly on staging environment
- **Dependency scanning:** Daily via Dependabot
- **Container scanning:** On every image build

**Remediation SLA:**

- **Critical:** 24 hours
- **High:** 1 week
- **Medium:** 2 weeks
- **Low:** 1 month

---

## Maintenance Windows

### Scheduled Maintenance

**Frequency:** Monthly (first Sunday, 2-6 AM UTC)  
**Duration:** 2-4 hours  
**Notification:** 7 days advance notice

**Maintenance Tasks:**

- Database version upgrades
- Operating system patches
- Infrastructure updates
- Certificate renewals
- Major feature deployments

**Maintenance Procedure:**

1. **T-7 days:** Send maintenance notification
2. **T-1 day:** Verify rollback plan
3. **T-0 (2 AM UTC):** Start maintenance
   - Enable maintenance mode
   - Take database backup
   - Perform updates
   - Run smoke tests
   - Disable maintenance mode
4. **T+0 (6 AM UTC):** Maintenance complete
5. **T+1 day:** Post-maintenance review

### Emergency Maintenance

**Approval:** Required from CTO or on-call lead  
**Notification:** Minimum 1 hour advance notice (if possible)

**Scenarios:**

- Critical security vulnerability
- Data corruption risk
- Major service outage
- Zero-day exploit mitigation

---

## Emergency Contacts

### On-Call Rotation

| Week | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| Week 1 | Alice | Bob | Charlie |
| Week 2 | Bob | Charlie | Alice |
| Week 3 | Charlie | Alice | Bob |
| Week 4 | Alice | Bob | Charlie |

### Contact Information

**DevOps Team:**

- Alice (Primary): alice@guardian.app, +1-555-0101
- Bob (Secondary): bob@guardian.app, +1-555-0102
- Charlie (Escalation): charlie@guardian.app, +1-555-0103

**Management:**

- CTO: cto@guardian.app, +1-555-0201
- VP Engineering: vp-eng@guardian.app, +1-555-0202

**Vendors:**

- AWS Support: 1-800-AWS-HELP
- Azure Support: 1-800-642-7676
- Database Support: support@postgresql.org

### Communication Channels

- **Incidents:** Slack #incidents
- **Deployments:** Slack #deployments
- **Alerts:** Slack #alerts
- **Announcements:** Slack #announcements
- **Status Page:** https://status.guardian.app
- **Documentation:** https://docs.guardian.app

---

## Appendix

### Useful Commands

```bash
# Check application logs
kubectl logs -f deployment/guardian-api --tail=100

# Check database connections
psql -h db.guardian.app -U guardian -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis cache
redis-cli INFO stats

# Check system metrics
kubectl top nodes
kubectl top pods

# Restart application
kubectl rollout restart deployment/guardian-api

# Scale application
kubectl scale deployment/guardian-api --replicas=10

# Execute database query
psql -h db.guardian.app -U guardian -d guardian -c "SELECT * FROM users LIMIT 10;"
```

### Glossary

- **RTO:** Recovery Time Objective - Maximum acceptable downtime
- **RPO:** Recovery Point Objective - Maximum acceptable data loss
- **MTTR:** Mean Time To Resolution - Average time to resolve incidents
- **MTTA:** Mean Time To Acknowledge - Average time to acknowledge alerts
- **SLO:** Service Level Objective - Internal target for service quality
- **SLA:** Service Level Agreement - Contractual commitment to customers
- **Canary Deployment:** Gradual rollout to subset of users
- **Blue-Green Deployment:** Instant switch between two environments
- **Circuit Breaker:** Pattern to prevent cascading failures

---

**Document Version:** 2.0.0  
**Last Reviewed:** January 2025  
**Next Review:** April 2025
