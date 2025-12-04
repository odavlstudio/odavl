import { NextRequest, NextResponse } from 'next/server';

// POST /api/tests/:id/run - Run a test immediately
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dynamic import to avoid bundling Playwright in client
    const { ScheduledTestRunner } = await import('@/lib/scheduler');
    const runner = new ScheduledTestRunner();

    const result = await runner.runTest(params.id);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to run test: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
