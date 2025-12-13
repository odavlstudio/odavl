/**
 * Mark Notification as Read API
 * PATCH /api/notifications/[notificationId] - Mark as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

async function handleMarkRead(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const userId = (req as any).user?.userId;
  const { notificationId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In production, update database
  // For now, just acknowledge the request

  return NextResponse.json({
    success: true,
    notificationId,
  });
}

export const PATCH = withAuth(handleMarkRead);
