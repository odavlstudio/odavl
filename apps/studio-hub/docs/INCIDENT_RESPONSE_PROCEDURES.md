# Incident Response Procedures
# ODAVL Studio Hub - Chaos Engineering & Resilience

## 📋 Overview

This document outlines incident response procedures for ODAVL Studio Hub, with specific focus on chaos engineering failures and resilience issues discovered during chaos experiments.

---

## 🚨 Incident Severity Levels

### SEV-1: Critical (Production Down)
- **Impact**: Complete service outage affecting all users
- **Response Time**: Immediate (< 5 minutes)
- **Examples**: Database complete failure, all pods crashed, network partition

### SEV-2: High (Major Degradation)
- **Impact**: Significant performance degradation or partial outage
- **Response Time**: < 15 minutes
- **Examples**: High error rate (> 5%), P95 > 2s, circuit breakers open

### SEV-3: Medium (Minor Degradation)
- **Impact**: Some features affected, user experience degraded
- **Response Time**: < 30 minutes
- **Examples**: Slow database queries, increased latency, memory pressure

### SEV-4: Low (No User Impact)
- **Impact**: Internal issues, no user-facing impact
- **Response Time**: < 2 hours
- **Examples**: Failed chaos experiment in staging, monitoring alerts

---

## 📞 Escalation Chain

### On-Call Rotation
| Role | Primary | Secondary | Contact |
|------|---------|-----------|---------|
| **Incident Commander** | Ahmed | Sarah | Slack: @oncall |
| **Backend Lead** | Sarah | Mike | Slack: @backend-oncall |
| **DevOps Lead** | Mike | Ahmed | Slack: @devops-oncall |
| **DBA** | John | Lisa | Slack: @dba-oncall |
| **Security** | Lisa | Ahmed | Slack: @security-oncall |
| **Executive (SEV-1 only)** | CTO | VP Engineering | Email + Phone |

### Escalation Triggers
- **SEV-1**: Immediate page to Incident Commander + Backend Lead + DevOps Lead
- **SEV-2**: Slack alert to on-call team + page if no response in 5 minutes
- **SEV-3**: Slack alert to on-call team
- **SEV-4**: Create GitHub issue, no immediate escalation

---

## 🔄 Incident Response Workflow

### 1. Detection & Alert

**Automated Detection:**
- Prometheus alerts trigger PagerDuty/Slack notifications
- Chaos experiment failures create GitHub issues
- Error rate threshold breaches (> 1%) trigger Sentry alerts
- Circuit breaker opens send Slack notifications

**Manual Detection:**
- User reports via support channels
- Monitoring dashboard observation
- Chaos experiment failures

**Initial Actions:**
```bash
# 1. Acknowledge incident in PagerDuty/Slack
/acknowledge incident-id

# 2. Create incident channel
/create-incident-channel #incident-2025-11-24-database-failure

# 3. Assign Incident Commander
/assign-ic @ahmed
```

### 2. Assessment & Triage

**Incident Commander Actions:**

1. **Assess Severity**: Determine SEV level based on impact
2. **Assemble Team**: Pull in relevant engineers
3. **Start War Room**: Create video call link if SEV-1 or SEV-2
4. **Document Timeline**: Start incident timeline in shared doc

**Key Questions:**
- What is the user impact?
- How many users affected?
- What services are down/degraded?
- Is this spreading to other services?
- Can we roll back recent changes?

**Triage Commands:**
```bash
# Check service health
curl https://odavl.studio/api/health

# Check error rate
curl "$PROMETHEUS_URL/api/v1/query?query=(sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))) * 100"

# Check pod status
kubectl get pods -n odavl-production

# Check database connections
kubectl exec -it postgres-0 -n odavl-production -- psql -U postgres -d odavl_studio -c "SELECT count(*) FROM pg_stat_activity;"

# Check circuit breaker states
curl https://odavl.studio/api/trpc/health.getCircuitBreakers
```

### 3. Containment & Mitigation

**Immediate Actions (SEV-1):**

**If Database Failure:**
```bash
# 1. Check database pod status
kubectl get pods -n odavl-production -l app=postgres

# 2. Check database logs
kubectl logs postgres-0 -n odavl-production --tail=100

# 3. If pod crashed, check for restart
kubectl describe pod postgres-0 -n odavl-production

# 4. Force failover to replica (if available)
kubectl exec -it postgres-0 -n odavl-production -- pg_ctl promote

# 5. Scale up replicas if needed
kubectl scale statefulset postgres -n odavl-production --replicas=3
```

