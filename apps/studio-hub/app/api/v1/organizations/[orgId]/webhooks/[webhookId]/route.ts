/**
 * Webhook Actions API
 * GET /api/v1/organizations/:orgId/webhooks/:webhookId - Get webhook
 * PUT /api/v1/organizations/:orgId/webhooks/:webhookId - Update webhook
 * DELETE /api/v1/organizations/:orgId/webhooks/:webhookId - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { webhookService } from '@odavl-studio/core/services/webhook';
import { z } from 'zod';

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  active: z.boolean().optional(),
});

export async function GET(
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

    // TODO: Get webhook from database
    const webhook = null;

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { error: 'Only owners and admins can update webhooks' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updates = updateWebhookSchema.parse(body);

    await webhookService.updateWebhook(webhookId, updates);

    return NextResponse.json({
      success: true,
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: 'Only owners and admins can delete webhooks' },
        { status: 403 }
      );
    }

    await webhookService.deleteWebhook(webhookId);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
