import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createPortalSession } from '@/lib/stripe';
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

    // Check if customer exists
    if (!organization.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for organization' },
        { status: 400 }
      );
    }

    // Create portal session
    const portalSession = await createPortalSession(
      organization.stripeCustomerId,
      `${process.env.NEXTAUTH_URL}/app/billing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('[Billing] Create portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
