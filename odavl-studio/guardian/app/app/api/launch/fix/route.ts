import { NextRequest, NextResponse } from 'next/server';
import { LaunchValidator } from '@odavl-studio/guardian-core';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productPath, productType } = body;

    if (!productPath) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product path is required',
        },
        { status: 400 }
      );
    }

    const validator = new LaunchValidator();
    
    // Validate and apply fixes
    const result = await validator.validateAndFix(
      productType || 'auto',
      productPath
    );

    // Transform result to match UI expectations
    const { report, fixesApplied, verificationReport } = result;

    // Count issues before fix
    const issuesBefore = {
      critical: report.issues.filter((i) => i.severity === 'critical').length,
      high: report.issues.filter((i) => i.severity === 'high').length,
      medium: report.issues.filter((i) => i.severity === 'medium').length,
      low: report.issues.filter((i) => i.severity === 'low').length,
    };

    // Count issues after fix
    const issuesAfter = verificationReport
      ? {
          critical: verificationReport.issues.filter((i) => i.severity === 'critical').length,
          high: verificationReport.issues.filter((i) => i.severity === 'high').length,
          medium: verificationReport.issues.filter((i) => i.severity === 'medium').length,
          low: verificationReport.issues.filter((i) => i.severity === 'low').length,
        }
      : issuesBefore;

    // Calculate improvement
    const readinessBefore = report.readinessScore;
    const readinessAfter = verificationReport?.readinessScore || readinessBefore;
    const improvement = readinessAfter - readinessBefore;

    // Fixes summary
    const fixesSummary = fixesApplied?.map((fix) => ({
      fixType: fix.fixType,
      success: fix.success,
      details: fix.details || 'No details provided',
    })) || [];

    return NextResponse.json({
      success: true,
      result: {
        productType: result.productType,
        productName: report.productName,
        productPath: report.productId,
        before: {
          readinessScore: readinessBefore,
          status: report.status,
          issues: issuesBefore,
        },
        after: {
          readinessScore: readinessAfter,
          status: verificationReport?.status || report.status,
          issues: issuesAfter,
        },
        improvement: {
          readinessChange: improvement,
          issuesFixed: fixesSummary.filter((f) => f.success).length,
          issuesRemaining: verificationReport?.issues.length || report.issues.length,
        },
        fixes: fixesSummary,
      },
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
