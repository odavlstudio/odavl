/**
 * Stripe Product/Price Mapping for ODAVL Insight
 * 
 * Maps InsightPlanId → Stripe product/price IDs for billing integration.
 * 
 * Architecture:
 * - Single source of truth for Stripe IDs per plan
 * - Supports monthly and yearly billing cycles
 * - Environment-driven (staging/production)
 * - Future-ready for metered billing
 */

// Import InsightPlanId type from Insight core
// NOTE: This creates a dependency on @odavl-studio/insight-core being built first
export type InsightPlanId = 'INSIGHT_FREE' | 'INSIGHT_PRO' | 'INSIGHT_TEAM' | 'INSIGHT_ENTERPRISE';

/**
 * Stripe product and price IDs for an Insight plan
 */
export interface StripeInsightMapping {
  readonly productId: string;          // Stripe product ID (e.g., prod_xxxxx)
  readonly priceIdMonthly: string;     // Stripe price ID for monthly billing
  readonly priceIdYearly: string;      // Stripe price ID for yearly billing
  readonly meteredPriceId?: string;    // Future: metered usage price ID
}

/**
 * Environment-specific Stripe configuration
 * 
 * IMPORTANT: These are PLACEHOLDER IDs for development.
 * Replace with real Stripe IDs before deploying to staging/production.
 * 
 * To get real IDs:
 * 1. Go to https://dashboard.stripe.com/products
 * 2. Create products for each Insight plan
 * 3. Create prices (monthly + yearly) for each product
 * 4. Copy IDs to environment variables or replace constants below
 */

/**
 * Development/Test Mode IDs (placeholder - will fail in test mode)
 */
const DEV_STRIPE_IDS: Record<InsightPlanId, StripeInsightMapping> = {
  INSIGHT_FREE: {
    productId: 'prod_insight_free_dev',
    priceIdMonthly: 'price_insight_free_monthly_dev',
    priceIdYearly: 'price_insight_free_yearly_dev',
  },
  INSIGHT_PRO: {
    productId: 'prod_insight_pro_dev',
    priceIdMonthly: 'price_insight_pro_monthly_dev',
    priceIdYearly: 'price_insight_pro_yearly_dev',
  },
  INSIGHT_TEAM: {
    productId: 'prod_insight_team_dev',
    priceIdMonthly: 'price_insight_team_monthly_dev',
    priceIdYearly: 'price_insight_team_yearly_dev',
  },
  INSIGHT_ENTERPRISE: {
    productId: 'prod_insight_enterprise_dev',
    priceIdMonthly: 'price_insight_enterprise_monthly_dev',
    priceIdYearly: 'price_insight_enterprise_yearly_dev',
  },
};

/**
 * Production Stripe IDs (replace with real values from Stripe Dashboard)
 * 
 * Environment variables (preferred):
 * - STRIPE_INSIGHT_FREE_PRODUCT_ID
 * - STRIPE_INSIGHT_FREE_MONTHLY_PRICE_ID
 * - STRIPE_INSIGHT_FREE_YEARLY_PRICE_ID
 * - STRIPE_INSIGHT_PRO_PRODUCT_ID
 * - STRIPE_INSIGHT_PRO_MONTHLY_PRICE_ID
 * - STRIPE_INSIGHT_PRO_YEARLY_PRICE_ID
 * - STRIPE_INSIGHT_TEAM_PRODUCT_ID
 * - STRIPE_INSIGHT_TEAM_MONTHLY_PRICE_ID
 * - STRIPE_INSIGHT_TEAM_YEARLY_PRICE_ID
 * - STRIPE_INSIGHT_ENTERPRISE_PRODUCT_ID
 * - STRIPE_INSIGHT_ENTERPRISE_MONTHLY_PRICE_ID
 * - STRIPE_INSIGHT_ENTERPRISE_YEARLY_PRICE_ID
 */
const PROD_STRIPE_IDS: Record<InsightPlanId, StripeInsightMapping> = {
  INSIGHT_FREE: {
    productId: process.env.STRIPE_INSIGHT_FREE_PRODUCT_ID || 'prod_REPLACE_ME_FREE',
    priceIdMonthly: process.env.STRIPE_INSIGHT_FREE_MONTHLY_PRICE_ID || 'price_REPLACE_ME_FREE_MONTHLY',
    priceIdYearly: process.env.STRIPE_INSIGHT_FREE_YEARLY_PRICE_ID || 'price_REPLACE_ME_FREE_YEARLY',
  },
  INSIGHT_PRO: {
    productId: process.env.STRIPE_INSIGHT_PRO_PRODUCT_ID || 'prod_REPLACE_ME_PRO',
    priceIdMonthly: process.env.STRIPE_INSIGHT_PRO_MONTHLY_PRICE_ID || 'price_REPLACE_ME_PRO_MONTHLY',
    priceIdYearly: process.env.STRIPE_INSIGHT_PRO_YEARLY_PRICE_ID || 'price_REPLACE_ME_PRO_YEARLY',
  },
  INSIGHT_TEAM: {
    productId: process.env.STRIPE_INSIGHT_TEAM_PRODUCT_ID || 'prod_REPLACE_ME_TEAM',
    priceIdMonthly: process.env.STRIPE_INSIGHT_TEAM_MONTHLY_PRICE_ID || 'price_REPLACE_ME_TEAM_MONTHLY',
    priceIdYearly: process.env.STRIPE_INSIGHT_TEAM_YEARLY_PRICE_ID || 'price_REPLACE_ME_TEAM_YEARLY',
  },
  INSIGHT_ENTERPRISE: {
    productId: process.env.STRIPE_INSIGHT_ENTERPRISE_PRODUCT_ID || 'prod_REPLACE_ME_ENTERPRISE',
    priceIdMonthly: process.env.STRIPE_INSIGHT_ENTERPRISE_MONTHLY_PRICE_ID || 'price_REPLACE_ME_ENTERPRISE_MONTHLY',
    priceIdYearly: process.env.STRIPE_INSIGHT_ENTERPRISE_YEARLY_PRICE_ID || 'price_REPLACE_ME_ENTERPRISE_YEARLY',
  },
};

