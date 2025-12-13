/**
 * Activity Feed Service
 * Track and broadcast team activities
 */

import { getSocketIO } from '@/lib/socket/server';
import { randomUUID } from 'crypto';

export type ActivityType =
  | 'analysis_started'
  | 'analysis_completed'
  | 'comment_created'
  | 'issue_resolved'
  | 'project_updated'
  | 'member_joined'
  | 'file_uploaded';

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * In-memory activity store
 * In production, use database with pagination
 */
const activityStore = new Map<string, Activity>();
const projectActivityIndex = new Map<string, string[]>();

/**
 * Activity Feed Service
 */
export class ActivityService {
  /**
   * Create a new activity
   */
  static async createActivity(
    projectId: string,
    userId: string,
    userName: string,
    type: ActivityType,
    title: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<Activity> {
    const activityId = randomUUID();

    const activity: Activity = {
      id: activityId,
      projectId,
      userId,
      userName,
      type,
      title,
      description,
      metadata,
      timestamp: new Date().toISOString(),
    };

    // Store activity
    activityStore.set(activityId, activity);

    // Index by project
    if (!projectActivityIndex.has(projectId)) {
      projectActivityIndex.set(projectId, []);
    }
    projectActivityIndex.get(projectId)!.unshift(activityId);

    // Keep only last 100 activities per project
    const projectActivities = projectActivityIndex.get(projectId)!;
    if (projectActivities.length > 100) {
      const removed = projectActivities.slice(100);
      removed.forEach(id => activityStore.delete(id));
      projectActivityIndex.set(projectId, projectActivities.slice(0, 100));
    }

    // Broadcast to project room
    this.broadcastActivity(activity);

    return activity;
  }

  /**
   * Get activities for a project
   */
  static getProjectActivities(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: ActivityType;
    }
  ): Activity[] {
    const activityIds = projectActivityIndex.get(projectId) || [];
    let activities: Activity[] = [];

    for (const id of activityIds) {
      const activity = activityStore.get(id);
      if (activity) {
        activities.push(activity);
      }
    }

    // Filter by type
    if (options?.type) {
      activities = activities.filter(a => a.type === options.type);
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    
    return activities.slice(offset, offset + limit);
  }

  /**
   * Broadcast activity to project room
   */
  private static broadcastActivity(activity: Activity): void {
    try {
      const io = getSocketIO();
      
      // Emit to project room
      io.to(`project:${activity.projectId}`).emit('project:activity', {
        activityId: activity.id,
        projectId: activity.projectId,
        userId: activity.userId,
        userName: activity.userName,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata,
        timestamp: activity.timestamp,
      });

      console.log(`[Activity] Broadcasted ${activity.type} for project ${activity.projectId}`);
    } catch (error) {
      console.error('[Activity] Failed to broadcast:', error);
    }
  }

  /**
   * Helper: Track analysis started
   */
  static async trackAnalysisStarted(
    projectId: string,
    userId: string,
    userName: string,
    analysisId: string
  ): Promise<void> {
    await this.createActivity(
      projectId,
      userId,
      userName,
      'analysis_started',
      'Analysis Started',
      `${userName} started a new analysis`,
      { analysisId }
    );
  }

  /**
   * Helper: Track analysis completed
   */
  static async trackAnalysisCompleted(
    projectId: string,
    userId: string,
    userName: string,
    analysisId: string,
    issueCount: number
  ): Promise<void> {
    await this.createActivity(
      projectId,
      userId,
      userName,
      'analysis_completed',
      'Analysis Completed',
      `${userName} completed analysis - found ${issueCount} issues`,
      { analysisId, issueCount }
    );
  }

  /**
   * Helper: Track comment created
   */
  static async trackCommentCreated(
    projectId: string,
    userId: string,
    userName: string,
    commentId: string,
    file?: string
  ): Promise<void> {
    const location = file ? ` on ${file}` : '';
    await this.createActivity(
      projectId,
      userId,
      userName,
      'comment_created',
      'New Comment',
      `${userName} commented${location}`,
      { commentId, file }
    );
  }

  /**
   * Helper: Track issue resolved
   */
  static async trackIssueResolved(
    projectId: string,
    userId: string,
    userName: string,
    issueId: string,
    issueTitle: string
  ): Promise<void> {
    await this.createActivity(
      projectId,
      userId,
      userName,
      'issue_resolved',
      'Issue Resolved',
      `${userName} resolved: ${issueTitle}`,
      { issueId }
    );
  }

  /**
   * Helper: Track member joined
   */
  static async trackMemberJoined(
    projectId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    await this.createActivity(
      projectId,
      userId,
      userName,
      'member_joined',
      'New Member',
      `${userName} joined the project`,
      {}
    );
  }
}
