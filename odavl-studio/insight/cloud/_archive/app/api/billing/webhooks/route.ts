/**
 * Stripe Webhook Handler
 * Phase 3.0.4: Billing & Payments (EU-first)
 * Phase 3.0.5: Production Launch Hardening
 * 
 * POST /api/billing/webhooks
 * Handles Stripe webhook events for subscription lifecycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/billing/stripe';
import { getPlanByPriceId } from '@/lib/billing/plans';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';
import { logBillingAction, BillingAction } from '@/lib/billing/audit';

/**
 * Webhook event handlers
 * 
 * Supported events:
 * - checkout.session.completed: User completed payment
 * - customer.subscription.updated: Subscription modified (upgrade/downgrade)
 * - customer.subscription.deleted: Subscription cancelled/expired
 */

/**
 * Handle checkout.session.completed
 * 
 * Triggered when user successfully completes payment
 * Updates user's plan and subscription record
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Phase 3.0.5: Log webhook event processing
  console.log('[Webhook] Processing checkout.session.completed:', { userId, tier, sessionId: session.id });

  // Get subscription details
  const stripeSubscriptionId = typeof session.subscription === 'string' 
    ? session.subscription 
    : session.subscription?.id;

  if (!stripeSubscriptionId) {
    console.error('No subscription ID in checkout session:', session.id);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID in subscription:', stripeSubscriptionId);
    return;
  }

  // Get plan details
  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Update subscription in database
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier: plan.tier,
      status: 'active',
      stripeSubscriptionId,
      stripePriceId: priceId,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      maxProjects: plan.limits.maxProjects,
      maxAnalysesPerMonth: plan.limits.maxAnalysesPerMonth,
      maxStorageGB: plan.limits.maxStorageGB,
    },
    create: {
      userId,
      tier: plan.tier,
      status: 'active',
      stripeSubscriptionId,
      stripePriceId: priceId,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      maxProjects: plan.limits.maxProjects,
      maxAnalysesPerMonth: plan.limits.maxAnalysesPerMonth,
      maxStorageGB: plan.limits.maxStorageGB,
    },
  });

  // Update user's plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan.tier },
  });

  // Phase 3.0.5: Audit logging for subscription creation
  logBillingAction(
    BillingAction.SUBSCRIPTION_CREATED,
    userId,
    {
      tier: plan.tier,
      subscriptionId: stripeSubscriptionId,
      priceId,
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      periodStart: subscription.current_period_start,
      periodEnd: subscription.current_period_end,
    },
    null
  );

  console.log(`Checkout completed: User ${userId} upgraded to ${plan.tier}`);
}

/**
 * Handle customer.subscription.updated
 * 
 * Triggered when subscription is modified (plan change, renewal)
 * Updates subscription limits and period
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID in subscription:', subscription.id);
    return;
  }

  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Phase 3.0.5: Get old tier before update for plan switch detection
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  const oldTier = existingSubscription?.tier;

  // Update subscription
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      tier: plan.tier,
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      maxProjects: plan.limits.maxProjects,
      maxAnalysesPerMonth: plan.limits.maxAnalysesPerMonth,
      maxStorageGB: plan.limits.maxStorageGB,
      cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  // Update user's plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan.tier },
  });

  // Phase 3.0.5: Audit logging for subscription update or plan switch
  if (oldTier && oldTier !== plan.tier) {
    logBillingAction(
      BillingAction.PLAN_SWITCHED,
      userId,
      {
        oldTier,
        newTier: plan.tier,
        subscriptionId: subscription.id,
        priceId,
        status: subscription.status,
        periodStart: subscription.current_period_start,
        periodEnd: subscription.current_period_end,
      },
      null
    );
  } else {
    logBillingAction(
      BillingAction.SUBSCRIPTION_UPDATED,
      userId,
      {
        tier: plan.tier,
        status: subscription.status,
        subscriptionId: subscription.id,
        priceId,
        periodStart: subscription.current_period_start,
        periodEnd: subscription.current_period_end,
      },
      null
    );
  }

  console.log(`Subscription updated: User ${userId} now on ${plan.tier}`);
}

/**
 * Handle customer.subscription.deleted
 * 
 * Triggered when subscription is cancelled or expires
 * Downgrades user to FREE tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  // Downgrade to FREE tier
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      tier: 'FREE',
      status: 'cancelled',
      cancelledAt: new Date(),
      maxProjects: 3,
      maxAnalysesPerMonth: 10,
      maxStorageGB: 1,
    },
  });

  // Update user's plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'FREE' },
  });

  // Phase 3.0.5: Audit logging for subscription cancellation
  logBillingAction(
    BillingAction.SUBSCRIPTION_CANCELLED,
    userId,
    {
      subscriptionId: subscription.id,
      downgradedTo: 'FREE',
      cancelledAt: new Date().toISOString(),
      reason: 'stripe_subscription_deleted',
    },
    null
  );

  console.log(`Subscription deleted: User ${userId} downgraded to FREE`);
}

/**
 * POST handler for Stripe webhooks
 * 
 * Verifies webhook signature and dispatches to appropriate handler
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle event
    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
