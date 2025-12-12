/**
 * ODAVL Studio Pricing Plans
 * 
 * Three tiers: Free, Pro, Enterprise
 * Based on projects, API calls, features, and support
 */

export interface PricingPlan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: number; // USD per month
  yearlyPrice: number; // USD per year (with discount)
  currency: 'USD';
  features: PlanFeatures;
  limits: PlanLimits;
  support: SupportLevel;
  sla?: string; // Service Level Agreement (Enterprise only)
}

export interface PlanFeatures {
  projects: number | 'unlimited';
  detectors: 'basic' | 'all' | 'all-plus-custom';
  mlFeatures: boolean;
  customRecipes: boolean;
  analytics: 'basic' | 'advanced' | 'enterprise';
  dataRetention: number; // days
  apiAccess: boolean;
  webhooks: boolean;
  sso: boolean;
  saml: boolean;
  onPremise: boolean;
  customTraining: boolean;
}

export interface PlanLimits {
  apiCallsPerMonth: number | 'unlimited';
  scansPerMonth: number | 'unlimited';
  testsPerMonth: number | 'unlimited';
  teamMembers: number | 'unlimited';
}

export type SupportLevel = 'community' | 'priority' | 'dedicated';

/**
 * Pricing Plans Definition
 */
export const pricingPlans: Record<string, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    currency: 'USD',
    features: {
      projects: 3,
      detectors: 'basic',
      mlFeatures: false,
      customRecipes: false,
      analytics: 'basic',
      dataRetention: 7,
      apiAccess: true,
      webhooks: false,
      sso: false,
      saml: false,
      onPremise: false,
      customTraining: false,
    },
    limits: {
      apiCallsPerMonth: 100,
      scansPerMonth: 50,
      testsPerMonth: 10,
      teamMembers: 1,
    },
    support: 'community',
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    yearlyPrice: 290, // ~17% discount (2 months free)
    currency: 'USD',
    features: {
      projects: 'unlimited',
      detectors: 'all',
      mlFeatures: true,
      customRecipes: true,
      analytics: 'advanced',
      dataRetention: 90,
      apiAccess: true,
      webhooks: true,
      sso: false,
      saml: false,
      onPremise: false,
      customTraining: false,
    },
    limits: {
      apiCallsPerMonth: 1000,
      scansPerMonth: 500,
      testsPerMonth: 200,
      teamMembers: 10,
    },
    support: 'priority',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    yearlyPrice: 1990, // ~17% discount
    currency: 'USD',
    features: {
      projects: 'unlimited',
      detectors: 'all-plus-custom',
      mlFeatures: true,
      customRecipes: true,
      analytics: 'enterprise',
      dataRetention: 365,
      apiAccess: true,
      webhooks: true,
      sso: true,
      saml: true,
      onPremise: true,
      customTraining: true,
    },
    limits: {
      apiCallsPerMonth: 'unlimited',
      scansPerMonth: 'unlimited',
      testsPerMonth: 'unlimited',
      teamMembers: 'unlimited',
    },
    support: 'dedicated',
    sla: '99.9% uptime guarantee',
  },
};

/**
 * Get pricing plan by ID
 */
export function getPlan(planId: string): PricingPlan | undefined {
  return pricingPlans[planId];
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(planId: string): number {
  const plan = getPlan(planId);
  if (!plan) return 0;
  
  const monthlyTotal = plan.price * 12;
  const yearlySavings = monthlyTotal - plan.yearlyPrice;
  return yearlySavings;
}

/**
 * Check if user's usage fits within plan limits
 */
export function checkPlanLimits(
  planId: string,
  usage: {
    apiCalls: number;
    scans: number;
    tests: number;
    teamMembers: number;
  }
): { withinLimits: boolean; exceeded: string[] } {
  const plan = getPlan(planId);
  if (!plan) return { withinLimits: false, exceeded: ['Invalid plan'] };

  const exceeded: string[] = [];

  if (plan.limits.apiCallsPerMonth !== 'unlimited' && usage.apiCalls > plan.limits.apiCallsPerMonth) {
    exceeded.push('API calls');
  }
  if (plan.limits.scansPerMonth !== 'unlimited' && usage.scans > plan.limits.scansPerMonth) {
    exceeded.push('Scans');
  }
  if (plan.limits.testsPerMonth !== 'unlimited' && usage.tests > plan.limits.testsPerMonth) {
    exceeded.push('Tests');
  }
  if (plan.limits.teamMembers !== 'unlimited' && usage.teamMembers > plan.limits.teamMembers) {
    exceeded.push('Team members');
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}

export default pricingPlans;
