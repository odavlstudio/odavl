# Vercel Deployment Guide - ODAVL Studio

**Purpose:** Step-by-step guide for deploying ODAVL Studio apps to Vercel  
**Date:** January 10, 2025  
**Status:** 🔄 In Progress

---

## 📋 Overview

This guide covers deploying three Next.js applications to Vercel:
1. **Insight Cloud** - Main dashboard (`odavl-studio/insight/cloud`)
2. **Guardian App** - Testing dashboard (`odavl-studio/guardian/app`)
3. **Studio Hub** - Marketing website (`apps/studio-hub`)

---

## 🚀 Pre-Deployment Checklist

### Repository Requirements
- [x] Code pushed to GitHub
- [ ] All builds passing locally
- [ ] Environment variables documented
- [ ] Database schema ready (Prisma)

### Vercel Account Setup
- [ ] Create Vercel account (https://vercel.com/signup)
- [ ] Connect GitHub account
- [ ] Enable auto-deployments
- [ ] Configure team settings (optional)

---

## 📦 App 1: Insight Cloud

### Project Configuration

**Directory:** `odavl-studio/insight/cloud`  
**Framework:** Next.js 15  
**Node Version:** 20.x  
**Package Manager:** pnpm

### Vercel Project Settings

```yaml
Project Name: odavl-insight-cloud
Root Directory: odavl-studio/insight/cloud
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install --frozen-lockfile
Node.js Version: 20.x
Environment Variables: See below
```

### Environment Variables (Production)

```bash
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Authentication (NextAuth.js)
NEXTAUTH_SECRET=your_random_secret_min_32_characters_long_please
NEXTAUTH_URL=https://insight.odavl.com

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Analytics (Google Analytics)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Application Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Build Settings

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build",
    "start": "next start"
  }
}
```

### Deployment Steps

1. **Import Project**
   - Go to https://vercel.com/new
   - Select GitHub repository
   - Choose "odavl" repository
   - Set root directory: `odavl-studio/insight/cloud`

2. **Configure Build**
   - Framework: Next.js (auto-detected)
   - Build command: `pnpm build`
   - Output: `.next`
   - Install: `pnpm install --frozen-lockfile`

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from above
   - Select "Production" environment
   - Click "Add"

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~3-5 minutes)
   - Check deployment logs for errors

5. **Verify Deployment**
   - Visit: https://odavl-insight-cloud.vercel.app
   - Check homepage loads
   - Verify no 500 errors
   - Test database connection

### Post-Deployment Tasks

- [ ] Run database migrations:
  ```bash
  pnpm prisma migrate deploy
  ```
- [ ] Create test user
- [ ] Test login functionality
- [ ] Configure custom domain (later)

---

## 📦 App 2: Guardian App

### Project Configuration

**Directory:** `odavl-studio/guardian/app`  
**Framework:** Next.js 15  
**Node Version:** 20.x  
**Package Manager:** pnpm

### Vercel Project Settings

```yaml
Project Name: odavl-guardian-app
Root Directory: odavl-studio/guardian/app
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install --frozen-lockfile
Node.js Version: 20.x
```

### Environment Variables (Production)

```bash
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Authentication (NextAuth.js)
NEXTAUTH_SECRET=different_random_secret_for_guardian_app
NEXTAUTH_URL=https://guardian.odavl.com

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://yyy@yyy.ingest.sentry.io/yyy
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Application Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Deployment Steps

1. **Import Project**
   - Vercel Dashboard → Add New Project
   - Select "odavl" repository
   - Root directory: `odavl-studio/guardian/app`

2. **Configure & Deploy**
   - Same as Insight Cloud
   - Add environment variables
   - Deploy

3. **Verify**
   - Visit: https://odavl-guardian-app.vercel.app
   - Test functionality

---

## 📦 App 3: Studio Hub (Marketing Site)

### Project Configuration

**Directory:** `apps/studio-hub`  
**Framework:** Next.js 15  
**Node Version:** 20.x  
**Package Manager:** pnpm

### Vercel Project Settings

```yaml
Project Name: odavl-studio-hub
Root Directory: apps/studio-hub
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install --frozen-lockfile
Node.js Version: 20.x
```

### Environment Variables (Production)

```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Contact Form (optional)
SENDGRID_API_KEY=SG.xxx
CONTACT_EMAIL=support@odavl.com

