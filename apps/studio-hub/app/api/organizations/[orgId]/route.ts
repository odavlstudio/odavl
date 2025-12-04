// Organization API - Get Organization Details
// Week 2: Multi-Tenancy API

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrgAccess } from '@/lib/db/rls';
import { logger } from '@/lib/logger';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
} from '@/lib/api';

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) => {
  const { orgId } = await params;

  // Verify access
  await requireOrgAccess(orgId);

  // Fetch organization with projects
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      plan: true,
      monthlyApiCalls: true,
      monthlyInsightRuns: true,
      monthlyAutopilotRuns: true,
      monthlyGuardianTests: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!organization) {
    return ApiErrors.notFound('Organization not found');
  }

  // Fetch projects
  const projects = await prisma.project.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('Organization fetched', { orgId, projectCount: projects.length });
  return createSuccessResponse({
    organization,
    projects,
    projectCount: projects.length,
  });
}, 'GET /api/organizations/[orgId]');
