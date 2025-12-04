/**
 * Traces API Endpoint
 * Query and retrieve distributed traces
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/traces - Retrieve traces with filters
 * Query params:
 * - service: Filter by service name
 * - operation: Filter by operation name
 * - traceId: Get specific trace by ID
 * - startTime: Start time filter (ISO 8601)
 * - endTime: End time filter (ISO 8601)
 * - limit: Max number of traces to return (default: 100)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const service = searchParams.get('service');
        const operation = searchParams.get('operation');
        const traceId = searchParams.get('traceId');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');
        const limit = Number.parseInt(searchParams.get('limit') || '100', 10);

        // Build filter object
        const filters = {
            service,
            operation,
            traceId,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
            limit,
        };

        logger.info('Retrieving traces', { filters });

        // Note: In production, this would query your trace backend (Jaeger, Zipkin, etc.)
        // For now, return instructions for accessing traces
        const response = {
            success: true,
            message: 'Traces are exported to OTLP endpoint',
            config: {
                endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
                serviceName: process.env.OTEL_SERVICE_NAME || 'guardian-api',
            },
            accessInstructions: {
                jaeger: {
                    ui: 'http://localhost:16686',
                    description: 'Access Jaeger UI to view traces',
                    query: {
                        service: filters.service || 'guardian-api',
                        operation: filters.operation,
                        traceId: filters.traceId,
                        startTime: filters.startTime?.toISOString(),
                        endTime: filters.endTime?.toISOString(),
                        limit: filters.limit,
                    },
                },
                zipkin: {
                    ui: 'http://localhost:9411',
                    description: 'Access Zipkin UI to view traces',
                },
            },
            filters,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error('Failed to retrieve traces', { error });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to retrieve traces',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
