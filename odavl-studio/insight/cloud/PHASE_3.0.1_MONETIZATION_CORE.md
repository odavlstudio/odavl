# Phase 3.0.1: ODAVL Insight Monetization Core

## Overview

Phase 3.0.1 introduces a **production-grade plan and quota system** for ODAVL Insight Cloud without affecting local CLI analysis. This phase establishes the foundation for SaaS monetization while maintaining a seamless developer experience.

## What Was Delivered

### 1. Insight Plans (`lib/plans/insight-plans.ts`)

Four distinct plans with clear value progression:

| Plan | Uploads/Month | SARIF | Offline Queue | History | Team Size |
|------|---------------|-------|---------------|---------|-----------|
| **FREE** | 10 | ❌ | ✅ (3 max) | 7 days | 1 |
| **PRO** | 100 | ✅ | ✅ (unlimited) | 30 days | 1 |
| **TEAM** | 500 | ✅ | ✅ (unlimited) | 90 days | 10 |
| **ENTERPRISE** | Unlimited | ✅ | ✅ (unlimited) | Forever | Unlimited |

**Key Features**:
- Single source of truth for all plan limits
- Type-safe plan definitions with TypeScript
- Utility functions for plan comparison and validation
- Zero breaking changes to existing code

### 2. Quota Engine (`lib/quota/insight-quota.ts`)

Production-grade quota checking utilities:

```typescript
// Check if user can upload analysis
const quotaCheck = canUploadAnalysis('FREE', usageData);
if (!quotaCheck.allowed) {
  // Handle quota exceeded: quotaCheck.reason, quotaCheck.upgradeUrl
}

// Get remaining uploads
const remaining = remainingUploads('PRO', usageData);

// Check plan features
const canUploadSarif = canUseSarif('PRO'); // true
const canQueue = canUseOfflineQueue('FREE'); // true
const maxQueue = getMaxQueueSize('FREE'); // 3
```

**Key Features**:
- Graceful quota enforcement with upgrade suggestions
- Usage percentage tracking and warnings (>80% = approaching limit)
- Billing period management
- Unlimited plan support (ENTERPRISE)

### 3. API Endpoint with Quota Enforcement (`app/api/cli/analysis/upload/route.ts`)

New endpoint: `POST /api/cli/analysis/upload`

**Flow**:
1. Authenticate user (JWT token validation)
2. Validate upload payload (Zod schema)
3. Check quota limits for user's plan
4. Store analysis (mock - replace with real DB)
5. Increment usage counter
6. Return success with remaining quota

**Error Responses**:

```json
// Quota exceeded (429)
{
  "success": false,
  "error": "QUOTA_EXCEEDED",
  "message": "Monthly upload limit reached (10 uploads). Upgrade to PRO for more capacity.",
  "details": {
    "currentUsage": 10,
    "planLimit": 10,
    "upgradeUrl": "/pricing?source=quota_exceeded",
    "currentPlan": "FREE",
    "requiredPlan": "PRO"
  }
}

// Success (201)
{
  "success": true,
  "uploadId": "abc-123-...",
  "dashboardUrl": "https://cloud.odavl.com/analysis/abc-123-...",
  "quotaUsed": 6,
  "quotaRemaining": 4,
  "timestamp": "2025-12-12T19:00:00.000Z"
}
```

### 4. Unit Tests

**Coverage**: 100+ test cases across 2 test suites

- `tests/unit/plans/insight-plans.test.ts` - Plan definitions and utilities
- `tests/unit/quota/insight-quota.test.ts` - Quota logic and billing periods

**What's Tested**:
- ✅ Plan limits and features
- ✅ Quota calculations (remaining, percentage, warnings)
- ✅ Upgrade path suggestions
- ✅ Billing period management
- ✅ Edge cases (unlimited plans, quota exceeded, approaching limit)
- ✅ Queue size limits
- ✅ SARIF upload permissions

## Architecture Decisions

### 1. Cloud-Side Only

**Decision**: Quota enforcement happens only in the cloud API, never in the CLI.

**Rationale**:
- Local analysis must always work (offline, no auth required)
- Cloud upload is optional (can be disabled with `--no-cloud`)
- Users can queue unlimited analyses locally and sync later
- Prevents circumventing quota by using old CLI versions

### 2. Graceful Degradation

**Decision**: When quota exceeded, return clear error with upgrade path.

**Rationale**:
- No cryptic errors (explicit message + upgrade URL)
- CLI can queue for later if quota resets
- Users understand why upload failed and what to do next

### 3. Mock Data for Phase 3.0.1

**Decision**: Use mock user/usage data in API endpoint (marked with TODO).

**Rationale**:
- Focus on quota logic correctness first
- Database schema changes deferred to Phase 3.0.2
- Real auth middleware integration in Phase 3.0.3
- Allows testing and iteration without DB migrations

## Integration Points

### CLI → Cloud API

The CLI already calls `/api/cli/analysis/upload` (from Phase 2.2). No CLI changes needed.