**If Network Partition:**
```bash
# 1. Check network policies
kubectl get networkpolicies -n odavl-production

# 2. Remove any chaos-related policies
kubectl delete networkpolicy chaos-partition-* -n odavl-production

# 3. Verify pod-to-pod communication
kubectl exec -it studio-hub-0 -n odavl-production -- nc -zv postgres-service 5432

# 4. Check DNS resolution
kubectl exec -it studio-hub-0 -n odavl-production -- nslookup postgres-service
```

**If Pod Resource Exhaustion:**
```bash
# 1. Check resource usage
kubectl top pods -n odavl-production

# 2. Kill stress processes (if from chaos test)
kubectl exec -it studio-hub-0 -n odavl-production -- pkill -9 stress-ng

# 3. Increase resource limits (if legitimate usage)
kubectl set resources deployment studio-hub -n odavl-production --limits=memory=2Gi,cpu=2000m

# 4. Scale horizontally
kubectl scale deployment studio-hub -n odavl-production --replicas=5
```

**If Circuit Breaker Open:**
```bash
# 1. Check circuit breaker status
curl https://odavl.studio/api/trpc/health.getCircuitBreakers | jq

# 2. Identify which service is down
# Example: github, stripe, contentful, etc.

# 3. Verify external service health
curl -I https://api.github.com/users/octocat

# 4. Manually reset circuit breaker (if service recovered)
curl -X POST https://odavl.studio/api/trpc/admin.resetCircuitBreaker \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"service": "github"}'
```

### 4. Communication

**Internal Communication:**

