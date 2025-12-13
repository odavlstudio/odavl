/**
 * Subscription Plan Definitions
 * Phase 3.0.4: Billing & Payments (EU-first)
 * 
 * Defines pricing tiers and Stripe integration
 */

import type { SubscriptionTier } from '@prisma/client';

export interface StripePlan {
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number; // EUR
  priceId: string; // Stripe Price ID
  features: string[];
  limits: {
    maxProjects: number;
    maxAnalysesPerMonth: number;
    maxStorageGB: number;
  };
}

/**
 * Stripe Price IDs (configured in Stripe Dashboard)
 * 
 * IMPORTANT: Replace with your actual Stripe Price IDs
 * These are test mode IDs - update for production
 */
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_ID_PRO || 'price_test_pro_monthly',
  TEAM_MONTHLY: process.env.STRIPE_PRICE_ID_TEAM || 'price_test_team_monthly',
} as const;

/**
 * Subscription plan definitions
 * 
 * FREE: Self-service, no payment required
 * PRO: Monthly subscription via Stripe
 * TEAM: Monthly subscription via Stripe (higher limits)
 * ENTERPRISE: Manual/custom pricing, no Stripe integration
 */
export const SUBSCRIPTION_PLANS: Record<string, StripePlan> = {
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    priceMonthly: 29, // EUR
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    features: [
      '100 analyses per month',
      '10 projects',
      '10 GB storage',
      'Priority support',
      'Advanced detectors',
      'PDF reports',
    ],
    limits: {
      maxProjects: 10,
      maxAnalysesPerMonth: 100,
      maxStorageGB: 10,
    },
  },
  TEAM: {
    tier: 'PRO', // Note: Using PRO tier internally, TEAM is future expansion
    name: 'Team',
    priceMonthly: 99, // EUR
    priceId: STRIPE_PRICE_IDS.TEAM_MONTHLY,
    features: [
      '500 analyses per month',
      '50 projects',
      '100 GB storage',
      'Team collaboration',
      'Priority support',
      'Advanced detectors',
      'PDF reports',
      'API access',
    ],
    limits: {
      maxProjects: 50,
      maxAnalysesPerMonth: 500,
      maxStorageGB: 100,
    },
  },
};

/**
 * Get plan by tier
 */
export function getPlanByTier(tier: SubscriptionTier): StripePlan | null {
  return SUBSCRIPTION_PLANS[tier] || null;
}

/**
 * Get plan by Stripe Price ID
 */
export function getPlanByPriceId(priceId: string): StripePlan | null {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId) || null;
}

/**
 * Check if tier requires Stripe subscription
 */
export function requiresStripeSubscription(tier: SubscriptionTier): boolean {
  return tier === 'PRO'; // ENTERPRISE is manual, FREE is self-service
}

/**
 * Get Stripe price ID for tier
 */
export function getStripePriceIdForTier(tier: SubscriptionTier): string | null {
  const plan = getPlanByTier(tier);
  return plan?.priceId || null;
}

/**
 * Success and cancel URLs for Stripe Checkout
 */
export const CHECKOUT_URLS = {
  success: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`
    : 'http://localhost:3000/dashboard/billing?success=true',
  cancel: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`
    : 'http://localhost:3000/dashboard/billing?canceled=true',
};
