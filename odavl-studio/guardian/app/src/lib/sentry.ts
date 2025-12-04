import * as Sentry from '@sentry/nextjs';

// Helper to capture errors with context
export const captureError = (
    error: Error | unknown,
    context?: {
        tags?: Record<string, string>;
        extra?: Record<string, any>;
        user?: {
            id?: string;
            email?: string;
            username?: string;
        };
        level?: Sentry.SeverityLevel;
    }
) => {
    Sentry.withScope((scope) => {
        // Set context
        if (context?.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }

        if (context?.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }

        if (context?.user) {
            scope.setUser(context.user);
        }

        if (context?.level) {
            scope.setLevel(context.level);
        }

        // Capture the error
        if (error instanceof Error) {
            Sentry.captureException(error);
        } else {
            Sentry.captureException(new Error(String(error)));
        }
    });
};

// Helper to capture messages
export const captureMessage = (
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: {
        tags?: Record<string, string>;
        extra?: Record<string, any>;
    }
) => {
    Sentry.withScope((scope) => {
        if (context?.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }

        if (context?.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }

        Sentry.captureMessage(message, level);
    });
};

// Helper to add breadcrumbs
export const addBreadcrumb = (
    message: string,
    category: string,
    data?: Record<string, any>,
    level: Sentry.SeverityLevel = 'info'
) => {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level,
        timestamp: Date.now() / 1000,
    });
};

// Helper to set user context
export const setUser = (user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
}) => {
    Sentry.setUser(user);
};

// Helper to clear user context
export const clearUser = () => {
    Sentry.setUser(null);
};

// Helper to track test runs
export const captureTestRun = (
    testRun: {
        id: string;
        type: string;
        status: string;
        duration?: number;
        error?: Error;
    }
) => {
    addBreadcrumb(
        `Test Run ${testRun.status}`,
        'test',
        {
            testRunId: testRun.id,
            testType: testRun.type,
            status: testRun.status,
            duration: testRun.duration,
        },
        testRun.status === 'failed' ? 'error' : 'info'
    );

    if (testRun.error) {
        captureError(testRun.error, {
            tags: {
                testRunId: testRun.id,
                testType: testRun.type,
            },
            level: 'error',
        });
    }
};

// Helper to track monitor checks
export const captureMonitorCheck = (
    monitor: {
        id: string;
        url: string;
        status: 'up' | 'down';
        responseTime: number;
        error?: string;
    }
) => {
    addBreadcrumb(
        `Monitor Check: ${monitor.url}`,
        'monitor',
        {
            monitorId: monitor.id,
            url: monitor.url,
            status: monitor.status,
            responseTime: monitor.responseTime,
        },
        monitor.status === 'down' ? 'warning' : 'info'
    );

    if (monitor.error) {
        captureMessage(
            `Monitor ${monitor.id} is down: ${monitor.error}`,
            'warning',
            {
                tags: {
                    monitorId: monitor.id,
                    monitorUrl: monitor.url,
                },
                extra: {
                    responseTime: monitor.responseTime,
                },
            }
        );
    }
};

// Helper to track database queries
export const captureSlowQuery = (
    query: {
        operation: string;
        table: string;
        duration: number;
    },
    threshold = 1000 // 1 second
) => {
    if (query.duration > threshold) {
        captureMessage(
            `Slow database query: ${query.operation} on ${query.table}`,
            'warning',
            {
                tags: {
                    operation: query.operation,
                    table: query.table,
                },
                extra: {
                    duration: query.duration,
                    threshold,
                },
            }
        );
    }
};

// Helper to track API requests
export const captureAPIRequest = (
    request: {
        method: string;
        url: string;
        statusCode: number;
        duration: number;
    }
) => {
    addBreadcrumb(
        `API Request: ${request.method} ${request.url}`,
        'http',
        {
            method: request.method,
            url: request.url,
            statusCode: request.statusCode,
            duration: request.duration,
        },
        request.statusCode >= 400 ? 'error' : 'info'
    );
};

// Helper to start a span for performance monitoring
export const startSpan = <T>(
    options: {
        name: string;
        op: string;
        description?: string;
    },
    callback: () => T
): T => {
    return Sentry.startSpan(
        {
            name: options.name,
            op: options.op,
            ...(options.description && { description: options.description }),
        },
        callback
    );
};

// Helper to wrap async functions with error tracking
export const wrapAsync = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: {
        name?: string;
        tags?: Record<string, string>;
    }
): T => {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            captureError(error, {
                tags: options?.tags,
                extra: {
                    functionName: options?.name || fn.name,
                    arguments: args,
                },
            });
            throw error;
        }
    }) as T;
};
