/**
 * Billing Overview Dashboard
 * Shows: Current tier, usage progress, license key, quick actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { PRODUCT_TIERS } from '@odavl/types';

interface Subscription {
  id: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: string;
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
  currentPeriodEnd: string;
  licenseKey?: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      if (!res.ok) {
        throw new Error('Failed to fetch subscription');
      }
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (used: number, max: number): number => {
    if (max === -1) return 0; // Unlimited
    return Math.min((used / max) * 100, 100);
  };

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Subscription not found'}</p>
        </div>
      </div>
    );
  }

  const tierDetails = PRODUCT_TIERS[subscription.tier];
  const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and usage</p>
        </div>
        <a
          href="/dashboard/billing/upgrade"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Upgrade Plan
        </a>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{tierDetails.displayName}</h2>
              {subscription.tier === 'PRO' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
                  ⭐ Popular
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-2">{tierDetails.description}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">
                ${tierDetails.price}
              </span>
              <span className="text-gray-600">/month</span>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full inline-block">
              {subscription.status.toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Renews in {daysRemaining} days
            </p>
          </div>
        </div>

        {/* License Key */}
        {subscription.licenseKey && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">License Key</p>
            <code className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border">
              {subscription.licenseKey}
            </code>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Current Usage</h3>

        {/* Projects */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Projects</span>
            <span className="text-sm text-gray-600">
              {subscription.usage.projectsCount} / {subscription.limits.maxProjects === -1 ? '∞' : subscription.limits.maxProjects}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${calculatePercentage(
                  subscription.usage.projectsCount,
                  subscription.limits.maxProjects
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Analyses */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Analyses This Month</span>
            <span className="text-sm text-gray-600">
              {subscription.usage.usedAnalysesMonth} / {subscription.limits.maxAnalysesPerMonth === -1 ? '∞' : subscription.limits.maxAnalysesPerMonth}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${calculatePercentage(
                  subscription.usage.usedAnalysesMonth,
                  subscription.limits.maxAnalysesPerMonth
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Storage</span>
            <span className="text-sm text-gray-600">
              {subscription.usage.usedStorageGB.toFixed(2)} GB / {subscription.limits.maxStorageGB === -1 ? '∞' : subscription.limits.maxStorageGB} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${calculatePercentage(
                  subscription.usage.usedStorageGB,
                  subscription.limits.maxStorageGB
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* View Details Link */}
        <div className="mt-6 pt-6 border-t">
          <a
            href="/dashboard/billing/usage"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View detailed usage analytics →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Activate License</h3>
          <p className="text-gray-600 text-sm mb-4">
            Have a license key? Activate it to upgrade your plan instantly.
          </p>
          <a
            href="/dashboard/billing/activate"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            Activate License Key
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Compare Plans</h3>
          <p className="text-gray-600 text-sm mb-4">
            See all available plans and find the best fit for your needs.
          </p>
          <a
            href="/dashboard/billing/upgrade"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            View All Plans
          </a>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Plan Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {tierDetails.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
