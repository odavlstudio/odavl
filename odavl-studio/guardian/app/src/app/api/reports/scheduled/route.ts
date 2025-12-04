/**
 * Scheduled Reports API
 * GET /api/reports/scheduled - List all scheduled reports
 * POST /api/reports/scheduled - Create a scheduled report
 * DELETE /api/reports/scheduled/:id - Cancel a scheduled report
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    scheduleReport,
    getScheduledReports,
    cancelScheduledReport,
    type ScheduledReport,
    type ReportConfig,
} from '@/lib/reports';
import logger from '@/lib/logger';

export async function GET() {
    try {
        const reports = getScheduledReports();
        return NextResponse.json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (error) {
        logger.error('Failed to fetch scheduled reports', { error });
        return NextResponse.json(
            { error: 'Failed to fetch scheduled reports' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { schedule, enabled = true, config } = body;

        if (!schedule || !config) {
            return NextResponse.json(
                { error: 'Missing required fields: schedule, config' },
                { status: 400 }
            );
        }

        if (!['daily', 'weekly', 'monthly'].includes(schedule)) {
            return NextResponse.json(
                { error: 'Invalid schedule. Must be: daily, weekly, or monthly' },
                { status: 400 }
            );
        }

        // Validate config
        if (!config.type || !config.emailTo) {
            return NextResponse.json(
                { error: 'Config must include type and emailTo' },
                { status: 400 }
            );
        }

        const scheduledReport: ScheduledReport = {
            id: `report-${Date.now()}`,
            schedule,
            enabled,
            config: {
                ...config,
                dateFrom: new Date(), // Will be calculated at runtime
                dateTo: new Date(),
            } as ReportConfig,
        };

        scheduleReport(scheduledReport);

        logger.info('Scheduled report created', {
            id: scheduledReport.id,
            schedule,
            type: config.type,
        });

        return NextResponse.json({
            success: true,
            report: scheduledReport,
        });
    } catch (error) {
        logger.error('Failed to create scheduled report', { error });
        return NextResponse.json(
            { error: 'Failed to create scheduled report' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required parameter: id' },
                { status: 400 }
            );
        }

        const cancelled = cancelScheduledReport(id);

        if (!cancelled) {
            return NextResponse.json(
                { error: 'Scheduled report not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Scheduled report cancelled',
        });
    } catch (error) {
        logger.error('Failed to cancel scheduled report', { error });
        return NextResponse.json(
            { error: 'Failed to cancel scheduled report' },
            { status: 500 }
        );
    }
}
