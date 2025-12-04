# 📊 Monitoring Validation Guide - Phase 3.2

**Status**: Infrastructure configured ✅ | Manual testing required ⏳  
**Score Impact**: +2 points (96 → 98/100)  
**Duration**: 30 minutes manual setup + testing

---

## ✅ Infrastructure Status (100% Complete)

### 1. Sentry Configuration ✅

**Files configured**:
- ✅ `instrumentation.ts` - Both nodejs and edge runtime initialization
- ✅ `sentry.config.ts` - Webpack plugin for source maps
- ✅ Test endpoint created: `/api/test-sentry`

**Current settings**:
```typescript
// instrumentation.ts (nodejs runtime)
- tracesSampleRate: 10% (production)
- profilesSampleRate: 10% (production)
- Prisma integration: ✅ Active
- HTTP integration: ✅ Enabled
- Error filtering: ✅ beforeSend hook (filters dev errors, ResizeObserver)
- Environment: ✅ Tracked via NODE_ENV
- Release: ✅ Tracks NEXT_PUBLIC_APP_VERSION

// instrumentation.ts (edge runtime)
- tracesSampleRate: 10%
- Lightweight configuration for edge functions
```

**Environment variables status**:
```env
# .env.local (current state)
NEXT_PUBLIC_SENTRY_DSN=""  # ⏳ EMPTY - needs DSN
SENTRY_DSN=""              # ⏳ EMPTY - needs DSN
SENTRY_ORG=""              # ⏳ Missing - needs organization slug
SENTRY_PROJECT=""          # ⏳ Missing - needs project name
```

---

## 🔧 Manual Setup Required (30 minutes)

### Step 1: Create Sentry Project (10 minutes)

1. **Go to**: https://sentry.io/signup/ (or login if you have account)

2. **Create organization**: `odavl-studio` (or your preferred name)

3. **Create project**:
   - Platform: **Next.js**
   - Project name: `studio-hub`
   - Alert frequency: **On every new issue**

4. **Copy DSN**:
   - Navigate to: Settings → Projects → studio-hub → Client Keys (DSN)
   - Copy DSN (format: `https://<key>@o<id>.ingest.sentry.io/<project-id>`)

5. **Update .env.local**:
   ```env
   # Sentry Configuration
   NEXT_PUBLIC_SENTRY_DSN="https://your-key-here@o123456.ingest.sentry.io/7890123"
   SENTRY_DSN="https://your-key-here@o123456.ingest.sentry.io/7890123"
   SENTRY_ORG="odavl-studio"        # Your organization slug
   SENTRY_PROJECT="studio-hub"      # Your project name
   
   # App version for release tracking
   NEXT_PUBLIC_APP_VERSION="2.0.0"
   ```

6. **Restart dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   pnpm dev
   ```

---

### Step 2: Test Sentry Error Capture (10 minutes)

#### Test 1: Basic Error Capture (5 minutes)

```bash
# Test GET endpoint (triggers exception)
curl http://localhost:3000/api/test-sentry

# Expected response:
{
  "error": "Test error sent to Sentry",
  "message": "Check Sentry dashboard for error event",
  "expectedFields": [
    "Stack trace",
    "Environment (development/production)",
    "Release version from NEXT_PUBLIC_APP_VERSION",
    "HTTP request context breadcrumbs"
  ]
}
```

**Verify in Sentry dashboard** (https://sentry.io/organizations/YOUR-ORG/issues/):
- ✅ New issue appears: "Test error for Sentry validation"
- ✅ Stack trace shows: `app/api/test-sentry/route.ts`
- ✅ Tags include:
  - `test: sentry-validation`
  - `endpoint: /api/test-sentry`
- ✅ Environment: `development` (or `production` if deployed)
- ✅ Release: `2.0.0` (from NEXT_PUBLIC_APP_VERSION)
- ✅ Breadcrumbs show HTTP request details

#### Test 2: Custom Message Capture (5 minutes)

```bash
# Test POST endpoint (custom message with severity)
curl -X POST http://localhost:3000/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"message": "Custom monitoring test", "severity": "warning"}'

# Expected response:
{
  "success": true,
  "message": "Sent \"Custom monitoring test\" to Sentry with severity: warning"
}
```

**Verify in Sentry dashboard**:
- ✅ New event appears with level: **Warning**
- ✅ Message: "Custom monitoring test"
- ✅ Extra context includes request body

---

### Step 3: Performance Monitoring Verification (5 minutes)

**Test transaction tracing**:
```bash
# Visit dashboard in browser
open http://localhost:3000/dashboard

