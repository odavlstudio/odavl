/**
 * Autopilot Sync API
 * Receive and store Autopilot O-D-A-V-L cycle ledgers from CLI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const PhaseSchema = z.object({
  status: z.enum(['success', 'failed', 'skipped']),
  duration: z.number().min(0),
  metrics: z.record(z.unknown()).optional(),
});

const AutopilotLedgerSchema = z.object({
  projectId: z.string(),
  organizationId: z.string(),
  runId: z.string(),
  timestamp: z.string().datetime(),
  phases: z.object({
    observe: PhaseSchema.extend({
      metrics: z.object({
        eslintErrors: z.number().int().min(0).optional(),
        typeScriptErrors: z.number().int().min(0).optional(),
      }).optional(),
    }),
    decide: PhaseSchema.extend({
      selectedRecipe: z.string().optional(),
      trustScore: z.number().min(0).max(1).optional(),
    }),
    act: PhaseSchema.extend({
      filesModified: z.array(z.string()).optional(),
      linesChanged: z.number().int().min(0).optional(),
    }),
    verify: PhaseSchema.extend({
      qualityImproved: z.boolean().optional(),
      attestation: z.string().optional(),
    }),
    learn: PhaseSchema.extend({
      trustScoreUpdated: z.boolean().optional(),
    }),
  }),
  success: z.boolean(),
  totalDuration: z.number().min(0),
  improvementScore: z.number().min(0).max(100).optional(),
});

// In-memory storage (TODO: Replace with Prisma)
const ledgers = new Map<string, unknown>();

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
    const validation = AutopilotLedgerSchema.safeParse(body);

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

    // Check for duplicate runId
    const existing = Array.from(ledgers.values()).find(
      (l: unknown) => (l as { runId: string }).runId === data.runId
    );

    if (existing) {
      return NextResponse.json(
        {
          error: 'Duplicate runId',
          message: 'This ledger has already been synced',
        },
        { status: 409 }
      );
    }

    // Generate ledger ID
    const ledgerId = `autopilot_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store ledger
    const ledger = {
      id: ledgerId,
      ...data,
      receivedAt: new Date().toISOString(),
    };

    ledgers.set(ledgerId, ledger);

    // TODO: Store in database
    // await prisma.autopilotLedger.create({ data: ledger });

    // TODO: Update project trust scores
    if (data.success && data.phases.learn.trustScoreUpdated) {
      console.log(`✅ Trust score updated for project ${projectId}`);
    }

    // TODO: Send notifications for failures
    if (!data.success) {
      console.log(`⚠️ Autopilot cycle failed for project ${projectId}`);
    }

    return NextResponse.json({
      success: true,
      ledgerId,
      url: `/api/v1/sync/autopilot/${ledgerId}`,
      receivedAt: ledger.receivedAt,
      summary: {
        runId: data.runId,
        success: data.success,
        totalDuration: data.totalDuration,
        filesModified: data.phases.act.filesModified?.length || 0,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Autopilot sync error:', error);

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
    const success = searchParams.get('success');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Filter ledgers
    let results = Array.from(ledgers.values()) as Array<{
      organizationId: string;
      projectId: string;
      success: boolean;
      receivedAt: string;
      [key: string]: unknown;
    }>;

    results = results.filter(l => l.organizationId === organizationId);

    if (projectId) {
      results = results.filter(l => l.projectId === projectId);
    }

    if (success !== null) {
      const successFilter = success === 'true';
      results = results.filter(l => l.success === successFilter);
    }

    // Sort by received date
    results.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    // Calculate stats
    const stats = {
      total: results.length,
      successful: results.filter(l => l.success).length,
      failed: results.filter(l => !l.success).length,
      successRate: results.length > 0
        ? (results.filter(l => l.success).length / results.length) * 100
        : 0,
    };

    // Pagination
    const total = results.length;
    results = results.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      ledgers: results,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Autopilot list error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
