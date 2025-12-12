/**
 * ODAVL Insight Billing API
 * 
 * Clean, explicit API surface for Insight billing operations.
 * Uses shared Stripe client and Insight-specific mappings.
 * 
 * Architecture:
 * - Server-side only (never expose Stripe secret keys to client)
 * - Leverages existing Stripe client from @odavl-studio/billing
 * - Maps InsightPlanId to Stripe products/prices
 * - Ready for Cloud + VS Code extension integration
 */

import type { InsightPlanId } from './stripe-insight-mapping.js';
import { stripe, STRIPE_WEBHOOK_SECRET } from './index.js';
import {
  getStripePriceId,
  getInsightPlanFromStripePriceId,
  getBillingCycleFromStripePriceId,
} from './stripe-insight-mapping.js';
import type Stripe from 'stripe';

/**
 * Billing cycle options
 */
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Checkout session result
 */
export interface InsightCheckoutSession {
  readonly sessionId: string;
  readonly url: string;
  readonly expiresAt: Date;
}

/**
 * Customer portal session result
 */
export interface InsightPortalSession {
  readonly url: string;
}

/**
 * Subscription details
 */
export interface InsightSubscription {
  readonly subscriptionId: string;
  readonly planId: InsightPlanId;
  readonly billingCycle: BillingCycle;
  readonly status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  readonly currentPeriodEnd: Date;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEnd?: Date;
}

/**
 * Webhook event result
 */
export interface InsightWebhookResult {
  eventType: string;
  processed: boolean;
  planId?: InsightPlanId;
  subscriptionId?: string;
  customerId?: string;
  error?: string;
}

/**
 * Create Stripe checkout session for Insight subscription
 * 
 * This initiates the payment flow for a new Insight subscription.
 * User will be redirected to Stripe Checkout to enter payment details.
 * 
 * @param userId - Internal user ID (for metadata)
 * @param planId - Insight plan to subscribe to
 * @param billingCycle - Monthly or yearly billing
 * @param options - Additional checkout options
 * @returns Checkout session with redirect URL
 * 
 * @example
 * ```typescript
 * const session = await createInsightCheckoutSession(
 *   'user_123',
 *   'INSIGHT_PRO',
 *   'yearly',
 *   {
 *     customerEmail: 'user@example.com',
 *     successUrl: 'https://app.odavl.com/dashboard?success=true',
 *     cancelUrl: 'https://app.odavl.com/pricing',
 *     trialDays: 30,
 *   }
 * );
 * 
 * // Redirect user to session.url
 * ```
 */
export async function createInsightCheckoutSession(
  userId: string,
  planId: InsightPlanId,
  billingCycle: BillingCycle,
  options: {
    customerEmail?: string;
    customerId?: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    allowPromotionCodes?: boolean;
  }
): Promise<InsightCheckoutSession> {
  // Validate Stripe is configured
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
  }

  // Get Stripe price ID for plan + billing cycle
  const priceId = getStripePriceId(planId, billingCycle);

  // Build checkout session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      userId,
      insightPlanId: planId,
      billingCycle,
      product: 'insight',
    },
    subscription_data: {
      metadata: {
        userId,
        insightPlanId: planId,
        product: 'insight',
      },
      ...(options.trialDays && { trial_period_days: options.trialDays }),
    },
    ...(options.allowPromotionCodes && { allow_promotion_codes: true }),
  };

  // Set customer email OR customer ID (mutually exclusive)
  if (options.customerId) {
    sessionParams.customer = options.customerId;
  } else if (options.customerEmail) {
    sessionParams.customer_email = options.customerEmail;
  }

  // Create session
  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Stripe checkout session created but no URL returned');
  }

  return {
    sessionId: session.id,
    url: session.url,
    expiresAt: new Date(session.expires_at * 1000),
  };
}

/**
 * Create Stripe customer portal session for Insight subscribers
 * 
 * This allows customers to self-manage their subscription:
 * - Update payment method
 * - View invoices
 * - Cancel subscription
 * - Download receipts
 * 
 * @param customerId - Stripe customer ID
 * @param returnUrl - URL to return to after portal session
 * @returns Portal session with redirect URL
 * 
 * @example
 * ```typescript
 * const portal = await createInsightCustomerPortalSession(
 *   'cus_xxxxx',
 *   'https://app.odavl.com/dashboard/billing'
 * );
 * 
 * // Redirect user to portal.url
 * ```
 */
export async function createInsightCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<InsightPortalSession> {
  // Validate Stripe is configured
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}

/**
 * Handle Stripe webhook event for Insight billing
 * 
 * This processes webhook events from Stripe (subscriptions, payments, etc.).
 * MUST verify webhook signature before calling this function.
 * 
 * Supported events:
 * - checkout.session.completed - New subscription created
 * - customer.subscription.created - Subscription started
 * - customer.subscription.updated - Plan changed, status updated
 * - customer.subscription.deleted - Subscription canceled
 * - invoice.payment_succeeded - Payment successful
 * - invoice.payment_failed - Payment failed
 * 
 * @param event - Verified Stripe webhook event
 * @returns Processing result with plan/subscription details
 * 
 * @example
 * ```typescript
 * // In your webhook handler (Next.js API route):
 * const rawBody = await req.text();
 * const signature = req.headers.get('stripe-signature')!;
 * 
 * const event = stripe.webhooks.constructEvent(
 *   rawBody,
 *   signature,
 *   STRIPE_WEBHOOK_SECRET
 * );
 * 
 * const result = await handleInsightBillingWebhook(event);
 * 
 * if (result.processed) {
 *   // Update your database based on result.planId, result.subscriptionId
 *   await updateUserSubscription(result);
 * }
 * ```
 */
