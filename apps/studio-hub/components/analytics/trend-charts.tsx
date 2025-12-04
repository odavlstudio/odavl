'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { http } from '@/lib/utils/fetch';

interface TrendData {
  date: string;
  issues: number;
  fixes: number;
  quality: number;
}

export function TrendCharts({ range }: { range: string }) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/api/analytics/trends?range=${range}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch trend data:', error);
        setLoading(false);
      });
  }, [range]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Issues & Fixes Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="issues"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Issues Detected"
              />
              <Area
                type="monotone"
                dataKey="fixes"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Auto-Fixes Applied"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality Score Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Quality Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
