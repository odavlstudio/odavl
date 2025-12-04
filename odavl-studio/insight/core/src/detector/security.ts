/**
 * ODAVL Insight - Security Detector (Standalone Entry)
 * Lightweight import for security-specific detection
 * Bundle size: ~800 KB (vs 10 MB for full detector bundle)
 */

export { SecurityDetector } from './security-detector.js';
export type { SecurityError, SecurityErrorType } from './security-detector.js';

// Context-aware security (v3.0)
export { ContextAwareSecurityDetector } from './context-aware-security-v3.js';

// Smart security scanner (Phase 1 Enhanced)
export { SmartSecurityScanner } from './smart-security-scanner.js';
export type { SecurityIssue as SmartSecurityIssue } from './smart-security-scanner.js';
