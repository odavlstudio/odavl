/**
 * @fileoverview Activity Feed - Real-time team activity stream
 * @module @odavl-studio/insight-core/collaboration/activity-feed
 * 
 * **Purpose**: Display real-time team activity and updates
 * 
 * **Features**:
 * - Activity stream (chronological feed)
 * - Activity types (comments, reviews, commits, issues)
 * - Real-time updates (WebSocket)
 * - Filtering (by user, type, date)
 * - Grouping (by time, user, project)
 * - Mentions tracking (@username)
 * - Activity search (find activities)
 * - Activity analytics (engagement metrics)
 * - Activity digest (daily/weekly summaries)
 * - Custom activity types (extensible)
 * 
 * **Activity Types**:
 * - COMMENT: User commented on issue/file
 * - REVIEW: User reviewed code
 * - COMMIT: User committed code
 * - ISSUE: Issue created/updated
 * - MENTION: User was mentioned
 * - APPROVAL: Review approved
 * - ASSIGNMENT: Issue assigned
 * 
 * **Architecture**:
 * ```
 * ActivityFeed
 *   ├── Activity Stream
 *   │   ├── Fetch activities
 *   │   ├── Real-time updates
 *   │   ├── Pagination
 *   │   └── Load more
 *   ├── Filtering
 *   │   ├── By user
 *   │   ├── By type
 *   │   ├── By date range
 *   │   └── By project
 *   ├── Grouping
 *   │   ├── By day
 *   │   ├── By week
 *   │   ├── By user
 *   │   └── By project
 *   └── Analytics
 *       ├── Engagement metrics
 *       ├── Activity trends
 *       ├── Top contributors
 *       └── Activity heatmap
 * ```
 * 
 * **Integration Points**:
 * - Used by: Web dashboard, VS Code extension
 * - Integrates with: Collaboration Hub, Code Review
 * - Backend: REST API, WebSocket (real-time)
 * - Storage: PostgreSQL (activities), Redis (cache)
 */

import { EventEmitter } from 'events';
import type { TeamMember } from './collaboration-hub';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Activity type
 */
export enum ActivityType {
  COMMENT = 'comment',
  REVIEW = 'review',
  COMMIT = 'commit',
  ISSUE = 'issue',
  MENTION = 'mention',
  APPROVAL = 'approval',
  ASSIGNMENT = 'assignment',
  MERGE = 'merge',
  BRANCH = 'branch',
  TAG = 'tag',
  RELEASE = 'release',
}

/**
 * Activity action
 */
export enum ActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ASSIGNED = 'assigned',
  MENTIONED = 'mentioned',
  MERGED = 'merged',
  COMMITTED = 'committed',
  PUSHED = 'pushed',
}

/**
 * Activity
 */
export interface Activity {
  /** Activity ID */
  id: string;

  /** Type */
  type: ActivityType;

  /** Action */
  action: ActivityAction;

  /** Actor */
  actor: TeamMember;

  /** Target */
  target: {
    type: 'issue' | 'review' | 'commit' | 'file' | 'user';
    id: string;
    name?: string;
    url?: string;
  };

  /** Content */
  content: {
    /** Title */
    title: string;
    
    /** Description */
    description?: string;
    
    /** Preview (for comments, commits, etc.) */
    preview?: string;
  };

  /** Metadata */
  metadata: {
    /** Project ID */
    projectId?: string;
    
    /** Branch name */
    branch?: string;
    
    /** Commit hash */
    commitHash?: string;
    
    /** File path */
    filePath?: string;
    
    /** Line number */
    line?: number;
    
    /** Mentions */
    mentions?: TeamMember[];
    
    /** Tags */
    tags?: string[];
  };

  /** Timestamp */
  timestamp: Date;

  /** Read status (per user) */
  readBy?: string[]; // User IDs
}

/**
 * Activity filter
 */
export interface ActivityFilter {
  /** Filter by user IDs */
  users?: string[];

  /** Filter by activity types */
  types?: ActivityType[];

  /** Filter by actions */
  actions?: ActivityAction[];

  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /** Filter by project */
  projectId?: string;

