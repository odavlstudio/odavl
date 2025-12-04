import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUsageLimit, PLAN_LIMITS } from '@/lib/usage-limits';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
} from '@/lib/api';

export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId') || session.user.orgId!;

  // Check if user has access to this org
  if (orgId !== session.user.orgId) {
    return ApiErrors.forbidden('Access denied to this organization');
  }

  const resources = ['apiCalls', 'projects', 'users', 'insightScans', 'autopilotRuns', 'guardianTests'] as const;

  const usageData = await Promise.all(
    resources.map(async (resource) => {
      const { current, limit } = await checkUsageLimit(orgId, resource);
      const percentage = limit === Infinity ? 0 : (current / limit) * 100;

      return {
        resource,
        current,
        limit,
        percentage: Math.round(percentage),
      };
    })
  );

  return createSuccessResponse({ usage: usageData, orgId });
}, 'GET /api/usage');

