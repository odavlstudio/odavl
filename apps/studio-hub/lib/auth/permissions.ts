/**
 * ODAVL Studio - Role-Based Access Control (RBAC)
 * Defines roles, permissions, and access control utilities
 */

export enum Role {
  OWNER = 'owner',     // Full access including billing
  ADMIN = 'admin',     // All except billing
  MEMBER = 'member',   // View + limited actions
  VIEWER = 'viewer'    // Read-only
}

export type Permission =
  | '*' // Wildcard - all permissions (owner only)
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'projects.view'
  | 'projects.scan'
  | 'issues.view'
  | 'issues.fix'
  | 'team.invite'
  | 'team.remove'
  | 'team.edit'
  | 'settings.view'
  | 'settings.edit'
  | 'billing.view'
  | 'billing.edit'
  | 'autopilot.run'
  | 'autopilot.undo'
  | 'guardian.test'
  | 'insight.analyze';

/**
 * Role-to-Permissions mapping
 * Defines what each role can do
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: ['*'], // Owner has all permissions

  [Role.ADMIN]: [
    'projects.create',
    'projects.edit',
    'projects.delete',
    'projects.view',
    'projects.scan',
    'issues.view',
    'issues.fix',
    'team.invite',
    'team.remove',
    'team.edit',
    'settings.view',
    'settings.edit',
    'autopilot.run',
    'autopilot.undo',
    'guardian.test',
    'insight.analyze',
  ],

  [Role.MEMBER]: [
    'projects.view',
    'projects.scan',
    'issues.view',
    'issues.fix',
    'insight.analyze',
    'settings.view',
  ],

  [Role.VIEWER]: [
    'projects.view',
    'issues.view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role];

  // Owner has wildcard access
  if (permissions.includes('*')) {
    return true;
  }

  // Check specific permission
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: Role): string {
  const roleNames: Record<Role, string> = {
    [Role.OWNER]: 'Owner',
    [Role.ADMIN]: 'Administrator',
    [Role.MEMBER]: 'Member',
    [Role.VIEWER]: 'Viewer',
  };

  return roleNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    [Role.OWNER]: 'Full access to all features including billing and team management',
    [Role.ADMIN]: 'All permissions except billing. Can manage projects and team members',
    [Role.MEMBER]: 'Can view projects, run scans, and apply fixes',
    [Role.VIEWER]: 'Read-only access to projects and issues',
  };

  return descriptions[role];
}

/**
 * Get all permissions for a role (expanded)
 */
export function getRolePermissions(role: Role): Permission[] {
  const permissions = rolePermissions[role];

  // If wildcard, return all permissions
  if (permissions.includes('*')) {
    return Object.values(rolePermissions)
      .flat()
      .filter(p => p !== '*') as Permission[];
  }

  return permissions;
}

/**
 * Check if role can perform action on resource
 */
export function canPerformAction(
  role: Role,
  resource: 'projects' | 'issues' | 'team' | 'settings' | 'billing' | 'autopilot' | 'guardian' | 'insight',
  action: 'view' | 'create' | 'edit' | 'delete' | 'scan' | 'fix' | 'invite' | 'remove' | 'run' | 'undo' | 'test' | 'analyze'
): boolean {
  const permission = `${resource}.${action}` as Permission;
  return hasPermission(role, permission);
}
