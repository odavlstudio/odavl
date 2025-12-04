/**
 * Organization Invitations API Routes
 * GET /api/v1/organizations/:orgId/invitations - List invitations
 * POST /api/v1/organizations/:orgId/invitations - Create invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { invitationService } from '@odavl-studio/core/services/invitation';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
  expiresInDays: z.number().min(1).max(30).optional(),
});

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

    // Check membership
    const isMember = await organizationService.isMember(orgId, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;

    const invitations = await invitationService.getOrganizationInvitations(
      orgId,
      status
    );

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

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

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'members:invite'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createInvitationSchema.parse(body);

    // Check organization limits
    const limits = await organizationService.checkUsageLimits(orgId);
    if (limits.members.exceeded) {
      return NextResponse.json(
        {
          error: 'Member limit exceeded',
          details: `Current plan allows ${limits.members.limit} members`
        },
        { status: 403 }
      );
    }

    const invitation = await invitationService.createInvitation({
      organizationId: orgId,
      email: validatedData.email,
      role: validatedData.role,
      invitedById: session.user.id,
      expiresInDays: validatedData.expiresInDays,
    });

    // TODO: Send invitation email
    // await emailService.sendInvitation(invitation);

    return NextResponse.json({
      success: true,
      data: invitation,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
