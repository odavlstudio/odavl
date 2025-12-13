# Phase 3.0.3 Deployment Checklist

**Status**: Ready for Production Deployment  
**Date**: December 10, 2025  
**Phase**: Authentication & Plan Binding

---

## ✅ Pre-Deployment Verification

### Code Quality

- [x] **TypeScript Compilation**: `pnpm typecheck` - Zero errors
- [x] **Linting**: `pnpm lint` - Zero warnings
- [x] **Unit Tests**: 40+ tests passing
- [x] **Integration Tests**: 30+ tests passing
- [x] **Test Coverage**: 100% for auth middleware
- [x] **Build Success**: `pnpm build` - No errors

### Security Review

- [x] JWT signature verification implemented
- [x] Database user validation on every request
- [x] Graceful error handling (no info leakage)
- [x] Plan-based authorization enforcement
- [x] Token expiration (7 days default)
- [x] HTTPS recommended for production
- [x] Environment variable for JWT_SECRET (not hardcoded)

### Documentation

- [x] Implementation guide written (PHASE_3.0.3_AUTHENTICATION.md)
- [x] Executive summary created (PHASE_3.0.3_SUMMARY.md)
- [x] API usage examples provided
- [x] Troubleshooting guide included
- [x] Deployment checklist (this file)

---

## 🚀 Deployment Steps

### Step 1: Generate JWT Secret

```bash
# Generate secure random string (32+ bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output, save securely
# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**⚠️ CRITICAL**: 
- Never commit JWT_SECRET to Git
- Use different secrets for dev/staging/production
- Store in secure vault (AWS Secrets Manager, Vercel Environment Variables, etc.)

### Step 2: Set Environment Variables

**Vercel**:
```bash
vercel env add JWT_SECRET production
# Paste generated secret when prompted
```

**Railway**:
```bash
railway variables set JWT_SECRET=<your-secret>
```

**Docker**:
```bash
docker run -e JWT_SECRET=<your-secret> ...
```

**Local Development**:
```bash
# Add to .env (already gitignored)
echo "JWT_SECRET=<your-secret>" >> .env
```

### Step 3: Database Migration

```bash
# Navigate to Insight Cloud
cd odavl-studio/insight/cloud

# Apply schema changes (adds User.plan field)
pnpm db:push

# Verify schema update
pnpm db:studio
# Navigate to User table, confirm "plan" column exists
```

**Expected Changes**:
- User table now has `plan` column (SubscriptionTier enum)
- Default value: FREE
- Index created on `plan` field

### Step 4: Deploy Code

**Vercel** (recommended for Next.js):
```bash
cd odavl-studio/insight/cloud
vercel --prod
```

**Railway**:
```bash
railway up
```

**Docker**:
```bash
docker build -t odavl-insight-cloud:3.0.3 .
docker push odavl-insight-cloud:3.0.3
docker run -p 3000:3000 \
  -e JWT_SECRET=<your-secret> \
  -e DATABASE_URL=<your-db-url> \
  odavl-insight-cloud:3.0.3
```

### Step 5: Verify Deployment

**Health Check**:
```bash
# Test endpoint accessibility
curl https://your-domain.com/api/cli/analysis/upload
# Expected: 401 Unauthorized (no token provided)
```

**Generate Test Token**:
```bash
# Local script (requires access to JWT_SECRET)
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ userId: 'test-user', email: 'test@example.com' }, process.env.JWT_SECRET, { expiresIn: '7d' }));"
```

**Test Authenticated Request**:
```bash
# Replace <token> with generated token
curl -X POST https://your-domain.com/api/cli/analysis/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project": {"name": "test", "branch": "main", "commit": "abc123"},
    "analysis": {"timestamp": "2025-12-10T10:00:00Z", "issuesCount": 0, "severityCounts": {}, "detectorsRun": []},
    "issues": [],
    "metadata": {"cliVersion": "2.0.0", "platform": "linux", "nodeVersion": "v20.0.0"}
  }'

