/**
 * Generate Report API
 * POST /api/reports/generate
 * Week 10 Day 3: Reports & Insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { metricsService } from '@/lib/metrics/service';
import { reportGenerator } from '@/lib/reports/report-generator';
import type { ReportType } from '@/lib/reports/types';

const generateReportSchema = z.object({
  projectId: z.string().min(1),
  reportType: z.enum(['summary', 'detailed', 'team', 'security', 'performance']),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('7d')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = generateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { projectId, reportType, timeRange } = validation.data;

    // Get dashboard summary
    const summary = await metricsService.getDashboardSummary(projectId, timeRange);

    // Generate report based on type
    let report;
    const userId = 'demo-user-123'; // TODO: Get from auth

    switch (reportType) {
      case 'summary':
        report = reportGenerator.generateSummaryReport(projectId, summary, userId);
        break;
      case 'detailed':
        report = reportGenerator.generateDetailedReport(projectId, summary, userId);
        break;
      case 'team':
        report = reportGenerator.generateTeamReport(projectId, summary, userId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Report type not implemented yet' },
          { status: 501 }
        );
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report'
      },
      { status: 500 }
    );
  }
}