  /** Filter by mentions */
  mentionedUserId?: string;

  /** Show only unread */
  unreadOnly?: boolean;
}

/**
 * Activity group
 */
export interface ActivityGroup {
  /** Group key */
  key: string;

  /** Group label */
  label: string;

  /** Activities in group */
  activities: Activity[];

  /** Group metadata */
  metadata?: {
    date?: Date;
    user?: TeamMember;
    count?: number;
  };
}

/**
 * Activity digest
 */
export interface ActivityDigest {
  /** Digest ID */
  id: string;

  /** Period */
  period: {
    start: Date;
    end: Date;
  };

  /** Summary */
  summary: {
    totalActivities: number;
    uniqueUsers: number;
    topActivities: Activity[];
    activityByType: Record<ActivityType, number>;
    activityByUser: Array<{
      user: TeamMember;
      count: number;
    }>;
  };

  /** Highlights */
  highlights: Activity[];
}

/**
 * Activity analytics
 */
export interface ActivityAnalytics {
  /** Time period */
  period: {
    start: Date;
    end: Date;
  };

  /** Total activities */
  totalActivities: number;

  /** Activities per day */
  activitiesPerDay: Array<{
    date: Date;
    count: number;
  }>;

  /** Activities by type */
  byType: Record<ActivityType, number>;

  /** Top contributors */
  topContributors: Array<{
    user: TeamMember;
    activityCount: number;
    commentCount: number;
    reviewCount: number;
    commitCount: number;
  }>;

  /** Engagement score (0-100) */
  engagementScore: number;

  /** Activity trends */
  trends: {
    increasing: boolean;
    percentChange: number; // vs previous period
  };

  /** Heatmap data (hour x day) */
  heatmap: Array<{
    hour: number; // 0-23
    day: number; // 0-6 (Sun-Sat)
    count: number;
  }>;
}

/**
 * Activity feed configuration
 */
export interface ActivityFeedConfig {
  /** API base URL */
  apiBaseUrl: string;

  /** WebSocket URL */
  websocketUrl: string;

  /** Current user */
  currentUser?: TeamMember;

  /** Enable real-time updates */
  enableRealtime: boolean;

  /** Page size */
  pageSize: number;

  /** Auto-mark as read */
  autoMarkAsRead: boolean;

  /** Polling interval (ms) - fallback if WebSocket unavailable */
  pollingInterval: number;

  /** Cache activities */
  cacheActivities: boolean;

