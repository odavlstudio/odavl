import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Configure integrations for Node.js
    integrations: [
        // HTTP integration for tracking outgoing requests
        Sentry.httpIntegration(),
        // Node Fetch integration
        Sentry.nativeNodeFetchIntegration(),
        // Prisma integration
        Sentry.prismaIntegration(),
    ],

    // Filter out sensitive information
    beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
            return null;
        }

        // Filter out sensitive data from request
        if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }
        }

        // Add custom context
        if (hint.originalException instanceof Error) {
            event.contexts = {
                ...event.contexts,
                guardian: {
                    error_type: hint.originalException.name,
                    error_message: hint.originalException.message,
                    service: 'guardian-server',
                },
            };
        }

        return event;
    },

    // Ignore certain errors
    ignoreErrors: [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'NetworkError',
        'Failed to fetch',
    ],

    // Sample rate for error events
    sampleRate: process.env.NODE_ENV === 'production' ? 0.8 : 1.0,
});
