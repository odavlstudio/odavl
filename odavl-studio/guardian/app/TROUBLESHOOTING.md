# Troubleshooting Guide

Common issues and solutions for Guardian deployment and operation.

## Table of Contents

- [Application Issues](#application-issues)
- [Database Issues](#database-issues)
- [Redis Issues](#redis-issues)
- [Performance Issues](#performance-issues)
- [Authentication Issues](#authentication-issues)
- [API Issues](#api-issues)
- [Deployment Issues](#deployment-issues)
- [Monitoring Issues](#monitoring-issues)
- [Getting Help](#getting-help)

## Application Issues

### Application Won't Start

**Symptoms:**

- Server exits immediately after startup
- "Cannot find module" errors
- Port binding errors

**Solutions:**

1. **Check dependencies:**

```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Verify Prisma Client
pnpx prisma generate
```

1. **Check environment variables:**

```bash
# Verify .env file exists and contains required variables
cat .env

# Required variables:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - API_KEYS_SECRET
```

1. **Check port availability:**

```bash
# Linux/Mac
lsof -i :3003

# Windows
netstat -ano | findstr :3003

# Kill process or change PORT in .env
```

1. **Check logs:**

```bash
# Development
pnpm dev 2>&1 | tee app.log

# Production
pm2 logs guardian
```

### Next.js Build Failures

**Symptoms:**

- "Failed to compile" errors
- TypeScript errors during build
- Out of memory errors

**Solutions:**

1. **Clear caches:**

```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo

# Clear node_modules
rm -rf node_modules && pnpm install
```

1. **Increase Node memory:**

```bash
# Add to package.json scripts
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

1. **Check TypeScript errors:**

```bash
# Type check without building
pnpm type-check

# View specific errors
pnpm type-check 2>&1 | grep error
```

### Module Resolution Errors

**Symptoms:**

- "Cannot resolve module" errors
- Import path errors

**Solutions:**

1. **Check tsconfig.json paths:**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

1. **Restart TypeScript server (VS Code):**

- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

1. **Verify file exists:**

```bash
ls -la src/lib/logger.ts
```

## Database Issues

### Cannot Connect to Database

**Symptoms:**

- `P1001: Can't reach database server`
- Connection timeout errors

**Solutions:**

1. **Verify PostgreSQL is running:**

```bash
# Check service status
systemctl status postgresql  # Linux
pg_isready  # All platforms

# Start PostgreSQL
systemctl start postgresql  # Linux
brew services start postgresql  # Mac
```

1. **Test connection:**

```bash
# Using psql
psql $DATABASE_URL

# Using connection string directly
psql "postgresql://user:pass@localhost:5432/guardian"
```

1. **Check firewall:**

```bash
# Allow PostgreSQL port
sudo ufw allow 5432  # Linux
```

1. **Verify DATABASE_URL format:**

```bash
# Correct format
postgresql://username:password@hostname:5432/database?schema=public

# Common mistakes:
# - Missing password
# - Wrong port
# - Missing database name
```

### Migration Errors

**Symptoms:**

- `P3009: Failed to apply migration`
- "Table already exists" errors

**Solutions:**

1. **Check migration status:**

```bash
pnpx prisma migrate status
```

1. **Resolve failed migrations:**

```bash
# Mark migration as applied
pnpx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
pnpx prisma migrate resolve --rolled-back <migration_name>
```

1. **Reset database (⚠️ destructive):**

```bash
pnpx prisma migrate reset
```

1. **Manual migration:**

```bash
# Generate SQL
pnpx prisma migrate dev --create-only --name fix_migration

# Edit SQL in prisma/migrations/
# Then apply
pnpx prisma migrate deploy
```

### Slow Queries

**Symptoms:**

- High database CPU usage
- Slow API responses
- Query timeout errors

**Solutions:**

1. **Enable query logging:**

```env
# .env
DATABASE_URL="postgresql://...?log_min_duration_statement=100"
```

1. **Check slow queries:**

```sql
-- Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';
```

1. **Add indexes:**

```prisma
// schema.prisma
model User {
  email String @unique
  
  @@index([email])
  @@index([createdAt])
}
```

1. **Optimize queries:**

```typescript
// Bad: Fetch all fields
const users = await prisma.user.findMany();

// Good: Select only needed fields
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});
```

### Connection Pool Exhausted

**Symptoms:**

- `P2024: Timed out fetching a new connection from the pool`
- Intermittent connection errors

**Solutions:**

1. **Increase connection limit:**

```env
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=10"
```

1. **Use connection pooler (PgBouncer):**

```bash
# Install PgBouncer
apt-get install pgbouncer

# Configure pgbouncer.ini
[databases]
guardian = host=localhost dbname=guardian

[pgbouncer]
listen_port = 6432
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

1. **Check for connection leaks:**

```typescript
// Always use try-finally
const prisma = new PrismaClient();

try {
  await prisma.user.findMany();
} finally {
  await prisma.$disconnect();
}
```

## Redis Issues

### Cannot Connect to Redis

**Symptoms:**

- `ECONNREFUSED ::1:6379`
- Redis connection timeout

**Solutions:**

1. **Verify Redis is running:**

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Start Redis
redis-server

# Or as service
systemctl start redis  # Linux
brew services start redis  # Mac
```

1. **Test connection:**

```bash
# Connect to Redis
redis-cli

# With authentication
redis-cli -a your-password

# Remote connection
redis-cli -h redis.example.com -p 6379 -a password
```

1. **Check REDIS_URL:**

```env
# Local
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# TLS
REDIS_URL=rediss://redis.example.com:6380
```

### Redis Out of Memory

**Symptoms:**

- `OOM command not allowed when used memory > maxmemory`
- Cache operations failing

**Solutions:**

1. **Check memory usage:**

```bash
redis-cli INFO memory
```

1. **Increase maxmemory:**

```bash
# Edit redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru

# Restart Redis
systemctl restart redis
```

1. **Clear cache:**

```bash
# Flush all keys (⚠️ destructive)
redis-cli FLUSHALL

# Delete by pattern
redis-cli --scan --pattern 'cache:*' | xargs redis-cli DEL
```

1. **Set expiration on keys:**

```typescript
// Always set TTL
await redis.setex('key', 3600, 'value');  // 1 hour

// Check keys without expiration
// redis-cli
KEYS *
TTL <key>  // -1 means no expiration
```

### Redis Slow Performance

**Symptoms:**

- Slow cache reads/writes
- High Redis CPU usage

**Solutions:**

1. **Check slow log:**

```bash
redis-cli SLOWLOG GET 10
```

1. **Optimize commands:**

```typescript
// Bad: Multiple individual GETs
for (const key of keys) {
  await redis.get(key);
}

// Good: Use MGET
await redis.mget(...keys);
```

1. **Use pipelining:**

```typescript
const pipeline = redis.pipeline();
for (const key of keys) {
  pipeline.get(key);
}
await pipeline.exec();
```

## Performance Issues

### High Memory Usage

**Symptoms:**

- Application consuming excessive memory
- Out of memory errors
- Slow response times

**Solutions:**

1. **Check memory usage:**

```bash
# Node.js memory usage
node --expose-gc -e "setInterval(() => { gc(); console.log(process.memoryUsage()) }, 1000)"

# In production
pm2 monit
```

1. **Enable heap snapshots:**

```typescript
// Add to server startup
import v8 from 'v8';

if (process.env.HEAP_SNAPSHOT) {
  v8.writeHeapSnapshot();
}
```

1. **Check for memory leaks:**

```bash
# Using clinic.js
npm install -g clinic
clinic doctor -- node server.js
```

1. **Optimize large data handling:**

```typescript
// Bad: Load all data at once
const allUsers = await prisma.user.findMany();

// Good: Use pagination
const users = await prisma.user.findMany({
  take: 100,
  skip: page * 100,
});

// Good: Use streaming
const stream = await prisma.user.findManyAndStream();
```

### Slow API Responses

**Symptoms:**

- High response times (>1s)
- Timeouts
- Poor user experience

**Solutions:**

1. **Check metrics:**

```bash
# View metrics endpoint
curl http://localhost:3003/api/metrics
```

1. **Enable query logging:**

```env
LOG_LEVEL=debug
SLOW_QUERY_THRESHOLD=100
```

1. **Add caching:**

```typescript
import { getOrSet } from '@/lib/cache';

const data = await getOrSet(
  `cache-key`,
  async () => await expensiveOperation(),
  3600  // TTL in seconds
);
```

1. **Optimize database queries:**

```typescript
// Add indexes
// Use select instead of fetching all fields
// Use pagination
// Avoid N+1 queries
```

### High CPU Usage

**Symptoms:**

- CPU at 100%
- Slow request processing
- Server unresponsive

**Solutions:**

1. **Profile CPU usage:**

```bash
# Using clinic.js flame
clinic flame -- node server.js

# Using node --prof
node --prof server.js
node --prof-process isolate-*.log > processed.txt
```

1. **Check for infinite loops:**

```typescript
// Add timeout to async operations
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 5000)
);

const result = await Promise.race([operation(), timeout]);
```

1. **Optimize hot paths:**

```typescript
// Bad: Repeated expensive operations
for (const item of items) {
  const result = expensiveOperation(item);
}

// Good: Batch operations
const results = await batchOperation(items);
```

## Authentication Issues

### JWT Token Invalid or Expired

**Symptoms:**

- 401 Unauthorized errors
- "Token expired" messages

**Solutions:**

1. **Verify token:**

```typescript
import jwt from 'jsonwebtoken';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

1. **Check token expiration:**

```typescript
const decoded = jwt.decode(token);
console.log('Expires at:', new Date(decoded.exp * 1000));
```

1. **Implement token refresh:**

```typescript
// Request new access token with refresh token
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});
```

### API Key Not Working

**Symptoms:**

- 401 Unauthorized with valid API key
- "Invalid API key" errors

**Solutions:**

1. **Verify API key format:**

```bash
# Should match pattern: grd_(live|test)_[a-z0-9]{32}
echo "grd_live_1234567890abcdef1234567890abcdef" | grep -E '^grd_(live|test)_[a-z0-9]{32}$'
```

1. **Check API key in database:**

```sql
SELECT * FROM api_keys WHERE key = 'hashed_key';
```

1. **Test API key:**

```bash
curl -H "X-API-Key: grd_live_..." http://localhost:3003/api/health
```

1. **Verify rate limits:**

```bash
# Check rate limit headers
curl -i -H "X-API-Key: ..." http://localhost:3003/api/projects

# Headers:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 950
# X-RateLimit-Reset: 1705320600
```

### CSRF Token Validation Failed

**Symptoms:**

- 403 Forbidden on POST/PUT/DELETE requests
- "Invalid CSRF token" errors

**Solutions:**

1. **Get CSRF token:**

```typescript
const { token } = await fetch('/api/csrf-token').then(r => r.json());
```

1. **Include token in requests:**

```typescript
// Option 1: Header
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
  body: JSON.stringify(data),
});

// Option 2: Body parameter
fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify({ ...data, _csrf: token }),
});
```

1. **Check cookie settings:**

```typescript
// Ensure cookies are sent with requests
fetch('/api/projects', {
  method: 'POST',
  credentials: 'include',  // Important!
  headers: { 'X-CSRF-Token': token },
});
```

## API Issues

### 404 Not Found

**Symptoms:**

- API endpoint returns 404
- "Cannot GET /api/..." errors

**Solutions:**

1. **Check route exists:**

```bash
# List all API routes
ls -la src/app/api/

# Check specific route
ls -la src/app/api/projects/route.ts
```

1. **Verify route file naming:**

```
✅ Correct:
- src/app/api/projects/route.ts
- src/app/api/projects/[id]/route.ts

❌ Incorrect:
- src/app/api/projects.ts
- src/app/api/projects/index.ts
```

1. **Check HTTP method:**

```typescript
// route.ts must export named functions
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

### 500 Internal Server Error

**Symptoms:**

- API returns 500 error
- Generic error messages

**Solutions:**

1. **Check server logs:**

```bash
# Development
tail -f logs/combined.log

# Production
pm2 logs guardian
kubectl logs -f deployment/guardian  # Kubernetes
```

1. **Enable detailed error logging:**

```env
LOG_LEVEL=debug
NODE_ENV=development
```

1. **Check error handler:**

```typescript
// Ensure errors are caught and logged
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw error;  // Re-throw for error handler
}
```

### Rate Limit Exceeded

**Symptoms:**

- 429 Too Many Requests
- "Rate limit exceeded" errors

**Solutions:**

1. **Check rate limit headers:**

```bash
curl -i -H "X-API-Key: ..." http://localhost:3003/api/projects

# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1705320600
# Retry-After: 3600
```

1. **Implement exponential backoff:**

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;  // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

1. **Upgrade tier:**

```bash
# Contact support to upgrade plan
# FREE: 100/hour → PRO: 1000/hour → ENTERPRISE: unlimited
```

## Deployment Issues

### Docker Build Failures

**Symptoms:**

- Docker build fails
- Missing dependencies errors

**Solutions:**

1. **Clear Docker cache:**

```bash
docker build --no-cache -t guardian:latest .
```

1. **Check Dockerfile:**

```dockerfile
# Use correct base image
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Copy files in correct order
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
```

1. **Check .dockerignore:**

```
node_modules
.next
.env
.git
```

### Kubernetes Pod CrashLoopBackOff

**Symptoms:**

- Pods restarting repeatedly
- CrashLoopBackOff status

**Solutions:**

1. **Check pod logs:**

```bash
kubectl logs <pod-name> -n guardian
kubectl logs <pod-name> -n guardian --previous  # Previous container
```

1. **Describe pod:**

```bash
kubectl describe pod <pod-name> -n guardian
```

1. **Check liveness/readiness probes:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3003
  initialDelaySeconds: 30  # Increase if app takes time to start
  periodSeconds: 10
```

1. **Check secrets:**

```bash
# Verify secrets exist
kubectl get secrets -n guardian

# Check secret contents
kubectl get secret guardian-secrets -n guardian -o yaml
```

### Health Check Failures

**Symptoms:**

- Load balancer marks instances unhealthy
- Pods not ready in Kubernetes

**Solutions:**

1. **Test health endpoint:**

```bash
curl http://localhost:3003/api/health
```

1. **Check health dependencies:**

```typescript
// Ensure database and Redis are accessible
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

1. **Adjust probe timing:**

```yaml
readinessProbe:
  initialDelaySeconds: 15  # Increase for slow startup
  periodSeconds: 5
  failureThreshold: 3
```

## Monitoring Issues

### Metrics Not Collected

**Symptoms:**

- Prometheus not scraping metrics
- Empty Grafana dashboards

**Solutions:**

1. **Verify metrics endpoint:**

```bash
curl http://localhost:3003/api/metrics
```

1. **Check Prometheus config:**

```yaml
scrape_configs:
  - job_name: 'guardian'
    static_configs:
      - targets: ['guardian:3003']
    metrics_path: '/api/metrics'
```

1. **Check ServiceMonitor (Kubernetes):**

```bash
kubectl get servicemonitor guardian -n guardian -o yaml
```

### Tracing Not Working

**Symptoms:**

- No traces in Jaeger
- Distributed tracing gaps

**Solutions:**

1. **Verify Jaeger endpoint:**

```env
JAEGER_ENABLED=true
JAEGER_ENDPOINT=http://jaeger-collector:14268/api/traces
```

1. **Test Jaeger connection:**

```bash
curl http://jaeger-collector:14268/api/traces
```

1. **Check trace sampling:**

```typescript
// Increase sampling rate for debugging
const tracer = trace.getTracer('guardian', '1.0.0');
const sampler = new AlwaysOnSampler();  // Sample all traces
```

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# System information
node --version
pnpm --version
psql --version
redis-cli --version

# Application version
cat package.json | grep version

# Environment (sanitize secrets!)
env | grep -E '(NODE_ENV|DATABASE_URL|REDIS_URL)' | sed 's/:[^@]*@/:***@/'

# Logs
tail -n 100 logs/combined.log

# Metrics
curl http://localhost:3003/api/metrics
```

### Support Channels

- **Documentation**: <https://docs.guardian.odavl.com>
- **GitHub Issues**: <https://github.com/odavl/guardian/issues>
- **Community Forum**: <https://community.odavl.com>
- **Email Support**: <support@guardian.odavl.com>
- **Enterprise Support**: <enterprise@guardian.odavl.com> (24/7)

### Creating a Bug Report

Include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Exact steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, Guardian version
6. **Logs**: Relevant log excerpts
7. **Screenshots**: If applicable

---

**Last Updated**: January 2025  
**Maintainer**: ODAVL Support Team
