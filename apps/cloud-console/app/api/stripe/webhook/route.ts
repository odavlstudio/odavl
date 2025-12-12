export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeletion(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handlePaymentSucceeded(invoice);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handlePaymentFailed(invoice);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  let tier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE';
  
  if (priceId === process.env.STRIPE_PRICE_PRO) {
    tier = 'PRO';
  } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
    tier = 'ENTERPRISE';
  }

  console.log(`[Webhook] Updating subscription: ${subscriptionId} to ${tier} (${status})`);

  // Update organization with subscription data
  await prisma.organization.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscriptionId,
      tier: tier,
      status: status === 'active' || status === 'trialing' ? 'ACTIVE' : 'SUSPENDED',
    },
  });

  // Update or create subscription record
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      status: status,
      currentPeriodEnd: currentPeriodEnd,
      organization: {
        connect: { stripeCustomerId: customerId },
      },
    },
    update: {
      status: status,
      currentPeriodEnd: currentPeriodEnd,
    },
  });
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;

  console.log(`[Webhook] Deleting subscription: ${subscriptionId}`);

  // Downgrade to FREE tier
  await prisma.organization.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: null,
      tier: 'FREE',
      status: 'ACTIVE',
    },
  });

  // Mark subscription as canceled
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  console.log(`[Webhook] Payment succeeded for subscription: ${subscriptionId}`);

  // Ensure organization is active
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.organization.update({
      where: { id: subscription.organizationId },
      data: { status: 'ACTIVE' },
    });
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  console.log(`[Webhook] Payment failed for subscription: ${subscriptionId}`);

  // Suspend organization after payment failure
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.organization.update({
      where: { id: subscription.organizationId },
      data: { status: 'SUSPENDED' },
    });
  }
}
