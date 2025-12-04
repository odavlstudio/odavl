/**
 * ODAVL Studio - Permission Middleware
 * Enforces role-based access control for protected routes and actions
 */

import React from 'react';
import { hasPermission, type Permission, type Role } from './permissions';

/**
 * Custom error for permission failures
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Require specific permission for an action
 * Throws ForbiddenError if user doesn't have permission
 */
export function requirePermission(userRole: Role, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new ForbiddenError(
      `This action requires the '${permission}' permission. Your role (${userRole}) does not have access.`
    );
  }
}

/**
 * Require any of the specified permissions
 * Throws ForbiddenError if user doesn't have at least one
 */
export function requireAnyPermission(userRole: Role, permissions: Permission[]): void {
  const hasAny = permissions.some(permission => hasPermission(userRole, permission));

  if (!hasAny) {
    throw new ForbiddenError(
      `This action requires one of: ${permissions.join(', ')}. Your role (${userRole}) does not have access.`
    );
  }
}

/**
 * Require all of the specified permissions
 * Throws ForbiddenError if user doesn't have all
 */
export function requireAllPermissions(userRole: Role, permissions: Permission[]): void {
  const missingPermissions = permissions.filter(
    permission => !hasPermission(userRole, permission)
  );

  if (missingPermissions.length > 0) {
    throw new ForbiddenError(
      `This action requires all of: ${permissions.join(', ')}. Missing: ${missingPermissions.join(', ')}`
    );
  }
}

/**
 * Check permission and return boolean (non-throwing version)
 * Useful for conditional rendering
 */
export function checkPermission(userRole: Role | null, permission: Permission): boolean {
  if (!userRole) return false;
  return hasPermission(userRole, permission);
}

/**
 * Server-side permission check for API routes
 * Example usage in API route:
 *
 * ```ts
 * const session = await getServerSession();
 * await requirePermissionAsync(session, 'projects.create');
 * ```
 */
export async function requirePermissionAsync(
  session: { user?: { role?: Role } } | null,
  permission: Permission
): Promise<void> {
  if (!session?.user?.role) {
    throw new ForbiddenError('Authentication required');
  }

  requirePermission(session.user.role, permission);
}

/**
 * Middleware wrapper for protected actions
 * Returns a function that checks permission before executing action
 */
export function withPermission<T extends (...args: any[]) => any>(
  userRole: Role,
  permission: Permission,
  action: T
): T {
  return ((...args: Parameters<T>) => {
    requirePermission(userRole, permission);
    return action(...args);
  }) as T;
}

/**
 * HOC for protecting components with permission checks
 * Example:
 *
 * ```tsx
 * const ProtectedButton = withPermissionGuard(
 *   Button,
 *   'projects.create',
 *   <div>You don't have permission</div>
 * );
 * ```
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ReactNode
) {
  return (props: P & { userRole: Role }) => {
    const { userRole, ...componentProps } = props;

    if (!hasPermission(userRole, permission)) {
      return fallback || null;
    }

    return React.createElement(Component, componentProps as P);
  };
}
