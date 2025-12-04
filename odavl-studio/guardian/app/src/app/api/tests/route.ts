import { NextRequest, NextResponse } from 'next/server';

// GET /api/tests - List all scheduled tests
export async function GET() {
  try {
    // Dynamic import to avoid bundling Guardian Core in client
    const { ScheduledTestRunner } = await import('@/lib/scheduler');
    const runner = new ScheduledTestRunner();
    
    const tests = runner.getTests();
    return NextResponse.json({ tests });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

// POST /api/tests - Create a new scheduled test
export async function POST(request: NextRequest) {
  try {
    // Dynamic import to avoid bundling Guardian Core in client
    const { ScheduledTestRunner } = await import('@/lib/scheduler');
    const runner = new ScheduledTestRunner();
    
    const body = await request.json();
    const { url, schedule, enabled = true } = body;

    if (!url || !schedule) {
      return NextResponse.json(
        { error: 'URL and schedule are required' },
        { status: 400 }
      );
    }

    const test = {
      id: `test-${Date.now()}`,
      url,
      schedule,
      enabled
    };

    runner.addTest(test);

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}
