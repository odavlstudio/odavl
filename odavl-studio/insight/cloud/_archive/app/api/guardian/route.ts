import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateGuardianTestBody, extractTestData } from './validators';
import { calculateTestSummary } from './statistics';

/**
 * Guardian Test Results API
 * POST: Save new test result from Guardian CLI
 * GET: Retrieve test results for dashboard
 */

export const dynamic = 'force-dynamic';

// POST: Save Guardian test result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate
    const validation = validateGuardianTestBody(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract and save
    const testData = extractTestData(body);
    const test = await prisma.guardianTest.create({ data: testData });

    return NextResponse.json({
      success: true,
      testId: test.id,
      message: 'Test result saved successfully'
    });
  } catch (error: any) {
    console.error('Failed to save Guardian test:', error);
    return NextResponse.json(
      { error: 'Failed to save test result', details: error.message },
      { status: 500 }
    );
  }
}

// GET: Retrieve test results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const url = searchParams.get('url');

    const tests = await prisma.guardianTest.findMany({
      where: url ? { url } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const summary = calculateTestSummary(tests as any);

    return NextResponse.json({
      success: true,
      tests,
      summary
    });
  } catch (error: any) {
    console.error('Failed to retrieve Guardian tests:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test results', details: error.message },
      { status: 500 }
    );
  }
}
