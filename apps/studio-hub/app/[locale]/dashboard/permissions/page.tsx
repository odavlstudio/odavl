'use client';

/**
 * ODAVL Studio - Permissions Demo Page
 * Demonstrates role-based access control in action
 */

import React from 'react';
import { Shield, Lock, Users, Crown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { usePermission, Can, Cannot, RoleGate, PermissionGuard } from '@/lib/auth/permission-context';
import { Role, type Permission, getRoleName, getRoleDescription, rolePermissions } from '@/lib/auth/permissions';

export default function PermissionsDemo() {
  const { userRole, can, isOwner, isAdmin, isMember, isViewer } = usePermission();

  // Mock user role for demo (in real app, this comes from session)
  const [selectedRole, setSelectedRole] = React.useState<Role>(Role.MEMBER);

  const permissions: Permission[] = [
    'projects.create',
    'projects.edit',
    'projects.delete',
    'team.invite',
    'team.remove',
    'settings.edit',
    'billing.edit',
    'issues.fix',
    'autopilot.run',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permissions System</h1>
        <p className="text-gray-600 mt-2">
          Role-based access control demonstration
        </p>
      </div>

      {/* Role Selector (Demo Only) */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-2">Demo Mode</h3>
            <p className="text-sm text-yellow-700 mb-4">
              Select a role to see how permissions work. In production, role comes from user session.
            </p>
            <div className="flex space-x-3">
              {Object.values(Role).map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRole === role
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-yellow-100'
                  }`}
                >
                  {getRoleName(role)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Role Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            selectedRole === Role.OWNER ? 'bg-purple-100' :
            selectedRole === Role.ADMIN ? 'bg-blue-100' :
            selectedRole === Role.MEMBER ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            {selectedRole === Role.OWNER && <Crown className="h-8 w-8 text-purple-600" />}
            {selectedRole === Role.ADMIN && <Shield className="h-8 w-8 text-blue-600" />}
            {selectedRole === Role.MEMBER && <Users className="h-8 w-8 text-green-600" />}
            {selectedRole === Role.VIEWER && <Lock className="h-8 w-8 text-gray-600" />}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {getRoleName(selectedRole)}
            </h2>
            <p className="text-gray-600 mt-1">
              {getRoleDescription(selectedRole)}
            </p>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Permission Matrix</h3>
          <p className="text-sm text-gray-600 mt-1">
            What you can and can't do with your current role
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-3">
            {permissions.map(permission => {
              const hasAccess = rolePermissions[selectedRole].includes('*') ||
                               rolePermissions[selectedRole].includes(permission);

              return (
                <div
                  key={permission}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    hasAccess
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {hasAccess ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <code className="text-sm font-mono font-medium text-gray-900">
                        {permission}
                      </code>
                      <p className="text-xs text-gray-600 mt-1">
                        {getPermissionDescription(permission)}
                      </p>
                    </div>
                  </div>

                  {hasAccess ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Allowed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Denied
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Component Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Can Component Example */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {'<Can /> Component'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Only renders if user has permission
          </p>

          <Can permission="projects.create">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ You can see this because you have 'projects.create' permission
              </p>
            </div>
          </Can>

          <Can permission="billing.edit">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ You can see this because you have 'billing.edit' permission
              </p>
            </div>
          </Can>
        </div>

        {/* Cannot Component Example */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {'<Cannot /> Component'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Only renders if user doesn't have permission
          </p>

          <Cannot permission="billing.edit">
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ You see this because you don't have 'billing.edit' permission
              </p>
              <button className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                Upgrade Plan
              </button>
            </div>
          </Cannot>
        </div>

        {/* RoleGate Example */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {'<RoleGate /> Component'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Only renders for specific roles
          </p>

          <RoleGate roles={[Role.OWNER, Role.ADMIN]}>
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                👑 Admin/Owner only content visible here
              </p>
            </div>
          </RoleGate>

          <RoleGate
            roles={[Role.VIEWER]}
            fallback={
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  This shows for non-viewers
                </p>
              </div>
            }
          >
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Viewer-only content
              </p>
            </div>
          </RoleGate>
        </div>

        {/* usePermission Hook Example */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            usePermission() Hook
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Programmatic permission checking
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">isOwner:</span>
              <span className="font-mono">{isOwner ? 'true' : 'false'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">isAdmin:</span>
              <span className="font-mono">{isAdmin ? 'true' : 'false'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">isMember:</span>
              <span className="font-mono">{isMember ? 'true' : 'false'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">isViewer:</span>
              <span className="font-mono">{isViewer ? 'true' : 'false'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    '*': 'All permissions (owner only)',
    'projects.create': 'Create new projects',
    'projects.edit': 'Edit existing projects',
    'projects.delete': 'Delete projects',
    'projects.view': 'View projects',
    'projects.scan': 'Run scans on projects',
    'issues.view': 'View detected issues',
    'issues.fix': 'Apply auto-fixes to issues',
    'team.invite': 'Invite new team members',
    'team.remove': 'Remove team members',
    'team.edit': 'Edit team member roles',
    'settings.view': 'View settings',
    'settings.edit': 'Modify settings',
    'billing.view': 'View billing information',
    'billing.edit': 'Manage billing and subscriptions',
    'autopilot.run': 'Run autopilot improvements',
    'autopilot.undo': 'Undo autopilot changes',
    'guardian.test': 'Run Guardian tests',
    'insight.analyze': 'Run Insight analysis',
  };

  return descriptions[permission] || permission;
}
