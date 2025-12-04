'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

type TrendData = {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export function IssuesTrend() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const res = await http.get('/api/insight/trend');
        if (res.ok) {
          const trendData = await res.json();
          setData(trendData);
        }
      } catch (error) {
        logger.error('Failed to fetch trend data', error as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrend();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="1"
              stroke="#dc2626"
              fillOpacity={1}
              fill="url(#colorCritical)"
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke="#ea580c"
              fillOpacity={1}
              fill="url(#colorHigh)"
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke="#ca8a04"
              fillOpacity={1}
              fill="url(#colorMedium)"
            />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke="#2563eb"
              fillOpacity={1}
              fill="url(#colorLow)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600" />
            <span className="text-sm text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600" />
            <span className="text-sm text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-sm text-muted-foreground">Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
