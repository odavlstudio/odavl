import { ReactNode } from 'react';

export interface ProductCardProps {
  name: string;
  type: string;
  path: string;
  readinessScore: number;
  status: 'ready' | 'blocked' | 'unstable';
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  autoFixableCount: number;
  onScan?: () => void;
  onFix?: () => void;
  isScanning?: boolean;
  isFixing?: boolean;
}

export default function ProductCard({
  name,
  type,
  path,
  readinessScore,
  status,
  issues,
  autoFixableCount,
  onScan,
  onFix,
  isScanning = false,
  isFixing = false,
}: ProductCardProps) {
  // Status colors and icons
  const statusConfig = {
    ready: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      icon: '✅',
    },
    unstable: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      icon: '⚠️',
    },
    blocked: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      icon: '🚫',
    },
  };

  const config = statusConfig[status];
  const totalIssues = issues.critical + issues.high + issues.medium + issues.low;

  // Product type icons
  const typeIcons: Record<string, string> = {
    'vscode-extension': '🧩',
    'nextjs-app': '⚡',
    'nodejs-server': '🖥️',
    'cli-app': '🔧',
    'npm-package': '📦',
    'cloud-function': '☁️',
    'ide-extension': '🎨',
  };

  const typeIcon = typeIcons[type] || '📁';

  return (
    <div
      className={`bg-slate-900 rounded-lg border ${config.borderColor} overflow-hidden hover:border-slate-600 transition-colors`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{typeIcon}</span>
              <h3 className="text-xl font-bold">{name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
                {config.icon} {status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-slate-400 font-mono">{path}</div>
          </div>

          {/* Readiness Score */}
          <div className="text-right">
            <div className={`text-4xl font-bold ${config.color}`}>
              {readinessScore}%
            </div>
            <div className="text-xs text-slate-500 uppercase">Readiness</div>
          </div>
        </div>
      </div>

      {/* Issues Breakdown */}
      {totalIssues > 0 && (
        <div className="p-6 border-b border-slate-800">
          <div className="text-sm font-medium text-slate-400 mb-3">
            Issues Found ({totalIssues})
          </div>
          <div className="grid grid-cols-4 gap-2">
            {issues.critical > 0 && (
              <div className="bg-red-500/10 rounded p-2 text-center">
                <div className="text-xl font-bold text-red-500">
                  {issues.critical}
                </div>
                <div className="text-xs text-slate-400">Critical</div>
              </div>
            )}
            {issues.high > 0 && (
              <div className="bg-orange-500/10 rounded p-2 text-center">
                <div className="text-xl font-bold text-orange-500">
                  {issues.high}
                </div>
                <div className="text-xs text-slate-400">High</div>
              </div>
            )}
            {issues.medium > 0 && (
              <div className="bg-yellow-500/10 rounded p-2 text-center">
                <div className="text-xl font-bold text-yellow-500">
                  {issues.medium}
                </div>
                <div className="text-xs text-slate-400">Medium</div>
              </div>
            )}
            {issues.low > 0 && (
              <div className="bg-blue-500/10 rounded p-2 text-center">
                <div className="text-xl font-bold text-blue-500">
                  {issues.low}
                </div>
                <div className="text-xs text-slate-400">Low</div>
              </div>
            )}
          </div>

          {/* Auto-fixable badge */}
          {autoFixableCount > 0 && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded px-3 py-2 text-sm">
              <span className="text-blue-400 font-medium">
                🤖 {autoFixableCount} issues can be auto-fixed
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-6 flex gap-3">
        <button
          onClick={onScan}
          disabled={isScanning || isFixing}
          className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors"
        >
          {isScanning ? '⏳ Scanning...' : '🔍 Re-scan'}
        </button>
        {autoFixableCount > 0 && (
          <button
            onClick={onFix}
            disabled={isScanning || isFixing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-900 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors"
          >
            {isFixing ? '⏳ Fixing...' : `🔧 Auto-Fix (${autoFixableCount})`}
          </button>
        )}
      </div>
    </div>
  );
}
