/**
 * @fileoverview Collaboration Hub - Team collaboration features
 * @module @odavl-studio/insight-core/collaboration/collaboration-hub
 * 
 * **Purpose**: Enable team collaboration on code quality
 * 
 * **Features**:
 * - Team workspaces (shared projects)
 * - Issue assignment (assign to team members)
 * - Comments & discussions (threaded conversations)
 * - Mentions & notifications (@username)
 * - Code annotations (inline comments)
 * - Task management (todo lists)
 * - Team analytics (team performance)
 * - Access control (roles & permissions)
 * - Shared dashboards (team views)
 * - Activity streams (team activity)
 * 
 * **Team Roles**:
 * - Owner: Full control
 * - Admin: Manage team & settings
 * - Member: View & comment
 * - Viewer: Read-only access
 * 
 * **Architecture**:
 * ```
 * CollaborationHub
 *   ├── Team Management
 *   │   ├── Create team
 *   │   ├── Invite members
 *   │   ├── Manage roles
 *   │   └── Remove members
 *   ├── Issue Collaboration
 *   │   ├── Assign issues
 *   │   ├── Add comments
 *   │   ├── @mentions
 *   │   └── Status updates
 *   ├── Code Review
 *   │   ├── Review requests
 *   │   ├── Inline comments
 *   │   ├── Approval workflow
 *   │   └── Change tracking
 *   └── Notifications
 *       ├── Real-time alerts
 *       ├── Email digests
 *       ├── In-app notifications
 *       └── Slack/Teams integration
 * ```
 * 
 * **Integration Points**:
 * - Used by: Web dashboard, VS Code extension
 * - Backend: REST API, WebSocket (real-time)
 * - Storage: PostgreSQL (teams, comments), Redis (notifications)
 */

import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Team role
 */
export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Permission
 */
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  INVITE = 'invite',
  MANAGE_ROLES = 'manage-roles',
}

/**
 * Notification type
 */
export enum NotificationType {
  MENTION = 'mention',
  ASSIGNMENT = 'assignment',
  COMMENT = 'comment',
  REVIEW_REQUEST = 'review-request',
  APPROVAL = 'approval',
  STATUS_CHANGE = 'status-change',
}

/**
 * Team member
 */
export interface TeamMember {
  /** User ID */
  id: string;

  /** Name */
  name: string;

  /** Email */
  email: string;

  /** Avatar URL */
  avatar?: string;

  /** Role */
  role: TeamRole;

  /** Joined at */
  joinedAt: Date;

  /** Last active */
  lastActive?: Date;

  /** Status */
  status: 'active' | 'inactive' | 'invited';
}

/**
 * Team
 */
export interface Team {
  /** Team ID */
  id: string;

  /** Name */
  name: string;

  /** Description */
  description?: string;

  /** Owner */
  owner: TeamMember;

  /** Members */
  members: TeamMember[];

  /** Created at */
  createdAt: Date;

  /** Settings */
  settings: {
    /** Default role for new members */
    defaultRole: TeamRole;

    /** Allow member invites */
    allowMemberInvites: boolean;

    /** Enable notifications */
    enableNotifications: boolean;

    /** Notification channels */
    notificationChannels: ('email' | 'slack' | 'teams')[];
  };
}

/**
 * Comment
 */
export interface Comment {
  /** Comment ID */
  id: string;

  /** Issue ID or file path */
  target: {
    type: 'issue' | 'file' | 'line';
    id: string;
    line?: number;
  };

  /** Author */
  author: TeamMember;

  /** Content (markdown) */
  content: string;

  /** Mentions */
  mentions: TeamMember[];

  /** Parent comment (for threads) */
  parentId?: string;

  /** Replies */
  replies?: Comment[];

  /** Reactions */
  reactions: Array<{
    emoji: string;
    users: TeamMember[];
  }>;

  /** Created at */
  createdAt: Date;

  /** Updated at */
  updatedAt?: Date;

  /** Resolved */
  resolved: boolean;

