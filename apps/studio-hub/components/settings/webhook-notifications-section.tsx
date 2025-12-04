/**
 * Webhook Notifications Section Component
 */

import React from 'react';
import { Webhook } from 'lucide-react';
import { WebhookCard } from './webhook-card';
import { type NotificationPreferences } from '@/lib/types/notifications';

interface WebhookNotificationsSectionProps {
  preferences: NotificationPreferences['webhooks'];
  onUpdate: (service: 'slack' | 'discord' | 'teams' | 'custom', updates: Partial<any>) => void;
}

export function WebhookNotificationsSection({
  preferences,
  onUpdate,
}: WebhookNotificationsSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Webhook className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Webhook Notifications</h2>
            <p className="text-sm text-gray-600">Send notifications to external services</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Active
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Slack */}
        <WebhookCard
          name="Slack"
          description="Send notifications to Slack channels"
          icon={
            <svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
          }
          enabled={preferences.slack.enabled}
          webhookUrl={preferences.slack.webhookUrl}
          onToggle={() => onUpdate('slack', { enabled: !preferences.slack.enabled })}
          onUrlChange={(url) => onUpdate('slack', { webhookUrl: url })}
          placeholder="https://hooks.slack.com/services/..."
          colorScheme="purple"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Channels (comma separated)
            </label>
            <input
              type="text"
              placeholder="#general, #engineering, #alerts"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </WebhookCard>

        {/* Discord */}
        <WebhookCard
          name="Discord"
          description="Send notifications to Discord servers"
          icon={
            <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          }
          enabled={preferences.discord.enabled}
          webhookUrl={preferences.discord.webhookUrl}
          onToggle={() => onUpdate('discord', { enabled: !preferences.discord.enabled })}
          onUrlChange={(url) => onUpdate('discord', { webhookUrl: url })}
          placeholder="https://discord.com/api/webhooks/..."
          colorScheme="indigo"
        />

        {/* Microsoft Teams */}
        <WebhookCard
          name="Microsoft Teams"
          description="Send notifications to Teams channels"
          icon={
            <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.625 8.127v7.746a1.125 1.125 0 01-1.125 1.125h-7.746a1.125 1.125 0 01-1.125-1.125V8.127a1.125 1.125 0 011.125-1.125h7.746a1.125 1.125 0 011.125 1.125zM9.375 7.002H3.502A1.5 1.5 0 002 8.502v6.996A1.5 1.5 0 003.502 17h5.873V7.002zm0 0V2.25A.75.75 0 008.625 1.5h-4.5a.75.75 0 00-.75.75v4.752h5.998z"/>
            </svg>
          }
          enabled={preferences.teams.enabled}
          webhookUrl={preferences.teams.webhookUrl}
          onToggle={() => onUpdate('teams', { enabled: !preferences.teams.enabled })}
          onUrlChange={(url) => onUpdate('teams', { webhookUrl: url })}
          placeholder="https://outlook.office.com/webhook/..."
          colorScheme="blue"
        />

        {/* Custom Webhook */}
        <WebhookCard
          name="Custom Webhook"
          description="Send notifications to any webhook endpoint"
          icon={<Webhook className="h-5 w-5 text-gray-600" />}
          enabled={preferences.custom.enabled}
          webhookUrl={preferences.custom.webhookUrl}
          onToggle={() => onUpdate('custom', { enabled: !preferences.custom.enabled })}
          onUrlChange={(url) => onUpdate('custom', { webhookUrl: url })}
          placeholder="https://your-api.com/webhook"
          colorScheme="gray"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Custom Headers (Optional)
            </label>
            <textarea
              placeholder='{"Authorization": "Bearer token", "X-API-Key": "key"}'
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-mono"
            />
          </div>
        </WebhookCard>
      </div>
    </div>
  );
}