  /** Cache TTL (ms) */
  cacheTTL: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ActivityFeedConfig = {
  apiBaseUrl: 'https://api.odavl.com',
  websocketUrl: 'wss://api.odavl.com/ws',
  enableRealtime: true,
  pageSize: 50,
  autoMarkAsRead: false,
  pollingInterval: 30000, // 30 seconds
  cacheActivities: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
};

// ============================================================================
// ActivityFeed Class
// ============================================================================

/**
 * Activity Feed - Real-time team activity stream
 * 
 * **Usage**:
 * ```typescript
 * import { ActivityFeed, ActivityType } from '@odavl-studio/insight-core/collaboration/activity-feed';
 * 
 * const feed = new ActivityFeed({
 *   currentUser,
 *   enableRealtime: true,
 * });
 * 
 * // Fetch activities
 * const activities = await feed.getActivities({
 *   types: [ActivityType.COMMENT, ActivityType.REVIEW],
 *   dateRange: {
 *     start: new Date('2025-12-01'),
 *     end: new Date(),
 *   },
 * });
 * 
 * console.log(`Loaded ${activities.length} activities`);
 * 
 * activities.forEach(activity => {
 *   console.log(`${activity.actor.name} ${activity.action} ${activity.target.type}`);
 *   console.log(`  ${activity.content.title}`);
 *   console.log(`  ${activity.timestamp.toLocaleString()}`);
 * });
 * 
 * // Listen for real-time updates
 * feed.on('activity:new', (activity) => {
 *   console.log('New activity:', activity.content.title);
 *   // Update UI
 * });
 * 
 * // Group by day
 * const grouped = await feed.groupActivities(activities, 'day');
 * grouped.forEach(group => {
 *   console.log(`${group.label} (${group.activities.length} activities)`);
 * });
 * 
 * // Mark as read
 * await feed.markAsRead(activity.id);
 * 
 * // Get unread count
 * const unreadCount = await feed.getUnreadCount();
 * console.log(`${unreadCount} unread activities`);
 * ```
 * 
 * **Filtering**:
 * ```typescript
 * // By user
 * const userActivities = await feed.getActivities({
 *   users: ['user-1', 'user-2'],
 * });
 * 
 * // By type
 * const commits = await feed.getActivities({
 *   types: [ActivityType.COMMIT],
 * });
 * 
 * // Mentions only
 * const mentions = await feed.getActivities({
 *   mentionedUserId: currentUser.id,
 * });
 * 
 * // Unread only
 * const unread = await feed.getActivities({
 *   unreadOnly: true,
 * });
 * ```
 * 
 * **Analytics**:
 * ```typescript
 * // Get analytics
 * const analytics = await feed.getAnalytics({
 *   start: new Date('2025-12-01'),
 *   end: new Date(),
 * });
 * 
 * console.log(`Total activities: ${analytics.totalActivities}`);
 * console.log(`Top contributor: ${analytics.topContributors[0].user.name}`);
 * console.log(`Engagement score: ${analytics.engagementScore}/100`);
 * 
 * // Generate digest
 * const digest = await feed.generateDigest({
 *   start: new Date('2025-12-01'),
 *   end: new Date('2025-12-07'),
 * });
 * 
 * console.log('Weekly digest:');
 * console.log(`- ${digest.summary.totalActivities} total activities`);
 * console.log(`- ${digest.summary.uniqueUsers} active users`);
 * console.log(`- ${digest.highlights.length} highlights`);
 * ```
 */
export class ActivityFeed extends EventEmitter {
  private config: ActivityFeedConfig;
  private activities: Map<string, Activity> = new Map();
  private ws?: WebSocket;
  private pollingTimer?: NodeJS.Timeout;
  private cache: Map<string, { data: Activity[]; timestamp: number }> = new Map();

  constructor(config: Partial<ActivityFeedConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableRealtime) {
      this.connectWebSocket();
    } else {
      this.startPolling();
    }
  }

  // ==========================================================================
  // Public API - Activities
  // ==========================================================================

