/**
 * Invitation Statistics API Route
 * GET /api/v1/invitations/stats - Get invitation statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { invitationsService } from '../../../../../../../packages/core/src/services/invitations';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const stats = await invitationsService.getInvitationStats(organizationId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation statistics' },
      { status: 500 }
    );
  }
}