# Application Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Deployment Steps

1. **Import Project**
   - Root directory: `apps/studio-hub`
   - Deploy

2. **Verify**
   - Visit: https://odavl-studio-hub.vercel.app
   - Test all pages

---

## 🌐 Custom Domain Configuration

### Domain Setup (After Week 7 Day 5)

**Target Domains:**
- `odavl.com` → Studio Hub (marketing)
- `insight.odavl.com` → Insight Cloud
- `guardian.odavl.com` → Guardian App

### Vercel Domain Configuration

1. **Studio Hub (odavl.com)**
   ```
   Project: odavl-studio-hub
   Settings → Domains
   Add: odavl.com
   Add: www.odavl.com (redirect to odavl.com)
   ```

2. **Insight Cloud (insight.odavl.com)**
   ```
   Project: odavl-insight-cloud
   Settings → Domains
   Add: insight.odavl.com
   ```

3. **Guardian App (guardian.odavl.com)**
   ```
   Project: odavl-guardian-app
   Settings → Domains
   Add: guardian.odavl.com
   ```

### DNS Configuration (Cloudflare)

```
Type   Name      Target                          TTL
────────────────────────────────────────────────────
A      @         76.76.21.21 (Vercel)            Auto
CNAME  www       odavl.com                       Auto
CNAME  insight   cname.vercel-dns.com            Auto
CNAME  guardian  cname.vercel-dns.com            Auto
```

### SSL Certificates

- Vercel automatically provisions SSL certificates
- HTTPS redirect enabled by default
- Certificates auto-renew every 90 days

---

## 🔧 Troubleshooting

### Issue: Build Fails with "Cannot find module 'prisma'"

**Solution:**
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue: Environment Variables Not Loading

**Solution:**
- Check variable names (exact match)
- Verify environment selection (Production/Preview)
- Redeploy after adding variables

### Issue: Database Connection Timeout

**Solution:**
- Verify DATABASE_URL format
- Check Railway database is running
- Test connection locally first

### Issue: Build Memory Exceeded

**Solution:**
- Upgrade to Vercel Pro ($20/month)
- Optimize build process
- Reduce bundle size

---

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] All packages building locally
- [ ] Environment variables documented
- [ ] Database schema ready
- [ ] Prisma migrations created

### During Deployment
- [ ] Project imported to Vercel
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Deployment successful

### Post-Deployment
- [ ] Homepage loads without errors
- [ ] Database connection works
- [ ] Authentication functional
- [ ] Monitoring active (Sentry)
- [ ] Performance acceptable (Lighthouse 90+)

---

## 🎯 Success Criteria

### Deployment Success
- ✅ All 3 apps deployed
- ✅ No build errors
- ✅ All pages accessible
- ✅ SSL certificates active

### Functionality Success
- ✅ Database queries working
- ✅ Authentication functional
- ✅ No critical JavaScript errors
- ✅ Forms submitting correctly

### Performance Success
- ✅ Lighthouse score: 90+
- ✅ Page load: <3s
- ✅ Time to interactive: <1s
- ✅ No layout shifts (CLS < 0.1)

---

## 📞 Support Resources

### Vercel Documentation
- https://vercel.com/docs
- https://vercel.com/docs/deployments/overview

### Next.js on Vercel
- https://vercel.com/docs/frameworks/nextjs

### Vercel CLI
```bash
# Install
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 💰 Pricing (Week 7)

```
Vercel Hobby (Free):
- 100 GB bandwidth
- Unlimited personal projects
- Automatic HTTPS
- Preview deployments
- Good for: Studio Hub

Vercel Pro ($20/month per project):
- 1 TB bandwidth
- Team collaboration
- Priority support
- Analytics
- Good for: Insight Cloud, Guardian App

Total Vercel Cost: $40/month (2 Pro projects)
```

---

**Guide Status:** 🔄 In Progress  
**Last Updated:** January 10, 2025  
**Next Steps:** Deploy first app (Insight Cloud)
