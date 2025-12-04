/**
 * Notification Service
 * Create and emit real-time notifications
 */

import { getSocketIO } from '@/lib/socket/server';
import type { NotificationPayload } from '@/lib/socket/events';
import { randomUUID } from 'crypto';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Notification Service Class
 */
export class NotificationService {
  /**
   * Create and emit a notification
   */
  static async create(options: CreateNotificationOptions): Promise<NotificationPayload> {
    const { userId, type, title, message, actionUrl, metadata } = options;

    const notification: NotificationPayload = {
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      actionUrl,
      metadata,
      timestamp: new Date().toISOString(),
    };

    // Emit to user's personal room
    try {
      const io = getSocketIO();
      io.to(`user:${userId}`).emit('notification:new', notification);
      
      console.log(`[Notification] Created for user ${userId}: ${title}`);
    } catch (error) {
      console.error('[Notification] Failed to emit:', error);
    }

    return notification;
  }

  /**
   * Send analysis complete notification
   */
  static async notifyAnalysisComplete(
    userId: string,
    projectId: string,
    analysisId: string,
    totalIssues: number,
    criticalIssues: number
  ): Promise<void> {
    const severity = criticalIssues > 0 ? 'error' : totalIssues > 10 ? 'warning' : 'success';
    
    await this.create({
      userId,
      type: severity,
      title: 'Analysis Complete',
      message: `Found ${totalIssues} issues (${criticalIssues} critical)`,
      actionUrl: `/dashboard/projects/${projectId}/analysis/${analysisId}`,
      metadata: {
        projectId,
        analysisId,
        totalIssues,
        criticalIssues,
      },
    });
  }

  /**
   * Send analysis error notification
   */
  static async notifyAnalysisError(
    userId: string,
    projectId: string,
    analysisId: string,
    error: string
  ): Promise<void> {
    await this.create({
      userId,
      type: 'error',
      title: 'Analysis Failed',
      message: `Analysis encountered an error: ${error}`,
      actionUrl: `/dashboard/projects/${projectId}`,
      metadata: {
        projectId,
        analysisId,
        error,
      },
    });
  }

  /**
   * Send critical issue notification
   */
  static async notifyCriticalIssue(
    userId: string,
    projectId: string,
    issueTitle: string,
    issueDescription: string
  ): Promise<void> {
    await this.create({
      userId,
      type: 'error',
      title: 'Critical Issue Detected',
      message: `${issueTitle}: ${issueDescription}`,
      actionUrl: `/dashboard/projects/${projectId}/issues`,
      metadata: {
        projectId,
        issueTitle,
        severity: 'critical',
      },
    });
  }

  /**
   * Send team mention notification
   */
  static async notifyMention(
    userId: string,
    mentionedBy: string,
    projectId: string,
    commentId: string,
    context: string
  ): Promise<void> {
    await this.create({
      userId,
      type: 'info',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you: "${context}"`,
      actionUrl: `/dashboard/projects/${projectId}/comments/${commentId}`,
      metadata: {
        projectId,
        commentId,
        mentionedBy,
      },
    });
  }

  /**
   * Send quota warning notification
   */
  static async notifyQuotaWarning(
    userId: string,
    usagePercent: number,
    quotaType: 'analyses' | 'storage' | 'api-calls'
  ): Promise<void> {
    await this.create({
      userId,
      type: 'warning',
      title: 'Quota Warning',
      message: `You've used ${usagePercent}% of your ${quotaType} quota`,
      actionUrl: '/dashboard/billing',
      metadata: {
        quotaType,
        usagePercent,
      },
    });
  }

  /**
   * Send system update notification
   */
  static async notifySystemUpdate(
    userId: string,
    updateTitle: string,
    updateDetails: string
  ): Promise<void> {
    await this.create({
      userId,
      type: 'info',
      title: updateTitle,
      message: updateDetails,
      actionUrl: '/changelog',
      metadata: {
        type: 'system-update',
      },
    });
  }

  /**
   * Broadcast notification to all users in a project
   */
  static async broadcastToProject(
    projectId: string,
    userIds: string[],
    notification: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<void> {
    const promises = userIds.map(userId =>
      this.create({ ...notification, userId })
    );
    
    await Promise.all(promises);
  }
}

/**
 * Helper functions for common notification scenarios
 */

export async function notifyAnalysisComplete(
  userId: string,
  projectId: string,
  analysisId: string,
  totalIssues: number,
  criticalIssues: number
): Promise<void> {
  await NotificationService.notifyAnalysisComplete(
    userId,
    projectId,
    analysisId,
    totalIssues,
    criticalIssues
  );
}

export async function notifyCriticalIssue(
  userId: string,
  projectId: string,
  issueTitle: string,
  issueDescription: string
): Promise<void> {
  await NotificationService.notifyCriticalIssue(
    userId,
    projectId,
    issueTitle,
    issueDescription
  );
}
