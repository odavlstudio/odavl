/**
 * Usage History API Route
 * GET - Get usage history for analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { usageTrackingService } from '@odavl-studio/core/services/usage-tracking';

/**
 * GET /api/v1/usage/history
 * Get usage history for organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { orgId: true },
    });

    if (!user?.orgId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Get months parameter
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12', 10);

    // Get usage history
    const history = await usageTrackingService.getUsageHistory(user.orgId, months);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to get usage history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
