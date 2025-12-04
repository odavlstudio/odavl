# Phase 2 Week 7: Cloud Infrastructure Setup - PLAN

**Date:** January 10-17, 2025  
**Status:** 🔄 IN PROGRESS  
**Goal:** Deploy ODAVL Studio to production cloud infrastructure

---

## 📋 Overview

This week focuses on setting up the cloud infrastructure required to run ODAVL Studio in production. We'll deploy web dashboards, configure databases, set up monitoring, and prepare for user traffic.

### Week 7 Objectives
1. ✅ Deploy Insight Cloud dashboard (Vercel)
2. ✅ Deploy Guardian App dashboard (Vercel)
3. ✅ Deploy Studio Hub website (Vercel)
4. ✅ Setup PostgreSQL database (Railway)
5. ✅ Configure environment variables
6. ✅ Setup monitoring (Sentry)
7. ✅ Register domain (odavl.com)
8. ✅ Configure DNS (Cloudflare)

---

## 📅 Daily Breakdown

### Day 1 (January 10): Vercel Setup & First Deployment

**Morning (3 hours):**
- [ ] Create Vercel account (free)
- [ ] Connect GitHub repository
- [ ] Import odavl-studio/insight/cloud project
- [ ] Configure build settings:
  ```
  Framework Preset: Next.js
  Build Command: pnpm build
  Output Directory: .next
  Install Command: pnpm install --frozen-lockfile
  Node Version: 20.x
  ```
- [ ] Add environment variables (dummy values for now):
  ```
  DATABASE_URL=postgresql://placeholder
  NEXTAUTH_SECRET=temp_secret_123
  NEXTAUTH_URL=https://insight-cloud.vercel.app
  ```

**Afternoon (3 hours):**
- [ ] Deploy Insight Cloud (first attempt)
- [ ] Fix any deployment errors:
  - Redis configuration issues
  - Prisma client generation
  - Missing dependencies
- [ ] Verify deployment successful
- [ ] Test basic functionality:
  - Homepage loads
  - Navigation works
  - No 500 errors

**Evening (2 hours):**
- [ ] Document deployment process
- [ ] Take screenshots of successful deployment
- [ ] Note any issues for tomorrow

**Day 1 Goal:** ✅ Insight Cloud deployed on Vercel (even if basic)

---

### Day 2 (January 11): Database Setup

**Morning (3 hours):**
- [ ] Create Railway account (free tier: $5 credit)
- [ ] Provision PostgreSQL database:
  ```
  Plan: Starter ($5/month)
  Region: US East
  Version: PostgreSQL 15
  ```
- [ ] Get database connection string
- [ ] Add to Railway environment variables

**Afternoon (3 hours):**
- [ ] Update Vercel environment variables with real DATABASE_URL
- [ ] Run Prisma migrations:
  ```bash
  cd odavl-studio/insight/cloud
  pnpm prisma migrate deploy
  ```
- [ ] Verify database tables created
- [ ] Test database connection from deployed app
- [ ] Create test user manually (psql)

**Evening (2 hours):**
- [ ] Setup database backups (Railway automatic)
- [ ] Configure connection pooling (PgBouncer on Railway)
- [ ] Document database setup process
- [ ] Test CRUD operations from deployed app

**Day 2 Goal:** ✅ PostgreSQL database connected and working

---

### Day 3 (January 12): Guardian App Deployment

**Morning (3 hours):**
- [ ] Fix Guardian App build errors (if any remain):
  - bcrypt issues
  - Database schema
  - Environment variables
- [ ] Test build locally:
  ```bash
  cd odavl-studio/guardian/app
  pnpm build
  ```
- [ ] Ensure 100% build success

**Afternoon (3 hours):**
- [ ] Import Guardian App to Vercel
- [ ] Configure build settings
- [ ] Add environment variables:
  ```
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=...
  NEXTAUTH_URL=https://guardian-app.vercel.app
  ```
- [ ] Deploy Guardian App

**Evening (2 hours):**
- [ ] Verify deployment
- [ ] Test core features:
    - Login/signup
    - Dashboard access
    - Test submission
- [ ] Fix any post-deployment issues

**Day 3 Goal:** ✅ Guardian App deployed on Vercel

---

### Day 4 (January 13): Studio Hub Website

**Morning (3 hours):**
- [ ] Fix Studio Hub build errors (if any):
  - Missing dependencies
  - Configuration issues
  - API routes
- [ ] Test build locally:
  ```bash
  cd apps/studio-hub
  pnpm build
  ```

**Afternoon (3 hours):**
- [ ] Import Studio Hub to Vercel
- [ ] Configure as marketing site
- [ ] Deploy Studio Hub
- [ ] Verify deployment successful

