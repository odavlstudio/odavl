# ODAVL Insight Cloud - Minimal Real Backend (ZCC Compliant)

**Status**: Production-Ready Minimal Backend  
**Philosophy**: Zero Code Cloud (ZCC) - Metadata Only, No Source Code  
**Purpose**: Enable Insight CLI/Extension to store analysis metadata while respecting privacy

---

## 🎯 What This Cloud Backend DOES

✅ **Authenticates users** via GitHub or Google OAuth (NextAuth)  
✅ **Accepts analysis metadata** from Insight CLI/Extension  
✅ **Stores snapshots** in PostgreSQL (counts, scores, timings only)  
✅ **Generates fingerprints** (SHA-256 hashes, non-reversible)  
✅ **Enforces ZCC compliance** (rejects any source code in requests)

---

## 🚫 What This Cloud Backend DOES NOT DO

❌ NO dashboards or visualizations  
❌ NO billing or subscription management  
❌ NO teams or collaboration features  
❌ NO analytics UI or charts  
❌ NO source code storage (ZCC enforced at API level)  
❌ NO file paths or error messages stored  
❌ NO code snippets or suggestions saved

**This is a minimal, privacy-first backend for metadata collection only.**

---

## 📊 Data Model (Prisma Schema)

### 1. NextAuth Models
- `User` - GitHub/Google OAuth users
- `Account` - OAuth provider accounts
- `Session` - JWT sessions
- `VerificationToken` - Email verification

### 2. Project Identity
- `Project`
  - `name`: Project name
  - `repoHash`: SHA-256 of git remote URL (optional)
  - `userId`: Owner

### 3. Insight Snapshot (ZCC Compliant)
- `InsightSnapshot`
  - **Counts**: `totalFiles`, `filesAnalyzed`, `totalIssues`, severity counts
  - **Risk Score**: 0-100 calculated score
  - **Detector Metadata**: Names only (e.g., `["typescript", "security"]`)
  - **Timing**: `analysisTimeMs`
  - **Fingerprints**: `detectorHash`, `envHash` (SHA-256 hashes)
  - **NO code**, **NO paths**, **NO error messages**

---

## 🔐 Authentication Flow

### 1. User Signs In
```bash
# User visits: https://your-app.vercel.app/api/auth/signin
# Selects GitHub or Google
# OAuth flow completes
# User is authenticated, session stored
```

### 2. CLI/Extension Uses Session
```typescript
// CLI sends authenticated request
POST /api/insight/snapshot
Headers:
  Cookie: next-auth.session-token=<jwt>
  Content-Type: application/json

Body: { /* metadata only */ }
```

---

## 🛡️ ZCC (Zero Code Cloud) Enforcement

### API Validation Layer

The `/api/insight/snapshot` endpoint actively rejects:

1. **Forbidden Field Names**: `code`, `snippet`, `source`, `content`, `file`, `path`, `line`, `column`, `message`, `description`, `details`, `issues`, `errors`, `warnings`, `suggestions`, `fixes`

2. **Suspicious String Lengths**: Strings > 200 characters (likely code)

3. **Nested Objects**: Recursive scan for violations

**Example Rejection**:
```json
{
  "error": "ZCC Violation: Source code detected",
  "violations": [
    "Forbidden field: issues.code",
    "Suspiciously long string in field: details.message"
  ],
  "message": "This endpoint only accepts metadata..."
}
```

---

## 📡 API Endpoints

### `POST /api/insight/snapshot`

**Purpose**: Store analysis metadata (ZCC compliant)

**Authentication**: Required (NextAuth session)

