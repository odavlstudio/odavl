# Phase 2 Week 8: API Security & Rate Limiting

**Duration:** November 24-30, 2025 (4-5 days)  
**Status:** 🔄 IN PROGRESS (Day 1)  
**Goal:** Production-grade API security and protection

---

## 📋 Overview

Week 8 focuses on hardening the API layer with:
- Input validation and sanitization
- Security headers (CORS, CSP, Helmet)
- Rate limiting and throttling
- API documentation (OpenAPI/Swagger)
- Request/response logging
- Error handling standardization

---

## 🎯 Tasks Breakdown

### Day 1: Input Validation with Zod (5 hours)

**Goal:** Validate all API inputs to prevent injection attacks

#### Task 1.1: Install Dependencies (30 min)
```bash
cd odavl-studio/insight/cloud
pnpm add zod
pnpm add -D @types/node
```

#### Task 1.2: Create Validation Schemas (2 hours)
Create `lib/validation/schemas.ts`:

```typescript
import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase(),
  password: z.string().min(1, 'Password required'),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'Invalid token'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Uppercase required')
    .regex(/[a-z]/, 'Lowercase required')
    .regex(/[0-9]/, 'Number required')
    .regex(/[^A-Za-z0-9]/, 'Special character required'),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(50, 'Project name too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Only alphanumeric, dash, underscore'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  language: z.enum(['typescript', 'python', 'java']),
  repository: z.string().url('Invalid repository URL').optional(),
});

// Analysis schemas
export const analyzeSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  detectors: z.array(z.string()).optional(),
  files: z.array(z.string()).optional(),
});
```

#### Task 1.3: Create Validation Middleware (1 hour)
Create `lib/validation/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export function validateRequest<T extends z.ZodType>(schema: T) {
  return async (
    req: NextRequest,
    handler: (data: z.infer<T>) => Promise<NextResponse>
  ) => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);
      return handler(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
}

// Query parameter validation
export function validateQuery<T extends z.ZodType>(schema: T, searchParams: URLSearchParams) {
  try {
    const params = Object.fromEntries(searchParams.entries());
    return { success: true, data: schema.parse(params) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}
```

#### Task 1.4: Update Auth Routes with Validation (1.5 hours)

Update `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, etc.

**Success Criteria:**
- ✅ All API routes validate input with Zod
- ✅ Clear validation error messages
- ✅ Email normalized to lowercase
- ✅ Password strength enforced
- ✅ SQL injection prevented (no raw queries)
- ✅ XSS prevented (input sanitization)

---

### Day 2: Security Headers & CORS (4 hours)

**Goal:** Implement security best practices for headers

#### Task 2.1: Install Helmet (15 min)
```bash
pnpm add helmet
pnpm add -D @types/helmet
```

#### Task 2.2: Create Security Middleware (2 hours)
Create `middleware.ts` at root of insight/cloud:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.odavl.com; " +
    "frame-ancestors 'none';"
  );
  
  // CORS headers (for API routes only)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://odavl.com',
      'https://www.odavl.com',
      'https://app.odavl.com',
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );
    }
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### Task 2.3: Environment-Based CORS (1 hour)
Create `lib/security/cors.ts`:

```typescript
export const getCorsOrigins = () => {
  const env = process.env.NODE_ENV;
  
  if (env === 'development') {
    return ['http://localhost:3001', 'http://localhost:3000'];
  }
  
  if (env === 'production') {
    return [
      'https://odavl.com',
      'https://www.odavl.com',
      'https://app.odavl.com',
    ];
  }
  
  return ['http://localhost:3001'];
};

export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  return getCorsOrigins().includes(origin);
};
```

#### Task 2.4: Add Security Tests (45 min)
Create `tests/security/headers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Security Headers', () => {
  it('should set HSTS header', async () => {
    const response = await fetch('http://localhost:3001');
    expect(response.headers.get('strict-transport-security')).toBeTruthy();
  });
  
  it('should set X-Frame-Options to DENY', async () => {
    const response = await fetch('http://localhost:3001');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });
  
  it('should set CSP header', async () => {
    const response = await fetch('http://localhost:3001');
    expect(response.headers.get('content-security-policy')).toBeTruthy();
  });
});
```

**Success Criteria:**
- ✅ All security headers set correctly
- ✅ CORS only allows whitelisted origins
- ✅ CSP prevents XSS attacks
- ✅ No clickjacking vulnerability
- ✅ HTTPS enforced in production

---

### Day 3: Rate Limiting (4 hours)

**Goal:** Prevent abuse with rate limiting

#### Task 3.1: Install Dependencies (15 min)
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

#### Task 3.2: Setup Redis (30 min)
1. Create account on Upstash.com (free tier)
2. Create Redis database
3. Add to `.env.local`:
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

#### Task 3.3: Create Rate Limiter (2 hours)
Create `lib/rate-limit/index.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limiters for different endpoints
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
  prefix: 'auth',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'api',
});

export const analysisLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 analyses per hour
  analytics: true,
  prefix: 'analysis',
});

// Helper to get client identifier (IP or user ID)
export function getIdentifier(request: Request): string {
  // Try to get user ID from token
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT (implement based on your auth)
    return 'user-123'; // Replace with actual user ID extraction
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  return ip;
}

