# Docker Quick Start Guide

**ODAVL Guardian - Containerized Deployment**  
**Week 4 Deliverable - Infrastructure as Code**

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Navigate to Guardian app
cd apps/guardian

# 2. Copy environment file
cp .env.docker .env

# 3. Start all services (PostgreSQL + Redis + Guardian)
docker-compose up -d

# 4. Wait for health checks (30-60 seconds)
docker-compose ps

# 5. Open application
open http://localhost:3000
```

---

## 📦 What's Included

### Services

- **PostgreSQL 16** - Database (port 5432)
- **Redis 7** - Cache (port 6379)
- **Guardian App** - Next.js application (port 3000)

### Features

- ✅ Multi-stage Docker build (optimized for production)
- ✅ Non-root user (security best practice)
- ✅ Health checks (automatic restart on failure)
- ✅ Persistent volumes (data survives container restarts)
- ✅ Connection pooling (10 connections, 5s timeout)
- ✅ Redis caching (512MB LRU eviction)
- ✅ Proper signal handling (dumb-init)

---

## 📋 Prerequisites

### Required

- **Docker** 24.0+ ([Install](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.20+ (included with Docker Desktop)

### Verify Installation

```bash
docker --version
# Expected: Docker version 24.0.0 or higher

docker-compose --version
# Expected: Docker Compose version v2.20.0 or higher
```

---

## 🔧 Configuration

### Environment Variables

**Option 1: Use .env file (recommended)**

```bash
cp .env.docker .env
# Edit .env with your values
```

**Option 2: Inline environment variables**

```bash
POSTGRES_PASSWORD=securepass123 docker-compose up -d
```

### Critical Variables to Change in Production

```bash
# .env file
POSTGRES_PASSWORD=CHANGE_ME         # Use strong password (16+ chars)
NEXTAUTH_SECRET=CHANGE_ME           # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=CHANGE_ME                # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_URL=https://your-domain.com
```

---

## 🎯 Usage Commands

### Start Services

```bash
# Start all services (detached mode)
docker-compose up -d

# Start with logs (foreground)
docker-compose up

# Start specific service
docker-compose up -d guardian
```

### Stop Services

```bash
# Stop all services (preserves data)
docker-compose stop

# Stop and remove containers (preserves volumes)
docker-compose down

# Stop and remove everything (⚠️ DELETES DATA!)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f guardian

# Last 100 lines
docker-compose logs --tail=100 guardian
```

### Check Status

```bash
# Service status
docker-compose ps

# Health check status
docker-compose ps guardian
# Look for "healthy" in STATUS column

# Detailed inspection
docker inspect odavl-guardian-app | grep -A 10 Health
```

---

## 🏗️ Build & Development

### Production Build

```bash
# Build images
docker-compose build

# Build with no cache (clean build)
docker-compose build --no-cache

# Build specific service
docker-compose build guardian
```

### Development Mode

Use `docker-compose.dev.yml` for development:

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Features:
# - Hot reload enabled
# - Source code mounted as volume
# - Prisma query logs enabled (DEBUG=prisma:query)
# - Different ports (5433, 6380, 3001) to avoid conflicts
```

---

## 🔍 Debugging & Troubleshooting

### Check Container Health

```bash
# Container status
docker-compose ps

# Expected output:
# NAME                      STATUS
# odavl-guardian-app        Up (healthy)
# odavl-guardian-db         Up (healthy)
# odavl-guardian-redis      Up (healthy)
```

### Access Container Shell

```bash
# Guardian app
docker-compose exec guardian sh

# PostgreSQL
docker-compose exec postgres psql -U odavl -d guardian

# Redis
docker-compose exec redis redis-cli
```

### View Application Logs

```bash
# Real-time logs
docker-compose logs -f guardian

# Last 500 lines
docker-compose logs --tail=500 guardian

# Logs from specific time
docker-compose logs --since 10m guardian
```

### Database Operations

```bash
# Connect to database
docker-compose exec postgres psql -U odavl -d guardian

# Run migrations
docker-compose exec guardian pnpm exec prisma migrate deploy

# Generate Prisma client
docker-compose exec guardian pnpm exec prisma generate

# Database backup
docker-compose exec postgres pg_dump -U odavl guardian > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U odavl guardian < backup.sql
```

---

## 🐛 Common Issues

### Issue 1: Port Already in Use

**Error:**

```
Error: bind: address already in use
```

**Solution:**

```bash
# Option 1: Stop conflicting service
sudo systemctl stop postgresql  # Stop local PostgreSQL
sudo systemctl stop redis       # Stop local Redis

# Option 2: Change ports in .env
POSTGRES_PORT=5433
REDIS_PORT=6380
GUARDIAN_PORT=3001
```

### Issue 2: Database Connection Failed

**Error:**

```
Error: Can't reach database server at `postgres:5432`
```

**Solution:**

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for health check (30 seconds)
sleep 30 && docker-compose ps
```

### Issue 3: Guardian Unhealthy

**Error:**

```
STATUS: Up (unhealthy)
```

**Solution:**

```bash
# Check health check logs
docker inspect odavl-guardian-app | grep -A 20 Health

