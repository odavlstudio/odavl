/**
 * Insight Analysis API - Create Job
 * POST /api/insight/analysis
 * 
 * Creates a new analysis job and enqueues it for background processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';
import { createAnalysis } from '@/lib/services/analysis-service';
import { enqueueAnalysisJob } from '@/lib/jobs/analysis-queue';
import { canRunCloudAnalysis } from '@odavl-studio/insight-config/entitlements';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Request validation schema
const createAnalysisSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  detectors: z
    .array(z.string())
    .min(1, 'At least one detector is required')
    .default([
      'typescript',
      'eslint',
      'import',
      'package',
      'runtime',
      'build',
      'security',
      'circular',
      'network',
      'performance',
      'complexity',
      'isolation',
    ]),
  language: z.string().optional(),
  path: z.string().optional(),
});

/**
 * POST /api/insight/analysis
 * Create new analysis job
 */
export const POST = withInsightAuth(async (req: NextRequest) => {
  try {
    const session = (req as any).session;

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input
    let validatedData;
    try {
      validatedData = createAnalysisSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { projectId, detectors, language, path } = validatedData;

    // Verify project exists and user owns it
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Check plan entitlements
    const canAnalyze = await canRunCloudAnalysis(session.insightPlanId);

    if (!canAnalyze) {
      return NextResponse.json(
        {
          error: 'Cloud analysis not available on your plan',
          message: 'Please upgrade to Pro or Enterprise to use cloud analysis',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    // TODO: Check analysis usage limits
    // For example: Free plan limited to X analyses per month
    // This would integrate with Phase 2 billing system

    // Create analysis record
    const analysisId = await createAnalysis({
      projectId,
      userId: session.userId,
      detectors,
      language,
      path,
    });

    // Enqueue for background processing
    await enqueueAnalysisJob(analysisId);

    // Return job details
    return NextResponse.json(
      {
        success: true,
        analysisId,
        status: 'queued',
        pollingUrl: `/api/insight/analysis/${analysisId}`,
        message: 'Analysis job created and queued for processing',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating analysis:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to create analysis',
      },
      { status: 500 }
    );
  }
});
