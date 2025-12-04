# 🚀 ODAVL Complete Recovery Plan - 78/100 → 100/100

**Created:** November 15, 2025  
**Target:** Transform ODAVL to production-ready 100/100 in 16 weeks  
**Current Overall Score:** 78/100 (C+)  
**Target Overall Score:** 100/100 (A+)

---

## 📊 Current State Assessment

### Score Breakdown (Before)

| Category | Current | Target | Gap | Priority |
|----------|---------|--------|-----|----------|
| **Code Quality** | 72/100 | 95/100 | +23 | 🔴 HIGH |
| **Security** | 48/100 | 98/100 | +50 | 🔴 CRITICAL |
| **Architecture** | 85/100 | 95/100 | +10 | 🟡 MEDIUM |
| **Performance** | 65/100 | 95/100 | +30 | 🔴 HIGH |
| **Infrastructure** | 90/100 | 98/100 | +8 | 🟢 LOW |
| **Testing** | 70/100 | 95/100 | +25 | 🔴 HIGH |
| **Documentation** | 88/100 | 95/100 | +7 | 🟢 LOW |
| **DevOps** | 85/100 | 98/100 | +13 | 🟡 MEDIUM |
| **Legal/Compliance** | 63/100 | 98/100 | +35 | 🔴 CRITICAL |
| **TOTAL** | **78/100** | **100/100** | **+22** | **URGENT** |

---

## 🎯 16-Week Implementation Plan

### Phase 1: Critical Blockers (Week 1-2) 🔴

**Target:** Make project compilable, secure, and deployable

#### Week 1: Guardian + Security Emergency

**Days 1-2: Fix Guardian TypeScript Errors (12 errors)**

- ✅ Fix Prisma schema mismatches in `ml-insights.ts`
  - Add missing fields: `name`, `error` to TestRun model
  - Update `websocket-analytics.ts` type definitions
  - Fix MonitorCheck status type (string → MonitorStatus enum)

- ✅ Fix `rate-limit.ts` ApiKey query
- ✅ Fix `monitor-worker.ts` status field (13 errors)
- ✅ Run `pnpm exec tsc --noEmit` → 0 errors target

**Day 3: Security Vulnerabilities**

```bash
# 1. Patch npm vulnerabilities
pnpm audit
pnpm audit fix --force  # If needed

# 2. Verify fixes
pnpm audit --audit-level=moderate
# Target: 0 HIGH/CRITICAL vulnerabilities
```

**Day 4: Security Middleware Activation**

```typescript
// Guardian: src/middleware.ts - Add:
import helmet from 'helmet';
import cors from 'cors';

export const config = {
  matcher: '/api/:path*',
};

export default async function middleware(req: NextRequest) {
  // Add Helmet security headers
  const helmetHeaders = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  });

  // Add CORS
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3003',
  ];

  // ... implementation
}
```

**Day 5: Environment Security**

```bash
# 1. Verify .gitignore
cat .gitignore | grep -E "^\.env$"

# 2. Check if .env is tracked
git ls-files | grep "^\.env$"

# 3. If tracked, remove from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (DANGEROUS - backup first!)
git push origin --force --all

# 5. Create .env.example
cp .env .env.example
# Remove all actual values, replace with placeholders
```

#### Week 2: Testing + Documentation

**Days 1-2: Fix Test Suite (89 missing awaits)**

```typescript
// Automated fix script: scripts/fix-test-awaits.ts
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const testFiles = glob.sync('apps/cli/tests/**/*.test.ts');

testFiles.forEach(file => {
  let content = readFileSync(file, 'utf8');
  
  // Pattern: const result = asyncFunction(
  // Fix: const result = await asyncFunction(
  const pattern = /const\s+(\w+)\s*=\s*(?!await\s+)(autoApprove|runPhase|executeCommand)\(/g;
  content = content.replace(pattern, 'const $1 = await $2(');
  
  writeFileSync(file, content);
});

console.log(`Fixed ${testFiles.length} test files`);
```

```bash
# Run fix script
tsx scripts/fix-test-awaits.ts

# Verify
pnpm test
# Target: 0 Promise-related errors
```

**Days 3-5: GDPR Compliance Document (40 → 85/100)**

Create comprehensive `GDPR_COMPLIANCE.md`:

