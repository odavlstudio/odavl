"use strict";
/**
 * ODAVL Insight Logger
 * Conditionally logs based on DEBUG environment variable
 * Prevents DEBUG_INFO_LEAK security issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isDebugMode = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
exports.logger = {
    /**
     * Debug logging - only in DEBUG mode
     */
    debug(...args) {
        if (isDebugMode) {
            exports.logger.debug('[DEBUG]', ...args);
        }
    },
    /**
     * Info logging - only in DEBUG mode
     */
    info(...args) {
        if (isDebugMode) {
            exports.logger.info('[INFO]', ...args);
        }
    },
    /**
     * Warning logging - always shown
     */
    warn(...args) {
        exports.logger.warn('[WARN]', ...args);
    },
    /**
     * Error logging - always shown
     */
    error(...args) {
        exports.logger.error('[ERROR]', ...args);
    },
    /**
     * Success logging - only in DEBUG mode
     */
    success(...args) {
        if (isDebugMode) {
            exports.logger.debug('✅', ...args);
        }
    }
};
//# sourceMappingURL=logger.js.map