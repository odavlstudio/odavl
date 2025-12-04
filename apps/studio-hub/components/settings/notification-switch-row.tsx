/**
 * Reusable Switch Row Component for Notification Settings
 */

import React from 'react';

interface SwitchRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  priority?: 'high' | 'normal';
}

export function SwitchRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  priority = 'normal',
}: SwitchRowProps) {
  return (
    <div className={`flex items-start space-x-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">{label}</h3>
          {priority === 'high' && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
              Important
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            disabled
              ? 'bg-gray-200 cursor-not-allowed'
              : checked
              ? 'bg-blue-600'
              : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
