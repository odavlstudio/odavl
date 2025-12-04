# Deployment Guide

This guide covers deploying Guardian to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Infrastructure Requirements

**Minimum (Small-Scale)**:

- **Compute**: 2 vCPU, 4 GB RAM
- **Database**: PostgreSQL 14+ (managed service recommended)
- **Cache**: Redis 7+ (1 GB memory)
- **Storage**: 20 GB SSD

**Recommended (Production)**:

- **Compute**: 4 vCPU, 8 GB RAM (auto-scaling group)
- **Database**: PostgreSQL 14+ (3 nodes, replication)
- **Cache**: Redis 7+ (2 GB memory, Redis Cluster)
- **Storage**: 100 GB SSD
- **Load Balancer**: Application Load Balancer (ALB/NLB)

### Required Services

- **PostgreSQL**: Managed service (AWS RDS, Azure Database, GCP Cloud SQL)
- **Redis**: Managed service (AWS ElastiCache, Azure Cache, GCP Memorystore)
- **Container Registry**: Docker Hub, AWS ECR, GCP GCR, or Azure ACR
- **DNS**: Route 53, Cloudflare, or similar
- **SSL Certificate**: Let's Encrypt, AWS ACM, or commercial CA

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file (never commit this):

```env
# Application
NODE_ENV=production
PORT=3003
NEXT_PUBLIC_API_URL=https://api.guardian.example.com

# Database (use connection pooling)
DATABASE_URL=postgresql://guardian:PASSWORD@db.example.com:5432/guardian?schema=public&connection_limit=10&pool_timeout=5

# Redis
REDIS_URL=redis://redis.example.com:6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_TLS=true

# Security (generate strong secrets)
JWT_SECRET=your-256-bit-secret-change-me
API_KEYS_SECRET=your-256-bit-secret-change-me
SESSION_SECRET=your-256-bit-secret-change-me

# Performance
SLOW_QUERY_THRESHOLD=100
ENABLE_COMPRESSION=true
ENABLE_CACHE=true

# Monitoring
PROMETHEUS_ENABLED=true
JAEGER_ENABLED=true
JAEGER_ENDPOINT=http://jaeger-collector:14268/api/traces
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGIN=https://app.guardian.example.com,https://dashboard.guardian.example.com
```

### Generating Secrets

```bash
# Generate JWT secret (256-bit)
openssl rand -base64 32

# Generate API keys secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

## Database Setup

### 1. Create Database

```sql
-- Connect to PostgreSQL
psql -h db.example.com -U postgres

-- Create database and user
CREATE DATABASE guardian;
CREATE USER guardian WITH ENCRYPTED PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE guardian TO guardian;
```

### 2. Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://guardian:PASSWORD@db.example.com:5432/guardian"

# Generate Prisma Client
pnpx prisma generate

# Run migrations
pnpx prisma migrate deploy
```

### 3. Seed Database (Optional)

```bash
# Seed with initial data
pnpx prisma db seed
```

### 4. Database Connection Pooling

For production, use connection pooling:

```env
# PgBouncer or similar
DATABASE_URL="postgresql://guardian:PASSWORD@pgbouncer.example.com:6432/guardian?schema=public&connection_limit=10&pool_timeout=5&statement_cache_size=0"
```

## Docker Deployment

### 1. Build Docker Image

```bash
# Build image
docker build -t guardian:latest -f Dockerfile .

# Tag for registry
docker tag guardian:latest registry.example.com/guardian:1.0.0
docker tag guardian:latest registry.example.com/guardian:latest

# Push to registry
docker push registry.example.com/guardian:1.0.0
docker push registry.example.com/guardian:latest
```

### 2. Docker Compose (Simple Deployment)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  guardian:
    image: registry.example.com/guardian:latest
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: guardian
      POSTGRES_USER: guardian
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - guardian
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/guardian/package.json ./apps/guardian/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/guardian
RUN pnpx prisma generate

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/guardian/package.json ./apps/guardian/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files and Prisma
COPY --from=builder /app/apps/guardian/.next ./apps/guardian/.next
COPY --from=builder /app/apps/guardian/public ./apps/guardian/public
COPY --from=builder /app/apps/guardian/prisma ./apps/guardian/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3003

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start
WORKDIR /app/apps/guardian
CMD pnpx prisma migrate deploy && pnpm start
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace guardian
```

### 2. Secrets

```bash
# Create secrets from .env file
kubectl create secret generic guardian-secrets \
  --from-env-file=.env.production \
  --namespace=guardian

# Or manually
kubectl create secret generic guardian-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=redis-url='redis://...' \
  --from-literal=jwt-secret='...' \
  --namespace=guardian
```

### 3. ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: guardian-config
  namespace: guardian
data:
  NODE_ENV: "production"
  PORT: "3003"
  LOG_LEVEL: "info"
  PROMETHEUS_ENABLED: "true"
```

