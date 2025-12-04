'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsMetrics {
  apiCalls: {
    total: number;
    byDate: { date: string; count: number }[];
    byEndpoint: { endpoint: string; count: number }[];
  };
  errors: {
    total: number;
    byDate: { date: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  };
  projects: {
    total: number;
    active: number;
    archived: number;
  };
  members: {
    total: number;
    byRole: { role: string; count: number }[];
  };
}

interface RealTimeMetrics {
  activeUsers: number;
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;

  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    fetchOrganization();
  }, [orgSlug]);

  useEffect(() => {
    if (organization) {
      fetchAnalytics();
      fetchRealTimeMetrics();

      // Refresh real-time metrics every 30 seconds
      const interval = setInterval(fetchRealTimeMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [organization, timeRange]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/v1/organizations');
      const data = await response.json();
      const org = data.data.find((o: any) => o.slug === orgSlug);
      setOrganization(org);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!organization) return;

    try {
      setLoading(true);

      // Calculate date range
      const end = new Date();
      const start = new Date();
      if (timeRange === '7d') {
        start.setDate(start.getDate() - 7);
      } else if (timeRange === '30d') {
        start.setDate(start.getDate() - 30);
      } else if (timeRange === '90d') {
        start.setDate(start.getDate() - 90);
      }

      const response = await fetch(
        `/api/v1/organizations/${organization.id}/analytics?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeMetrics = async () => {
    if (!organization) return;

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/analytics/realtime`
      );
      const data = await response.json();

      if (data.success) {
        setRealTimeMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!organization) return;

    try {
      const end = new Date();
      const start = new Date();
      if (timeRange === '7d') {
        start.setDate(start.getDate() - 7);
      } else if (timeRange === '30d') {
        start.setDate(start.getDate() - 30);
      } else if (timeRange === '90d') {
        start.setDate(start.getDate() - 90);
      }

      const response = await fetch(
        `/api/v1/organizations/${organization.id}/analytics/export?format=${format}&start=${start.toISOString()}&end=${end.toISOString()}`
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${organization.slug}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">{organization?.name}</p>
          </div>
          <div className="flex gap-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            {/* Export Buttons */}
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Real-time Metrics */}
        {realTimeMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-blue-600">{realTimeMetrics.activeUsers}</p>
              <p className="text-gray-500 text-xs mt-1">Last 5 minutes</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Requests/Minute</p>
              <p className="text-3xl font-bold text-green-600">{realTimeMetrics.requestsPerMinute}</p>
              <p className="text-gray-500 text-xs mt-1">Current rate</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Avg Response Time</p>
              <p className="text-3xl font-bold text-purple-600">{realTimeMetrics.avgResponseTime}ms</p>
              <p className="text-gray-500 text-xs mt-1">Last minute</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Error Rate</p>
              <p className="text-3xl font-bold text-red-600">{realTimeMetrics.errorRate.toFixed(2)}%</p>
              <p className="text-gray-500 text-xs mt-1">Last minute</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total API Calls</p>
            <p className="text-3xl font-bold">{metrics.apiCalls.total.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Errors</p>
            <p className="text-3xl font-bold text-red-600">{metrics.errors.total.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Active Projects</p>
            <p className="text-3xl font-bold text-green-600">{metrics.projects.active}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Team Members</p>
            <p className="text-3xl font-bold text-blue-600">{metrics.members.total}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Calls Over Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Calls Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.apiCalls.byDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0088FE" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Errors Over Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Errors Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.errors.byDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#FF8042" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Endpoints */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Top API Endpoints</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.apiCalls.byEndpoint.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Errors by Severity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Errors by Severity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.errors.bySeverity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ severity, count }) => `${severity}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.errors.bySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Members by Role */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Team Members by Role</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.members.byRole}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, count }) => `${role}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.members.byRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Project Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Project Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Projects</span>
                <span className="text-2xl font-bold">{metrics.projects.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active</span>
                <span className="text-2xl font-bold text-green-600">{metrics.projects.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Archived</span>
                <span className="text-2xl font-bold text-gray-400">{metrics.projects.archived}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
