/**
 * POST /api/billing/upgrade
 * Request subscription upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@odavl-studio/auth';
import { PRODUCT_TIERS, type SubscriptionTier } from '@odavl/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const upgradeSchema = z.object({
  targetTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
});

export async function POST(req: NextRequest) {
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

    // Validate request body
    const body = await req.json();
    const validation = upgradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { targetTier } = validation.data;

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: payload.userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Check if upgrade is valid
    const currentTier = subscription.tier as SubscriptionTier;
    const tierOrder = ['FREE', 'PRO', 'ENTERPRISE'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);

    if (targetIndex <= currentIndex) {
      return NextResponse.json(
        { error: 'Cannot downgrade or upgrade to same tier' },
        { status: 400 }
      );
    }

    // Get tier limits
    const tierDetails = PRODUCT_TIERS[targetTier];
    const limits = tierDetails.limits;

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        tier: targetTier,
        maxProjects: limits.maxProjects,
        maxAnalysesPerMonth: limits.maxAnalysesPerMonth,
        maxStorageGB: limits.maxStorageGB,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Successfully upgraded to ${tierDetails.displayName}`,
      subscription: {
        id: updatedSubscription.id,
        tier: updatedSubscription.tier,
        status: updatedSubscription.status,
        limits: {
          maxProjects: updatedSubscription.maxProjects,
          maxAnalysesPerMonth: updatedSubscription.maxAnalysesPerMonth,
          maxStorageGB: updatedSubscription.maxStorageGB,
        },
      },
      tierDetails,
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