**Request Schema**:
```typescript
{
  projectName: string;        // "my-app"
  repoUrl?: string;           // "https://github.com/user/repo" (optional)
  
  // Counts Only
  totalFiles: number;         // 127
  filesAnalyzed: number;      // 23 (rest cached)
  totalIssues: number;        // 42
  criticalCount: number;      // 5
  highCount: number;          // 12
  mediumCount: number;        // 15
  lowCount: number;           // 8
  infoCount: number;          // 2
  
  // Risk Score
  riskScore: number;          // 0-100 (e.g., 67.5)
  
  // Detector Metadata (names only)
  detectorsUsed: string[];    // ["typescript", "security", "performance"]
  
  // Timing
  analysisTimeMs: number;     // 2341
  
  // Environment Fingerprint
  environment: {
    os: string;               // "win32"
    nodeVersion: string;      // "20.11.0"
    cliVersion: string;       // "2.0.0"
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "snapshotId": "cm7x8y9z0...",
  "projectId": "cm7x8y9z1...",
  "message": "Snapshot stored successfully (ZCC compliant)"
}
```

**Response** (ZCC Violation):
```json
{
  "error": "ZCC Violation: Source code detected",
  "violations": ["Forbidden field: code"],
  "message": "This endpoint only accepts metadata..."
}
```

---

## 🚀 Deployment (Vercel)

