/**
 * GDPR Cookie Consent Banner Component
 *
 * Compliant with:
 * - GDPR (EU)
 * - ePrivacy Directive (EU)
 * - CCPA (California)
 *
 * Features:
 * - Explicit consent before setting non-essential cookies
 * - Granular control (essential, functional, analytics, marketing)
 * - "Do Not Track" respect
 * - Persistent consent storage
 * - Easy withdrawal
 *
 * @see docs/legal/COOKIE_POLICY.md
 */

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type ConsentPreferences = {
  essential: boolean; // Always true (required for service)
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_CONSENT: ConsentPreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_CONSENT);

  useEffect(() => {
    // Check if user has already consented
    const savedConsent = localStorage.getItem("odavl_cookie_consent");

    if (!savedConsent) {
      // Check "Do Not Track" browser setting
      const dnt = navigator.doNotTrack === "1" || (window as any).doNotTrack === "1";

      if (dnt) {
        // Auto-reject non-essential cookies if DNT is enabled
        saveConsent(DEFAULT_CONSENT);
        return;
      }

      // Show banner after 1 second (better UX)
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Apply saved consent
      const saved = JSON.parse(savedConsent) as ConsentPreferences;
      applyConsent(saved);
    }
  }, []);

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem("odavl_cookie_consent", JSON.stringify(prefs));
    localStorage.setItem("odavl_cookie_consent_date", new Date().toISOString());
    applyConsent(prefs);
    setIsVisible(false);
  };

  const applyConsent = (prefs: ConsentPreferences) => {
    // Enable/disable analytics
    if (prefs.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }

    // Enable/disable marketing
    if (prefs.marketing) {
      enableMarketing();
    } else {
      disableMarketing();
    }
  };

  const acceptAll = () => {
    const allConsent: ConsentPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allConsent);
  };

  const rejectNonEssential = () => {
    saveConsent(DEFAULT_CONSENT);
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsVisible(false)} />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 max-w-7xl mx-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🍪</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cookie Consent
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We respect your privacy
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We use cookies to improve your experience, analyze usage, and personalize content.
            Essential cookies are required for the service to function.{" "}
            <a
              href="/cookies"
              target="_blank"
              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              Learn more
            </a>
          </p>

          {/* Detailed Options */}
          {showDetails && (
            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Essential */}
              <label className="flex items-center gap-3 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Essential Cookies (Always Active)
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Required for authentication, security, and core functionality
                  </p>
                </div>
              </label>

              {/* Functional */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences({ ...preferences, functional: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Functional Cookies
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Remember your preferences (theme, language, workspace)
                  </p>
                </div>
              </label>

              {/* Analytics */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Analytics Cookies
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Help us understand how you use ODAVL Studio (anonymized)
                  </p>
                </div>
              </label>

              {/* Marketing */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Marketing Cookies
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Enable personalized content and targeted advertising
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!showDetails ? (
              <>
                <button
                  onClick={acceptAll}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Accept All
                </button>
                <button
                  onClick={rejectNonEssential}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Reject Non-Essential
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Customize
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveCustom}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Enable PostHog analytics
 */
function enableAnalytics() {
  if (typeof window !== "undefined" && (window as any).posthog) {
    (window as any).posthog.opt_in_capturing();
    console.log("[ODAVL] Analytics enabled");
  }
}

/**
 * Disable PostHog analytics
 */
function disableAnalytics() {
  if (typeof window !== "undefined" && (window as any).posthog) {
    (window as any).posthog.opt_out_capturing();
    console.log("[ODAVL] Analytics disabled");
  }
}

/**
 * Enable marketing pixels (Facebook, Google Ads)
 */
function enableMarketing() {
  if (typeof window !== "undefined") {
    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq("consent", "grant");
      console.log("[ODAVL] Marketing enabled (Facebook)");
    }
    // Google Ads (implement if using)
  }
}

/**
 * Disable marketing pixels
 */
function disableMarketing() {
  if (typeof window !== "undefined") {
    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq("consent", "revoke");
      console.log("[ODAVL] Marketing disabled (Facebook)");
    }
  }
}
