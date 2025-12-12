import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import type { OrgRole } from '@prisma/client';
import { hasPermission, requirePermission, Permission } from './rbac';

/**
 * Organization context for multi-tenancy
 * Includes user's role and organization details
 */
export interface OrgContext {
  userId: string;
  organizationId: string;
  organizationSlug: string;
  role: OrgRole;
  userEmail: string;
}

/**
 * Get organization context from session
 * Throws if user is not authenticated or not a member of any organization
 */
export async function getOrgContext(organizationId?: string): Promise<OrgContext> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized: No session found');
  }

  // Fetch user with organizations
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Unauthorized: User not found');
  }

  if (user.memberships.length === 0) {
    throw new Error('Forbidden: User is not a member of any organization');
  }

  // If organizationId specified, use that organization
  let membership;
  if (organizationId) {
    membership = user.memberships.find((m: { organizationId: string }) => m.organizationId === organizationId);
    if (!membership) {
      throw new Error('Forbidden: User is not a member of this organization');
    }
  } else {
    // Use first organization (default)
    membership = user.memberships[0];
  }

  return {
    userId: user.id,
    organizationId: membership.organizationId,
    organizationSlug: membership.organization.slug,
    role: membership.role,
    userEmail: user.email,
  };
}

/**
 * Get organization context with permission check
 * Throws if user doesn't have required permission
 */
export async function getOrgContextWithPermission(
  permission: Permission,
  organizationId?: string
): Promise<OrgContext> {
  const context = await getOrgContext(organizationId);
  requirePermission(context.role, permission);
  return context;
}

/**
 * Check if user has permission in organization
 * Returns false instead of throwing (for conditional rendering)
 */
export async function checkOrgPermission(
  permission: Permission,
  organizationId?: string
): Promise<boolean> {
  try {
    const context = await getOrgContext(organizationId);
    return hasPermission(context.role, permission);
  } catch {
    return false;
  }
}

/**
 * Get all organizations user is a member of
 */
export async function getUserOrganizations(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    role: OrgRole;
    tier: string;
  }>
> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  return user.memberships.map((m: {
    organizationId: string;
    organization: { name: string; slug: string; tier: string };
    role: OrgRole;
  }) => ({
    id: m.organizationId,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    tier: m.organization.tier,
  }));
}

/**
 * Switch active organization (for UI)
 * Returns new organization context
 */
export async function switchOrganization(organizationId: string): Promise<OrgContext> {
  return getOrgContext(organizationId);
}

// Re-export middleware functions for convenience
export { withOrgContext, withPermission, withAnyPermission } from './rbac-middleware';
