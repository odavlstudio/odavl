/**
 * ML Insights API Endpoint
 * Provides ML-powered analysis and insights for Guardian platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { mlInsights, InsightType, InsightSeverity } from '@/lib/ml-insights';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/ml/insights - Get all ML-powered insights
 * Query Parameters:
 * - organizationId: Filter by organization
 * - type: Filter by insight type (anomaly, degradation, pattern, prediction, recommendation)
 * - severity: Filter by severity (critical, high, medium, low, info)
 * - limit: Maximum number of insights to return
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId') || undefined;
        const type = searchParams.get('type') as InsightType | null;
        const severity = searchParams.get('severity') as InsightSeverity | null;
        const limit = searchParams.get('limit');

        logger.info('Generating ML insights', {
            organizationId,
            type,
            severity,
            limit,
        });

        // Generate insights
        let insights;
        if (type) {
            insights = await mlInsights.getInsightsByType(type, organizationId);
        } else if (severity) {
            insights = await mlInsights.getInsightsBySeverity(
                severity,
                organizationId
            );
        } else {
            insights = await mlInsights.generateInsights(organizationId);
        }

        // Apply limit if specified
        if (limit) {
            const limitNum = parseInt(limit, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                insights = insights.slice(0, limitNum);
            }
        }

        // Group insights by type for better organization
        const grouped = insights.reduce(
            (acc, insight) => {
                if (!acc[insight.type]) acc[insight.type] = [];
                acc[insight.type].push(insight);
                return acc;
            },
            {} as Record<InsightType, typeof insights>
        );

        // Calculate statistics
        const stats = {
            total: insights.length,
            byType: Object.entries(grouped).map(([type, items]) => ({
                type,
                count: items.length,
            })),
            bySeverity: insights.reduce(
                (acc, insight) => {
                    acc[insight.severity] = (acc[insight.severity] || 0) + 1;
                    return acc;
                },
                {} as Record<InsightSeverity, number>
            ),
            highPriority: insights.filter((i) =>
                ['critical', 'high'].includes(i.severity)
            ).length,
            avgConfidence:
                insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length ||
                0,
        };

        return NextResponse.json({
            success: true,
            insights,
            grouped,
            stats,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Failed to generate ML insights', { error });
        captureError(error as Error, { tags: { context: 'ml-insights-api' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate insights',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/ml/insights/refresh - Force refresh ML insights
 * Triggers a new analysis and returns updated insights
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { organizationId } = body;

        logger.info('Forcing ML insights refresh', { organizationId });

        // Generate fresh insights
        const insights = await mlInsights.generateInsights(organizationId);

        return NextResponse.json({
            success: true,
            message: 'Insights refreshed successfully',
            insights,
            count: insights.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Failed to refresh ML insights', { error });
        captureError(error as Error, { tags: { context: 'ml-insights-refresh' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to refresh insights',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
