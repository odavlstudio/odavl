# Phase 2 Week 7 Day 2 - API Routes & Production Deployment

**Date:** November 23, 2025  
**Focus:** Create authentication API routes and deploy to production  
**Estimated Time:** 6-7 hours  
**Budget:** $5/month (Railway PostgreSQL)

---

## 🎯 Mission

Build production-ready authentication API endpoints, deploy PostgreSQL database to Railway, and launch ODAVL Insight Cloud dashboard on Vercel with working authentication.

---

## 📋 Tasks Overview

### Task 1: Create Auth API Routes (2 hours)
**Location:** `odavl-studio/insight/cloud/app/api/auth/`

**Endpoints to create:**
1. POST `/api/auth/register` - User registration
2. POST `/api/auth/login` - User login
3. POST `/api/auth/refresh` - Refresh access token
4. POST `/api/auth/verify-email` - Verify email with token
5. POST `/api/auth/request-reset` - Request password reset
6. POST `/api/auth/reset-password` - Reset password with token

**Features:**
- ✅ Input validation (zod schemas)
- ✅ Error handling with proper status codes
- ✅ Rate limiting (simple in-memory for now)
- ✅ CORS configuration
- ✅ JWT token generation
- ✅ Secure password hashing

**Expected Outcome:**
- All 6 endpoints working locally
- Test with curl commands
- Proper error responses
- JWT tokens validated

---

### Task 2: Setup Railway PostgreSQL (1 hour)
**Provider:** Railway  
**Cost:** $5/month  

**Steps:**
1. Create Railway account at railway.app
2. Create new project "odavl-production"
3. Add PostgreSQL service
4. Copy DATABASE_URL
5. Add Redis service (optional, for caching)
6. Copy REDIS_URL

**Environment Variables:**
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
JWT_SECRET=<generate-random-secret>
```

**Expected Outcome:**
- Railway PostgreSQL deployed
- Connection URL copied
- Database accessible from local machine
- Ready for Prisma migrations

---

### Task 3: Apply Production Migrations (30 min)
**Tool:** Prisma

**Steps:**
1. Update `.env.production` with DATABASE_URL
2. Run `pnpm prisma generate` (regenerate with production URL)
3. Run `pnpm prisma db push` (apply schema to Railway)
4. Verify tables created
5. Test connection from API routes

**Expected Outcome:**
- All tables created in Railway PostgreSQL
- Schema matches local SQLite
- Connection successful
- Ready for production use

---

### Task 4: Deploy to Vercel (1.5 hours)
**Platform:** Vercel  
**Domain:** odavl.com (to be registered)

**Steps:**
1. Create Vercel account
2. Connect GitHub repository
3. Configure build settings:
   - Framework: Next.js
   - Root: `odavl-studio/insight/cloud`
   - Build Command: `pnpm build`
   - Output: `.next`
4. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `REDIS_URL` (if using)
5. Deploy!

**Expected Outcome:**
- Dashboard live at `*.vercel.app`
- Authentication working
- Database connected
- Zero errors in production

---

### Task 5: Domain Setup (1 hour)
**Registrar:** Cloudflare or Namecheap  
**Domain:** odavl.com  
**Cost:** $10-12/year

**Steps:**
1. Register odavl.com
2. Setup Cloudflare DNS (free)
3. Add CNAME record pointing to Vercel
4. Update Vercel project with custom domain
5. Enable SSL (automatic via Vercel)
6. Test: https://odavl.com

**Expected Outcome:**
- odavl.com resolves to dashboard
- HTTPS enabled
- SSL certificate active
- Professional domain live!

---

### Task 6: Test Production Auth Flow (1 hour)
**Focus:** End-to-end testing in production

**Test Scenarios:**
1. **Registration Flow:**
   - POST to `/api/auth/register` with valid data
   - Verify user created in Railway database
   - Receive JWT tokens
   - Store tokens in browser

2. **Login Flow:**
   - POST to `/api/auth/login` with credentials
   - Verify password hashed correctly
   - Receive fresh JWT tokens
   - Test token validation

3. **Token Refresh:**
   - POST to `/api/auth/refresh` with refresh token
   - Receive new access token
   - Verify old token invalidated

4. **Error Cases:**
   - Invalid email format → 400 Bad Request
   - Weak password → 400 Bad Request
   - Duplicate email → 409 Conflict
   - Wrong password → 401 Unauthorized
   - Expired token → 401 Unauthorized

**Expected Outcome:**
- All scenarios pass
- Proper error messages
- JWT tokens working
- Production auth fully functional

---

## 📊 Expected Deliverables

### Code Files
```
odavl-studio/insight/cloud/app/api/auth/
├── register/
│   └── route.ts           ✅ User registration endpoint
├── login/
│   └── route.ts           ✅ User login endpoint
├── refresh/
│   └── route.ts           ✅ Token refresh endpoint
├── verify-email/
│   └── route.ts           ✅ Email verification endpoint
├── request-reset/
│   └── route.ts           ✅ Password reset request
└── reset-password/
    └── route.ts           ✅ Password reset endpoint
```

### Configuration Files
```
odavl-studio/insight/cloud/
├── .env.production        ✅ Production environment variables
├── .env.local             ✅ Local development variables
└── next.config.ts         ✅ Updated with auth middleware
```

### Documentation
```
docs/
├── PHASE_2_WEEK_7_DAY_2_COMPLETE.md    ✅ Completion report
└── API_AUTH_ENDPOINTS.md                ✅ API documentation
```

---

## 🔧 Technical Implementation Details

### API Route Pattern (Next.js 15 App Router)

**Example: Register Endpoint**
```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService, createPrismaAdapter } from '@odavl-studio/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const adapter = createPrismaAdapter(prisma);
    const authService = new AuthService(adapter);

    const result = await authService.register(input);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    }, { status: 400 });
  }
}
```

### Environment Variables
```bash
# .env.production (Railway + Vercel)
DATABASE_URL="postgresql://user:pass@region.railway.app:5432/railway"
JWT_SECRET="<generate-with-openssl-rand-hex-64>"
NEXTAUTH_URL="https://odavl.com"

