# Phase 2 Week 7 Day 3 - Production Deployment Plan

**Date:** November 23, 2025  
**Objective:** Deploy Insight Cloud to production with Railway PostgreSQL + Vercel  
**Estimated Time:** 4-5 hours  
**Budget:** $6/month  

---

## 🎯 Mission

Deploy authentication system to production environment with Railway database and Vercel hosting.

---

## 📋 Prerequisites

✅ Day 1 Complete - Auth package built (241KB ESM, 243KB CJS)  
✅ Day 2 Complete - Auth API routes working (5/5 tests passing)  
✅ Local testing validated - All auth scenarios working  
⏸️ Railway account - Need to create  
⏸️ Vercel account - Need to create  
⏸️ GitHub repo - Already exists (odavl)  

---

## 🔧 Task Breakdown

### Task 1: Setup Railway PostgreSQL (1.5 hours)

**Objective:** Deploy production PostgreSQL database

**Steps:**
1. **Create Railway Account** (10 min)
   ```bash
   # Visit: https://railway.app/
   # Sign up with GitHub
   # Verify email
   ```

2. **Create New Project** (5 min)
   - Click "New Project"
   - Select "Deploy PostgreSQL"
   - Choose region (closest to users)
   - Name: "odavl-insight-db"

3. **Get Database Credentials** (5 min)
   ```bash
   # Railway Dashboard → PostgreSQL → Variables
   # Copy DATABASE_URL
   
   # Format: postgresql://user:pass@host:port/db
   # Example: postgresql://postgres:pass@containers-us-west.railway.app:1234/railway
   ```

4. **Update Environment Variables** (10 min)
   ```bash
   # Create .env.production in insight/cloud
   cd odavl-studio/insight/cloud
   
   # Add to .env.production:
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
   NODE_ENV="production"
   NEXTAUTH_URL="https://odavl-insight.vercel.app"
   ```

5. **Update Prisma Schema for PostgreSQL** (15 min)
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"  // Change from sqlite
     url      = env("DATABASE_URL")
   }
   ```

6. **Generate Migration** (10 min)
   ```bash
   # Create migration for PostgreSQL
   pnpm prisma migrate dev --name init_production
   
   # This creates migration files
   ```

7. **Deploy Migration to Railway** (15 min)
   ```bash
   # Set DATABASE_URL temporarily
   $env:DATABASE_URL="postgresql://..."
   
   # Run migration
   pnpm prisma migrate deploy
   
   # Verify tables created
   pnpm prisma studio
   ```

8. **Test Connection** (10 min)
   ```bash
   # Create test script: scripts/test-railway-connection.ts
   import { PrismaClient } from '@prisma/client';
   
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });
   
   async function testConnection() {
     try {
       await prisma.$connect();
       console.log('✅ Connected to Railway PostgreSQL');
       
       const userCount = await prisma.user.count();
       console.log(`📊 Users in database: ${userCount}`);
       
       await prisma.$disconnect();
     } catch (error) {
       console.error('❌ Connection failed:', error);
       process.exit(1);
     }
   }
   
   testConnection();
   ```
   
   ```bash
   # Run test
   DATABASE_URL="postgresql://..." pnpm tsx scripts/test-railway-connection.ts
   ```

**Expected Result:**
- ✅ Railway PostgreSQL deployed
- ✅ DATABASE_URL obtained
- ✅ Schema migrated successfully
- ✅ Connection test passing

**Cost:** $5/month (Railway PostgreSQL)

---

### Task 2: Prepare for Vercel Deployment (1 hour)

**Objective:** Configure project for Vercel hosting

**Steps:**
1. **Verify Build Command** (10 min)
   ```bash
   # Test production build locally
   cd odavl-studio/insight/cloud
   pnpm build
   
   # Should complete without errors
   # Output: .next/ directory created
   ```

2. **Create vercel.json** (15 min)
   ```json
   {
     "version": 2,
     "buildCommand": "pnpm build",
     "devCommand": "pnpm dev",
     "installCommand": "pnpm install",
     "framework": "nextjs",
     "outputDirectory": ".next",
     "regions": ["iad1"],
     "env": {
       "DATABASE_URL": "@database_url",
       "JWT_SECRET": "@jwt_secret",
       "NODE_ENV": "production"
     }
   }
   ```

3. **Update package.json** (5 min)
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start",
       "postinstall": "prisma generate"
     },
     "engines": {
       "node": ">=18.18",
       "pnpm": ">=8.0.0"
     }
   }
   ```

