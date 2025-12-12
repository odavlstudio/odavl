/**
 * Simple Console Logger
 * Replaced pino to avoid build issues with optional dependencies
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Simple logger interface matching pino
export const logger = {
  info: (msg: any) => {
    if (typeof msg === 'string') {
      console.log('[INFO]', msg);
    } else {
      console.log('[INFO]', JSON.stringify(msg));
    }
  },
  error: (msg: any) => {
    if (typeof msg === 'string') {
      console.error('[ERROR]', msg);
    } else {
      console.error('[ERROR]', JSON.stringify(msg));
    }
  },
  warn: (msg: any) => {
    if (typeof msg === 'string') {
      console.warn('[WARN]', msg);
    } else {
      console.warn('[WARN]', JSON.stringify(msg));
    }
  },
  debug: (msg: any) => {
    if (isDevelopment) {
      if (typeof msg === 'string') {
        console.log('[DEBUG]', msg);
      } else {
        console.log('[DEBUG]', JSON.stringify(msg));
      }
    }
  },
};

// Typed log methods with context
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number
) {
  logger.info({
    type: 'api_request',
    method,
    path,
    userId,
    duration,
  });
}

export function logApiError(
  method: string,
  path: string,
  error: Error,
  userId?: string
) {
  logger.error({
    type: 'api_error',
    method,
    path,
    userId,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  });
}

export function logUsageEvent(
  userId: string,
  organizationId: string,
  eventType: string,
  metadata?: Record<string, any>
) {
  logger.info({
    type: 'usage_event',
    userId,
    organizationId,
    eventType,
    metadata,
  });
}

export function logBillingEvent(
  event: string,
  organizationId: string,
  metadata?: Record<string, any>
) {
  logger.info({
    type: 'billing_event',
    event,
    organizationId,
    metadata,
  });
}

export function logSecurityEvent(
  event: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  logger.warn({
    type: 'security_event',
    event,
    userId,
    metadata,
  });
}

export function logDatabaseQuery(
  model: string,
  operation: string,
  duration?: number
) {
  logger.debug({
    type: 'database_query',
    model,
    operation,
    duration,
  });
}
