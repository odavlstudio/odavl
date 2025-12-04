/**
 * Usage API Routes
 * GET - Get current usage
 * POST - Increment usage (internal only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { usageTrackingService } from '@odavl-studio/core/services/usage-tracking';


/**
 * GET /api/v1/usage
 * Get usage status for organization
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

    // Get usage status
    const status = await usageTrackingService.getUsageStatus(user.orgId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to get usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/usage/increment
 * Increment usage (internal only - called by upload endpoints)
 */
export async function POST(request: NextRequest) {
  try {
    // Check for internal API key
    const apiKey = request.headers.get('x-internal-api-key');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, userId, product, operation, metadata } = body;

    if (!orgId || !userId || !product || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Track operation
    await usageTrackingService.trackOperation(
      orgId,
      userId,
      product,
      operation,
      metadata
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to increment usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

