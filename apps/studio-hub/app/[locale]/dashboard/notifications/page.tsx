'use client';

/**
 * ODAVL Studio - Notifications Page
 * Full notifications inbox with filtering and management
 */

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
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
  Clock,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { type Notification, type NotificationType, type NotificationPriority } from '@/lib/types/notifications';

// Extended mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'insight_critical',
    title: 'Critical Security Issue Detected',
    message: 'Hardcoded API key found in auth/config.ts:15. This could expose sensitive credentials.',
    priority: 'critical',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    actionUrl: '/dashboard/insight',
    actionLabel: 'View & Fix Issue',
    iconColor: 'text-red-600',
  },
  {
    id: '2',
    type: 'autopilot_success',
    title: 'Autopilot Run Completed Successfully',
    message: 'Fixed 5 issues in E-Commerce API: 3 type errors, 2 unused imports',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    actionUrl: '/dashboard/autopilot',
    actionLabel: 'View Run Details',
    iconColor: 'text-green-600',
  },
  {
    id: '3',
    type: 'guardian_failed',
    title: 'Guardian Test Failed',
    message: 'Performance score dropped to 48/100 on staging.example.com. LCP increased to 4.5s.',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actionUrl: '/dashboard/guardian',
    actionLabel: 'View Test Report',
    iconColor: 'text-orange-600',
  },
  {
    id: '4',
    type: 'team_member_added',
    title: 'New Team Member Joined',
    message: 'alex@example.com accepted the invitation and joined as Member',
    priority: 'medium',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard/team',
    iconColor: 'text-blue-600',
  },
  {
    id: '5',
    type: 'subscription_expiring',
    title: 'Subscription Expiring Soon',
    message: 'Your Pro plan expires in 7 days. Renew now to avoid service interruption.',
    priority: 'medium',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard/settings/billing',
    actionLabel: 'Renew Subscription',
    iconColor: 'text-purple-600',
  },
  {
    id: '6',
    type: 'fix_applied',
    title: 'Issue Auto-Fixed',
    message: 'Removed unused variable "tempData" from utils/helpers.ts',
    priority: 'low',
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard/insight',
    iconColor: 'text-green-600',
  },
  {
    id: '7',
    type: 'guardian_passed',
    title: 'All Tests Passed',
    message: 'app.example.com scored 94/100 with excellent accessibility and performance',
    priority: 'low',
    read: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard/guardian',
    iconColor: 'text-green-600',
  },
  {
    id: '8',
    type: 'system',
    title: 'New Feature Available',
    message: 'ODAVL Insight now supports Python type hint validation. Try it now!',
    priority: 'low',
    read: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard/insight',
    iconColor: 'text-blue-600',
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch =
      searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesPriority = filterPriority === 'all' || n.priority === filterPriority;
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'read' && n.read) ||
      (filterRead === 'unread' && !n.read);

    return matchesSearch && matchesType && matchesPriority && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  // Notification icon lookup map - replaces switch statement (complexity 16 → 1)
  const notificationIconMap: Record<NotificationType, React.ReactElement> = {
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

  const getNotificationIcon = (type: NotificationType) => {
    return notificationIconMap[type] || <Bell className="h-5 w-5" />;
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            onClick={deleteAllRead}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center space-x-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear read</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as NotificationType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            <option value="insight_critical">Insight</option>
            <option value="autopilot_success">Autopilot</option>
            <option value="guardian_failed">Guardian</option>
            <option value="team_member_added">Team</option>
            <option value="subscription_expiring">Billing</option>
            <option value="system">System</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as NotificationPriority | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Read Status Filter */}
          <select
            value={filterRead}
            onChange={e => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">No notifications found</p>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {searchQuery || filterType !== 'all' || filterPriority !== 'all' || filterRead !== 'all'
                ? 'Try adjusting your filters to see more notifications'
                : "You're all caught up! We'll notify you when something important happens"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`px-6 py-5 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
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
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{notification.title}</h3>

                      {/* Priority Badge */}
                      <span
                        className={`ml-3 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          notification.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : notification.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : notification.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notification.priority}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Time */}
                        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </div>

                        {/* Action Button */}
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            onClick={() => markAsRead(notification.id)}
                            className="inline-flex items-center space-x-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <span>{notification.actionLabel || 'View Details'}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {filteredNotifications.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Unread</p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.priority === 'critical').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">High Priority</p>
            <p className="text-2xl font-bold text-orange-600">
              {notifications.filter(n => n.priority === 'high').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
