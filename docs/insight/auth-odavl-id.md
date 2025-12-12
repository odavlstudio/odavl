# ODAVL ID - Unified Authentication

**Status**: ✅ Phase 3 Complete (Auth Unification)  
**Version**: 1.0.0  
**Last Updated**: December 11, 2024

## Overview

**ODAVL ID** is the unified authentication system for ODAVL Insight across all touchpoints:

- **Cloud Backend** - JWT-based API protection with session context
- **CLI** - Device code flow (browser-based OAuth)
- **VS Code Extension** - SecretStorage integration (Coming Soon)
- **SDK** - Token-based API client (Coming Soon)

Users have **ONE identity** across all products with automatic plan synchronization.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ODAVL ID Core                           │
│  packages/auth/src/odavl-id.ts                              │
│  - OdavlUserId (branded type)                               │
│  - OdavlSession (user context)                              │
│  - OdavlTokenPayload (JWT with plan info)                   │
│  - Token generation/verification                            │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌────────────────────┬────────────────────┬──────────────────┐
│   Device Code Flow │  Cloud Middleware  │   CLI Commands   │
│                    │                    │                  │
│  RFC 8628 OAuth    │  withInsightAuth() │  auth login      │
│  Browser login     │  API protection    │  auth status     │
│  Polling mechanism │  Plan enforcement  │  auth logout     │
└────────────────────┴────────────────────┴──────────────────┘
```

---

## Core Concepts

### 1. OdavlUserId (Branded Type)

```typescript
import { createOdavlUserId, type OdavlUserId } from '@odavl-studio/auth/odavl-id';

// Prevents accidental mixing of user IDs with other strings
const userId: OdavlUserId = createOdavlUserId('user_abc123');
```

**Benefits**:
- Type safety at compile time
- Prevents mixing user IDs with organization IDs
- Clear intent in function signatures

### 2. OdavlSession (Full User Context)

```typescript
interface OdavlSession {
  userId: OdavlUserId;
  email: string;
  name: string;
  role: string;
  insightPlanId: InsightPlanId; // INSIGHT_FREE/PRO/TEAM/ENTERPRISE
  organizationId?: string;       // Undefined for individual plans
  createdAt: Date;
  expiresAt?: Date;              // Token expiration
}
```

**Usage in APIs**:
```typescript
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';

export const POST = withInsightAuth(async (req) => {
  const { session } = req;
  
  console.log(`User: ${session.name}`);
  console.log(`Plan: ${session.insightPlanId}`);
  
  // Access guaranteed non-null session
  return NextResponse.json({ userId: session.userId });
});
```

### 3. InsightPlanId (Plan Identifier)

```typescript
type InsightPlanId = 
  | 'INSIGHT_FREE'       // Free tier
  | 'INSIGHT_PRO'        // Pro tier ($49/month)
  | 'INSIGHT_TEAM'       // Team tier ($199/month)
  | 'INSIGHT_ENTERPRISE'; // Enterprise tier (custom)
```

**Plan Enforcement**:
```typescript
import { withInsightPlan } from '@odavl-studio/auth/insight-middleware';

// Require Pro or higher
export const POST = withInsightPlan('INSIGHT_PRO', async (req) => {
  // Only PRO, TEAM, ENTERPRISE can reach here
  return NextResponse.json({ success: true });
});

// Allow specific plans only
export const POST = withInsightPlan(
  ['INSIGHT_TEAM', 'INSIGHT_ENTERPRISE'],
  async (req) => {
    // Only TEAM and ENTERPRISE
    return NextResponse.json({ teamFeature: true });
  }
);
```

---

## Device Code Flow (CLI Authentication)

### How It Works

```
┌─────────┐                  ┌──────────┐                 ┌────────┐
│   CLI   │                  │  Server  │                 │ Browser│
└─────────┘                  └──────────┘                 └────────┘
     │                            │                            │
     │ 1. Request device code     │                            │
     ├───────────────────────────►│                            │
     │                            │                            │
     │ 2. Return device code      │                            │
     │    + user code             │                            │
     │◄───────────────────────────┤                            │
     │                            │                            │
     │ 3. Display URL + user code │                            │
     │ 4. Open browser            │                            │
     ├────────────────────────────┼───────────────────────────►│
     │                            │                            │
     │                            │  5. User enters code       │
     │                            │    and logs in             │
     │                            │◄───────────────────────────┤
     │                            │                            │
     │ 6. Poll for token          │                            │
     ├───────────────────────────►│                            │
     │                            │                            │
     │ 7. Return access token     │                            │
     │    (after authorization)   │                            │
     │◄───────────────────────────┤                            │
     │                            │                            │
     │ 8. Save tokens locally     │                            │
     │                            │                            │
