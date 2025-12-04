/**
 * useNotifications Hook
 * Real-time notifications management
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { TypedSocket } from '@/lib/socket/client';
import type { NotificationPayload } from '@/lib/socket/events';

export interface Notification extends NotificationPayload {
  read: boolean;
}

interface UseNotificationsOptions {
  socket: TypedSocket | null;
  userId?: string;
  maxNotifications?: number;
}

/**
 * Hook for managing real-time notifications
 */
export function useNotifications(options: UseNotificationsOptions) {
  const { socket, userId, maxNotifications = 50 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: NotificationPayload) => {
      // Only show notifications for current user
      if (userId && data.userId !== userId) return;

      setNotifications(prev => {
        const newNotification: Notification = { ...data, read: false };
        const updated = [newNotification, ...prev];
        
        // Keep only maxNotifications
        return updated.slice(0, maxNotifications);
      });

      // Increment unread count
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, userId, maxNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      // Emit read event to server
      if (socket && userId) {
        socket.emit('notification:read', notificationId);
      }
    },
    [socket, userId]
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Get unread notifications
  const unreadNotifications = notifications.filter(n => !n.read);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
