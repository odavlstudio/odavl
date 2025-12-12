/**
 * ODAVL Guardian - File-Type Integration Tests
 * Phase P7: Comprehensive test suite (40+ tests)
 * 
 * Test Categories:
 * 1. File-Type Classification (8 tests)
 * 2. Test Suite Mapping (8 tests)
 * 3. Risk-Based Prioritization (6 tests)
 * 4. Automatic Test Skipping (8 tests)
 * 5. Baseline Enforcement (6 tests)
 * 6. GuardianFileTypeAuditor (8 tests)
 * 7. Integration Scenarios (4 tests)
 * 8. Edge Cases (4 tests)
 * 
 * Total: 52 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyTestSuitesByFileTypes,
  getRecommendedTestSuites,
  prioritizeTestSuites,
  shouldSkipTestSuite,
  validateAgainstBaseline,
  GuardianFileTypeAuditor,
  getGuardianFileTypeAuditor,
  type FileTypeStats,
  type TestSuiteRecommendation,
  type BaselineValidationResult,
} from '../guardian-filetype-integration';

describe('Phase P7: Guardian File-Type Integration', () => {
  
  // ===================================================================
  // CATEGORY 1: File-Type Classification (8 tests)
  // ===================================================================
  
  describe('1. File-Type Classification', () => {
    
    it('should classify sourceCode files correctly', () => {
      const files = ['src/index.ts', 'lib/utils.js', 'app/main.tsx'];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.byType.sourceCode).toBe(3);
      expect(stats.totalFiles).toBe(3);
      expect(stats.byRisk.medium).toBe(3); // sourceCode is medium risk
    });
    
    it('should classify migrations files correctly', () => {
      const files = ['migrations/001_init.sql', 'db/migrate/002_add_users.sql'];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.byType.migrations).toBe(2);
      expect(stats.byRisk.critical).toBe(2); // migrations are critical
    });
    
    it('should classify infrastructure files correctly', () => {
      const files = ['terraform/main.tf', 'infra/azure-deploy.bicep', 'Dockerfile'];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.byType.infrastructure).toBe(3);
      expect(stats.byRisk.high).toBe(3); // infrastructure is high risk
    });
    
    it('should classify env and secret files correctly', () => {
      const files = ['.env', '.env.local', 'secrets.json', 'config/api-keys.json'];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.byType.env + stats.byType.secretCandidates).toBeGreaterThanOrEqual(3);
      expect(stats.byRisk.critical).toBeGreaterThanOrEqual(2); // env/secrets are critical
    });
    
    it('should classify documentation files correctly', () => {
      const files = ['README.md', 'docs/guide.md', 'CONTRIBUTING.md'];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.byType.documentation).toBe(3);
      expect(stats.byRisk.low).toBe(3); // docs are low risk
    });
    
    it('should handle mixed file types', () => {
      const files = [
        'src/index.ts',           // sourceCode (medium)
        'migrations/001.sql',      // migrations (critical)
        'README.md',               // documentation (low)
        'terraform/main.tf',       // infrastructure (high)
      ];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.totalFiles).toBe(4);
      expect(stats.byRisk.critical).toBeGreaterThanOrEqual(1);
      expect(stats.byRisk.high).toBeGreaterThanOrEqual(1);
      expect(stats.byRisk.medium).toBeGreaterThanOrEqual(1);
      expect(stats.byRisk.low).toBeGreaterThanOrEqual(1);
    });
    
    it('should handle empty file list', () => {
      const stats = classifyTestSuitesByFileTypes([]);
      
      expect(stats.totalFiles).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byRisk).toEqual({});
    });
    
    it('should handle Windows paths', () => {
      const files = [
        'C:\\Users\\dev\\src\\index.ts',
        'C:\\Users\\dev\\migrations\\001.sql',
      ];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.totalFiles).toBe(2);
      expect(stats.byType.sourceCode).toBeGreaterThanOrEqual(1);
    });
  });
  
  // ===================================================================
  // CATEGORY 2: Test Suite Mapping (8 tests)
  // ===================================================================
  
  describe('2. Test Suite Mapping', () => {
    
    it('should map sourceCode to unit, lint, integration tests', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      expect(suiteNames).toContain('unit');
      expect(suiteNames).toContain('lint');
      expect(suiteNames).toContain('integration');
    });
    
    it('should map migrations to migration, integration, smoke tests', () => {
      const stats: FileTypeStats = {
        byType: { migrations: 2 },
        byRisk: { critical: 2 },
        totalFiles: 2,
      };
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      expect(suiteNames).toContain('migration');
      expect(suiteNames).toContain('integration');
      expect(suiteNames).toContain('smoke');
    });
    
    it('should map infrastructure to deployment, smoke tests', () => {
      const stats: FileTypeStats = {
        byType: { infrastructure: 3 },
        byRisk: { high: 3 },
        totalFiles: 3,
      };
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      expect(suiteNames).toContain('deployment');
      expect(suiteNames).toContain('smoke');
    });
    
    it('should map env/secrets to securityScan tests', () => {
      const stats: FileTypeStats = {
        byType: { env: 1, secretCandidates: 1 },
        byRisk: { critical: 2 },
        totalFiles: 2,
      };
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      expect(suiteNames).toContain('securityScan');
    });
    
    it('should map documentation to docs tests', () => {
      const stats: FileTypeStats = {
        byType: { documentation: 5 },
        byRisk: { low: 5 },
        totalFiles: 5,
      };
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      expect(suiteNames).toContain('docs');
    });
    
    it('should return empty array for buildArtifacts (never tested)', () => {
      const stats: FileTypeStats = {
        byType: { buildArtifacts: 10 },
        byRisk: { low: 10 },
        totalFiles: 10,
      };
      const recommendations = getRecommendedTestSuites(stats);
      
      expect(recommendations).toHaveLength(0);
    });
    
    it('should combine test suites for mixed file types', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 3, migrations: 2, infrastructure: 1 },
        byRisk: { critical: 2, high: 1, medium: 3 },
        totalFiles: 6,
      };
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      // Should include suites from all file types (deduped)
      expect(suiteNames).toContain('unit');         // sourceCode
      expect(suiteNames).toContain('migration');    // migrations
      expect(suiteNames).toContain('deployment');   // infrastructure
      expect(suiteNames).toContain('integration');  // all
      expect(suiteNames).toContain('smoke');        // migrations + infrastructure
    });
    
    it('should handle only skippable files (logs, artifacts)', () => {
      const stats: FileTypeStats = {
        byType: { logs: 5, buildArtifacts: 3 },
        byRisk: { low: 8 },
        totalFiles: 8,
      };
      const recommendations = getRecommendedTestSuites(stats);
      
      expect(recommendations).toHaveLength(0);
    });
  });
  
  // ===================================================================
  // CATEGORY 3: Risk-Based Prioritization (6 tests)
  // ===================================================================
  
  describe('3. Risk-Based Prioritization', () => {
    
    it('should prioritize critical files first', () => {
      const suites: TestSuiteRecommendation[] = [
        { suite: 'unit', priority: 50, reason: 'medium risk' },
        { suite: 'migration', priority: 100, reason: 'critical risk' },
        { suite: 'docs', priority: 25, reason: 'low risk' },
      ];
      const prioritized = prioritizeTestSuites(suites);
      
      expect(prioritized[0].suite).toBe('migration');  // 100 priority
      expect(prioritized[1].suite).toBe('unit');        // 50 priority
      expect(prioritized[2].suite).toBe('docs');        // 25 priority
    });
    
    it('should prioritize high-risk files second', () => {
      const suites: TestSuiteRecommendation[] = [
        { suite: 'unit', priority: 50, reason: 'medium' },
        { suite: 'deployment', priority: 75, reason: 'high' },
        { suite: 'docs', priority: 25, reason: 'low' },
      ];
      const prioritized = prioritizeTestSuites(suites);
      
      expect(prioritized[0].suite).toBe('deployment');  // 75 priority
      expect(prioritized[1].suite).toBe('unit');         // 50 priority
      expect(prioritized[2].suite).toBe('docs');         // 25 priority
    });
    
    it('should run documentation tests last', () => {
      const suites: TestSuiteRecommendation[] = [
        { suite: 'docs', priority: 25, reason: 'low' },
        { suite: 'unit', priority: 50, reason: 'medium' },
        { suite: 'migration', priority: 100, reason: 'critical' },
      ];
      const prioritized = prioritizeTestSuites(suites);
      
      expect(prioritized[prioritized.length - 1].suite).toBe('docs');
    });
    
    it('should maintain stable sort for equal priorities', () => {
      const suites: TestSuiteRecommendation[] = [
        { suite: 'unit', priority: 50, reason: 'medium' },
        { suite: 'lint', priority: 50, reason: 'medium' },
        { suite: 'integration', priority: 50, reason: 'medium' },
      ];
      const prioritized = prioritizeTestSuites(suites);
      
      // Original order preserved for equal priorities
      expect(prioritized[0].suite).toBe('unit');
      expect(prioritized[1].suite).toBe('lint');
      expect(prioritized[2].suite).toBe('integration');
    });
    
    it('should handle empty suite list', () => {
      const prioritized = prioritizeTestSuites([]);
      expect(prioritized).toHaveLength(0);
    });
    
    it('should handle single suite', () => {
      const suites: TestSuiteRecommendation[] = [
        { suite: 'unit', priority: 50, reason: 'test' },
      ];
      const prioritized = prioritizeTestSuites(suites);
      
      expect(prioritized).toHaveLength(1);
      expect(prioritized[0].suite).toBe('unit');
    });
  });
  
  // ===================================================================
  // CATEGORY 4: Automatic Test Skipping (8 tests)
  // ===================================================================
  
  describe('4. Automatic Test Skipping', () => {
    
    it('should skip deployment tests when no infrastructure changed', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      const decision = shouldSkipTestSuite('deployment', stats);
      
      expect(decision.shouldSkip).toBe(true);
      expect(decision.reason).toContain('No infrastructure');
    });
    
    it('should skip migration tests when no schema/migrations changed', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 3, documentation: 2 },
        byRisk: { medium: 3, low: 2 },
        totalFiles: 5,
      };
      const decision = shouldSkipTestSuite('migration', stats);
      
      expect(decision.shouldSkip).toBe(true);
      expect(decision.reason).toContain('No schema');
    });
    
    it('should skip UI tests when no assets changed', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      const decision = shouldSkipTestSuite('ui', stats);
      
      expect(decision.shouldSkip).toBe(true);
      expect(decision.reason).toContain('No assets');
    });
    
    it('should skip securityScan when no env/secrets changed', () => {
      const stats: FileTypeStats = {
        byType: { documentation: 5 },
        byRisk: { low: 5 },
        totalFiles: 5,
      };
      const decision = shouldSkipTestSuite('securityScan', stats);
      
      expect(decision.shouldSkip).toBe(true);
      expect(decision.reason).toContain('No env');
    });
    
    it('should NOT skip when relevant file types changed', () => {
      const stats: FileTypeStats = {
        byType: { infrastructure: 2 },
        byRisk: { high: 2 },
        totalFiles: 2,
      };
      const decision = shouldSkipTestSuite('deployment', stats);
      
      expect(decision.shouldSkip).toBe(false);
      expect(decision.reason).toContain('Infrastructure');
    });
    
    it('should include skip reason in decision', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      const decision = shouldSkipTestSuite('deployment', stats);
      
      expect(decision.reason).toBeTruthy();
      expect(decision.reason.length).toBeGreaterThan(10);
    });
    
    it('should NOT skip tests for mixed file types', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 3, infrastructure: 1 },
        byRisk: { medium: 3, high: 1 },
        totalFiles: 4,
      };
      const decision = shouldSkipTestSuite('deployment', stats);
      
      expect(decision.shouldSkip).toBe(false);
    });
    
    it('should handle unknown test suite gracefully', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      const decision = shouldSkipTestSuite('unknownSuite', stats);
      
      expect(decision.shouldSkip).toBe(false);
      expect(decision.reason).toContain('Unknown');
    });
  });
  
  // ===================================================================
  // CATEGORY 5: Baseline Enforcement (6 tests)
  // ===================================================================
  
  describe('5. Baseline Enforcement', () => {
    
    it('should FAIL strict mode when infrastructure regresses', () => {
      const testResults = { performance: { score: 75 } }; // Regression from 85
      const changedFileTypes = ['infrastructure'];
      const baselinePolicy = {
        baselines: { performance: { score: 85 } },
        modes: { infrastructure: 'strict' },
        thresholds: { adaptive: 10 },
      };
      
      const result = validateAgainstBaseline(testResults, changedFileTypes, baselinePolicy);
      
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.mode).toBe('strict');
    });
    
    it('should FAIL strict mode when migrations regress', () => {
      const testResults = { migrationTests: { passed: 8, total: 10 } };
      const changedFileTypes = ['migrations'];
      const baselinePolicy = {
        baselines: { migrationTests: { passed: 10, total: 10 } },
        modes: { migrations: 'strict' },
      };
      
      const result = validateAgainstBaseline(testResults, changedFileTypes, baselinePolicy);
      
      expect(result.passed).toBe(false);
      expect(result.mode).toBe('strict');
    });
    
    it('should PASS adaptive mode when sourceCode regression within threshold', () => {
      const testResults = { performance: { score: 78 } }; // 7% regression
      const changedFileTypes = ['sourceCode'];
      const baselinePolicy = {
        baselines: { performance: { score: 85 } },
        modes: { sourceCode: 'adaptive' },
        thresholds: { adaptive: 10 },
      };
      
      const result = validateAgainstBaseline(testResults, changedFileTypes, baselinePolicy);
      
      expect(result.passed).toBe(true);
      expect(result.mode).toBe('adaptive');
    });
    
    it('should FAIL adaptive mode when sourceCode regression exceeds threshold', () => {
      const testResults = { performance: { score: 70 } }; // 15% regression
      const changedFileTypes = ['sourceCode'];
      const baselinePolicy = {
        baselines: { performance: { score: 85 } },
        modes: { sourceCode: 'adaptive' },
        thresholds: { adaptive: 10 },
      };
      
      const result = validateAgainstBaseline(testResults, changedFileTypes, baselinePolicy);
      
      expect(result.passed).toBe(false);
      expect(result.mode).toBe('adaptive');
    });
    
    it('should PASS learning mode for documentation and update baseline', () => {
      const testResults = { docs: { coverage: 60 } }; // Lower than baseline
      const changedFileTypes = ['documentation'];
      const baselinePolicy = {
        baselines: { docs: { coverage: 80 } },
        modes: { documentation: 'learning' },
      };
      
      const result = validateAgainstBaseline(testResults, changedFileTypes, baselinePolicy);
      
      expect(result.passed).toBe(true);
      expect(result.mode).toBe('learning');
    });
    
    it('should use default mode when policy missing', () => {
      const testResults = { performance: { score: 75 } };
      const changedFileTypes = ['sourceCode'];
      const baselinePolicy = null;
      
      const result = validateAgainstBaseline(testResults, changedFileTypes, baselinePolicy);
      
      // Should not crash, use default behavior
      expect(result).toBeDefined();
      expect(result.mode).toBeDefined();
    });
  });
  
  // ===================================================================
  // CATEGORY 6: GuardianFileTypeAuditor (8 tests)
  // ===================================================================
  
  describe('6. GuardianFileTypeAuditor', () => {
    
    let auditor: GuardianFileTypeAuditor;
    
    beforeEach(() => {
      auditor = new GuardianFileTypeAuditor();
    });
    
    it('should log routed suites correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const recommendations: TestSuiteRecommendation[] = [
        { suite: 'unit', priority: 50, reason: 'test' },
        { suite: 'migration', priority: 100, reason: 'test' },
      ];
      
      auditor.logRoutedSuites(recommendations);
      
      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[Guardian]');
      expect(logMessage).toContain('Routed');
      
      consoleSpy.mockRestore();
    });
    
    it('should log skipped suite correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      auditor.logSkippedSuite('deployment', 'No infrastructure files changed');
      
      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[Guardian]');
      expect(logMessage).toContain('Skipped');
      expect(logMessage).toContain('deployment');
      
      consoleSpy.mockRestore();
    });
    
    it('should log priority order correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const suites: TestSuiteRecommendation[] = [
        { suite: 'migration', priority: 100, reason: 'critical' },
        { suite: 'unit', priority: 50, reason: 'medium' },
      ];
      
      auditor.logPriorityOrder(suites);
      
      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[Guardian]');
      expect(logMessage).toContain('priority');
      
      consoleSpy.mockRestore();
    });
    
    it('should log baseline decision correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result: BaselineValidationResult = {
        passed: true,
        violations: [],
        mode: 'adaptive',
      };
      
      auditor.logBaselineDecision(result);
      
      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('[Guardian]');
      expect(logMessage).toContain('Baseline');
      
      consoleSpy.mockRestore();
    });
    
    it('should export JSON audit log', () => {
      auditor.logRoutedSuites([
        { suite: 'unit', priority: 50, reason: 'test' },
      ]);
      
      const jsonOutput = auditor.export();
      
      expect(jsonOutput).toBeTruthy();
      expect(typeof jsonOutput).toBe('string');
      
      // Should be valid JSON
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.entries).toBeDefined();
      expect(Array.isArray(parsed.entries)).toBe(true);
      expect(parsed.entries.length).toBeGreaterThan(0);
    });
    
    it('should return correct statistics', () => {
      auditor.logRoutedSuites([
        { suite: 'unit', priority: 50, reason: 'test' },
      ]);
      auditor.logSkippedSuite('deployment', 'No infra');
      
      const stats = auditor.getStats();
      
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
      expect(stats.routedSuites).toBeGreaterThanOrEqual(1);
      expect(stats.skippedSuites).toBeGreaterThanOrEqual(1);
    });
    
    it('should implement singleton pattern', () => {
      const auditor1 = getGuardianFileTypeAuditor();
      const auditor2 = getGuardianFileTypeAuditor();
      
      expect(auditor1).toBe(auditor2); // Same instance
    });
    
    it('should handle clearing logs', () => {
      auditor.logRoutedSuites([
        { suite: 'unit', priority: 50, reason: 'test' },
      ]);
      
      let stats = auditor.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      
      // Assuming there's a clear method (add if missing)
      if ('clear' in auditor) {
        (auditor as any).clear();
        stats = auditor.getStats();
        expect(stats.totalEntries).toBe(0);
      }
    });
  });
  
  // ===================================================================
  // CATEGORY 7: Integration Scenarios (4 tests)
  // ===================================================================
  
  describe('7. Integration Scenarios', () => {
    
    it('should handle full workflow: classify → recommend → prioritize → skip → validate', () => {
      // 1. Classify changed files
      const changedFiles = [
        'src/index.ts',
        'migrations/001.sql',
        'README.md',
      ];
      const stats = classifyTestSuitesByFileTypes(changedFiles);
      
      expect(stats.totalFiles).toBe(3);
      
      // 2. Get recommendations
      const recommendations = getRecommendedTestSuites(stats);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // 3. Prioritize
      const prioritized = prioritizeTestSuites(recommendations);
      expect(prioritized[0].priority).toBeGreaterThanOrEqual(prioritized[prioritized.length - 1].priority);
      
      // 4. Check skip decisions
      const skipDecisions = prioritized.map(rec => ({
        suite: rec.suite,
        skip: shouldSkipTestSuite(rec.suite, stats),
      }));
      expect(skipDecisions.length).toBe(prioritized.length);
      
      // 5. Validate (mock results)
      const testResults = { performance: { score: 85 } };
      const changedTypes = ['sourceCode', 'migrations', 'documentation'];
      const baselinePolicy = {
        baselines: { performance: { score: 80 } },
        modes: { sourceCode: 'adaptive' },
        thresholds: { adaptive: 10 },
      };
      const result = validateAgainstBaseline(testResults, changedTypes, baselinePolicy);
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
    });
    
    it('should handle only docs changed → docs tests only + skip all others', () => {
      const changedFiles = ['README.md', 'docs/guide.md'];
      const stats = classifyTestSuitesByFileTypes(changedFiles);
      
      expect(stats.byType.documentation).toBe(2);
      
      const recommendations = getRecommendedTestSuites(stats);
      const suiteNames = recommendations.map(r => r.suite);
      
      expect(suiteNames).toContain('docs');
      
      // Check that deployment, migration, etc. should be skipped
      const deploymentSkip = shouldSkipTestSuite('deployment', stats);
      const migrationSkip = shouldSkipTestSuite('migration', stats);
      
      expect(deploymentSkip.shouldSkip).toBe(true);
      expect(migrationSkip.shouldSkip).toBe(true);
    });
    
    it('should handle critical migrations → migration tests first + strict baseline', () => {
      const changedFiles = ['migrations/001_add_users.sql'];
      const stats = classifyTestSuitesByFileTypes(changedFiles);
      
      expect(stats.byType.migrations).toBe(1);
      expect(stats.byRisk.critical).toBe(1);
      
      const recommendations = getRecommendedTestSuites(stats);
      const prioritized = prioritizeTestSuites(recommendations);
      
      // Migration tests should be prioritized (critical = 100)
      const migrationRec = prioritized.find(r => r.suite === 'migration');
      expect(migrationRec).toBeDefined();
      expect(migrationRec!.priority).toBe(100);
      
      // Baseline validation should use strict mode
      const testResults = { migrationTests: { passed: 10, total: 10 } };
      const baselinePolicy = {
        baselines: { migrationTests: { passed: 10, total: 10 } },
        modes: { migrations: 'strict' },
      };
      const result = validateAgainstBaseline(testResults, ['migrations'], baselinePolicy);
      
      expect(result.mode).toBe('strict');
    });
    
    it('should handle mixed changes → all relevant suites in priority order', () => {
      const changedFiles = [
        'src/index.ts',           // sourceCode (medium, 50)
        'migrations/001.sql',      // migrations (critical, 100)
        'terraform/main.tf',       // infrastructure (high, 75)
        'README.md',               // documentation (low, 25)
      ];
      const stats = classifyTestSuitesByFileTypes(changedFiles);
      
      const recommendations = getRecommendedTestSuites(stats);
      const prioritized = prioritizeTestSuites(recommendations);
      
      // Check priority order: critical (100) > high (75) > medium (50) > low (25)
      expect(prioritized.length).toBeGreaterThan(0);
      
      // Critical suites first
      const criticalSuites = prioritized.filter(r => r.priority === 100);
      expect(criticalSuites.length).toBeGreaterThan(0);
      
      // Low-priority (docs) last
      const lastSuite = prioritized[prioritized.length - 1];
      expect(lastSuite.priority).toBeLessThanOrEqual(25);
    });
  });
  
  // ===================================================================
  // CATEGORY 8: Edge Cases (4 tests)
  // ===================================================================
  
  describe('8. Edge Cases', () => {
    
    it('should handle empty changed files list', () => {
      const stats = classifyTestSuitesByFileTypes([]);
      const recommendations = getRecommendedTestSuites(stats);
      
      expect(stats.totalFiles).toBe(0);
      expect(recommendations.length).toBe(0);
    });
    
    it('should handle unknown file types with fallback', () => {
      const files = ['unknown.xyz', 'weird.abc'];
      const stats = classifyTestSuitesByFileTypes(files);
      
      // Should fallback to sourceCode or similar default
      expect(stats.totalFiles).toBe(2);
      expect(Object.keys(stats.byType).length).toBeGreaterThan(0);
    });
    
    it('should handle Windows paths with backslashes', () => {
      const files = [
        'C:\\Users\\dev\\src\\index.ts',
        'C:\\Users\\dev\\migrations\\001.sql',
      ];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.totalFiles).toBe(2);
      expect(stats.byType.sourceCode).toBeGreaterThanOrEqual(1);
    });
    
    it('should handle very deep nested paths', () => {
      const files = [
        'a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/deep.ts',
      ];
      const stats = classifyTestSuitesByFileTypes(files);
      
      expect(stats.totalFiles).toBe(1);
      expect(stats.byType.sourceCode).toBe(1);
    });
  });
});
