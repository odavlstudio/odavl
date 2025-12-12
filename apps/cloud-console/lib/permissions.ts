/**
 * Permission Enforcement Layer
 * Integrates with RBAC system to enforce permissions on API endpoints
 */

import { prisma } from './prisma';
import { hasPermission } from './rbac';

export type AutopilotPermission = 'autopilot.run' | 'autopilot.view' | 'autopilot.undo';

/**
 * Check if user has permission for an action in the organization
 * @param userId - User ID to check
 * @param organizationId - Organization context
 * @param permission - Permission string (e.g., 'autopilot.run')
 * @returns true if user has permission, false otherwise
 */
export async function enforcePermission(
  userId: string,
  organizationId: string,
  permission: string
): Promise<boolean> {
  try {
    // Find user's role in the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return false; // User not in organization
    }

    // Map autopilot permissions to RBAC permissions
    const permissionMap: Record<string, string> = {
      'autopilot.run': 'fixes:apply',
      'autopilot.view': 'fixes:view',
      'autopilot.undo': 'fixes:apply',
      'insight.run': 'analysis:run',
      'insight.view': 'analysis:view',
      'guardian.run': 'audits:run',
      'guardian.view': 'audits:view',
    };

    const rbacPermission = permissionMap[permission] || permission;
    
    // Use RBAC system to check permission
    return hasPermission(membership.role, rbacPermission as any);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Require permission or throw 403 error
 * @param userId - User ID to check
 * @param organizationId - Organization context
 * @param permission - Permission string
 * @throws Error with status 403 if permission denied
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permission: string
): Promise<void> {
  const allowed = await enforcePermission(userId, organizationId, permission);
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