  /** Resolved by */
  resolvedBy?: TeamMember;

  /** Resolved at */
  resolvedAt?: Date;
}

/**
 * Issue assignment
 */
export interface IssueAssignment {
  /** Assignment ID */
  id: string;

  /** Issue ID */
  issueId: string;

  /** Assignee */
  assignee: TeamMember;

  /** Assigned by */
  assignedBy: TeamMember;

  /** Assigned at */
  assignedAt: Date;

  /** Due date */
  dueDate?: Date;

  /** Priority */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /** Status */
  status: 'open' | 'in-progress' | 'resolved' | 'closed';

  /** Notes */
  notes?: string;
}

/**
 * Review request
 */
export interface ReviewRequest {
  /** Request ID */
  id: string;

  /** File path */
  file: string;

  /** Requested by */
  requestedBy: TeamMember;

  /** Reviewers */
  reviewers: TeamMember[];

  /** Status */
  status: 'pending' | 'approved' | 'changes-requested' | 'rejected';

  /** Comments */
  comments: Comment[];

  /** Approvals */
  approvals: Array<{
    reviewer: TeamMember;
    approved: boolean;
    comment?: string;
    timestamp: Date;
  }>;

  /** Created at */
  createdAt: Date;

  /** Completed at */
  completedAt?: Date;
}

/**
 * Notification
 */
export interface Notification {
  /** Notification ID */
  id: string;

  /** Type */
  type: NotificationType;

  /** Recipient */
  recipient: TeamMember;

  /** Sender */
  sender: TeamMember;

  /** Title */
  title: string;

  /** Message */
  message: string;

  /** Link */
  link?: string;

  /** Read */
  read: boolean;

  /** Created at */
  createdAt: Date;

  /** Read at */
  readAt?: Date;
}

/**
 * Activity
 */
export interface Activity {
  /** Activity ID */
  id: string;

  /** Type */
  type: 'comment' | 'assignment' | 'review' | 'status-change' | 'mention';

  /** Actor */
  actor: TeamMember;

  /** Action */
  action: string;

  /** Target */
  target: {
    type: string;
    id: string;
    name?: string;
  };

  /** Metadata */
  metadata?: Record<string, any>;

  /** Created at */
  createdAt: Date;
}

/**
 * Collaboration hub configuration
 */
export interface CollaborationHubConfig {
  /** API base URL */
  apiBaseUrl: string;

  /** WebSocket URL */
  websocketUrl: string;

  /** Current user */
  currentUser?: TeamMember;

  /** Enable real-time updates */
  enableRealtime: boolean;

  /** Enable notifications */
  enableNotifications: boolean;

