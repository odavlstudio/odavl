'use client';

/**
 * ODAVL Studio - Client-Side Permission Components
 * React components and hooks for permission-based UI rendering
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { type Role, type Permission, hasPermission } from './permissions';

/**
 * Permission Context
 * Provides current user's role throughout the component tree
 */
interface PermissionContextValue {
  userRole: Role | null;
  userId: string | null;
}

const PermissionContext = createContext<PermissionContextValue>({
  userRole: null,
  userId: null,
});

/**
 * Permission Provider
 * Wrap your app with this to provide role context
 */
export function PermissionProvider({
  children,
  userRole,
  userId,
}: {
  children: ReactNode;
  userRole: Role | null;
  userId: string | null;
}) {
  return (
    <PermissionContext.Provider value={{ userRole, userId }}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook: usePermission
 * Access current user's role and check permissions
 */
export function usePermission() {
  const context = useContext(PermissionContext);

  if (!context) {
    console.warn('usePermission must be used within PermissionProvider');
  }

  const can = (permission: Permission): boolean => {
    if (!context.userRole) return false;
    return hasPermission(context.userRole, permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    if (!context.userRole) return false;
    return permissions.some(permission => hasPermission(context.userRole!, permission));
  };

  const canAll = (permissions: Permission[]): boolean => {
    if (!context.userRole) return false;
    return permissions.every(permission => hasPermission(context.userRole!, permission));
  };

  const isRole = (role: Role): boolean => {
    return context.userRole === role;
  };

  return {
    userRole: context.userRole,
    userId: context.userId,
    can,
    canAny,
    canAll,
    isRole,
    isOwner: context.userRole === 'owner',
    isAdmin: context.userRole === 'admin',
    isMember: context.userRole === 'member',
    isViewer: context.userRole === 'viewer',
  };
}

/**
 * Helper function to check permission access
 * Shared logic for Can/Cannot components
 */
function checkPermissionAccess(
  permission: Permission | undefined,
  permissions: Permission[] | undefined,
  requireAll: boolean,
  can: (p: Permission) => boolean,
  canAny: (p: Permission[]) => boolean,
  canAll: (p: Permission[]) => boolean
): boolean {
  if (permission) {
    return can(permission);
  } else if (permissions) {
    return requireAll ? canAll(permissions) : canAny(permissions);
  }
  return false;
}

/**
 * Component: Can
 * Conditionally render children based on permission
 *
 * Usage:
 * <Can permission="projects.create">
 *   <CreateProjectButton />
 * </Can>
 */
export function Can({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, canAny, canAll } = usePermission();

  const hasAccess = checkPermissionAccess(
    permission,
    permissions,
    requireAll,
    can,
    canAny,
    canAll
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component: Cannot
 * Inverse of Can - render when user doesn't have permission
 *
 * Usage:
 * <Cannot permission="projects.create">
 *   <UpgradePlanBanner />
 * </Cannot>
 */
export function Cannot({
  permission,
  permissions,
  requireAll = false,
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  children: ReactNode;
}) {
  const { can, canAny, canAll } = usePermission();

  const hasAccess = checkPermissionAccess(
    permission,
    permissions,
    requireAll,
    can,
    canAny,
    canAll
  );

  return !hasAccess ? <>{children}</> : null;
}

/**
 * Component: RoleGate
 * Render children only for specific roles
 *
 * Usage:
 * <RoleGate roles={['owner', 'admin']}>
 *   <BillingSettings />
 * </RoleGate>
 */
export function RoleGate({
  roles,
  fallback = null,
  children,
}: {
  roles: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { userRole } = usePermission();

  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component: PermissionGuard
 * Show error message when permission is missing
 *
 * Usage:
 * <PermissionGuard permission="projects.create">
 *   <CreateProjectForm />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  errorMessage = 'You do not have permission to access this feature.',
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  errorMessage?: string;
  children: ReactNode;
}) {
  const { can, canAny, canAll, userRole } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-7a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">{errorMessage}</p>
            {userRole && (
              <p className="text-sm text-gray-500 mt-2">
                Your current role: <span className="font-medium">{userRole}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
