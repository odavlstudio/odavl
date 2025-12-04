/**
 * Prometheus Metrics API
 * Exports metrics in Prometheus format and system metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, getMetricsJSON } from '@/lib/metrics';
import { performanceMonitor, SystemMonitor } from '@/lib/monitoring';
import logger from '@/lib/logger';

/**
 * GET /api/metrics
 * Export metrics in Prometheus text format, JSON, or system metrics
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const format = searchParams.get('format') || 'prometheus';
        const type = searchParams.get('type') || 'all';

        // System metrics only
        if (type === 'system') {
            const metrics = {
                performance: performanceMonitor.getAllStats(),
                system: {
                    memory: SystemMonitor.getMemoryUsage(),
                    cpu: SystemMonitor.getCPUUsage(),
                    info: SystemMonitor.getSystemInfo(),
                },
                timestamp: new Date().toISOString(),
            };
            return NextResponse.json({ success: true, metrics });
        }

        // Prometheus metrics as JSON
        if (format === 'json') {
            const prometheusMetrics = await getMetricsJSON();
            const systemMetrics = {
                performance: performanceMonitor.getAllStats(),
                system: {
                    memory: SystemMonitor.getMemoryUsage(),
                    cpu: SystemMonitor.getCPUUsage(),
                    info: SystemMonitor.getSystemInfo(),
                },
            };

            return NextResponse.json({
                success: true,
                prometheus: prometheusMetrics,
                system: systemMetrics,
                timestamp: new Date().toISOString(),
            });
        }

        // Prometheus text format (default)
        const metricsText = await getMetrics();
        return new NextResponse(metricsText, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; version=0.0.4',
            },
        });
    } catch (error) {
        logger.error('Failed to export metrics', { error });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to export metrics',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
