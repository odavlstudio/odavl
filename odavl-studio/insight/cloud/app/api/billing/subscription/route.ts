/**
 * GET /api/billing/subscription
 * Get current user's subscription details
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@odavl-studio/auth';
import { PRODUCT_TIERS } from '@odavl/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export async function GET(req: NextRequest) {
  try {
    // Verify auth
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: payload.userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Get tier details
    const tierDetails = PRODUCT_TIERS[subscription.tier as keyof typeof PRODUCT_TIERS];

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        limits: {
          maxProjects: subscription.maxProjects,
          maxAnalysesPerMonth: subscription.maxAnalysesPerMonth,
          maxStorageGB: subscription.maxStorageGB,
        },
        usage: {
          projectsCount: subscription.projectsCount,
          usedAnalysesMonth: subscription.usedAnalysesMonth,
          usedStorageGB: subscription.usedStorageGB,
        },
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        licenseKey: subscription.licenseKey,
        createdAt: subscription.createdAt,
      },
      tierDetails,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
