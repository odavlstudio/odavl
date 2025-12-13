/**
 * Conditional logging utility
 * Prevents DEBUG_INFO_LEAK security issues by gating logs in production
 */

const isDebugMode = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

export const logger = {
    debug(...args: any[]): void {
        if (isDebugMode) {
            console.log('[DEBUG]', ...args);
        }
    },

    info(...args: any[]): void {
        if (isDebugMode) {
            console.info('[INFO]', ...args);
        }
    },

    warn(...args: any[]): void {
        // Always show warnings (important)
        console.warn('[WARN]', ...args);
    },

    error(...args: any[]): void {
        // Always show errors (critical)
        console.error('[ERROR]', ...args);
    },

    success(...args: any[]): void {
        if (isDebugMode) {
            console.log('✅', ...args);
        }
    }
};
