import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: testId } = await params;

  // Verify user has access to this test
  const test = await prisma.guardianTest.findFirst({
    where: {
      id: testId,
      project: {
        organization: {
          users: {
            some: { id: session.user.id },
          },
        },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  // Rerun test logic
  try {
    // Create new test record with same configuration
    const newTest = await prisma.guardianTest.create({
      data: {
        url: test.url,
        environment: test.environment,
        status: 'RUNNING',
        projectId: test.projectId,
      },
    });

    // Import and run Guardian test runner
    const { runGuardianTests } = await import('@/lib/guardian/test-runner');
    
    // Run test asynchronously (don't await - let it run in background)
    runGuardianTests(newTest.id).catch((error) => {
      logger.error('Test execution failed', error as Error);
    });
    
    return NextResponse.json({ 
      success: true,
      testId: newTest.id,
      message: 'Test rerun initiated successfully',
    });
  } catch (error) {
    logger.error('Failed to initiate test rerun', error as Error);
    return NextResponse.json(
      { error: 'Failed to initiate test rerun' },
      { status: 500 }
    );
  }
}
