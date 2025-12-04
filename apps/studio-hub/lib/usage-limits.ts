import { prisma } from './prisma';
import { logger } from './logger';

export const PLAN_LIMITS = {
  FREE: {
    apiCalls: 1000,
    projects: 2,
    users: 3,
    insightScans: 50,
    autopilotRuns: 10,
    guardianTests: 20,
    storage: 100, // MB
  },
  PRO: {
    apiCalls: 50000,
    projects: 10,
    users: 10,
    insightScans: 1000,
    autopilotRuns: 500,
    guardianTests: 500,
    storage: 5000, // MB
  },
  ENTERPRISE: {
    apiCalls: Infinity,
    projects: Infinity,
    users: Infinity,
    insightScans: Infinity,
    autopilotRuns: Infinity,
    guardianTests: Infinity,
    storage: Infinity,
  },
};

export async function checkUsageLimit(
  orgId: string,
  resource: keyof typeof PLAN_LIMITS.FREE
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });

  if (!org) {
    return { allowed: false, current: 0, limit: 0 };
  }

  const limits = PLAN_LIMITS[org.plan];
  const limit = limits[resource];

  // Get current usage for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let current = 0;

  switch (resource) {
    case 'apiCalls': {
      const usage = await prisma.auditLog.count({
        where: {
          user: { orgId },
          action: 'api_call',
          timestamp: { gte: startOfMonth },
        },
      });
      current = usage;
      break;
    }

    case 'projects': {
      current = await prisma.project.count({
        where: { orgId },
      });
      break;
    }

    case 'users': {
      current = await prisma.user.count({
        where: { orgId },
      });
      break;
    }

    case 'insightScans': {
      current = await prisma.insightRun.count({
        where: {
          project: { orgId },
          createdAt: { gte: startOfMonth },
        },
      });
      break;
    }

    case 'autopilotRuns': {
      current = await prisma.autopilotRun.count({
        where: {
          project: { orgId },
          createdAt: { gte: startOfMonth },
        },
      });
      break;
    }

    case 'guardianTests': {
      current = await prisma.guardianTest.count({
        where: {
          project: { orgId },
          createdAt: { gte: startOfMonth },
        },
      });
      break;
    }
  }

  const allowed = current < limit;

  return { allowed, current, limit };
}

export async function incrementUsage(orgId: string, resource: keyof typeof PLAN_LIMITS.FREE) {
  // This would be called after successful API calls/operations
  // For now, we track via audit logs
  logger.debug(`Usage incremented for org ${orgId}: ${resource}`, { orgId, resource });
}
