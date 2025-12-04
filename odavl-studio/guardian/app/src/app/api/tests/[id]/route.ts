import { NextRequest, NextResponse } from 'next/server';

// GET /api/tests/:id - Get test details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dynamic import to avoid bundling Guardian Core in client
    const { ScheduledTestRunner } = await import('@/lib/scheduler');
    const runner = new ScheduledTestRunner();
    
    const test = runner.getTest(params.id);
    
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const stats = runner.getStats(params.id);
    const results = runner.getResults(params.id, 10);

    return NextResponse.json({ test, stats, results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    );
  }
}

// DELETE /api/tests/:id - Delete a test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dynamic import to avoid bundling Guardian Core in client
    const { ScheduledTestRunner } = await import('@/lib/scheduler');
    const runner = new ScheduledTestRunner();
    
    runner.removeTest(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    );
  }
}

// PATCH /api/tests/:id - Update a test
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dynamic import to avoid bundling Guardian Core in client
    const { ScheduledTestRunner } = await import('@/lib/scheduler');
    const runner = new ScheduledTestRunner();
    
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled === 'boolean') {
      runner.toggleTest(params.id, enabled);
    }

    const test = runner.getTest(params.id);
    return NextResponse.json({ test });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}