# .env.local (Development)
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3001"
```

### Prisma Singleton (Prevent Connection Leaks)
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined 
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 🧪 Testing Commands

### Local Testing (Before Deployment)
```bash
# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123"}'

# Test refresh (replace TOKEN with actual refresh token)
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"TOKEN"}'
```

### Production Testing (After Deployment)
```bash
# Replace odavl.com with your actual domain
curl -X POST https://odavl.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"production@example.com","password":"SecureP@ss123"}'
```

---

## 💰 Cost Breakdown

### Day 2 Costs
```yaml
Railway PostgreSQL: $5/month
  - 512 MB RAM
  - 1 GB storage
  - Unlimited bandwidth
  - Automatic backups

Domain Registration: $12/year (~$1/month)
  - odavl.com
  - Cloudflare DNS (free)
  - SSL certificate (free via Vercel)

Vercel Hosting: $0/month (Hobby plan)
  - Unlimited bandwidth
  - Automatic deployments
  - Edge functions
  - Preview deployments

Total Monthly: $6/month
Total Annual: $72/year + $12 domain = $84/year
```

### Future Costs (Optional)
```yaml
Sentry Monitoring: $26/month
  - Error tracking
  - Performance monitoring
  - 50K events/month

Upstash Redis: $0-10/month
  - Rate limiting
  - Session caching
  - 10K requests/day free

SendGrid Email: $0-15/month
  - Email verification
  - Password resets
  - 100 emails/day free
```

---

## 🎯 Success Criteria

### Must Have (Day 2) ✅
- [ ] 6 auth API routes implemented
- [ ] Railway PostgreSQL deployed
- [ ] Prisma migrations applied
- [ ] Vercel deployment successful
- [ ] Authentication working in production
- [ ] Domain registered and connected

### Nice to Have (If Time) 🌟
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Rate limiting middleware
- [ ] Session management
- [ ] User profile endpoint

### Quality Gates 🚦
- [ ] All API routes return proper status codes
- [ ] Error messages are user-friendly
- [ ] JWT tokens validated correctly
- [ ] Database queries optimized
- [ ] Zero production errors in first 24 hours

---

## 🚨 Potential Issues & Solutions

### Issue 1: Prisma Connection Pooling
**Problem:** Serverless functions may exhaust connections  
**Solution:** Use Prisma singleton pattern + connection pooling
```typescript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Issue 2: Cold Starts on Vercel
**Problem:** First request slow due to cold start  
**Solution:** 
- Keep database connection warm
- Use edge runtime where possible
- Enable Vercel ISR (Incremental Static Regeneration)

### Issue 3: JWT Secret in Environment
**Problem:** Sensitive secret in code  
**Solution:**
- Generate with: `openssl rand -hex 64`
- Store in Vercel environment variables
- Never commit to Git

### Issue 4: CORS on API Routes
**Problem:** Frontend can't call API from different origin  
**Solution:**
```typescript
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 📈 Progress Tracking

### Task Checklist
- [ ] Task 1: Auth API Routes (2 hours)
  - [ ] register endpoint
  - [ ] login endpoint
  - [ ] refresh endpoint
  - [ ] verify-email endpoint
  - [ ] request-reset endpoint
  - [ ] reset-password endpoint
  - [ ] Local testing complete

- [ ] Task 2: Railway Setup (1 hour)
  - [ ] Account created
  - [ ] PostgreSQL deployed
  - [ ] DATABASE_URL copied
  - [ ] Connection tested

- [ ] Task 3: Production Migrations (30 min)
  - [ ] .env.production updated
  - [ ] prisma generate run
  - [ ] prisma db push completed
  - [ ] Tables verified

- [ ] Task 4: Vercel Deployment (1.5 hours)
  - [ ] Account created
  - [ ] Repository connected
  - [ ] Environment variables set
  - [ ] First deployment successful

- [ ] Task 5: Domain Setup (1 hour)
  - [ ] Domain registered
  - [ ] DNS configured
  - [ ] SSL enabled
  - [ ] https://odavl.com live

- [ ] Task 6: Production Testing (1 hour)
  - [ ] Registration tested
  - [ ] Login tested
  - [ ] Token refresh tested
  - [ ] Error cases tested

---

## 🏆 Expected Outcomes

### By End of Day 2
- ✅ ODAVL Insight Cloud dashboard live at https://odavl.com
- ✅ User registration working
- ✅ User login working
- ✅ JWT authentication functional
- ✅ PostgreSQL database in production
- ✅ Zero critical errors
- ✅ Professional domain with SSL

### Progress Update
- Overall Product: 75% → 77% (infrastructure added)
- Phase 2 Progress: 14% (Week 7 Day 2 of ~50 days)
- Ready for: User onboarding, beta signups, marketing launch

### What This Unlocks
- 🎉 First real users can sign up!
- 🎉 Production-ready authentication
- 🎉 Professional domain (odavl.com)
- 🎉 Scalable infrastructure ($6/month)
- 🎉 Ready for beta launch!

---

**Status:** Ready to implement  
**Confidence:** High  
**Blocker:** None  
**Let's ship to production!** 🚀
