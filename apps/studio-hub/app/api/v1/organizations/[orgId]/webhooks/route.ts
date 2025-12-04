/**
 * Webhooks API
 * GET /api/v1/organizations/:orgId/webhooks - List webhooks
 * POST /api/v1/organizations/:orgId/webhooks - Create webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../packages/core/src/services/organization';
import { webhookService } from '../../../../../../../../packages/core/src/services/webhook';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

export async function GET(
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

    // TODO: Get webhooks from database
    const webhooks: any[] = [];

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

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

    // Check permission (only OWNER/ADMIN can create webhooks)
    const role = await organizationService.getMemberRole(orgId, session.user.id);
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only owners and admins can create webhooks' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { url, events, secret } = createWebhookSchema.parse(body);

    const webhook = await webhookService.createWebhook({
      organizationId: orgId,
      url,
      events,
      secret,
    });

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
