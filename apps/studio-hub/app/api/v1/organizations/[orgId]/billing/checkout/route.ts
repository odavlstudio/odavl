/**
 * Create Stripe Checkout Session
 * POST /api/v1/organizations/:orgId/billing/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../../packages/core/src/services/organization';
import { stripeService } from '../../../../../../../../../packages/core/src/services/stripe';
import { SubscriptionPlan } from '../../../../../../../../../packages/types/src/multi-tenant';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Check permission (only OWNER can manage billing)
    const role = await organizationService.getMemberRole(orgId, session.user.id);
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owner can manage billing' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { plan } = checkoutSchema.parse(body);

    const organization = await organizationService.getOrganization(orgId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = organization.stripeCustomerId;

    if (!customerId) {
      customerId = await stripeService.createCustomer({
        email: session.user.email!,
        name: organization.name,
        organizationId: orgId,
      });

      await organizationService.updateOrganization(orgId, {
        // @ts-ignore - stripeCustomerId not in update type yet
        stripeCustomerId: customerId,
      });
    }

    // Get price ID for plan
    const priceId = stripeService.getPriceIdFromPlan(plan as SubscriptionPlan);
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await stripeService.createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${baseUrl}/dashboard/${organization.slug}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard/${organization.slug}/billing`,
      organizationId: orgId,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.sessionId,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
