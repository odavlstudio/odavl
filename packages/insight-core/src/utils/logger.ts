/**
 * ODAVL Insight Logger
 * Conditionally logs based on DEBUG environment variable
 * Prevents DEBUG_INFO_LEAK security issues
 */

const isDebugMode = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Debug logging - only in DEBUG mode
     */
    debug(...args: any[]): void {
        if (isDebugMode) {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Info logging - only in DEBUG mode
     */
    info(...args: any[]): void {
        if (isDebugMode) {
            console.log('[INFO]', ...args);
        }
    },

    /**
     * Warning logging - always shown
     */
    warn(...args: any[]): void {
        console.warn('[WARN]', ...args);
    },

    /**
     * Error logging - always shown
     */
    error(...args: any[]): void {
        console.error('[ERROR]', ...args);
    },

    /**
     * Success logging - only in DEBUG mode
     */
    success(...args: any[]): void {
        if (isDebugMode) {
            console.log('✅', ...args);
        }
    }
};
