/**
 * Dashboard Overview Page
 * Week 10 Day 1: Analytics Dashboard
 * 
 * Main analytics dashboard with metrics, charts, and insights.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  AlertCircle,
  Users,
  Clock,
  CheckCircle,
  Target
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { IssuesTrendChart } from '@/components/charts/IssuesTrendChart';
import { SeverityPieChart } from '@/components/charts/SeverityPieChart';
import { MetricsService } from '@/lib/metrics/service';
import type { DashboardSummary, TimeRange } from '@/lib/metrics/types';

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/metrics?projectId=demo-project-123&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setSummary(result.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights into your code quality</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="ml-auto px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Health Score Banner */}
      {!loading && summary && (
        <div className={`mb-6 p-6 rounded-lg ${getHealthScoreBgColor(summary.healthScore.score)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`${getHealthScoreColor(summary.healthScore.score)} text-5xl font-bold`}>
                {summary.healthScore.score}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Health Score</h2>
                <p className="text-sm text-gray-600">
                  Trend: <span className="font-medium capitalize">{summary.healthScore.trend}</span>
                </p>
              </div>
            </div>
            <Target className={`w-12 h-12 ${getHealthScoreColor(summary.healthScore.score)}`} />
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Analyses"
          value={loading ? '...' : summary?.analysis.totalAnalyses || 0}
          icon={Activity}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          subtitle={loading ? '' : `${MetricsService.formatPercentage(summary?.analysis.successRate || 0)} success rate`}
          loading={loading}
        />

        <MetricCard
          title="Total Issues"
          value={loading ? '...' : summary?.issues.total || 0}
          change={loading ? undefined : summary?.issueTrend.change}
          icon={AlertCircle}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          subtitle={loading ? '' : `${summary?.issues.unresolved} unresolved`}
          loading={loading}
        />

        <MetricCard
          title="Active Users"
          value={loading ? '...' : summary?.team.activeUsers || 0}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          subtitle={loading ? '' : `${summary?.team.totalComments} comments`}
          loading={loading}
        />

        <MetricCard
          title="Avg. Analysis Time"
          value={loading ? '...' : MetricsService.formatDuration(summary?.analysis.averageDuration || 0)}
          icon={Clock}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          subtitle={loading ? '' : `Last: ${summary?.analysis.lastAnalysis ? new Date(summary.analysis.lastAnalysis).toLocaleTimeString() : 'Never'}`}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Issues Trend */}
        <IssuesTrendChart
          data={loading ? [] : summary?.issueTrend.dataPoints || []}
          loading={loading}
        />

        {/* Severity Distribution */}
        <SeverityPieChart
          stats={loading ? {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            resolved: 0,
            unresolved: 0
          } : summary?.issues || {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            resolved: 0,
            unresolved: 0
          }}
          loading={loading}
        />
      </div>

      {/* Top Issues Table */}
      {!loading && summary && summary.topIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Issues</h3>
            <p className="text-sm text-gray-500">Most frequently occurring issues</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occurrences
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.topIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {issue.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : issue.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {issue.occurrences}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {issue.files}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(issue.lastSeen).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Activity className="w-10 h-10 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Run Analysis</h3>
          <p className="text-sm text-blue-100">Start a new code quality analysis</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <CheckCircle className="w-10 h-10 mb-3" />
          <h3 className="text-lg font-semibold mb-2">View Reports</h3>
          <p className="text-sm text-green-100">Access detailed analysis reports</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <TrendingUp className="w-10 h-10 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Team Insights</h3>
          <p className="text-sm text-purple-100">Explore team performance metrics</p>
        </div>
      </div>
    </div>
  );
}
