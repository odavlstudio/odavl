/**
 * Brain Prediction API - POST /api/brain/predict
 * Phase Ω-P1: Run Brain deployment confidence prediction
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { changedFiles, testResults } = body;

    // Import Brain runtime
    const { computeDeploymentConfidence } = await import('@odavl-studio/brain/runtime');

    // Compute confidence
    const result = await computeDeploymentConfidence({
      fileTypeStats: analyzeFiles(changedFiles || []),
      guardianReport: testResults || {
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      },
      baselineHistory: { runs: [] },
      enableMLPrediction: true,
    });

    return NextResponse.json({
      confidence: result.confidence,
      canDeploy: result.canDeploy,
      reasoning: result.reasoning,
      fusion: (result as any).mlPrediction?.fusion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Brain API] Prediction failed:', error);
    return NextResponse.json(
      { error: 'Prediction failed', message: String(error) },
      { status: 500 }
    );
  }
}

function analyzeFiles(files: string[]): any {
  const byType: Record<string, number> = {};
  const byRisk: Record<string, number> = {};

  for (const file of files) {
    const ext = file.split('.').pop() || 'unknown';
    byType[ext] = (byType[ext] || 0) + 1;

    const risk = ['ts', 'tsx', 'js', 'jsx', 'py'].includes(ext) ? 'high' : 'low';
    byRisk[risk] = (byRisk[risk] || 0) + 1;
  }

  return { byType, byRisk, totalFiles: files.length };
}
