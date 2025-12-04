/**
 * Get Insights API
 * GET /api/insights
 * Week 10 Day 3: Reports & Insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsService } from '@/lib/metrics/service';
import { insightsEngine } from '@/lib/reports/insights-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'demo-project-123';
    const timeRange = searchParams.get('timeRange') || '7d';

    // Get dashboard summary
    const summary = await metricsService.getDashboardSummary(
      projectId,
      timeRange as any
    );

    // Generate insights
    const insights = insightsEngine.generateInsights(summary);
    const anomalies = insightsEngine.detectAnomalies(summary.issueTrend.dataPoints);
    const recommendations = insightsEngine.generateRecommendations(summary, insights);

    return NextResponse.json({
      success: true,
      data: {
        insights,
        anomalies,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch insights'
      },
      { status: 500 }
    );
  }
}