### 1. Prerequisites
- Vercel account
- GitHub OAuth app (https://github.com/settings/developers)
- Google OAuth app (https://console.cloud.google.com)
- PostgreSQL database (Vercel Postgres or external)

### 2. Setup Steps

#### A. Create OAuth Apps

**GitHub**:
1. Go to https://github.com/settings/developers
2. New OAuth App
3. **Callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
4. Copy `Client ID` and `Client Secret`

**Google**:
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 Client
3. **Redirect URI**: `https://your-app.vercel.app/api/auth/callback/google`
4. Copy `Client ID` and `Client Secret`

#### B. Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to cloud app
cd odavl-studio/insight/cloud

# 3. Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set environment variables (see below)
```

#### C. Set Environment Variables (Vercel Dashboard)

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# GitHub OAuth
GITHUB_ID=<your_github_client_id>
GITHUB_SECRET=<your_github_client_secret>

# Google OAuth
GOOGLE_ID=<your_google_client_id>
GOOGLE_SECRET=<your_google_client_secret>
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

#### D. Run Database Migration

```bash
# From Vercel CLI
vercel env pull .env.local
pnpm prisma db push
```

#### E. Test Deployment

```bash
# Visit your app
https://your-app.vercel.app

# Test auth
https://your-app.vercel.app/api/auth/signin

# Test snapshot API (requires auth)
curl -X POST https://your-app.vercel.app/api/insight/snapshot \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<jwt>" \
  -d '{"projectName": "test", ...}'
```

---

## 🔌 How Insight CLI/Extension Connects

### CLI Upload Flow

```typescript
// 1. User authenticates (one-time)
$ odavl auth login
// Opens browser → OAuth flow → Stores session token

// 2. Run analysis with cloud upload
$ odavl insight analyze --cloud

// 3. CLI sends metadata to cloud
POST https://your-app.vercel.app/api/insight/snapshot
Headers: {
  Cookie: next-auth.session-token=<from-keychain>,
  Content-Type: application/json
}
Body: {
  projectName: "my-app",
  totalFiles: 127,
  filesAnalyzed: 23,
  totalIssues: 42,
  // ... metadata only
}

// 4. Cloud stores snapshot
// Returns: { success: true, snapshotId: "..." }
```

### VS Code Extension Integration

```typescript
// Extension auto-uploads after local analysis
// Uses VS Code SecretStorage for session token
// Same API endpoint, same validation
```

---

## 🧪 Local Development

### 1. Setup Database

```bash
# Use Docker or local PostgreSQL
docker run -d \
  --name odavl-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=odavl_insight \
  -p 5432:5432 \
  postgres:16

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_insight"
```

### 2. Install Dependencies

```bash
cd odavl-studio/insight/cloud
pnpm install
```

### 3. Setup OAuth Apps (localhost)

**GitHub**:
- Callback URL: `http://localhost:3000/api/auth/callback/github`

**Google**:
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

### 4. Configure Environment

```bash
# Copy example
cp .env.minimal.example .env.local

# Edit .env.local with your values
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=<generate>
# GITHUB_ID=<your_id>
# GITHUB_SECRET=<your_secret>
# GOOGLE_ID=<your_id>
# GOOGLE_SECRET=<your_secret>
```

### 5. Run Database Migration

```bash
pnpm prisma db push
```

### 6. Start Development Server

```bash
pnpm dev
# App runs at http://localhost:3000
```

### 7. Test API

```bash
# 1. Sign in via browser
open http://localhost:3000/api/auth/signin

# 2. Get session cookie from browser DevTools

# 3. Test snapshot API
curl -X POST http://localhost:3000/api/insight/snapshot \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-cookie>" \
  -d '{
    "projectName": "test-project",
    "totalFiles": 100,
    "filesAnalyzed": 50,
    "totalIssues": 25,
    "criticalCount": 5,
    "highCount": 10,
    "mediumCount": 7,
    "lowCount": 3,
    "infoCount": 0,
    "riskScore": 45.5,
    "detectorsUsed": ["typescript", "security"],
    "analysisTimeMs": 2000,
    "environment": {
      "os": "darwin",
      "nodeVersion": "20.11.0",
      "cliVersion": "2.0.0"
    }
  }'
```

---

## 📝 Database Schema Details

### Prisma Models

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  name          String?
  projects      Project[]
  snapshots     InsightSnapshot[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  repoHash  String?  @unique // SHA-256 of git remote URL
  userId    String
  snapshots InsightSnapshot[]
}

model InsightSnapshot {
  id             String   @id @default(cuid())
  projectId      String
  totalFiles     Int
  totalIssues    Int
  riskScore      Float    // 0-100
  detectorsUsed  String   // JSON array
  detectorHash   String   // SHA-256
  envHash        String   // SHA-256
  createdAt      DateTime @default(now())
}
```

---

## ✅ Verification Checklist

- [x] Prisma schema (minimal, ZCC compliant)
- [x] NextAuth setup (GitHub + Google)
- [x] API route (`POST /api/insight/snapshot`)
- [x] ZCC validation (rejects source code)
- [x] Environment variables documented
- [x] Vercel deployment instructions
- [x] Local development guide
- [x] Privacy-first data model
- [x] Session management (JWT)
- [x] PostgreSQL compatibility

---

## 🔍 What's Next (NOT in this phase)

- Dashboard UI (charts, trends, project history)
- Billing/subscriptions (Stripe integration)
- Teams/collaboration (sharing, permissions)
- Advanced analytics (ML insights, recommendations)
- Webhooks/integrations (GitHub, Slack, etc.)

**This minimal backend establishes the foundation. Future phases build on top.**

---

## 🛠️ Troubleshooting

### Issue: "Unauthorized" error
**Fix**: Ensure session cookie is sent with request. Use browser DevTools → Application → Cookies to inspect `next-auth.session-token`.

### Issue: Database connection error
**Fix**: Check `DATABASE_URL` in `.env.local`. Ensure PostgreSQL is running.

### Issue: OAuth redirect mismatch
**Fix**: Update callback URLs in GitHub/Google OAuth apps to match your deployment URL.

### Issue: ZCC violation error
**Fix**: Remove any fields containing code, paths, or error details from request body. Only send metadata (counts, scores, timings).

---

## 📖 Architecture Decision Records

**Why NextAuth?**
- Industry standard for Next.js authentication
- Built-in OAuth providers (GitHub, Google)
- Secure JWT session management
- Prisma adapter for database integration

**Why PostgreSQL?**
- Robust, production-ready relational database
- Free tier on Vercel Postgres
- Complex queries support (future phases)
- ACID compliance for data integrity

**Why ZCC (Zero Code Cloud)?**
- Respects user privacy (no source code leaves machine)
- Reduces storage costs (metadata << code)
- Simplifies compliance (GDPR, data residency)
- Enables global learning without privacy concerns

---

**Last Updated**: December 13, 2025  
**Status**: Production-Ready ✅
