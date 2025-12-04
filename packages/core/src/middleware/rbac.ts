/**
 * RBAC Authorization Middleware
 * Provides role-based access control utilities
 */

import { organizationService } from '../services/organization';
import { MemberRole } from '../../../types/src/multi-tenant';

/**
 * Check if user has required role
 */
export async function requireRole(
  organizationId: string,
  userId: string,
  requiredRoles: MemberRole[]
): Promise<boolean> {
  const role = await organizationService.getMemberRole(organizationId, userId);
  
  if (!role) {
    return false;
  }

  return requiredRoles.includes(role);
}

/**
 * Check if user has required permission
 */
export async function requirePermission(
  organizationId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  return organizationService.hasPermission(organizationId, userId, permission);
}

/**
 * Get user effective permissions
 */
export async function getUserPermissions(
  organizationId: string,
  userId: string
): Promise<string[]> {
  const member = await organizationService.getMemberRole(organizationId, userId);
  
  if (!member) {
    return [];
  }

  const { ROLE_PERMISSIONS } = await import('../../../types/src/multi-tenant');
  return ROLE_PERMISSIONS[member] || [];
}

/**
 * Check if user can manage member
 * Rules:
 * - OWNER can manage anyone except other OWNERs
 * - ADMIN can manage MEMBER and VIEWER
 * - MEMBER cannot manage anyone
 * - VIEWER cannot manage anyone
 */
export async function canManageMember(
  organizationId: string,
  managerId: string,
  targetUserId: string
): Promise<boolean> {
  const managerRole = await organizationService.getMemberRole(organizationId, managerId);
  const targetRole = await organizationService.getMemberRole(organizationId, targetUserId);

  if (!managerRole || !targetRole) {
    return false;
  }

  // OWNER can manage anyone except other OWNERs
  if (managerRole === 'OWNER') {
    return targetRole !== 'OWNER';
  }

  // ADMIN can manage MEMBER and VIEWER
  if (managerRole === 'ADMIN') {
    return targetRole === 'MEMBER' || targetRole === 'VIEWER';
  }

  // MEMBER and VIEWER cannot manage anyone
  return false;
}

/**
 * Check if user can assign role
 * Rules:
 * - OWNER can assign any role except OWNER
 * - ADMIN can assign MEMBER and VIEWER
 * - MEMBER cannot assign any role
 * - VIEWER cannot assign any role
 */
export async function canAssignRole(
  organizationId: string,
  assignerId: string,
  targetRole: MemberRole
): Promise<boolean> {
  const assignerRole = await organizationService.getMemberRole(organizationId, assignerId);

  if (!assignerRole) {
    return false;
  }

  // OWNER can assign any role except OWNER
  if (assignerRole === 'OWNER') {
    return targetRole !== 'OWNER';
  }

  // ADMIN can assign MEMBER and VIEWER
  if (assignerRole === 'ADMIN') {
    return targetRole === 'MEMBER' || targetRole === 'VIEWER';
  }

  // MEMBER and VIEWER cannot assign any role
  return false;
}

/**
 * Validate resource access
 * Ensures user has access to resource within organization
 */
export async function validateResourceAccess(
  organizationId: string,
  userId: string,
  resourceType: 'project' | 'apikey' | 'webhook',
  resourceId: string
): Promise<boolean> {
  // Check if user is member of organization
  const isMember = await organizationService.isMember(organizationId, userId);
  if (!isMember) {
    return false;
  }

  // Check permission based on resource type
  const permissionMap = {
    project: 'projects:read',
    apikey: 'apikeys:read',
    webhook: 'webhooks:read',
  };

  const permission = permissionMap[resourceType];
  return organizationService.hasPermission(organizationId, userId, permission);
}