# View application logs
docker-compose logs guardian

# Common causes:
# 1. Database not ready → Wait 60s for startup
# 2. Missing migrations → Run: docker-compose exec guardian pnpm exec prisma migrate deploy
# 3. Environment variables → Check DATABASE_URL in .env
```

### Issue 4: Out of Memory

**Error:**

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution:**

```bash
# Increase Node.js heap size in .env
NODE_OPTIONS=--max-old-space-size=4096

# Restart services
docker-compose restart guardian
```

### Issue 5: Slow Performance

**Symptoms:** API responses >500ms

**Solution:**

```bash
# Check Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG

# Verify cache hit rate
docker-compose exec redis redis-cli info stats | grep hits

# Check database connections
docker-compose exec postgres psql -U odavl -d guardian -c "SELECT count(*) FROM pg_stat_activity;"

# Verify indexes exist
docker-compose exec guardian pnpm exec prisma db execute --stdin < check-indexes.sql
```

---

## 📊 Monitoring & Health

### Health Endpoints

```bash
# Basic health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Readiness probe (DB + Redis connectivity)
curl http://localhost:3000/api/ready
# Expected: {"status":"ready","database":"connected","redis":"connected"}
```

### Resource Usage

```bash
# Container stats (real-time)
docker stats odavl-guardian-app odavl-guardian-db odavl-guardian-redis

# Expected:
# NAME                  CPU %    MEM USAGE / LIMIT     MEM %
# odavl-guardian-app    5%       512MB / 2GB          25%
# odavl-guardian-db     2%       256MB / 1GB          25%
# odavl-guardian-redis  1%       128MB / 512MB        25%
```

### Volume Inspection

```bash
# List volumes
docker volume ls | grep odavl

# Inspect volume
docker volume inspect odavl-guardian-postgres

# Backup volume
docker run --rm -v odavl-guardian-postgres:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## 🔐 Security Best Practices

### 1. Change Default Passwords

```bash
# Generate secure password
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in .env
POSTGRES_PASSWORD=<generated-password>
NEXTAUTH_SECRET=<generated-secret>
JWT_SECRET=<generated-secret>
```

### 2. Use Non-Root User

**Already implemented in Dockerfile:**

```dockerfile
USER nextjs  # Non-root user (UID 1001)
```

### 3. Enable TLS/SSL

For production, use reverse proxy (nginx/Traefik) with SSL:

```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
```

### 4. Network Isolation

**Already implemented in docker-compose.yml:**

```yaml
networks:
  odavl-network:
    driver: bridge  # Isolated network, no external access by default
```

### 5. Scan for Vulnerabilities

```bash
# Scan image
docker scan odavl-guardian-app

# Use Snyk (optional)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock snyk/snyk:docker snyk test --docker odavl-guardian-app
```

---

## 🚀 Production Deployment

### 1. Use Production Compose File

```bash
# docker-compose.prod.yml
version: '3.9'
services:
  guardian:
    image: your-registry.com/odavl-guardian:latest
    environment:
      NODE_ENV: production
      # Use secrets management (AWS Secrets Manager, Vault, etc.)
```

### 2. Enable Resource Limits

```yaml
services:
  guardian:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. Use External Database

```yaml
services:
  guardian:
    environment:
      # Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
      DATABASE_URL: postgresql://user:pass@rds-endpoint:5432/guardian
      # Use managed Redis (AWS ElastiCache, Azure Cache, etc.)
      REDIS_URL: redis://elasticache-endpoint:6379
```

### 4. Add Logging Driver

```yaml
services:
  guardian:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. Deploy with CI/CD

See **Week 5: GitHub Actions** for automated deployment pipeline.

---

## 📚 Next Steps

### Week 4 Remaining Tasks

1. ✅ Dockerfile created (multi-stage, production-ready)
2. ✅ docker-compose.yml created (PostgreSQL + Redis + Guardian)
3. ✅ .dockerignore created (optimized build context)
4. ✅ .env.docker template created
5. ⏳ Implement /api/health endpoint
6. ⏳ Implement /api/ready endpoint (DB + Redis connectivity check)

### Week 5 Tasks

1. Create GitHub Actions CI/CD pipeline
2. Implement Prometheus metrics export
3. Create Grafana dashboards
4. Set up alert rules for SLO violations

---

## 📖 Related Documentation

- **Performance Report:** `PERFORMANCE_OPTIMIZATION_WEEK3.md`
- **Testing Guide:** `PERFORMANCE_TESTING_QUICKSTART.md`
- **Week 3 Summary:** `WEEK3_COMPLETE_SUMMARY.md`
- **Docker Official Docs:** <https://docs.docker.com/>
- **Docker Compose Docs:** <https://docs.docker.com/compose/>

---

**Last Updated:** 2025-01-09  
**Status:** ✅ Docker Infrastructure Complete (Week 4 - 50%)  
**Next:** Health endpoints + Kubernetes manifests
