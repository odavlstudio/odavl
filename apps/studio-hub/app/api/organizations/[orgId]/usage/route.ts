// Usage Tracking API
// Week 2: Plan Limits Enforcement

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrgAccess, checkPlanLimit } from '@/lib/db/rls';
import { logger } from '@/lib/logger';
import { withErrorHandler, createSuccessResponse, ApiErrors } from '@/lib/api';

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) => {
  const { orgId } = await params;

    // Verify access
    await requireOrgAccess(orgId);

    // Fetch organization usage
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        plan: true,
        monthlyApiCalls: true,
        monthlyInsightRuns: true,
        monthlyAutopilotRuns: true,
        monthlyGuardianTests: true,
      },
    });

    if (!org) {
      return ApiErrors.notFound('Organization not found');
    }

    // Calculate limits based on plan
    const limits = {
      FREE: {
        apiCalls: 1000,
        insightRuns: 50,
        autopilotRuns: 10,
        guardianTests: 25,
      },
      PRO: {
        apiCalls: 100000,
        insightRuns: 1000,
        autopilotRuns: 500,
        guardianTests: 500,
      },
      ENTERPRISE: {
        apiCalls: 999999,
        insightRuns: 999999,
        autopilotRuns: 999999,
        guardianTests: 999999,
      },
    };

    const planLimits = limits[org.plan];

    const usageData = {
      plan: org.plan,
      usage: {
        apiCalls: org.monthlyApiCalls,
        insightRuns: org.monthlyInsightRuns,
        autopilotRuns: org.monthlyAutopilotRuns,
        guardianTests: org.monthlyGuardianTests,
      },
      limits: planLimits,
      remaining: {
        apiCalls: planLimits.apiCalls - org.monthlyApiCalls,
        insightRuns: planLimits.insightRuns - org.monthlyInsightRuns,
        autopilotRuns: planLimits.autopilotRuns - org.monthlyAutopilotRuns,
        guardianTests: planLimits.guardianTests - org.monthlyGuardianTests,
      },
    };

    logger.info('Usage fetched successfully', { orgId, plan: org.plan });
    return createSuccessResponse(usageData);
}, 'GET /api/organizations/[orgId]/usage');
