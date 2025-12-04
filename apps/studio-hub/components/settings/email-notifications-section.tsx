/**
 * Email Notifications Section Component
 */

import React from 'react';
import {
  Mail,
  AlertCircle,
  Rocket,
  ShieldCheck,
  Users,
  CreditCard,
  CalendarDays,
} from 'lucide-react';
import { SwitchRow } from './notification-switch-row';
import { type NotificationPreferences } from '@/lib/types/notifications';

interface EmailNotificationsSectionProps {
  preferences: NotificationPreferences['email'];
  onUpdate: (key: keyof NotificationPreferences['email'], value: boolean) => void;
}

export function EmailNotificationsSection({
  preferences,
  onUpdate,
}: EmailNotificationsSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center space-x-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Mail className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Email Notifications</h2>
          <p className="text-sm text-gray-600">Receive updates via email</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <SwitchRow
          icon={<Mail className="h-5 w-5 text-gray-600" />}
          label="Enable Email Notifications"
          description="Receive email updates for important events"
          checked={preferences.enabled}
          onChange={value => onUpdate('enabled', value)}
        />

        <div className="pl-12 space-y-4 border-l-2 border-gray-200 ml-2">
          <SwitchRow
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
            label="Critical Issues"
            description="Get notified immediately when critical security or error issues are detected"
            checked={preferences.criticalIssues}
            onChange={value => onUpdate('criticalIssues', value)}
            disabled={!preferences.enabled}
            priority="high"
          />

          <SwitchRow
            icon={<Rocket className="h-5 w-5 text-green-600" />}
            label="Autopilot Runs"
            description="Receive updates when Autopilot completes a self-healing run"
            checked={preferences.autopilotRuns}
            onChange={value => onUpdate('autopilotRuns', value)}
            disabled={!preferences.enabled}
          />

          <SwitchRow
            icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
            label="Guardian Tests"
            description="Get notified about accessibility, performance, and security test results"
            checked={preferences.guardianTests}
            onChange={value => onUpdate('guardianTests', value)}
            disabled={!preferences.enabled}
          />

          <SwitchRow
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            label="Team Activity"
            description="Updates when team members join, leave, or change roles"
            checked={preferences.teamActivity}
            onChange={value => onUpdate('teamActivity', value)}
            disabled={!preferences.enabled}
          />

          <SwitchRow
            icon={<CreditCard className="h-5 w-5 text-purple-600" />}
            label="Billing & Invoices"
            description="Receive billing notifications, invoices, and subscription updates"
            checked={preferences.billing}
            onChange={value => onUpdate('billing', value)}
            disabled={!preferences.enabled}
            priority="high"
          />

          <SwitchRow
            icon={<CalendarDays className="h-5 w-5 text-orange-600" />}
            label="Weekly Digest"
            description="Summary of your week: issues fixed, tests run, and key metrics"
            checked={preferences.weeklyDigest}
            onChange={value => onUpdate('weeklyDigest', value)}
            disabled={!preferences.enabled}
          />
        </div>
      </div>
    </div>
  );
}
