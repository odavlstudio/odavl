/**
 * ODAVL Studio SDK
 * Official SDK for integrating ODAVL Studio products into your applications
 */

export * from './insight';
export * from './autopilot';
export * from './guardian';

// Re-export main classes for convenience
export { Insight } from './insight';
export { Autopilot } from './autopilot';
export { Guardian } from './guardian';

/**
 * SDK Version
 */
export const SDK_VERSION = '1.0.0';

/**
 * SDK Configuration
 */
export interface ODAVLConfig {
    apiKey?: string;
    apiUrl?: string;
    timeout?: number;
    retries?: number;
}

/**
 * Initialize ODAVL Studio SDK
 * Returns instances of all three products
 */
export function initODAVL(config: ODAVLConfig = {}) {
    return {
        version: SDK_VERSION,
        config,
        insight: new (require('./insight').Insight)(config),
        autopilot: new (require('./autopilot').Autopilot)(config),
        guardian: new (require('./guardian').Guardian)(config),
    };
}
