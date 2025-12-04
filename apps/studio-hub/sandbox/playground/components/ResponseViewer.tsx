/**
 * ResponseViewer - HTTP response display
 */

'use client';

import { Copy } from 'lucide-react';

interface ResponseViewerProps {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
  } | null;
  error: string | null;
  onCopy: (text: string) => void;
}

export function ResponseViewer({ response, error, onCopy }: ResponseViewerProps) {
  if (!response && !error) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Response</h2>
        <button
          onClick={() => onCopy(JSON.stringify(response || error, null, 2))}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-mono text-sm">{error}</p>
        </div>
      ) : response ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                response.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {response.status} {response.statusText}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Headers</h3>
            <pre className="p-4 bg-gray-50 rounded-lg overflow-x-auto text-xs font-mono">
              {JSON.stringify(response.headers, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Body</h3>
            <pre className="p-4 bg-gray-50 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(response.body, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
