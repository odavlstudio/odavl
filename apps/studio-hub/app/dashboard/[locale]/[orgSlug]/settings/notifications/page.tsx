'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Preferences {
  emailEnabled: boolean;
  emailInvitations: boolean;
  emailErrorAlerts: boolean;
  emailUsageLimits: boolean;
  emailBilling: boolean;
  emailWeeklySummary: boolean;
  inAppEnabled: boolean;
  inAppInvitations: boolean;
  inAppErrorAlerts: boolean;
  inAppUsageLimits: boolean;
  inAppBilling: boolean;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookEvents: string[];
  errorAlertThreshold: number;
  usageLimitThreshold: number;
}

export default function NotificationSettingsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/users/me/preferences');
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/v1/users/me/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof Preferences, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return <div>Failed to load preferences</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notification Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Email Notifications */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Email Notifications</h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600"
              />
              <span className="ml-2">Enable All</span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Team Invitations</p>
                <p className="text-sm text-gray-600">When someone invites you to join their organization</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailInvitations}
                onChange={(e) => updatePreference('emailInvitations', e.target.checked)}
                disabled={!preferences.emailEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Error Alerts</p>
                <p className="text-sm text-gray-600">When errors are detected in your projects</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailErrorAlerts}
                onChange={(e) => updatePreference('emailErrorAlerts', e.target.checked)}
                disabled={!preferences.emailEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Usage Limits</p>
                <p className="text-sm text-gray-600">When approaching plan limits</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailUsageLimits}
                onChange={(e) => updatePreference('emailUsageLimits', e.target.checked)}
                disabled={!preferences.emailEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Billing & Subscriptions</p>
                <p className="text-sm text-gray-600">Payment receipts and subscription updates</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailBilling}
                onChange={(e) => updatePreference('emailBilling', e.target.checked)}
                disabled={!preferences.emailEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-gray-600">Weekly digest of activity and insights</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailWeeklySummary}
                onChange={(e) => updatePreference('emailWeeklySummary', e.target.checked)}
                disabled={!preferences.emailEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">In-App Notifications</h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600"
              />
              <span className="ml-2">Enable All</span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Team Invitations</p>
              <input
                type="checkbox"
                checked={preferences.inAppInvitations}
                onChange={(e) => updatePreference('inAppInvitations', e.target.checked)}
                disabled={!preferences.inAppEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="font-medium">Error Alerts</p>
              <input
                type="checkbox"
                checked={preferences.inAppErrorAlerts}
                onChange={(e) => updatePreference('inAppErrorAlerts', e.target.checked)}
                disabled={!preferences.inAppEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="font-medium">Usage Limits</p>
              <input
                type="checkbox"
                checked={preferences.inAppUsageLimits}
                onChange={(e) => updatePreference('inAppUsageLimits', e.target.checked)}
                disabled={!preferences.inAppEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="font-medium">Billing & Subscriptions</p>
              <input
                type="checkbox"
                checked={preferences.inAppBilling}
                onChange={(e) => updatePreference('inAppBilling', e.target.checked)}
                disabled={!preferences.inAppEnabled}
                className="w-5 h-5 text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Alert Thresholds</h2>

          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2">
                Error Alert Threshold
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Alert when error count exceeds this number
              </p>
              <input
                type="number"
                min="1"
                max="1000"
                value={preferences.errorAlertThreshold}
                onChange={(e) => updatePreference('errorAlertThreshold', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Usage Limit Threshold (%)
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Alert when usage reaches this percentage of plan limit
              </p>
              <input
                type="number"
                min="50"
                max="100"
                value={preferences.usageLimitThreshold}
                onChange={(e) => updatePreference('usageLimitThreshold', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
