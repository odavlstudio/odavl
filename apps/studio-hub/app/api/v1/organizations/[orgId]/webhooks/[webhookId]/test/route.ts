/**
 * Test Webhook API
 * POST /api/v1/organizations/:orgId/webhooks/:webhookId/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../../../packages/core/src/services/organization';
import { webhookService } from '../../../../../../../../../../packages/core/src/services/webhook';

export async function POST(
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
    const role = await organizationService.getMemberRole(orgId, session.user.id);
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only owners and admins can test webhooks' },
        { status: 403 }
      );
    }

    const result = await webhookService.testWebhook(webhookId);

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