```

### CLI Commands

#### **Login**

```bash
odavl auth login

# With custom API URL
odavl auth login --api-url https://staging.odavl.com
```

**Output**:
```
🔐 ODAVL Authentication

Please complete authentication in your browser:

  URL:  https://odavl.com/device
  Code: ABCD-1234

Opening browser automatically...

⠋ Waiting for authorization... (12/120)

✅ Welcome to ODAVL!

  Name:  John Developer
  Email: john@example.com
  Plan:  INSIGHT_PRO

Your credentials have been saved locally.
Run `odavl auth status` to view your account.
```

#### **Status**

```bash
odavl auth status
```

**Output**:
```
👤 ODAVL Account Status

  Status:  ✅ Authenticated
  Name:    John Developer
  Email:   john@example.com
  Plan:    INSIGHT_PRO
  Expires: in 14 minutes
```

#### **Logout**

```bash
odavl auth logout
```

**Output**:
```
👋 ODAVL Logout

✅ You have been logged out.
Your credentials have been removed from this device.
```

---

## Cloud API Protection

### Basic Authentication

```typescript
// apps/studio-hub/app/api/insight/analysis/route.ts
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';
import { NextResponse } from 'next/server';

export const POST = withInsightAuth(async (req) => {
  const { session } = req;
  
  // Run analysis with user context
  const result = await runAnalysis({
    userId: session.userId,
    plan: session.insightPlanId,
  });
  
  return NextResponse.json(result);
});
```

### Plan-Based Access Control

```typescript
// Require Pro or higher
export const POST = withInsightPlan('INSIGHT_PRO', async (req) => {
  // Cloud analysis feature (Pro+)
  return NextResponse.json({ cloudAnalysis: true });
});
```

### Organization-Only Features

```typescript
import { withOrganization } from '@odavl-studio/auth/insight-middleware';

// Require organization membership (TEAM/ENTERPRISE)
export const POST = withOrganization(async (req) => {
  const { session } = req;
  
  console.log(`Org: ${session.organizationId}`);
  
  // Team collaboration feature
  return NextResponse.json({ teamDashboard: true });
});
```

### Optional Authentication

```typescript
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';

// Allow authenticated OR anonymous
export const GET = withInsightAuth(
  async (req) => {
    const { session } = req;
    
    if (session) {
      return NextResponse.json({ userId: session.userId });
    }
    
    return NextResponse.json({ userId: null });
  },
  { optional: true }
);
```

### Manual Session Extraction

```typescript
import { getSessionFromRequest } from '@odavl-studio/auth/insight-middleware';
import { NextRequest, NextResponse } from 'next/server';

// In middleware.ts or custom handlers
export function middleware(req: NextRequest) {
  const session = getSessionFromRequest(req);
  
  if (!session) {
    return NextResponse.redirect('/login');
  }
  
  return NextResponse.next();
}
```

---

## Token Structure

### Access Token (JWT)

```json
{
  "userId": "user_abc123",
  "email": "john@example.com",
  "name": "John Developer",
  "role": "user",
  "insightPlanId": "INSIGHT_PRO",
  "organizationId": "org_xyz789",
  "createdAt": "2024-12-11T10:30:00.000Z",
  "iat": 1702294200,
  "exp": 1702295100
}
```

**Fields**:
- `userId` - Unique user identifier
- `email` - User email (verified)
- `name` - Display name
- `role` - User role (user, admin, etc.)
- `insightPlanId` - Current Insight plan
- `organizationId` - Organization ID (undefined for individual plans)
- `createdAt` - Account creation timestamp
- `iat` - Issued at (Unix timestamp)
- `exp` - Expiration (Unix timestamp)

**Expiration**: 15 minutes (refresh tokens last 7 days)

### Token Storage

**CLI** - `~/.odavl/auth.json` (encrypted)
```json
{
  "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "userId": "user_abc123",
  "email": "john@example.com",
  "organizationId": "org_xyz789",
  "expiresAt": "2024-12-11T10:45:00.000Z"
}
```

**Browser** - HTTP-only cookie or Authorization header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## API Reference

### packages/auth/src/odavl-id.ts

#### `generateOdavlTokens(input: OdavlTokenInput): TokenPair`

Generate ODAVL ID tokens with Insight context.

**Parameters**:
```typescript
interface OdavlTokenInput {
  userId: string;
  email: string;
  name: string;
  role: string;
  insightPlanId?: InsightPlanId;
  organizationId?: string;
  createdAt: Date;
}
```

**Returns**: `{ accessToken: string, refreshToken: string }`

**Example**:
```typescript
const tokens = generateOdavlTokens({
  userId: 'user_123',
  email: 'dev@odavl.com',
  name: 'Developer',
  role: 'user',
  insightPlanId: 'INSIGHT_PRO',
  createdAt: new Date()
});
```

#### `verifyOdavlToken(token: string): OdavlSession | null`

Verify token and extract session.

**Returns**: Session object or null if invalid/expired

**Example**:
```typescript
const session = verifyOdavlToken(token);
if (session) {
  console.log(`User: ${session.name} (${session.insightPlanId})`);
}
```

#### `getInsightPlanFromSession(session: OdavlSession): InsightPlanId`

Extract plan ID with fallback to FREE.

#### `isOrganizationMember(session: OdavlSession): boolean`

Check if user belongs to organization.

#### `isTokenExpiringSoon(session: OdavlSession, bufferMinutes?: number): boolean`

Check if token should be refreshed (default 5 min buffer).

#### `serializeSession(session: OdavlSession): Record<string, any>`

Convert session to JSON-safe format for storage.

#### `deserializeSession(data: Record<string, any>): OdavlSession`

Restore session from storage.

---

## Environment Variables

### Server (Cloud APIs)

```bash
# JWT signing secrets (REQUIRED in production)
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"

