/**
 * Issue Resolution Rate Chart
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Combo chart showing issues opened vs. resolved over time.
 */

'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface IssueResolutionData {
  date: string;
  opened: number;
  resolved: number;
  label: string;
}

export interface IssueResolutionChartProps {
  data: IssueResolutionData[];
  loading?: boolean;
}

export const IssueResolutionChart: React.FC<IssueResolutionChartProps> = ({
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500">Loading resolution data...</p>
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
            <p className="text-sm">No resolution data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate cumulative backlog
  const chartData = data.map((d, index) => {
    const backlog = data
      .slice(0, index + 1)
      .reduce((sum, item) => sum + item.opened - item.resolved, 0);
    
    return {
      ...d,
      backlog: Math.max(0, backlog)
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Issue Resolution Rate</h3>
        <p className="text-sm text-gray-500">Issues opened vs. resolved with backlog trend</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
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
          <Bar
            dataKey="opened"
            name="Opened"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="resolved"
            name="Resolved"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="backlog"
            name="Backlog"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-orange-600">
              {data.reduce((sum, d) => sum + d.opened, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Opened</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.resolved, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Resolved</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">
              {chartData[chartData.length - 1]?.backlog || 0}
            </p>
            <p className="text-xs text-gray-500">Current Backlog</p>
          </div>
        </div>
      </div>
    </div>
  );
};