```markdown
# GDPR Compliance Guide for ODAVL

## 1. Data Inventory

### Personal Data Collected

| Data Type | Purpose | Legal Basis | Retention Period |
|-----------|---------|-------------|------------------|
| Email addresses | User authentication | Consent | Account lifetime + 30 days |
| Usage logs | Performance analytics | Legitimate interest | 90 days |
| Error reports | Bug fixing | Legitimate interest | 180 days |
| API keys | Service authentication | Contract | Until revoked |

### Data Processing Activities

1. **User Registration**
   - Data: Email, name, organization
   - Purpose: Account creation
   - Legal basis: Contract performance
   - Third parties: None

2. **Analytics**
   - Data: Usage metrics, error counts
   - Purpose: Service improvement
   - Legal basis: Legitimate interest
   - Third parties: None (self-hosted)

## 2. User Rights Implementation

### Right to Access (Art. 15)

**Endpoint:** `GET /api/user/data-export`

```typescript
// Export all user data
const userData = {
  profile: await prisma.user.findUnique({ where: { id } }),
  testRuns: await prisma.testRun.findMany({ where: { userId: id } }),
  organizations: await prisma.organization.findMany({ where: { members: { some: { id } } } }),
};

return Response.json(userData, {
  headers: { 'Content-Type': 'application/json' },
});
```

### Right to Deletion (Art. 17)

**Endpoint:** `DELETE /api/user/account`

```typescript
// Hard delete (GDPR requirement)
await prisma.$transaction([
  prisma.testRun.deleteMany({ where: { userId: id } }),
  prisma.apiKey.deleteMany({ where: { userId: id } }),
  prisma.user.delete({ where: { id } }),
]);

// Anonymize logs
await prisma.auditLog.updateMany({
  where: { userId: id },
  data: { userId: 'DELETED_USER', email: 'deleted@privacy.local' },
});
```

### Right to Rectification (Art. 16)

**Endpoint:** `PATCH /api/user/profile`

```typescript
// Allow users to update their data
await prisma.user.update({
  where: { id },
  data: { name, email, organization },
});
```

### Right to Data Portability (Art. 20)

**Endpoint:** `GET /api/user/data-export?format=json`

```typescript
// Machine-readable format
return Response.json(userData, {
  headers: {
    'Content-Type': 'application/json',
    'Content-Disposition': 'attachment; filename="odavl-data.json"',
  },
});
```

## 3. Data Breach Response Plan

### Detection (0-24 hours)

1. **Monitoring Systems**
   - Sentry error tracking
   - Prisma query logging
   - Redis access logs
   - Failed authentication alerts

2. **Breach Indicators**
   - Unusual data access patterns
   - Failed authentication spikes
   - Unauthorized API calls
   - Data exfiltration attempts

### Assessment (24-48 hours)

1. **Impact Analysis**
   - Number of affected users
   - Type of data exposed
   - Risk level (low/medium/high/critical)

2. **Notification Decision**
   - HIGH/CRITICAL: Notify DPA within 72 hours (Art. 33)
   - Notify affected users "without undue delay" (Art. 34)

### Notification (48-72 hours)

**Template Email:**

```
Subject: Important Security Notice - ODAVL Data Breach

Dear [User],

We are writing to inform you of a security incident that occurred on [DATE] involving your ODAVL account.

**What happened:**
[Brief description]

**Data affected:**
[List of data types]

**Our response:**
- Immediate containment: [Actions taken]
- Investigation: [Status]
- Security enhancements: [Measures]

**Your next steps:**
1. Reset your password: [Link]
2. Review account activity: [Link]
3. Enable 2FA: [Link]

We sincerely apologize for this incident.

