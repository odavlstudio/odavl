# TASK 9: Go Live - Quick Start Guide

**Status**: ✅ Pre-deployment validation PASSED (10/10 checks)

## Prerequisites Checklist

- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Vercel account created (https://vercel.com)
- [ ] PostgreSQL database ready (Vercel Postgres, Supabase, Railway, etc.)
- [ ] GitHub account for OAuth
- [ ] Google Cloud account for OAuth

## 5-Step Deployment (30 minutes)

### Step 1: Deploy to Vercel (5 min)

```bash
cd odavl-studio\insight\cloud
vercel login
vercel
```

**Prompts:**
- "Set up and deploy?"  → **Yes**
- "Which scope?"        → **Your account**
- "Link to project?"    → **No** (first time)
- "Project name?"       → **odavl-insight-cloud** (or your choice)
- "Directory?"          → **./** (current)
- "Override settings?"  → **No**

**Result:** You'll get a URL like `https://odavl-insight-cloud-abc123.vercel.app`

**SAVE THIS URL** - You'll need it for steps 2-4.

---

### Step 2: Create OAuth Apps (10 min)

#### GitHub OAuth App
1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: ODAVL Insight Cloud
   - **Homepage URL**: `https://odavl-insight-cloud-abc123.vercel.app`
   - **Authorization callback URL**: `https://odavl-insight-cloud-abc123.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. **SAVE**: Client ID and Client Secret

#### Google OAuth Client
1. Go to: https://console.cloud.google.com/
2. Create project (or select existing)
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure consent screen (external, app name: "ODAVL Insight Cloud")
6. Application type: **Web application**
7. Authorized redirect URIs: `https://odavl-insight-cloud-abc123.vercel.app/api/auth/callback/google`
8. **SAVE**: Client ID and Client Secret

---

### Step 3: Configure Environment Variables (5 min)

```bash
cd odavl-studio\insight\cloud

# Add all 7 environment variables
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string (from Vercel/Supabase/Railway)
# Example: postgresql://user:pass@host:5432/dbname

vercel env add NEXTAUTH_URL
# Paste your Vercel URL from Step 1
# Example: https://odavl-insight-cloud-abc123.vercel.app

vercel env add NEXTAUTH_SECRET
# Generate: openssl rand -base64 32
# Or PowerShell: -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

vercel env add GITHUB_ID
# Paste GitHub Client ID from Step 2

vercel env add GITHUB_SECRET
# Paste GitHub Client Secret from Step 2

vercel env add GOOGLE_ID
# Paste Google Client ID from Step 2

vercel env add GOOGLE_SECRET
# Paste Google Client Secret from Step 2

# Redeploy with environment variables
vercel --prod
```

**Verify:** Environment variables are set in Vercel dashboard → Settings → Environment Variables

---

### Step 4: Database Migration (5 min)

```bash
cd odavl-studio\insight\cloud

# Set DATABASE_URL temporarily
$env:DATABASE_URL = "postgresql://user:pass@host:5432/dbname"

# Push Prisma schema to database
npx prisma db push

# Verify tables created (opens browser UI)
npx prisma studio
```

**Expected Tables:**
- ✅ Account (NextAuth)
- ✅ Session (NextAuth)
- ✅ User (NextAuth)
- ✅ VerificationToken (NextAuth)
- ✅ Project (ODAVL)
- ✅ InsightSnapshot (ODAVL)

---

### Step 5: Update CLI URLs (5 min)

1. **Update insight-auth.ts**:
```typescript
// File: apps/studio-cli/src/commands/insight-auth.ts
// Line ~37: Replace placeholder with your Vercel URL
const DEFAULT_CLOUD_URL = process.env.ODAVL_CLOUD_URL || 'https://odavl-insight-cloud-abc123.vercel.app';
```

2. **Update snapshot-uploader.ts**:
```typescript
// File: apps/studio-cli/src/utils/snapshot-uploader.ts
// Line ~92: Replace placeholder with your Vercel URL
const DEFAULT_CLOUD_URL = 'https://odavl-insight-cloud-abc123.vercel.app';
```

3. **Rebuild CLI**:
```bash
cd apps\studio-cli
pnpm build
```

---

## Test End-to-End Flow (20 minutes)

### Test 1: Authentication ✅
```bash
odavl insight auth login
# Expected: Browser opens, GitHub/Google sign-in, success callback
odavl insight auth status
# Expected: Shows user email, plan (free), token expiry
```

### Test 2: First Upload Consent ✅
```bash
cd <your-test-project>
odavl insight analyze --upload
# Expected: Consent prompt appears with ZCC explanation
# Type: y
# Expected: Consent saved, analysis runs, upload succeeds
```

### Test 3: Subsequent Upload (No Consent) ✅
```bash
odavl insight analyze --upload --debug
# Expected: No consent prompt, upload succeeds silently
# Debug output shows snapshot ID
```

### Test 4: Database Verification ✅
```bash
cd odavl-studio\insight\cloud
$env:DATABASE_URL = "your-url"
npx prisma studio
# Navigate to InsightSnapshot table
# Expected: New record with:
#   - totalFiles, filesAnalyzed counts
#   - criticalCount, highCount, etc.
#   - riskScore (0-100)
#   - detectorsUsed array
#   - NO source code fields
```

### Test 5: ZCC Enforcement ✅
```bash
# Try to upload invalid payload (should be rejected)
curl -X POST https://odavl-insight-cloud-abc123.vercel.app/api/insight/snapshot `
  -H "Content-Type: application/json" `
  -H "Cookie: next-auth.session-token=<your-token>" `
  -d '{"projectName":"test","filePath":"/src/index.ts","criticalCount":2}'

# Expected: 400 Bad Request
# Response: {"error": "ZCC Violation: Forbidden fields detected"}
```

### Test 6: Logout ✅
```bash
odavl insight auth logout
# Expected: Token deleted, consent revoked
odavl insight analyze --upload
# Expected: NO_AUTH error with "Please sign in" message
```

---

## Success Criteria

- [ ] Cloud app deployed to Vercel
- [ ] OAuth apps created (GitHub + Google)
- [ ] Environment variables configured (7 total)
- [ ] Database migrated (6 tables)
- [ ] CLI updated with live URL
- [ ] CLI builds successfully
- [ ] Auth flow works (login/status/logout)
- [ ] Consent prompt appears on first upload
- [ ] Snapshot upload succeeds
- [ ] Database stores ZCC-compliant data
- [ ] Invalid payloads rejected

---

## Common Issues & Quick Fixes

### Issue: "Unauthorized" error during upload
**Fix:**
```bash
odavl insight auth logout
odavl insight auth login
# Re-authenticate to get fresh token
```

### Issue: "ZCC Violation" error
**Fix:** Check snapshot payload structure. Ensure no forbidden fields (code, snippet, path, line, message).

### Issue: Database connection error
**Fix:** Verify DATABASE_URL is correct. Test with:
```bash
psql "postgresql://user:pass@host:5432/dbname"
# Or use Prisma:
cd odavl-studio\insight\cloud
$env:DATABASE_URL = "your-url"
npx prisma db push
```

### Issue: OAuth callback fails
**Fix:** Verify callback URLs match exactly:
- GitHub: `https://your-url.vercel.app/api/auth/callback/github`
- Google: `https://your-url.vercel.app/api/auth/callback/google`

---

## Next Steps After Deployment

1. **Test with Real Projects**
   - Run `odavl insight analyze --upload` on 3-5 real codebases
   - Verify snapshot data in database
   - Check error handling (network failures, invalid tokens)

2. **Beta User Onboarding**
   - Share GETTING_STARTED_CLOUD.md with beta users
   - Monitor Vercel logs for errors
   - Collect feedback on auth flow

3. **Create Beta Launch Report**
   - Document deployment date, URL, OAuth providers
   - Summarize test results (6/6 scenarios passed)
   - List known issues (if any)
   - Set success metrics baseline (user signups, upload count)

---

## Resources

- **Detailed Guide**: [TASK_9_DEPLOYMENT_GUIDE.md](./TASK_9_DEPLOYMENT_GUIDE.md) (700+ lines)
- **Getting Started**: [GETTING_STARTED_CLOUD.md](./GETTING_STARTED_CLOUD.md) (350+ lines)
- **ZCC Specification**: [ZCC_SPECIFICATION.md](./ZCC_SPECIFICATION.md) (600+ lines)
- **TASK 8 Summary**: [TASK_8_BETA_ONBOARDING_SUMMARY.md](./TASK_8_BETA_ONBOARDING_SUMMARY.md)

---

## Rollback Plan (If Needed)

```bash
# List recent deployments
vercel ls odavl-insight-cloud

# Rollback to previous deployment
vercel rollback odavl-insight-cloud <deployment-id>
```

---

**Estimated Time**: 30 minutes deployment + 20 minutes testing = **50 minutes total**

**Blockers**: None (all prerequisites automated or documented)

**Status**: ✅ Ready for deployment (validation passed 10/10 checks)
