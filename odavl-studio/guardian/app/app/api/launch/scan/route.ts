import { NextRequest, NextResponse } from 'next/server';
import { LaunchValidator } from '@odavl-studio/guardian-core';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspacePath } = body;

    // Use provided workspace path or default to root
    const targetPath = workspacePath || process.cwd();

    const validator = new LaunchValidator();
    const results = await validator.validateAllProducts(targetPath);

    // Transform results to match UI expectations
    const products = results.map((result) => {
      const { report } = result;
      
      // Count issues by severity
      const issues = {
        critical: report.issues.filter((i) => i.severity === 'critical').length,
        high: report.issues.filter((i) => i.severity === 'high').length,
        medium: report.issues.filter((i) => i.severity === 'medium').length,
        low: report.issues.filter((i) => i.severity === 'low').length,
      };

      const autoFixableCount = report.issues.filter((i) => i.autoFixable).length;

      return {
        name: report.productName,
        type: result.productType,
        path: report.productId,
        readinessScore: report.readinessScore,
        status: report.status,
        issues,
        autoFixableCount,
        issueDetails: report.issues.map((issue) => ({
          id: issue.id,
          severity: issue.severity,
          category: issue.category,
          message: issue.message,
          file: issue.file,
          autoFixable: issue.autoFixable,
          impact: issue.impact,
        })),
      };
    });

    // Calculate summary stats
    const summary = {
      totalProducts: products.length,
      readyCount: products.filter((p) => p.status === 'ready').length,
      unstableCount: products.filter((p) => p.status === 'unstable').length,
      blockedCount: products.filter((p) => p.status === 'blocked').length,
      totalAutoFixable: products.reduce((sum, p) => sum + p.autoFixableCount, 0),
    };

    return NextResponse.json({
      success: true,
      summary,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
