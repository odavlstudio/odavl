/**
 * Welcome Modal Component
 * Shows tier options to new users after first login
 */

'use client';

import { useState, useEffect } from 'react';
import { PRODUCT_TIERS } from '@odavl/types';

interface WelcomeModalProps {
  userName?: string;
  onClose: () => void;
}

export default function WelcomeModal({ userName, onClose }: WelcomeModalProps) {
  const [activating, setActivating] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) return;

    setActivating(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Activation failed');
      }

      // Success - close modal and reload
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-2xl">
          <h2 className="text-3xl font-bold mb-2">
            Welcome to ODAVL Studio{userName ? `, ${userName}` : ''}! 🎉
          </h2>
          <p className="text-blue-100">
            You&apos;re now on the FREE plan. Explore our features or upgrade for more power!
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* FREE Plan Features */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Your FREE Plan Includes:</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {PRODUCT_TIERS.FREE.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Options */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Need More? Upgrade Anytime:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* PRO */}
              <div className="border-2 border-orange-400 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ⭐ POPULAR
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">PRO</h4>
                <div className="text-3xl font-bold text-gray-900 mb-3">
                  ${PRODUCT_TIERS.PRO.price}<span className="text-sm text-gray-600 font-normal">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                  <li>✓ 10 projects</li>
                  <li>✓ 1,000 analyses/month</li>
                  <li>✓ ML predictions</li>
                  <li>✓ Auto-fix suggestions</li>
                  <li>✓ Advanced detectors</li>
                </ul>
                <a
                  href="/dashboard/billing/upgrade"
                  className="block w-full text-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                  onClick={onClose}
                >
                  Upgrade to PRO
                </a>
              </div>

              {/* ENTERPRISE */}
              <div className="border-2 border-gray-300 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">ENTERPRISE</h4>
                <div className="text-3xl font-bold text-gray-900 mb-3">
                  ${PRODUCT_TIERS.ENTERPRISE.price}<span className="text-sm text-gray-600 font-normal">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                  <li>✓ Unlimited projects</li>
                  <li>✓ Unlimited analyses</li>
                  <li>✓ Custom rules engine</li>
                  <li>✓ Team collaboration</li>
                  <li>✓ SSO/SAML</li>
                </ul>
                <a
                  href="/dashboard/billing/upgrade"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  onClick={onClose}
                >
                  Upgrade to Enterprise
                </a>
              </div>
            </div>
          </div>

          {/* License Key Activation */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Have a License Key?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Activate your license key to instantly unlock paid features.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="ODAVL-PRO-XXXXXX-XXXX"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={activating}
              />
              <button
                onClick={handleActivateLicense}
                disabled={activating || !licenseKey.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {activating ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Continue with FREE Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
