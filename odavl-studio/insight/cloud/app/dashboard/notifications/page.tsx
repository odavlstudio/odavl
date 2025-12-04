/**
 * Notifications Page
 * Full-page notification history and management
 */

'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Check, Trash2, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const [token, setToken] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // WebSocket connection
  const { socket, state } = useSocket({
    token,
    autoConnect: !!token,
  });

  // Notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications({ socket });

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (filter === 'read' && !n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600">{state.connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === 'all' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === 'unread' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === 'read' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'You&apos;re all caught up!'
                  : 'Notifications will appear here when you receive them'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-5 border-l-4 ${
                  notification.type === 'error'
                    ? 'border-red-500'
                    : notification.type === 'warning'
                    ? 'border-yellow-500'
                    : notification.type === 'success'
                    ? 'border-green-500'
                    : 'border-blue-500'
                } ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Title and Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          notification.type === 'error'
                            ? 'bg-red-100 text-red-700'
                            : notification.type === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : notification.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {notification.type}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-gray-700 mb-2">{notification.message}</p>

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                      
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View details →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Mark Read Button */}
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
