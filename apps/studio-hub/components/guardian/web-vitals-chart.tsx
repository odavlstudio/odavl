'use client';

import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

type VitalsData = {
  date: string;
  lcp: number;
  fid: number;
  cls: number;
};

export function WebVitalsChart() {
  const [data, setData] = useState<VitalsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVitals() {
      try {
        const res = await http.get('/api/guardian/web-vitals');
        if (res.ok) {
          const vitalsData = await res.json();
          setData(vitalsData);
        }
      } catch (error) {
        logger.error('Failed to fetch web vitals', error as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchVitals();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals (Last 30 Days)</CardTitle>
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
        <CardTitle>Core Web Vitals (Last 30 Days)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track LCP, FID, and CLS metrics over time
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
            <Legend />
            <Line
              type="monotone"
              dataKey="lcp"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              dot={false}
              name="LCP (ms)"
            />
            <Line
              type="monotone"
              dataKey="fid"
              stroke="hsl(271 81% 56%)"
              strokeWidth={2}
              dot={false}
              name="FID (ms)"
            />
            <Line
              type="monotone"
              dataKey="cls"
              stroke="hsl(142 76% 36%)"
              strokeWidth={2}
              dot={false}
              name="CLS (×100)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
