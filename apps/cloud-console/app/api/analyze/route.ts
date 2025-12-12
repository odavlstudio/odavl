/**
 * ODAVL Cloud Console - /api/analyze Endpoint
 * Batch 2: Core Cloud API - Insight Integration
 * 
 * Performs code analysis using ODAVL Insight detectors
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, withLogging, withValidation, withErrorHandling, type MiddlewareContext } from '@/lib/middleware';
import { AnalyzeRequestSchema, type AnalyzeResponse, type DetectedIssue } from '@/lib/schemas';
import { enforceQuota, trackUsage } from '@/lib/usage';
import { prisma } from '@/lib/prisma';
import { trackInsightEvent, InsightTelemetryClient } from '@odavl-studio/telemetry';

// Import Insight Core (will be available after build)
import { Insight } from '@odavl-studio/sdk';

// ============================================================================
// Rate Limit Configuration
// ============================================================================

const RATE_LIMIT_CONFIG = {
  maxRequests: 10, // 10 requests per window
  windowMs: 60 * 1000, // 1 minute window
};

// ============================================================================
// Main Handler
// ============================================================================

async function analyzeHandler(
  req: NextRequest,
  body: unknown,
  ctx: MiddlewareContext
): Promise<NextResponse> {
  const validated = AnalyzeRequestSchema.parse(body);
  const startTime = Date.now();

  // Get user organization from context
  const userId = ctx.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const organizationId = user.memberships[0].organization.id;

  // Enforce quota before analysis
  await enforceQuota(organizationId, 'analysis');

  try {
    // Track analysis start
    await trackInsightEvent('insight.cloud_analysis_started', {
      projectId: organizationId,
      fileCountBucket: InsightTelemetryClient.binFileCount(100), // Approximate
    }, {
      userId: InsightTelemetryClient.hashUserId(user.email!),
      planId: (user as any).insightPlanId || 'INSIGHT_FREE',
      isTrial: (user as any).isTrial || false,
      source: 'cloud',
    });

    // Initialize Insight with configured detectors
    const insight = new Insight({
      workspacePath: validated.workspace,
      enabledDetectors: validated.detectors,
    });

    // Run analysis
    const result = await insight.analyze();

    // Map Insight results to API response schema
    const issues: DetectedIssue[] = result.issues.map((issue, idx) => ({
      id: `issue-${idx}`,
      severity: issue.severity,
      detector: issue.detector,
      message: issue.message,
      file: issue.file,
      line: issue.line,
      column: issue.column,
      code: undefined, // SDK doesn't provide code snippet
      suggestion: issue.fixSuggestion,
      documentation: undefined, // SDK doesn't provide docs link
    }));

    // Calculate summary
    const summary = {
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      info: 0, // SDK doesn't have 'info' severity
    };

    // Prepare response
    const response: AnalyzeResponse = {
      requestId: ctx.requestId,
      workspace: validated.workspace,
      status: 'success', // SDK doesn't return status, assume success if no throw
      timestamp: new Date().toISOString(),
      summary,
      issues,
      detectors: result.detectors.reduce((acc, det) => {
        acc[det.name] = {
          status: (det.enabled ? 'success' : 'skipped') as 'success' | 'failed' | 'skipped',
          duration: 0, // SDK doesn't track per-detector duration
          issuesFound: issues.filter(i => i.detector === det.name).length,
        };
        return acc;
      }, {} as Record<string, { status: 'success' | 'failed' | 'skipped'; duration: number; issuesFound: number; error?: string }>),
      metadata: {
        filesAnalyzed: 0, // SDK doesn't provide this metric
        linesAnalyzed: 0, // SDK doesn't provide this metric
        duration: Date.now() - startTime,
      },
    };

    // Track usage for billing (Batch 5)
    await trackUsage(userId, organizationId, 'analysis', {
      detectors: validated.detectors,
      issuesFound: issues.length,
      filesAnalyzed: response.metadata.filesAnalyzed,
      duration: response.metadata.duration,
    });

    // Track analysis completion
    await trackInsightEvent('insight.cloud_analysis_completed', {
      analysisId: ctx.requestId,
      projectId: organizationId,
      durationMs: response.metadata.duration,
      issuesFound: issues.length,
      success: true,
    }, {
      userId: InsightTelemetryClient.hashUserId(user.email!),
      planId: (user as any).insightPlanId || 'INSIGHT_FREE',
      source: 'cloud',
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const err = error as Error;
    
    // Track failed analysis
    await trackInsightEvent('insight.cloud_analysis_completed', {
      analysisId: ctx.requestId,
      projectId: organizationId,
      durationMs: Date.now() - startTime,
      issuesFound: 0,
      success: false,
    }, {
      userId: InsightTelemetryClient.hashUserId(user.email!),
      planId: (user as any).insightPlanId || 'INSIGHT_FREE',
      source: 'cloud',
    }).catch(() => {}); // Don't fail on telemetry error
    
    // Return structured error
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: err.message,
        requestId: ctx.requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Route Handler with Middleware Stack
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withAuth(req, async (authReq: NextRequest, ctx: MiddlewareContext) => {
    return withRateLimit(authReq, ctx, RATE_LIMIT_CONFIG, async (rateLimitedReq: NextRequest, rateLimitedCtx: MiddlewareContext) => {
      return withLogging(rateLimitedReq, rateLimitedCtx, async (loggedReq: NextRequest, loggedCtx: MiddlewareContext) => {
        return withErrorHandling(loggedReq, loggedCtx, async (handledReq: NextRequest, handledCtx: MiddlewareContext) => {
          return withValidation(handledReq, AnalyzeRequestSchema, analyzeHandler, handledCtx);
        });
      });
    });
  });
}

// ============================================================================
// Health Check (GET /api/analyze)
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/analyze',
    status: 'operational',
    version: '2.0.0',
    capabilities: {
      languages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust'],
      detectors: [
        'typescript',
        'eslint',
        'security',
        'performance',
        'complexity',
        'circular',
        'import',
        'package',
        'runtime',
        'build',
        'network',
      ],
    },
    rateLimit: RATE_LIMIT_CONFIG,
  }, { status: 200 });
}