# Token expiration (optional, defaults shown)
JWT_EXPIRES_IN="15m"           # Access token (15 minutes)
JWT_REFRESH_EXPIRES_IN="7d"    # Refresh token (7 days)

# API base URL for device flow (optional)
ODAVL_API_URL="https://api.odavl.com"
```

### CLI (Client)

```bash
# Override API URL (optional)
export ODAVL_API_URL="https://staging.odavl.com"

# Then login normally
odavl auth login
```

---

## Security Best Practices

### 1. Never Log Tokens

```typescript
// ❌ BAD
console.log(`Token: ${session.userId}`); // userId is fine
console.log(`Token: ${accessToken}`);    // NEVER log tokens

// ✅ GOOD
console.log(`User authenticated: ${session.email}`);
```

### 2. Use Environment Variables for Secrets

```typescript
// ❌ BAD
const JWT_SECRET = 'hardcoded-secret';

// ✅ GOOD
const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET required in production');
}
```

### 3. Verify Tokens on Every Request

```typescript
// ❌ BAD - Trust client-sent user ID
export const POST = async (req: NextRequest) => {
  const userId = req.headers.get('x-user-id'); // Client can fake this
  return NextResponse.json({ userId });
};

// ✅ GOOD - Verify token server-side
export const POST = withInsightAuth(async (req) => {
  const { session } = req; // Cryptographically verified
  return NextResponse.json({ userId: session.userId });
});
```

### 4. Short-Lived Access Tokens

- Access tokens: **15 minutes** (default)
- Refresh tokens: **7 days** (default)
- Proactive refresh when <5 minutes remaining

### 5. HTTPS Only in Production

```typescript
// Set secure cookie flags
response.cookies.set('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict',
  maxAge: 15 * 60 // 15 minutes
});
```

---

## Error Handling

### Authentication Errors

```typescript
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';

export const POST = withInsightAuth(async (req) => {
  // If this runs, authentication succeeded
  const { session } = req;
  return NextResponse.json({ success: true });
});

// Error responses (automatic):
// - 401 Unauthorized: Missing or invalid token
// - 403 Forbidden: Insufficient plan (if using withInsightPlan)
```

### Custom Error Handling

```typescript
export const POST = withInsightAuth(
  async (req) => {
    const { session } = req;
    return NextResponse.json({ userId: session.userId });
  },
  {
    onUnauthorized: (req) => {
      return NextResponse.json(
        { error: 'Custom auth error message' },
        { status: 401 }
      );
    }
  }
);
```

### CLI Error Handling

```typescript
try {
  const session = verifyOdavlToken(token);
  if (!session) {
    console.log(chalk.red('❌ Token expired'));
    console.log(chalk.gray('Run: odavl auth login\n'));
    process.exit(1);
  }
} catch (error) {
  console.error(chalk.red(`❌ Auth error: ${error.message}`));
  process.exit(1);
}
```

---

## Testing

### Unit Tests (Token Generation)

```typescript
import { generateOdavlTokens, verifyOdavlToken } from '@odavl-studio/auth/odavl-id';

describe('ODAVL ID', () => {
  it('generates and verifies tokens', () => {
    const input = {
      userId: 'test_user',
      email: 'test@odavl.com',
      name: 'Test User',
      role: 'user',
      insightPlanId: 'INSIGHT_PRO' as const,
      createdAt: new Date()
    };
    
    const { accessToken } = generateOdavlTokens(input);
    const session = verifyOdavlToken(accessToken);
    
    expect(session).not.toBeNull();
    expect(session!.email).toBe('test@odavl.com');
    expect(session!.insightPlanId).toBe('INSIGHT_PRO');
  });
});
```

### Integration Tests (API Protection)

```typescript
import { NextRequest } from 'next/server';
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';

