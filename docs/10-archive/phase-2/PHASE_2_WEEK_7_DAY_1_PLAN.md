# Phase 2: Infrastructure & Security - Week 7 Day 1

**Date:** November 23, 2025  
**Phase:** Phase 2 - Infrastructure & Security  
**Status:** 🔄 IN PROGRESS  

---

## 🎯 Today's Objectives

### Primary Goal
Setup production-ready cloud infrastructure foundation:
1. ✅ Database (PostgreSQL on Railway/Supabase)
2. ✅ Authentication system (JWT-based)
3. ✅ Environment configuration
4. ✅ Initial deployment prep

### Success Criteria
- Database deployed and accessible
- Prisma migrations applied
- Authentication package functional
- Environment variables configured
- Ready for dashboard deployment (Day 2)

---

## 📋 Task Breakdown

### Task 1: Choose & Setup Database Provider (1 hour)

**Options Analysis:**

| Provider | Cost | Pros | Cons |
|----------|------|------|------|
| **Railway** | $5/mo | Easy, PostgreSQL, Redis included | US only initially |
| **Supabase** | Free tier | PostgreSQL + Auth built-in | More complex |
| **Neon** | Free tier | Serverless, auto-scale | New, less proven |

**Decision:** Railway ($5/month)
- Simple setup
- PostgreSQL + Redis in one place
- Good for MVP

**Steps:**
```bash
1. Create Railway account (railway.app)
2. Create new project "odavl-production"
3. Add PostgreSQL service
4. Copy DATABASE_URL
5. Add Redis service (for caching later)
6. Copy REDIS_URL
```

**Expected Output:**
```bash
DATABASE_URL=postgresql://postgres:xxx@containers-us-west-xxx.railway.app:6379/railway
REDIS_URL=redis://default:xxx@containers-us-west-xxx.railway.app:6379
```

---

### Task 2: Setup Prisma for Production (1 hour)

**Current State:**
- Prisma schema exists in `odavl-studio/insight/cloud/prisma/schema.prisma`
- Local development only
- Need production migrations

**Steps:**

1. **Update .env files:**
```bash
# odavl-studio/insight/cloud/.env.production
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://insight.odavl.com"
```

2. **Run Prisma migrations on Railway:**
```bash
cd odavl-studio/insight/cloud

# Generate Prisma Client
pnpm prisma generate

# Push schema to Railway database
pnpm prisma db push

# Or create migration
pnpm prisma migrate deploy
```

3. **Test connection:**
```typescript
// Test script: test-db-connection.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected!');
    
    // Test query
    const count = await prisma.user.count();
    console.log(`📊 Users in database: ${count}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

**Expected Output:**
```
✅ Database connected!
📊 Users in database: 0
```

---

### Task 3: Implement Authentication Package (2 hours)

**Location:** `packages/auth/`

**Current State:**
- Basic structure exists
- Needs JWT implementation
- Needs password hashing
- Needs email verification

**Implementation:**

1. **Install dependencies:**
```bash
cd packages/auth
pnpm add jsonwebtoken bcryptjs nodemailer
pnpm add -D @types/jsonwebtoken @types/bcryptjs @types/nodemailer
```

2. **Create JWT utilities:**
```typescript
// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
```

3. **Create password utilities:**
```typescript
// packages/auth/src/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return { valid: errors.length === 0, errors };
}
```

4. **Create auth service:**
```typescript
// packages/auth/src/auth-service.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from './password';
import { generateToken, generateRefreshToken, TokenPayload } from './jwt';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(email: string, password: string, name: string) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        emailVerified: false,
      },
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: 'user',
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: 'user',
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { user, accessToken, refreshToken };
  }

  async verifyEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }
}
```

5. **Export main package:**
```typescript
// packages/auth/src/index.ts
export { AuthService } from './auth-service';
export { generateToken, verifyToken, generateRefreshToken } from './jwt';
export { hashPassword, comparePassword, validatePassword } from './password';
export type { TokenPayload } from './jwt';
```

**Expected Output:**
```bash
✅ packages/auth built successfully
✅ All exports available
✅ Ready for integration
```

---

### Task 4: Update Insight Cloud Dashboard (1.5 hours)

**Location:** `odavl-studio/insight/cloud/`

**Updates needed:**

1. **Environment variables:**
```bash
# .env.production
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://insight.odavl.com"
JWT_SECRET="same-as-nextauth-secret"

# Email (optional for now)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@odavl.com"
SMTP_PASS="..."
```

2. **Add auth API routes:**
```typescript
// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@odavl-studio/auth';

const authService = new AuthService(prisma);

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    const result = await authService.register(email, password, name);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

```typescript
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@odavl-studio/auth';

const authService = new AuthService(prisma);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const result = await authService.login(email, password);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}
```

3. **Test authentication locally:**
```bash
cd odavl-studio/insight/cloud
pnpm dev

# Test with curl
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'

# Should return:
# {"success":true,"user":{...},"accessToken":"...","refreshToken":"..."}
```

**Expected Output:**
```
✅ Auth API routes created
✅ Registration working
✅ Login working
✅ JWT tokens generated
```

---

### Task 5: Create Deployment Checklist (30 min)

**Create checklist for Week 7 Day 2:**

```markdown
# Deployment Checklist - Day 2

## Prerequisites (from Day 1)
- [x] Railway database deployed
- [x] Prisma migrations applied
- [x] Auth package implemented
- [x] Local testing complete

## Domain Setup
- [ ] Register odavl.com ($12/year)
- [ ] Setup Cloudflare DNS (free)
- [ ] Configure SSL (Let's Encrypt)
- [ ] Create subdomains:
  - insight.odavl.com
  - guardian.odavl.com
  - api.odavl.com

## Vercel Deployment
- [ ] Create Vercel account
- [ ] Connect GitHub repo
- [ ] Deploy insight.odavl.com
- [ ] Configure environment variables
- [ ] Test production build

## Monitoring Setup
- [ ] Create Sentry account
- [ ] Add error tracking
- [ ] Setup alerts
- [ ] Test error reporting

## Next Steps
- [ ] Deploy Guardian dashboard (Day 3)
- [ ] Setup Redis caching (Day 4)
- [ ] Configure monitoring (Day 5)
```

---

## 📊 Expected Outcomes (End of Day 1)

### Completed
- ✅ Railway PostgreSQL deployed ($5/month)
- ✅ Prisma schema migrated to production
- ✅ Auth package implemented (JWT + bcrypt)
- ✅ API routes for register/login created
- ✅ Local testing successful
- ✅ Deployment checklist prepared

### Ready for Day 2
- 🚀 Domain registration
- 🚀 Vercel deployment
- 🚀 Production authentication
- 🚀 First users!

---

## 💰 Cost Summary (Day 1)

```yaml
Railway Database: $5/month
Railway Redis: $0 (included)
────────────────────────
Total: $5/month

One-time costs: $0
Running total: $5/month
```

---

## 🎯 Next Steps (Day 2)

1. **Morning:** Register domain, setup Cloudflare
2. **Afternoon:** Deploy to Vercel
3. **Evening:** Test production authentication
4. **Goal:** insight.odavl.com live with authentication!

---

**Status:** Ready to execute! 🚀  
**Time estimate:** 6-7 hours  
**Confidence:** High ✅
