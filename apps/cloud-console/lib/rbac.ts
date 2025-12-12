import { OrgRole } from '@prisma/client';

/**
 * Role-Based Access Control (RBAC) System
 * 
 * Hierarchy: OWNER > ADMIN > DEVELOPER > VIEWER
 * Each role includes permissions of roles below it.
 */

export type Permission =
  // Organization Management
  | 'org:delete'
  | 'org:update'
  | 'org:view'
  // Member Management
  | 'members:invite'
  | 'members:remove'
  | 'members:update-role'
  | 'members:view'
  // Billing Management
  | 'billing:manage'
  | 'billing:view'
  // Project Management
  | 'projects:create'
  | 'projects:delete'
  | 'projects:update'
  | 'projects:view'
  // Analysis & Fixes
  | 'analysis:run'
  | 'analysis:view'
  | 'fixes:apply'
  | 'fixes:view'
  // Audits
  | 'audits:run'
  | 'audits:view'
  // API Keys
  | 'api-keys:create'
  | 'api-keys:delete'
  | 'api-keys:view';

/**
 * Permission matrix: Role → Permissions
 */
const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  OWNER: [
    // All organization permissions
    'org:delete',
    'org:update',
    'org:view',
    // All member permissions
    'members:invite',
    'members:remove',
    'members:update-role',
    'members:view',
    // All billing permissions
    'billing:manage',
    'billing:view',
    // All project permissions
    'projects:create',
    'projects:delete',
    'projects:update',
    'projects:view',
    // All analysis permissions
    'analysis:run',
    'analysis:view',
    'fixes:apply',
    'fixes:view',
    // All audit permissions
    'audits:run',
    'audits:view',
    // All API key permissions
    'api-keys:create',
    'api-keys:delete',
    'api-keys:view',
  ],
  ADMIN: [
    // Organization (read + update)
    'org:update',
    'org:view',
    // Members (invite + view, but not remove owners)
    'members:invite',
    'members:remove',
    'members:view',
    // Billing (view only)
    'billing:view',
    // Projects (full access)
    'projects:create',
    'projects:delete',
    'projects:update',
    'projects:view',
    // Analysis (full access)
    'analysis:run',
    'analysis:view',
    'fixes:apply',
    'fixes:view',
    // Audits (full access)
    'audits:run',
    'audits:view',
    // API keys (create + view)
    'api-keys:create',
    'api-keys:view',
  ],
  DEVELOPER: [
    // Organization (view only)
    'org:view',
    // Members (view only)
    'members:view',
    // Projects (create + update + view)
    'projects:create',
    'projects:update',
    'projects:view',
    // Analysis (full access)
    'analysis:run',
    'analysis:view',
    'fixes:apply',
    'fixes:view',
    // Audits (full access)
    'audits:run',
    'audits:view',
    // API keys (view only)
    'api-keys:view',
  ],
  VIEWER: [
    // Organization (view only)
    'org:view',
    // Members (view only)
    'members:view',
    // Projects (view only)
    'projects:view',
    // Analysis (view only)
    'analysis:view',
    'fixes:view',
    // Audits (view only)
    'audits:view',
    // API keys (view only)
    'api-keys:view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: OrgRole, permissions: Permission[]): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: OrgRole, permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if roleA can manage roleB (used for member management)
 * OWNER can manage all roles
 * ADMIN can manage DEVELOPER and VIEWER
 * DEVELOPER and VIEWER cannot manage anyone
 */
export function canManageRole(actorRole: OrgRole, targetRole: OrgRole): boolean {
  const hierarchy: Record<OrgRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    DEVELOPER: 2,
    VIEWER: 1,
  };

  return hierarchy[actorRole] > hierarchy[targetRole];
}

/**
 * Require permission or throw error
 */
export function requirePermission(role: OrgRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: Role ${role} does not have permission ${permission}`);
  }
}

/**
 * Require ALL permissions or throw error
 */
export function requireAllPermissions(role: OrgRole, permissions: Permission[]): void {
  const missing = permissions.filter((perm) => !hasPermission(role, perm));
  if (missing.length > 0) {
    throw new Error(`Forbidden: Role ${role} missing permissions: ${missing.join(', ')}`);
  }
}

/**
 * Require ANY permission or throw error
 */
export function requireAnyPermission(role: OrgRole, permissions: Permission[]): void {
  if (!hasAnyPermission(role, permissions)) {
    throw new Error(`Forbidden: Role ${role} does not have any of: ${permissions.join(', ')}`);
  }
}
