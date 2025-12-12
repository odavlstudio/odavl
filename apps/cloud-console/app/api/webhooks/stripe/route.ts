/**
 * Stripe Webhook Handler for ODAVL Cloud Console
 * Processes subscription lifecycle events
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/billing-stub';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      tier: mapStripePriceToTier(subscription.items.data[0]?.price.id),
      status: subscription.status === 'active' ? 'ACTIVE' : 'SUSPENDED',
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      tier: 'FREE',
      status: 'ACTIVE',
      stripeSubscriptionId: null,
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Log successful payment
  const customerId = invoice.customer as string;
  
  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: 'ACTIVE' },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  // Mark organization as suspended
  const customerId = invoice.customer as string;
  
  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: 'SUSPENDED' },
  });
}

function mapStripePriceToTier(priceId?: string): 'FREE' | 'PRO' | 'ENTERPRISE' {
  if (!priceId) return 'FREE';
  // TODO: Map actual Stripe price IDs to tiers
  if (priceId.includes('pro')) return 'PRO';
  if (priceId.includes('enterprise')) return 'ENTERPRISE';
  return 'FREE';
}
