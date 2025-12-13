/**
 * Notifications API
 * GET /api/notifications - Fetch user's notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

// Mock notification storage (replace with database in production)
const notificationsStore = new Map<string, Array<{
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}>>();

async function handleGetNotifications(req: NextRequest) {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get notifications for user
  const notifications = notificationsStore.get(userId) || [];

  // Sort by creation date (newest first)
  const sorted = notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    notifications: sorted,
    unreadCount: sorted.filter(n => !n.read).length,
  });
}

export const GET = withAuth(handleGetNotifications);