// Middleware wrapper
export async function withRateLimit(
  request: Request,
  limiter: Ratelimit,
  handler: () => Promise<Response>
): Promise<Response> {
  const identifier = getIdentifier(request);
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  const response = await handler();
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
  
  return response;
}
```

#### Task 3.4: Apply Rate Limiting (1 hour)
Update auth routes to use rate limiting:

```typescript
// app/api/auth/login/route.ts
import { withRateLimit, authLimiter } from '@/lib/rate-limit';

export async function POST(request: Request) {
  return withRateLimit(request, authLimiter, async () => {
    // Existing login logic
    // ...
  });
}
```

#### Task 3.5: Rate Limit Dashboard (15 min)
Add rate limit info to error responses and logs

**Success Criteria:**
- ✅ Auth endpoints: 5 requests per 15 minutes
- ✅ API endpoints: 100 requests per minute
- ✅ Analysis endpoints: 10 per hour
- ✅ Rate limit headers in responses
- ✅ Graceful 429 errors with retry info
- ✅ Redis analytics enabled

---

### Day 4: API Documentation (3 hours)

**Goal:** Generate OpenAPI/Swagger documentation

#### Task 4.1: Install Swagger UI (30 min)
```bash
pnpm add swagger-ui-react swagger-jsdoc
pnpm add -D @types/swagger-ui-react @types/swagger-jsdoc
```

#### Task 4.2: Create OpenAPI Spec (1.5 hours)
Create `lib/swagger/spec.ts`:

```typescript
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ODAVL Studio API',
    version: '1.0.0',
    description: 'API for ODAVL Studio - Autonomous Code Quality Platform',
    contact: {
      email: 'support@odavl.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://app.odavl.com',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string', minLength: 2 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                    tokens: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error' },
          429: { description: 'Too many requests' },
        },
      },
    },
    // Add more endpoints...
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
```

#### Task 4.3: Create Swagger UI Page (45 min)
Create `app/api/docs/page.tsx`:

```typescript
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { openApiSpec } from '@/lib/swagger/spec';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={openApiSpec} />
    </div>
  );
}
```

#### Task 4.4: Add JSDoc Comments (15 min)
Add documentation comments to route handlers

**Success Criteria:**
- ✅ Complete OpenAPI 3.0 spec
- ✅ All endpoints documented
- ✅ Request/response examples
- ✅ Authentication flows documented
- ✅ Interactive Swagger UI at /api/docs
- ✅ Error codes documented

---

## 📊 Week 8 Metrics

### Security Improvements
- Input validation: 100% of endpoints
- Rate limiting: Auth, API, Analysis
- Security headers: 12+ headers
- CORS: Whitelist-based
- API documentation: Complete

### Performance Targets
- Validation overhead: <5ms per request
- Rate limit check: <10ms per request
- Redis latency: <50ms (Upstash edge)

### Code Metrics
- New files: ~15
- Lines of code: ~1,500
- Tests: 20+ security tests
- Dependencies: 5 new packages

---

## ✅ Success Criteria

### Must Have
- ✅ All inputs validated with Zod
- ✅ Security headers implemented
- ✅ Rate limiting on critical endpoints
- ✅ CORS properly configured
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities

### Should Have
- ✅ OpenAPI documentation complete
- ✅ Rate limit analytics enabled
- ✅ Security tests passing
- ✅ Environment-based configuration

### Nice to Have
- ✅ Swagger UI with try-it-out
- ✅ Rate limit dashboard
- ✅ Security audit report
- ✅ Penetration test results

---

## 📝 Testing Plan

### Security Testing
```bash
# SQL injection test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"'; DROP TABLE users;--"}'
# Should return validation error, not execute SQL

# XSS test
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!","name":"<script>alert(1)</script>"}'
# Should sanitize and reject

# Rate limit test
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should return 429 after 5 attempts

# CORS test
curl -H "Origin: http://evil.com" http://localhost:3001/api/auth/login
# Should not have CORS headers
```

### Performance Testing
```bash
# Measure validation overhead
ab -n 1000 -c 10 http://localhost:3001/api/health

# Measure rate limit overhead
ab -n 100 -c 5 http://localhost:3001/api/projects
```

---

## 💰 Cost Estimate

### Services
- Upstash Redis (free tier): $0/month (10K requests/day)
- If scaling needed: $10-20/month

### Time Investment
- Day 1: 5 hours (validation)
- Day 2: 4 hours (headers)
- Day 3: 4 hours (rate limiting)
- Day 4: 3 hours (documentation)
- **Total: 16 hours over 4 days**

---

## 🚀 Next Steps After Week 8

### Week 9: Monitoring & Logging
- Sentry error tracking
- LogRocket session replay
- CloudWatch/DataDog metrics
- Custom analytics dashboard

### Week 10: Team Management
- Multi-user support
- Team invitations
- Role-based access control
- Team analytics

---

## 📚 Resources

### Documentation
- [Zod Documentation](https://zod.dev/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)
- [OpenAPI 3.0 Spec](https://swagger.io/specification/)

### Security Best Practices
- Always validate input on server-side
- Never trust client data
- Use parameterized queries (Prisma does this)
- Sanitize output to prevent XSS
- Rate limit authentication endpoints
- Log security events
- Regular security audits

---

**Ready to start Week 8!** 🚀