  /**
   * Get activities
   * 
   * @param filter - Activity filter
   * @param options - Pagination options
   * @returns Activities
   */
  async getActivities(
    filter: ActivityFilter = {},
    options: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<Activity[]> {
    // Check cache
    const cacheKey = this.getCacheKey(filter);
    const cached = this.cache.get(cacheKey);
    if (cached && this.config.cacheActivities) {
      const age = Date.now() - cached.timestamp;
      if (age < this.config.cacheTTL) {
        return cached.data;
      }
    }

    // Mock: Fetch from API
    // In real implementation, make HTTP request
    let activities = Array.from(this.activities.values());

    // Apply filters
    activities = this.applyFilters(activities, filter);

    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const page = options.page || 1;
    const pageSize = options.pageSize || this.config.pageSize;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = activities.slice(start, end);

    // Cache result
    if (this.config.cacheActivities) {
      this.cache.set(cacheKey, {
        data: paginated,
        timestamp: Date.now(),
      });
    }

    // Auto-mark as read
    if (this.config.autoMarkAsRead && this.config.currentUser) {
      for (const activity of paginated) {
        await this.markAsRead(activity.id);
      }
    }

    return paginated;
  }

  /**
   * Get single activity
   * 
   * @param activityId - Activity ID
   * @returns Activity
   */
  async getActivity(activityId: string): Promise<Activity> {
    const activity = this.activities.get(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }
    return activity;
  }

  /**
   * Add activity
   * 
   * @param activity - Activity
   */
  async addActivity(activity: Activity): Promise<void> {
    this.activities.set(activity.id, activity);

    // Clear cache
    this.clearCache();

    this.emit('activity:new', activity);

    // Notify mentioned users
    if (activity.metadata.mentions) {
      for (const mentioned of activity.metadata.mentions) {
        this.emit('activity:mention', { activity, mentioned });
      }
    }
  }

  /**
   * Mark activity as read
   * 
   * @param activityId - Activity ID
   */
  async markAsRead(activityId: string): Promise<void> {
    if (!this.config.currentUser) return;

    const activity = await this.getActivity(activityId);

    if (!activity.readBy) {
      activity.readBy = [];
    }

    if (!activity.readBy.includes(this.config.currentUser.id)) {
      activity.readBy.push(this.config.currentUser.id);
      this.activities.set(activityId, activity);
      this.emit('activity:read', { activity });
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<void> {
    if (!this.config.currentUser) return;

    for (const activity of this.activities.values()) {
      if (!activity.readBy) {
        activity.readBy = [];
      }
      if (!activity.readBy.includes(this.config.currentUser.id)) {
        activity.readBy.push(this.config.currentUser.id);
      }
    }

    this.emit('activities:all-read');
  }

  /**
   * Get unread count
   * 
   * @returns Unread count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.config.currentUser) return 0;

    let count = 0;
    for (const activity of this.activities.values()) {
      if (!activity.readBy || !activity.readBy.includes(this.config.currentUser.id)) {
        count++;
      }
    }

    return count;
  }

  // ==========================================================================
  // Public API - Grouping
  // ==========================================================================

  /**
   * Group activities
   * 
   * @param activities - Activities to group
   * @param groupBy - Grouping method
   * @returns Grouped activities
   */
  async groupActivities(
    activities: Activity[],
    groupBy: 'day' | 'week' | 'month' | 'user' | 'type'
  ): Promise<ActivityGroup[]> {
    const groups = new Map<string, ActivityGroup>();

    for (const activity of activities) {
      let key: string;
      let label: string;
      let metadata: ActivityGroup['metadata'];

      switch (groupBy) {
        case 'day': {
          const date = new Date(activity.timestamp);
          date.setHours(0, 0, 0, 0);
          key = date.toISOString();
          label = this.formatDate(date);
          metadata = { date };
          break;
        }
        case 'week': {
          const date = new Date(activity.timestamp);
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          label = `Week ${week}, ${date.getFullYear()}`;
          metadata = { date };
          break;
        }
        case 'month': {
          const date = new Date(activity.timestamp);
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          metadata = { date };
          break;
        }
        case 'user': {
          key = activity.actor.id;
          label = activity.actor.name;
          metadata = { user: activity.actor };
          break;
        }
        case 'type': {
          key = activity.type;
          label = this.formatActivityType(activity.type);
          break;
        }
        default:
          throw new Error(`Unknown groupBy: ${groupBy}`);
      }

      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          label,
          activities: [],
          metadata,
        };
        groups.set(key, group);
      }

      group.activities.push(activity);
    }

    // Sort groups
    const sorted = Array.from(groups.values());
    if (groupBy === 'day' || groupBy === 'week' || groupBy === 'month') {
      sorted.sort((a, b) => {
        const dateA = a.metadata?.date?.getTime() || 0;
        const dateB = b.metadata?.date?.getTime() || 0;
        return dateB - dateA; // Newest first
      });
    } else if (groupBy === 'user') {
      sorted.sort((a, b) => b.activities.length - a.activities.length);
    }

    // Add count to metadata
    for (const group of sorted) {
      if (!group.metadata) group.metadata = {};
      group.metadata.count = group.activities.length;
    }

    return sorted;
  }

  // ==========================================================================
  // Public API - Analytics
  // ==========================================================================

  /**
   * Get activity analytics
   * 
   * @param period - Time period
   * @returns Analytics
   */
  async getAnalytics(period: {
    start: Date;
    end: Date;
  }): Promise<ActivityAnalytics> {
    // Get activities in period
    const activities = await this.getActivities({
      dateRange: period,
    });

    // Calculate metrics
    const totalActivities = activities.length;

    // Activities per day
    const activitiesPerDay = this.calculateActivitiesPerDay(activities, period);

    // Activities by type
    const byType: Record<ActivityType, number> = {} as any;
    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    }

    // Top contributors
    const userStats = new Map<string, {
      user: TeamMember;
      activityCount: number;
      commentCount: number;
      reviewCount: number;
      commitCount: number;
    }>();

    for (const activity of activities) {
      let stats = userStats.get(activity.actor.id);
      if (!stats) {
        stats = {
          user: activity.actor,
          activityCount: 0,
          commentCount: 0,
          reviewCount: 0,
          commitCount: 0,
        };
        userStats.set(activity.actor.id, stats);
      }

      stats.activityCount++;
      if (activity.type === ActivityType.COMMENT) stats.commentCount++;
      if (activity.type === ActivityType.REVIEW) stats.reviewCount++;
      if (activity.type === ActivityType.COMMIT) stats.commitCount++;
    }

    const topContributors = Array.from(userStats.values())
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 10);