4. **Create .vercelignore** (5 min)
   ```
   node_modules
   .next
   prisma/dev.db
   .env
   .env.local
   reports
   undo
   .odavl
   ```

5. **Test Environment Variables** (10 min)
   ```bash
   # Create .env.production.local (gitignored)
   DATABASE_URL="postgresql://..."
   JWT_SECRET="production-secret-key-min-32-chars"
   
   # Test build with production env
   NODE_ENV=production pnpm build
   ```

6. **Verify Dependencies** (15 min)
   ```bash
   # Check package.json has all runtime deps
   # - @prisma/client
   # - @odavl-studio/auth
   # - @odavl/types
   # - bcryptjs
   # - jsonwebtoken
   # - zod
   
   # Test clean install
   rm -rf node_modules
   pnpm install --prod
   ```

**Expected Result:**
- ✅ Build succeeds locally
- ✅ vercel.json configured
- ✅ Environment variables ready
- ✅ Dependencies verified

---

### Task 3: Deploy to Vercel (1 hour)

**Objective:** Deploy Insight Cloud dashboard to Vercel

**Steps:**
1. **Create Vercel Account** (5 min)
   ```bash
   # Visit: https://vercel.com/
   # Sign up with GitHub
   # Authorize Vercel to access odavl repo
   ```

2. **Import Project** (10 min)
   - Click "Add New Project"
   - Select "odavl" repository
   - Framework: Next.js (auto-detected)
   - Root directory: `odavl-studio/insight/cloud`
   - Build command: `pnpm build`
   - Install command: `pnpm install`

3. **Configure Environment Variables** (15 min)
   ```
   DATABASE_URL = postgresql://... (from Railway)
   JWT_SECRET = your-production-secret-min-32-chars
   NODE_ENV = production
   NEXTAUTH_URL = https://odavl-insight.vercel.app
   ```
   
   - Go to Project Settings → Environment Variables
   - Add each variable
   - Select "Production" environment

4. **Configure Build Settings** (10 min)
   ```
   Framework Preset: Next.js
   Build Command: cd ../.. && pnpm build --filter=@odavl-studio/insight-cloud
   Output Directory: odavl-studio/insight/cloud/.next
   Install Command: pnpm install
   Node.js Version: 18.x
   ```

5. **Deploy** (15 min)
   - Click "Deploy"
   - Wait for build to complete (~5 min)
   - Check deployment logs for errors
   
   ```bash
   # Expected output:
   # ✓ Compiled successfully
   # ✓ Linting and checking validity of types
   # ✓ Collecting page data
   # ✓ Generating static pages (X/X)
   # ✓ Finalizing page optimization
   ```

6. **Verify Deployment** (5 min)
   ```bash
   # Visit: https://odavl-insight.vercel.app
   # Should see Insight Cloud homepage
   # Check /api/health endpoint
   ```

**Expected Result:**
- ✅ Deployment successful
- ✅ Site accessible via Vercel URL
- ✅ Environment variables working
- ✅ Database connected

**Cost:** $0 (Vercel free tier)

---

### Task 4: Test Production Authentication (1 hour)

**Objective:** Validate auth works in production

**Test Scenarios:**

#### Test 1: Production Registration
```bash
# PowerShell script
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "prod-test-$timestamp@odavl.com"
$password = "ProductionP@ss123"

$body = @{
  email = $email
  password = $password
  name = "Production Test User"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://odavl-insight.vercel.app/api/auth/register" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

# Expected: 200 OK with user object + tokens
```

#### Test 2: Production Login
```bash
$body = @{
  email = $email
  password = $password
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://odavl-insight.vercel.app/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

# Expected: 200 OK with tokens
```