# Then check Sentry Performance tab
# Expected: Transaction trace for /dashboard page
# - Duration: ~100-500ms
# - Spans: Database queries, API calls
# - Sample rate: 10% (1 in 10 requests captured)
```

**Verify in Sentry Performance**:
- ✅ Transactions appear for page loads
- ✅ Database queries traced (Prisma integration)
- ✅ HTTP requests traced
- ✅ Performance metrics: FCP, LCP, FID

---

### Step 4: Environment Variables Production Checklist (5 minutes)

**For production deployment**, add to `.env.production`:

```env
# ============================================
# SENTRY MONITORING (REQUIRED)
# ============================================
NEXT_PUBLIC_SENTRY_DSN="https://your-key-here@o123456.ingest.sentry.io/7890123"
SENTRY_DSN="https://your-key-here@o123456.ingest.sentry.io/7890123"
SENTRY_ORG="odavl-studio"
SENTRY_PROJECT="studio-hub"

# Authentication token for source map upload (generate in Sentry)
SENTRY_AUTH_TOKEN="your-sentry-auth-token-here"

# App version for release tracking
NEXT_PUBLIC_APP_VERSION="2.0.0"

# Node environment
NODE_ENV="production"
```

**Generate SENTRY_AUTH_TOKEN**:
1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Scopes: `project:releases`, `project:write`, `org:read`
4. Copy token and add to `.env.production`

---

## 📈 Optional: Additional Monitoring Integrations

### Datadog RUM (Optional - +0 points, already configured)

**Current status**: Infrastructure ready, needs API key

```env
# .env.local (add if you want Datadog)
DATADOG_API_KEY="your-datadog-api-key-here"
DATADOG_ENABLED="true"
```

**Setup**:
1. Create Datadog account: https://www.datadoghq.com/
2. Get API key from: Organization Settings → API Keys
3. Update environment variables
4. Restart server

**Features**:
- Real User Monitoring (RUM)
- Session replay (20% sample rate)
- Resource tracking
- Long task tracking
- User interaction tracking

---

### PagerDuty Alerting (Optional - +0 points)

**Current status**: Ready for integration

```env
# .env.local (add if you want PagerDuty alerts)
PAGERDUTY_INTEGRATION_KEY="your-pagerduty-integration-key"
SECURITY_TEAM_EMAIL="security@odavl.com"
```

**Setup**:
1. Create PagerDuty account
2. Create service for studio-hub
3. Get integration key from: Services → studio-hub → Integrations
4. Update environment variables

**Alert triggers**:
- Critical errors (automatic via Sentry integration)
- Security events (from security-monitoring.ts)
- Performance degradation

---

## ✅ Validation Checklist

### Required for +2 points (98/100):

- [ ] Sentry project created
- [ ] DSN configured in .env.local
- [ ] Dev server restarted
- [ ] Test endpoint returns 500 error
- [ ] Error appears in Sentry dashboard
- [ ] Stack trace visible and correct
- [ ] Tags and context present
- [ ] Environment tracked correctly
- [ ] Release version appears
- [ ] Performance transactions captured

### Once all checked:

```bash
# Mark Phase 3.2 complete
echo "✅ Sentry monitoring validated and working"
echo "Score: 96 → 98/100 (+2 points)"
echo "Remaining: Phase 3.3 (Docs) + Phase 3.4 (OAuth) = 2 points"
```

---

## 🎯 Expected Outcomes

After completing this phase:

1. **Error Tracking**: ✅ All production errors automatically captured
2. **Performance Monitoring**: ✅ 10% sample rate tracking page performance
3. **Stack Traces**: ✅ Full source maps uploaded for debugging
4. **Context**: ✅ User, environment, release info in every error
5. **Alerting**: ✅ Real-time notifications for new issues
6. **Score**: **98/100** (Production-ready monitoring) ✅

---

## 📝 Notes

- **Development testing**: Use `/api/test-sentry` endpoint extensively
- **Production deployment**: SENTRY_AUTH_TOKEN required for source maps
- **Sample rate**: 10% means 1 in 10 requests captured (cost-effective)
- **Error filtering**: beforeSend hook prevents spam from non-critical errors
- **Prisma integration**: Automatically traces all database queries

---

**Next Phase**: Phase 3.3 - Documentation Updates (+1 point → 99/100)  
**Time estimate**: 15 minutes
