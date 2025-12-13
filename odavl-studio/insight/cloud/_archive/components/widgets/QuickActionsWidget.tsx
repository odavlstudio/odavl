/**
 * Quick Actions Widget
 * Common tasks and shortcuts
 */

'use client';

import React from 'react';
import {
  Zap,
  Play,
  FileText,
  Users,
  Settings,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  action: () => void;
}

export function QuickActionsWidget() {
  const actions: QuickAction[] = [
    {
      id: 'run-analysis',
      label: 'Run Analysis',
      icon: Play,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('Run analysis')
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('Generate report')
    },
    {
      id: 'invite-team',
      label: 'Invite Team',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => console.log('Invite team')
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('Export data')
    },
    {
      id: 'import-config',
      label: 'Import Config',
      icon: Upload,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => console.log('Import config')
    },
    {
      id: 'sync-data',
      label: 'Sync Data',
      icon: RefreshCw,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => console.log('Sync data')
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`${action.color} text-white p-3 rounded-lg transition-colors flex flex-col items-center gap-2 hover:shadow-md`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
        <Settings className="w-4 h-4" />
        Customize Actions
      </button>
    </div>
  );
}