#### Test 3: Weak Password Validation
```bash
$body = @{
  email = "weak@test.com"
  password = "abc"
  name = "Weak Test"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://odavl-insight.vercel.app/api/auth/register" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

# Expected: 400 Bad Request with validation errors
```

#### Test 4: Verify Railway Database
```bash
# Connect to Railway PostgreSQL
DATABASE_URL="postgresql://..." pnpm prisma studio

# Check:
# - User table has records
# - Session table has tokens
# - Subscription table has FREE tier
```

#### Test 5: Token Validation
```bash
# Use access token from Test 1
$token = "eyJhbGciOiJIUzI1NiIs..."

Invoke-RestMethod `
  -Uri "https://odavl-insight.vercel.app/api/auth/me" `
  -Method GET `
  -Headers @{Authorization = "Bearer $token"}

# Expected: 200 OK with user profile
```

**Expected Results:**
- ✅ Registration works in production
- ✅ Login works in production
- ✅ Password validation working
- ✅ Database records created
- ✅ JWT tokens valid

---

### Task 5: Domain Setup (Optional - 30 min)

**Objective:** Configure custom domain (optional)

**Steps:**
1. **Register Domain** (15 min)
   ```bash
   # Visit: https://namecheap.com/ or https://domains.google/
   # Search: odavl.com
   # Purchase: ~$12/year (~$1/month)
   ```

2. **Configure DNS** (10 min)
   ```
   # Vercel Dashboard → Project → Domains
   # Add custom domain: odavl.com
   
   # Vercel will provide DNS records:
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```

3. **Add DNS Records to Registrar** (5 min)
   - Go to domain registrar DNS settings
   - Add A record for root domain
   - Add CNAME for www subdomain
   - Wait for propagation (~5-30 min)

4. **Verify Domain** (5 min)
   ```bash
   # Visit: https://odavl.com
   # Should redirect to Vercel deployment
   
   # Test auth:
   curl https://odavl.com/api/health
   ```

**Expected Result:**
- ✅ Custom domain working (if purchased)
- ✅ SSL certificate auto-configured
- ✅ HTTP → HTTPS redirect

**Cost:** $1/month (optional)

---

### Task 6: Document Deployment (30 min)

**Objective:** Create deployment documentation

**Files to Create:**

#### 1. docs/DEPLOYMENT_GUIDE.md
```markdown
# ODAVL Insight Cloud - Deployment Guide

## Railway PostgreSQL Setup
- Account: https://railway.app/
- Project: odavl-insight-db
- DATABASE_URL: [See Railway dashboard]
- Cost: $5/month

## Vercel Hosting
- Account: https://vercel.com/
- Project: odavl-insight
- URL: https://odavl-insight.vercel.app
- Cost: Free

## Environment Variables
DATABASE_URL - Railway PostgreSQL connection string
JWT_SECRET - Minimum 32 characters
NODE_ENV - production
NEXTAUTH_URL - https://odavl-insight.vercel.app

## Deployment Process
1. Push to GitHub main branch
2. Vercel auto-deploys
3. Check deployment logs
4. Test auth endpoints

## Troubleshooting
- Database connection errors: Check DATABASE_URL
- Build failures: Check pnpm-lock.yaml committed
- 500 errors: Check Vercel function logs
```

#### 2. docs/PHASE_2_WEEK_7_DAY_3_COMPLETE.md
```markdown
# Phase 2 Week 7 Day 3 - Production Deployment Complete

## Summary
✅ Railway PostgreSQL deployed ($5/month)
✅ Vercel hosting configured (free)
✅ Production auth tested (5/5 passing)
✅ Documentation complete

## URLs
- Production: https://odavl-insight.vercel.app
- Database: Railway PostgreSQL
- GitHub: https://github.com/your-org/odavl

## Next Steps
- Week 8: Advanced auth features (email verification, OAuth)
- Week 9: Dashboard UI improvements
- Week 10: Analytics & monitoring
```

**Expected Result:**
- ✅ Deployment guide created
- ✅ Day 3 completion report
- ✅ Troubleshooting documented

---

## 📊 Day 3 Timeline

```
Hour 1: Railway Setup
├── 0:00-0:10 - Create Railway account
├── 0:10-0:20 - Deploy PostgreSQL database
├── 0:20-0:35 - Get credentials & configure
├── 0:35-0:50 - Update Prisma schema
└── 0:50-1:00 - Run migrations

