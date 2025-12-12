import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logBillingEvent } from '@/lib/logger';
import { updateActiveSubscriptions, recordRevenue } from '@/lib/metrics';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const tier = session.metadata?.tier as 'PRO' | 'ENTERPRISE';

  if (!organizationId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get full subscription details
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update organization tier
  await prisma.organization.update({
    where: { id: organizationId },
    data: { tier },
  });

  // Create or update subscription record
  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      status: 'ACTIVE',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      usedAnalyses: 0,
      usedFixes: 0,
      usedAudits: 0,
    },
    update: {
      status: 'ACTIVE',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  });

  logBillingEvent('subscription_created', organizationId, { tier, subscriptionId });
  console.log(`Subscription created for organization ${organizationId}: ${tier}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('Missing organizationId in subscription metadata');
    return;
  }

  const status = subscription.status === 'active' ? 'ACTIVE' :
                 subscription.status === 'past_due' ? 'PAST_DUE' :
                 subscription.status === 'canceled' ? 'CANCELED' :
                 'ACTIVE';

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  logBillingEvent('subscription_updated', organizationId, { status });
  console.log(`Subscription updated for organization ${organizationId}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('Missing organizationId in subscription metadata');
    return;
  }

  // Downgrade to FREE tier
  await prisma.organization.update({
    where: { id: organizationId },
    data: { tier: 'FREE' },
  });

  await prisma.subscription.update({
    where: { organizationId },
    data: { status: 'CANCELED' },
  });

  logBillingEvent('subscription_canceled', organizationId);
  console.log(`Subscription canceled for organization ${organizationId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) return;

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  logBillingEvent('payment_succeeded', organizationId, { invoiceId: invoice.id });
  console.log(`Payment succeeded for organization ${organizationId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) return;

  await prisma.subscription.update({
    where: { organizationId },
    data: { status: 'PAST_DUE' },
  });

  logBillingEvent('payment_failed', organizationId, { invoiceId: invoice.id });
  console.log(`Payment failed for organization ${organizationId}`);
}
