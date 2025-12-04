/**
 * Observability Middleware
 * Automatic metrics and tracing for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordHttpMetrics } from '@/lib/metrics';
import { withSpan } from '@/lib/spans';

/**
 * Middleware to track HTTP requests with metrics and tracing
 */
export async function observabilityMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    const startTime = Date.now();
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    // Get request size
    const requestSize = request.headers.get('content-length')
        ? Number.parseInt(request.headers.get('content-length')!, 10)
        : undefined;

    try {
        // Execute request with tracing
        const response = await withSpan(
            'http.request',
            {
                'http.method': method,
                'http.route': pathname,
                'http.url': request.url,
            },
            async () => {
                return await handler();
            }
        );

        // Calculate duration
        const durationMs = Date.now() - startTime;

        // Get response size
        const responseSize = response.headers.get('content-length')
            ? Number.parseInt(response.headers.get('content-length')!, 10)
            : undefined;

        // Record metrics
        recordHttpMetrics(method, pathname, response.status, durationMs, requestSize, responseSize);

        return response;
    } catch (error) {
        // Calculate duration
        const durationMs = Date.now() - startTime;

        // Record error metrics (assume 500 status)
        recordHttpMetrics(method, pathname, 500, durationMs, requestSize);

        throw error;
    }
}

/**
 * Higher-order function to wrap route handlers with observability
 */
export function withObservability(
    handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        return observabilityMiddleware(request, () => handler(request));
    };
}

export default observabilityMiddleware;