### 4. Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guardian
  namespace: guardian
spec:
  replicas: 3
  selector:
    matchLabels:
      app: guardian
  template:
    metadata:
      labels:
        app: guardian
    spec:
      containers:
      - name: guardian
        image: registry.example.com/guardian:1.0.0
        ports:
        - containerPort: 3003
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: guardian-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: guardian-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: guardian-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: guardian-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3003
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3003
          initialDelaySeconds: 10
          periodSeconds: 5
```

### 5. Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: guardian
  namespace: guardian
spec:
  selector:
    app: guardian
  ports:
  - port: 80
    targetPort: 3003
  type: ClusterIP
```

### 6. Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: guardian
  namespace: guardian
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.guardian.example.com
    secretName: guardian-tls
  rules:
  - host: api.guardian.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: guardian
            port:
              number: 80
```

### 7. HorizontalPodAutoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: guardian
  namespace: guardian
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: guardian
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 8. Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml

# Check status
kubectl get pods -n guardian
kubectl get svc -n guardian
kubectl get ingress -n guardian

# View logs
kubectl logs -f deployment/guardian -n guardian
```

## SSL/TLS Configuration

### Using Let's Encrypt (Cert-Manager)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Manual SSL Certificate

```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout guardian.key \
  -out guardian.csr \
  -subj "/CN=api.guardian.example.com"

# Create Kubernetes secret
kubectl create secret tls guardian-tls \
  --cert=guardian.crt \
  --key=guardian.key \
  --namespace=guardian
```

## Monitoring Setup

### Prometheus

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: guardian
  namespace: guardian
spec:
  selector:
    matchLabels:
      app: guardian
  endpoints:
  - port: metrics
    path: /api/metrics
    interval: 30s
```

### Grafana Dashboard

Import dashboard from `monitoring/grafana-dashboard.json`

### Alerting Rules

```yaml
# prometheusrule.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: guardian-alerts
  namespace: guardian
spec:
  groups:
  - name: guardian
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
    - alert: HighResponseTime
      expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High response time (p95 > 1s)"
```

## Backup and Recovery

### Database Backups

```bash
# Automated backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/guardian"

# Create backup
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/guardian_$TIMESTAMP.sql.gz"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/guardian_$TIMESTAMP.sql.gz" s3://your-backup-bucket/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "guardian_*.sql.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# Download from S3
aws s3 cp s3://your-backup-bucket/guardian_20250115.sql.gz ./

# Restore
gunzip < guardian_20250115.sql.gz | psql $DATABASE_URL
```

### Kubernetes Backup (Velero)

```bash
# Install Velero
velero install --provider aws --bucket guardian-backups

# Create backup
velero backup create guardian-backup --include-namespaces guardian

# Restore
velero restore create --from-backup guardian-backup
```

## Scaling

### Horizontal Scaling

Kubernetes HPA automatically scales based on CPU/memory usage (configured above).

### Vertical Scaling

Update resource requests/limits in deployment:

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "4000m"
```

### Database Scaling

- **Read Replicas**: Configure read replicas for read-heavy workloads
- **Connection Pooling**: Use PgBouncer or similar
- **Partitioning**: Partition large tables by date or organization

### Redis Scaling

- **Redis Cluster**: Enable cluster mode for high availability
- **Sentinel**: Use Redis Sentinel for automatic failover

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n guardian

# View logs
kubectl logs <pod-name> -n guardian

# Common issues:
# - Missing secrets
# - Database connection failed
# - Image pull error
```

### Database Connection Issues

```bash
# Test connection from pod
kubectl exec -it <pod-name> -n guardian -- /bin/sh
psql $DATABASE_URL
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n guardian

# Increase memory limits
kubectl edit deployment guardian -n guardian
```

### SSL Certificate Issues

```bash
# Check certificate
kubectl describe certificate guardian-tls -n guardian

# View cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

## Rollback Procedures

### Kubernetes Rollback

```bash
# View deployment history
kubectl rollout history deployment/guardian -n guardian

# Rollback to previous version
kubectl rollout undo deployment/guardian -n guardian

# Rollback to specific revision
kubectl rollout undo deployment/guardian -n guardian --to-revision=3
```

### Database Migration Rollback

```bash
# Mark migration as rolled back
pnpx prisma migrate resolve --rolled-back <migration_name>

# Restore from backup
gunzip < backup.sql.gz | psql $DATABASE_URL
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Secrets generated and stored securely
- [ ] Database migrations applied
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and alerting set up
- [ ] Backup procedures tested
- [ ] Auto-scaling configured
- [ ] Load balancer health checks enabled
- [ ] DNS records configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Performance testing completed
- [ ] Disaster recovery plan documented

---

**Last Updated**: January 2025  
**Maintainer**: ODAVL DevOps Team