Hour 2: Migration & Testing
├── 1:00-1:15 - Deploy migrations to Railway
├── 1:15-1:30 - Test database connection
├── 1:30-1:45 - Verify schema & data
└── 1:45-2:00 - Document Railway setup

Hour 3: Vercel Preparation
├── 2:00-2:15 - Verify local build
├── 2:15-2:30 - Create vercel.json
├── 2:30-2:45 - Configure environment
└── 2:45-3:00 - Test production build

Hour 4: Vercel Deployment
├── 3:00-3:10 - Create Vercel account
├── 3:10-3:25 - Import & configure project
├── 3:25-3:40 - Set environment variables
├── 3:40-3:55 - Deploy to production
└── 3:55-4:00 - Verify deployment

Hour 5: Production Testing
├── 4:00-4:15 - Test registration endpoint
├── 4:15-4:30 - Test login endpoint
├── 4:30-4:45 - Test validation & errors
├── 4:45-5:00 - Verify Railway database
└── 5:00+ - Optional: Domain setup

Total: 5 hours (4 hours core + 1 hour optional domain)
```

---

## 🎯 Success Criteria

### Must Have
- [ ] Railway PostgreSQL deployed and accessible
- [ ] Database migrations applied successfully
- [ ] Vercel deployment successful
- [ ] Production auth endpoints working
- [ ] All 5 test scenarios passing in production

### Nice to Have
- [ ] Custom domain configured (optional)
- [ ] SSL certificate auto-configured
- [ ] Deployment guide documented

### Quality Gates
- [ ] Zero database connection errors
- [ ] Build completes without warnings
- [ ] All auth tests passing
- [ ] Documentation complete

---

## 💰 Cost Summary

```yaml
Railway PostgreSQL: $5/month
  - 500MB storage
  - Unlimited queries
  - Auto-backups
  - High availability

Vercel Hosting: $0/month (Free tier)
  - 100GB bandwidth/month
  - Serverless functions
  - Auto-scaling
  - SSL included

Domain (optional): $1/month (~$12/year)
  - odavl.com
  - DNS management
  - WHOIS privacy

Total: $6/month (or $5/month without domain)
```

---

## 🚨 Potential Issues & Solutions

### Issue 1: Railway Connection Timeout
**Symptom:** `ECONNREFUSED` or timeout errors  
**Solution:**
```bash
# Check DATABASE_URL format
# Should include ?sslmode=require for Railway
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

### Issue 2: Vercel Build Failure
**Symptom:** Build fails with "Cannot find module"  
**Solution:**
```bash
# Ensure pnpm-lock.yaml is committed
git add pnpm-lock.yaml
git commit -m "Add pnpm lockfile"

# Verify build command in vercel.json
"buildCommand": "pnpm build"
```

### Issue 3: Prisma Generate Fails
**Symptom:** `@prisma/client` not found  
**Solution:**
```json
// Add postinstall script to package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue 4: JWT Secret Not Set
**Symptom:** 500 error on auth endpoints  
**Solution:**
```bash
# Verify JWT_SECRET in Vercel env vars
# Must be minimum 32 characters
# Generate: openssl rand -base64 32
```

### Issue 5: CORS Errors
**Symptom:** Frontend can't call API  
**Solution:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

---

## 📋 Pre-Flight Checklist

Before starting Day 3:
- [x] Day 2 complete (auth API working locally)
- [x] GitHub repository up to date
- [x] Local tests passing (5/5)
- [ ] Credit card ready for Railway ($5/month)
- [ ] Email ready for account signups
- [ ] GitHub account with repo access

---

## 🎓 Learning Objectives

By end of Day 3, you will know:
- ✅ How to deploy PostgreSQL to Railway
- ✅ How to migrate Prisma schema to production
- ✅ How to deploy Next.js to Vercel
- ✅ How to configure environment variables
- ✅ How to test production endpoints
- ✅ How to troubleshoot deployment issues

---

**Ready to deploy? Let's make ODAVL Insight live! 🚀**
