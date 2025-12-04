/**
 * Webhook Deliveries API
 * GET /api/v1/organizations/:orgId/webhooks/:webhookId/deliveries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../../../packages/core/src/services/organization';
import { webhookService } from '../../../../../../../../../../packages/core/src/services/webhook';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; webhookId: string }> }
) {
  try {
    const { webhookId, orgId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'org:settings'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') as 'pending' | 'success' | 'failed' | undefined;

    const deliveries = await webhookService.getDeliveries(webhookId, {
      limit,
      status,
    });

    return NextResponse.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook deliveries' },
      { status: 500 }
    );
  }
}