Contact: privacy@odavl.com
DPO: dpo@odavl.com
```

### Recovery (72+ hours)

1. **Technical Measures**
   - Patch vulnerabilities
   - Rotate all secrets
   - Enhanced monitoring

2. **Documentation**
   - Incident timeline
   - Root cause analysis
   - Lessons learned

## 4. Privacy by Design

### Technical Measures

1. **Encryption**
   - At rest: PostgreSQL encryption + disk encryption
   - In transit: TLS 1.3 (enforce HTTPS)
   - Passwords: bcrypt (cost factor 12)
   - API keys: SHA-256 hashing

2. **Access Control**
   - Role-based access (RBAC)
   - API key rotation (90-day expiry)
   - Session management (JWT with 24h expiry)

3. **Audit Logging**

   ```typescript
   await prisma.auditLog.create({
     data: {
       userId,
       action: 'DATA_ACCESS',
       resource: 'user.data',
       timestamp: new Date(),
       ipAddress: req.ip,
       userAgent: req.headers['user-agent'],
     },
   });
   ```

4. **Data Minimization**
   - Only collect essential data
   - No tracking pixels
   - No third-party analytics (self-hosted only)

## 5. Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| User accounts (active) | Account lifetime | N/A |
| User accounts (deleted) | 30 days (backup) | Hard delete |
| Test runs | 180 days | Cascade delete |
| Error logs | 90 days | Automated cleanup |
| Audit logs | 365 days | Anonymize after 90 days |
| API keys (revoked) | 30 days | Hard delete |

**Automated Cleanup:**

```typescript
// cron job: daily at 2 AM
async function cleanupOldData() {
  const now = new Date();
  
  // Delete test runs > 180 days
  await prisma.testRun.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) } },
  });
  
  // Delete error logs > 90 days
  await prisma.errorLog.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
  });
  
  // Anonymize audit logs > 90 days
  await prisma.auditLog.updateMany({
    where: { createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
    data: { userId: 'ANONYMIZED', ipAddress: '0.0.0.0' },
  });
}
```

## 6. Third-Party Processors

| Processor | Purpose | Data Shared | DPA Status | Location |
|-----------|---------|-------------|------------|----------|
| None (self-hosted) | N/A | None | N/A | EU/US |

**Note:** ODAVL is designed to be self-hosted with no third-party data sharing.

## 7. Contact Information

- **Privacy Officer:** <privacy@odavl.com>
- **Data Protection Officer (if required):** <dpo@odavl.com>
- **Security Team:** <security@odavl.com>
- **Response SLA:** 48 hours

## 8. Compliance Checklist

- [x] Data inventory documented
- [x] Legal basis for each processing activity
- [x] User rights endpoints implemented
- [x] Data breach response plan
- [x] Privacy by design measures
- [x] Data retention policy
- [x] Automated cleanup jobs
- [x] Audit logging
- [ ] DPO appointed (if required - >250 employees)
- [ ] Cookie consent banner (if cookies used)
- [ ] Privacy impact assessment (if high-risk processing)

## 9. Updates

This policy is reviewed annually and updated as needed.

**Last updated:** November 15, 2025  
**Next review:** November 15, 2026

```

**Results Week 1-2:**
- ✅ Guardian compiles (12 TS errors → 0)
- ✅ Security score: 48 → 85/100
- ✅ Test suite passes (89 errors → 0)
- ✅ GDPR compliance: 40 → 85/100

---

### Phase 2: Performance Optimization (Week 3-4) 🟠

#### Week 3: Bundle Optimization

**Day 1: Analyze Guardian Bundle**

```bash
cd apps/guardian
pnpm add -D @next/bundle-analyzer

# Update next.config.mjs:
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  // ... existing config
});

# Analyze
ANALYZE=true pnpm build
# Opens visual report in browser
```

**Expected findings:**

- Heavy dependencies: Prisma client, Playwright, Lighthouse
- Unused dependencies: Check with `knip`
- Large node_modules in build

**Day 2-3: Code Splitting + Lazy Loading**

```typescript
// app/dashboard/page.tsx - Before (eager loading)
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { TestRunner } from '@/components/test-runner';

export default function Dashboard() {
  return (
    <>
      <AnalyticsDashboard />
      <TestRunner />
    </>
  );
}

// After (lazy loading)
import dynamic from 'next/dynamic';

const AnalyticsDashboard = dynamic(() => import('@/components/analytics-dashboard'), {
  loading: () => <Skeleton />,
  ssr: false,
});

const TestRunner = dynamic(() => import('@/components/test-runner'), {
  loading: () => <Skeleton />,
  ssr: false,
});

export default function Dashboard() {
  return (
    <>
      <AnalyticsDashboard />
      <TestRunner />
    </>
  );
}
```

**Day 4: Image Optimization**

```bash
# Convert images to WebP
find public/images -name "*.png" -o -name "*.jpg" | while read img; do
  cwebp -q 80 "$img" -o "${img%.*}.webp"
done

# Update next.config.mjs
export default {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

**Day 5: Test + Measure**

```bash
# Build and measure
pnpm build

# Check size
du -sh .next/
# Target: 444 MB → <150 MB (66% reduction)

