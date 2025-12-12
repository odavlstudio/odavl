/**
 * Stripe Billing Client for ODAVL Studio
 * Handles subscriptions, payments, and customer management
 * 
 * CRITICAL: This is the ONLY place where Stripe client is instantiated.
 * All other modules MUST import from here, never create new Stripe().
 */

import Stripe from 'stripe';

/**
 * Get Stripe secret key from environment
 * 
 * In server/cloud contexts, this MUST be set.
 * In CLI contexts, we allow undefined and fail gracefully when billing functions are called.
 */
function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  
  // Only throw if we're in a server context (Next.js, API routes)
  const isServerContext = typeof window === 'undefined' && (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.VERCEL ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER
  );
  
  if (!key && isServerContext) {
    throw new Error(
      'STRIPE_SECRET_KEY is required in server context.\n' +
      'Set it in your environment variables or .env file.\n' +
      'For local development: Copy .env.example to .env.local'
    );
  }
  
  // Return empty string for CLI/non-server contexts (will fail at usage time)
  return key || '';
}

/**
 * Shared Stripe client instance
 * 
 * DO NOT create new Stripe() instances elsewhere in the codebase.
 * Always import this client: `import { stripe } from '@odavl-studio/billing'`
 */
export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: '2023-10-16',
  typescript: true,
  // Log to console in development
  ...(process.env.NODE_ENV !== 'production' && {
    // @ts-ignore - Stripe internal option
    telemetry: false,
  }),
});

/**
 * Webhook secret for validating Stripe webhook signatures
 * 
 * CRITICAL: This must be set in production to prevent webhook spoofing.
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Validate webhook secret is configured (call on server startup)
 */
export function validateStripeWebhookSecret(): void {
  if (process.env.NODE_ENV === 'production' && !STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is required in production.\n' +
      'Get it from: https://dashboard.stripe.com/webhooks\n' +
      'Set it in your environment variables.'
    );
  }
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface TierLimits {
  testRuns: number;
  monitorChecks: number;
  apiCalls: number;
  projects: number;
  teamMembers: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    testRuns: 100,
    monitorChecks: 1000,
    apiCalls: 10000,
    projects: 3,
    teamMembers: 3,
  },
  [SubscriptionTier.PRO]: {
    testRuns: 1000,
    monitorChecks: 10000,
    apiCalls: 100000,
    projects: 20,
    teamMembers: 10,
  },
  [SubscriptionTier.ENTERPRISE]: {
    testRuns: -1, // unlimited
    monitorChecks: -1,
    apiCalls: -1,
    projects: -1,
    teamMembers: -1,
  },
};

// Re-export Stripe type
export { Stripe };

// Re-export Insight billing modules
export * from './stripe-insight-mapping.js';
export * from './insight-billing.js';
