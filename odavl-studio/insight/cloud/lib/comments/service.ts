/**
 * Comments Service
 * Real-time commenting system for code collaboration
 */

import { getSocketIO } from '@/lib/socket/server';
import type { CommentCreatedPayload, CommentResolvedPayload } from '@/lib/socket/events';
import { randomUUID } from 'crypto';

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  file?: string;
  line?: number;
  resolved: boolean;
  mentions: string[]; // User IDs mentioned in comment
  parentId?: string; // For threaded comments
  createdAt: string;
  updatedAt: string;
}

/**
 * In-memory comment store
 * In production, use database (Prisma)
 */
const commentStore = new Map<string, Comment>();
const projectCommentsIndex = new Map<string, Set<string>>();

/**
 * Comments Service Class
 */
export class CommentsService {
  /**
   * Create a new comment
   */
  static async createComment(
    projectId: string,
    userId: string,
    userName: string,
    content: string,
    options?: {
      file?: string;
      line?: number;
      parentId?: string;
    }
  ): Promise<Comment> {
    const commentId = randomUUID();
    
    // Extract mentions (@username)
    const mentions = this.extractMentions(content);

    const comment: Comment = {
      id: commentId,
      projectId,
      userId,
      userName,
      content,
      file: options?.file,
      line: options?.line,
      resolved: false,
      mentions,
      parentId: options?.parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store comment
    commentStore.set(commentId, comment);

    // Index by project
    if (!projectCommentsIndex.has(projectId)) {
      projectCommentsIndex.set(projectId, new Set());
    }
    projectCommentsIndex.get(projectId)!.add(commentId);

    // Broadcast to project room
    this.broadcastCommentCreated(comment);

    // Send notifications to mentioned users
    if (mentions.length > 0) {
      await this.notifyMentionedUsers(comment);
    }

    return comment;
  }

  /**
   * Resolve a comment
   */
  static resolveComment(commentId: string, resolvedBy: string): Comment | null {
    const comment = commentStore.get(commentId);
    
    if (!comment) {
      return null;
    }

    comment.resolved = true;
    comment.updatedAt = new Date().toISOString();
    commentStore.set(commentId, comment);

    // Broadcast resolution
    this.broadcastCommentResolved(comment.projectId, commentId, resolvedBy);

    return comment;
  }

  /**
   * Get comment by ID
   */
  static getComment(commentId: string): Comment | undefined {
    return commentStore.get(commentId);
  }

  /**
   * Get all comments for a project
   */
  static getProjectComments(projectId: string, options?: {
    file?: string;
    unresolved?: boolean;
  }): Comment[] {
    const commentIds = projectCommentsIndex.get(projectId);
    if (!commentIds) {
      return [];
    }

    let comments: Comment[] = [];
    
    for (const commentId of commentIds) {
      const comment = commentStore.get(commentId);
      if (comment) {
        comments.push(comment);
      }
    }

    // Apply filters
    if (options?.file) {
      comments = comments.filter(c => c.file === options.file);
    }
    if (options?.unresolved) {
      comments = comments.filter(c => !c.resolved);
    }

    // Sort by creation date (newest first)
    comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return comments;
  }

  /**
   * Get comment thread (parent + replies)
   */
  static getCommentThread(commentId: string): Comment[] {
    const comment = commentStore.get(commentId);
    if (!comment) {
      return [];
    }

    const thread: Comment[] = [comment];
    const projectComments = this.getProjectComments(comment.projectId);

    // Find replies
    const replies = projectComments.filter(c => c.parentId === commentId);
    thread.push(...replies);

    return thread;
  }

  /**
   * Extract @mentions from comment content
   */
  private static extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  /**
   * Broadcast comment creation to project room
   */
  private static broadcastCommentCreated(comment: Comment): void {
    try {
      const io = getSocketIO();
      const payload: CommentCreatedPayload = {
        commentId: comment.id,
        projectId: comment.projectId,
        userId: comment.userId,
        userName: comment.userName,
        content: comment.content,
        file: comment.file,
        line: comment.line,
        timestamp: comment.createdAt,
      };

      io.to(`project:${comment.projectId}`).emit('comment:created', payload);
      
      console.log(`[Comments] Created comment ${comment.id} in project ${comment.projectId}`);
    } catch (error) {
      console.error('[Comments] Failed to broadcast:', error);
    }
  }

  /**
   * Broadcast comment resolution to project room
   */
  private static broadcastCommentResolved(
    projectId: string,
    commentId: string,
    resolvedBy: string
  ): void {
    try {
      const io = getSocketIO();
      const payload: CommentResolvedPayload = {
        commentId,
        projectId,
        resolvedBy,
        timestamp: new Date().toISOString(),
      };

      io.to(`project:${projectId}`).emit('comment:resolved', payload);
      
      console.log(`[Comments] Resolved comment ${commentId}`);
    } catch (error) {
      console.error('[Comments] Failed to broadcast resolution:', error);
    }
  }

  /**
   * Send notifications to mentioned users
   */
  private static async notifyMentionedUsers(comment: Comment): Promise<void> {
    try {
      const { NotificationService } = await import('@/lib/notifications/service');
      
      for (const mentionedUsername of comment.mentions) {
        // In production, lookup userId from username
        // For now, we'll skip actual notification sending
        console.log(`[Comments] Would notify @${mentionedUsername} about mention`);
        
        // Example:
        // await NotificationService.notifyMention(
        //   mentionedUserId,
        //   comment.userName,
        //   comment.projectId,
        //   comment.id,
        //   comment.content.substring(0, 100)
        // );
      }
    } catch (error) {
      console.error('[Comments] Failed to notify mentioned users:', error);
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  static deleteComment(commentId: string): boolean {
    const comment = commentStore.get(commentId);
    if (!comment) {
      return false;
    }

    commentStore.delete(commentId);
    
    // Remove from project index
    const projectComments = projectCommentsIndex.get(comment.projectId);
    if (projectComments) {
      projectComments.delete(commentId);
    }

    return true;
  }

  /**
   * Get unresolved comment count for a project
   */
  static getUnresolvedCount(projectId: string): number {
    const comments = this.getProjectComments(projectId, { unresolved: true });
    return comments.length;
  }
}
