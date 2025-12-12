/**
 * @odavl/oplayer - ODAVL Protocol Layer
 * Main entry point for all OPLayer exports
 */

// Re-export protocols
export * from './protocols.js';

// Re-export types
export * from './types.js';

// Re-export utilities
export * from './utilities.js';

// Re-export client (singleton)
export { ODAVLClient, client } from './client.js';
export type { ClientOptions } from './client.js';

// Re-export GitHub integration
export { GitHubIntegration, github } from './github.js';
export type { GitHubUser, GitHubRepository, GitHubOAuthOptions } from './github.js';

// Re-export adapters (for registration)
export { InsightCoreAnalysisAdapter } from './adapters/insight-core-analysis.js';
export { InsightCorePatternMemoryAdapter } from './adapters/insight-core-pattern-memory.js';
export { GuardianPlaywrightAdapter } from './adapters/guardian-playwright-adapter.js';

// Version info
export const OPLAYER_VERSION = '1.0.0';
