/**
 * Notification Service
 * Handles in-app notifications, email notifications, and webhooks
 */

import { emailService } from './email';
import type {
  WelcomeEmailData,
  InvitationEmailData,
  SubscriptionEmailData,
  ErrorAlertEmailData,
  UsageLimitEmailData,
} from './email';

export interface NotificationPreference {
  userId: string;
  emailEnabled: boolean;
  emailInvitations: boolean;
  emailErrorAlerts: boolean;
  emailUsageLimits: boolean;
  emailBilling: boolean;
  emailWeeklySummary: boolean;
  inAppEnabled: boolean;
  inAppInvitations: boolean;
  inAppErrorAlerts: boolean;
  inAppUsageLimits: boolean;
  inAppBilling: boolean;
  webhookEnabled: boolean;
  webhookUrl?: string;
  webhookEvents: string[];
  errorAlertThreshold: number;
  usageLimitThreshold: number;
}

export interface CreateNotificationData {
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  actionText?: string;
}

class NotificationService {
  /**
   * Send welcome notification
   */
  async sendWelcomeNotification(
    userId: string,
    email: string,
    data: WelcomeEmailData
  ): Promise<void> {
    // Check preferences
    const preferences = await this.getPreferences(userId);

    // Send email
    if (preferences.emailEnabled) {
      await emailService.sendWelcomeEmail(email, data);
      await this.logEmail(email, 'WELCOME', userId);
    }

    // Create in-app notification
    if (preferences.inAppEnabled) {
      await this.createNotification({
        userId,
        type: 'MEMBER_JOINED',
        title: `Welcome to ${data.organizationName}!`,
        message: 'You now have access to ODAVL Studio tools.',
        actionUrl: data.loginUrl,
        actionText: 'Go to Dashboard',
      });
    }
  }

  /**
   * Send invitation notification
   */
  async sendInvitationNotification(
    email: string,
    data: InvitationEmailData
  ): Promise<void> {
    // Always send email for invitations (no user ID yet)
    await emailService.sendInvitationEmail(email, data);
    await this.logEmail(email, 'INVITATION');
  }

  /**
   * Send subscription notification
   */
  async sendSubscriptionNotification(
    userId: string,
    email: string,
    data: SubscriptionEmailData
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    // Send email
    if (preferences.emailEnabled && preferences.emailBilling) {
      await emailService.sendSubscriptionConfirmation(email, data);
      await this.logEmail(email, 'SUBSCRIPTION', userId);
    }

    // Create in-app notification
    if (preferences.inAppEnabled && preferences.inAppBilling) {
      await this.createNotification({
        userId,
        type: 'SUBSCRIPTION_CHANGED',
        title: 'Subscription Confirmed',
        message: `Your ${data.plan} subscription is now active.`,
        actionUrl: data.manageBillingUrl,
        actionText: 'Manage Subscription',
      });
    }
  }

  /**
   * Send error alert notification
   */
  async sendErrorAlertNotification(
    userIds: string[],
    organizationId: string,
    data: ErrorAlertEmailData
  ): Promise<void> {
    for (const userId of userIds) {
      const preferences = await this.getPreferences(userId);

      // Check threshold
      if (data.errorCount < preferences.errorAlertThreshold) {
        continue;
      }

      // Get user email
      const user = await this.getUserEmail(userId);
      if (!user) continue;

      // Send email
      if (preferences.emailEnabled && preferences.emailErrorAlerts) {
        await emailService.sendErrorAlert(user.email, data);
        await this.logEmail(user.email, 'ERROR_ALERT', userId, organizationId);
      }

      // Create in-app notification
      if (preferences.inAppEnabled && preferences.inAppErrorAlerts) {
        await this.createNotification({
          userId,
          organizationId,
          type: 'ERROR_ALERT',
          title: `⚠️ ${data.errorCount} errors detected`,
          message: `${data.criticalCount} critical errors in ${data.projectName}`,
          actionUrl: data.dashboardUrl,
          actionText: 'View Details',
        });
      }
    }
  }

  /**
   * Send usage limit notification
   */
  async sendUsageLimitNotification(
    userId: string,
    organizationId: string,
    data: UsageLimitEmailData
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    // Check threshold
    if (data.percentage < preferences.usageLimitThreshold) {
      return;
    }

    // Get user email
    const user = await this.getUserEmail(userId);
    if (!user) return;

    // Send email
    if (preferences.emailEnabled && preferences.emailUsageLimits) {
      await emailService.sendUsageLimitWarning(user.email, data);
      await this.logEmail(user.email, 'USAGE_LIMIT', userId, organizationId);
    }

    // Create in-app notification
    if (preferences.inAppEnabled && preferences.inAppUsageLimits) {
      await this.createNotification({
        userId,
        organizationId,
        type: 'USAGE_LIMIT',
        title: `⚠️ ${data.percentage}% of ${data.limitType} used`,
        message: `${data.currentUsage.toLocaleString()} of ${data.limit.toLocaleString()}`,
        actionUrl: data.upgradeUrl,
        actionText: 'Upgrade Plan',
      });
    }
  }

  /**
   * Get user preferences
   */
  private async getPreferences(userId: string): Promise<NotificationPreference> {
    // TODO: Implement with Prisma
    // For now, return defaults
    return {
      userId,
      emailEnabled: true,
      emailInvitations: true,
      emailErrorAlerts: true,
      emailUsageLimits: true,
      emailBilling: true,
      emailWeeklySummary: true,
      inAppEnabled: true,
      inAppInvitations: true,
      inAppErrorAlerts: true,
      inAppUsageLimits: true,
      inAppBilling: true,
      webhookEnabled: false,
      webhookUrl: undefined,
      webhookEvents: [],
      errorAlertThreshold: 10,
      usageLimitThreshold: 80,
    };
  }

  /**
   * Get user email
   */
  private async getUserEmail(userId: string): Promise<{ email: string } | null> {
    // TODO: Implement with Prisma
    return null;
  }

  /**
   * Create in-app notification
   */
  private async createNotification(data: CreateNotificationData): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Creating notification:', data);
  }

  /**
   * Log email sent
   */
  private async logEmail(
    to: string,
    type: string,
    userId?: string,
    organizationId?: string
  ): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Email logged:', { to, type, userId, organizationId });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Updating preferences:', { userId, preferences });
  }

  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<any[]> {
    // TODO: Implement with Prisma
    return [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Marking as read:', { notificationId, userId });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Marking all as read:', { userId });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Deleting notification:', { notificationId, userId });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    // TODO: Implement with Prisma
    return 0;
  }
}

export const notificationService = new NotificationService();