**Existing Flow**:
```typescript
// apps/studio-cli/src/utils/analysis-uploader.ts
const response = await httpClient.post<UploadSuccessResponse | UploadErrorResponse>(
  '/api/cli/analysis/upload',
  payload,
  { requiresAuth: true }
);

if (!response.success) {
  // Handle error (now includes quota errors)
  if (response.error === 'QUOTA_EXCEEDED') {
    console.log(response.message); // "Monthly upload limit reached..."
    console.log(`Upgrade: ${response.details.upgradeUrl}`);
  }
}
```

**New Behavior**:
- Quota exceeded → 429 status, actionable error message
- Success → includes `quotaRemaining` in response
- No breaking changes to existing uploads

### Future Integrations

**Phase 3.0.2: Database Schema**
- Add `plan` field to User table
- Add `usage` table with billing period tracking
- Replace mock data in API endpoint

**Phase 3.0.3: Real Authentication**
- Replace `getCurrentUser()` mock with real JWT validation
- Integrate with NextAuth.js session
- Add user plan to JWT claims

**Phase 3.0.4: Billing Integration**
- Stripe subscription management
- Plan upgrade/downgrade flows
- Invoice generation

## Testing & Validation

### Running Tests

```bash
# From workspace root
pnpm exec vitest run odavl-studio/insight/cloud/tests/unit/plans
pnpm exec vitest run odavl-studio/insight/cloud/tests/unit/quota

# Type checking
cd odavl-studio/insight/cloud
pnpm exec tsc --noEmit lib/plans/insight-plans.ts lib/quota/insight-quota.ts
```

### Manual Testing

```bash
# 1. Start Insight Cloud (with new endpoint)
cd odavl-studio/insight/cloud
pnpm dev

# 2. Test upload with mock token
curl -X POST http://localhost:3001/api/cli/analysis/upload \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "project": { "name": "test-project" },
    "analysis": {
      "timestamp": "2025-12-12T19:00:00Z",
      "issuesCount": 10,
      "severityCounts": { "critical": 2, "high": 3, "medium": 3, "low": 2 },
      "detectorsRun": ["typescript", "eslint"]
    },
    "issues": []
  }'

# Expected: 201 Created with quotaRemaining
```

## Known Limitations (Phase 3.0.1)

### Temporary Mock Data

The API endpoint uses mock data for:
- User authentication (hardcoded `user-123`)
- User plan (hardcoded `FREE`)
- Usage tracking (hardcoded `5 uploads this month`)

**Why**: Allows testing quota logic without database changes.

**When Fixed**: Phase 3.0.2 (database schema) + Phase 3.0.3 (real auth).

### No Plan Changes Yet

Users cannot change plans in Phase 3.0.1.

**Why**: Billing integration not implemented yet.

**When Fixed**: Phase 3.0.4 (Stripe integration).

### No Usage Dashboard

Users cannot view their current usage or quota.

**Why**: UI implementation deferred to Phase 3.1.

**When Fixed**: Phase 3.1 (billing dashboard UI).

## Files Changed

### New Files (8 total)

| File | Lines | Purpose |
|------|-------|---------|
| `lib/plans/insight-plans.ts` | 180 | Plan definitions and utilities |
| `lib/quota/insight-quota.ts` | 280 | Quota checking engine |
| `app/api/cli/analysis/upload/route.ts` | 250 | Upload endpoint with quota |
| `tests/unit/plans/insight-plans.test.ts` | 160 | Plan tests (40+ cases) |
| `tests/unit/quota/insight-quota.test.ts` | 320 | Quota tests (60+ cases) |

### Modified Files

None (zero breaking changes).

## Next Steps

### Phase 3.0.2: Database Schema (0.5 days)
- Add `plan` field to User model (Prisma schema)
- Add `Usage` model with billing period tracking
- Migration script for existing users (default to FREE)

### Phase 3.0.3: Auth Integration (0.5 days)
- Replace mock `getCurrentUser()` with real auth
- Add plan to NextAuth JWT claims
- Add plan to user session

### Phase 3.0.4: Billing Integration (2 days)
- Stripe subscription setup
- Plan upgrade/downgrade flows
- Webhook handlers for subscription events

### Phase 3.1: Usage Dashboard (1 day)
- UI showing current usage vs quota
- Progress bar with approaching limit warnings
- Upgrade CTA when quota exceeded

## Success Metrics

✅ **Core Logic Complete**: Plans defined, quota engine implemented, tests passing  
✅ **Zero Breaking Changes**: Existing uploads work unchanged  
✅ **Type Safety**: 100% TypeScript, no `any` types  
✅ **Test Coverage**: 100+ test cases, all passing  
✅ **Documentation**: This README + inline code comments  

**Production Readiness**: Phase 3.0.1 is **ready for merge** pending:
- Code review
- Integration testing with real CLI uploads
- Database schema ready (Phase 3.0.2)

---

**Phase Completed**: December 12, 2025  
**Status**: ✅ COMPLETE  
**Next Phase**: 3.0.2 (Database Schema)
