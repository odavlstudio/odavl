/**
 * GDPR Cookie Consent Banner
 *
 * Compliant with GDPR Article 7 (Conditions for consent)
 * Provides granular control over cookie categories
 */

// Type for Google Analytics gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { CookieCategory } from './cookie-category';
import { initializeServices } from './cookie-services';

export interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const COOKIE_CONSENT_KEY = 'odavl_cookie_consent';
const CONSENT_VERSION = '1.0';

// Cookie category definitions
const COOKIE_CATEGORIES = {
  necessary: {
    title: 'Necessary Cookies',
    description: 'Required for authentication, security, and core functionality.',
    details: ['Session management', 'CSRF protection', 'Authentication state'] as string[],
  },
  functional: {
    title: 'Functional Cookies',
    description: 'Remember your preferences and settings.',
    details: ['Language preferences', 'Theme selection (dark/light mode)', 'Dashboard layout'] as string[],
  },
  analytics: {
    title: 'Analytics Cookies',
    description: 'Help us understand how you use the platform.',
    details: ['Page views and navigation', 'Feature usage statistics', 'Performance monitoring'] as string[],
  },
  marketing: {
    title: 'Marketing Cookies',
    description: 'Used to show relevant ads and measure campaign effectiveness.',
    details: ['Targeted advertising', 'Campaign tracking', 'Social media integration'] as string[],
  },
};

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    // Check if user has already provided consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);

        // Check if consent version matches
        if (parsed.version === CONSENT_VERSION) {
          initializeServices(parsed.consent);
        } else {
          // New version, ask for consent again
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (consentData: CookieConsent) => {
    const consentObject = {
      version: CONSENT_VERSION,
      consent: consentData,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentObject));
    initializeServices(consentData);
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    const fullConsent: CookieConsent = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };

    saveConsent(fullConsent);
  };

  const handleRejectAll = () => {
    const minimalConsent: CookieConsent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };

    saveConsent(minimalConsent);
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl m-4 bg-white rounded-lg shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              🍪 Cookie Preferences
            </h2>
            <button
              onClick={handleRejectAll}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            We use cookies to improve your experience on our platform. You can choose which
            categories of cookies you want to allow. For more information, please read our{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/cookies" className="text-blue-600 hover:underline">
              Cookie Policy
            </Link>.
          </p>

          {!showDetails ? (
            <div className="space-y-4">
              <CookieCategory
                title={COOKIE_CATEGORIES.necessary.title}
                description="Required for the website to function. These cannot be disabled."
                details={COOKIE_CATEGORIES.necessary.details}
                checked={true}
                disabled={true}
              />

              <button
                onClick={() => setShowDetails(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Show cookie details
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <CookieCategory
                title={COOKIE_CATEGORIES.necessary.title}
                description={COOKIE_CATEGORIES.necessary.description}
                details={COOKIE_CATEGORIES.necessary.details}
                checked={true}
                disabled={true}
              />

              <CookieCategory
                title={COOKIE_CATEGORIES.functional.title}
                description={COOKIE_CATEGORIES.functional.description}
                details={COOKIE_CATEGORIES.functional.details}
                checked={consent.functional}
                onChange={(checked) => setConsent({ ...consent, functional: checked })}
              />

              <CookieCategory
                title={COOKIE_CATEGORIES.analytics.title}
                description={COOKIE_CATEGORIES.analytics.description}
                details={COOKIE_CATEGORIES.analytics.details}
                checked={consent.analytics}
                onChange={(checked) => setConsent({ ...consent, analytics: checked })}
              />

              <CookieCategory
                title={COOKIE_CATEGORIES.marketing.title}
                description={COOKIE_CATEGORIES.marketing.description}
                details={COOKIE_CATEGORIES.marketing.details}
                checked={consent.marketing}
                onChange={(checked) => setConsent({ ...consent, marketing: checked })}
              />

              <button
                onClick={() => setShowDetails(false)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Hide details
              </button>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleRejectAll}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Reject All
            </button>
            {showDetails && (
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-6 py-3 border-2 border-blue-600 rounded-lg font-medium text-blue-600 hover:bg-blue-50 transition"
              >
                Save Preferences
              </button>
            )}
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-6 py-3 bg-blue-600 rounded-lg font-medium text-white hover:bg-blue-700 transition"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to access current cookie consent
 */
export function useCookieConsent(): CookieConsent | null {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed.consent);
      } catch {
        setConsent(null);
      }
    }
  }, []);

  return consent;
}

/**
 * Update cookie consent preferences
 */
export function updateCookieConsent(newConsent: Partial<CookieConsent>): void {
  const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (savedConsent) {
    try {
      const parsed = JSON.parse(savedConsent);
      const updated = {
        ...parsed.consent,
        ...newConsent,
        timestamp: new Date().toISOString(),
      };

      const consentObject = {
        version: CONSENT_VERSION,
        consent: updated,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentObject));
      initializeServices(updated);
    } catch (error) {
      console.error('Failed to update cookie consent:', error);
    }
  }
}
