# Production Deployment Guide

## Overview

This guide covers the complete production deployment process for ODAVL Studio, including staging validation, production deployment, monitoring, and rollback procedures.

## Prerequisites

### Infrastructure Requirements
- PostgreSQL 15+ database (managed service recommended)
- Node.js 20+ runtime environment
- Docker (if using containers)
- CDN for static assets (optional)
- Load balancer (for multiple instances)

### Access Requirements
- Production database credentials
- Cloud storage credentials (S3/Azure)
- OAuth provider credentials (GitHub, Google)
- SMTP credentials for emails
- Monitoring service credentials (Sentry)

### Required Environment Variables

See [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) for complete list.

## Deployment Workflow

### 1. Staging Deployment

```powershell
# Setup staging environment
.\scripts\setup-staging.ps1

# Start staging server
cd apps/studio-hub
pnpm dev

# Run staging tests
pnpm test
pnpm test:e2e
```

### 2. Pre-Deployment Validation

```powershell
# Run forensic checks (required before production)
pnpm forensic:all

# Verify all checks pass:
# - ESLint: 0 errors
# - TypeScript: 0 errors  
# - Tests: 100% passing
# - Coverage: >80%

# Create production build
pnpm build

# Test production build locally
cd apps/studio-hub
pnpm start
```

### 3. Production Deployment

```powershell
# Deploy to production (with safety checks)
.\scripts\deploy-production.ps1 -Version "1.0.0"

# Dry run first (recommended)
.\scripts\deploy-production.ps1 -Version "1.0.0" -DryRun

# Skip tests (use with caution)
.\scripts\deploy-production.ps1 -Version "1.0.0" -SkipTests
```

### 4. Post-Deployment Verification

```bash
# Check health endpoint
curl https://odavl.studio/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-03T...",
  "version": "1.0.0",
  "environment": "production"
}

# Check readiness
curl https://odavl.studio/api/health/ready

# Expected: All checks should be "healthy"
```

### 5. Smoke Tests

```bash
# Test authentication
curl -X POST https://odavl.studio/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test API with key
curl -H "x-api-key: YOUR_KEY" \
  https://odavl.studio/api/v1/usage

# Test workspace sync
odavl login
odavl sync push --name test-workspace
odavl sync pull --name test-workspace
```

## Deployment Strategies

### Blue-Green Deployment

```powershell
# Deploy to green environment
kubectl set image deployment/odavl-studio-green app=odavl-studio:1.0.0

# Wait for green to be ready
kubectl wait --for=condition=ready pod -l app=odavl-studio-green

# Switch traffic to green
kubectl patch service odavl-studio -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue running for rollback
# After verification, scale down blue:
kubectl scale deployment/odavl-studio-blue --replicas=0
```

### Rolling Deployment

```powershell
# Update deployment with new version
kubectl set image deployment/odavl-studio app=odavl-studio:1.0.0

# Monitor rollout
kubectl rollout status deployment/odavl-studio

# Rollout automatically pauses on health check failures
```

### Canary Deployment

```powershell
# Deploy canary (10% traffic)
kubectl apply -f k8s/canary-deployment.yaml

# Monitor metrics for 15 minutes
# If metrics good, increase to 50%
kubectl scale deployment/odavl-studio-canary --replicas=5

# If metrics good, promote to 100%
kubectl scale deployment/odavl-studio-canary --replicas=10
kubectl scale deployment/odavl-studio --replicas=0
```

## Database Migrations

### Safe Migration Process

```powershell
# 1. Create backup
pnpm backup:create

# 2. Test migration on staging
cd apps/studio-hub
pnpm prisma migrate deploy --preview

# 3. Apply to production (during maintenance window)
pnpm prisma migrate deploy

# 4. Verify data integrity
pnpm prisma db pull
```

### Rollback Migration

```powershell
# Restore from backup
pnpm backup:restore --backup-id backup-YYYYMMDD

# Or use manual rollback
pnpm prisma migrate down --name migration-name
```

## Monitoring & Alerts

### Key Metrics to Monitor

**Application Metrics:**
- Response time (p50, p95, p99)
- Error rate (target: <1%)
- Request rate (requests per second)
- Active connections

**Database Metrics:**
- Connection pool usage
- Query duration
- Slow queries (>1s)
- Database size

