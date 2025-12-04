/**
 * Invitation Acceptance API Routes
 * GET /api/v1/invitations/:token - Get invitation details
 * POST /api/v1/invitations/:token/accept - Accept invitation
 * POST /api/v1/invitations/:token/cancel - Cancel invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { invitationService } from '../../../../../../packages/core/src/services/invitation';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Invitation expired' },
        { status: 410 }
      );
    }

    // Check if already processed
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Invitation already ${invitation.status.toLowerCase()}` },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        organizationName: invitation.organization.name,
        organizationSlug: invitation.organization.slug,
        role: invitation.role,
        invitedBy: invitation.invitedBy.name,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
