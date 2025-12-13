/**
 * Activity Timeline Widget
 * Recent project activity feed
 */

'use client';

import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  GitCommit
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'analysis' | 'issue' | 'report' | 'team' | 'commit';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export function ActivityTimelineWidget() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'analysis',
      title: 'Analysis completed',
      description: 'TypeScript detector found 3 new issues',
      timestamp: '5 min ago',
      user: 'Sarah Chen'
    },
    {
      id: '2',
      type: 'report',
      title: 'Report generated',
      description: 'Weekly summary report created',
      timestamp: '1 hour ago',
      user: 'System'
    },
    {
      id: '3',
      type: 'issue',
      title: 'Critical issue detected',
      description: 'Security vulnerability in auth module',
      timestamp: '2 hours ago',
      user: 'Insight Engine'
    },
    {
      id: '4',
      type: 'team',
      title: 'New member joined',
      description: 'Ahmed Ali joined the project',
      timestamp: '3 hours ago',
      user: 'Admin'
    },
    {
      id: '5',
      type: 'commit',
      title: 'Code pushed',
      description: 'Fix: Resolve authentication bug',
      timestamp: '5 hours ago',
      user: 'Emily Johnson'
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'analysis': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'issue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'report': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'team': return <Users className="w-4 h-4 text-purple-600" />;
      case 'commit': return <GitCommit className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                {getActivityIcon(activity.type)}
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.user && (
                      <>
                        <span className="text-xs text-gray-500">{activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                      </>
                    )}
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-2 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
        View Full History
      </button>
    </div>
  );
}
