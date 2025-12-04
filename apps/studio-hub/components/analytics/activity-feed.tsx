'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Bug, Rocket, ShieldCheck, User } from 'lucide-react';
import { http } from '@/lib/utils/fetch';

interface Activity {
  id: string;
  type: 'insight' | 'autopilot' | 'guardian';
  message: string;
  user: string;
  timestamp: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get('/api/analytics/activity')
      .then((res) => {
        setActivities(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch activities:', error);
        setLoading(false);
      });

    // Poll for new activities every 30 seconds
    const interval = setInterval(() => {
      http.get('/api/analytics/activity')
        .then((res) => setActivities(res.data))
        .catch((error) => console.error('Failed to poll activities:', error));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'insight':
        return <Bug className="h-5 w-5 text-red-500" />;
      case 'autopilot':
        return <Rocket className="h-5 w-5 text-blue-500" />;
      case 'guardian':
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start">
                <div className="mt-1">{getIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center text-gray-500 py-8">No recent activity</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
