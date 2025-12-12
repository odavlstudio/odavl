/**
 * ODAVL Studio SDK
 * Official SDK for integrating ODAVL Studio products into your applications
 * 
 * Phase 3C: Cloud-ready SDK with auto-detection
 * - Local OPLayer → Direct protocol access (fastest)
 * - Cloud API → HTTP fallback (works anywhere)
 */

export * from './insight.js';
export * from './autopilot.js';
export * from './guardian.js';

// Phase 7: Insight Cloud SDK (API client for cloud backend)
// Note: Not exported from main entry to avoid type conflicts with local SDK
// Use: import { createInsightClient } from '@odavl-studio/sdk/insight-cloud';
export { createInsightClient, InsightCloudClient } from './insight-cloud.js';

// Re-export main classes for convenience
export { Insight } from './insight.js';
export { Autopilot } from './autopilot.js';
export { Guardian } from './guardian.js';

// Import for local use in initODAVL (deprecated function)
import { Insight } from './insight.js';
import { Autopilot } from './autopilot.js';
import { Guardian } from './guardian.js';

// Phase 3C: Export Smart Client (auto-detection layer)
export * from './smart-client.js';
export * from './cloud-client.js';
export { SmartClient, getSmartClient } from './smart-client.js';
export { CloudClient, getCloudClient } from './cloud-client.js';

/**
 * SDK Version
 */
export const SDK_VERSION = '2.0.0'; // Phase 3C: Cloud separation

/**
 * SDK Configuration
 */
export interface ODAVLConfig {
    apiKey?: string;
    apiUrl?: string;
    timeout?: number;
    retries?: number;
    
    // Phase 3C: Cloud URLs
    insightUrl?: string;
    guardianUrl?: string;
    autopilotUrl?: string;
    
    // Phase 3C: Prefer local or cloud
    preferLocal?: boolean;
    forceCloud?: boolean;
}

/**
 * Initialize ODAVL Studio SDK (Legacy - use getSmartClient instead)
 * Returns instances of all three products
 * 
 * @deprecated Use getSmartClient() for auto-detection with cloud fallback
 */
export function initODAVL(config: ODAVLConfig = {}) {
    // Use standard ESM imports (already imported at top) to avoid webpack issues
    // Note: Each product has its own config interface, using type assertion for legacy compatibility
    return {
        version: SDK_VERSION,
        config,
        insight: new Insight(config as any),
        autopilot: new Autopilot(config as any),
        guardian: new Guardian(config as any),
    };
}
