/**
 * Monitoring Service - Sentry Integration
 * Centralized error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

export class MonitoringService {
  /**
   * Capture error with context
   */
  static captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
      level: 'error',
    });
  }

  /**
   * Capture message
   */
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
  }

  /**
   * Set user context
   */
  static setUser(user: { id: string; email?: string; name?: string }) {
    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  static clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb
   */
  static addBreadcrumb(message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Start transaction for performance monitoring
   */
  static startTransaction(name: string, op: string) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }

  /**
   * Track API call performance
   */
  static async trackApiCall<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(name, 'http.request');

    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      this.captureError(error as Error, { api: name });
      throw error;
    } finally {
      transaction.finish();
    }
  }

  /**
   * Track database query performance
   */
  static async trackDbQuery<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(query, 'db.query');

    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      this.captureError(error as Error, { query });
      throw error;
    } finally {
      transaction.finish();
    }
  }

  /**
   * Set custom tag
   */
  static setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  /**
   * Set custom context
   */
  static setContext(name: string, context: Record<string, any>) {
    Sentry.setContext(name, context);
  }
}

export default MonitoringService;
