/**
 * Team Collaboration Dashboard
 * Invitations, Audit Logs, and Shared Reports
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Types
interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  sentAt: string;
  expiresAt: string;
  invitedByEmail: string;
}

interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  acceptanceRate: number;
  last7Days: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  severity: string;
  description: string;
  userEmail?: string;
  success: boolean;
}

interface AuditStats {
  totalLogs: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  successRate: number;
  last24Hours: number;
}

interface ReportStats {
  totalReports: number;
  scheduledReports: number;
  sharedReports: number;
  byType: Record<string, number>;
}

type TabType = 'invitations' | 'audit' | 'reports';

export default function TeamCollaborationPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;

  const [activeTab, setActiveTab] = useState<TabType>('invitations');
  const [loading, setLoading] = useState(true);

  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationStats, setInvitationStats] = useState<InvitationStats | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);

  // Reports state
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);

  useEffect(() => {
    if (orgSlug) {
      fetchData();
    }
  }, [orgSlug, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invitations') {
        await fetchInvitations();
      } else if (activeTab === 'audit') {
        await fetchAuditLogs();
      } else if (activeTab === 'reports') {
        await fetchReports();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    const [invitationsRes, statsRes] = await Promise.all([
      fetch(`/api/v1/invitations?organizationId=${orgSlug}&limit=20`),
      fetch(`/api/v1/invitations/stats?organizationId=${orgSlug}`),
    ]);

    if (invitationsRes.ok && statsRes.ok) {
      setInvitations(await invitationsRes.json());
      setInvitationStats(await statsRes.json());
    }
  };

  const fetchAuditLogs = async () => {
    const [logsRes, statsRes] = await Promise.all([
      fetch(`/api/v1/audit?organizationId=${orgSlug}&limit=50`),
      fetch(`/api/v1/audit/stats?organizationId=${orgSlug}`),
    ]);

    if (logsRes.ok && statsRes.ok) {
      setAuditLogs(await logsRes.json());
      setAuditStats(await statsRes.json());
    }
  };

  const fetchReports = async () => {
    const statsRes = await fetch(`/api/v1/reports/stats?organizationId=${orgSlug}`);

    if (statsRes.ok) {
      setReportStats(await statsRes.json());
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'ERROR': return 'text-red-500 bg-red-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'DECLINED': return 'text-red-600 bg-red-50';
      case 'EXPIRED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-600 mt-2">Manage invitations, audit logs, and shared reports</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('invitations')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'invitations'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Invitations
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'audit'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Reports
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {/* Invitations Tab */}
            {activeTab === 'invitations' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                {invitationStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Total Invitations</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">{invitationStats.total}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Pending</div>
                      <div className="text-3xl font-bold text-yellow-600 mt-2">{invitationStats.pending}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Accepted</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">{invitationStats.accepted}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Acceptance Rate</div>
                      <div className="text-3xl font-bold text-blue-600 mt-2">{invitationStats.acceptanceRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Last 7 Days</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">{invitationStats.last7Days}</div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    ➕ Send Invitation
                  </button>
                </div>

                {/* Invitations Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <tr key={invitation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invitation.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                              {invitation.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invitation.invitedByEmail}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(invitation.sentAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                {auditStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Total Logs</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">{auditStats.totalLogs}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">{auditStats.successRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Last 24 Hours</div>
                      <div className="text-3xl font-bold text-blue-600 mt-2">{auditStats.last24Hours}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Critical Events</div>
                      <div className="text-3xl font-bold text-red-600 mt-2">
                        {auditStats.bySeverity['CRITICAL'] || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.action.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.userEmail || 'System'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                {reportStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Total Reports</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">{reportStats.totalReports}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Scheduled Reports</div>
                      <div className="text-3xl font-bold text-blue-600 mt-2">{reportStats.scheduledReports}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600">Shared Reports</div>
                      <div className="text-3xl font-bold text-purple-600 mt-2">{reportStats.sharedReports}</div>
                    </div>
                  </div>
                )}

                {/* Report Types */}
                {reportStats && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Type</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(reportStats.byType).map(([type, count]) => (
                        <div key={type} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">{type}</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    📄 Generate Report
                  </button>
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium">
                    📅 Schedule Report
                  </button>
                  <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
                    🔗 Share Report
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
