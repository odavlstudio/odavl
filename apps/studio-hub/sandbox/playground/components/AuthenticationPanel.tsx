/**
 * AuthenticationPanel - API key input
 */

'use client';

import { Settings } from 'lucide-react';

interface AuthenticationPanelProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function AuthenticationPanel({ apiKey, onApiKeyChange }: AuthenticationPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5" />
        <h2 className="font-semibold">Authentication</h2>
      </div>
      <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
        API Key
      </label>
      <input
        id="api-key-input"
        type="password"
        placeholder="Enter your API key (odavl_sk_...)"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        autoComplete="off"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ minHeight: '48px' }}
      />
      <p className="text-sm text-gray-600 mt-3">
        Get your API key from{' '}
        <a
          href="/dashboard/settings/api-keys"
          className="inline-flex items-center justify-center px-4 text-blue-600 hover:bg-blue-50 rounded font-medium transition"
          style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 20px' }}
        >
          Dashboard → Settings → API Keys
        </a>
      </p>
    </div>
  );
}
