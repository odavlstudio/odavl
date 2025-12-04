'use client';

/**
 * ODAVL Studio - Notifications Bell Component
 * Displays notification bell with unread count and dropdown list
 */

import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Users,
  CreditCard,
  Lightbulb,
  Rocket,
  Settings,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { type Notification } from '@/lib/types/notifications';

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'insight_critical',
    title: 'Critical Issue Detected',
    message: 'Hardcoded API key found in auth/config.ts',
    priority: 'critical',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    actionUrl: '/dashboard/insight',
    actionLabel: 'View Issue',
    iconColor: 'text-red-600',
  },
  {
    id: '2',
    type: 'autopilot_success',
    title: 'Autopilot Run Complete',
    message: 'Successfully fixed 5 issues in E-Commerce API',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    actionUrl: '/dashboard/autopilot',
    actionLabel: 'View Run',
    iconColor: 'text-green-600',
  },
  {
    id: '3',
    type: 'guardian_failed',
    title: 'Guardian Test Failed',
    message: 'Performance score dropped to 48/100 on staging.example.com',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    actionUrl: '/dashboard/guardian',
    actionLabel: 'View Report',
    iconColor: 'text-orange-600',
  },
  {
    id: '4',
    type: 'team_member_added',
    title: 'New Team Member',
    message: 'alex@example.com joined your team as Member',
    priority: 'medium',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    actionUrl: '/dashboard/team',
    iconColor: 'text-blue-600',
  },
  {
    id: '5',
    type: 'subscription_expiring',
    title: 'Subscription Expiring',
    message: 'Your Pro plan expires in 7 days',
    priority: 'medium',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    actionUrl: '/dashboard/settings/billing',
    actionLabel: 'Renew Now',
    iconColor: 'text-purple-600',
  },
];

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NOTIFICATION_ICONS: Record<Notification['type'], React.ReactElement> = {
    insight_critical: <Lightbulb className="h-5 w-5" />,
    issue_detected: <Lightbulb className="h-5 w-5" />,
    autopilot_success: <Rocket className="h-5 w-5" />,
    fix_applied: <Rocket className="h-5 w-5" />,
    autopilot_failed: <XCircle className="h-5 w-5" />,
    guardian_passed: <ShieldCheck className="h-5 w-5" />,
    test_completed: <ShieldCheck className="h-5 w-5" />,
    guardian_failed: <AlertCircle className="h-5 w-5" />,
    team_invite: <Users className="h-5 w-5" />,
    team_member_added: <Users className="h-5 w-5" />,
    team_member_removed: <Users className="h-5 w-5" />,
    billing_issue: <CreditCard className="h-5 w-5" />,
    subscription_expiring: <CreditCard className="h-5 w-5" />,
    subscription_renewed: <CreditCard className="h-5 w-5" />,
    system: <Settings className="h-5 w-5" />,
  };

  const getNotificationIcon = (type: Notification['type']) => {
    return NOTIFICATION_ICONS[type] || <Bell className="h-5 w-5" />;
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unreadCount} unread
                  </p>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-center">
                    No notifications yet
                  </p>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            notification.priority === 'critical'
                              ? 'bg-red-100'
                              : notification.priority === 'high'
                              ? 'bg-orange-100'
                              : notification.priority === 'medium'
                              ? 'bg-blue-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          <div className={notification.iconColor || 'text-gray-600'}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>

                              {/* Action Button */}
                              {notification.actionUrl && (
                                <Link
                                  href={notification.actionUrl}
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    setIsOpen(false);
                                  }}
                                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                  <span>
                                    {notification.actionLabel || 'View Details'}
                                  </span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Delete"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Time */}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-1"
                >
                  <span>View all notifications</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
