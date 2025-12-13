# TASK 9: Go Live - Deployment Guide

> **Internal Beta Launch**  
> **Date:** December 13, 2025

## Pre-Deployment Checklist

### ✅ Prerequisites
- [x] Vercel account created
- [x] Vercel CLI installed (`npm install -g vercel`)
- [ ] GitHub OAuth app created
- [ ] Google OAuth client created
- [ ] PostgreSQL database ready (Vercel Postgres or external)

---

## Step 1: Create OAuth Applications

### GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   ```
   Application name: ODAVL Insight Cloud (Beta)
   Homepage URL: https://odavl-insight.vercel.app
   Authorization callback URL: https://odavl-insight.vercel.app/api/auth/callback/github
   ```
4. Click "Register application"
5. Generate client secret
6. **Save:**
   - Client ID: `<GITHUB_ID>`
   - Client Secret: `<GITHUB_SECRET>`

### Google OAuth Client

1. Go to: https://console.cloud.google.com/
2. Create new project: "ODAVL Insight Cloud"
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Fill in details:
   ```
   Name: ODAVL Insight Cloud (Beta)
   Authorized JavaScript origins: https://odavl-insight.vercel.app
   Authorized redirect URIs: https://odavl-insight.vercel.app/api/auth/callback/google
   ```
7. **Save:**
   - Client ID: `<GOOGLE_ID>`
   - Client Secret: `<GOOGLE_SECRET>`

---

## Step 2: Deploy to Vercel

### 2.1 Initialize Vercel Project

```bash
cd odavl-studio/insight/cloud

# Login to Vercel (if not already)
vercel login

# Deploy (will prompt for configuration)
vercel
```

**Prompts:**
```
? Set up and deploy "~/odavl-studio/insight/cloud"? [Y/n] Y
? Which scope? <your-vercel-account>
? Link to existing project? [y/N] N
? What's your project's name? odavl-insight-cloud
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

**Wait for deployment...**

**Output:**
```
✅ Deployed to production. Run `vercel --prod` to overwrite later.
🔗 https://odavl-insight-cloud-<hash>.vercel.app
```

### 2.2 Save Deployment URL

```bash
# Note the deployed URL
CLOUD_URL="https://odavl-insight-cloud-<hash>.vercel.app"
```

---

## Step 3: Configure Environment Variables

### 3.1 Add Variables to Vercel

```bash
# Navigate to project
cd odavl-studio/insight/cloud

# Add environment variables
vercel env add DATABASE_URL
# Paste PostgreSQL connection string:
# postgresql://user:password@host:5432/dbname?sslmode=require

vercel env add NEXTAUTH_URL
# Paste: https://odavl-insight-cloud-<hash>.vercel.app

vercel env add NEXTAUTH_SECRET
# Generate: openssl rand -base64 32
# Paste the output

vercel env add GITHUB_ID
# Paste GitHub OAuth Client ID

vercel env add GITHUB_SECRET
# Paste GitHub OAuth Client Secret

vercel env add GOOGLE_ID
# Paste Google OAuth Client ID

vercel env add GOOGLE_SECRET
# Paste Google OAuth Client Secret
```

### 3.2 Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Step 4: Database Setup

### 4.1 Run Prisma Migration

```bash
# From cloud directory
cd odavl-studio/insight/cloud

# Generate Prisma Client
npx prisma generate

# Push schema to database
DATABASE_URL="<your-postgres-url>" npx prisma db push

# Verify tables created
DATABASE_URL="<your-postgres-url>" npx prisma studio
# Opens browser - check tables exist
```

**Expected Tables:**
- Account
- Session
- User
- VerificationToken
- Project
- InsightSnapshot

---

## Step 5: Update CLI with Live URL

### 5.1 Update Cloud URL in CLI

```bash
# Open file
code apps/studio-cli/src/commands/insight-auth.ts
```

Find line:
```typescript
const DEFAULT_CLOUD_URL = process.env.ODAVL_CLOUD_URL || 'https://your-app.vercel.app';
```

