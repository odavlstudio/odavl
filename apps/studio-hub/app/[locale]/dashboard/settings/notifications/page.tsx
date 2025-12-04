'use client';

/**
 * ODAVL Studio - Notification Settings Page (Refactored)
 * Configure email, webhook, and in-app notification preferences
 *
 * Reduced from 549 LOC to 205 LOC (62% reduction)
 * Extracted 4 reusable components
 */

import React, { useState } from 'react';
import { Check, Save } from 'lucide-react';
import { type NotificationPreferences } from '@/lib/types/notifications';
import { InAppNotificationsSection } from '@/components/settings/in-app-notifications-section';
import { EmailNotificationsSection } from '@/components/settings/email-notifications-section';
import { WebhookNotificationsSection } from '@/components/settings/webhook-notifications-section';

const mockPreferences: NotificationPreferences = {
  inApp: {
    enabled: true,
    sound: true,
    desktop: true,
  },
  email: {
    enabled: true,
    criticalIssues: true,
    autopilotRuns: true,
    guardianTests: true,
    teamActivity: false,
    billing: true,
    weeklyDigest: true,
  },
  webhooks: {
    enabled: false,
    slack: {
      enabled: false,
      webhookUrl: '',
      channels: [],
    },
    discord: {
      enabled: false,
      webhookUrl: '',
    },
    teams: {
      enabled: false,
      webhookUrl: '',
    },
    custom: {
      enabled: false,
      webhookUrl: '',
      headers: {},
    },
  },
};

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(mockPreferences);
  const [saved, setSaved] = useState(false);

  const updateInAppPref = (key: keyof NotificationPreferences['inApp'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      inApp: { ...prev.inApp, [key]: value },
    }));
  };

  const updateEmailPref = (key: keyof NotificationPreferences['email'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  const updateWebhookService = (
    service: 'slack' | 'discord' | 'teams' | 'custom',
    updates: Partial<any>
  ) => {
    setPreferences(prev => ({
      ...prev,
      webhooks: {
        ...prev.webhooks,
        [service]: { ...prev.webhooks[service], ...updates },
      },
    }));
  };

  const savePreferences = () => {
    // TODO: Save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage how and when you receive notifications from ODAVL Studio
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          className={`px-6 py-2.5 rounded-lg font-medium flex items-center space-x-2 transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? (
            <>
              <Check className="h-5 w-5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* In-App Notifications */}
      <InAppNotificationsSection
        preferences={preferences.inApp}
        onUpdate={updateInAppPref}
      />

      {/* Email Notifications */}
      <EmailNotificationsSection
        preferences={preferences.email}
        onUpdate={updateEmailPref}
      />

      {/* Webhooks */}
      <WebhookNotificationsSection
        preferences={preferences.webhooks}
        onUpdate={updateWebhookService}
      />

      {/* Email Preview Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Email Preview</h2>
          <p className="text-sm text-gray-600">Preview how notifications will appear in your inbox</p>
        </div>

        <div className="p-6">
          <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">ODAVL Studio</h3>
                  <p className="text-blue-100 text-sm">Autonomous Code Quality</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Critical Issue Detected</h4>
              <p className="text-gray-600 mb-6">
                ODAVL Insight detected a critical issue in your project <strong>E-Commerce API</strong>:
              </p>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                <h5 className="text-red-900 font-semibold mb-2">Hardcoded API Key Found</h5>
                <p className="text-red-800 text-sm">
                  Found hardcoded API key in auth/config.ts:15. This could expose sensitive credentials.
                </p>
                <div className="mt-3">
                  <span className="inline-block bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded">
                    CRITICAL
                  </span>
                </div>
              </div>

              <div className="text-center">
                <a
                  href="#"
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-colors"
                >
                  View Issue Details →
                </a>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                You received this email because you have notifications enabled for critical issues.
              </p>
              <p className="text-xs text-gray-500">
                <a href="#" className="text-blue-600 hover:text-blue-700">Manage preferences</a> •
                <a href="#" className="text-gray-500 hover:text-gray-700 ml-2">Unsubscribe</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
