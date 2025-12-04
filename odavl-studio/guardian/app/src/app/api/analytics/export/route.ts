/**
 * Data Export API
 * Exports analytics data in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';
import { startOfDay, subDays, format } from 'date-fns';

/**
 * GET /api/analytics/export - Export analytics data
 * Query params: organizationId, days, format (json|csv), type (tests|monitors|alerts|all)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const days = parseInt(searchParams.get('days') || '30');
        const exportFormat = searchParams.get('format') || 'json';
        const exportType = searchParams.get('type') || 'all';

        const startDate = startOfDay(subDays(new Date(), days));

        const data: any = {};

        // Export tests
        if (exportType === 'tests' || exportType === 'all') {
            const tests = await prisma.testRun.findMany({
                where: {
                    ...(organizationId && { organizationId }),
                    createdAt: { gte: startDate },
                },
                select: {
                    id: true,
                    type: true,
                    status: true,
                    duration: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            data.tests = tests;
        }

        // Export monitors
        if (exportType === 'monitors' || exportType === 'all') {
            const monitors = await prisma.monitor.findMany({
                where: organizationId ? { project: { organizationId } } : undefined,
                select: {
                    id: true,
                    name: true,
                    endpoint: true,
                    enabled: true,
                    checks: {
                        where: { timestamp: { gte: startDate } },
                        select: {
                            timestamp: true,
                            success: true,
                            responseTime: true,
                            statusCode: true,
                        },
                        orderBy: { timestamp: 'desc' },
                    },
                },
            });
            data.monitors = monitors;
        }

        // Export alerts
        if (exportType === 'alerts' || exportType === 'all') {
            const alerts = await prisma.alert.findMany({
                where: {
                    ...(organizationId && { organizationId }),
                    createdAt: { gte: startDate },
                },
                select: {
                    id: true,
                    type: true,
                    severity: true,
                    message: true,
                    resolved: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            data.alerts = alerts;
        }

        // Format output
        if (exportFormat === 'csv') {
            // Convert to CSV
            let csv = '';

            if (data.tests) {
                csv += 'TEST RUNS\n';
                csv += 'ID,Name,Type,Status,Duration(ms),Date\n';
                for (const test of data.tests) {
                    csv += `${test.id},${test.name},${test.type},${test.status},${test.duration},${format(new Date(test.createdAt), 'yyyy-MM-dd HH:mm:ss')}\n`;
                }
                csv += '\n';
            }

            if (data.monitors) {
                csv += 'MONITORS\n';
                csv += 'ID,Name,URL,Status,Checks Count\n';
                for (const monitor of data.monitors) {
                    csv += `${monitor.id},${monitor.name},${monitor.url},${monitor.status},${monitor.checks.length}\n`;
                }
                csv += '\n';

                csv += 'MONITOR CHECKS\n';
                csv += 'Monitor ID,Monitor Name,Timestamp,Success,Response Time(ms),Status Code\n';
                for (const monitor of data.monitors) {
                    for (const check of monitor.checks) {
                        csv += `${monitor.id},${monitor.name},${format(new Date(check.timestamp), 'yyyy-MM-dd HH:mm:ss')},${check.success},${check.responseTime},${check.statusCode}\n`;
                    }
                }
                csv += '\n';
            }

            if (data.alerts) {
                csv += 'ALERTS\n';
                csv += 'ID,Type,Severity,Message,Status,Date\n';
                for (const alert of data.alerts) {
                    csv += `${alert.id},${alert.type},${alert.severity},"${alert.message.replace(/"/g, '""')}",${alert.status},${format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm:ss')}\n`;
                }
            }

            return new NextResponse(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="guardian-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
                },
            });
        }

        // JSON format
        return NextResponse.json({
            success: true,
            export: {
                format: exportFormat,
                type: exportType,
                period: {
                    days,
                    startDate: startDate.toISOString(),
                    endDate: new Date().toISOString(),
                },
                data,
            },
        });
    } catch (error) {
        logger.error('Failed to export data', { error });
        captureError(error as Error, { tags: { context: 'analytics-export' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to export data',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
