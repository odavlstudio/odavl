/**
 * Presence Service
 * Track and broadcast user presence and activity
 */

import { getSocketIO } from '@/lib/socket/server';
import type { PresenceChangedPayload } from '@/lib/socket/events';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: string;
  userName: string;
  status: PresenceStatus;
  lastSeen: string;
  currentProject?: string;
  currentPage?: string;
  activeFile?: string;
  cursor?: {
    line: number;
    column: number;
  };
}

/**
 * In-memory presence store
 * In production, use Redis for distributed presence
 */
const presenceStore = new Map<string, UserPresence>();

/**
 * Presence Service Class
 */
export class PresenceService {
  /**
   * Update user presence
   */
  static updatePresence(
    userId: string,
    userName: string,
    status: PresenceStatus,
    context?: {
      projectId?: string;
      page?: string;
      file?: string;
      cursor?: { line: number; column: number };
    }
  ): void {
    const presence: UserPresence = {
      userId,
      userName,
      status,
      lastSeen: new Date().toISOString(),
      currentProject: context?.projectId,
      currentPage: context?.page,
      activeFile: context?.file,
      cursor: context?.cursor,
    };

    presenceStore.set(userId, presence);

    // Broadcast to all project members
    if (context?.projectId) {
      this.broadcastPresence(context.projectId, presence);
    }
  }

  /**
   * Broadcast presence change to project room
   */
  static broadcastPresence(projectId: string, presence: UserPresence): void {
    try {
      const io = getSocketIO();
      const payload: PresenceChangedPayload = {
        userId: presence.userId,
        userName: presence.userName,
        status: presence.status,
        projectId,
        timestamp: presence.lastSeen,
        metadata: {
          currentPage: presence.currentPage,
          activeFile: presence.activeFile,
          cursor: presence.cursor,
        },
      };

      io.to(`project:${projectId}`).emit('presence:changed', payload);
      
      console.log(`[Presence] Updated for user ${presence.userId} in project ${projectId}`);
    } catch (error) {
      console.error('[Presence] Failed to broadcast:', error);
    }
  }

  /**
   * Get presence for a user
   */
  static getPresence(userId: string): UserPresence | undefined {
    return presenceStore.get(userId);
  }

  /**
   * Get all users in a project
   */
  static getProjectPresence(projectId: string): UserPresence[] {
    const users: UserPresence[] = [];
    
    for (const presence of presenceStore.values()) {
      if (presence.currentProject === projectId) {
        users.push(presence);
      }
    }

    return users;
  }

  /**
   * Mark user as offline
   */
  static markOffline(userId: string): void {
    const presence = presenceStore.get(userId);
    if (presence) {
      presence.status = 'offline';
      presence.lastSeen = new Date().toISOString();
      presenceStore.set(userId, presence);

      // Broadcast to project if user was in one
      if (presence.currentProject) {
        this.broadcastPresence(presence.currentProject, presence);
      }
    }
  }

  /**
   * Clean up stale presence (older than 5 minutes)
   */
  static cleanupStalePresence(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    for (const [userId, presence] of presenceStore.entries()) {
      const lastSeenTime = new Date(presence.lastSeen).getTime();
      
      if (lastSeenTime < fiveMinutesAgo) {
        this.markOffline(userId);
      }
    }
  }

  /**
   * Get online count for a project
   */
  static getOnlineCount(projectId: string): number {
    let count = 0;
    
    for (const presence of presenceStore.values()) {
      if (
        presence.currentProject === projectId &&
        presence.status === 'online'
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * Track user activity (viewing file, editing, etc.)
   */
  static trackActivity(
    userId: string,
    userName: string,
    projectId: string,
    activity: {
      type: 'viewing' | 'editing' | 'commenting' | 'analyzing';
      file?: string;
      line?: number;
    }
  ): void {
    const presence = presenceStore.get(userId);
    
    if (presence) {
      presence.currentProject = projectId;
      presence.activeFile = activity.file;
      if (activity.line !== undefined) {
        presence.cursor = { line: activity.line, column: 0 };
      }
      presence.lastSeen = new Date().toISOString();
      presenceStore.set(userId, presence);

      this.broadcastPresence(projectId, presence);
    } else {
      // Create new presence if doesn't exist
      this.updatePresence(userId, userName, 'online', {
        projectId,
        file: activity.file,
        cursor: activity.line !== undefined ? { line: activity.line, column: 0 } : undefined,
      });
    }
  }
}

/**
 * Start cleanup interval (runs every 1 minute)
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startPresenceCleanup(): void {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      PresenceService.cleanupStalePresence();
    }, 60000); // 1 minute

    console.log('[Presence] Cleanup interval started');
  }
}

export function stopPresenceCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[Presence] Cleanup interval stopped');
  }
}

// Auto-start cleanup on import
if (typeof window === 'undefined') {
  startPresenceCleanup();
}
