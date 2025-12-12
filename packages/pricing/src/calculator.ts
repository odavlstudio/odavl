import { pricingPlans, type PricingPlan } from './plans';

/**
 * Pricing Calculator
 * 
 * Helps users estimate costs based on their usage patterns
 */

export interface UsageEstimate {
  apiCallsPerMonth: number;
  scansPerMonth: number;
  testsPerMonth: number;
  teamMembers: number;
  dataRetentionDays: number;
}

export interface PricingRecommendation {
  recommendedPlan: PricingPlan;
  alternativePlans: PricingPlan[];
  estimatedMonthlyCost: number;
  estimatedYearlyCost: number;
  yearlyDiscount: number;
  reasons: string[];
  warnings?: string[];
}

/**
 * Calculate recommended plan based on usage
 */
export function calculateRecommendedPlan(usage: UsageEstimate): PricingRecommendation {
  const plans = Object.values(pricingPlans);
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Find best fit plan
  let recommendedPlan: PricingPlan = pricingPlans.free;

  // Check API calls
  if (usage.apiCallsPerMonth > 100) {
    if (usage.apiCallsPerMonth <= 1000) {
      recommendedPlan = pricingPlans.pro;
      reasons.push(`Pro plan supports up to 1,000 API calls/month (you need ${usage.apiCallsPerMonth})`);
    } else {
      recommendedPlan = pricingPlans.enterprise;
      reasons.push(`Enterprise plan provides unlimited API calls (you need ${usage.apiCallsPerMonth})`);
    }
  }

  // Check scans
  if (usage.scansPerMonth > 50) {
    if (usage.scansPerMonth <= 500) {
      if (recommendedPlan.id === 'free') {
        recommendedPlan = pricingPlans.pro;
        reasons.push(`Pro plan supports up to 500 scans/month (you need ${usage.scansPerMonth})`);
      }
    } else {
      recommendedPlan = pricingPlans.enterprise;
      reasons.push(`Enterprise plan provides unlimited scans (you need ${usage.scansPerMonth})`);
    }
  }

  // Check team members
  if (usage.teamMembers > 10) {
    recommendedPlan = pricingPlans.enterprise;
    reasons.push(`Enterprise plan supports unlimited team members (you need ${usage.teamMembers})`);
  } else if (usage.teamMembers > 1 && recommendedPlan.id === 'free') {
    recommendedPlan = pricingPlans.pro;
    reasons.push(`Pro plan supports up to 10 team members (you need ${usage.teamMembers})`);
  }

  // Check data retention
  if (usage.dataRetentionDays > 90) {
    if (recommendedPlan.id !== 'enterprise') {
      warnings.push(`Your desired retention (${usage.dataRetentionDays} days) requires Enterprise plan (365 days)`);
    }
    recommendedPlan = pricingPlans.enterprise;
  } else if (usage.dataRetentionDays > 7 && recommendedPlan.id === 'free') {
    recommendedPlan = pricingPlans.pro;
    reasons.push(`Pro plan offers 90-day retention (you need ${usage.dataRetentionDays} days)`);
  }

  // Get alternative plans
  const alternativePlans = plans.filter(p => p.id !== recommendedPlan.id);

  // Calculate costs
  const estimatedMonthlyCost = recommendedPlan.price;
  const estimatedYearlyCost = recommendedPlan.yearlyPrice;
  const yearlyDiscount = (recommendedPlan.price * 12) - recommendedPlan.yearlyPrice;

  return {
    recommendedPlan,
    alternativePlans,
    estimatedMonthlyCost,
    estimatedYearlyCost,
    yearlyDiscount,
    reasons: reasons.length > 0 ? reasons : ['Free plan meets your needs'],
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Compare two plans
 */
export function comparePlans(planId1: string, planId2: string): {
  plan1: PricingPlan;
  plan2: PricingPlan;
  differences: string[];
} {
  const plan1 = pricingPlans[planId1];
  const plan2 = pricingPlans[planId2];

  if (!plan1 || !plan2) {
    throw new Error('Invalid plan IDs');
  }

  const differences: string[] = [];

  // Price difference
  const priceDiff = plan2.price - plan1.price;
  if (priceDiff !== 0) {
    differences.push(`Price: ${plan2.name} costs $${Math.abs(priceDiff)}/mo ${priceDiff > 0 ? 'more' : 'less'}`);
  }

  // Feature differences
  if (plan1.features.detectors !== plan2.features.detectors) {
    differences.push(`Detectors: ${plan1.name} has ${plan1.features.detectors}, ${plan2.name} has ${plan2.features.detectors}`);
  }

  if (plan1.features.mlFeatures !== plan2.features.mlFeatures) {
    differences.push(`ML Features: ${plan2.features.mlFeatures ? plan2.name : plan1.name} includes ML features`);
  }

  if (plan1.features.customRecipes !== plan2.features.customRecipes) {
    differences.push(`Custom Recipes: ${plan2.features.customRecipes ? plan2.name : plan1.name} supports custom recipes`);
  }

  return { plan1, plan2, differences };
}

/**
 * Estimate overage costs (for Pro plan exceeding limits)
 */
export function estimateOverageCosts(planId: string, usage: UsageEstimate): {
  basePrice: number;
  overageCosts: number;
  totalCost: number;
  overageDetails: Array<{ resource: string; overage: number; cost: number }>;
} {
  const plan = pricingPlans[planId];
  if (!plan || plan.id === 'enterprise') {
    return { basePrice: plan?.price || 0, overageCosts: 0, totalCost: plan?.price || 0, overageDetails: [] };
  }

  const overageDetails: Array<{ resource: string; overage: number; cost: number }> = [];
  let overageCosts = 0;

  // Overage rates (example - adjust as needed)
  const rates = {
    apiCall: 0.01,    // $0.01 per extra API call
    scan: 0.05,       // $0.05 per extra scan
    test: 0.10,       // $0.10 per extra test
    teamMember: 5.00, // $5/mo per extra team member
  };

  // Calculate overages
  if (plan.limits.apiCallsPerMonth !== 'unlimited') {
    const overage = Math.max(0, usage.apiCallsPerMonth - plan.limits.apiCallsPerMonth);
    if (overage > 0) {
      const cost = overage * rates.apiCall;
      overageDetails.push({ resource: 'API Calls', overage, cost });
      overageCosts += cost;
    }
  }

  if (plan.limits.scansPerMonth !== 'unlimited') {
    const overage = Math.max(0, usage.scansPerMonth - plan.limits.scansPerMonth);
    if (overage > 0) {
      const cost = overage * rates.scan;
      overageDetails.push({ resource: 'Scans', overage, cost });
      overageCosts += cost;
    }
  }

  if (plan.limits.testsPerMonth !== 'unlimited') {
    const overage = Math.max(0, usage.testsPerMonth - plan.limits.testsPerMonth);
    if (overage > 0) {
      const cost = overage * rates.test;
      overageDetails.push({ resource: 'Tests', overage, cost });
      overageCosts += cost;
    }
  }

  if (plan.limits.teamMembers !== 'unlimited') {
    const overage = Math.max(0, usage.teamMembers - plan.limits.teamMembers);
    if (overage > 0) {
      const cost = overage * rates.teamMember;
      overageDetails.push({ resource: 'Team Members', overage, cost });
      overageCosts += cost;
    }
  }

  return {
    basePrice: plan.price,
    overageCosts: Math.round(overageCosts * 100) / 100, // Round to 2 decimals
    totalCost: Math.round((plan.price + overageCosts) * 100) / 100,
    overageDetails,
  };
}

export default {
  calculateRecommendedPlan,
  comparePlans,
  estimateOverageCosts,
};
