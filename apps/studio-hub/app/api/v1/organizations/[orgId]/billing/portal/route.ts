/**
 * Create Stripe Billing Portal Session
 * POST /api/v1/organizations/:orgId/billing/portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { stripeService } from '@odavl-studio/core/services/stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = params;

    // Check permission (only OWNER can manage billing)
    const role = await organizationService.getMemberRole(orgId, session.user.id);
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owner can manage billing' },
        { status: 403 }
      );
    }

    const organization = await organizationService.getOrganization(orgId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const portalUrl = await stripeService.createPortalSession(
      organization.stripeCustomerId,
      `${baseUrl}/dashboard/${organization.slug}/billing`
    );

    return NextResponse.json({
      success: true,
      data: {
        url: portalUrl,
      },
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
