/**
 * POST /api/billing/initialize
 * Initialize subscription for existing users (one-time migration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@odavl-studio/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

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

    // Check if subscription already exists
    const existing = await prisma.subscription.findUnique({
      where: { userId: payload.userId },
    });

    if (existing) {
      return NextResponse.json({
        message: 'Subscription already exists',
        subscription: existing,
      });
    }

    // Create FREE subscription
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: payload.userId,
        tier: 'FREE',
        status: 'active',
        maxProjects: 3,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 1.0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: oneMonthLater,
      },
    });

    return NextResponse.json({
      message: 'Subscription initialized',
      subscription,
    });
  } catch (error) {
    console.error('Initialize subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize subscription' },
      { status: 500 }
    );
  }
}
