/**
 * Usage Tracking System
 * Sprint 3: Billing Infrastructure - Task 3.3
 */

import { prisma } from '@/lib/prisma';
import type { UsageType, SubscriptionTier } from '@odavl/types';

/**
 * Track usage for a user's subscription
 */
export async function trackUsage(
  userId: string,
  type: UsageType,
  amount: number = 1,
  metadata?: Record<string, any>
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('No subscription found for user');
  }

  // Create usage record
  await prisma.usageRecord.create({
    data: {
      subscriptionId: subscription.id,
      type,
      amount,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Update subscription usage counters
  if (type === 'ANALYSIS') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        usedAnalysesMonth: {
          increment: amount,
        },
      },
    });
  } else if (type === 'STORAGE_WRITE') {
    // Assume amount is in bytes, convert to GB
    const gbUsed = amount / (1024 * 1024 * 1024);
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        usedStorageGB: {
          increment: gbUsed,
        },
      },
    });
  } else if (type === 'PROJECT_CREATE') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        projectsCount: {
          increment: amount,
        },
      },
    });
  }
}

/**
 * Check if user is within limit for a specific resource type
 */
export async function checkLimit(
  userId: string,
  type: 'projects' | 'analyses' | 'storage'
): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return false;
  }

  switch (type) {
    case 'projects':
      if (subscription.maxProjects === -1) return true; // Unlimited
      return subscription.projectsCount < subscription.maxProjects;

    case 'analyses':
      if (subscription.maxAnalysesPerMonth === -1) return true; // Unlimited
      return subscription.usedAnalysesMonth < subscription.maxAnalysesPerMonth;

    case 'storage':
      if (subscription.maxStorageGB === -1) return true; // Unlimited
      return subscription.usedStorageGB < subscription.maxStorageGB;

    default:
      return false;
  }
}

/**
 * Get current usage for a user
 */
export async function getCurrentUsage(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      usageRecords: {
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)), // This month
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      },
    },
  });

  if (!subscription) {
    return null;
  }

  // Calculate usage by type
  const usageByType = subscription.usageRecords.reduce(
    (acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + record.amount;
      return acc;
    },
    {} as Record<UsageType, number>
  );

  return {
    subscription: {
      id: subscription.id,
      tier: subscription.tier as SubscriptionTier,
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
    },
    usageByType,
    recentRecords: subscription.usageRecords.slice(0, 10).map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      createdAt: r.createdAt,
    })),
  };
}

/**
 * Reset monthly usage counters (run at start of each billing period)
 */
export async function resetMonthlyUsage(subscriptionId: string): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      usedAnalysesMonth: 0,
      // Note: usedStorageGB and projectsCount are cumulative, not reset
    },
  });
}

/**
 * Get usage statistics for a date range
 */
export async function getUsageStats(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return null;
  }

  const records = await prisma.usageRecord.findMany({
    where: {
      subscriptionId: subscription.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by type
  const byType = records.reduce(
    (acc, record) => {
      if (!acc[record.type]) {
        acc[record.type] = { count: 0, total: 0 };
      }
      acc[record.type].count++;
      acc[record.type].total += record.amount;
      return acc;
    },
    {} as Record<UsageType, { count: number; total: number }>
  );

  // Group by day
  const byDay = records.reduce(
    (acc, record) => {
      const day = record.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { count: 0, types: {} };
      }
      acc[day].count++;
      acc[day].types[record.type] = (acc[day].types[record.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, { count: number; types: Record<UsageType, number> }>
  );

  return {
    totalRecords: records.length,
    byType,
    byDay,
    period: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Middleware to enforce usage limits
 * Returns 429 if limit exceeded
 */
export function enforceLimit(type: 'projects' | 'analyses' | 'storage') {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const withinLimit = await checkLimit(userId, type);

    if (!withinLimit) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: `You have reached your ${type} limit. Please upgrade your plan.`,
        limitType: type,
      });
    }

    next();
  };
}

/**
 * Check if subscription needs billing period reset
 */
export async function checkBillingPeriodReset(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return false;
  }

  const now = new Date();
  
  if (now > subscription.currentPeriodEnd) {
    // Reset billing period
    const nextPeriodEnd = new Date(subscription.currentPeriodEnd);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd: nextPeriodEnd,
        usedAnalysesMonth: 0, // Reset monthly counter
      },
    });

    return true;
  }

  return false;
}
