/**
 * Projects API Endpoint
 *
 * Returns list of workspace projects
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, createSuccessResponse, ApiErrors } from '@/lib/api';

export const GET = withErrorHandler(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return ApiErrors.unauthorized('Authentication required');
  }

  // Fetch user's projects (through organization)
  const projects = await prisma.project.findMany({
    where: {
      organization: {
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 50,
  });

  return createSuccessResponse({
    projects,
    total: projects.length,
  });
}, 'GET /api/projects');

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
