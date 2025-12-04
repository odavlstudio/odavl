// Usage Display Component
// Week 2: Plan Limits UI

'use client';

import { useEffect, useState } from 'react';
import { useOrganization } from '@/lib/context/organization';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';
import { UsageProgressBar } from './UsageProgressBar';
import { PlanBadge } from './PlanBadge';
import { UpgradePrompt } from './UpgradePrompt';

interface UsageData {
  plan: string;
  usage: {
    apiCalls: number;
    insightRuns: number;
    autopilotRuns: number;
    guardianTests: number;
  };
  limits: {
    apiCalls: number;
    insightRuns: number;
    autopilotRuns: number;
    guardianTests: number;
  };
  remaining: {
    apiCalls: number;
    insightRuns: number;
    autopilotRuns: number;
    guardianTests: number;
  };
}

export function UsageCard() {
  const { organization } = useOrganization();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      fetchUsage();
    }
  }, [organization]);

  async function fetchUsage() {
    try {
      const response = await http.get(`/api/organizations/${organization!.id}/usage`);
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      logger.error('Error fetching usage', error as Error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading || !usage) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const usageItems = [
    {
      label: 'API Calls',
      used: usage.usage.apiCalls,
      limit: usage.limits.apiCalls,
      key: 'apiCalls',
    },
    {
      label: 'Insight Runs',
      used: usage.usage.insightRuns,
      limit: usage.limits.insightRuns,
      key: 'insightRuns',
    },
    {
      label: 'Autopilot Runs',
      used: usage.usage.autopilotRuns,
      limit: usage.limits.autopilotRuns,
      key: 'autopilotRuns',
    },
    {
      label: 'Guardian Tests',
      used: usage.usage.guardianTests,
      limit: usage.limits.guardianTests,
      key: 'guardianTests',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Usage</h3>
        <PlanBadge plan={usage.plan} />
      </div>

      <div className="space-y-4">
        {usageItems.map((item) => (
          <UsageProgressBar
            key={item.key}
            label={item.label}
            used={item.used}
            limit={item.limit}
          />
        ))}
      </div>

      {usage.plan === 'FREE' && <UpgradePrompt />}
    </div>
  );
}
