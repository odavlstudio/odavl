/**
 * Usage Analytics Dashboard
 * Shows: Charts, historical data, export functionality
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

interface UsageData {
  subscription: {
    tier: string;
    limits: {
      maxProjects: number;
      maxAnalysesPerMonth: number;
      maxStorageGB: number;
    };
    usage: {
      projectsCount: number;
      usedAnalysesMonth: number;
      usedStorageGB: number;
    };
  };
  usageByType: Record<string, number>;
  recentRecords: Array<{
    id: string;
    type: string;
    amount: number;
    createdAt: string;
    metadata?: string;
  }>;
}

export default function UsagePage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/billing/usage');
      if (!res.ok) {
        throw new Error('Failed to fetch usage');
      }
      const data = await res.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUsageTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      ANALYSIS: 'Code Analysis',
      PROJECT_CREATE: 'Project Creation',
      STORAGE_WRITE: 'Storage Write',
      API_CALL: 'API Call',
      ML_PREDICTION: 'ML Prediction',
      AUTO_FIX: 'Auto-Fix',
    };
    return labels[type] || type;
  };

  const getUsageTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      ANALYSIS: 'bg-blue-500',
      PROJECT_CREATE: 'bg-green-500',
      STORAGE_WRITE: 'bg-purple-500',
      API_CALL: 'bg-yellow-500',
      ML_PREDICTION: 'bg-pink-500',
      AUTO_FIX: 'bg-orange-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Usage data not found'}</p>
        </div>
      </div>
    );
  }

  const totalUsageByType = Object.entries(usage.usageByType);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="text-gray-600 mt-1">Track your resource consumption</p>
        </div>
        <a
          href="/dashboard/billing"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          ← Back to Billing
        </a>
      </div>

      {/* Current Period Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Current Period Summary</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {usage.subscription.usage.projectsCount}
            </div>
            <div className="text-sm text-gray-600">
              Projects Created
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Limit: {usage.subscription.limits.maxProjects === -1 ? 'Unlimited' : usage.subscription.limits.maxProjects}
            </div>
          </div>

          {/* Analyses */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {usage.subscription.usage.usedAnalysesMonth}
            </div>
            <div className="text-sm text-gray-600">
              Analyses Run
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Limit: {usage.subscription.limits.maxAnalysesPerMonth === -1 ? 'Unlimited' : usage.subscription.limits.maxAnalysesPerMonth}
            </div>
          </div>

          {/* Storage */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {usage.subscription.usage.usedStorageGB.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              GB Stored
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Limit: {usage.subscription.limits.maxStorageGB === -1 ? 'Unlimited' : `${usage.subscription.limits.maxStorageGB} GB`}
            </div>
          </div>
        </div>
      </div>

      {/* Usage by Type */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Usage by Type</h2>
        <div className="space-y-4">
          {totalUsageByType.length > 0 ? (
            totalUsageByType.map(([type, count]) => {
              const maxCount = Math.max(...totalUsageByType.map(([, c]) => c));
              const percentage = (count / maxCount) * 100;
              
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getUsageTypeColor(type)}`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {getUsageTypeLabel(type)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageTypeColor(type)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">No usage data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {usage.recentRecords.length > 0 ? (
            usage.recentRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getUsageTypeColor(record.type)}`}></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {getUsageTypeLabel(record.type)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(record.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ×{record.amount}
                  </div>
                  {record.metadata && (
                    <div className="text-xs text-gray-500">
                      {record.metadata}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Export Data</h2>
        <p className="text-gray-600 text-sm mb-4">
          Download your usage data for analysis or record-keeping.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          onClick={() => {
            const dataStr = JSON.stringify(usage, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `odavl-usage-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
          }}
        >
          Download JSON
        </button>
      </div>
    </div>
  );
}
