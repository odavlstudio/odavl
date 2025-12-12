/**
 * ODAVL Insight Telemetry Dashboard
 * Internal admin-only analytics dashboard
 * 
 * Displays:
 * - Active users (DAU/WAU/MAU)
 * - Total analyses (local vs cloud)
 * - Issues found over time
 * - Conversion funnel (FREE → PRO)
 * - Top detectors
 * - Average analysis duration
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MetricData {
  date?: string;
  count?: number;
  totalIssues?: number;
  criticalCount?: number;
  avgDuration?: number;
  mode?: string;
  step?: string;
  detector?: string;
}

export default function TelemetryDashboard() {
  const { data: session, status } = useSession();
  const [activeUsers, setActiveUsers] = useState<MetricData[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState<MetricData[]>([]);
  const [issuesFound, setIssuesFound] = useState<MetricData[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<MetricData[]>([]);
  const [topDetectors, setTopDetectors] = useState<MetricData[]>([]);
  const [avgDuration, setAvgDuration] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30); // Days
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllMetrics();
    }
  }, [status, timeRange]);
  
  async function fetchAllMetrics() {
    setLoading(true);
    setError(null);
    
    try {
      const [users, analyses, issues, funnel, detectors, duration] = await Promise.all([
        fetch(`/api/internal/telemetry?metric=active_users&days=${timeRange}`).then(r => r.json()),
        fetch(`/api/internal/telemetry?metric=total_analyses&days=${timeRange}`).then(r => r.json()),
        fetch(`/api/internal/telemetry?metric=issues_found&days=${timeRange}`).then(r => r.json()),
        fetch(`/api/internal/telemetry?metric=conversion_funnel&days=${timeRange}`).then(r => r.json()),
        fetch(`/api/internal/telemetry?metric=top_detectors&days=${timeRange}`).then(r => r.json()),
        fetch(`/api/internal/telemetry?metric=avg_duration&days=${timeRange}`).then(r => r.json()),
      ]);
      
      if (users.error) throw new Error(users.error);
      if (analyses.error) throw new Error(analyses.error);
      if (issues.error) throw new Error(issues.error);
      if (funnel.error) throw new Error(funnel.error);
      if (detectors.error) throw new Error(detectors.error);
      if (duration.error) throw new Error(duration.error);
      
      setActiveUsers(users.data);
      setTotalAnalyses(analyses.data);
      setIssuesFound(issues.data);
      setConversionFunnel(funnel.data);
      setTopDetectors(detectors.data);
      setAvgDuration(duration.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading telemetry data...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
          <p className="text-gray-600">Please sign in to view telemetry dashboard.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchAllMetrics()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate summary stats
  const totalUsers = activeUsers.reduce((sum, d) => sum + (d.count || 0), 0);
  const totalAnalysesCount = totalAnalyses.reduce((sum, d) => sum + (d.count || 0), 0);
  const totalIssuesCount = issuesFound.reduce((sum, d) => sum + (d.totalIssues || 0), 0);
  const conversionRate = conversionFunnel.length >= 2 
    ? Math.round((conversionFunnel[conversionFunnel.length - 1]?.count || 0) / (conversionFunnel[0]?.count || 1) * 100)
    : 0;
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ODAVL Insight Telemetry</h1>
          <p className="text-gray-600">Internal admin-only analytics dashboard</p>
          
          {/* Time Range Selector */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-4 py-2 rounded-md ${timeRange === 7 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-4 py-2 rounded-md ${timeRange === 30 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`px-4 py-2 rounded-md ${timeRange === 90 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              90 Days
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Analyses</div>
            <div className="text-3xl font-bold text-blue-600">{totalAnalysesCount.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Issues Found</div>
            <div className="text-3xl font-bold text-red-600">{totalIssuesCount.toLocaleString()}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</div>
            <div className="text-3xl font-bold text-green-600">{conversionRate}%</div>
          </div>
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Active Users</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activeUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Total Analyses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Total Analyses (Local vs Cloud)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totalAnalyses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Issues Found */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues Found Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={issuesFound}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalIssues" stroke="#f59e0b" strokeWidth={2} name="Total Issues" />
                <Line type="monotone" dataKey="criticalCount" stroke="#ef4444" strokeWidth={2} name="Critical" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Funnel (FREE → PRO)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="step" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Detectors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Detectors Used</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topDetectors}
                  dataKey="count"
                  nameKey="detector"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {topDetectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Average Duration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Average Analysis Duration (ms)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={avgDuration}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgDuration" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Privacy Note */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Privacy Note:</strong> All telemetry data uses hashed user IDs (anonymous). 
            No code content, file names, or sensitive information is collected. 
            Users can opt-out via CLI config, VS Code settings, or Cloud Console preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
