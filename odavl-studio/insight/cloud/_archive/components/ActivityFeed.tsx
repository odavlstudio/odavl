/**
 * Activity Feed Component
 * Real-time team activity timeline
 */

'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  AlertCircle, 
  Users, 
  FileUp,
  Settings 
} from 'lucide-react';

interface Activity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  projectId: string;
  token: string;
  limit?: number;
}

export function ActivityFeed({ projectId, token, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const { socket, state } = useSocket({ token, autoConnect: true });

  // Fetch initial activities
  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch(
          `/api/activity?projectId=${projectId}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [projectId, token, limit]);

  // Listen for real-time activities
  useEffect(() => {
    if (!socket) return;

    const handleActivity = (data: any) => {
      if (data.projectId === projectId) {
        const newActivity: Activity = {
          id: data.activityId,
          projectId: data.projectId,
          userId: data.userId,
          userName: data.userName,
          type: data.type,
          title: data.title,
          description: data.description,
          timestamp: data.timestamp,
          metadata: data.metadata,
        };

        setActivities(prev => [newActivity, ...prev].slice(0, limit));
      }
    };

    socket.on('project:activity', handleActivity);

    return () => {
      socket.off('project:activity', handleActivity);
    };
  }, [socket, projectId, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
        <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-600">No activity yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Team activities will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span className="font-medium">Recent Activity</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>{state.connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>

                {/* Metadata */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    {activity.metadata.issueCount !== undefined && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {activity.metadata.issueCount} issues
                      </span>
                    )}
                    {activity.metadata.file && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {activity.metadata.file}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type: string) {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'analysis_started':
      return <Play className={iconClass} />;
    case 'analysis_completed':
      return <CheckCircle className={iconClass} />;
    case 'comment_created':
      return <MessageCircle className={iconClass} />;
    case 'issue_resolved':
      return <AlertCircle className={iconClass} />;
    case 'member_joined':
      return <Users className={iconClass} />;
    case 'file_uploaded':
      return <FileUp className={iconClass} />;
    default:
      return <Settings className={iconClass} />;
  }
}

/**
 * Get background color for activity type
 */
function getActivityColor(type: string): string {
  switch (type) {
    case 'analysis_started':
      return 'bg-blue-100 text-blue-600';
    case 'analysis_completed':
      return 'bg-green-100 text-green-600';
    case 'comment_created':
      return 'bg-purple-100 text-purple-600';
    case 'issue_resolved':
      return 'bg-yellow-100 text-yellow-600';
    case 'member_joined':
      return 'bg-indigo-100 text-indigo-600';
    case 'file_uploaded':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
  });
}
