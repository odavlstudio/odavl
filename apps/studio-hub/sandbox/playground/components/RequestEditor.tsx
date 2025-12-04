/**
 * RequestEditor - Request body textarea and run button
 */

'use client';

import { Play } from 'lucide-react';

interface RequestEditorProps {
  requestBody: string;
  loading: boolean;
  apiKey: string;
  selectedEndpointMethod: 'GET' | 'POST';
  onRequestBodyChange: (body: string) => void;
  onRun: () => void;
}

export function RequestEditor({
  requestBody,
  loading,
  apiKey,
  selectedEndpointMethod,
  onRequestBodyChange,
  onRun,
}: RequestEditorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <label htmlFor="request-body" className="block text-base font-semibold mb-4">
        Request
      </label>
      <textarea
        id="request-body"
        value={requestBody}
        onChange={(e) => onRequestBodyChange(e.target.value)}
        placeholder={selectedEndpointMethod === 'GET' ? 'Query parameters (JSON)' : 'Request body (JSON)'}
        className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        style={{ minHeight: '192px' }}
      />
      <div className="mt-4 flex gap-3">
        <button
          onClick={onRun}
          disabled={loading || !apiKey}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          style={{ minHeight: '48px' }}
        >
          <Play className="w-4 h-4" />
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}
