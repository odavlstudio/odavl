import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Configure integrations
    integrations: [
        // Replay integration for session recording
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration(),
        // Breadcrumbs for better error context
        Sentry.breadcrumbsIntegration({
            console: true,
            dom: true,
            fetch: true,
            history: true,
            xhr: true,
        }),
    ],

    // Filter out sensitive information
    beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
            return null;
        }

        // Filter out personal data
        if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
        }

        // Add custom context
        if (hint.originalException instanceof Error) {
            event.contexts = {
                ...event.contexts,
                guardian: {
                    error_type: hint.originalException.name,
                    error_message: hint.originalException.message,
                },
            };
        }

        return event;
    },

    // Ignore certain errors
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // Common false positives
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
    ],

    // Sample rate for error events
    sampleRate: process.env.NODE_ENV === 'production' ? 0.8 : 1.0,
});