  /** Notification polling interval (ms) */
  notificationInterval: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: CollaborationHubConfig = {
  apiBaseUrl: 'https://api.odavl.com',
  websocketUrl: 'wss://api.odavl.com/ws',
  enableRealtime: true,
  enableNotifications: true,
  notificationInterval: 30000, // 30 seconds
};

// ============================================================================
// CollaborationHub Class
// ============================================================================

/**
 * Collaboration Hub - Team collaboration features
 * 
 * **Usage**:
 * ```typescript
 * import { CollaborationHub, TeamRole } from '@odavl-studio/insight-core/collaboration/collaboration-hub';
 * 
 * const hub = new CollaborationHub({
 *   currentUser: {
 *     id: 'user-1',
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     role: TeamRole.OWNER,
 *     joinedAt: new Date(),
 *     status: 'active',
 *   },
 * });
 * 
 * // Create team
 * const team = await hub.createTeam({
 *   name: 'Frontend Team',
 *   description: 'Frontend development team',
 * });
 * 
 * // Invite member
 * await hub.inviteMember(team.id, {
 *   email: 'jane@example.com',
 *   role: TeamRole.MEMBER,
 * });
 * 
 * // Assign issue
 * const assignment = await hub.assignIssue({
 *   issueId: 'issue-123',
 *   assigneeId: 'user-2',
 *   priority: 'high',
 *   dueDate: new Date('2025-12-31'),
 * });
 * 
 * // Add comment with mention
 * const comment = await hub.addComment({
 *   target: { type: 'issue', id: 'issue-123' },
 *   content: '@jane Can you review this?',
 * });
 * 
 * // Request review
 * const review = await hub.requestReview({
 *   file: 'src/app.ts',
 *   reviewerIds: ['user-2', 'user-3'],
 * });
 * 
 * // Listen for notifications
 * hub.on('notification', (notification) => {
 *   console.log(`New notification: ${notification.title}`);
 * });
 * ```
 * 
 * **Team Management**:
 * ```typescript
 * // Get team
 * const team = await hub.getTeam('team-123');
 * console.log(`Team: ${team.name} (${team.members.length} members)`);
 * 
 * // Update member role
 * await hub.updateMemberRole(team.id, 'user-2', TeamRole.ADMIN);
 * 
 * // Remove member
 * await hub.removeMember(team.id, 'user-3');
 * 
 * // Get team activity
 * const activities = await hub.getTeamActivity(team.id, { limit: 20 });
 * activities.forEach(activity => {
 *   console.log(`${activity.actor.name} ${activity.action}`);
 * });
 * ```
 * 
 * **Comments & Discussions**:
 * ```typescript
 * // Threaded comments
 * const parent = await hub.addComment({
 *   target: { type: 'issue', id: 'issue-123' },
 *   content: 'This looks like a performance issue',
 * });
 * 
 * const reply = await hub.addComment({
 *   target: { type: 'issue', id: 'issue-123' },
 *   content: 'Agreed, I'll investigate',
 *   parentId: parent.id,
 * });
 * 
 * // Add reaction
 * await hub.addReaction(parent.id, '👍');
 * 
 * // Resolve comment
 * await hub.resolveComment(parent.id);
 * ```
 */
export class CollaborationHub extends EventEmitter {
  private config: CollaborationHubConfig;
  private teams: Map<string, Team> = new Map();
  private comments: Map<string, Comment> = new Map();
  private notifications: Notification[] = [];
  private ws?: WebSocket;
  private notificationTimer?: NodeJS.Timeout;

  constructor(config: Partial<CollaborationHubConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableRealtime) {
      this.connectWebSocket();
    }

    if (this.config.enableNotifications) {
      this.startNotificationPolling();
    }
  }

  // ==========================================================================
  // Public API - Team Management
  // ==========================================================================

  /**
   * Create team
   * 
   * @param params - Team parameters
   * @returns Created team
   */
  async createTeam(params: {
    name: string;
    description?: string;
  }): Promise<Team> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    const team: Team = {
      id: this.generateId(),
      name: params.name,
      description: params.description,
      owner: this.config.currentUser,
      members: [this.config.currentUser],
      createdAt: new Date(),
      settings: {
        defaultRole: TeamRole.MEMBER,
        allowMemberInvites: true,
        enableNotifications: true,
        notificationChannels: ['email'],
      },
    };

    this.teams.set(team.id, team);

    this.emit('team:created', { team });

