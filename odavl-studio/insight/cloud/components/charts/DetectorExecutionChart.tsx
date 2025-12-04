/**
 * Detector Execution Times Chart
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Horizontal bar chart showing average execution time per detector.
 */

'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer
} from 'recharts';
import type { DetectorPerformance } from '@/lib/metrics/types';

export interface DetectorExecutionChartProps {
  data: DetectorPerformance[];
  loading?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export const DetectorExecutionChart: React.FC<DetectorExecutionChartProps> = ({
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500">Loading detector performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">No detector data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Convert to seconds and sort by duration (descending)
  const chartData = [...data]
    .map(d => ({
      name: d.name,
      duration: d.averageDuration / 1000, // Convert to seconds
      issuesFound: d.issuesFound,
      successRate: d.successRate
    }))
    .sort((a, b) => b.duration - a.duration);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Detector Execution Times</h3>
        <p className="text-sm text-gray-500">Average duration per detector (seconds)</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Duration (seconds)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            formatter={(value: number) => [`${value.toFixed(2)}s`, 'Avg Duration']}
          />
          <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {data.reduce((sum, d) => sum + d.executions, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Executions</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">
              {((data.reduce((sum, d) => sum + d.averageDuration, 0) / data.length) / 1000).toFixed(2)}s
            </p>
            <p className="text-xs text-gray-500">Avg Duration</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.issuesFound, 0)}
            </p>
            <p className="text-xs text-gray-500">Issues Found</p>
          </div>
        </div>
      </div>
    </div>
  );
};
