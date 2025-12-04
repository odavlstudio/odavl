/**
 * Invitations API Routes
 * POST /api/v1/invitations - Create invitation
 * POST /api/v1/invitations/bulk - Bulk invitations
 * POST /api/v1/invitations/:id/resend - Resend invitation
 * GET /api/v1/invitations - List invitations
 * GET /api/v1/invitations/stats - Invitation statistics
 * GET /api/v1/invitations/templates - Get templates
 * POST /api/v1/invitations/templates - Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { invitationsService } from '../../../../../../packages/core/src/services/invitations';
import { authOptions } from '@/lib/auth';

const createInvitationSchema = z.object({
  organizationId: z.string(),
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  message: z.string().optional(),
  subject: z.string().optional(),
  expiresInDays: z.number().min(1).max(30).optional(),
  templateId: z.string().optional(),
});

const bulkInvitationSchema = z.object({
  organizationId: z.string(),
  emails: z.array(z.string().email()).min(1).max(100),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  message: z.string().optional(),
  subject: z.string().optional(),
  templateId: z.string().optional(),
  batchName: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const invitations = await invitationsService.getInvitationsByOrganization(
      organizationId,
      {
        status: status as any,
        type: type as any,
        limit: limit ? parseInt(limit) : undefined,
      }
    );

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createInvitationSchema.parse(body);

    const invitation = await invitationsService.createInvitation({
      ...validated,
      invitedBy: session.user.id!,
      invitedByEmail: session.user.email!,
    });

    // TODO: Send invitation email

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
