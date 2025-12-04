/**
 * usePresence Hook
 * User presence and activity tracking
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { TypedSocket } from '@/lib/socket/client';
import type { PresenceChangedPayload, ProjectUserJoinedPayload, ProjectUserLeftPayload } from '@/lib/socket/events';

export type UserStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: string;
  email: string;
  status: UserStatus;
  lastSeen: string;
}

interface UsePresenceOptions {
  socket: TypedSocket | null;
  projectId?: string;
}

/**
 * Create event handlers for presence tracking
 */
function createPresenceHandlers(
  projectId: string | undefined,
  setUsers: React.Dispatch<React.SetStateAction<Map<string, UserPresence>>>
) {
  const handleUserJoined = (data: ProjectUserJoinedPayload) => {
    if (projectId && data.projectId !== projectId) return;

    setUsers(prev => {
      const updated = new Map(prev);
      updated.set(data.userId, {
        userId: data.userId,
        email: data.email,
        status: 'online',
        lastSeen: new Date().toISOString(),
      });
      return updated;
    });
  };

  const handleUserLeft = (data: ProjectUserLeftPayload) => {
    if (projectId && data.projectId !== projectId) return;

    setUsers(prev => {
      const updated = new Map(prev);
      const user = updated.get(data.userId);
      if (user) {
        updated.set(data.userId, {
          ...user,
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });
      }
      return updated;
    });
  };

  const handlePresenceChanged = (data: PresenceChangedPayload) => {
    setUsers(prev => {
      const updated = new Map(prev);
      const user = updated.get(data.userId);
      if (user) {
        updated.set(data.userId, {
          ...user,
          status: data.status,
          lastSeen: data.timestamp,
        });
      }
      return updated;
    });
  };

  return { handleUserJoined, handleUserLeft, handlePresenceChanged };
}

/**
 * Hook for tracking user presence
 */
export function usePresence(options: UsePresenceOptions) {
  const { socket, projectId } = options;

  const [users, setUsers] = useState<Map<string, UserPresence>>(new Map());
  const [onlineCount, setOnlineCount] = useState(0);

  // Join project room on mount
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('project:join', projectId);

    return () => {
      socket.emit('project:leave', projectId);
    };
  }, [socket, projectId]);

  // Listen for presence events
  useEffect(() => {
    if (!socket) return;

    const handlers = createPresenceHandlers(projectId, setUsers);

    socket.on('project:user:joined', handlers.handleUserJoined);
    socket.on('project:user:left', handlers.handleUserLeft);
    socket.on('presence:changed', handlers.handlePresenceChanged);

    return () => {
      socket.off('project:user:joined', handlers.handleUserJoined);
      socket.off('project:user:left', handlers.handleUserLeft);
      socket.off('presence:changed', handlers.handlePresenceChanged);
    };
  }, [socket, projectId]);

  // Update online count
  useEffect(() => {
    const count = Array.from(users.values()).filter(u => u.status === 'online').length;
    setOnlineCount(count);
  }, [users]);

  // Update own presence
  const updatePresence = useCallback(
    (status: UserStatus) => {
      if (socket) {
        socket.emit('presence:update', status);
      }
    },
    [socket]
  );

  // Get online users
  const onlineUsers = Array.from(users.values()).filter(u => u.status === 'online');

  // Get away users
  const awayUsers = Array.from(users.values()).filter(u => u.status === 'away');

  // Get offline users
  const offlineUsers = Array.from(users.values()).filter(u => u.status === 'offline');

  return {
    users: Array.from(users.values()),
    onlineUsers,
    awayUsers,
    offlineUsers,
    onlineCount,
    updatePresence,
  };
}
