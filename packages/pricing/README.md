# @odavl-studio/pricing

Pricing system for ODAVL Studio - shared package for pricing plans, calculator, and usage tracking.

## Features

- **Pricing Plans**: Free, Pro, Enterprise tiers with complete feature definitions
- **Cost Calculator**: Recommend plans based on usage patterns
- **Usage Tracking**: Monitor API calls, scans, tests, and resource consumption
- **Overage Estimation**: Calculate costs when exceeding plan limits
- **Plan Comparison**: Side-by-side feature and price comparisons

## Installation

```bash
pnpm add @odavl-studio/pricing
```

## Usage

### Get Pricing Plans

```typescript
import { pricingPlans, getPlan } from '@odavl-studio/pricing';

// Get all plans
console.log(pricingPlans);

// Get specific plan
const proPlan = getPlan('pro');
console.log(proPlan.price); // 29
console.log(proPlan.yearlyPrice); // 290
```

### Calculate Recommended Plan

```typescript
import { calculateRecommendedPlan } from '@odavl-studio/pricing/calculator';

const recommendation = calculateRecommendedPlan({
  apiCallsPerMonth: 500,
  scansPerMonth: 200,
  testsPerMonth: 100,
  teamMembers: 5,
  dataRetentionDays: 30,
});

console.log(recommendation.recommendedPlan.name); // "Pro"
console.log(recommendation.reasons); // ["Pro plan supports up to 1,000 API calls/month..."]
console.log(recommendation.yearlyDiscount); // 58
```

### Track Usage

```typescript
import {
  getCurrentBillingPeriod,
  calculateUsagePercentage,
  checkLimitWarnings,
} from '@odavl-studio/pricing/usage';

// Get current billing period
const period = getCurrentBillingPeriod(new Date('2025-01-01'));
console.log(period.daysRemaining); // e.g., 12

// Calculate usage percentage
const percentage = calculateUsagePercentage(750, 1000);
console.log(percentage); // 75

// Check for warnings
const warnings = checkLimitWarnings(
  { apiCalls: 850, scans: 400, tests: 150 },
  { apiCallsPerMonth: 1000, scansPerMonth: 500, testsPerMonth: 200 }
);
console.log(warnings); // [{ resource: "API Calls", percentage: 85, warning: "..." }]
```

### Compare Plans

```typescript
import { comparePlans } from '@odavl-studio/pricing/calculator';

const comparison = comparePlans('pro', 'enterprise');
console.log(comparison.differences);
// [
//   "Price: Enterprise costs $170/mo more",
//   "Detectors: Pro has all, Enterprise has all-plus-custom",
//   ...
// ]
```

## Pricing Plans Overview

| Plan | Price | API Calls | Projects | Support |
|------|-------|-----------|----------|---------|
| Free | $0/mo | 100/mo | 3 | Community |
| Pro | $29/mo | 1,000/mo | Unlimited | Priority |
| Enterprise | $199/mo | Unlimited | Unlimited | Dedicated |

## Exports

```typescript
// Main exports
export { pricingPlans, getPlan, calculateYearlySavings, checkPlanLimits } from './plans';

// Calculator
export {
  calculateRecommendedPlan,
  comparePlans,
  estimateOverageCosts,
} from './calculator';

// Usage tracking
export {
  getCurrentBillingPeriod,
  calculateUsagePercentage,
  predictMonthlyUsage,
  checkLimitWarnings,
  aggregateUsageTrends,
} from './usage';
```

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import type {
  PricingPlan,
  PlanFeatures,
  PlanLimits,
  SupportLevel,
  UsageEstimate,
  PricingRecommendation,
  UsageMetrics,
  UsageTrend,
} from '@odavl-studio/pricing';
```

## Development

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT © 2025 ODAVL Studio
