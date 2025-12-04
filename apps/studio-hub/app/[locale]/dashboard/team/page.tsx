'use client';

import { useState } from 'react';
import { UserPlus, Mail, Shield, Clock, MoreVertical, Search, Users, Crown, Key } from 'lucide-react';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
type InviteStatus = 'pending' | 'accepted' | 'expired';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: MemberRole;
  joinedAt: string;
  lastActive: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  invitedAt: string;
  status: InviteStatus;
  expiresAt: string;
}

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [searchQuery, setSearchQuery] = useState('');

  const members: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'JD',
      role: 'owner',
      joinedAt: '6 months ago',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      avatar: 'SS',
      role: 'admin',
      joinedAt: '4 months ago',
      lastActive: '5 hours ago'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      avatar: 'MJ',
      role: 'member',
      joinedAt: '2 months ago',
      lastActive: '1 day ago'
    },
    {
      id: '4',
      name: 'Emily Brown',
      email: 'emily@example.com',
      avatar: 'EB',
      role: 'member',
      joinedAt: '1 month ago',
      lastActive: '3 hours ago'
    },
    {
      id: '5',
      name: 'David Wilson',
      email: 'david@example.com',
      avatar: 'DW',
      role: 'viewer',
      joinedAt: '2 weeks ago',
      lastActive: '2 days ago'
    },
  ];

  const pendingInvites: PendingInvite[] = [
    {
      id: 'inv-1',
      email: 'alex@example.com',
      role: 'member',
      invitedBy: 'John Doe',
      invitedAt: '2 days ago',
      status: 'pending',
      expiresAt: '5 days'
    },
    {
      id: 'inv-2',
      email: 'lisa@example.com',
      role: 'admin',
      invitedBy: 'Sarah Smith',
      invitedAt: '1 week ago',
      status: 'pending',
      expiresAt: '6 hours'
    },
  ];

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'viewer':
        return <Key className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: MemberRole) => {
    const colors: Record<MemberRole, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    return colors[role];
  };

  const getStatusColor = (status: InviteStatus) => {
    const colors: Record<InviteStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleStats = {
    owner: members.filter(m => m.role === 'owner').length,
    admin: members.filter(m => m.role === 'admin').length,
    member: members.filter(m => m.role === 'member').length,
    viewer: members.filter(m => m.role === 'viewer').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Members</span>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{members.length}</p>
          <p className="text-sm text-gray-500 mt-1">{pendingInvites.length} pending invites</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Admins</span>
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{roleStats.admin + roleStats.owner}</p>
          <p className="text-sm text-gray-500 mt-1">Full access</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Members</span>
            <Users className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{roleStats.member}</p>
          <p className="text-sm text-gray-500 mt-1">Standard access</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Viewers</span>
            <Key className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-600">{roleStats.viewer}</p>
          <p className="text-sm text-gray-500 mt-1">Read-only</p>
        </div>
      </div>

      {/* Invite Member Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Team Member</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MemberRole)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="viewer">Viewer - Read-only</option>
            <option value="member">Member - Standard</option>
            <option value="admin">Admin - Full access</option>
          </select>
          <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg whitespace-nowrap">
            <UserPlus className="h-5 w-5" />
            Send Invite
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Invite link expires in 7 days. Member will receive an email invitation.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Team Members ({filteredMembers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{member.joinedAt}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {member.lastActive}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {member.role !== 'owner' && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Pending Invitations ({pendingInvites.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires In
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-900">{invite.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invite.role)}`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{invite.invitedBy}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{invite.expiresAt}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-4">
                        Resend
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles & Permissions Guide */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles & Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Owner</h4>
            </div>
            <p className="text-sm text-gray-600">Full access including billing and team management</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Admin</h4>
            </div>
            <p className="text-sm text-gray-600">All permissions except billing management</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Member</h4>
            </div>
            <p className="text-sm text-gray-600">View, scan projects, and apply fixes</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Viewer</h4>
            </div>
            <p className="text-sm text-gray-600">Read-only access to view projects and reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
