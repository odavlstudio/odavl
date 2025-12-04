/**
 * Users API Endpoint
 *
 * Returns current user information (admin endpoints for user management would be separate)
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

  // Fetch current user with related data
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      organization: {
        select: {
          id: true,
          name: true,
          plan: true,
        },
      },
      _count: {
        select: {
          apiKeys: true,
        },
      },
    },
  });

  if (!user) {
    return ApiErrors.notFound('User not found');
  }

  return createSuccessResponse({
    user,
  });
}, 'GET /api/users');

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
