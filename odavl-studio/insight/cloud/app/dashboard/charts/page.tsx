/**
 * Charts Visualization Page
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Comprehensive charts page with 5 advanced visualizations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Target } from 'lucide-react';
import { AnalysisPerformanceChart } from '@/components/charts/AnalysisPerformanceChart';
import { DetectorExecutionChart } from '@/components/charts/DetectorExecutionChart';
import { TeamActivityChart } from '@/components/charts/TeamActivityChart';
import { CodeQualityTrendChart } from '@/components/charts/CodeQualityTrendChart';
import { IssueResolutionChart } from '@/components/charts/IssueResolutionChart';
import { metricsService } from '@/lib/metrics/service';
import type { TimeRange } from '@/lib/metrics/types';

export default function ChartsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(true);

  // Performance data
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [detectorData, setDetectorData] = useState<any[]>([]);
  const [teamActivityData, setTeamActivityData] = useState<any[]>([]);
  const [qualityTrendData, setQualityTrendData] = useState<any[]>([]);
  const [resolutionData, setResolutionData] = useState<any[]>([]);

  useEffect(() => {
    fetchChartsData();
  }, [timeRange]);

  const fetchChartsData = async () => {
    try {
      setLoading(true);
      const projectId = 'demo-project-123';

      // Fetch all chart data
      const [performance, detectors, teamActivity, qualityTrend, resolution] = await Promise.all([
        Promise.resolve(metricsService.getAnalysisPerformanceData(projectId, timeRange)),
        fetch(`/api/dashboard/detectors?projectId=${projectId}`).then(r => r.json()).then(d => d.data),
        Promise.resolve(metricsService.getTeamActivityData(projectId, timeRange)),
        Promise.resolve(metricsService.getCodeQualityTrendData(projectId, timeRange)),
        Promise.resolve(metricsService.getIssueResolutionData(projectId, timeRange))
      ]);

      setPerformanceData(performance);
      setDetectorData(detectors);
      setTeamActivityData(teamActivity);
      setQualityTrendData(qualityTrend);
      setResolutionData(resolution);
    } catch (error) {
      console.error('Charts data error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Charts & Visualizations</h1>
            </div>
            <p className="text-gray-600">Advanced analytics and trend analysis</p>
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
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6" />
            <span className="text-2xl font-bold">
              {loading ? '...' : performanceData.reduce((sum, d) => sum + d.success + d.failed, 0)}
            </span>
          </div>
          <p className="text-sm text-blue-100">Total Analyses</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-2xl font-bold">
              {loading ? '...' : teamActivityData.reduce((sum, d) => sum + d.comments, 0)}
            </span>
          </div>
          <p className="text-sm text-purple-100">Team Comments</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6" />
            <span className="text-2xl font-bold">
              {loading ? '...' : resolutionData.reduce((sum, d) => sum + d.resolved, 0)}
            </span>
          </div>
          <p className="text-sm text-green-100">Issues Resolved</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6" />
            <span className="text-2xl font-bold">
              {loading ? '...' : detectorData?.length || 0}
            </span>
          </div>
          <p className="text-sm text-orange-100">Active Detectors</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* Row 1: Analysis Performance + Detector Execution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalysisPerformanceChart
            data={performanceData}
            loading={loading}
          />
          <DetectorExecutionChart
            data={detectorData || []}
            loading={loading}
          />
        </div>

        {/* Row 2: Code Quality Trend (full width) */}
        <CodeQualityTrendChart
          data={qualityTrendData}
          loading={loading}
        />

        {/* Row 3: Team Activity + Issue Resolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TeamActivityChart
            data={teamActivityData}
            loading={loading}
          />
          <IssueResolutionChart
            data={resolutionData}
            loading={loading}
          />
        </div>
      </div>

      {/* Insights Section */}
      <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Code Quality</span>
            </div>
            <p className="text-sm text-gray-600">
              Quality score improving by{' '}
              <span className="font-semibold text-green-600">+12%</span> this period
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Performance</span>
            </div>
            <p className="text-sm text-gray-600">
              Average analysis time reduced to{' '}
              <span className="font-semibold text-blue-600">12.5s</span>
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Team Activity</span>
            </div>
            <p className="text-sm text-gray-600">
              Team contributions up{' '}
              <span className="font-semibold text-purple-600">+28%</span> this week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
