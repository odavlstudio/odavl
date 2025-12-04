/**
 * ODAVL Studio - Notification Types
 * Type definitions for the notifications system
 */

export type NotificationType =
  | 'issue_detected'
  | 'fix_applied'
  | 'test_completed'
  | 'team_invite'
  | 'billing_issue'
  | 'system'
  | 'autopilot_success'
  | 'autopilot_failed'
  | 'guardian_passed'
  | 'guardian_failed'
  | 'insight_critical'
  | 'team_member_added'
  | 'team_member_removed'
  | 'subscription_expiring'
  | 'subscription_renewed';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  icon?: string;
  iconColor?: string;
}

export interface NotificationPreferences {
  // In-App Notifications
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };

  // Email Notifications
  email: {
    enabled: boolean;
    criticalIssues: boolean;
    autopilotRuns: boolean;
    guardianTests: boolean;
    teamActivity: boolean;
    billing: boolean;
    weeklyDigest: boolean;
  };

  // Webhook Notifications
  webhooks: {
    enabled: boolean;
    slack: {
      enabled: boolean;
      webhookUrl?: string;
      channels: string[];
    };
    discord: {
      enabled: boolean;
      webhookUrl?: string;
    };
    teams: {
      enabled: boolean;
      webhookUrl?: string;
    };
    custom: {
      enabled: boolean;
      webhookUrl?: string;
      headers?: Record<string, string>;
    };
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}
