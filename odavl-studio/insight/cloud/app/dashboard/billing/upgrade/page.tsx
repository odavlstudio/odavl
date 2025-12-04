/**
 * Upgrade/Pricing Page
 * Shows: Pricing cards, feature comparison, license activation form
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { PRODUCT_TIERS, type SubscriptionTier } from '@odavl/types';

export default function UpgradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setUpgrading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upgrade failed');
      }

      setMessage({ type: 'success', text: data.message || 'Upgrade successful!' });
      setTimeout(() => router.push('/dashboard/billing'), 2000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to upgrade',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setActivating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/billing/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Activation failed');
      }

      setMessage({ type: 'success', text: 'License activated successfully!' });
      setLicenseKey('');
      setTimeout(() => router.push('/dashboard/billing'), 2000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to activate license',
      });
    } finally {
      setActivating(false);
    }
  };

  const tiers = [PRODUCT_TIERS.FREE, PRODUCT_TIERS.PRO, PRODUCT_TIERS.ENTERPRISE];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your code quality needs
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`bg-white rounded-2xl shadow-lg p-8 relative ${
              tier.popular ? 'border-4 border-orange-400 transform scale-105' : 'border border-gray-200'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  ⭐ POPULAR
                </span>
              </div>
            )}

            {/* Tier Name */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.displayName}</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                ${tier.price}
                <span className="text-lg text-gray-600 font-normal">/month</span>
              </div>
              {tier.yearlyPrice && (
                <p className="text-sm text-gray-600">
                  or ${tier.yearlyPrice}/year (save ${(tier.price * 12 - tier.yearlyPrice).toFixed(0)})
                </p>
              )}
              <p className="text-gray-600 mt-3">{tier.description}</p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {/* Limits */}
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm">
                  <strong>{tier.limits.maxProjects === -1 ? 'Unlimited' : tier.limits.maxProjects}</strong> projects
                </span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm">
                  <strong>{tier.limits.maxAnalysesPerMonth === -1 ? 'Unlimited' : tier.limits.maxAnalysesPerMonth}</strong> analyses/month
                </span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm">
                  <strong>{tier.limits.maxStorageGB === -1 ? 'Unlimited' : `${tier.limits.maxStorageGB} GB`}</strong> storage
                </span>
              </div>

              {/* Features */}
              {tier.features.slice(0, 8).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleUpgrade(tier.id as SubscriptionTier)}
              disabled={upgrading || tier.id === 'FREE'}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                tier.popular
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : tier.id === 'FREE'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {upgrading ? 'Processing...' : tier.id === 'FREE' ? 'Current Plan' : `Upgrade to ${tier.displayName}`}
            </button>
          </div>
        ))}
      </div>

      {/* License Activation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-md p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have a License Key?</h2>
          <p className="text-gray-600 mb-6">
            If you purchased a license from a reseller or received one from your organization, activate it here.
          </p>
          <form onSubmit={handleActivateLicense} className="flex gap-4">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="ODAVL-PRO-XXXXXX-XXXX"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={activating}
            />
            <button
              type="submit"
              disabled={activating || !licenseKey.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {activating ? 'Activating...' : 'Activate'}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
            <p className="text-gray-600">Yes, you can upgrade or downgrade at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What happens when I reach my limits?</h3>
            <p className="text-gray-600">You&apos;ll receive notifications when approaching limits. Upgrade to continue using services.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial for paid plans?</h3>
            <p className="text-gray-600">Start with the FREE plan to evaluate ODAVL Studio. Upgrade when ready for advanced features.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How do license keys work?</h3>
            <p className="text-gray-600">License keys are cryptographically signed and can be purchased from authorized resellers or directly from ODAVL.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