**Slack Incident Channel (#incident-YYYY-MM-DD-description):**
```
// Incident Start Message
🚨 **INCIDENT DECLARED**
Severity: SEV-2
Impact: High error rate (8.5%) on Insight API
Incident Commander: @ahmed
Status: Investigating

// Periodic Updates (every 15 minutes)
⏱️ **UPDATE - 12:15 PM**
- Identified root cause: Database connection pool exhaustion
- Mitigation: Increased pool size from 20 to 50
- Error rate down to 3.2%
- ETA to resolution: 10 minutes

// Resolution Message
✅ **INCIDENT RESOLVED**
Duration: 47 minutes
Root Cause: Database connection pool too small for load spike
Mitigation: Increased pool size, added alerting
Postmortem: Will be scheduled within 48 hours
```

**External Communication (SEV-1/SEV-2 only):**

**Status Page (status.odavl.studio):**
```markdown
🟡 Investigating - Insight API Degradation
Posted: 2025-11-24 12:00 PM UTC

We are currently investigating elevated error rates on the Insight API. 
Users may experience slow response times or errors when analyzing issues.

Updates will be posted as we learn more.

---

🟢 Monitoring - Issue Mitigated
Posted: 2025-11-24 12:30 PM UTC

We have identified and mitigated the root cause. Error rates have returned 
to normal levels. We will continue monitoring for the next hour.

---

✅ Resolved
Posted: 2025-11-24 1:00 PM UTC

This incident has been resolved. All systems are operating normally.
```

**Email Notification (SEV-1 only):**
```
Subject: [RESOLVED] ODAVL Studio Incident - Insight API Degradation

Dear ODAVL Studio User,

We experienced a service degradation affecting the Insight API between 
12:00 PM and 1:00 PM UTC on November 24, 2025.

Impact: Users may have experienced errors or slow response times when 
analyzing code issues during this window.

Root Cause: Database connection pool exhaustion during a traffic spike.

Resolution: We increased connection pool capacity and added proactive 
monitoring to prevent similar issues.

We apologize for any inconvenience. If you continue to experience issues, 
please contact support@odavl.com.

Best regards,
The ODAVL Team
```

### 5. Recovery & Validation

**Post-Mitigation Checklist:**

1. **Verify Error Rate Normalized:**
   ```bash
   # Check current error rate
   curl "$PROMETHEUS_URL/api/v1/query?query=(sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))) * 100"
   # Should be < 1%
   ```

2. **Verify Response Times Acceptable:**
   ```bash
   # Check P95 response time
   curl "$PROMETHEUS_URL/api/v1/query?query=histogram_quantile(0.95, rate(http_request_duration_milliseconds_bucket[5m]))"
   # Should be < 500ms
   ```

3. **Verify All Pods Healthy:**
   ```bash
   kubectl get pods -n odavl-production
   # All should be Running with 0 restarts (or low restart count)
   ```

4. **Verify Database Connections Normal:**
   ```bash
   kubectl exec -it postgres-0 -n odavl-production -- psql -U postgres -d odavl_studio -c "SELECT count(*) FROM pg_stat_activity;"
   # Should be < 20 (within connection pool limits)
   ```

5. **Verify Circuit Breakers Closed:**
   ```bash
   curl https://odavl.studio/api/trpc/health.getCircuitBreakers | jq '.breakers | to_entries | map(select(.value.state != "closed"))'
   # Should return empty array
   ```

6. **Run Smoke Tests:**
   ```bash
   # Run critical user flows
   ./scripts/smoke-tests.sh production
   ```

### 6. Postmortem

**Postmortem Template:**

```markdown
# Incident Postmortem: [Brief Description]

**Date:** 2025-11-24
**Severity:** SEV-2
**Duration:** 47 minutes (12:00 PM - 12:47 PM UTC)
**Incident Commander:** Ahmed
**Participants:** Ahmed, Sarah, Mike, John

---

## Summary

Brief summary of what happened, user impact, and resolution.

---

## Timeline (All times in UTC)

| Time | Event |
|------|-------|
| 12:00 PM | Prometheus alert: High error rate (8.5%) |
| 12:02 PM | Incident declared (SEV-2) |
| 12:05 PM | Identified database connection pool exhaustion |
| 12:10 PM | Increased connection pool size from 20 to 50 |
| 12:15 PM | Error rate dropped to 3.2% |
| 12:30 PM | Error rate normalized to 0.8% |
| 12:47 PM | Incident resolved |

---

## Root Cause

**What happened:**
Database connection pool (max 20 connections) was exhausted during a traffic spike 
(1200 concurrent users from load testing). New requests waited for available 
connections, causing timeouts and 503 errors.

**Why it happened:**
- Connection pool size (20) was too small for peak load
- No alerting on connection pool saturation
- Load testing identified issue but fix not deployed to production

---

## User Impact

- 8.5% error rate at peak (12:00-12:15 PM)
- Approximately 500 users affected
- Primary impact: Insight API (getIssues, runAnalysis)
- No data loss or corruption

---

## What Went Well

- Prometheus alerts triggered immediately
- Incident response within 2 minutes
- Root cause identified quickly (5 minutes)
- Mitigation effective (error rate dropped within 10 minutes)
- Clear communication in Slack incident channel

---

## What Went Wrong

- No proactive alerting on connection pool saturation
- Load test findings not acted upon
- No automatic scaling of database connections
- Status page updated late (20 minutes into incident)

---

## Action Items

### Immediate (< 24 hours)
- [x] Increase connection pool size in production (20 → 50) - **Ahmed**
- [ ] Add Prometheus alert for connection pool > 80% - **Mike**
- [ ] Document connection pool tuning - **Sarah**

### Short-term (< 1 week)
- [ ] Implement automatic connection pool scaling - **Ahmed**
- [ ] Add connection pool metrics to Grafana - **Mike**
- [ ] Review all database configuration settings - **John**
- [ ] Automate status page updates from PagerDuty - **Sarah**

### Long-term (< 1 month)
- [ ] Implement connection pooling best practices doc - **Team**
- [ ] Add load testing to pre-deployment checklist - **Team**
- [ ] Review all resource limits (CPU, memory, connections) - **Team**

---

## Lessons Learned

1. **Proactive monitoring is critical**: We should have alerts BEFORE hitting limits
2. **Load testing findings must be acted upon**: Don't wait for production incidents
3. **Status page automation**: Manual updates are too slow during incidents
4. **Connection pooling is not "set and forget"**: Needs ongoing tuning as load grows

---

## Appendix

### Relevant Logs
```
[2025-11-24 12:05:15] ERROR: Database connection timeout after 5000ms
[2025-11-24 12:05:16] WARN: Connection pool exhausted (20/20 active)
[2025-11-24 12:05:17] ERROR: ECONNREFUSED: Connection pool full
```

### Metrics Screenshots
- Error rate graph: [link]
- Connection pool saturation: [link]
- Response time degradation: [link]

### Related Issues
- Chaos experiment: database-connection-pool-exhaustion
- GitHub issue: #1234 - High error rate during load testing
```

**Postmortem Meeting:**
- Schedule within 48 hours of incident resolution
- Invite all participants + stakeholders
- Focus on learning, not blame
- Document action items with owners and deadlines

---

## 🎯 Chaos Engineering Specific Procedures

### When Chaos Experiment Fails

**Definition of Failure:**
- Steady-state hypothesis fails after experiment
- System does not recover within expected timeframe
- Error rate remains elevated (> 1%) after 5 minutes
- Circuit breakers remain open after 30 seconds

**Immediate Actions:**

1. **Stop the Experiment:**
   ```bash
   # If using Chaos Toolkit CLI
   Ctrl+C (interrupt)
   
   # Rollback actions will execute automatically
   # Verify rollback completed:
   chaos validate apps/studio-hub/chaos/experiments/database-pod-failure.json
   ```

2. **Verify System Recovery:**
   ```bash
   # Check application health
   curl https://staging.odavl.studio/api/health
   
   # Check all pods running
   kubectl get pods -n odavl-staging
   
   # Check error rate
   curl "$PROMETHEUS_URL/api/v1/query?query=(sum(rate(http_requests_total{status=~\"5..\"}[1m])) / sum(rate(http_requests_total[1m]))) * 100"
   ```

3. **Manual Cleanup (if rollback failed):**
   ```bash
   # Remove network policies
   kubectl delete networkpolicy -n odavl-staging -l chaos=true
   
   # Kill stress processes
   kubectl exec -it $(kubectl get pods -n odavl-staging -l app=studio-hub -o name | head -1) -- pkill -9 stress-ng
   
   # Restart pods if needed
   kubectl rollout restart deployment studio-hub -n odavl-staging
   
   # Terminate idle database connections
   kubectl exec -it postgres-0 -n odavl-staging -- psql -U postgres -d odavl_studio -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '1 minute';"
   ```

4. **Analyze Failure:**
   - Review experiment journal: `reports/chaos/[experiment]-journal.json`
   - Check Grafana dashboards during experiment window
   - Review application logs: `kubectl logs -n odavl-staging -l app=studio-hub --since=30m`
   - Identify why system did not recover

5. **Update Resilience Mechanisms:**
   - Adjust circuit breaker thresholds
   - Increase timeout values
   - Add retry logic
   - Improve error handling

### Chaos Experiment Approval Process

**Production Chaos Experiments (SEV-2 risk):**

1. **Require Approval from:**
   - Incident Commander
   - Backend Lead
   - DevOps Lead

2. **Approval Criteria:**
   - Staging experiments passed successfully
   - Business hours avoided (no Mon 9am-5pm, no Fri 4pm-midnight)
   - Recent incidents < 7 days (wait for stability)
   - Error budget allows (> 50% remaining)
   - On-call engineers available

3. **Approval Command:**
   ```bash
   # Manual workflow dispatch requires approval
   gh workflow run chaos-tests.yml \
     --field environment=production \
     --field experiment=database-pod-failure \
     --field skip_validation=false
   ```

---

## 📊 Monitoring & Alerting

### Critical Alerts

**Prometheus Alert Rules:**

```yaml
# High Error Rate
- alert: HighErrorRate
  expr: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100 > 1
  for: 3m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }}% (threshold: 1%)"

# Circuit Breaker Open
- alert: CircuitBreakerOpen
  expr: circuit_breaker_state == 1
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "Circuit breaker {{ $labels.service }} is OPEN"
    description: "Service {{ $labels.service }} circuit breaker tripped"

# Database Connection Pool Saturation
- alert: ConnectionPoolSaturated
  expr: (pg_stat_database_numbackends / pg_settings_max_connections) * 100 > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Database connection pool saturation"
    description: "Connection pool is {{ $value }}% full (threshold: 80%)"

# Pod Restarts
- alert: HighPodRestartRate
  expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High pod restart rate"
    description: "Pod {{ $labels.pod }} restarting frequently"
```

### Dashboards

**Grafana Dashboards:**

1. **Production Overview**: https://grafana.odavl.studio/d/production-overview
   - Request rate, error rate, latency (P50/P95/P99)
   - Active users, database connections
   - Circuit breaker states

2. **Database Health**: https://grafana.odavl.studio/d/database-health
   - Connection pool usage
   - Query duration (P50/P95/P99)
   - Slow queries
   - Replication lag

3. **Chaos Engineering**: https://grafana.odavl.studio/d/chaos-engineering
   - Experiment execution history
   - Recovery time metrics
   - Steady-state hypothesis pass/fail
   - Circuit breaker activation during experiments

---

## 🔧 Tools & Resources

### Runbooks
- Database failover: https://runbook.odavl.com/database-failover
- Kubernetes pod debugging: https://runbook.odavl.com/k8s-pod-debug
- Circuit breaker manual reset: https://runbook.odavl.com/circuit-breaker-reset

### Documentation
- Architecture diagram: https://wiki.odavl.com/architecture
- Deployment process: https://wiki.odavl.com/deployment
- Monitoring setup: https://wiki.odavl.com/monitoring

### Contacts
- PagerDuty: https://odavl.pagerduty.com
- Slack: #incidents, #chaos-engineering, #devops
- Email: oncall@odavl.com

---

**Last Updated:** November 24, 2025  
**Next Review:** December 24, 2025  
**Owner:** DevOps Team  
**Approvers:** Incident Commander, CTO