    // Engagement score (0-100)
    const engagementScore = this.calculateEngagementScore(activities, period);

    // Trends (compare to previous period)
    const periodDuration = period.end.getTime() - period.start.getTime();
    const previousPeriod = {
      start: new Date(period.start.getTime() - periodDuration),
      end: period.start,
    };
    const previousActivities = await this.getActivities({
      dateRange: previousPeriod,
    });
    const percentChange = previousActivities.length > 0
      ? ((totalActivities - previousActivities.length) / previousActivities.length) * 100
      : 0;

    const trends = {
      increasing: percentChange > 0,
      percentChange,
    };

    // Heatmap (hour x day)
    const heatmap = this.calculateHeatmap(activities);

    return {
      period,
      totalActivities,
      activitiesPerDay,
      byType,
      topContributors,
      engagementScore,
      trends,
      heatmap,
    };
  }

  /**
   * Generate activity digest
   * 
   * @param period - Time period
   * @returns Digest
   */
  async generateDigest(period: {
    start: Date;
    end: Date;
  }): Promise<ActivityDigest> {
    const activities = await this.getActivities({
      dateRange: period,
    });

    // Calculate summary
    const uniqueUsers = new Set(activities.map(a => a.actor.id)).size;

    const activityByType: Record<ActivityType, number> = {} as any;
    for (const activity of activities) {
      activityByType[activity.type] = (activityByType[activity.type] || 0) + 1;
    }

    const userCounts = new Map<string, { user: TeamMember; count: number }>();
    for (const activity of activities) {
      let entry = userCounts.get(activity.actor.id);
      if (!entry) {
        entry = { user: activity.actor, count: 0 };
        userCounts.set(activity.actor.id, entry);
      }
      entry.count++;
    }

    const activityByUser = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count);

    // Top activities (most engaging)
    const topActivities = activities
      .slice(0, 10)
      .sort((a, b) => {
        const aEngagement = (a.metadata.mentions?.length || 0) + (a.readBy?.length || 0);
        const bEngagement = (b.metadata.mentions?.length || 0) + (b.readBy?.length || 0);
        return bEngagement - aEngagement;
      });

    // Highlights
    const highlights = topActivities.slice(0, 5);

    return {
      id: this.generateId(),
      period,
      summary: {
        totalActivities: activities.length,
        uniqueUsers,
        topActivities,
        activityByType,
        activityByUser,
      },
      highlights,
    };
  }

  // ==========================================================================
  // Private Methods - Filtering
  // ==========================================================================

  /**
   * Apply filters
   */
  private applyFilters(activities: Activity[], filter: ActivityFilter): Activity[] {
    let filtered = activities;

    if (filter.users && filter.users.length > 0) {
      filtered = filtered.filter(a => filter.users!.includes(a.actor.id));
    }

    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(a => filter.types!.includes(a.type));
    }

    if (filter.actions && filter.actions.length > 0) {
      filtered = filtered.filter(a => filter.actions!.includes(a.action));
    }

    if (filter.dateRange) {
      filtered = filtered.filter(a =>
        a.timestamp >= filter.dateRange!.start &&
        a.timestamp <= filter.dateRange!.end
      );
    }

    if (filter.projectId) {
      filtered = filtered.filter(a => a.metadata.projectId === filter.projectId);
    }

    if (filter.mentionedUserId) {
      filtered = filtered.filter(a =>
        a.metadata.mentions?.some(m => m.id === filter.mentionedUserId)
      );
    }

    if (filter.unreadOnly && this.config.currentUser) {
      filtered = filtered.filter(a =>
        !a.readBy || !a.readBy.includes(this.config.currentUser!.id)
      );
    }

    return filtered;
  }

  // ==========================================================================
  // Private Methods - WebSocket
  // ==========================================================================

  /**
   * Connect WebSocket
   */
  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(this.config.websocketUrl);

      this.ws.onopen = () => {
        this.emit('websocket:connected');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.ws.onerror = (error) => {
        this.emit('websocket:error', { error });
        // Fallback to polling
        this.startPolling();
      };

      this.ws.onclose = () => {
        this.emit('websocket:disconnected');
        // Reconnect after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
      };
    } catch (error) {
      // Mock: WebSocket not available
      // Use polling as fallback
      this.startPolling();
    }
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(data: any): void {
    if (data.type === 'activity') {
      this.addActivity(data.activity);
    }
  }

  /**
   * Start polling
   */
  private startPolling(): void {
    if (this.pollingTimer) return;

    this.pollingTimer = setInterval(async () => {
      try {
        // Mock: Poll for new activities
        this.emit('activities:polled');
      } catch (error) {
        this.emit('polling:error', { error });
      }
    }, this.config.pollingInterval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
  }

  // ==========================================================================
  // Private Methods - Analytics
  // ==========================================================================

  /**
   * Calculate activities per day
   */
  private calculateActivitiesPerDay(
    activities: Activity[],
    period: { start: Date; end: Date }
  ): Array<{ date: Date; count: number }> {
    const counts = new Map<string, number>();

    for (const activity of activities) {
      const date = new Date(activity.timestamp);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString();
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const result: Array<{ date: Date; count: number }> = [];
    const current = new Date(period.start);
    current.setHours(0, 0, 0, 0);

    while (current <= period.end) {
      const key = current.toISOString();
      result.push({
        date: new Date(current),
        count: counts.get(key) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(
    activities: Activity[],
    period: { start: Date; end: Date }
  ): number {
    if (activities.length === 0) return 0;

    // Factors: activity count, unique users, comments, mentions
    const days = (period.end.getTime() - period.start.getTime()) / (24 * 60 * 60 * 1000);
    const avgActivitiesPerDay = activities.length / days;
    const uniqueUsers = new Set(activities.map(a => a.actor.id)).size;
    const comments = activities.filter(a => a.type === ActivityType.COMMENT).length;
    const mentions = activities.filter(a => a.metadata.mentions && a.metadata.mentions.length > 0).length;

    // Normalize and weight
    const score = Math.min(
      (avgActivitiesPerDay / 10) * 30 + // 30% weight
      (uniqueUsers / 5) * 25 +           // 25% weight
      (comments / activities.length) * 25 + // 25% weight
      (mentions / activities.length) * 20,  // 20% weight
      100
    );

    return Math.round(score);
  }

  /**
   * Calculate activity heatmap
   */
  private calculateHeatmap(activities: Activity[]): Array<{
    hour: number;
    day: number;
    count: number;
  }> {
    const counts = new Map<string, number>();

    for (const activity of activities) {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${hour}-${day}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const heatmap: Array<{ hour: number; day: number; count: number }> = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${hour}-${day}`;
        heatmap.push({
          hour,
          day,
          count: counts.get(key) || 0,
        });
      }
    }

    return heatmap;
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Get cache key
   */
  private getCacheKey(filter: ActivityFilter): string {
    return JSON.stringify(filter);
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('default', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  /**
   * Format activity type
   */
  private formatActivityType(type: ActivityType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.stopPolling();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create activity feed
 * 
 * @param config - Configuration
 * @returns ActivityFeed instance
 */
export function createActivityFeed(
  config?: Partial<ActivityFeedConfig>
): ActivityFeed {
  return new ActivityFeed(config);
}
