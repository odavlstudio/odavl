import { prisma } from './prisma';
import { USAGE_LIMITS } from './stripe';
import { logUsageEvent } from './logger';
import { recordUsageEvent, recordQuotaExceeded } from './metrics';

export type UsageType = 'analysis' | 'fix' | 'audit';

export async function trackUsage(
  userId: string,
  organizationId: string,
  type: UsageType,
  metadata?: Record<string, any>
) {
  // Create usage event in database
  await prisma.usageEvent.create({
    data: {
      userId,
      organizationId,
      eventType: type.toUpperCase(),
      metadata: metadata || {},
    },
  });

  // Log usage event
  logUsageEvent(userId, organizationId, type, metadata);

  // Update subscription usage counters
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { organization: true },
  });

  if (subscription) {
    const updates: any = {};
    if (type === 'analysis') updates.analysesUsed = { increment: 1 };
    if (type === 'fix') updates.fixesUsed = { increment: 1 };
    if (type === 'audit') updates.auditsUsed = { increment: 1 };

    await prisma.subscription.update({
      where: { organizationId },
      data: updates,
    });

    // Record metrics
    recordUsageEvent(type, subscription.organization.tier);
  }
}

export async function checkQuota(
  organizationId: string,
  type: UsageType
): Promise<{ allowed: boolean; limit: number; used: number }> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscriptions: true,
    },
  });

  if (!organization) {
    return { allowed: false, limit: 0, used: 0 };
  }

  const tier = organization.tier as keyof typeof USAGE_LIMITS;
  const limits = USAGE_LIMITS[tier];
  const subscription = organization.subscriptions[0];

  let limit: number;
  let used: number;

  switch (type) {
    case 'analysis':
      limit = limits.analyses;
      used = subscription?.usedAnalyses || 0;
      break;
    case 'fix':
      limit = limits.fixes;
      used = subscription?.usedFixes || 0;
      break;
    case 'audit':
      limit = limits.audits;
      used = subscription?.usedAudits || 0;
      break;
    default:
      return { allowed: false, limit: 0, used: 0 };
  }

  // -1 means unlimited
  const allowed = limit === -1 || used < limit;

  return { allowed, limit, used };
}

export async function enforceQuota(organizationId: string, type: UsageType) {
  const { allowed, limit, used } = await checkQuota(organizationId, type);

  if (!allowed) {
    // Get organization tier for metrics
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tier: true },
    });

    // Record quota exceeded event
    if (org) {
      recordQuotaExceeded(type, org.tier);
    }

    throw new Error(
      `Quota exceeded for ${type}. Used: ${used}/${limit === -1 ? '∞' : limit}`
    );
  }
}
