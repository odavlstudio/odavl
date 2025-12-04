/**
 * Usage Tracking Utility
 * Tracks API usage for billing and analytics
 */

import { prisma } from '@/lib/prisma';

export interface UsageData {
  userId: string;
  orgId: string;
  product: string;
  action: string;
  endpoint: string;
  ipAddress?: string;
  apiKeyId?: string;
  billable?: boolean;
  credits?: number;
}

export async function trackUsage(data: UsageData): Promise<void> {
  try {
    await prisma.usageRecord.create({
      data: {
        userId: data.userId,
        orgId: data.orgId,
        product: data.product,
        action: data.action,
        endpoint: data.endpoint,
        ipAddress: data.ipAddress || null,
        apiKeyId: data.apiKeyId || null,
        billable: data.billable ?? true,
        credits: data.credits ?? 1,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Don't fail the request if usage tracking fails
    console.error('Failed to track usage:', error);
  }
}

export async function getUserUsage(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ total: number; byProduct: Record<string, number> }> {
  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      billable: true,
    },
    select: {
      product: true,
      credits: true,
    },
  });

  const byProduct: Record<string, number> = {};
  let total = 0;

  for (const record of records) {
    total += record.credits;
    byProduct[record.product] = (byProduct[record.product] || 0) + record.credits;
  }

  return { total, byProduct };
}

export async function getOrgUsage(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<{ total: number; byProduct: Record<string, number>; byUser: Record<string, number> }> {
  const records = await prisma.usageRecord.findMany({
    where: {
      orgId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      billable: true,
    },
    select: {
      userId: true,
      product: true,
      credits: true,
    },
  });

  const byProduct: Record<string, number> = {};
  const byUser: Record<string, number> = {};
  let total = 0;

  for (const record of records) {
    total += record.credits;
    byProduct[record.product] = (byProduct[record.product] || 0) + record.credits;
    byUser[record.userId] = (byUser[record.userId] || 0) + record.credits;
  }

  return { total, byProduct, byUser };
}