describe('API Protection', () => {
  it('requires valid token', async () => {
    const handler = withInsightAuth(async (req) => {
      return NextResponse.json({ success: true });
    });
    
    const req = new NextRequest('https://api.odavl.com/test');
    const res = await handler(req);
    
    expect(res.status).toBe(401); // No token provided
  });
  
  it('attaches session when token valid', async () => {
    const handler = withInsightAuth(async (req) => {
      const { session } = req;
      return NextResponse.json({ userId: session.userId });
    });
    
    const token = generateTestToken();
    const req = new NextRequest('https://api.odavl.com/test', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const res = await handler(req);
    expect(res.status).toBe(200);
  });
});
```

---

## Troubleshooting

### CLI Login Fails

**Symptom**: `Device code expired` or `Authentication timed out`

**Solution**:
```bash
# Check API URL
echo $ODAVL_API_URL

# Use staging/dev API
odavl auth login --api-url https://staging.odavl.com

# Check firewall/proxy settings
curl https://api.odavl.com/health
```

### Token Expired

**Symptom**: `❌ Token expired` when running CLI commands

**Solution**:
```bash
# Login again
odavl auth login

# Or refresh token (coming soon)
odavl auth refresh
```

### API Returns 401 Unauthorized

**Symptom**: Cloud APIs return 401 even with token

**Checklist**:
1. ✅ Token in Authorization header? `Authorization: Bearer <token>`
2. ✅ Token format correct? Should be JWT (3 parts separated by dots)
3. ✅ JWT_SECRET matches on server and client?
4. ✅ Token not expired? (15 min default expiry)
5. ✅ HTTPS in production? (secure cookies require HTTPS)

**Debug**:
```typescript
// Server-side logging
export const POST = withInsightAuth(async (req) => {
  const { session } = req;
  console.log(`Authenticated: ${session.userId}`); // Should see this
  return NextResponse.json({ success: true });
});

// If this doesn't log, token verification failed
```

### Plan Enforcement Not Working

**Symptom**: Users with FREE plan can access PRO features

**Solution**:
```typescript
// ❌ BAD - No enforcement
export const POST = withInsightAuth(async (req) => {
  // Anyone authenticated can access
  return NextResponse.json({ proFeature: true });
});

// ✅ GOOD - Enforce plan
export const POST = withInsightPlan('INSIGHT_PRO', async (req) => {
  // Only PRO+ can access
  return NextResponse.json({ proFeature: true });
});
```

---

## Migration Guide

### From API Key Auth to ODAVL ID

**Before (API Key)**:
```typescript
// CLI stored plain API keys
const apiKey = await cliAuthService.getApiKey();
fetch(url, { headers: { 'X-API-Key': apiKey } });
```

**After (ODAVL ID)**:
```typescript
// CLI stores JWT tokens
const credentials = await cliAuthService.getCredentials();
const session = verifyOdavlToken(credentials.apiKey); // Verify locally

fetch(url, { 
  headers: { 'Authorization': `Bearer ${credentials.apiKey}` } 
});
```

### From NextAuth to ODAVL ID

**Before (NextAuth)**:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ...
}
```

**After (ODAVL ID)**:
```typescript
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';

export const GET = withInsightAuth(async (req) => {
  const { session } = req; // Guaranteed non-null
  // ...
});
```

---

## Roadmap

### Phase 3 (Current) ✅

- [x] ODAVL ID core types
- [x] Device code flow implementation
- [x] CLI auth commands (login, status, logout)
- [x] Cloud API middleware
- [x] Documentation

### Phase 4 (Next) 🔜

- [ ] VS Code extension auth integration
- [ ] SDK auth configuration helpers
- [ ] Token refresh flow (automatic)
- [ ] Multi-device management
- [ ] Session revocation API

### Phase 5 (Future) 📅

- [ ] SSO integration (Google Workspace, GitHub, etc.)
- [ ] 2FA/MFA support
- [ ] API key generation (for programmatic access)
- [ ] Audit logging (login attempts, token usage)
- [ ] Rate limiting per user/plan

---

## Support

**Questions?** Open an issue: [github.com/Monawlo812/odavl/issues](https://github.com/Monawlo812/odavl/issues)

**Bug Reports**: Tag with `auth` and `ODAVL ID`

**Security Issues**: Email security@odavl.com (do NOT open public issues)

---

**Last Updated**: December 11, 2024  
**Version**: 1.0.0  
**Branch**: `odavl/insight-global-launch-20251211`
