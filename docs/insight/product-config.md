# ODAVL Insight Product Configuration

> **Last Updated**: December 11, 2025  
> **Owner**: Product Team  
> **Status**: Production

## Overview

ODAVL Insight's product plans, pricing, limits, and entitlements are defined in a **centralized configuration layer**. This document explains where the config lives, what plans exist, and how to safely add or modify plans.

## Architecture

### Single Source of Truth

**Location**: `odavl-studio/insight/core/src/config/`

```
odavl-studio/insight/core/src/config/
├── insight-product.ts      # Plan definitions (data layer)
└── insight-entitlements.ts # Feature flags & checks (business logic)
```

### Design Principles

1. **Strongly Typed**: All plans use `InsightPlanId` union type (no string literals)
2. **Immutable**: All properties marked `readonly` (enforced at compile time)
3. **Framework-Agnostic**: Pure TypeScript (no Node/browser dependencies)
4. **Centralized**: Single config consumed by CLI, SDK, VS Code extension, and Cloud

## Available Plans

### INSIGHT_FREE

**Price**: $0/month  
**Target**: Individual developers, open-source projects  
**SKU**: `insight_free_v1`

**Limits**:
- Max Projects: 3
- Concurrent Analyses: 1
- Files per Analysis: 100
- History Retention: 7 days

**Features**:
- 3 core detectors: TypeScript, ESLint, Import
- Local CLI analysis
- Basic VS Code extension

**Restrictions**:
- ❌ No cloud dashboard
- ❌ No team collaboration
- ❌ No advanced detectors

---

### INSIGHT_PRO ⭐ POPULAR

**Price**: $29/month ($290/year, save 17%)  
**Target**: Professional developers, freelancers  
**SKU**: `insight_pro_v1`

**Limits**:
- Max Projects: 10
- Concurrent Analyses: 3
- Files per Analysis: 1,000
- History Retention: 90 days

**Features**:
- 11 stable detectors (all production-ready)
- ✅ Cloud dashboard enabled
- ✅ Historical trend analysis
- ✅ VS Code cloud sync
- Email support

**Detectors**:
- TypeScript | ESLint | Import | Package | Runtime
- Build | Security | Circular | Network | Performance | Complexity

---

### INSIGHT_TEAM

**Price**: $99/month ($990/year, save 17%)  
**Target**: Small teams (2-10 developers)  
**SKU**: `insight_team_v1`

**Limits**:
- Max Projects: 50
- Concurrent Analyses: 10
- Files per Analysis: 5,000
- History Retention: 180 days

**Features**:
- 14 detectors (including experimental)
- ✅ Team collaboration
- ✅ Shared workspaces
- ✅ Role-based access
- ✅ Slack/Teams integration
- Priority email support

**Additional Detectors**:
- All PRO detectors +
- Python Types | Python Security | Python Complexity

---

### INSIGHT_ENTERPRISE

**Price**: $299/month ($2,990/year, save 17%)  
**Target**: Large teams, enterprises  
**SKU**: `insight_enterprise_v1`

**Limits**:
- Max Projects: **Unlimited**
- Concurrent Analyses: **Unlimited**
- Files per Analysis: **Unlimited**
- History Retention: 365 days

**Features**:
- **All 15 detectors** (including experimental)
- ✅ SSO & SAML
- ✅ Audit logs
- ✅ RBAC
- ✅ On-premise deployment
- ✅ White-label branding
- ✅ Custom detectors
- ✅ Compliance reports (SOC 2, HIPAA)
- ✅ Dedicated support (SLA)

**Enterprise-Specific Detectors**:
- All TEAM detectors +
- CVE Scanner (experimental) | Next.js (experimental)

---

## Configuration Files

### insight-product.ts

**Purpose**: Define plan metadata, pricing, and limits

**Key Types**:

```typescript
export type InsightPlanId = 
  | 'INSIGHT_FREE' 
  | 'INSIGHT_PRO' 
  | 'INSIGHT_TEAM' 
  | 'INSIGHT_ENTERPRISE';

export interface InsightPlan {
  readonly id: InsightPlanId;
  readonly sku: string;
  readonly displayName: string;
  readonly monthlyPrice: number;
  readonly yearlyPrice: number;
  readonly maxProjects: number;
  readonly maxConcurrentAnalyses: number;
  readonly maxFilesPerAnalysis: number;
  readonly historicalRetentionDays: number;
  readonly cloudDashboardEnabled: boolean;
  readonly teamCollaborationEnabled: boolean;
  readonly ssoAndAuditEnabled: boolean;
  readonly enabledDetectors: readonly string[];
  readonly features: readonly string[];
  readonly description: string;
  readonly popular?: boolean;
}
```

