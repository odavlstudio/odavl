/**
 * ODAVL Feature Gating System
 * 
 * Controls access to Insight, Autopilot, and Guardian features based on subscription tier
 */

import { getPlan, type PlanTier } from '@/lib/plans';
import { prisma } from '@/lib/prisma';

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  remaining?: number;
}

/**
 * Check if organization can use Insight scan feature
 */
export async function canUseInsight(organizationId: string): Promise<FeatureGateResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscriptions: true },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  const plan = getPlan(org.tier);
  const limit = plan.features.insightScans;

  // Unlimited access
  if (limit === -1) {
    return {
      allowed: true,
      limit: -1,
    };
  }

  // Free tier: Check usage limits
  const subscription = org.subscriptions[0];
  if (!subscription) {
    // No subscription record yet, allow usage within free limits
    return {
      allowed: limit > 0,
      limit,
      used: 0,
      remaining: limit,
    };
  }

  const used = subscription.usedAnalyses;
  const remaining = Math.max(0, limit - used);

  if (remaining === 0) {
    return {
      allowed: false,
      reason: `Monthly scan limit reached (${limit}). Upgrade to Pro for unlimited scans.`,
      limit,
      used,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit,
    used,
    remaining,
  };
}

/**
 * Check if organization can use Autopilot feature
 */
export async function canUseAutopilot(
  organizationId: string,
  mode: 'readonly' | 'full'
): Promise<FeatureGateResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscriptions: true },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  const plan = getPlan(org.tier);
  const autopilotMode = plan.features.autopilotMode;

  // Check mode access
  if (mode === 'full' && autopilotMode !== 'full') {
    return {
      allowed: false,
      reason: 'Full Autopilot mode requires Pro or Enterprise plan. Current plan only allows readonly mode.',
    };
  }

  if (autopilotMode === 'none') {
    return {
      allowed: false,
      reason: 'Autopilot is not available on this plan.',
    };
  }

  // Check cycle limits (for full mode execution)
  if (mode === 'full') {
    const cycleLimit = plan.features.autopilotCycles;
    
    // Unlimited cycles
    if (cycleLimit === -1) {
      return {
        allowed: true,
        limit: -1,
      };
    }

    // Free tier doesn't have full mode
    if (cycleLimit === 0) {
      return {
        allowed: false,
        reason: 'Full Autopilot cycles require Pro or Enterprise plan.',
      };
    }

    const subscription = org.subscriptions[0];
    if (!subscription) {
      return {
        allowed: true,
        limit: cycleLimit,
        used: 0,
        remaining: cycleLimit,
      };
    }

    const used = subscription.usedFixes;
    const remaining = Math.max(0, cycleLimit - used);

    if (remaining === 0) {
      return {
        allowed: false,
        reason: `Monthly Autopilot cycle limit reached (${cycleLimit}). Upgrade to Pro for unlimited cycles.`,
        limit: cycleLimit,
        used,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      limit: cycleLimit,
      used,
      remaining,
    };
  }

  // Readonly mode always allowed if autopilotMode is not 'none'
  return {
    allowed: true,
  };
}

/**
 * Check if organization can use Guardian testing feature
 */
export async function canUseGuardian(organizationId: string): Promise<FeatureGateResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscriptions: true },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  const plan = getPlan(org.tier);
  const limit = plan.features.guardianTests;

  // Unlimited access
  if (limit === -1) {
    return {
      allowed: true,
      limit: -1,
    };
  }

  // Free tier: Check usage limits
  const subscription = org.subscriptions[0];
  if (!subscription) {
    return {
      allowed: limit > 0,
      limit,
      used: 0,
      remaining: limit,
    };
  }

  const used = subscription.usedAudits;
  const remaining = Math.max(0, limit - used);

  if (remaining === 0) {
    return {
      allowed: false,
      reason: `Monthly test limit reached (${limit}). Upgrade to Pro for unlimited tests.`,
      limit,
      used,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit,
    used,
    remaining,
  };
}

/**
 * Increment Insight usage counter
 */
export async function trackInsightUsage(organizationId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    // Create subscription record if doesn't exist (for Free tier)
    await prisma.subscription.create({
      data: {
        organizationId,
        usedAnalyses: 1,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  } else {
    await prisma.subscription.update({
      where: { organizationId },
      data: {
        usedAnalyses: { increment: 1 },
      },
    });
  }
}

/**
 * Increment Autopilot usage counter
 */
export async function trackAutopilotUsage(organizationId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    await prisma.subscription.create({
      data: {
        organizationId,
        usedFixes: 1,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    await prisma.subscription.update({
      where: { organizationId },
      data: {
        usedFixes: { increment: 1 },
      },
    });
  }
}

/**
 * Increment Guardian usage counter
 */
export async function trackGuardianUsage(organizationId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    await prisma.subscription.create({
      data: {
        organizationId,
        usedAudits: 1,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    await prisma.subscription.update({
      where: { organizationId },
      data: {
        usedAudits: { increment: 1 },
      },
    });
  }
}

/**
 * Reset monthly usage counters (called by cron job at end of billing period)
 */
export async function resetMonthlyUsage(organizationId: string): Promise<void> {
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      usedAnalyses: 0,
      usedFixes: 0,
      usedAudits: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

/**
 * Check if organization can add team members
 */
export async function canAddTeamMember(organizationId: string): Promise<FeatureGateResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: true,
    },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  const plan = getPlan(org.tier);
  const limit = plan.features.teamMembers;

  // Unlimited team members
  if (limit === -1) {
    return {
      allowed: true,
      limit: -1,
    };
  }

  const currentMembers = org.members.length;
  const remaining = Math.max(0, limit - currentMembers);

  if (remaining === 0) {
    return {
      allowed: false,
      reason: `Team member limit reached (${limit}). Upgrade to add more members.`,
      limit,
      used: currentMembers,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit,
    used: currentMembers,
    remaining,
  };
}
