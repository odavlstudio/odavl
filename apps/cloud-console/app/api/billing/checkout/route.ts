/**
 * Stripe Checkout Session API
 * Creates checkout sessions for subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/billing-stub';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tier, organizationId } = await request.json();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  let customerId = org.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;

    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPriceIdForTier(tier),
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?canceled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

function getPriceIdForTier(tier: string): string {
  // TODO: Replace with actual Stripe price IDs
  const prices: Record<string, string> = {
    pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
  };
  return prices[tier] || prices.pro;
}