**Exported Functions**:
- `getInsightPlan(planId)` - Get plan by ID
- `getAllInsightPlanIds()` - Get all plan IDs
- `isValidInsightPlanId(planId)` - Validate plan ID
- `getInsightPlanBySku(sku)` - Lookup by SKU

### insight-entitlements.ts

**Purpose**: Check feature access and enforce limits

**Key Functions**:

```typescript
// Feature Checks
canRunCloudAnalysis(planId: InsightPlanId): boolean
canUseVSCodeCloudLink(planId: InsightPlanId): boolean
canUseTeamCollaboration(planId: InsightPlanId): boolean

// Limit Checks
getAnalysisLimits(planId: InsightPlanId): AnalysisLimits
isWithinLimits(planId, usage): boolean

// Enterprise Features
isEnterpriseFeatureEnabled(planId, feature): boolean

// Detector Access
isDetectorEnabled(planId, detectorName): boolean
getEnabledDetectors(planId): string[]

// Context-Aware Checks
checkEntitlement(context, feature): { allowed: boolean; reason?: string }

// Upgrade Recommendations
getUpgradeRecommendation(currentPlan, desiredFeature): InsightPlanId | null
```

---

## Usage Examples

### CLI

```bash
# Show current plan
odavl insight plan

# Show as JSON
odavl insight plan --json

# Show all available plans
odavl insight plans
```

### TypeScript/SDK

```typescript
import { 
  getInsightPlan, 
  canRunCloudAnalysis,
  getAnalysisLimits
} from '@odavl-studio/insight-core/config/insight-entitlements';

// Check if user can access cloud dashboard
const canAccessCloud = canRunCloudAnalysis('INSIGHT_PRO'); // true

// Get limits for plan
const limits = getAnalysisLimits('INSIGHT_FREE');
console.log(limits.maxProjects); // 3

// Check detector availability
import { isDetectorEnabled } from '@odavl-studio/insight-core/config/insight-entitlements';
const hasSecurityDetector = isDetectorEnabled('INSIGHT_PRO', 'security'); // true
```

### VS Code Extension

```typescript
import { checkEntitlement } from '@odavl-studio/insight-core/config/insight-entitlements';

// Context-aware entitlement check
const result = checkEntitlement({
  planId: 'INSIGHT_FREE',
  isTrial: true,
  customEntitlements: { 'cloud_dashboard': true }
}, 'sso');

if (!result.allowed) {
  vscode.window.showWarningMessage(`SSO not available: ${result.reason}`);
}
```

---

## How to Add a New Plan

### Step 1: Update Type Definition

Edit `insight-product.ts`:

```typescript
export type InsightPlanId = 
  | 'INSIGHT_FREE' 
  | 'INSIGHT_PRO' 
  | 'INSIGHT_TEAM' 
  | 'INSIGHT_ENTERPRISE'
  | 'INSIGHT_STARTUP'; // NEW
```

### Step 2: Add Plan Configuration

Add to `INSIGHT_PLANS` constant:

```typescript
export const INSIGHT_PLANS: Record<InsightPlanId, InsightPlan> = {
  // ... existing plans
  
  INSIGHT_STARTUP: {
    id: 'INSIGHT_STARTUP',
    sku: 'insight_startup_v1',
    displayName: 'Startup Plan',
    monthlyPrice: 49,
    yearlyPrice: 490,
    maxProjects: 20,
    maxConcurrentAnalyses: 5,
    maxFilesPerAnalysis: 2000,
    historicalRetentionDays: 120,
    cloudDashboardEnabled: true,
    teamCollaborationEnabled: true,
    ssoAndAuditEnabled: false,
    enabledDetectors: [
      'typescript', 'eslint', 'import', 'package', 
      'runtime', 'build', 'security', 'circular',
      'network', 'performance', 'complexity', 'isolation'
    ],
    features: [
      'Cloud Dashboard',
      'Team Collaboration (up to 5 users)',
      '12 Detectors',
      'Priority Support',
      'API Access'
    ],
    description: 'Perfect for growing startups and small teams',
    popular: false,
  },
};
```

### Step 3: Update Entitlements (if needed)

If new plan has unique features:

```typescript
// insight-entitlements.ts
export function canUseCustomFeature(planId: InsightPlanId): boolean {
  return planId === 'INSIGHT_STARTUP' || planId === 'INSIGHT_ENTERPRISE';
}
```

### Step 4: Build and Test

```bash
# Build Insight core
cd odavl-studio/insight/core
pnpm build

# Test CLI command
odavl insight plans

# Run unit tests (when available)
pnpm test insight-entitlements
```

