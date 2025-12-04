'use client';

/**
 * Storage Dashboard Page
 * View and manage cloud storage files
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface StorageStats {
  total: {
    bytes: number;
    formatted: string;
  };
  byProduct: {
    insight: { bytes: number; formatted: string };
    autopilot: { bytes: number; formatted: string };
    guardian: { bytes: number; formatted: string };
  };
  limit: {
    bytes: number;
    formatted: string;
  };
  percentUsed: number;
  withinLimit: boolean;
}

interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: string;
  parsed: {
    orgId: string;
    product: string;
    userId: string;
    filename: string;
  } | null;
}

interface FilesResponse {
  files: FileMetadata[];
  nextToken?: string;
  isTruncated: boolean;
  count: number;
}

export default function StoragePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [selectedProduct]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch storage stats
      const statsResponse = await fetch('/api/v1/storage/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch files
      const filesUrl = selectedProduct === 'all'
        ? '/api/v1/storage/files'
        : `/api/v1/storage/files?product=${selectedProduct}`;

      const filesResponse = await fetch(filesUrl);
      if (!filesResponse.ok) throw new Error('Failed to fetch files');
      const filesData: FilesResponse = await filesResponse.json();
      setFiles(filesData.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/v1/storage/files?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete file');

      // Refresh data
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleDownload = async (key: string, filename: string) => {
    try {
      const response = await fetch(`/api/v1/storage/download-url?key=${encodeURIComponent(key)}`);
      if (!response.ok) throw new Error('Failed to generate download URL');

      const data = await response.json();

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cloud Storage</h1>
          <p className="text-gray-600">Manage your uploaded files and monitor storage usage</p>
        </div>

        {/* Storage Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Storage */}
            <StorageCard
              title="Total Storage"
              value={stats.total.formatted}
              limit={stats.limit.formatted}
              percent={stats.percentUsed}
              icon="💾"
            />

            {/* Insight Storage */}
            <StorageCard
              title="Insight"
              value={stats.byProduct.insight.formatted}
              icon="🔍"
              small
            />

            {/* Autopilot Storage */}
            <StorageCard
              title="Autopilot"
              value={stats.byProduct.autopilot.formatted}
              icon="🤖"
              small
            />

            {/* Guardian Storage */}
            <StorageCard
              title="Guardian"
              value={stats.byProduct.guardian.formatted}
              icon="🛡️"
              small
            />
          </div>
        )}

        {/* Files List */}
        <div className="bg-white rounded-lg shadow">
          {/* Filter */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by product:</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="insight">Insight</option>
                <option value="autopilot">Autopilot</option>
                <option value="guardian">Guardian</option>
              </select>
              <button
                onClick={fetchData}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Files Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No files found. Upload some files to get started!
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {file.parsed?.filename || file.key.split('/').pop()}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{file.contentType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getProductColor(file.parsed?.product)}`}>
                          {file.parsed?.product || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBytes(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownload(file.key, file.parsed?.filename || 'file')}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.key)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          {files.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
              Showing {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Storage Card Component
function StorageCard({
  title,
  value,
  limit,
  percent,
  icon,
  small = false,
}: {
  title: string;
  value: string;
  limit?: string;
  percent?: number;
  icon: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {limit && <div className="text-sm text-gray-500">of {limit}</div>}
      </div>

      {percent !== undefined && (
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${Math.min(percent, 100)}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(percent)}`}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">{Math.round(percent)}% used</span>
            {percent >= 80 && (
              <span className="text-xs text-red-600 font-semibold">
                {percent >= 100 ? 'Exceeded!' : 'Warning'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 90) return 'bg-orange-500';
  if (percent >= 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getProductColor(product?: string): string {
  switch (product) {
    case 'insight':
      return 'bg-blue-100 text-blue-800';
    case 'autopilot':
      return 'bg-purple-100 text-purple-800';
    case 'guardian':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
