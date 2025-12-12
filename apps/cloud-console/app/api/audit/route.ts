/**
 * ODAVL Cloud Console - /api/audit Endpoint
 * Batch 2: Core Cloud API - Guardian Integration
 * 
 * Performs website testing using ODAVL Guardian (accessibility, performance, security, SEO)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, withLogging, withValidation, withErrorHandling, type MiddlewareContext } from '@/lib/middleware';
import { AuditRequestSchema, type AuditResponse, type AuditIssue } from '@/lib/schemas';
import { enforceQuota, trackUsage } from '@/lib/usage';
import { prisma } from '@/lib/prisma';

// Import Guardian Core (will be available after build)
import { Guardian } from '@odavl-studio/sdk';

// ============================================================================
// Rate Limit Configuration
// ============================================================================

const RATE_LIMIT_CONFIG = {
  maxRequests: 15, // 15 audit requests per window (more generous than fix)
  windowMs: 60 * 1000, // 1 minute window
};

// ============================================================================
// Main Handler
// ============================================================================

async function auditHandler(
  req: NextRequest,
  body: unknown,
  ctx: MiddlewareContext
): Promise<NextResponse> {
  const validated = AuditRequestSchema.parse(body);
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

  // Enforce quota before audit
  await enforceQuota(organizationId, 'audit');

  try {
    // Initialize Guardian with configured test suites
    const guardian = new Guardian({
      thresholds: {
        accessibility: 90,
        performance: 75,
        security: 85,
        seo: 80,
      },
    });

    // Run tests using the SDK's runTests method
    const result = await guardian.runTests(validated.url);

    // Map Guardian results to API response schema
    const issues: AuditIssue[] = result.tests.flatMap((test: { testId: string; type: string; issues: Array<{ severity: string; message: string; recommendation: string }> }, testIdx: number) => 
      test.issues.map((issue: { severity: string; message: string; recommendation: string }, issueIdx: number) => ({
        id: `${test.testId}-${issueIdx}`,
        severity: issue.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
        suite: test.type,
        message: issue.message,
        element: undefined, // SDK doesn't provide element selector
        recommendation: issue.recommendation,
        documentation: undefined, // SDK doesn't provide docs link
      }))
    );

    // Calculate summary
    const summary = {
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      info: 0, // SDK doesn't have 'info' severity
    };

    // Calculate per-suite scores
    const scores = result.tests.reduce((acc: Record<string, number>, test: { type: string; score: number }) => {
      acc[test.type] = test.score;
      return acc;
    }, {} as Record<string, number>);

    // Prepare response
    const response: AuditResponse = {
      requestId: ctx.requestId,
      url: validated.url,
      status: result.overallStatus === 'passed' ? 'success' : result.overallStatus === 'warning' ? 'partial' : 'failed',
      timestamp: new Date().toISOString(),
      summary,
      scores,
      issues,
      lighthouse: {
        performance: scores['performance'] || 0,
        accessibility: scores['accessibility'] || 0,
        bestPractices: 0, // SDK doesn't track best practices separately
        seo: scores['seo'] || 0,
      },
      screenshot: undefined, // SDK doesn't provide screenshots yet
      metadata: {
        duration: Date.now() - startTime,
        device: validated.device,
        environment: validated.environment,
      },
    };

    // TODO: Batch 5 - Track usage for billing
    // await trackUsage({
    //   userId: ctx.userId!,
    //   endpoint: '/api/audit',
    //   resourcesUsed: { testsRun: validated.suites.length }
    // });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const err = error as Error;
    
    // Return structured error
    return NextResponse.json(
      {
        error: 'Audit failed',
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
          return withValidation(handledReq, AuditRequestSchema, auditHandler, handledCtx);
        });
      });
    });
  });
}

// ============================================================================
// Health Check (GET /api/audit)
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/audit',
    status: 'operational',
    version: '2.0.0',
    capabilities: {
      suites: ['accessibility', 'performance', 'security', 'seo', 'best-practices'],
      devices: ['desktop', 'mobile', 'tablet'],
      environments: ['staging', 'production', 'development'],
      features: [
        'lighthouse-integration',
        'axe-core-accessibility',
        'visual-regression',
        'multi-browser-support',
      ],
    },
    rateLimit: RATE_LIMIT_CONFIG,
    compliance: {
      standards: ['WCAG 2.1 AA', 'OWASP Top 10', 'Core Web Vitals'],
      browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    },
  }, { status: 200 });
}
