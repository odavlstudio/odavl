'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUsageStats, useCreateCheckoutSession, useCreatePortalSession } from '@/lib/api-hooks';
import { generateMetadata } from '@/components/seo/Metadata';

export const metadata = generateMetadata({
  title: 'Billing',
  description: 'Manage your ODAVL subscription, usage, and billing settings',
  canonical: '/app/billing',
  noindex: true,
});

export default function BillingPage() {
  const { status } = useSession();
  const router = useRouter();
  const { data: usage, loading } = useUsageStats();
  const { mutate: createCheckout, loading: upgradingCheckout } = useCreateCheckoutSession();
  const { mutate: createPortal, loading: openingPortal } = useCreatePortalSession();

  const handleUpgrade = async (tier: 'PRO' | 'ENTERPRISE') => {
    try {
      const url = await createCheckout(tier);
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error) {
      alert('Failed to create checkout session');
    }
  };

  const handleManageBilling = async () => {
    try {
      const url = await createPortal();
      window.location.href = url; // Redirect to Stripe Portal
    } catch (error) {
      alert('Failed to open billing portal');
    }
  };

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/app/billing');
    return null;
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const upgrading = upgradingCheckout || openingPortal;

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Usage</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your subscription and monitor usage limits</p>
      </div>

          {/* Current Plan */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Plan: {usage?.tier || 'FREE'}
                </h2>
                {usage?.currentPeriodEnd && (
                  <p className="text-sm text-gray-600">
                    Renews on {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {usage?.tier !== 'FREE' && (
                <button
                  onClick={handleManageBilling}
                  disabled={upgrading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
                >
                  Manage Billing
                </button>
              )}
            </div>

            {/* Usage Meters */}
            <div className="space-y-4 mt-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Analyses</span>
                  <span className="text-gray-600">
                    {usage?.analysesUsed || 0} / {usage?.limits.analyses === -1 ? '∞' : usage?.limits.analyses}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${getUsagePercentage(usage?.analysesUsed || 0, usage?.limits.analyses || 10)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Fixes</span>
                  <span className="text-gray-600">
                    {usage?.fixesUsed || 0} / {usage?.limits.fixes === -1 ? '∞' : usage?.limits.fixes}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${getUsagePercentage(usage?.fixesUsed || 0, usage?.limits.fixes || 5)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Audits</span>
                  <span className="text-gray-600">
                    {usage?.auditsUsed || 0} / {usage?.limits.audits === -1 ? '∞' : usage?.limits.audits}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${getUsagePercentage(usage?.auditsUsed || 0, usage?.limits.audits || 3)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          {usage?.tier === 'FREE' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade Your Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PRO Plan */}
                <div className="bg-white shadow rounded-lg p-6 border-2 border-blue-500">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">PRO</h3>
                  <p className="text-4xl font-bold text-gray-900 mb-4">
                    $49<span className="text-lg text-gray-600">/month</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      500 analyses/month
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      200 fixes/month
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      100 audits/month
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      Priority support
                    </li>
                  </ul>
                  <button
                    onClick={() => handleUpgrade('PRO')}
                    disabled={upgrading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? 'Processing...' : 'Upgrade to PRO'}
                  </button>
                </div>

                {/* ENTERPRISE Plan */}
                <div className="bg-white shadow rounded-lg p-6 border-2 border-purple-500">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">ENTERPRISE</h3>
                  <p className="text-4xl font-bold text-gray-900 mb-4">
                    $199<span className="text-lg text-gray-600">/month</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      Unlimited analyses
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      Unlimited fixes
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      Unlimited audits
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      24/7 dedicated support
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      Custom integrations
                    </li>
                  </ul>
                  <button
                    onClick={() => handleUpgrade('ENTERPRISE')}
                    disabled={upgrading}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? 'Processing...' : 'Upgrade to ENTERPRISE'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
