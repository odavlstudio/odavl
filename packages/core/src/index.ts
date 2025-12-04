/**
 * ODAVL Studio Core Utilities
 */

// Auth middleware requires Next.js as peer dependency
// Import separately when needed: import { authMiddleware } from '@odavl-studio/core/auth'
// export * from './auth-middleware.js';

// Export new UX utilities
export * from './enhanced-errors.js';
export * from './progress.js';
export * from './cli-help.js';

/**
 * Shared constants
 */
export const ODAVL_VERSION = '1.0.0';
export const ODAVL_API_URL = process.env.ODAVL_API_URL || 'https://api.odavl.studio';

/**
 * Utility functions
 */
export function formatDate(date: Date): string {
    return date.toISOString();
}

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
