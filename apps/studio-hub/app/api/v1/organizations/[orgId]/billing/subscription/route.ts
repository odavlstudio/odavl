/**
 * Subscription Management API
 * GET /api/v1/organizations/:orgId/billing/subscription - Get subscription
 * DELETE /api/v1/organizations/:orgId/billing/subscription - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { stripeService } from '@odavl-studio/core/services/stripe';

export async function GET(
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

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'org:billing'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
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

    if (!organization.stripeSubscriptionId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const subscription = await stripeService.getSubscription(
      organization.stripeSubscriptionId
    );

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check permission (only OWNER can cancel subscription)
    const role = await organizationService.getMemberRole(orgId, session.user.id);
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owner can cancel subscription' },
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

    if (!organization.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const immediately = searchParams.get('immediately') === 'true';

    await stripeService.cancelSubscription(
      organization.stripeSubscriptionId,
      immediately
    );

    // Update organization status
    await organizationService.updateSubscriptionPlan(
      orgId,
      'FREE'
    );

    return NextResponse.json({
      success: true,
      message: immediately
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at period end',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
