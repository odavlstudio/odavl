# 🚀 Deployment Checklist - ODAVL Studio Hub v2.0

**Pre-deployment validation for production launch**  
**Target Score**: 100/100 ✅  
**Current Score**: 96/100 (4 points remaining)

---

## ✅ Phase 1: Pre-Deployment Validation (Required)

### 1.1 Environment Variables (Critical)

#### Database Configuration
- [ ] `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:5432/db`)
- [ ] `DATABASE_HOST` - Database hostname
- [ ] `DATABASE_PORT` - Database port (default: 5432)
- [ ] `DATABASE_NAME` - Database name
- [ ] `DATABASE_USER` - Database username
- [ ] `DATABASE_PASSWORD` - Secure password (20+ characters)
- [ ] `DATABASE_CA_CERT` - SSL certificate (if using managed PostgreSQL)

#### Authentication
- [ ] `NEXTAUTH_SECRET` - Generated secret (32+ characters) - **CRITICAL**
  ```bash
  openssl rand -base64 32
  ```
- [ ] `NEXTAUTH_URL` - Production URL (e.g., `https://studio.odavl.com`)
- [ ] `ENCRYPTION_KEY` - Data encryption key (32 bytes hex)
- [ ] `CSRF_SECRET` - CSRF token secret
- [ ] `HMAC_SECRET` - HMAC signing secret

#### OAuth Providers
- [ ] `GITHUB_ID` - GitHub OAuth App Client ID
- [ ] `GITHUB_SECRET` - GitHub OAuth App Client Secret
- [ ] `GOOGLE_ID` - Google OAuth Client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret

**OAuth App URLs must match**:
- GitHub callback: `https://studio.odavl.com/api/auth/callback/github`
- Google callback: `https://studio.odavl.com/api/auth/callback/google`

#### Monitoring (Sentry)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry project DSN
- [ ] `SENTRY_DSN` - Server-side Sentry DSN (can be same as above)
- [ ] `SENTRY_ORG` - Sentry organization slug
- [ ] `SENTRY_PROJECT` - Sentry project name
- [ ] `SENTRY_AUTH_TOKEN` - Auth token for source map upload
- [ ] `NEXT_PUBLIC_APP_VERSION` - App version for release tracking (e.g., "2.0.0")

#### Email Service (SMTP)
- [ ] `SMTP_HOST` - SMTP server hostname (e.g., `smtp.gmail.com`)
- [ ] `SMTP_PORT` - SMTP port (587 for TLS, 465 for SSL)
- [ ] `SMTP_USER` - SMTP username/email
- [ ] `SMTP_PASSWORD` - SMTP password (use App Password for Gmail)
- [ ] `SMTP_FROM` - Sender email (e.g., `noreply@odavl.com`)
- [ ] `SMTP_FROM_NAME` - Sender name (e.g., "ODAVL Studio")

#### Optional: Additional Monitoring
- [ ] `DATADOG_API_KEY` - Datadog API key (if using Datadog RUM)
- [ ] `DATADOG_ENABLED` - Set to "true" if using Datadog
- [ ] `PAGERDUTY_INTEGRATION_KEY` - PagerDuty integration key
- [ ] `SECURITY_TEAM_EMAIL` - Email for security alerts
- [ ] `SLACK_WEBHOOK_URL` - Slack webhook for notifications

#### Application
- [ ] `NODE_ENV` - Set to "production"
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL
- [ ] `PORT` - Server port (default: 3000)
- [ ] `VERCEL_URL` - Auto-set by Vercel (if deploying to Vercel)

---

### 1.2 Database Setup

#### Migrations
```bash
# Apply all Prisma migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status

# Generate Prisma Client (if not auto-generated)
npx prisma generate
```

#### Database Seeding (Optional - Only for demo/staging)
```bash
# Seed demo data (DO NOT run in production with real users)
npm run db:seed
```

#### Connection Pool Verification
- [ ] Connection pool configured (min: 2, max: 10)
- [ ] SSL/TLS enabled for database connections
- [ ] Database backup strategy in place

---

### 1.3 Security Validation

#### SSL/TLS
- [ ] SSL certificates installed and valid
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Certificate expiry monitoring setup

#### Security Headers (Auto-configured)
- [ ] Content-Security-Policy (CSP) - No `unsafe-inline`, no `unsafe-eval`
- [ ] Strict-Transport-Security (HSTS) - Enabled in production
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin

#### Rate Limiting
- [ ] Rate limiting active on all API endpoints
- [ ] IP-based throttling configured
- [ ] CORS configured correctly (origin whitelist)

