/**
 * ODAVL Guardian - File-Type Integration Module
 * Phase P7: Export all file-type aware test routing functionality
 * 
 * This module provides intelligent test routing based on file types:
 * - Maps file types to relevant test suites (12 mappings)
 * - Prioritizes tests by risk level (critical=100 → low=25)
 * - Automatically skips irrelevant tests
 * - Enforces baseline with file-type sensitivity (strict/adaptive/learning)
 * - Full audit logging with color-coded output + JSON export
 */

export {
  // Core Functions
  classifyTestSuitesByFileTypes,
  getRecommendedTestSuites,
  prioritizeTestSuites,
  shouldSkipTestSuite,
  validateAgainstBaseline,
  
  // Audit Logging
  GuardianFileTypeAuditor,
  getGuardianFileTypeAuditor,
  
  // Types
  type FileTypeStats,
  // type TestSuiteRecommendation,
  // type SkipDecision,
  type BaselineValidation as BaselineValidationResult,
  // type AuditEntry,
  // type AuditStats,
} from './guardian-filetype-integration';
