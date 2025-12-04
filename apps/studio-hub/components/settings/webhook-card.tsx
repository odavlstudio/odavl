/**
 * Webhook Integration Card Component
 */

import React from 'react';

interface WebhookCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  webhookUrl?: string;
  onToggle: () => void;
  onUrlChange?: (url: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  colorScheme?: 'purple' | 'indigo' | 'blue' | 'gray';
}

export function WebhookCard({
  name,
  description,
  icon,
  enabled,
  webhookUrl,
  onToggle,
  onUrlChange,
  placeholder = 'https://...',
  children,
  colorScheme = 'gray',
}: WebhookCardProps) {
  const colors = {
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      button: enabled ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      focus: 'focus:ring-purple-500',
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      button: enabled ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      focus: 'focus:ring-indigo-500',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      button: enabled ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      focus: 'focus:ring-blue-500',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      button: enabled ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
      focus: 'focus:ring-gray-500',
    },
  };

  const scheme = colors[colorScheme];

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${scheme.bg} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${scheme.button}`}
        >
          {enabled ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {enabled ? (
        <div className="space-y-3">
          {onUrlChange && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl || ''}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${scheme.focus} text-sm`}
              />
            </div>
          )}
          {children}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Connect {name} to receive notifications</p>
      )}
    </div>
  );
}
