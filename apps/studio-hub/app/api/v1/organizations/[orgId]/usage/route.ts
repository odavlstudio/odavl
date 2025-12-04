/**
 * Organization Usage API Routes
 * GET /api/v1/organizations/:orgId/usage - Get usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../packages/core/src/services/organization';

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
      'analytics:read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const limits = await organizationService.checkUsageLimits(orgId);

    // Calculate usage percentages
    const usage = {
      members: {
        current: limits.members.current,
        limit: limits.members.limit,
        percentage: limits.members.limit === -1 ? 0 :
          Math.round((limits.members.current / limits.members.limit) * 100),
        exceeded: limits.members.exceeded,
      },
      projects: {
        current: limits.projects.current,
        limit: limits.projects.limit,
        percentage: limits.projects.limit === -1 ? 0 :
          Math.round((limits.projects.current / limits.projects.limit) * 100),
        exceeded: limits.projects.exceeded,
      },
      apiCalls: {
        current: limits.apiCalls.current,
        limit: limits.apiCalls.limit,
        percentage: limits.apiCalls.limit === -1 ? 0 :
          Math.round((limits.apiCalls.current / limits.apiCalls.limit) * 100),
        exceeded: limits.apiCalls.exceeded,
      },
      storage: {
        current: limits.storage.current.toString(),
        limit: limits.storage.limit.toString(),
        percentage: limits.storage.limit === BigInt(-1) ? 0 :
          Math.round(Number((limits.storage.current * BigInt(100)) / limits.storage.limit)),
        exceeded: limits.storage.exceeded,
      },
    };

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}
