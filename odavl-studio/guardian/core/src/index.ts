/**
 * ODAVL Guardian Core
 * Pre-deploy testing: Accessibility, Performance, Security
 * 
 * Week 1: Browser Automation & Error Detection
 * Week 12: Launch Validator v3.0
 */

// Browser automation
export { BrowserManager } from './browser-manager';
export { TestOrchestrator } from './test-orchestrator';
export { ReportGenerator } from './report-generator';

// Detectors
export { WhiteScreenDetector } from './detectors/white-screen';
export { NotFoundDetector } from './detectors/404-error';
export { ConsoleErrorDetector } from './detectors/console-error';
export { ReactErrorDetector } from './detectors/react-error';
export { PerformanceDetector } from './detectors/performance';
export { AccessibilityDetector } from './detectors/accessibility';
export { SecurityDetector } from './detectors/security';
export { SEODetector } from './detectors/seo';
export { MobileDetector } from './detectors/mobile';

// Types
export type { Issue } from './detectors/white-screen';
export type { TestConfig, TestReport } from './test-orchestrator';
export type { ReportOptions } from './report-generator';

// Launch Validator v3.0 (NEW)
export { LaunchValidator } from './launch-validator.js';
export { AutopilotBridge } from './autopilot-bridge.js';
export { BackupSystem } from './backup-system.js';
export type { ProductType, ValidationResult } from './launch-validator.js';
export type { Backup, BackupFile } from './backup-system.js';

// Legacy exports (Week 11)
export { testAccessibility } from './tests/accessibility-test.js';
export { testPerformance } from './tests/performance-test.js';
export { testSecurity } from './tests/security-test.js';

export type {
  AccessibilityResult,
  PerformanceResult,
  SecurityResult,
  TestSuite,
  GuardianReport,
} from './types.js';
