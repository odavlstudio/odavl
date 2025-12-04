/**
 * Accept Invitation API Route
 * POST /api/v1/invitations/:token/accept
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { invitationService } from '../../../../../../../packages/core/src/services/invitation';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = params;

    const invitation = await invitationService.acceptInvitation(
      token,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const status =
        error.message.includes('not found') ? 404 :
        error.message.includes('expired') ? 410 :
        error.message.includes('already processed') ? 409 :
        500;

      return NextResponse.json(
        { error: error.message },
        { status }
      );
    }

    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