### Step 5: Commit

```bash
git add odavl-studio/insight/core/src/config/
git commit -m "feat(insight): Add INSIGHT_STARTUP plan"
```

---

## How to Change Limits Safely

### Step 1: Modify Plan Config

Edit `insight-product.ts` → `INSIGHT_PLANS` constant:

```typescript
INSIGHT_PRO: {
  // ... other fields
  maxProjects: 15, // Changed from 10
  maxConcurrentAnalyses: 5, // Changed from 3
}
```

### Step 2: Check Impact

Consider:
- Are existing users affected?
- Do we need to grandfather old limits?
- Should this be a new SKU version?

### Step 3: Build and Verify

```bash
pnpm build
pnpm typecheck
```

### Step 4: Update Documentation

Update this file and any marketing materials.

### Step 5: Commit with Clear Description

```bash
git commit -m "feat(insight): Increase PRO plan limits

- Max projects: 10 → 15
- Concurrent analyses: 3 → 5

Effective: January 2026
Applies to: New and existing PRO subscribers"
```

---

## Unlimited Value Convention

**Pattern**: Use `-1` to represent unlimited limits

```typescript
maxProjects: -1 // Unlimited
```

**Helper Function**: `formatLimit(limit: number): string`

```typescript
formatLimit(10);  // "10"
formatLimit(-1);  // "Unlimited"
```

---

## Integration Points

### 1. CLI (`apps/studio-cli`)

- Command: `odavl insight plan` → reads from entitlements module
- Mock: Currently uses hardcoded `'INSIGHT_FREE'` (to be replaced with license check)

### 2. SDK (`packages/sdk`)

- Exports: Re-exports `insight-product` and `insight-entitlements` via `@odavl-studio/sdk/insight`

### 3. VS Code Extension (`odavl-studio/insight/extension`)

- Usage: Checks detector availability before running analysis
- Shows: Upgrade prompts when feature not available

### 4. Cloud Dashboard (`odavl-studio/insight/cloud`)

- Syncs: User's plan from Stripe webhook
- Enforces: Limits in database via Prisma middleware

---

## Security Considerations

### DO ✅

- Always validate plan IDs using `isValidInsightPlanId()`
- Use entitlement functions (never check plan ID directly)
- Log entitlement denials for audit
- Mark sensitive features with enterprise-only flags

### DON'T ❌

- Hardcode plan IDs in UI/logic (use config functions)
- Allow client-side plan upgrades (server-side only)
- Expose Stripe price IDs in config (keep in backend)
- Skip entitlement checks ("temporary access")

---

## Migration Strategy

### Phase 1: Config Layer (Current)

- ✅ Central plan definitions
- ✅ Entitlement functions
- ✅ CLI integration (read-only)
- ✅ Documentation

### Phase 2: License System (Next)

- Add license key validation
- Replace mock `getCurrentPlanId()` with real license check
- Store user's plan in local config (`~/.odavl/license.json`)

### Phase 3: Stripe Integration

- Map SKUs to Stripe price IDs
- Handle subscription webhooks
- Sync plan to database

### Phase 4: Enforcement

- Add middleware to enforce limits
- Block features for non-entitled users
- Show upgrade prompts

---

## FAQ

### Q: Can I change a plan's price?

**A**: Yes, but consider:
1. Grandfather existing subscribers at old price
2. Create new SKU version (e.g., `insight_pro_v2`)
3. Update Stripe product/price

### Q: How do I add a temporary trial?

**A**: Use `EntitlementContext`:

```typescript
checkEntitlement({
  planId: 'INSIGHT_FREE',
  isTrial: true, // Enables PRO features for trial
}, 'cloud_dashboard');
```

### Q: What if I need per-user pricing?

**A**: Add to `EntitlementContext`:

```typescript
checkEntitlement({
  planId: 'INSIGHT_TEAM',
  userCount: 8, // Enforce team size limits
}, 'team_collaboration');
```

### Q: Can I override entitlements for internal testing?

**A**: Yes, use `isInternalPreview`:

```typescript
checkEntitlement({
  planId: 'INSIGHT_FREE',
  isInternalPreview: true, // Full access for dogfooding
});
```

---

## Related Documentation

- [Billing System](../BILLING_SYSTEM.md) - Platform-wide billing
- [Tier Features](../TIER_FEATURES.md) - Feature matrix
- [Insight Architecture](ARCHITECTURE.md) - Overall Insight architecture

---

**Next Steps**:

1. Implement license key validation
2. Add unit tests for entitlements
3. Wire to Stripe for production billing
4. Add usage tracking middleware

**Maintainers**: @product-team @engineering-leads  
**Last Review**: December 11, 2025
