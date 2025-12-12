/**
 * Usage Tracking Utility for ODAVL Cloud Console
 * Tracks API calls, test runs, and resource usage
 */

import { prisma } from '@/lib/prisma';

export enum UsageEventType {
  INSIGHT_ANALYSIS = 'insight_analysis',
  GUARDIAN_TEST_RUN = 'guardian_test_run',
  AUTOPILOT_JOB = 'autopilot_job',
  API_CALL = 'api_call',
}

export interface UsageMetadata {
  projectId?: string;
  duration?: number;
  linesAnalyzed?: number;
  errorsFound?: number;
  [key: string]: any;
}

/**
 * Track a usage event
 */
export async function trackUsage(
  organizationId: string,
  userId: string,
  eventType: UsageEventType,
  metadata?: UsageMetadata
): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      organizationId,
      userId,
      eventType,
      metadata: metadata || {},
      timestamp: new Date(),
    },
  });

  // Update organization usage counters
  await updateUsageCounters(organizationId, eventType);
}

/**
 * Update organization usage counters
 */
async function updateUsageCounters(
  organizationId: string,
  eventType: UsageEventType
): Promise<void> {
  const updates: any = {};

  switch (eventType) {
    case UsageEventType.GUARDIAN_TEST_RUN:
      updates.testRunsUsed = { increment: 1 };
      break;
    case UsageEventType.API_CALL:
      updates.apiCallsUsed = { increment: 1 };
      break;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: updates,
    });
  }
}

/**
 * Check if organization has exceeded limits
 */
export async function checkUsageLimits(
  organizationId: string
): Promise<{ exceeded: boolean; limit?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    return { exceeded: true, limit: 'organization_not_found' };
  }

  // Free tier limits (example)
  const limits: Record<string, number> = {
    FREE: 100,
    PRO: 1000,
    ENTERPRISE: -1, // unlimited
  };

  const limit = limits[org.tier];
  if (limit === -1) return { exceeded: false };

  // TODO: Implement testRunsUsed tracking in Organization or Subscription model
  // For now, allow all test runs
  return { exceeded: false };
}
