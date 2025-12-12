import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Server-specific configuration
  integrations: [
    // HTTP integration for tracking outgoing requests
    Sentry.httpIntegration(),
    // Prisma integration (if available)
    // Sentry.prismaIntegration({ client: prisma }),
  ],

  // Ignore common errors
  ignoreErrors: [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],

  // Add user context
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      return null;
    }

    // Add server context
    if (event.request) {
      event.request.headers = {
        ...event.request.headers,
        'user-agent': event.request.headers?.['user-agent'] || 'unknown',
      };
    }

    return event;
  },
});