Replace with:
```typescript
const DEFAULT_CLOUD_URL = process.env.ODAVL_CLOUD_URL || 'https://odavl-insight-cloud-<hash>.vercel.app';
```

### 5.2 Update Snapshot Uploader

```bash
# Open file
code apps/studio-cli/src/utils/snapshot-uploader.ts
```

Find line:
```typescript
const DEFAULT_CLOUD_URL = 'https://your-app.vercel.app';
```

Replace with:
```typescript
const DEFAULT_CLOUD_URL = 'https://odavl-insight-cloud-<hash>.vercel.app';
```

### 5.3 Rebuild CLI

```bash
cd apps/studio-cli
pnpm build
```

---

## Step 6: End-to-End Testing

### 6.1 Test Authentication

```bash
# Sign in
odavl insight auth login

# Expected: Browser opens, redirects to GitHub/Google, shows success
# Terminal shows: "✓ Welcome to Insight Cloud"
```

**Verify:**
- [ ] Browser opens to cloud URL
- [ ] GitHub/Google sign-in works
- [ ] Callback redirects to localhost:23457
- [ ] Token saved to keychain (check with: odavl insight auth status)

### 6.2 Test Consent Prompt

```bash
# First upload (should show consent)
odavl insight analyze --upload

# Expected: Consent prompt appears
```

**Verify:**
- [ ] Consent prompt displays
- [ ] ZCC explanation shown
- [ ] Opt-out options listed
- [ ] User can accept (y) or decline (N)

### 6.3 Test Snapshot Upload

```bash
# Upload with debug
odavl insight analyze --upload --debug

# Expected: 
# - No consent prompt (already consented)
# - Upload succeeds
# - Shows snapshot ID
```

**Verify:**
- [ ] Analysis runs successfully
- [ ] Upload succeeds (no errors)
- [ ] Snapshot ID returned
- [ ] Silent by default (no noise)

### 6.4 Verify Snapshot in Database

```bash
# Open Prisma Studio
DATABASE_URL="<your-postgres-url>" npx prisma studio

# Navigate to InsightSnapshot table
# Check for new record with:
# - Correct counts
# - NO source code fields
# - Correct timestamps
```

**Verify:**
- [ ] Snapshot exists in database
- [ ] User ID matches authenticated user
- [ ] Project ID created/linked
- [ ] Counts are correct
- [ ] No forbidden fields present

### 6.5 Test ZCC Enforcement

```bash
# Try to manually send invalid payload (with curl)
curl -X POST https://odavl-insight-cloud-<hash>.vercel.app/api/insight/snapshot \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -d '{
    "projectName": "test",
    "totalFiles": 10,
    "filePath": "/src/index.ts",
    "criticalCount": 2
  }'

# Expected: 400 Bad Request
# Response: { "error": "ZCC Violation", "violations": ["Forbidden field: filePath"] }
```

**Verify:**
- [ ] Invalid payloads rejected (400)
- [ ] ZCC violations listed
- [ ] Clear error message

### 6.6 Test Logout

```bash
# Sign out
odavl insight auth logout

# Expected: "✓ Signed out successfully"
```

**Verify:**
- [ ] Token deleted from keychain
- [ ] Consent revoked
- [ ] Subsequent uploads fail with auth error

---

## Step 7: Beta Readiness Validation

### Checklist

- [ ] **Auth Flow**
  - [ ] Login works (browser OAuth)
  - [ ] Status shows authenticated user
  - [ ] Logout clears credentials
  - [ ] Token expiration handled

- [ ] **Consent Flow**
  - [ ] First upload shows consent prompt
  - [ ] User can accept/decline
  - [ ] Subsequent uploads skip prompt
  - [ ] Opt-out methods work (env var, logout, no --upload)

- [ ] **Snapshot Upload**
  - [ ] Upload succeeds
  - [ ] Silent by default
  - [ ] Debug mode shows details
  - [ ] Errors are clear

