/**
 * Notification Center Component
 * Displays real-time notifications in Cloud Console
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from '@/lib/socket-stub';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      
      const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || '');
      newSocket.emit('subscribe:user', session.user.email);
      
      newSocket.on('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });

      setSocket(newSocket);
      return () => { newSocket.close(); };
    }
  }, [session]);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      setNotifications(await res.json());
    }
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-center">
      <button onClick={() => setOpen(!open)} className="notification-bell">
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={n.read ? 'read' : 'unread'}
                  onClick={() => markAsRead(n.id)}
                >
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