    return team;
  }

  /**
   * Get team
   * 
   * @param teamId - Team ID
   * @returns Team
   */
  async getTeam(teamId: string): Promise<Team> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }
    return team;
  }

  /**
   * Update team
   * 
   * @param teamId - Team ID
   * @param updates - Updates
   */
  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const team = await this.getTeam(teamId);

    const updated: Team = {
      ...team,
      ...updates,
    };

    this.teams.set(teamId, updated);

    this.emit('team:updated', { team: updated });

    return updated;
  }

  /**
   * Invite member
   * 
   * @param teamId - Team ID
   * @param params - Invite parameters
   */
  async inviteMember(
    teamId: string,
    params: {
      email: string;
      role: TeamRole;
    }
  ): Promise<TeamMember> {
    const team = await this.getTeam(teamId);

    const member: TeamMember = {
      id: this.generateId(),
      name: params.email.split('@')[0], // Temporary name
      email: params.email,
      role: params.role,
      joinedAt: new Date(),
      status: 'invited',
    };

    team.members.push(member);
    this.teams.set(teamId, team);

    this.emit('member:invited', { team, member });

    // Send invitation notification
    await this.sendNotification({
      type: NotificationType.ASSIGNMENT,
      recipientId: member.id,
      title: 'Team Invitation',
      message: `You've been invited to join ${team.name}`,
    });

    return member;
  }

  /**
   * Update member role
   * 
   * @param teamId - Team ID
   * @param memberId - Member ID
   * @param role - New role
   */
  async updateMemberRole(
    teamId: string,
    memberId: string,
    role: TeamRole
  ): Promise<void> {
    const team = await this.getTeam(teamId);

    const member = team.members.find(m => m.id === memberId);
    if (!member) {
      throw new Error(`Member not found: ${memberId}`);
    }

    member.role = role;
    this.teams.set(teamId, team);

    this.emit('member:role-updated', { team, member, role });
  }

  /**
   * Remove member
   * 
   * @param teamId - Team ID
   * @param memberId - Member ID
   */
  async removeMember(teamId: string, memberId: string): Promise<void> {
    const team = await this.getTeam(teamId);

    team.members = team.members.filter(m => m.id !== memberId);
    this.teams.set(teamId, team);

    this.emit('member:removed', { team, memberId });
  }

  // ==========================================================================
  // Public API - Issue Collaboration
  // ==========================================================================

  /**
   * Assign issue
   * 
   * @param params - Assignment parameters
   * @returns Assignment
   */
  async assignIssue(params: {
    issueId: string;
    assigneeId: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: Date;
    notes?: string;
  }): Promise<IssueAssignment> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    const assignment: IssueAssignment = {
      id: this.generateId(),
      issueId: params.issueId,
      assignee: await this.getMember(params.assigneeId),
      assignedBy: this.config.currentUser,
      assignedAt: new Date(),
      dueDate: params.dueDate,
      priority: params.priority || 'medium',
      status: 'open',
      notes: params.notes,
    };

    this.emit('issue:assigned', { assignment });

    // Send notification to assignee
    await this.sendNotification({
      type: NotificationType.ASSIGNMENT,
      recipientId: assignment.assignee.id,
      title: 'Issue Assigned',
      message: `${this.config.currentUser.name} assigned an issue to you`,
      link: `/issues/${params.issueId}`,
    });

    return assignment;
  }

  /**
   * Update assignment status
   * 
   * @param assignmentId - Assignment ID
   * @param status - New status
   */
  async updateAssignmentStatus(
    assignmentId: string,
    status: IssueAssignment['status']
  ): Promise<void> {
    this.emit('assignment:status-updated', { assignmentId, status });

    // Send notification
    await this.sendNotification({
      type: NotificationType.STATUS_CHANGE,
      recipientId: 'owner', // Would get from assignment
      title: 'Assignment Status Updated',
      message: `Assignment status changed to ${status}`,
    });
  }

  // ==========================================================================
  // Public API - Comments
  // ==========================================================================

  /**
   * Add comment
   * 
   * @param params - Comment parameters
   * @returns Comment
   */
  async addComment(params: {
    target: Comment['target'];
    content: string;
    parentId?: string;
  }): Promise<Comment> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    // Extract mentions
    const mentions = this.extractMentions(params.content);

    const comment: Comment = {
      id: this.generateId(),
      target: params.target,
      author: this.config.currentUser,
      content: params.content,
      mentions,
      parentId: params.parentId,
      reactions: [],
      createdAt: new Date(),
      resolved: false,
    };

    this.comments.set(comment.id, comment);

    // Add to parent's replies
    if (params.parentId) {
      const parent = this.comments.get(params.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(comment);
      }
    }

    this.emit('comment:added', { comment });

    // Send notifications to mentioned users
    for (const mentioned of mentions) {
      await this.sendNotification({
        type: NotificationType.MENTION,
        recipientId: mentioned.id,
        title: 'You were mentioned',
        message: `${this.config.currentUser.name} mentioned you in a comment`,
        link: this.getCommentLink(comment),
      });
    }

    return comment;
  }

  /**
   * Update comment
   * 
   * @param commentId - Comment ID
   * @param content - New content
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    comment.content = content;
    comment.updatedAt = new Date();

    this.comments.set(commentId, comment);

    this.emit('comment:updated', { comment });

    return comment;
  }

  /**
   * Delete comment
   * 
   * @param commentId - Comment ID
   */
  async deleteComment(commentId: string): Promise<void> {
    this.comments.delete(commentId);
    this.emit('comment:deleted', { commentId });
  }

  /**
   * Add reaction to comment
   * 
   * @param commentId - Comment ID
   * @param emoji - Emoji
   */
  async addReaction(commentId: string, emoji: string): Promise<void> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    // Find or create reaction
    let reaction = comment.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [] };
      comment.reactions.push(reaction);
    }

    // Add user if not already present
    if (!reaction.users.find(u => u.id === this.config.currentUser!.id)) {
      reaction.users.push(this.config.currentUser);
    }

    this.comments.set(commentId, comment);

    this.emit('comment:reaction-added', { commentId, emoji });
  }

  /**
   * Resolve comment
   * 
   * @param commentId - Comment ID
   */
  async resolveComment(commentId: string): Promise<void> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`);
    }

    comment.resolved = true;
    comment.resolvedBy = this.config.currentUser;
    comment.resolvedAt = new Date();

    this.comments.set(commentId, comment);

    this.emit('comment:resolved', { comment });
  }

  /**
   * Get comments
   * 
   * @param target - Target (issue, file, etc.)
   * @returns Comments
   */
  async getComments(target: Comment['target']): Promise<Comment[]> {
    const comments: Comment[] = [];

    for (const comment of this.comments.values()) {
      if (
        comment.target.type === target.type &&
        comment.target.id === target.id &&
        (!target.line || comment.target.line === target.line) &&
        !comment.parentId // Only root comments
      ) {
        comments.push(comment);
      }
    }

    return comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // ==========================================================================
  // Public API - Reviews
  // ==========================================================================

  /**
   * Request review
   * 
   * @param params - Review parameters
   * @returns Review request
   */
  async requestReview(params: {
    file: string;
    reviewerIds: string[];
  }): Promise<ReviewRequest> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    const reviewers = await Promise.all(
      params.reviewerIds.map(id => this.getMember(id))
    );

    const review: ReviewRequest = {
      id: this.generateId(),
      file: params.file,
      requestedBy: this.config.currentUser,
      reviewers,
      status: 'pending',
      comments: [],
      approvals: [],
      createdAt: new Date(),
    };

    this.emit('review:requested', { review });

    // Send notifications to reviewers
    for (const reviewer of reviewers) {
      await this.sendNotification({
        type: NotificationType.REVIEW_REQUEST,
        recipientId: reviewer.id,
        title: 'Review Request',
        message: `${this.config.currentUser.name} requested your review`,
        link: `/reviews/${review.id}`,
      });
    }

    return review;
  }

  /**
   * Approve review
   * 
   * @param reviewId - Review ID
   * @param comment - Optional comment
   */
  async approveReview(reviewId: string, comment?: string): Promise<void> {
    if (!this.config.currentUser) {
      throw new Error('Current user not set');
    }

    this.emit('review:approved', { reviewId });

    // Send notification
    await this.sendNotification({
      type: NotificationType.APPROVAL,
      recipientId: 'requester', // Would get from review
      title: 'Review Approved',
      message: `${this.config.currentUser.name} approved your review`,
    });
  }

  // ==========================================================================
  // Public API - Notifications
  // ==========================================================================

  /**
   * Get notifications
   * 
   * @param options - Options
   * @returns Notifications
   */
  async getNotifications(options: {
    unreadOnly?: boolean;
    limit?: number;
  } = {}): Promise<Notification[]> {
    let filtered = [...this.notifications];

    if (options.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Mark notification as read
   * 
   * @param notificationId - Notification ID
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
      this.emit('notification:read', { notification });
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<void> {
    const now = new Date();
    for (const notification of this.notifications) {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = now;
      }
    }
    this.emit('notifications:all-read');
  }

  // ==========================================================================
  // Public API - Activity
  // ==========================================================================

  /**
   * Get team activity
   * 
   * @param teamId - Team ID
   * @param options - Options
   * @returns Activities
   */
  async getTeamActivity(
    teamId: string,
    options: { limit?: number } = {}
  ): Promise<Activity[]> {
    // Mock: Return recent activities
    const activities: Activity[] = [];

    // In real implementation, fetch from database

    return activities.slice(0, options.limit || 50);
  }

  // ==========================================================================
  // Private Methods
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
      };

      this.ws.onclose = () => {
        this.emit('websocket:disconnected');
        // Reconnect after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
      };
    } catch (error) {
      // Mock: WebSocket not available in Node.js
      // In real implementation, use ws package or browser WebSocket
    }
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'notification':
        this.notifications.push(data.notification);
        this.emit('notification', data.notification);
        break;
      case 'comment':
        this.emit('comment:realtime', data.comment);
        break;
      case 'activity':
        this.emit('activity:realtime', data.activity);
        break;
    }
  }

  /**
   * Start notification polling
   */
  private startNotificationPolling(): void {
    if (this.notificationTimer) return;

    this.notificationTimer = setInterval(async () => {
      try {
        // Mock: Poll for new notifications
        // In real implementation, fetch from API
        this.emit('notifications:polled');
      } catch (error) {
        this.emit('notifications:poll-error', { error });
      }
    }, this.config.notificationInterval);
  }

  /**
   * Stop notification polling
   */
  stopNotificationPolling(): void {
    if (this.notificationTimer) {
      clearInterval(this.notificationTimer);
      this.notificationTimer = undefined;
    }
  }

  /**
   * Extract mentions from text
   */
  private extractMentions(text: string): TeamMember[] {
    const mentions: TeamMember[] = [];
    const pattern = /@(\w+)/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const username = match[1];
      // Mock: Find member by username
      // In real implementation, look up from team members
    }

    return mentions;
  }

  /**
   * Send notification
   */
  private async sendNotification(params: {
    type: NotificationType;
    recipientId: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<void> {
    if (!this.config.currentUser) return;

    const notification: Notification = {
      id: this.generateId(),
      type: params.type,
      recipient: await this.getMember(params.recipientId),
      sender: this.config.currentUser,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.push(notification);
    this.emit('notification', notification);

    // Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'notification',
        notification,
      }));
    }
  }

  /**
   * Get member by ID
   */
  private async getMember(memberId: string): Promise<TeamMember> {
    // Mock: Find member in teams
    for (const team of this.teams.values()) {
      const member = team.members.find(m => m.id === memberId);
      if (member) return member;
    }

    // Return mock member
    return {
      id: memberId,
      name: 'Unknown User',
      email: 'unknown@example.com',
      role: TeamRole.MEMBER,
      joinedAt: new Date(),
      status: 'active',
    };
  }

  /**
   * Get comment link
   */
  private getCommentLink(comment: Comment): string {
    switch (comment.target.type) {
      case 'issue':
        return `/issues/${comment.target.id}#comment-${comment.id}`;
      case 'file':
        return `/files/${comment.target.id}#comment-${comment.id}`;
      default:
        return `/comments/${comment.id}`;
    }
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
    this.stopNotificationPolling();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create collaboration hub
 * 
 * @param config - Configuration
 * @returns CollaborationHub instance
 */
export function createCollaborationHub(
  config?: Partial<CollaborationHubConfig>
): CollaborationHub {
  return new CollaborationHub(config);
}
