/**
 * Stripe Client Initialization
 * Phase 3.0.4: Billing & Payments (EU-first)
 * 
 * Initializes Stripe SDK with EU-compatible settings
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

/**
 * Stripe client configured for EU/Germany operations
 * 
 * Configuration:
 * - API Version: Latest (2024-12-18.acacia)
 * - Locale: de (German)
 * - TypeScript: Enabled
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'ODAVL Insight',
    version: '3.0.4',
    url: 'https://insight.odavl.studio',
  },
});

/**
 * Webhook secret for signature verification
 * Required for secure webhook processing
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_WEBHOOK_SECRET not set - webhook signature verification disabled');
}
