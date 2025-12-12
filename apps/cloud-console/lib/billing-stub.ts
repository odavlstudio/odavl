/**
 * Billing Package Stub
 * Optional billing functionality - not yet implemented
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function createCheckoutSession() {
  throw new Error('Billing functionality not yet implemented');
}

export async function cancelSubscription() {
  throw new Error('Billing functionality not yet implemented');
}

export async function getUsage() {
  throw new Error('Billing functionality not yet implemented');
}

export async function handleStripeWebhook() {
  throw new Error('Billing functionality not yet implemented');
}
