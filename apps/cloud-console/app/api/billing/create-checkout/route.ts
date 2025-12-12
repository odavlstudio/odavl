import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  // Lightweight safety check (rate limit already added in middleware)
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { priceId, tier } = body;

    if (!priceId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, tier' },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'User has no organization' },
        { status: 400 }
      );
    }

    const organization = user.memberships[0].organization;

    // Check if already subscribed
    if (organization.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(
        organization.id,
        session.user.email,
        organization.name
      );

      // Update organization with customer ID
      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      priceId,
      `${process.env.NEXTAUTH_URL}/app/billing?success=true`,
      `${process.env.NEXTAUTH_URL}/app/billing?canceled=true`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[Billing] Create checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
