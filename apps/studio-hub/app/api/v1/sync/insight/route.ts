/**
 * Insight Sync API
 * Receive and store Insight analysis results from CLI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const InsightAnalysisSchema = z.object({
  projectId: z.string(),
  organizationId: z.string(),
  timestamp: z.string().datetime(),
  detectors: z.array(z.string()),
  totalIssues: z.number().int().min(0),
  issuesBySeverity: z.object({
    critical: z.number().int().min(0),
    high: z.number().int().min(0),
    medium: z.number().int().min(0),
    low: z.number().int().min(0),
  }),
  issues: z.array(z.object({
    detector: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    message: z.string(),
    file: z.string(),
    line: z.number().int().optional(),
    column: z.number().int().optional(),
  })),
  metrics: z.object({
    filesAnalyzed: z.number().int().min(0),
    duration: z.number().min(0),
    codeLines: z.number().int().min(0),
  }).optional(),
});

// In-memory storage (TODO: Replace with Prisma)
const analyses = new Map<string, unknown>();

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
    // TODO: Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Verify organization/project headers
    const organizationId = request.headers.get('X-Organization-Id');
    const projectId = request.headers.get('X-Project-Id');

    if (!organizationId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required headers: X-Organization-Id, X-Project-Id' },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = InsightAnalysisSchema.safeParse(body);

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

    // Verify project/org match
    if (data.projectId !== projectId || data.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Project/Organization ID mismatch' },
        { status: 400 }
      );
    }

    // Generate analysis ID
    const analysisId = `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store analysis
    const analysis = {
      id: analysisId,
      ...data,
      receivedAt: new Date().toISOString(),
      apiKeyUsed: apiKey.substring(0, 8) + '...',
    };

    analyses.set(analysisId, analysis);

    // TODO: Store in database with Prisma
    // await prisma.insightAnalysis.create({ data: analysis });

    // TODO: Trigger notifications for critical issues
    if (data.issuesBySeverity.critical > 0) {
      console.log(`⚠️ Critical issues detected: ${data.issuesBySeverity.critical}`);
    }

    // TODO: Update project statistics

    return NextResponse.json({
      success: true,
      analysisId,
      url: `/api/v1/sync/insight/${analysisId}`,
      receivedAt: analysis.receivedAt,
      summary: {
        totalIssues: data.totalIssues,
        detectors: data.detectors.length,
        filesAnalyzed: data.metrics?.filesAnalyzed || 0,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Insight sync error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Filter analyses
    let results = Array.from(analyses.values()) as Array<{
      organizationId: string;
      projectId: string;
      receivedAt: string;
      [key: string]: unknown;
    }>;

    results = results.filter(a => a.organizationId === organizationId);

    if (projectId) {
      results = results.filter(a => a.projectId === projectId);
    }

    // Sort by received date (newest first)
    results.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    // Pagination
    const total = results.length;
    results = results.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      analyses: results,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Insight list error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
