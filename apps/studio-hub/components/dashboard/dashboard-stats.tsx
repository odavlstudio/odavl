'use client';

import { trpc } from '@/lib/trpc/client';
import { useOrganization } from '@/lib/context/organization';

export function DashboardStats() {
  const { organization } = useOrganization();

  const { data: insightStats, isLoading: insightLoading } =
    trpc.insight.getStats.useQuery(
      {},
      {
        enabled: !!organization,
      }
    );

  const { data: autopilotStats, isLoading: autopilotLoading } =
    trpc.autopilot.getStats.useQuery(
      {},
      {
        enabled: !!organization,
      }
    );

  const { data: guardianStats, isLoading: guardianLoading } =
    trpc.guardian.getStats.useQuery(
      {},
      {
        enabled: !!organization,
      }
    );

  if (insightLoading || autopilotLoading || guardianLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Insight Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Issues Found</h3>
          <span className="text-xs text-gray-500">Insight</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {insightStats?.total.toLocaleString() || 0}
        </p>
        <div className="mt-4 flex gap-2">
          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
            Critical: {insightStats?.bySeverity.critical || 0}
          </span>
          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
            High: {insightStats?.bySeverity.high || 0}
          </span>
        </div>
      </div>

      {/* Autopilot Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Auto-Fixes</h3>
          <span className="text-xs text-gray-500">Autopilot</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {autopilotStats?.totalEdits.toLocaleString() || 0}
        </p>
        <div className="mt-4">
          <span className="text-xs text-gray-600">
            {autopilotStats?.total || 0} runs completed
          </span>
        </div>
      </div>

      {/* Guardian Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Test Pass Rate</h3>
          <span className="text-xs text-gray-500">Guardian</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {guardianStats?.passRate.toFixed(1) || 0}%
        </p>
        <div className="mt-4">
          <span className="text-xs text-gray-600">
            {guardianStats?.passed || 0}/{guardianStats?.total || 0} passed
          </span>
        </div>
      </div>
    </div>
  );
}
