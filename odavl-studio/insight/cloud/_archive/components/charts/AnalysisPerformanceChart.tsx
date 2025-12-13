/**
 * Analysis Performance Chart Component
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Shows analysis duration trends and success/failure rates over time.
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
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface AnalysisPerformanceData {
  date: string;
  duration: number; // milliseconds
  success: number;
  failed: number;
  label: string;
}

export interface AnalysisPerformanceChartProps {
  data: AnalysisPerformanceData[];
  loading?: boolean;
}

export const AnalysisPerformanceChart: React.FC<AnalysisPerformanceChartProps> = ({
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500">Loading performance chart...</p>
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
            <p className="text-sm">No performance data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Convert duration from ms to seconds for better readability
  const chartData = data.map(d => ({
    ...d,
    duration: d.duration / 1000 // Convert to seconds
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Analysis Performance</h3>
        <p className="text-sm text-gray-500">Duration and success rate over time</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Count', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'duration') return [`${value.toFixed(2)}s`, 'Duration'];
              return [value, name === 'success' ? 'Successful' : 'Failed'];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Bar
            yAxisId="left"
            dataKey="duration"
            name="Duration"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="success"
            name="Successful"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="failed"
            name="Failed"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
