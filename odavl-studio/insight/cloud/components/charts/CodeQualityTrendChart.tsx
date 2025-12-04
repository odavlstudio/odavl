/**
 * Code Quality Trend Chart
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Line chart with dual Y-axis showing quality score and issue density.
 */

'use client';

import React from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface CodeQualityData {
  date: string;
  qualityScore: number; // 0-100
  issueDensity: number; // issues per 1000 LOC
  label: string;
}

export interface CodeQualityTrendChartProps {
  data: CodeQualityData[];
  loading?: boolean;
}

export const CodeQualityTrendChart: React.FC<CodeQualityTrendChartProps> = ({
  data,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-[350px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500">Loading quality trend...</p>
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
            <p className="text-sm">No quality data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Code Quality Trend</h3>
        <p className="text-sm text-gray-500">Quality score vs. issue density</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#10b981"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ef4444"
            style={{ fontSize: '12px' }}
            label={{ value: 'Issue Density', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'qualityScore') return [`${value.toFixed(1)}`, 'Quality Score'];
              return [`${value.toFixed(2)}`, 'Issue Density'];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="qualityScore"
            name="Quality Score"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="issueDensity"
            name="Issue Density"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">
              Quality Score: Overall code health (0-100)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">
              Issue Density: Issues per 1000 lines of code
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
