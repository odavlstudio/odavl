/**
 * Stripe Checkout Session Endpoint
 * Phase 3.0.4: Billing & Payments (EU-first)
 * Phase 3.0.5: Production Launch Hardening
 * 
 * POST /api/billing/checkout
 * Creates a Stripe Checkout Session for subscription purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedUser } from '@/lib/auth/jwt.middleware';
import { stripe } from '@/lib/billing/stripe';
import { SUBSCRIPTION_PLANS, CHECKOUT_URLS, requiresStripeSubscription } from '@/lib/billing/plans';
import { prisma } from '@/lib/prisma';
import type { SubscriptionTier } from '@prisma/client';
import { isBillingEnabled, isAbuseProtectionEnforced } from '@/lib/billing/feature-flags';
import { logBillingAction, BillingAction, checkForAbuse } from '@/lib/billing/audit';

interface CheckoutRequest {
  tier: SubscriptionTier;
}

interface CheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
  message?: string;
}

/**
 * Create Stripe Checkout Session
 * 
 * Flow:
 * 1. Validate tier (must be PRO, not FREE or ENTERPRISE)
 * 2. Get or create Stripe customer
 * 3. Create checkout session
 * 4. Return checkout URL
 */
export const POST = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    // Phase 3.0.5: Check if billing is enabled
    if (!isBillingEnabled()) {
      logBillingAction(
        BillingAction.BILLING_DISABLED_ACCESS,
        user.userId,
        { endpoint: 'checkout' },
        req
      );
      return NextResponse.json(
        {
          success: false,
          error: 'BILLING_DISABLED',
          message: 'Billing is currently disabled. Please contact support.',
        } as CheckoutResponse,
        { status: 503 }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { tier } = body;

    // Log checkout initiation
    logBillingAction(
      BillingAction.CHECKOUT_INITIATED,
      user.userId,
      { tier },
      req
    );

    // Validate tier
    if (!tier || !['PRO'].includes(tier)) {
      logBillingAction(
        BillingAction.CHECKOUT_FAILED,
        user.userId,
        { tier, reason: 'invalid_tier' },
        req
      );
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TIER',
          message: 'Invalid subscription tier. Only PRO tier available via Stripe.',
        } as CheckoutResponse,
        { status: 400 }
      );
    }

    // Phase 3.0.5: Check for abuse (rapid checkout attempts)
    if (isAbuseProtectionEnforced()) {
      const abuseCheck = await checkForAbuse(user.userId, BillingAction.CHECKOUT_INITIATED);
      if (abuseCheck.isAbuse) {
        logBillingAction(
          BillingAction.ABUSE_DETECTED,
          user.userId,
          { tier, reason: abuseCheck.reason },
          req
        );
        return NextResponse.json(
          {
            success: false,
            error: 'TOO_MANY_REQUESTS',
            message: 'Too many checkout attempts. Please try again later.',
          } as CheckoutResponse,
          { status: 429 }
        );
      }
    }

    // Check if tier requires Stripe
    if (!requiresStripeSubscription(tier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_STRIPE_REQUIRED',
          message: 'This tier does not require Stripe subscription.',
        } as CheckoutResponse,
        { status: 400 }
      );
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[tier];
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'PLAN_NOT_FOUND',
          message: 'Subscription plan not found.',
        } as CheckoutResponse,
        { status: 404 }
      );
    }

    // Check if user already has active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    if (existingSubscription?.stripeSubscriptionId && existingSubscription.status === 'active') {
      logBillingAction(
        BillingAction.CHECKOUT_FAILED,
        user.userId,
        { tier, reason: 'already_subscribed', currentTier: existingSubscription.tier },
        req
      );
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_SUBSCRIBED',
          message: 'User already has an active subscription. Please cancel before upgrading.',
        } as CheckoutResponse,
        { status: 409 }
      );
    }

    // Get or create Stripe customer
    let customerId = existingSubscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.userId,
          source: 'odavl-insight',
        },
      });
      customerId = customer.id;

      // Update subscription record with customer ID
      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Phase 3.0.5: Create checkout session with idempotency key
    const idempotencyKey = `checkout-${user.userId}-${tier}-${Date.now()}`;
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card', 'sepa_debit'], // EU payment methods
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        success_url: CHECKOUT_URLS.success,
        cancel_url: CHECKOUT_URLS.cancel,
        metadata: {
          userId: user.userId,
          tier: tier,
        },
        subscription_data: {
          metadata: {
            userId: user.userId,
            tier: tier,
          },
        },
        locale: 'de', // German locale for EU
        billing_address_collection: 'required', // EU requirement
        customer_update: {
          address: 'auto',
        },
      },
      {
        idempotencyKey,
      }
    );

    // Store checkout session ID
    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: { stripeCheckoutSessionId: session.id },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: user.userId,
          tier: 'FREE', // Will be updated by webhook
          stripeCustomerId: customerId,
          stripeCheckoutSessionId: session.id,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    // Phase 3.0.5: Log successful checkout session creation
    logBillingAction(
      BillingAction.CHECKOUT_COMPLETED,
      user.userId,
      { tier, sessionId: session.id, customerId },
      req
    );

    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.url,
      } as CheckoutResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Checkout session creation failed:', error);
    
    // Phase 3.0.5: Log checkout failure
    try {
      logBillingAction(
        BillingAction.CHECKOUT_FAILED,
        user.userId,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        req
      );
    } catch (logError) {
      console.error('Failed to log checkout error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'CHECKOUT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create checkout session',
      } as CheckoutResponse,
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
