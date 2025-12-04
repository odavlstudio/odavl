import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: runId } = await params;

  // Verify user has access to this run
  const run = await prisma.autopilotRun.findFirst({
    where: {
      id: runId,
      project: {
        organization: {
          users: {
            some: { id: session.user.id },
          },
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  // TODO: Implement actual undo logic
  // This would:
  // 1. Load the undo snapshot from .odavl/undo/
  // 2. Restore the original file contents
  // 3. Update run status to 'reverted'
  
  return NextResponse.json({ 
    success: true,
    message: 'Changes have been reverted (TODO: implement actual undo)'
  });
}