#### Secrets Management
- [ ] All secrets stored in environment variables (not in code)
- [ ] No `.env.local` or `.env.production` files in git
- [ ] Secrets rotation strategy documented

---

### 1.4 Code Quality Validation

#### TypeScript
```bash
# Must pass with 0 errors
npx tsc --noEmit

# Expected output:
# (no output = success)
```

#### Linting
```bash
# Must pass with 0 errors
pnpm lint

# Expected output:
# ✓ No ESLint errors
```

#### Build Test
```bash
# Must complete without errors
pnpm build

# Expected output:
# ✓ Compiled successfully
```

#### Test Suite
```bash
# Unit tests
pnpm test:unit

# E2E tests (if available)
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

---

### 1.5 Monitoring Setup

#### Sentry Error Tracking
- [ ] Sentry project created
- [ ] DSN configured in environment variables
- [ ] Test error sent successfully:
  ```bash
  curl https://studio.odavl.com/api/test-sentry
  ```
- [ ] Error appears in Sentry dashboard with:
  - ✅ Stack trace
  - ✅ Environment: "production"
  - ✅ Release: "2.0.0"
  - ✅ Breadcrumbs: HTTP request context

#### Performance Monitoring
- [ ] Performance tracing enabled (10% sample rate)
- [ ] Transactions appearing in Sentry Performance tab
- [ ] Database queries traced (Prisma integration)
- [ ] HTTP requests traced

#### Optional: Additional Monitoring
- [ ] Datadog RUM enabled (if using)
- [ ] PagerDuty integration tested (if using)
- [ ] Slack webhooks functional (if using)

---

### 1.6 Internationalization (i18n)

#### Language Files Deployed
- [ ] All 10 language files deployed (`i18n/messages/*.json`)
- [ ] Middleware locale detection working
- [ ] URL routing functional (`/[locale]/...`)
- [ ] RTL support verified for Arabic

#### Test URLs
- [ ] `https://studio.odavl.com/` - Auto-redirects to `/en/`
- [ ] `https://studio.odavl.com/ar/dashboard` - Arabic dashboard (RTL)
- [ ] `https://studio.odavl.com/ja/settings` - Japanese settings
- [ ] Accept-Language header respected

---

## ✅ Phase 2: Deployment Execution

### 2.1 Vercel Deployment (Recommended)

#### Pre-deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

#### Environment Variables in Vercel
1. Go to: Project Settings → Environment Variables
2. Add all variables from `.env.production.example`
3. Set environment: **Production**, **Preview**, **Development**
4. **Critical**: Add `SENTRY_AUTH_TOKEN` for source map upload

#### Deploy
```bash
# Production deployment
vercel --prod

# Expected output:
# ✅ Production: https://studio-odavl.vercel.app
```

#### Post-deployment Verification
- [ ] Production URL accessible
- [ ] SSL certificate valid
- [ ] Login flow works (GitHub + Google)
- [ ] Dashboard loads correctly
- [ ] API endpoints functional
- [ ] Error tracking working (check Sentry)

---

### 2.2 Docker Deployment (Alternative)

#### Build Image
```bash
# Build production image
docker build -t odavl-studio-hub:2.0.0 .

# Test locally
docker run -p 3000:3000 \
  --env-file .env.production \
  odavl-studio-hub:2.0.0
```

#### Push to Registry
```bash
# Tag for registry
docker tag odavl-studio-hub:2.0.0 your-registry/odavl-studio-hub:2.0.0

# Push
docker push your-registry/odavl-studio-hub:2.0.0
```

#### Deploy to Kubernetes (if applicable)
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## ✅ Phase 3: Post-Deployment Validation

### 3.1 Functional Testing (30 minutes)

#### Authentication Flow
- [ ] Visit production URL
- [ ] Click "Sign In"
- [ ] Test GitHub OAuth:
  - [ ] Redirects to GitHub
  - [ ] Authorization screen appears
  - [ ] Redirects back to dashboard
  - [ ] Session created successfully
- [ ] Sign out
- [ ] Test Google OAuth:
  - [ ] Redirects to Google
  - [ ] Account selection appears
  - [ ] Redirects back to dashboard
  - [ ] Session created successfully

#### Dashboard Features
- [ ] Dashboard loads within 2 seconds
- [ ] All navigation links work
- [ ] Profile page accessible
- [ ] Settings page loads
- [ ] Organization switcher functional

#### i18n Testing
- [ ] Language switcher works
- [ ] Arabic displays correctly (RTL)
- [ ] Japanese characters render properly
- [ ] All translations complete (no missing keys)

---

### 3.2 Performance Testing (15 minutes)

#### Core Web Vitals
- [ ] **LCP** (Largest Contentful Paint) < 2.5s
- [ ] **FID** (First Input Delay) < 100ms
- [ ] **CLS** (Cumulative Layout Shift) < 0.1

#### Load Time
- [ ] Homepage < 2s
- [ ] Dashboard < 3s
- [ ] API endpoints < 500ms

#### Tools
```bash
# Lighthouse CLI
npx lighthouse https://studio.odavl.com --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 90+
```

---

### 3.3 Monitoring Validation (15 minutes)

#### Sentry Dashboard
- [ ] Errors tab showing recent activity
- [ ] Performance tab showing transactions
- [ ] Releases tab showing version 2.0.0
- [ ] Alerts configured:
  - [ ] New issue alert
  - [ ] Performance degradation alert
  - [ ] Error rate spike alert

#### Test Error Capture
```bash
# Trigger test error
curl https://studio.odavl.com/api/test-sentry

# Verify in Sentry dashboard:
# - Error appears within 30 seconds
# - Stack trace includes source map
# - Environment = "production"
# - Release = "2.0.0"
```

#### Performance Monitoring
- [ ] Transactions appearing in Performance tab
- [ ] Database queries traced
- [ ] API calls traced
- [ ] Sample rate: 10% (1 in 10 requests)

---

### 3.4 Security Audit (20 minutes)

#### SSL/TLS Verification
```bash
# Check SSL grade
curl https://www.ssllabs.com/ssltest/analyze.html?d=studio.odavl.com

# Expected: A or A+ rating
```

#### Security Headers
```bash
# Test security headers
curl -I https://studio.odavl.com

# Expected headers:
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: (full policy)
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

#### OWASP Top 10 Checks
- [ ] SQL Injection: Protected (Prisma parameterized queries)
- [ ] XSS: Protected (React auto-escaping + CSP)
- [ ] CSRF: Protected (NextAuth CSRF tokens)
- [ ] Authentication: Secure (OAuth 2.0)
- [ ] Session Management: Secure (httpOnly cookies)
- [ ] Rate Limiting: Active
- [ ] HTTPS Enforcement: Active

---

### 3.5 Database Health (10 minutes)

#### Connection Pool
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'odavl_hub';

-- Expected: 2-10 connections (pool limits)
```

#### Performance
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Expected: All queries < 100ms average
```

#### Backups
- [ ] Automated backups configured
- [ ] Backup retention policy: 7 days minimum
- [ ] Restore procedure tested
- [ ] Point-in-time recovery enabled

---

## ✅ Phase 4: Final Checklist

### 4.1 Documentation
- [ ] README.md updated with production URLs
- [ ] CHANGELOG.md reflects version 2.0.0
- [ ] Runbook created for on-call team
- [ ] Architecture diagrams updated

### 4.2 Team Readiness
- [ ] On-call rotation scheduled
- [ ] PagerDuty/alert recipients configured
- [ ] Incident response plan documented
- [ ] Rollback procedure tested

### 4.3 Monitoring & Alerting
- [ ] Sentry alerts configured
- [ ] Email notifications working
- [ ] Slack webhooks functional (if used)
- [ ] Dashboard bookmarked by team

### 4.4 Compliance (if applicable)
- [ ] GDPR data processing documented
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent banner functional

---

## 🎉 Go-Live Decision

### All Systems Green ✅

**Final Score**: 100/100 🎯

- ✅ All environment variables configured
- ✅ Database migrations applied
- ✅ SSL/TLS active and valid
- ✅ Security headers enforced
- ✅ Authentication working (GitHub + Google)
- ✅ Error tracking active (Sentry)
- ✅ Performance monitoring enabled
- ✅ All 10 languages deployed
- ✅ Build passes with 0 errors
- ✅ Tests passing
- ✅ Core Web Vitals meeting thresholds

**🚀 APPROVED FOR PRODUCTION LAUNCH**

---

## 🚨 Rollback Plan

### If Issues Occur Post-Launch

#### Vercel Rollback
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

#### Docker Rollback
```bash
# Rollback to previous version
kubectl set image deployment/studio-hub \
  studio-hub=your-registry/odavl-studio-hub:1.5.0
```

#### Database Rollback
```bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 📞 Support Contacts

- **Production Issues**: [email]
- **Database Issues**: [email]
- **Security Issues**: [email]
- **On-Call Engineer**: [PagerDuty]

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Approved By**: _________________  

**Good luck with the launch! 🎉🚀**
