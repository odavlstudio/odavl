// User API - Switch Organization
// Week 2: Multi-Tenancy User Actions

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/db/rls';
import { logger } from '@/lib/logger';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
  validateRequestBody,
} from '@/lib/api';
import { z } from 'zod';

const SwitchOrgSchema = z.object({
  orgId: z.string().min(1, 'Organization ID required'),
});

export const POST = withErrorHandler(async (request: Request) => {
  const session = await requireAuth();
  const validated = await validateRequestBody(request, SwitchOrgSchema);

  // Check if validation returned an error response
  if (validated instanceof NextResponse) {
    return validated;
  }

  const { orgId } = validated.data;

  // Verify user has access to this organization
  const org = await prisma.organization.findFirst({
    where: {
      id: orgId,
      users: {
        some: { id: session.user.id }
      }
    }
  });

  if (!org) {
    return ApiErrors.forbidden('No access to this organization');
  }

  // Update user's current organization
  await prisma.user.update({
    where: { id: session.user.id },
    data: { orgId },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'org_switched',
      resource: 'organization',
      resourceId: orgId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
  });

  logger.info('Organization switched', { userId: session.user.id, orgId });
  return createSuccessResponse({ orgId, message: 'Organization switched successfully' });
}, 'POST /api/user/switch-org');
