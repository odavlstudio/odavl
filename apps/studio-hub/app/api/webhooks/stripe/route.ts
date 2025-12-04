/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from "../../../../../../packages/core/src/services/stripe";
import { organizationService } from "../../../../../../packages/core/src/services/organization";
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = await stripeService.handleWebhook(body, signature);

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  if (!organizationId) return;

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripeService.getSubscription(subscriptionId);
  if (!subscription) return;

  // Update organization with subscription details
  await organizationService.updateSubscriptionPlan(
    organizationId,
    subscription.plan,
    subscription.subscriptionId
  );

  console.log('Checkout completed for organization:', organizationId);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  const details = await stripeService.getSubscription(subscription.id);
  if (!details) return;

  // Update organization subscription
  await organizationService.updateSubscriptionPlan(
    organizationId,
    details.plan,
    subscription.id
  );

  console.log('Subscription updated for organization:', organizationId);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  // Downgrade to FREE plan
  await organizationService.cancelSubscription(organizationId);

  console.log('Subscription deleted for organization:', organizationId);
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  console.log('Payment succeeded:', {
    customerId,
    subscriptionId,
    amount: invoice.amount_paid / 100,
  });

  // TODO: Send payment receipt email
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  console.log('Payment failed:', {
    customerId,
    subscriptionId,
    amount: invoice.amount_due / 100,
  });

  // TODO: Send payment failure email
  // TODO: Update organization status to PAST_DUE
}
