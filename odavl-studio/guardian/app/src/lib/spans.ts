/**
 * Custom Span Utilities
 * Helper functions for creating custom spans with business context
 */

import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';

// Get tracer instance
const tracer = trace.getTracer('guardian-custom-spans', '0.1.0');

// Type alias for span attributes
type SpanAttributes = Record<string, string | number | boolean>;

/**
 * Create and execute a span with automatic error handling
 */
export async function withSpan<T>(
    name: string,
    attributes: SpanAttributes,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    const span = tracer.startSpan(name);

    try {
        // Set initial attributes
        for (const [key, value] of Object.entries(attributes)) {
            span.setAttribute(key, value);
        }

        // Execute function with span context
        const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));

        // Mark span as successful
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        // Record error in span
        span.recordException(error as Error);
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message,
        });
        throw error;
    } finally {
        span.end();
    }
}

/**
 * Create span for test execution
 */
export async function traceTestExecution<T>(
    testId: string,
    testType: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return withSpan(
        'test.execute',
        {
            'test.id': testId,
            'test.type': testType,
        },
        fn
    );
}

/**
 * Create span for monitor check
 */
export async function traceMonitorCheck<T>(
    monitorId: string,
    monitorType: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return withSpan(
        'monitor.check',
        {
            'monitor.id': monitorId,
            'monitor.type': monitorType,
        },
        fn
    );
}

/**
 * Create span for report generation
 */
export async function traceReportGeneration<T>(
    reportType: string,
    organizationId: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return withSpan(
        'report.generate',
        {
            'report.type': reportType,
            'organization.id': organizationId,
        },
        fn
    );
}

/**
 * Create span for ML analysis
 */
export async function traceMLAnalysis<T>(
    analysisType: string,
    dataPoints: number,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return withSpan(
        'ml.analyze',
        {
            'analysis.type': analysisType,
            'analysis.data_points': dataPoints,
        },
        fn
    );
}

/**
 * Create span for database operation
 */
export async function traceDatabaseOperation<T>(
    operation: string,
    model: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return withSpan(
        'database.operation',
        {
            'db.operation': operation,
            'db.model': model,
        },
        fn
    );
}

/**
 * Create span for cache operation
 */
export async function traceCacheOperation<T>(
    operation: 'get' | 'set' | 'delete',
    key: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return withSpan(
        'cache.operation',
        {
            'cache.operation': operation,
            'cache.key': key,
        },
        fn
    );
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: SpanAttributes) {
    const span = trace.getActiveSpan();
    if (span) {
        span.addEvent(name, attributes);
    }
}

/**
 * Set attribute on current span
 */
export function setSpanAttribute(key: string, value: string | number | boolean) {
    const span = trace.getActiveSpan();
    if (span) {
        span.setAttribute(key, value);
    }
}

/**
 * Record exception on current span
 */
export function recordSpanException(error: Error) {
    const span = trace.getActiveSpan();
    if (span) {
        span.recordException(error);
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
        });
    }
}

export default {
    withSpan,
    traceTestExecution,
    traceMonitorCheck,
    traceReportGeneration,
    traceMLAnalysis,
    traceDatabaseOperation,
    traceCacheOperation,
    addSpanEvent,
    setSpanAttribute,
    recordSpanException,
};