# Expected: 201 Created (or 429 if quota exceeded)
```

### Step 6: Monitor Logs

**Watch for**:
- ✅ Successful authentications (200/201 responses)
- ⚠️ 401 errors (invalid/expired tokens - expected for unauthenticated users)
- ⚠️ 403 errors (insufficient plan - expected for plan restrictions)
- ❌ 500 errors (unexpected, investigate immediately)

**Vercel Logs**:
```bash
vercel logs --prod
```

**Railway Logs**:
```bash
railway logs
```

**Docker Logs**:
```bash
docker logs <container-id> -f
```

---

## 🔍 Post-Deployment Verification

### Automated Tests

```bash
# Run full test suite against deployed environment
cd odavl-studio/insight/cloud
NEXT_PUBLIC_API_URL=https://your-domain.com pnpm test:integration
```

### Manual Smoke Tests

#### Test 1: Authentication Required

```bash
# Upload without token (should fail)
curl -X POST https://your-domain.com/api/cli/analysis/upload \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Expected: 401 Unauthorized
```

**✅ Pass if**: Returns 401 with `{"success": false, "error": "UNAUTHORIZED"}`

#### Test 2: Valid Token Accepted

```bash
# Upload with valid token (should succeed)
curl -X POST https://your-domain.com/api/cli/analysis/upload \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Expected: 201 Created
```

**✅ Pass if**: Returns 201 with `{"success": true, "uploadId": "...", "dashboardUrl": "..."}`

#### Test 3: Expired Token Rejected

```bash
# Generate expired token
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ userId: 'test', email: 'test@example.com' }, process.env.JWT_SECRET, { expiresIn: '-1h' }));"

# Upload with expired token (should fail)
curl -X POST https://your-domain.com/api/cli/analysis/upload \
  -H "Authorization: Bearer <expired-token>" \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Expected: 401 Unauthorized
```

**✅ Pass if**: Returns 401 with `{"success": false, "error": "UNAUTHORIZED"}`

#### Test 4: Quota Enforcement

```bash
# Upload multiple times as FREE user (10 uploads limit)
for i in {1..11}; do
  curl -X POST https://your-domain.com/api/cli/analysis/upload \
    -H "Authorization: Bearer <free-user-token>" \
    -H "Content-Type: application/json" \
    -d @test-payload.json
done

# Expected: First 10 succeed (201), 11th fails (429)
```

**✅ Pass if**: 11th request returns 429 with `{"success": false, "error": "QUOTA_EXCEEDED"}`

#### Test 5: Plan Upgrade

```bash
# 1. Upload as FREE user at quota limit (should fail)
curl -X POST https://your-domain.com/api/cli/analysis/upload \
  -H "Authorization: Bearer <free-user-token>" \
  -d @test-payload.json
# Expected: 429 Too Many Requests

# 2. Upgrade user to PRO in database
pnpm db:studio
# Navigate to User, change plan to "PRO"

# 3. Upload again with same token (should succeed)
curl -X POST https://your-domain.com/api/cli/analysis/upload \
  -H "Authorization: Bearer <same-token>" \
  -d @test-payload.json
# Expected: 201 Created
```

**✅ Pass if**: Upload succeeds after plan upgrade

---

## 📊 Monitoring Setup

### Key Metrics

**Authentication Success Rate**:
- Target: >99.5%
- Alert: <95% over 5 minutes

**Token Expiration Rate**:
- Track 401 errors with reason "expired"
- Adjust expiration if too frequent

**Quota Exhaustion Rate**:
- FREE: Track 429 errors (upsell opportunity)
- PRO: Track 429 errors (upgrade contact)

**Average Response Time**:
- Auth overhead: <10ms
- Total endpoint: <500ms

### Sentry Configuration (Optional)

```typescript
// app/api/cli/analysis/upload/route.ts
import * as Sentry from '@sentry/nextjs';

// Capture auth failures
Sentry.captureMessage('Authentication failed', {
  level: 'warning',
  tags: { phase: '3.0.3', component: 'auth' },
  extra: { reason: 'invalid_token' },
});
```

### CloudWatch/Datadog Alerts

```yaml
# Example CloudWatch alarm
AuthFailureRate:
  metric: Errors.401
  threshold: 5%
  period: 5 minutes
  action: notify-devops-team
