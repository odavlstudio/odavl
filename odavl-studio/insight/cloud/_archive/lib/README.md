# ODAVL Insight - Monetization Implementation

## Phase 3.0.1: Core Policy & Quota Engine ✅

This directory contains the production-grade monetization infrastructure for ODAVL Insight Cloud.

## Quick Links

- **[Implementation Guide](./PHASE_3.0.1_MONETIZATION_CORE.md)** - Comprehensive documentation
- **[Summary](./PHASE_3.0.1_SUMMARY.md)** - Quick overview
- **[Checklist](./PHASE_3.0.1_CHECKLIST.md)** - Implementation status

## Structure

```
odavl-studio/insight/cloud/
├── lib/
│   ├── plans/
│   │   └── insight-plans.ts          # Plan definitions (FREE, PRO, TEAM, ENTERPRISE)
│   ├── quota/
│   │   └── insight-quota.ts          # Quota checking engine
│   └── index.ts                      # Public API exports
├── app/api/cli/analysis/upload/
│   └── route.ts                      # Upload endpoint with quota enforcement
├── tests/unit/
│   ├── plans/
│   │   └── insight-plans.test.ts     # Plan tests (40+ cases)
│   └── quota/
│       └── insight-quota.test.ts     # Quota tests (60+ cases)
└── docs/
    ├── PHASE_3.0.1_MONETIZATION_CORE.md
    ├── PHASE_3.0.1_SUMMARY.md
    └── PHASE_3.0.1_CHECKLIST.md
```

## Usage Examples

### Check Quota

```typescript
import { canUploadAnalysis, remainingUploads } from '@/lib';

// Check if user can upload
const quotaCheck = canUploadAnalysis('FREE', usageData);
if (!quotaCheck.allowed) {
  console.log(quotaCheck.reason); // "Monthly upload limit reached..."
  console.log(quotaCheck.upgradeUrl); // "/pricing?source=quota_exceeded"
}

// Get remaining uploads
const remaining = remainingUploads('PRO', usageData);
console.log(`You have ${remaining} uploads remaining`);
```

### Check Plan Features

```typescript
import { canUseSarif, canUseOfflineQueue, getMaxQueueSize } from '@/lib';

// Check SARIF upload permission
const canUpload = canUseSarif('PRO'); // true

// Check offline queue permission
const canQueue = canUseOfflineQueue('FREE'); // true

// Get max queue size
const maxQueue = getMaxQueueSize('FREE'); // 3
```

### Get Plan Info

```typescript
import { getInsightPlan, comparePlans } from '@/lib';

// Get plan details
const plan = getInsightPlan('PRO');
console.log(plan.monthlyUploadLimit); // 100
console.log(plan.allowSarifUpload); // true

// Compare plans
const isPlanUpgrade = comparePlans('PRO', 'FREE') > 0; // true
```

## API Endpoint

**POST** `/api/cli/analysis/upload`

**Request**:
```json
{
  "project": {
    "name": "my-project",
    "branch": "main",
    "commit": "abc123"
  },
  "analysis": {
    "timestamp": "2025-12-12T19:00:00Z",
    "issuesCount": 10,
    "severityCounts": {
      "critical": 2,
      "high": 3,
      "medium": 3,
      "low": 2
    },
    "detectorsRun": ["typescript", "eslint"]
  },
  "issues": [...]
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "uploadId": "abc-123-...",
  "dashboardUrl": "https://cloud.odavl.com/analysis/abc-123-...",
  "quotaUsed": 6,
  "quotaRemaining": 4,
  "timestamp": "2025-12-12T19:00:00.000Z"
}
```

**Quota Exceeded (429)**:
```json
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
```

## Plan Comparison

| Feature | FREE | PRO | TEAM | ENTERPRISE |
|---------|------|-----|------|------------|
| **Uploads/Month** | 10 | 100 | 500 | Unlimited |
| **SARIF Upload** | ❌ | ✅ | ✅ | ✅ |
| **Offline Queue** | 3 max | Unlimited | Unlimited | Unlimited |
| **History** | 7 days | 30 days | 90 days | Forever |
| **Team Size** | 1 | 1 | 10 | Unlimited |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **Custom Rules** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ✅ | ✅ | ✅ |

## Testing

```bash
# Run plan tests
pnpm exec vitest run odavl-studio/insight/cloud/tests/unit/plans

# Run quota tests
pnpm exec vitest run odavl-studio/insight/cloud/tests/unit/quota

# TypeScript compilation check
cd odavl-studio/insight/cloud
pnpm exec tsc --noEmit --skipLibCheck lib/**/*.ts
```

## Key Design Decisions

### 1. Cloud-Side Only
Quota enforcement happens **only in the cloud API**, never in the CLI.
- Local analysis always works (offline, no auth)
- Cloud upload is optional (`--no-cloud` flag)
- Users can queue unlimited analyses locally

### 2. Graceful Degradation
When quota exceeded:
- Clear error message with upgrade path
- CLI can queue for later sync
- No data loss

### 3. Type Safety
- 100% TypeScript
- No `any` types
- Zod validation for API payloads

### 4. Zero Breaking Changes
- Existing upload flows work unchanged
- Quota logic transparent to CLI
- Backward compatible

## Next Phases

- **Phase 3.0.2**: Database Schema (0.5 days) - Add `plan` field, `Usage` model
- **Phase 3.0.3**: Auth Integration (0.5 days) - Real JWT validation
- **Phase 3.0.4**: Billing (2 days) - Stripe integration
- **Phase 3.1**: Usage Dashboard (1 day) - UI for quota tracking

## Status

✅ **Core Logic**: Complete  
✅ **API Endpoint**: Complete (with mock data)  
✅ **Tests**: 100+ cases, all passing  
✅ **Documentation**: Comprehensive  
⏳ **Database**: Awaiting Phase 3.0.2  
⏳ **Real Auth**: Awaiting Phase 3.0.3  

**Ready for Review**: ✅ YES

---

**Implemented**: December 12, 2025  
**Status**: Phase 3.0.1 Complete
