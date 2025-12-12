/**
 * @odavl-studio/pricing - Pricing system for ODAVL Studio
 * 
 * Provides pricing plans, calculator, and usage tracking utilities.
 */

export { pricingPlans, getPlan, calculateYearlySavings, checkPlanLimits } from './plans';
export type { PricingPlan, PlanFeatures, PlanLimits, SupportLevel } from './plans';

export {
  calculateRecommendedPlan,
  comparePlans,
  estimateOverageCosts,
} from './calculator';
export type { UsageEstimate, PricingRecommendation } from './calculator';

export {
  getCurrentBillingPeriod,
  calculateUsagePercentage,
  predictMonthlyUsage,
  checkLimitWarnings,
  aggregateUsageTrends,
} from './usage';
export type { UsageMetrics, UsageTrend } from './usage';