**Evening (2 hours):**
- [ ] Test all pages:
  - Homepage
  - Features
  - Pricing
  - Documentation links
  - Contact form
- [ ] Check responsive design (mobile, tablet)
- [ ] Fix any visual issues

**Day 4 Goal:** ✅ Studio Hub deployed on Vercel

---

### Day 5 (January 14): Domain & DNS Setup

**Morning (3 hours):**
- [ ] Register domain: odavl.com ($12/year on Namecheap)
- [ ] Alternative if taken: odavl.studio, odavlstudio.com
- [ ] Create Cloudflare account (free tier)
- [ ] Add domain to Cloudflare
- [ ] Update nameservers at registrar

**Afternoon (3 hours):**
- [ ] Configure DNS records in Cloudflare:
  ```
  A     @              76.76.21.21 (Vercel)
  CNAME www            odavl.com
  CNAME insight        insight-cloud.vercel.app
  CNAME guardian       guardian-app.vercel.app
  MX    @              (email provider)
  TXT   @              (verification records)
  ```
- [ ] Add custom domains in Vercel:
  - odavl.com → Studio Hub
  - insight.odavl.com → Insight Cloud
  - guardian.odavl.com → Guardian App

**Evening (2 hours):**
- [ ] Wait for DNS propagation (up to 24 hours)
- [ ] Test domain access
- [ ] Verify SSL certificates (Vercel auto-generates)
- [ ] Update NEXTAUTH_URL environment variables

**Day 5 Goal:** ✅ Custom domain configured and working

---

### Day 6 (January 15): Monitoring & Error Tracking

**Morning (3 hours):**
- [ ] Create Sentry account (Developer plan: $26/month)
- [ ] Create 3 projects:
  1. odavl-insight-cloud (Next.js)
  2. odavl-guardian-app (Next.js)
  3. odavl-studio-hub (Next.js)
- [ ] Get DSN (Data Source Name) for each

**Afternoon (3 hours):**
- [ ] Install Sentry in each Next.js app:
  ```bash
  cd odavl-studio/insight/cloud
  pnpm add @sentry/nextjs
  pnpm sentry:init
  ```
- [ ] Configure Sentry:
  ```typescript
  // sentry.client.config.ts
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
  ```
- [ ] Add SENTRY_DSN to Vercel environment variables

**Evening (2 hours):**
- [ ] Test error tracking:
  - Trigger test error
  - Verify in Sentry dashboard
  - Check source maps work
- [ ] Configure alerts:
  - Email on errors
  - Slack integration (optional)
- [ ] Setup performance monitoring

**Day 6 Goal:** ✅ Sentry monitoring active on all apps

---

### Day 7 (January 16): Testing & Documentation

**Morning (3 hours):**
- [ ] End-to-end testing of all deployed apps:
  - Insight Cloud: Login, view dashboard, analyze project
  - Guardian App: Login, run tests, view results
  - Studio Hub: Navigation, forms, responsive design
- [ ] Test from different devices:
  - Desktop (Chrome, Firefox, Safari)
  - Mobile (iOS, Android)
  - Tablet

**Afternoon (3 hours):**
- [ ] Performance testing:
  - Lighthouse scores (target: 90+)
  - Page load times (target: <3s)
  - Time to interactive (target: <1s)
- [ ] Security testing:
  - SSL/TLS working
  - CORS configured
  - Security headers present
- [ ] Load testing (optional):
  - Use Artillery or k6
  - Simulate 100 concurrent users

**Evening (2 hours):**
- [ ] Create deployment documentation:
  - Environment variables list
  - Deployment process
  - Rollback procedures
  - Troubleshooting guide
- [ ] Create Week 7 completion report
- [ ] Update status page (if created)

**Day 7 Goal:** ✅ Week 7 complete, all systems operational

---

## 📊 Success Metrics

### Deployment Metrics
- ✅ 3 apps deployed (Insight Cloud, Guardian App, Studio Hub)
- ✅ Custom domain configured (odavl.com)
- ✅ SSL certificates active
- ✅ Database connected and migrations run
- ✅ Monitoring active (Sentry)

### Performance Metrics
- ✅ Lighthouse score: 90+ (all apps)
- ✅ Page load time: <3s
- ✅ Time to interactive: <1s
- ✅ First Contentful Paint: <1.5s

### Availability Metrics
- ✅ Uptime: 99.9%+ (Vercel SLA)
- ✅ Error rate: <1%
- ✅ Response time: <500ms (p95)

---

## 💰 Week 7 Budget

```
Domain (odavl.com):       $12/year = $1/month
Railway (PostgreSQL):     $5/month
Vercel Pro (3 projects):  $60/month ($20 each)
Sentry:                   $26/month
Cloudflare:               $0 (free tier)
─────────────────────────────────────────
Total:                    $92/month
One-time:                 $12 (domain)
```

