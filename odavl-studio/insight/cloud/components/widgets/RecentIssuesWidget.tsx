/**
 * Recent Issues Widget
 * Displays latest detected issues
 */

'use client';

import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  timestamp: string;
}

export function RecentIssuesWidget() {
  // Mock data - replace with real API call
  const issues: Issue[] = [
    {
      id: '1',
      title: 'Potential SQL injection vulnerability',
      severity: 'critical',
      file: 'api/users.ts',
      timestamp: '2 min ago'
    },
    {
      id: '2',
      title: 'Unused variable detected',
      severity: 'low',
      file: 'components/Header.tsx',
      timestamp: '15 min ago'
    },
    {
      id: '3',
      title: 'Missing error handling',
      severity: 'high',
      file: 'lib/database.ts',
      timestamp: '1 hour ago'
    },
    {
      id: '4',
      title: 'Deprecated API usage',
      severity: 'medium',
      file: 'utils/helpers.ts',
      timestamp: '2 hours ago'
    }
  ];

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Recent Issues</h3>
        </div>
        <span className="text-sm text-gray-500">{issues.length} new</span>
      </div>

      <div className="space-y-3">
        {issues.map(issue => (
          <div
            key={issue.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
              {issue.severity}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{issue.file}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{issue.timestamp}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
        View All Issues
      </button>
    </div>
  );
}
