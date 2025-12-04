/**
 * Invoices API
 * GET /api/v1/organizations/:orgId/billing/invoices
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

    if (!organization.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const invoices = await stripeService.getInvoices(
      organization.stripeCustomerId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