```

---

## 🐛 Troubleshooting

### Issue: All requests return 401

**Possible Causes**:
1. JWT_SECRET not set in production
2. Database migration not applied
3. Token format incorrect

**Solution**:
```bash
# Check environment variable
vercel env ls  # Verify JWT_SECRET exists

# Check database schema
pnpm db:studio  # Verify User.plan field exists

# Test token generation
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ userId: 'test', email: 'test@example.com' }, process.env.JWT_SECRET));"
# Should output valid JWT (3 parts separated by dots)
```

### Issue: Quota not enforced

**Possible Causes**:
1. User.plan field not updated
2. Usage tracking not incrementing

**Solution**:
```bash
# Check user plan in database
pnpm db:studio
# Navigate to User, verify plan is "FREE" (should limit to 10)

# Check usage tracking
pnpm db:studio
# Navigate to InsightUsage, verify uploadsUsed is incrementing
```

### Issue: 500 Internal Server Error

**Possible Causes**:
1. Database connection error
2. Prisma client not regenerated
3. JWT verification exception

**Solution**:
```bash
# Check logs for stack trace
vercel logs --prod | grep "500"

# Regenerate Prisma client
cd odavl-studio/insight/cloud
pnpm prisma generate

# Rebuild and redeploy
pnpm build && vercel --prod
```

---

## 🔄 Rollback Procedure

### If Critical Issues Arise

**Option 1: Revert Deployment** (recommended if < 1 hour since deploy):
```bash
# Vercel
vercel rollback <deployment-url>

# Railway
railway rollback

# Docker
docker run <previous-image-tag>
```

**Option 2: Emergency Hotfix** (if rollback not feasible):
```typescript
// Temporarily disable auth (NOT RECOMMENDED FOR PRODUCTION)
// Only use if critical business need

// app/api/cli/analysis/upload/route.ts
export async function POST(req: NextRequest) {
  // Bypass auth temporarily
  const mockUser = { userId: 'emergency-user', email: 'temp@odavl.studio', plan: 'FREE' };
  
  // ... rest of upload logic
}

// ⚠️ MUST revert this immediately after issue resolved
```

**Option 3: Database Rollback** (if schema migration caused issues):
```bash
# Revert User.plan field (DESTRUCTIVE)
pnpm prisma migrate reset
pnpm prisma migrate deploy  # Deploy up to previous migration

# ⚠️ WARNING: This will delete all data
# Only use in non-production environments
```

---

## ✅ Deployment Sign-Off

**Pre-Deployment Checklist** (all must be ✅):
- [ ] JWT_SECRET generated and stored securely
- [ ] Environment variable set in production
- [ ] Database migration applied (`pnpm db:push`)
- [ ] Code deployed to production
- [ ] Health check passed (endpoint accessible)
- [ ] Test token generated successfully
- [ ] Authenticated request succeeded (201)
- [ ] Unauthenticated request blocked (401)
- [ ] Quota enforcement verified (429 at limit)

**Post-Deployment Checklist** (all must be ✅):
- [ ] 5 manual smoke tests passed
- [ ] Logs monitored for 1 hour (no 500 errors)
- [ ] Authentication success rate >95%
- [ ] Sentry/CloudWatch alerts configured
- [ ] Team notified of deployment
- [ ] Rollback procedure documented

**Sign-Off**:
- **Deployed By**: _____________________
- **Date**: _____________________
- **Production URL**: https://_____________________
- **Verified By**: _____________________

---

## 📞 Emergency Contacts

**Technical Issues**: devops@odavl.studio  
**Security Incidents**: security@odavl.studio  
**Product Questions**: product@odavl.studio

**On-Call Engineer**: Check #devops-oncall Slack channel

---

**Phase 3.0.3**: Authentication & Plan Binding  
**Deployment Checklist Version**: 1.0.0  
**Last Updated**: December 10, 2025