---

## 🛠️ Technical Stack

### Hosting & Infrastructure
- **Web Apps:** Vercel (Next.js hosting)
- **Database:** Railway (PostgreSQL 15)
- **CDN:** Cloudflare (free tier)
- **Domain:** Namecheap or Google Domains

### Monitoring & Analytics
- **Error Tracking:** Sentry ($26/month)
- **Analytics:** Google Analytics 4 (free)
- **Uptime:** UptimeRobot (free, optional)

### Development Tools
- **Version Control:** GitHub
- **CI/CD:** Vercel auto-deploys on push
- **Database Management:** Prisma Studio

---

## 🔒 Security Checklist

### Application Security
- [ ] Environment variables secured (Vercel encrypted)
- [ ] Secrets not in code (DATABASE_URL, API keys)
- [ ] Authentication working (NextAuth.js)
- [ ] CORS properly configured
- [ ] Rate limiting enabled (if applicable)

### Infrastructure Security
- [ ] SSL/TLS certificates active (Vercel auto)
- [ ] HTTPS redirect enabled
- [ ] Security headers configured:
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000
  ```
- [ ] Database connections encrypted
- [ ] Firewall rules configured (Railway)

### Monitoring Security
- [ ] Sentry PII scrubbing enabled
- [ ] Access logs reviewed
- [ ] Failed login attempts tracked
- [ ] Suspicious activity alerts configured

---

## 📝 Environment Variables Checklist

### Insight Cloud (`odavl-studio/insight/cloud`)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
NEXTAUTH_SECRET=random_secret_min_32_chars
NEXTAUTH_URL=https://insight.odavl.com

# OAuth (optional for Week 7)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Guardian App (`odavl-studio/guardian/app`)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
NEXTAUTH_SECRET=random_secret_min_32_chars
NEXTAUTH_URL=https://guardian.odavl.com

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
```

### Studio Hub (`apps/studio-hub`)
```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Contact Form (optional)
SENDGRID_API_KEY=...
CONTACT_EMAIL=support@odavl.com
```

---

## 🚧 Known Issues & Workarounds

### Issue 1: Prisma Client Generation on Vercel
**Problem:** Prisma client not generated during build  
**Workaround:** Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue 2: Redis Client Errors
**Problem:** Redis not configured  
**Workaround:** Remove Redis dependencies for Week 7, add in Week 8

### Issue 3: Build Memory Limit
**Problem:** Vercel build fails due to memory  
**Workaround:** Upgrade to Vercel Pro ($20/month per project)

---

## 📚 Documentation to Create

### Deployment Documentation
- [ ] `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- [ ] `ENVIRONMENT_VARIABLES.md` - All env vars explained
- [ ] `ROLLBACK_PROCEDURE.md` - How to rollback if issues
- [ ] `TROUBLESHOOTING_DEPLOYMENT.md` - Common issues

### Operations Documentation
- [ ] `MONITORING_GUIDE.md` - Using Sentry effectively
- [ ] `DATABASE_MANAGEMENT.md` - Backups, migrations, scaling
- [ ] `INCIDENT_RESPONSE.md` - What to do when things break
- [ ] `PERFORMANCE_OPTIMIZATION.md` - Keep things fast

---

## ✅ Week 7 Completion Criteria

### Must Have (Required)
- ✅ All 3 apps deployed on Vercel
- ✅ PostgreSQL database connected
- ✅ Custom domain working (odavl.com)
- ✅ SSL certificates active
- ✅ Monitoring enabled (Sentry)
- ✅ Basic functionality tested

### Should Have (Important)
- ✅ Lighthouse scores 90+
- ✅ All pages loading <3s
- ✅ No critical errors in Sentry
- ✅ Documentation complete

### Nice to Have (Optional)
- ⚪ Email notifications working
- ⚪ Uptime monitoring configured
- ⚪ Status page created
- ⚪ Load testing performed

---

## 🎯 Next Week Preview (Week 8)

**Focus:** Authentication & User Management

- Implement JWT authentication
- OAuth integration (Google, GitHub)
- User registration flow
- Password reset functionality
- Team management (basic)

---

## 📞 Support & Resources

### Vercel Documentation
- https://vercel.com/docs
- https://vercel.com/docs/concepts/next.js

### Railway Documentation
- https://docs.railway.app
- https://docs.railway.app/databases/postgresql

### Sentry Documentation
- https://docs.sentry.io
- https://docs.sentry.io/platforms/javascript/guides/nextjs/

### Cloudflare Documentation
- https://developers.cloudflare.com/dns/

---

**Week 7 Status:** 🔄 IN PROGRESS  
**Start Date:** January 10, 2025  
**Target Completion:** January 16, 2025  
**Budget:** $92/month + $12 one-time

**Let's deploy to production!** 🚀
