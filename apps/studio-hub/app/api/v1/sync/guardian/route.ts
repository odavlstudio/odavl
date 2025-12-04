/**
 * Guardian Sync API
 * Receive and store Guardian test results from CLI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const GuardianTestResultSchema = z.object({
  projectId: z.string(),
  organizationId: z.string(),
  testRunId: z.string(),
  timestamp: z.string().datetime(),
  url: z.string().url(),
  environment: z.enum(['development', 'staging', 'production']),
  tests: z.object({
    accessibility: z.object({
      score: z.number().min(0).max(100),
      violations: z.number().int().min(0),
      passes: z.number().int().min(0),
    }),
    performance: z.object({
      loadTime: z.number().min(0),
      ttfb: z.number().min(0),
      fcp: z.number().min(0),
      lcp: z.number().min(0),
    }),
    security: z.object({
      vulnerabilities: z.number().int().min(0),
      warnings: z.number().int().min(0),
    }),
  }),
  screenshots: z.array(z.string()),
  passed: z.boolean(),
  totalTests: z.number().int().min(0),
  failedTests: z.number().int().min(0),
});

// In-memory storage (TODO: Replace with Prisma)
const testResults = new Map<string, unknown>();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Verify headers
    const organizationId = request.headers.get('X-Organization-Id');
    const projectId = request.headers.get('X-Project-Id');

    if (!organizationId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = GuardianTestResultSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify IDs match
    if (data.projectId !== projectId || data.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Project/Organization ID mismatch' },
        { status: 400 }
      );
    }

    // Check for duplicate testRunId
    const existing = Array.from(testResults.values()).find(
      (t: unknown) => (t as { testRunId: string }).testRunId === data.testRunId
    );

    if (existing) {
      return NextResponse.json(
        {
          error: 'Duplicate testRunId',
          message: 'These test results have already been synced',
        },
        { status: 409 }
      );
    }

    // Generate result ID
    const resultId = `guardian_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store test result
    const result = {
      id: resultId,
      ...data,
      receivedAt: new Date().toISOString(),
    };

    testResults.set(resultId, result);

    // TODO: Store in database
    // await prisma.guardianTestResult.create({ data: result });

    // TODO: Send alerts for failures
    if (!data.passed) {
      console.log(`⚠️ Guardian tests failed for ${data.url}`);
    }

    // TODO: Check for accessibility violations
    if (data.tests.accessibility.violations > 0) {
      console.log(`⚠️ ${data.tests.accessibility.violations} accessibility violations detected`);
    }

    // TODO: Check for security issues
    if (data.tests.security.vulnerabilities > 0) {
      console.log(`🚨 ${data.tests.security.vulnerabilities} security vulnerabilities found`);
    }

    return NextResponse.json({
      success: true,
      resultId,
      url: `/api/v1/sync/guardian/${resultId}`,
      receivedAt: result.receivedAt,
      summary: {
        testRunId: data.testRunId,
        passed: data.passed,
        totalTests: data.totalTests,
        failedTests: data.failedTests,
        accessibilityScore: data.tests.accessibility.score,
        loadTime: data.tests.performance.loadTime,
        vulnerabilities: data.tests.security.vulnerabilities,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Guardian sync error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const organizationId = searchParams.get('organizationId');
    const environment = searchParams.get('environment');
    const passed = searchParams.get('passed');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Filter results
    let results = Array.from(testResults.values()) as Array<{
      organizationId: string;
      projectId: string;
      environment: string;
      passed: boolean;
      receivedAt: string;
      tests: {
        accessibility: { score: number; violations: number };
        security: { vulnerabilities: number };
      };
      [key: string]: unknown;
    }>;

    results = results.filter(r => r.organizationId === organizationId);

    if (projectId) {
      results = results.filter(r => r.projectId === projectId);
    }

    if (environment) {
      results = results.filter(r => r.environment === environment);
    }

    if (passed !== null) {
      const passedFilter = passed === 'true';
      results = results.filter(r => r.passed === passedFilter);
    }

    // Sort by received date
    results.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    // Calculate stats
    const stats = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      passRate: results.length > 0
        ? (results.filter(r => r.passed).length / results.length) * 100
        : 0,
      averageAccessibilityScore: results.length > 0
        ? results.reduce((sum, r) => sum + r.tests.accessibility.score, 0) / results.length
        : 0,
      totalVulnerabilities: results.reduce((sum, r) => sum + r.tests.security.vulnerabilities, 0),
    };

    // Pagination
    const total = results.length;
    results = results.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      results,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Guardian list error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