/**
 * Get Stripe mapping based on environment
 */
function getStripeMapping(): Record<InsightPlanId, StripeInsightMapping> {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? PROD_STRIPE_IDS : DEV_STRIPE_IDS;
}

/**
 * Get Stripe product ID for an Insight plan
 * 
 * @param planId - Insight plan ID
 * @returns Stripe product ID (e.g., "prod_xxxxx")
 * @throws Error if plan ID is invalid
 */
export function getStripeProductForInsightPlan(planId: InsightPlanId): string {
  const mapping = getStripeMapping()[planId];
  if (!mapping) {
    throw new Error(`Invalid InsightPlanId: ${planId}`);
  }
  return mapping.productId;
}

/**
 * Get Stripe price IDs for an Insight plan (monthly + yearly)
 * 
 * @param planId - Insight plan ID
 * @returns Object with monthly and yearly price IDs
 * @throws Error if plan ID is invalid
 */
export function getStripePricesForInsightPlan(planId: InsightPlanId): {
  monthly: string;
  yearly: string;
  metered?: string;
} {
  const mapping = getStripeMapping()[planId];
  if (!mapping) {
    throw new Error(`Invalid InsightPlanId: ${planId}`);
  }
  return {
    monthly: mapping.priceIdMonthly,
    yearly: mapping.priceIdYearly,
    metered: mapping.meteredPriceId,
  };
}

/**
 * Get specific price ID for an Insight plan and billing cycle
 * 
 * @param planId - Insight plan ID
 * @param billingCycle - 'monthly' or 'yearly'
 * @returns Stripe price ID
 * @throws Error if plan ID or billing cycle is invalid
 */
export function getStripePriceId(
  planId: InsightPlanId,
  billingCycle: 'monthly' | 'yearly'
): string {
  const prices = getStripePricesForInsightPlan(planId);
  return billingCycle === 'monthly' ? prices.monthly : prices.yearly;
}

/**
 * Get all Stripe mappings for Insight plans
 * 
 * Useful for admin dashboards or debugging.
 * 
 * @returns Complete mapping of all Insight plans to Stripe IDs
 */
export function getAllStripeInsightMappings(): Record<InsightPlanId, StripeInsightMapping> {
  return getStripeMapping();
}

/**
 * Validate Stripe IDs are properly configured
 * 
 * Checks if placeholder IDs are still in use in production.
 * Call this on server startup to fail fast.
 * 
 * @throws Error if production IDs contain placeholders
 */
export function validateStripeInsightConfiguration(): void {
  if (process.env.NODE_ENV !== 'production') {
    // Skip validation in development
    return;
  }

  const mappings = getStripeMapping();
  const errors: string[] = [];

  for (const [planId, mapping] of Object.entries(mappings)) {
    if (mapping.productId.includes('REPLACE_ME')) {
      errors.push(`${planId}: productId not configured`);
    }
    if (mapping.priceIdMonthly.includes('REPLACE_ME')) {
      errors.push(`${planId}: priceIdMonthly not configured`);
    }
    if (mapping.priceIdYearly.includes('REPLACE_ME')) {
      errors.push(`${planId}: priceIdYearly not configured`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Stripe Insight configuration incomplete:\n${errors.join('\n')}\n\n` +
      `Set environment variables or update PROD_STRIPE_IDS in stripe-insight-mapping.ts`
    );
  }
}

/**
 * Reverse lookup: Get InsightPlanId from Stripe price ID
 * 
 * Useful for webhook handlers that receive Stripe price IDs.
 * 
 * @param priceId - Stripe price ID (monthly or yearly)
 * @returns InsightPlanId or undefined if not found
 */
export function getInsightPlanFromStripePriceId(priceId: string): InsightPlanId | undefined {
  const mappings = getStripeMapping();
  
  for (const [planId, mapping] of Object.entries(mappings) as [InsightPlanId, StripeInsightMapping][]) {
    if (
      mapping.priceIdMonthly === priceId ||
      mapping.priceIdYearly === priceId ||
      mapping.meteredPriceId === priceId
    ) {
      return planId;
    }
  }
  
  return undefined;
}

/**
 * Get billing cycle from Stripe price ID
 * 
 * @param priceId - Stripe price ID
 * @returns 'monthly' | 'yearly' | 'metered' | undefined
 */
export function getBillingCycleFromStripePriceId(priceId: string): 'monthly' | 'yearly' | 'metered' | undefined {
  const mappings = getStripeMapping();
  
  for (const mapping of Object.values(mappings)) {
    if (mapping.priceIdMonthly === priceId) return 'monthly';
    if (mapping.priceIdYearly === priceId) return 'yearly';
    if (mapping.meteredPriceId === priceId) return 'metered';
  }
  
  return undefined;
}
