// odavl-studio/insight/cloud/hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  active: boolean;
}

export function usePresence(dashboardId: string, userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join-dashboard', { dashboardId, userId });

    newSocket.on('user-joined', (data: User) => {
      setUsers((prev) => [...prev, data]);
    });

    newSocket.on('user-left', (data: { userId: string }) => {
      setUsers((prev) => prev.filter((u) => u.id !== data.userId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [dashboardId, userId]);

  const updatePresence = (data: Partial<User>) => {
    socket?.emit('update-presence', { dashboardId, userId, ...data });
  };

  return { users, updatePresence };
}