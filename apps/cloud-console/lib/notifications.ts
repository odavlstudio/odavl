/**
 * Unified Notification Engine
 * Handles all system notifications with WebSocket support
 */

import { prisma } from '@/lib/prisma';
import { Server as SocketServer } from '@/lib/socket-server-stub';

export enum NotificationType {
  INSIGHT_COMPLETED = 'insight_completed',
  GUARDIAN_COMPLETED = 'guardian_completed',
  AUTOPILOT_COMPLETED = 'autopilot_completed',
  BILLING_LIMIT_REACHED = 'billing_limit_reached',
  USAGE_WARNING = 'usage_warning',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

class NotificationEngine {
  private io: SocketServer | null = null;

  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  async send(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // TODO: Implement Notification model in Prisma schema
    const notification = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      title,
      message,
      metadata: metadata || {},
      read: false,
      createdAt: new Date(),
    };
    
    console.log('NOTIFICATION:', notification);

    // Send via WebSocket if connected
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification', notification);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    // TODO: Implement Notification model in Prisma schema
    console.log('NOTIFICATION: Mark as read', notificationId);
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    // TODO: Implement Notification model in Prisma schema
    console.log('NOTIFICATION: Get notifications for user', userId, 'limit', limit);
    return [];
  }
}

export const notificationEngine = new NotificationEngine();
