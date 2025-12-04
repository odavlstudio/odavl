/**
 * In-App Notifications Section Component
 */

import React from 'react';
import { Bell, Volume2, Monitor } from 'lucide-react';
import { SwitchRow } from './notification-switch-row';
import { type NotificationPreferences } from '@/lib/types/notifications';

interface InAppNotificationsSectionProps {
  preferences: NotificationPreferences['inApp'];
  onUpdate: (key: keyof NotificationPreferences['inApp'], value: boolean) => void;
}

export function InAppNotificationsSection({
  preferences,
  onUpdate,
}: InAppNotificationsSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">In-App Notifications</h2>
          <p className="text-sm text-gray-600">Notifications shown in the dashboard</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <SwitchRow
          icon={<Bell className="h-5 w-5 text-gray-600" />}
          label="Enable In-App Notifications"
          description="Show notifications in the dashboard bell icon"
          checked={preferences.enabled}
          onChange={value => onUpdate('enabled', value)}
        />

        <SwitchRow
          icon={<Volume2 className="h-5 w-5 text-gray-600" />}
          label="Sound Alerts"
          description="Play sound when new notifications arrive"
          checked={preferences.sound}
          onChange={value => onUpdate('sound', value)}
          disabled={!preferences.enabled}
        />

        <SwitchRow
          icon={<Monitor className="h-5 w-5 text-gray-600" />}
          label="Desktop Notifications"
          description="Show browser notifications (requires permission)"
          checked={preferences.desktop}
          onChange={value => onUpdate('desktop', value)}
          disabled={!preferences.enabled}
        />
      </div>
    </div>
  );
}
