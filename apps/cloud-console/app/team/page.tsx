'use client';

import { useState } from 'react';
import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember, useOrganizations } from '@/lib/api-hooks';
import { OrgRole } from '@prisma/client';

export default function TeamPage() {
  const { data: members, loading, refetch } = useMembers();
  const { data: organizations } = useOrganizations();
  const { mutate: inviteMember, loading: inviting } = useInviteMember();
  const { mutate: updateRole, loading: updatingRole } = useUpdateMemberRole();
  const { mutate: removeMember, loading: removing } = useRemoveMember();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'DEVELOPER' | 'VIEWER'>('DEVELOPER');

  const currentOrg = organizations?.[0];
  const canInvite = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';
  const canManageRoles = currentOrg?.role === 'OWNER';
  const canRemove = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteMember({ email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setShowInvite(false);
      refetch();
    } catch (error) {
      alert('Failed to invite member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'ADMIN' | 'DEVELOPER' | 'VIEWER') => {
    try {
      await updateRole({ memberId, role: newRole });
      refetch();
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }
    try {
      await removeMember(memberId);
      refetch();
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEVELOPER':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Team Members</h1>
          <p className="text-gray-600 mt-2">Manage your organization's team members and permissions</p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'DEVELOPER' | 'VIEWER')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DEVELOPER">Developer</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {inviteRole === 'DEVELOPER'
                      ? 'Can create projects, run analyses, and apply fixes'
                      : 'Can view projects and results only'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading members...</p>
          </div>
        ) : members && members.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {member.user.name?.charAt(0).toUpperCase() ?? member.user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {member.user.name ?? member.user.email}
                      </h3>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge/Selector */}
                    {canManageRoles && member.role !== 'OWNER' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as 'ADMIN' | 'DEVELOPER' | 'VIEWER')}
                        disabled={updatingRole}
                        className={`px-3 py-1 text-sm font-medium rounded border ${getRoleBadgeColor(member.role)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="DEVELOPER">Developer</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 text-sm font-medium rounded border ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}

                    {/* Remove Button */}
                    {canRemove && member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removing}
                        className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 disabled:opacity-50"
                        title="Remove member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-1">No team members yet</p>
            <p className="text-sm text-gray-500">Invite your first team member to get started.</p>
          </div>
        )}
      </div>

      {/* Permissions Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Role Permissions</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-900 mb-2">OWNER</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Full organization control</li>
              <li>• Manage billing and subscription</li>
              <li>• Invite/remove members and change roles</li>
              <li>• All Developer permissions</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">ADMIN</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Manage projects</li>
              <li>• Invite and remove members</li>
              <li>• View billing information</li>
              <li>• All Developer permissions</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">DEVELOPER</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Create and edit projects</li>
              <li>• Run analyses and apply fixes</li>
              <li>• Run Guardian audits</li>
              <li>• View projects and results</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">VIEWER</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• View projects</li>
              <li>• View analysis results</li>
              <li>• View audit reports</li>
              <li>• Read-only access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
