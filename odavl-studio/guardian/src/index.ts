/**
 * ODAVL Guardian - Launch Validation System
 * Main entry point
 * 
 * ⚠️ BOUNDARY ENFORCEMENT (Dec 2025):
 * Guardian = Website Testing ONLY
 * - Removed: inspectors/ (code analysis - violation)
 * - Removed: fixers/ (code fixing - violation)
 * - Focus: Lighthouse, accessibility, performance, visual regression
 */

// export * from '../inspectors/index.js'; // ❌ REMOVED: Code analysis violates Guardian boundaries
// export * from '../fixers/index.js'; // ❌ REMOVED: Code fixing violates Guardian boundaries
export * from '../core/index.js';