**System Metrics:**
- CPU usage (target: <70%)
- Memory usage (target: <80%)
- Disk usage (target: <80%)
- Network I/O

### Alert Configuration

```yaml
# Example alert rules
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: SlowResponseTime
    condition: p95_response_time > 2s
    duration: 5m
    severity: warning
    
  - name: DatabaseConnectionPool
    condition: db_pool_usage > 80%
    duration: 5m
    severity: warning
```

## Rollback Procedures

### Deployment Rollback

```powershell
# Quick rollback to previous version
kubectl rollout undo deployment/odavl-studio

# Rollback to specific revision
kubectl rollout undo deployment/odavl-studio --to-revision=2

# Verify rollback
kubectl rollout status deployment/odavl-studio
```

### Database Rollback

```powershell
# 1. Stop application
kubectl scale deployment/odavl-studio --replicas=0

# 2. Restore database from backup
pnpm backup:restore --backup-id backup-YYYYMMDD

# 3. Rollback to previous code version
kubectl rollout undo deployment/odavl-studio

# 4. Start application
kubectl scale deployment/odavl-studio --replicas=3

# 5. Verify health
curl https://odavl.studio/api/health
```

## Disaster Recovery

### Recovery Time Objective (RTO)

Target: 1 hour from incident detection to full service restoration

### Recovery Point Objective (RPO)

Target: Maximum 1 hour of data loss (hourly backups)

### Disaster Recovery Plan

```powershell
# 1. Assess situation
.\scripts\disaster-recovery-status.ps1

# 2. List available backups
pnpm backup:list

# 3. Execute recovery
.\scripts\disaster-recovery.ps1 -BackupId backup-YYYYMMDD

# 4. Verify restoration
curl https://odavl.studio/api/health/ready

# 5. Notify team
# Send notification to #incidents channel
```

## Backup & Restore

### Automated Backups

```bash
# Configure backup schedule (daily at 2 AM)
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=7
BACKUP_RETENTION_WEEKS=4
BACKUP_RETENTION_MONTHS=3
```

### Manual Backup

```powershell
# Create manual backup
pnpm backup:create

# Create incremental backup
pnpm backup:create --type incremental
```

### Restore Process

```powershell
# List available backups
pnpm backup:list

# Restore from specific backup
pnpm backup:restore --backup-id backup-2025-12-03T02-00-00

# Test restore (dry run)
pnpm backup:restore --backup-id backup-2025-12-03T02-00-00 --dry-run
```

## Security Checklist

- [ ] All secrets stored in environment variables (not in code)
- [ ] API keys rotated regularly
- [ ] Database password strong (16+ characters)
- [ ] SSL/TLS enabled for all connections
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] No known vulnerabilities (`pnpm audit`)

## Performance Optimization

### Database

```sql
-- Create indexes for common queries
CREATE INDEX idx_api_keys_user_id ON "ApiKey"(user_id);
CREATE INDEX idx_usage_records_api_key_id ON "UsageRecord"(api_key_id);
CREATE INDEX idx_usage_records_timestamp ON "UsageRecord"(timestamp);

-- Enable query logging for slow queries
ALTER DATABASE odavl_prod SET log_min_duration_statement = 1000;
```

### Caching

```typescript
// Cache frequently accessed data
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache usage stats
const cacheKey = `usage:${userId}:${period}`;
const cached = cache.get(cacheKey);
if (cached) return cached;

// Compute and cache
const stats = await computeUsageStats(userId, period);
cache.set(cacheKey, stats);
```

### CDN Configuration

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache API responses (with short TTL)
location /api/health {
    proxy_cache health_cache;
    proxy_cache_valid 200 30s;
}
```

## Troubleshooting

### Common Issues

**Issue: Health check failing**
```bash
# Check logs
kubectl logs deployment/odavl-studio

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check environment variables
kubectl exec deployment/odavl-studio -- env | grep DATABASE_URL
```

**Issue: High response times**
```bash
# Check database slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**Issue: Memory leaks**
```bash
# Monitor memory usage
kubectl top pods -l app=odavl-studio

# Take heap snapshot
node --inspect --heap-prof app.js
```

## Support

- **Documentation**: https://docs.odavl.studio
- **Status Page**: https://status.odavl.studio
- **Support Email**: support@odavl.studio
- **Emergency Contact**: [on-call engineer]

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for deployment history.