# Lighthouse CI
pnpm dlx lighthouse-ci https://localhost:3003
# Target: Performance score >90
```

#### Week 4: Dependency Cleanup

**Day 1: Consolidate Next.js Versions**

```bash
# Check current versions
pnpm list next --depth=0

# Result: 3 versions (15.0.0, 15.5.6, 16.0.1)

# Update all to latest stable
pnpm update next@latest -r

# Verify single version
pnpm list next --depth=0
# Expected: 1 version (15.5.6 or latest)

# Savings: ~365 MB → 130 MB
```

**Day 2: Remove Unused Dependencies**

```bash
# Run knip
pnpm dlx knip

# Expected findings:
# - Unused dependencies: ~20-30 packages
# - Unused exports: ~50-100
# - Unused types: ~20-30

# Remove unused deps
pnpm remove <unused-package-1> <unused-package-2> ...

# Clean node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Day 3: Update Outdated Packages**

```bash
# Check outdated
pnpm outdated

# Update (test carefully!)
pnpm update -r

# Run tests after each batch
pnpm test
```

**Day 4-5: Verify Everything Works**

```bash
# Full CI simulation
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# All apps
cd apps/guardian && pnpm dev # Test locally
cd apps/insight-cloud && pnpm dev
cd apps/odavl-website-v2 && pnpm dev
cd apps/vscode-ext && pnpm compile
```

**Results Week 3-4:**

- ✅ Guardian: 444 MB → ~150 MB (66% reduction)
- ✅ node_modules: 2.21 GB → ~1.5 GB
- ✅ Build time: 3x faster
- ✅ Performance score: 65 → 90/100

---

### Phase 3: Infrastructure & Docker (Week 5-6) 🟡

#### Week 5: Dockerization

**Day 1-2: Multi-Stage Dockerfiles**

Create `apps/guardian/Dockerfile`:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/guardian/package.json ./apps/guardian/
COPY packages/types/package.json ./packages/types/
COPY packages/insight-core/package.json ./packages/insight-core/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd apps/guardian && pnpm prisma:generate

# Build
RUN pnpm build --filter=@odavl/guardian

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/apps/guardian/.next/standalone ./
COPY --from=builder /app/apps/guardian/.next/static ./apps/guardian/.next/static
COPY --from=builder /app/apps/guardian/public ./apps/guardian/public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/guardian/server.js"]
```

**Day 3: docker-compose.yml (Local Dev)**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: odavl
      POSTGRES_PASSWORD: dev_password_change_me
      POSTGRES_DB: odavl_guardian
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U odavl"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  guardian:
    build:
      context: .
      dockerfile: apps/guardian/Dockerfile
    ports:
      - "3003:3003"
    environment:
      DATABASE_URL: postgresql://odavl:dev_password_change_me@postgres:5432/odavl_guardian
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/guardian:/app/apps/guardian
      - /app/apps/guardian/node_modules

  insight-cloud:
    build:
      context: .
      dockerfile: apps/insight-cloud/Dockerfile
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://odavl:dev_password_change_me@postgres:5432/odavl_insight
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy

  cli:
    build:
      context: .
      dockerfile: apps/cli/Dockerfile
    volumes:
      - ./apps/cli:/app/apps/cli
    entrypoint: ["pnpm", "odavl:run"]

volumes:
  postgres_data:
  redis_data:
```

**Day 4: .dockerignore**

```
# Dependencies
node_modules
pnpm-lock.yaml

# Build outputs
.next
dist
build
out

# Development
.git
.github
.vscode
.husky

# Logs
logs
*.log
npm-debug.log*

# Environment
.env
.env.local
.env.*.local

# Reports
reports
coverage

# OS
.DS_Store
Thumbs.db
```

**Day 5: Test Docker Setup**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check health
docker-compose ps

# Test endpoints
curl http://localhost:3003/api/health  # Guardian
curl http://localhost:3002/api/health  # Insight Cloud

# View logs
docker-compose logs -f guardian

# Stop
docker-compose down
```

#### Week 6: Monitoring Stack

**Day 1-2: Prometheus + Grafana**

```yaml
# docker-compose.monitoring.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin_change_me
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log
      - ./apps/guardian/logs:/logs/guardian
    command: -config.file=/etc/promtail/config.yml

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

**Day 3: Sentry Configuration Verification**

