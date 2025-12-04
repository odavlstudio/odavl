// Row-Level Security Helpers
// Week 2: Multi-Tenancy Authorization

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Authorization Error
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Get current session with type safety
 * Redirects to signin page if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return session;
}

/**
 * Verify user belongs to organization
 */
export async function requireOrgAccess(orgId: string) {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { orgId: true, role: true },
  });

  if (!user || user.orgId !== orgId) {
    throw new UnauthorizedError('No access to this organization');
  }

  return { session, user };
}

/**
 * Execute function with organization access check
 */
export async function withOrgAccess<T>(
  orgId: string,
  fn: (session: Awaited<ReturnType<typeof requireAuth>>) => Promise<T>
): Promise<T> {
  const { session } = await requireOrgAccess(orgId);
  return fn(session);
}

/**
 * Verify user has admin role in organization
 */
export async function requireOrgAdmin(orgId: string) {
  const { session, user } = await requireOrgAccess(orgId);

  if (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'SUPERADMIN') {
    throw new UnauthorizedError('Admin access required');
  }

  return { session, user };
}

/**
 * Verify user has owner role in organization
 */
export async function requireOrgOwner(orgId: string) {
  const { session, user } = await requireOrgAccess(orgId);

  if (user.role !== 'OWNER' && user.role !== 'SUPERADMIN') {
    throw new UnauthorizedError('Owner access required');
  }

  return { session, user };
}

/**
 * Verify user has access to project
 */
export async function requireProjectAccess(projectId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      orgId: true,
      organization: {
        select: {
          users: {
            where: { id: session.user.id },
            select: { id: true }
          }
        }
      }
    },
  });

  if (!project || project.organization.users.length === 0) {
    throw new UnauthorizedError('No access to this project');
  }

  return { session, project };
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: true,
    },
  });

  if (!user?.organization) {
    return [];
  }

  return [user.organization];
}

/**
 * Check if user can perform action based on plan limits
 */
export async function checkPlanLimit(
  orgId: string,
  resource: 'apiCalls' | 'insightRuns' | 'autopilotRuns' | 'guardianTests'
) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      plan: true,
      monthlyApiCalls: true,
      monthlyInsightRuns: true,
      monthlyAutopilotRuns: true,
      monthlyGuardianTests: true,
    },
  });

  if (!org) {
    throw new UnauthorizedError('Organization not found');
  }

  const limits = {
    FREE: {
      apiCalls: 1000,
      insightRuns: 50,
      autopilotRuns: 10,
      guardianTests: 25,
    },
    PRO: {
      apiCalls: 100000,
      insightRuns: 1000,
      autopilotRuns: 500,
      guardianTests: 500,
    },
    ENTERPRISE: {
      apiCalls: Infinity,
      insightRuns: Infinity,
      autopilotRuns: Infinity,
      guardianTests: Infinity,
    },
  };

  const limit = limits[org.plan][resource];
  const usage = org[`monthly${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof org] as number;

  if (usage >= limit) {
    throw new UnauthorizedError(
      `Plan limit exceeded for ${resource}. Upgrade to continue.`
    );
  }

  return { limit, usage, remaining: limit - usage };
}

/**
 * Increment usage counter for resource
 */
export async function incrementUsage(
  orgId: string,
  resource: 'apiCalls' | 'insightRuns' | 'autopilotRuns' | 'guardianTests'
) {
  const field = `monthly${resource.charAt(0).toUpperCase() + resource.slice(1)}` as
    'monthlyApiCalls' | 'monthlyInsightRuns' | 'monthlyAutopilotRuns' | 'monthlyGuardianTests';

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      [field]: {
        increment: 1,
      },
    },
  });
}

