/**
 * Real-time Demo Page
 * Test WebSocket functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';
import { useNotifications } from '@/hooks/useNotifications';
import { usePresence } from '@/hooks/usePresence';

export default function RealtimeDemoPage() {
  const [token, setToken] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('demo-project-123');

  // Get token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // WebSocket connection
  const { socket, state, connect, disconnect } = useSocket({
    token,
    autoConnect: !!token,
    onConnect: () => console.log('✅ Connected to WebSocket'),
    onDisconnect: (reason) => console.log('❌ Disconnected:', reason),
    onError: (error) => console.error('⚠️ Error:', error),
  });

  // Real-time analysis
  const analysis = useRealTimeAnalysis({
    socket,
    projectId,
    onComplete: (data) => console.log('✅ Analysis complete:', data),
    onError: (error) => console.error('❌ Analysis error:', error),
  });

  // Notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ socket });

  // User presence
  const {
    onlineUsers,
    onlineCount,
    updatePresence,
  } = usePresence({ socket, projectId });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-time Demo</h1>
          <p className="text-gray-600 mt-2">Test WebSocket functionality</p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  state.connected
                    ? 'bg-green-500'
                    : state.connecting
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-gray-700">
                {state.connected
                  ? 'Connected'
                  : state.connecting
                  ? 'Connecting...'
                  : 'Disconnected'}
              </span>
            </div>

            {state.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {state.error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={connect}
                disabled={state.connected || state.connecting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
              <button
                onClick={disconnect}
                disabled={!state.connected}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Progress</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium">{analysis.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium capitalize">{analysis.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Issues Found:</span>
                <span className="ml-2 font-medium">{analysis.issuesFound}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Detector:</span>
                <span className="ml-2 font-medium">{analysis.currentDetector || 'None'}</span>
              </div>
              <div>
                <span className="text-gray-600">Time Remaining:</span>
                <span className="ml-2 font-medium">
                  {analysis.estimatedTimeRemaining
                    ? `${analysis.estimatedTimeRemaining}s`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {analysis.detectors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Detectors</h3>
                <div className="space-y-2">
                  {analysis.detectors.map(detector => (
                    <div key={detector.name} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          detector.status === 'complete'
                            ? 'bg-green-500'
                            : detector.status === 'running'
                            ? 'bg-blue-500 animate-pulse'
                            : detector.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <span className="flex-1">{detector.name}</span>
                      <span className="text-gray-600">{detector.progress}%</span>
                      <span className="text-gray-600">{detector.issuesFound} issues</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.status === 'running' && (
              <button
                onClick={analysis.cancelAnalysis}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Analysis
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded border ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          notification.type === 'error' ? 'bg-red-100 text-red-700' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          notification.type === 'success' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {notification.type}
                        </span>
                        <span className="font-medium">{notification.title}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Presence */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Online Users ({onlineCount})
          </h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => updatePresence('online')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                Online
              </button>
              <button
                onClick={() => updatePresence('away')}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
              >
                Away
              </button>
              <button
                onClick={() => updatePresence('offline')}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Offline
              </button>
            </div>

            <div className="space-y-2">
              {onlineUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users online</p>
              ) : (
                onlineUsers.map(user => (
                  <div key={user.userId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
