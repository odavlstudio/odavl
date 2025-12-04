/**
 * Resolve Comment API
 * POST /api/comments/[commentId]/resolve - Mark comment as resolved
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { CommentsService } from '@/lib/comments/service';

async function handleResolveComment(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const userId = (req as any).user?.userId;
  const { commentId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const comment = CommentsService.resolveComment(commentId, userId);

  if (!comment) {
    return NextResponse.json(
      { error: 'Comment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    comment,
  });
}

export const POST = withAuth(handleResolveComment);
