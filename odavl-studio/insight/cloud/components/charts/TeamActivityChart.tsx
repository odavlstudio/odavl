/**
 * Team Activity Chart Component
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Stacked area chart showing team member contributions over time.
 */

'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface TeamActivityData {
  date: string;
  analyses: number;
  comments: number;
  issuesResolved: number;
  label: string;
}

export interface TeamActivityChartProps {
  data: TeamActivityData[];
  loading?: boolean;
}

export const TeamActivityChart: React.FC<TeamActivityChartProps> = ({
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500">Loading team activity...</p>
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
            <p className="text-sm">No activity data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Team Activity Timeline</h3>
        <p className="text-sm text-gray-500">Contributions over time (stacked)</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="analyses"
            name="Analyses"
            stackId="1"
            stroke="#3b82f6"
            fill="url(#colorAnalyses)"
          />
          <Area
            type="monotone"
            dataKey="comments"
            name="Comments"
            stackId="1"
            stroke="#8b5cf6"
            fill="url(#colorComments)"
          />
          <Area
            type="monotone"
            dataKey="issuesResolved"
            name="Issues Resolved"
            stackId="1"
            stroke="#10b981"
            fill="url(#colorResolved)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