```typescript
// apps/guardian/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  
  beforeSend(event, hint) {
    // Don't send dev errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Filter out noise
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    
    return event;
  },
  
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});
```

**Day 4: Centralized Logging (Loki)**

```yaml
# loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

**Day 5: Alerting Rules**

```yaml
# prometheus-alerts.yml
groups:
  - name: odavl_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over last 5 minutes"

      # Guardian down
      - alert: GuardianDown
        expr: up{job="guardian"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Guardian service is down"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage above 90%"

      # Slow database queries
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(prisma_query_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile of DB queries > 1s"
```

**Results Week 5-6:**

- ✅ Full Docker support (5 Dockerfiles)
- ✅ Local dev with docker-compose
- ✅ Prometheus + Grafana monitoring
- ✅ Centralized logging (Loki)
- ✅ Infrastructure score: 90 → 98/100

---

### Phase 4: Testing & Quality (Week 7-8) 🟢

#### Week 7: Test Coverage

**Day 1: Run Baseline Coverage**

```bash
pnpm test:coverage

# Expected output:
# File             | % Stmts | % Branch | % Funcs | % Lines |
# -----------------|---------|----------|---------|---------|
# All files        |   42.5  |   35.2   |   38.7  |   43.1  |
```

**Day 2-3: Write Critical Path Tests**

Focus on:

1. **Guardian API routes** (25 endpoints)
2. **CLI phases** (O→D→A→V→L)
3. **Insight Core detectors** (12 detectors)

```typescript
// Example: apps/guardian/src/app/api/health/__tests__/route.test.ts
import { GET } from '../route';

describe('/api/health', () => {
  it('should return 200 with healthy status', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('redis');
  });
  
  it('should return 503 when database is down', async () => {
    // Mock Prisma error
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection failed'));
    
    const response = await GET();
    expect(response.status).toBe(503);
  });
});
```

**Day 4: Add Coverage Thresholds**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
      ],
    },
  },
});
```

**Day 5: Run Full Test Suite**

```bash
pnpm test:coverage

# Target results:
# File             | % Stmts | % Branch | % Funcs | % Lines |
# -----------------|---------|----------|---------|---------|
# All files        |   82.3  |   78.1   |   80.5  |   83.2  |
#
# ✅ PASS - All thresholds met!
```

#### Week 8: Performance Testing

**Day 1-2: Load Testing with k6**

```bash
pnpm add -D k6

# Create test script: scripts/load-test.js
```

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Spike to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  // Test Guardian health endpoint
  const res = http.get('http://localhost:3003/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

```bash
# Run load test
k6 run scripts/load-test.js

# Target results:
# checks.........................: 99.95%
# http_req_duration..............: avg=85ms  p(95)=156ms
# http_req_failed................: 0.00%
```

**Day 3-4: E2E Tests with Playwright**

```typescript
// apps/guardian/tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Guardian Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/dashboard');
  });
  
  test('should display metrics cards', async ({ page }) => {
    await expect(page.getByText('Active Monitors')).toBeVisible();
    await expect(page.getByText('Test Runs')).toBeVisible();
    await expect(page.getByText('Uptime')).toBeVisible();
  });
  
  test('should load analytics chart', async ({ page }) => {
    const chart = page.locator('[data-testid="analytics-chart"]');
    await expect(chart).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check chart has data points
    const dataPoints = await chart.locator('.recharts-line-dot').count();
    expect(dataPoints).toBeGreaterThan(0);
  });
  
  test('should run new test', async ({ page }) => {
    await page.click('[data-testid="new-test-button"]');
    await page.fill('[name="testName"]', 'E2E Test Run');
    await page.selectOption('[name="testType"]', 'e2e');
    await page.click('[type="submit"]');
    
    // Wait for test to complete
    await expect(page.getByText('Test completed successfully')).toBeVisible({ timeout: 30000 });
  });
});
```

**Day 5: Integration with CI**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install
      - run: pnpm test:e2e

  load-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: scripts/load-test.js
```

**Results Week 7-8:**

- ✅ Test coverage: 42% → 83%
- ✅ All thresholds met (80%+ lines/funcs)
- ✅ Load testing: p(95) < 500ms
- ✅ E2E tests: 100% pass
- ✅ Testing score: 70 → 95/100

---

### Phase 5: GDPR & Legal (Week 9-10) 📜

(Already completed in Week 2, expand further here)

**Week 9: Advanced GDPR Features**

- Privacy impact assessment (PIA)
- Cookie consent banner (if needed)
- Data processing agreements (DPA) templates

**Week 10: CCPA + Legal**

- CCPA disclosures for California users
- Terms of Service review
- THIRD_PARTY_LICENSES.md generation
- Export control self-classification

**Results Week 9-10:**

- ✅ GDPR compliance: 85 → 98/100
- ✅ Legal score: 63 → 98/100
- ✅ All compliance docs complete

---

### Phase 6: Code Quality Cleanup (Week 11-14) 🎯

#### Week 11-12: ODAVL Self-Healing

**Use ODAVL itself to fix 4,430 Insight issues**

```bash
# Run ODAVL loop 50 times
for i in {1..50}; do
  echo "ODAVL Run $i/50"
  pnpm odavl:loop
  sleep 300  # 5 min cooldown
done

# Expected results:
# - Auto-fixed: ~1,200 issues (27%)
# - Manual review needed: ~3,230 issues (73%)
```

#### Week 13-14: Manual Review + Cleanup

- Review remaining issues
- Prioritize HIGH/CRITICAL
- Fix systematically

**Results Week 11-14:**

- ✅ 4,430 issues → 200 issues (95% reduction)
- ✅ Code quality: 72 → 95/100

---

### Phase 7: Final Polish (Week 15-16) 🚀

**Week 15: Security Audit**

- DAST with OWASP ZAP
- Penetration testing
- Third-party security review ($5K-$10K)

**Week 16: Production Deployment**

- Canary deployment setup
- Rollback automation
- Final docs site
- Launch! 🎉

**Results Week 15-16:**

- ✅ Security: 85 → 98/100
- ✅ DevOps: 85 → 98/100
- ✅ Overall: 78 → 100/100 ✅

---

## 📊 Final Score Projection

| Category | Before | After | Improvement |
|----------|--------|-------|-------------|
| Code Quality | 72 | 95 | +23 points |
| Security | 48 | 98 | +50 points |
| Architecture | 85 | 95 | +10 points |
| Performance | 65 | 95 | +30 points |
| Infrastructure | 90 | 98 | +8 points |
| Testing | 70 | 95 | +25 points |
| Documentation | 88 | 95 | +7 points |
| DevOps | 85 | 98 | +13 points |
| Legal | 63 | 98 | +35 points |
| **TOTAL** | **78** | **100** | **+22 points** |

---

## 🎯 Success Metrics

### Technical KPIs

- ✅ 0 TypeScript errors
- ✅ 0 HIGH/CRITICAL npm vulnerabilities
- ✅ 80%+ test coverage
- ✅ <150 MB Guardian bundle
- ✅ p(95) response time < 500ms
- ✅ 99.9% uptime SLA

### Business KPIs

- ✅ GDPR compliant (98/100)
- ✅ Production-ready
- ✅ Investor-ready (Investment Grade A+)
- ✅ SOC 2 Type 1 ready
- ✅ Enterprise-grade documentation

---

## 📅 Timeline Summary

```
Week 1-2:   🔴 Critical Blockers       (Guardian, Security, Tests, GDPR)
Week 3-4:   🟠 Performance             (Bundle, Dependencies)
Week 5-6:   🟡 Infrastructure          (Docker, Monitoring)
Week 7-8:   🟢 Testing                 (Coverage, Load, E2E)
Week 9-10:  📜 Legal                   (GDPR, CCPA, Compliance)
Week 11-14: 🎯 Code Quality            (4,430 issues cleanup)
Week 15-16: 🚀 Launch                  (Security Audit, Production)
```

**Total Duration:** 16 weeks (4 months)  
**Effort:** 2-3 engineers full-time  
**Investment:** ~$75K-$100K (salaries + tools + audits)

---

## ✅ Next Actions (Start Tomorrow)

1. **Fix Guardian TypeScript errors** (12 errors)
2. **Patch npm vulnerabilities** (pnpm audit fix)
3. **Add Helmet + CORS middleware**
4. **Create .env.example**
5. **Fix test suite awaits** (89 errors)

---

**Status:** Ready to Execute  
**Owner:** Development Team  
**Reviewed:** November 15, 2025  
**Next Review:** Weekly progress meetings

---

*This plan transforms ODAVL from 78/100 (C+) to 100/100 (A+) production-ready in 16 weeks.*
