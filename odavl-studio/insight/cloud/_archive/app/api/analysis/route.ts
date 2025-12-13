/**
 * Analysis API with Real-time Updates
 * POST /api/analysis - Run analysis with live progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { analysisLimiter } from '@/lib/rate-limit/limiters';
import { withValidation } from '@/lib/middleware/validation';
import { z } from 'zod';
import { createAnalysisEmitter, removeAnalysisEmitter } from '@/lib/analysis/event-emitter';
import { randomUUID } from 'crypto';

// Validation schema
const analysisSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  detectors: z.array(z.string()).optional().default([
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
  path: z.string().optional(),
});

type AnalysisRequest = z.infer<typeof analysisSchema>;

/**
 * Simulate detector execution with progress updates
 */
async function runDetector(
  detector: string,
  emitter: ReturnType<typeof createAnalysisEmitter>
): Promise<{ issues: number; severity: { critical: number; high: number; medium: number; low: number } }> {
  const steps = 10;
  const delayPerStep = 100; // 100ms per step = 1s total per detector

  for (let i = 1; i <= steps; i++) {
    if (emitter.isCancelled()) {
      throw new Error('Analysis cancelled');
    }

    const progress = Math.round((i / steps) * 100);
    const issuesFound = Math.floor(Math.random() * (i * 2)); // Simulate finding issues

    emitter.emitProgress(
      detector,
      progress,
      i === steps ? 'complete' : 'running',
      issuesFound
    );

    await new Promise(resolve => setTimeout(resolve, delayPerStep));
  }

  // Generate random results
  const critical = Math.floor(Math.random() * 3);
  const high = Math.floor(Math.random() * 5);
  const medium = Math.floor(Math.random() * 10);
  const low = Math.floor(Math.random() * 15);

  return {
    issues: critical + high + medium + low,
    severity: { critical, high, medium, low },
  };
}

/**
 * Run analysis handler
 */
async function handleAnalysis(data: AnalysisRequest, req: NextRequest) {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId, detectors } = data;
  const analysisId = randomUUID();

  // Create event emitter
  const emitter = createAnalysisEmitter(analysisId, projectId, userId);

  try {
    // Emit started event
    emitter.emitStarted(detectors);

    // Run detectors sequentially with progress updates
    const results = [];
    const totalSeverity = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const detector of detectors) {
      if (emitter.isCancelled()) {
        return NextResponse.json(
          { error: 'Analysis cancelled', analysisId },
          { status: 499 }
        );
      }

      try {
        const result = await runDetector(detector, emitter);
        results.push({ detector, ...result });

        // Aggregate severity
        totalSeverity.critical += result.severity.critical;
        totalSeverity.high += result.severity.high;
        totalSeverity.medium += result.severity.medium;
        totalSeverity.low += result.severity.low;
      } catch (error) {
        if (error instanceof Error && error.message === 'Analysis cancelled') {
          throw error;
        }
        emitter.emitError(detector, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Emit completion
    emitter.emitComplete(totalSeverity);

    // Send completion notification
    const { notifyAnalysisComplete } = await import('@/lib/notifications/service');
    await notifyAnalysisComplete(
      userId,
      projectId,
      analysisId,
      totalSeverity.critical + totalSeverity.high + totalSeverity.medium + totalSeverity.low,
      totalSeverity.critical
    );

    // Clean up
    removeAnalysisEmitter(analysisId);

    return NextResponse.json({
      success: true,
      analysisId,
      results,
      summary: {
        totalIssues: totalSeverity.critical + totalSeverity.high + totalSeverity.medium + totalSeverity.low,
        ...totalSeverity,
      },
    });
  } catch (error) {
    removeAnalysisEmitter(analysisId);

    if (error instanceof Error && error.message === 'Analysis cancelled') {
      return NextResponse.json(
        { error: 'Analysis cancelled', analysisId },
        { status: 499 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

// Export with middleware
export const POST = withRateLimit(
  analysisLimiter,
  withAuth(withValidation(analysisSchema, handleAnalysis))
);