- [ ] **Database Storage**
  - [ ] Snapshots stored correctly
  - [ ] User/project relationships correct
  - [ ] No source code stored

- [ ] **ZCC Enforcement**
  - [ ] Invalid payloads rejected
  - [ ] Clear violation messages
  - [ ] Client-side validation works

- [ ] **Error Handling**
  - [ ] Network errors: Retry logic works
  - [ ] Auth errors: Clear "sign in" message
  - [ ] ZCC errors: Clear violation message
  - [ ] Server errors: Retry with backoff

---

## Step 8: Update OAuth Callback URLs (If Needed)

If deployment URL changes, update OAuth apps:

### GitHub
1. Go to: https://github.com/settings/developers
2. Select "ODAVL Insight Cloud (Beta)"
3. Update "Authorization callback URL"
4. Save changes

### Google
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select OAuth client
3. Update "Authorized redirect URIs"
4. Save changes

---

## Common Issues & Fixes

### Issue 1: "Unauthorized" Error

**Symptom:** Upload fails with 401

**Causes:**
- Token expired
- Session cookie not sent
- NextAuth not configured

**Fix:**
```bash
# Re-authenticate
odavl insight auth logout
odavl insight auth login
```

### Issue 2: "ZCC Violation" Error

**Symptom:** Upload fails with 400

**Causes:**
- Payload contains forbidden fields
- Client validation bypassed

**Fix:**
- Check snapshot-uploader.ts validation
- Ensure payload matches schema
- Report bug if validation incorrect

### Issue 3: Database Connection Error

**Symptom:** Deployment fails or 500 errors

**Causes:**
- DATABASE_URL incorrect
- Prisma migrations not run
- Database unreachable

**Fix:**
```bash
# Verify connection string
echo $DATABASE_URL

# Run migrations
DATABASE_URL="<url>" npx prisma db push

# Test connection
DATABASE_URL="<url>" npx prisma studio
```

### Issue 4: OAuth Callback Fails

**Symptom:** After sign-in, error page shown

**Causes:**
- Callback URL mismatch
- Environment variables not set
- NEXTAUTH_SECRET missing

**Fix:**
1. Verify callback URLs match in OAuth apps
2. Check Vercel environment variables
3. Redeploy: `vercel --prod`

---

## Rollback Plan

If deployment fails:

```bash
# Rollback to previous deployment
vercel rollback <deployment-id>

# Or delete deployment
vercel remove odavl-insight-cloud
```

**Clients:** CLI will continue to work in local-only mode (no --upload)

---

## Post-Deployment Tasks

1. **Update Documentation:**
   - Replace placeholder URLs in GETTING_STARTED_CLOUD.md
   - Update ZCC_SPECIFICATION.md with live URL
   - Add live URL to README.md

2. **Announce Beta:**
   - Share Getting Started guide
   - Invite beta testers
   - Set up feedback channels

3. **Monitor:**
   - Check Vercel logs for errors
   - Monitor database growth
   - Track authentication success rate

---

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Cloud app URL | `https://odavl-insight-cloud.vercel.app` |
| `NEXTAUTH_SECRET` | JWT secret (32+ chars) | `openssl rand -base64 32` |
| `GITHUB_ID` | GitHub OAuth client ID | `abc123...` |
| `GITHUB_SECRET` | GitHub OAuth secret | `secret123...` |
| `GOOGLE_ID` | Google OAuth client ID | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_SECRET` | Google OAuth secret | `secret456...` |

---

## Success Criteria

Beta is live when:
- ✅ Cloud app deployed and accessible
- ✅ OAuth login works (GitHub + Google)
- ✅ CLI can authenticate
- ✅ Snapshots upload successfully
- ✅ Database stores snapshots (ZCC compliant)
- ✅ ZCC violations rejected
- ✅ Error messages clear
- ✅ Opt-out methods work

---

**Next:** Create Beta Launch Report
