/**
 * Comments API
 * GET /api/comments - List comments
 * POST /api/comments - Create comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { CommentsService } from '@/lib/comments/service';
import { z } from 'zod';

const createCommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(5000),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  parentId: z.string().uuid().optional(),
});

/**
 * GET - List comments for a project
 */
async function handleGetComments(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const file = searchParams.get('file');
  const unresolved = searchParams.get('unresolved') === 'true';

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId is required' },
      { status: 400 }
    );
  }

  const comments = CommentsService.getProjectComments(projectId, {
    file: file || undefined,
    unresolved,
  });

  return NextResponse.json({ comments });
}

/**
 * POST - Create a new comment
 */
async function handleCreateComment(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createCommentSchema.parse(body);
    
    const userId = (req as any).user?.userId;
    const userName = (req as any).user?.name || 'Unknown User';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await CommentsService.createComment(
      validated.projectId,
      userId,
      userName,
      validated.content,
      {
        file: validated.file,
        line: validated.line,
        parentId: validated.parentId,
      }
    );

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API] Create comment failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetComments);
export const POST = withAuth(handleCreateComment);
