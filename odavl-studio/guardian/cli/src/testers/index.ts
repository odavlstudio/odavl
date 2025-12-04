/**
 * Guardian v5.0 - Product-Specific Testers
 * 
 * Central export for all specialized testers:
 * - Website Tester: Visual regression, multi-device, Core Web Vitals
 * - Extension Tester: VS Code marketplace, security scanning, telemetry
 * - CLI Tester: Auto-completion, update mechanism, cross-platform
 * - Package Tester: Exports validation, bundle analysis, breaking changes
 * - Monorepo Tester: Suite-wide testing, dependency graph, impact analysis
 */

// Website Testing
export { 
  WebsiteTester, 
  testWebsite,
  type WebsiteTestResult,
  type WebsiteTestOptions,
} from './website-tester.js';

// Extension Testing
export { 
  ExtensionTester,
  testExtension,
  type ExtensionTestResult,
  type ExtensionTestOptions,
} from './extension-tester.js';

// CLI Testing
export { 
  CLITester,
  testCLI,
  type CLITestResult,
  type CLITestOptions,
} from './cli-tester.js';

// Package Testing
export { 
  PackageTester,
  testPackage,
  type PackageTestResult,
  type PackageTestOptions,
} from './package-tester.js';

// Monorepo Testing
export { 
  MonorepoTester,
  testMonorepo,
  type MonorepoTestResult,
} from './monorepo-tester.js';

/**
 * Auto-detect product type and run appropriate tester (with metadata wrapper)
 */
export { autoTest, type AutoTestResult } from './auto-detect.js';

/**
 * Get tester instance for specific product type
 */
export { getTester, type TesterType, type TesterInstance } from './tester-factory.js';
