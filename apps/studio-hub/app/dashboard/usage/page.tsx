'use client';

/**
 * Usage Dashboard Page
 * Display usage statistics and quotas
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface UsageMetrics {
  period: string;
  apiCalls: number;
  insightRuns: number;
  autopilotRuns: number;
  guardianTests: number;
  storageUsed: number;
}

interface QuotaLimits {
  apiCalls: number;
  insightRuns: number;
  autopilotRuns: number;
  guardianTests: number;
  storageLimit: number;
}

interface UsageStatus {
  usage: UsageMetrics;
  limits: QuotaLimits;
  percentUsed: {
    apiCalls: number;
    insightRuns: number;
    autopilotRuns: number;
    guardianTests: number;
    storage: number;
  };
  withinLimits: boolean;
  warnings: string[];
}

export default function UsagePage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/usage');

      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getProgressColor = (percent: number): string => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 90) return 'bg-orange-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getWarningLevel = (percent: number): 'success' | 'warning' | 'danger' | 'exceeded' => {
    if (percent >= 100) return 'exceeded';
    if (percent >= 90) return 'danger';
    if (percent >= 80) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Usage</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchUsage}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isUnlimited = status.limits.apiCalls === -1;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage & Quotas</h1>
          <p className="text-gray-600">
            Monitor your monthly usage across all ODAVL products
          </p>
        </div>

        {/* Warnings */}
        {status.warnings.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Usage Warnings</h3>
            <ul className="space-y-1">
              {status.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-700">{warning}</li>
              ))}
            </ul>
            {!status.withinLimits && (
              <a
                href="/settings/billing?upgrade=true"
                className="inline-block mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Upgrade Plan
              </a>
            )}
          </div>
        )}

        {/* Usage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* API Calls */}
          <UsageCard
            title="API Calls"
            current={status.usage.apiCalls}
            limit={status.limits.apiCalls}
            percent={status.percentUsed.apiCalls}
            icon="📞"
          />

          {/* Insight Runs */}
          <UsageCard
            title="Insight Analyses"
            current={status.usage.insightRuns}
            limit={status.limits.insightRuns}
            percent={status.percentUsed.insightRuns}
            icon="🔍"
          />

          {/* Autopilot Runs */}
          <UsageCard
            title="Autopilot Runs"
            current={status.usage.autopilotRuns}
            limit={status.limits.autopilotRuns}
            percent={status.percentUsed.autopilotRuns}
            icon="🤖"
          />

          {/* Guardian Tests */}
          <UsageCard
            title="Guardian Tests"
            current={status.usage.guardianTests}
            limit={status.limits.guardianTests}
            percent={status.percentUsed.guardianTests}
            icon="🛡️"
          />

          {/* Storage */}
          <UsageCard
            title="Storage"
            current={status.usage.storageUsed}
            limit={status.limits.storageLimit}
            percent={status.percentUsed.storage}
            icon="💾"
            formatValue={formatBytes}
          />
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Current Billing Period</h2>

          <div className="space-y-6">
            <DetailedUsageBar
              label="API Calls"
              current={status.usage.apiCalls}
              limit={status.limits.apiCalls}
              percent={status.percentUsed.apiCalls}
            />

            <DetailedUsageBar
              label="Insight Analyses"
              current={status.usage.insightRuns}
              limit={status.limits.insightRuns}
              percent={status.percentUsed.insightRuns}
            />

            <DetailedUsageBar
              label="Autopilot Runs"
              current={status.usage.autopilotRuns}
              limit={status.limits.autopilotRuns}
              percent={status.percentUsed.autopilotRuns}
            />

            <DetailedUsageBar
              label="Guardian Tests"
              current={status.usage.guardianTests}
              limit={status.limits.guardianTests}
              percent={status.percentUsed.guardianTests}
            />

            <DetailedUsageBar
              label="Storage"
              current={status.usage.storageUsed}
              limit={status.limits.storageLimit}
              percent={status.percentUsed.storage}
              formatValue={formatBytes}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Usage resets on the 1st of each month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage Card Component
function UsageCard({
  title,
  current,
  limit,
  percent,
  icon,
  formatValue = (v) => v.toLocaleString(),
}: {
  title: string;
  current: number;
  limit: number;
  percent: number;
  icon: string;
  formatValue?: (value: number) => string;
}) {
  const isUnlimited = limit === -1;
  const progressColor = isUnlimited ? 'bg-blue-500' : getProgressColor(percent);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatValue(current)}
          </span>
          {!isUnlimited && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-xl text-gray-600">
                {formatValue(limit)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="relative pt-1">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: isUnlimited ? '100%' : `${Math.min(percent, 100)}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor}`}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">
            {isUnlimited ? 'Unlimited' : `${Math.round(percent)}% used`}
          </span>
          {!isUnlimited && percent >= 80 && (
            <span className="text-xs text-red-600 font-semibold">
              {percent >= 100 ? 'Exceeded!' : 'Warning'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Detailed Usage Bar Component
function DetailedUsageBar({
  label,
  current,
  limit,
  percent,
  formatValue = (v) => v.toLocaleString(),
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
  formatValue?: (value: number) => string;
}) {
  const isUnlimited = limit === -1;
  const progressColor = isUnlimited ? 'bg-blue-500' : getProgressColor(percent);

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {formatValue(current)} {!isUnlimited && `/ ${formatValue(limit)}`}
          {isUnlimited && ' (Unlimited)'}
        </span>
      </div>
      <div className="relative pt-1">
        <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: isUnlimited ? '100%' : `${Math.min(percent, 100)}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor} transition-all duration-300`}
          ></div>
        </div>
      </div>
    </div>
  );
}

function getProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 90) return 'bg-orange-500';
  if (percent >= 80) return 'bg-yellow-500';
  return 'bg-green-500';
}
