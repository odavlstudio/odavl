'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  gitBranch: string;
  environment: string;
}

export default function VersionBadge() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Fetch version info
    fetch('/version.json')
      .then((res) => res.json())
      .then((data) => setVersion(data))
      .catch(() => {
        // Fallback if version.json not available
        setVersion({
          version: 'v1.0.0-GA',
          buildTime: new Date().toISOString(),
          gitCommit: 'unknown',
          gitBranch: 'main',
          environment: 'production',
        });
      });
  }, []);

  if (!version) return null;

  const formatBuildTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge */}
      <div className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-full cursor-help">
        {version.version}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {version.version}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Commit:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {version.gitCommit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Branch:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {version.gitBranch}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Built:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatBuildTime(version.buildTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Environment:</span>
              <span className="text-gray-900 dark:text-gray-100 capitalize">
                {version.environment}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
