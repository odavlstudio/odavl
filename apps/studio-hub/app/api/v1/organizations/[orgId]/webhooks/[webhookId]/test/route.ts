/**
 * Test Webhook API
 * POST /api/v1/organizations/:orgId/webhooks/:webhookId/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { webhookService } from '@odavl-studio/core/services/webhook';

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; webhookId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId, webhookId } = params;

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
