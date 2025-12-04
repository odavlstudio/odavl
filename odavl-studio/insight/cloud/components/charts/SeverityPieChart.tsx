/**
 * Issues Severity Pie Chart Component
 * Week 10 Day 1: Analytics Dashboard
 * 
 * Shows distribution of issues by severity level.
 */

'use client';

import React from 'react';
import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { MetricsService } from '@/lib/metrics/service';
import type { IssueStats } from '@/lib/metrics/types';

export interface SeverityPieChartProps {
  stats: IssueStats;
  loading?: boolean;
}

export const SeverityPieChart: React.FC<SeverityPieChartProps> = ({
  stats,
  loading = false
}) => {
  const chartData = [
    { name: 'Critical', value: stats.critical, color: MetricsService.getSeverityColor('critical') },
    { name: 'High', value: stats.high, color: MetricsService.getSeverityColor('high') },
    { name: 'Medium', value: stats.medium, color: MetricsService.getSeverityColor('medium') },
    { name: 'Low', value: stats.low, color: MetricsService.getSeverityColor('low') }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Issues by Severity</h3>
        <p className="text-sm text-gray-500">Distribution across severity levels</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Issues</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-xs text-gray-500">Resolved</p>
        </div>
      </div>
    </div>
  );
};
