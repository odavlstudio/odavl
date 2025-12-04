import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
} from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const runs = await prisma.autopilotRun.findMany({
    where: {
      project: {
        organization: {
          users: {
            some: { id: session.user.id },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      edits: true,
    },
  });

  return createSuccessResponse({ runs, count: runs.length });
}, 'GET /api/autopilot/runs');

