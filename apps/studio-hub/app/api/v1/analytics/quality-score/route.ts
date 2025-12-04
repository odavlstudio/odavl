/**
 * Quality Score API
 * POST /api/v1/analytics/quality-score - Calculate quality score
 * GET /api/v1/analytics/quality-score - Get quality score history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { qualityScoreCalculator, QualityMetrics } from '@/packages/core/src/services/quality-score';
import { z } from 'zod';

const qualityMetricsSchema = z.object({
  projectId: z.string(),
  metrics: z.object({
    codeQuality: z.object({
      score: z.number(),
      complexity: z.number(),
      duplication: z.number(),
      codeSmells: z.number(),
      maintainabilityIndex: z.number()
    }),
    testing: z.object({
      score: z.number(),
      coverage: z.number(),
      unitTests: z.number(),
      integrationTests: z.number(),
      e2eTests: z.number(),
      testQuality: z.number()
    }),
    security: z.object({
      score: z.number(),
      vulnerabilities: z.object({
        critical: z.number(),
        high: z.number(),
        medium: z.number(),
        low: z.number()
      }),
      securityHotspots: z.number(),
      dependencyIssues: z.number()
    }),
    performance: z.object({
      score: z.number(),
      buildTime: z.number(),
      bundleSize: z.number(),
      loadTime: z.number(),
      memoryUsage: z.number()
    }),
    documentation: z.object({
      score: z.number(),
      coverage: z.number(),
      quality: z.number(),
      examples: z.number()
    }),
    automation: z.object({
      score: z.number(),
      autopilotSuccessRate: z.number(),
      cicdIntegration: z.boolean(),
      automatedTests: z.number(),
      deploymentAutomation: z.boolean()
    })
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = qualityMetricsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid metrics data', details: validation.error },
        { status: 400 }
      );
    }

    const { projectId, metrics } = validation.data;

    // TODO: Verify user has access to this project

    const qualityScore = await qualityScoreCalculator.calculateQualityScore(
      projectId,
      metrics as QualityMetrics
    );

    return NextResponse.json({
      success: true,
      data: qualityScore
    });

  } catch (error) {
    console.error('Error calculating quality score:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    const history = await qualityScoreCalculator.getScoreHistory(projectId, days);

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching quality score history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
