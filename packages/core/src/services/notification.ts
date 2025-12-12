/**
 * Notification Service Stub
 * Original implementation used email, SMS, push notifications
 */

export interface NotificationData {
  userId: string;
  type: string;
  data: Record<string, any>;
}

export class NotificationService {
  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async sendInvitationEmail(email: string, inviterName: string, orgName: string, inviteUrl: string): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async sendSubscriptionEmail(userId: string, email: string, planName: string): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async sendErrorAlert(userId: string, email: string, errorDetails: Record<string, any>): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async sendNotification(notification: NotificationData): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async markAllAsRead(userId: string): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async getNotifications(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<any[]> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async getUnreadCount(userId: string): Promise<number> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    throw new Error('NotificationService not implemented in packages/core. Use app-specific notification service.');
  }
}

export const notificationService = new NotificationService();