export async function handleInsightBillingWebhook(
  event: Stripe.Event
): Promise<InsightWebhookResult> {
  const result: InsightWebhookResult = {
    eventType: event.type,
    processed: false,
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Only process Insight checkouts
        if (session.metadata?.product !== 'insight') {
          return { ...result, processed: false };
        }

        result.customerId = session.customer as string;
        result.subscriptionId = session.subscription as string;
        result.planId = session.metadata?.insightPlanId as InsightPlanId;
        result.processed = true;
        
        // TODO: In Cloud phase, update database with new subscription
        // await updateUserSubscription({
        //   userId: session.metadata?.userId,
        //   planId: result.planId,
        //   subscriptionId: result.subscriptionId,
        //   customerId: result.customerId,
        // });
        
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Only process Insight subscriptions
        if (subscription.metadata?.product !== 'insight') {
          return { ...result, processed: false };
        }

        const priceId = subscription.items.data[0]?.price.id;
        result.planId = priceId ? getInsightPlanFromStripePriceId(priceId) : undefined;
        result.subscriptionId = subscription.id;
        result.customerId = subscription.customer as string;
        result.processed = true;
        
        // TODO: In Cloud phase, update database with subscription changes
        // await updateUserSubscription({
        //   userId: subscription.metadata?.userId,
        //   planId: result.planId,
        //   subscriptionId: result.subscriptionId,
        //   status: subscription.status,
        //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        // });
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Only process Insight subscriptions
        if (subscription.metadata?.product !== 'insight') {
          return { ...result, processed: false };
        }

        result.subscriptionId = subscription.id;
        result.customerId = subscription.customer as string;
        result.processed = true;
        
        // TODO: In Cloud phase, mark subscription as canceled
        // await cancelUserSubscription({
        //   userId: subscription.metadata?.userId,
        //   subscriptionId: result.subscriptionId,
        // });
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only process Insight invoices
        if (invoice.subscription_details?.metadata?.product !== 'insight') {
          return { ...result, processed: false };
        }

        result.subscriptionId = invoice.subscription as string;
        result.customerId = invoice.customer as string;
        result.processed = true;
        
        // TODO: In Cloud phase, send receipt email
        // await sendReceiptEmail({
        //   invoiceId: invoice.id,
        //   amount: invoice.amount_paid / 100,
        //   receiptUrl: invoice.hosted_invoice_url,
        // });
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only process Insight invoices
        if (invoice.subscription_details?.metadata?.product !== 'insight') {
          return { ...result, processed: false };
        }

        result.subscriptionId = invoice.subscription as string;
        result.customerId = invoice.customer as string;
        result.processed = true;
        
        // TODO: In Cloud phase, notify user of failed payment
        // await sendPaymentFailedEmail({
        //   userId: invoice.subscription_details?.metadata?.userId,
        //   invoiceId: invoice.id,
        // });
        
        break;
      }

      default:
        // Event type not handled for Insight billing
        result.processed = false;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.processed = false;
  }

  return result;
}

/**
 * Get Insight subscription details from Stripe
 * 
 * @param subscriptionId - Stripe subscription ID
 * @returns Subscription details or null if not found
 */
export async function getInsightSubscription(
  subscriptionId: string
): Promise<InsightSubscription | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const priceId = subscription.items.data[0]?.price.id;
    const planId = priceId ? getInsightPlanFromStripePriceId(priceId) : undefined;
    const billingCycle = priceId ? getBillingCycleFromStripePriceId(priceId) : undefined;

    if (!planId || !billingCycle || billingCycle === 'metered') {
      return null; // Not an Insight subscription
    }

    return {
      subscriptionId: subscription.id,
      planId,
      billingCycle,
      status: subscription.status as InsightSubscription['status'],
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    };
  } catch (error) {
    // Subscription not found or other error
    return null;
  }
}

/**
 * Cancel Insight subscription
 * 
 * @param subscriptionId - Stripe subscription ID
 * @param immediately - If true, cancel immediately. If false, cancel at period end.
 * @returns Updated subscription details
 */
export async function cancelInsightSubscription(
  subscriptionId: string,
  immediately = false
): Promise<InsightSubscription | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
  }

  try {
    const subscription = immediately
      ? await stripe.subscriptions.cancel(subscriptionId)
      : await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

    const priceId = subscription.items.data[0]?.price.id;
    const planId = priceId ? getInsightPlanFromStripePriceId(priceId) : undefined;
    const billingCycle = priceId ? getBillingCycleFromStripePriceId(priceId) : undefined;

    if (!planId || !billingCycle || billingCycle === 'metered') {
      return null;
    }

    return {
      subscriptionId: subscription.id,
      planId,
      billingCycle,
      status: subscription.status as InsightSubscription['status'],
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    };
  } catch (error) {
    return null;
  }
}
