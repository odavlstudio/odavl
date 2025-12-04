/**
 * Report Generation API
 * POST /api/reports - Generate a new report
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerator, type ReportConfig } from '@/lib/reports';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request
        const {
            type,
            format = 'pdf',
            dateFrom,
            dateTo,
            organizationId,
            emailTo,
            title,
        } = body;

        if (!type || !dateFrom || !dateTo) {
            return NextResponse.json(
                { error: 'Missing required fields: type, dateFrom, dateTo' },
                { status: 400 }
            );
        }

        // Parse dates
        const from = new Date(dateFrom);
        const to = new Date(dateTo);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        if (from > to) {
            return NextResponse.json(
                { error: 'dateFrom must be before dateTo' },
                { status: 400 }
            );
        }

        // Create report config
        const config: ReportConfig = {
            type,
            format,
            dateFrom: from,
            dateTo: to,
            organizationId,
            emailTo: emailTo ? (Array.isArray(emailTo) ? emailTo : [emailTo]) : undefined,
            title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        };

        logger.info('Generating report', {
            type,
            format,
            dateFrom: from.toISOString(),
            dateTo: to.toISOString(),
        });

        const generator = new ReportGenerator(config);

        // If email recipients provided, send via email
        if (emailTo && emailTo.length > 0) {
            await generator.sendViaEmail();
            return NextResponse.json({
                success: true,
                message: 'Report generated and sent via email',
            });
        }

        // Otherwise, return the report
        const report = await generator.generate();

        if (format === 'html' || format === 'json') {
            return new NextResponse(report as string, {
                headers: {
                    'Content-Type': format === 'html' ? 'text/html' : 'application/json',
                    'Content-Disposition': `inline; filename="report.${format}"`,
                },
            });
        }

        // Return PDF as download
        const buffer = report as Buffer;
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="report-${Date.now()}.pdf"`,
            },
        });
    } catch (error) {
        logger.error('Failed to generate report', { error });
        captureError(error as Error, {
            tags: { operation: 'report-generation' },
        });

        return NextResponse.json(
            { error: 'Failed to generate report', details: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Report Generation API',
        endpoints: {
            POST: {
                description: 'Generate a new report',
                body: {
                    type: 'test-results | uptime | performance | security | comprehensive',
                    format: 'pdf | html | json (default: pdf)',
                    dateFrom: 'ISO date string (required)',
                    dateTo: 'ISO date string (required)',
                    organizationId: 'string (optional)',
                    emailTo: 'string or array of strings (optional)',
                    title: 'string (optional)',
                },
                examples: {
                    generatePDF: {
                        type: 'test-results',
                        format: 'pdf',
                        dateFrom: '2025-01-01',
                        dateTo: '2025-01-31',
                    },
                    emailReport: {
                        type: 'comprehensive',
                        format: 'html',
                        dateFrom: '2025-01-01',
                        dateTo: '2025-01-31',
                        emailTo: ['admin@example.com'],
                        title: 'Monthly Comprehensive Report',
                    },
                },
            },
        },
    });
}
