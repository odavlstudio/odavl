'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { http } from '@/lib/utils/fetch';

interface UsageData {
  resource: string;
  current: number;
  limit: number;
  percentage: number;
}

export function UsageMetrics({ orgId, plan }: { orgId: string; plan: string }) {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/api/usage?orgId=${orgId}`)
      .then((res) => res.json())
      .then((data) => {
        setUsage(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch usage data:', error);
        setLoading(false);
      });
  }, [orgId]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Usage This Month</h3>
      {usage.map((item) => (
        <div key={item.resource}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium capitalize">{item.resource.replace(/([A-Z])/g, ' $1')}</span>
            <span className="text-gray-600">
              {item.current.toLocaleString()} / {item.limit === Infinity ? '∞' : item.limit.toLocaleString()}
            </span>
          </div>
          <Progress
            value={item.limit === Infinity ? 0 : item.percentage}
            className={
              item.percentage > 90
                ? 'bg-red-200'
                : item.percentage > 75
                ? 'bg-yellow-200'
                : 'bg-green-200'
            }
          />
          {item.percentage > 90 && item.limit !== Infinity && (
            <p className="text-xs text-red-600 mt-1">⚠️ Approaching limit - consider upgrading</p>
          )}
        </div>
      ))}
    </div>
  );
}
