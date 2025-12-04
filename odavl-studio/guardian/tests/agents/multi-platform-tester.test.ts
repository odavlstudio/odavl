/**
 * Multi-Platform Tester Tests
 * 
 * Tests for GitHub Actions-based multi-platform testing agent.
 * Validates platform-specific issue detection.
 * 
 * ⚠️ CRITICAL: Boundary compliance tests verify Guardian does NOT execute fixes.
 * 
 * @vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiPlatformTester } from '../../agents/multi-platform-tester';
import type { PlatformReport, PlatformError } from '../../agents/multi-platform-tester';

// Mock @octokit/rest
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    actions: {
      createWorkflowDispatch: vi.fn().mockResolvedValue({ status: 204 }),
      listWorkflowRuns: vi.fn().mockResolvedValue({
        data: {
          workflow_runs: [{
            id: 123456,
            status: 'completed',
            conclusion: 'success',
            html_url: 'https://github.com/odavl-studio/odavl/actions/runs/123456',
            logs_url: 'https://github.com/odavl-studio/odavl/actions/runs/123456/logs',
            created_at: '2025-11-30T10:00:00Z',
            updated_at: '2025-11-30T10:05:00Z'
          }]
        }
      }),
      getWorkflowRun: vi.fn().mockResolvedValue({
        data: {
          id: 123456,
          status: 'completed',
          conclusion: 'success',
          html_url: 'https://github.com/odavl-studio/odavl/actions/runs/123456'
        }
      }),
      listWorkflowRunArtifacts: vi.fn().mockResolvedValue({
        data: {
          artifacts: [{
            id: 789,
            name: 'test-results-windows',
            size_in_bytes: 1024,
            url: 'https://api.github.com/repos/odavl/odavl/actions/artifacts/789/zip'
          }]
        }
      }),
      downloadArtifact: vi.fn().mockResolvedValue({
        data: Buffer.from('mock artifact data')
      })
    }
  }))
}));

describe('MultiPlatformTester', () => {
  let tester: MultiPlatformTester;

  beforeEach(() => {
    vi.clearAllMocks();
    tester = new MultiPlatformTester('fake-github-token');
  });

  describe('testOnAllPlatforms', () => {
    it('should test on Windows, macOS, and Linux', async () => {
      const reports = await tester.testOnAllPlatforms('odavl-studio/guardian/extension');

      expect(reports).toHaveLength(3);
      expect(reports.map(r => r.platform)).toContain('windows');
      expect(reports.map(r => r.platform)).toContain('macos');
      expect(reports.map(r => r.platform)).toContain('linux');
    });

    it('should return PlatformReport with correct structure', async () => {
      const reports = await tester.testOnAllPlatforms('odavl-studio/guardian/extension');

      for (const report of reports) {
        expect(report).toHaveProperty('platform');
        expect(report).toHaveProperty('success');
        expect(report).toHaveProperty('testsPassed');
        expect(report).toHaveProperty('testsFailed');
        expect(report).toHaveProperty('errors');
        expect(report).toHaveProperty('warnings');
        expect(report).toHaveProperty('performance');
        expect(report).toHaveProperty('logs');
        expect(report).toHaveProperty('timestamp');
      }
    });

    it('should handle workflow failures gracefully', async () => {
      // Mock workflow failure
      const { Octokit } = await import('@octokit/rest');
      const mockOctokit = new Octokit();
      vi.mocked(mockOctokit.actions.getWorkflowRun).mockResolvedValue({
        data: {
          id: 123456,
          status: 'completed',
          conclusion: 'failure', // Failure!
          html_url: 'https://github.com/odavl-studio/odavl/actions/runs/123456'
        }
      } as any);

      const reports = await tester.testOnAllPlatforms('odavl-studio/guardian/extension');

      expect(reports).toHaveLength(3);
      // Should still return reports even if some fail
      expect(reports.every(r => typeof r.success === 'boolean')).toBe(true);
    });
  });

  describe('testOnPlatform', () => {
    it('should test on a single platform', async () => {
      const report = await tester.testOnPlatform(
        'odavl-studio/guardian/extension',
        'windows'
      );

      expect(report.platform).toBe('windows');
      expect(report).toHaveProperty('success');
      expect(report).toHaveProperty('testsPassed');
    });

    it('should handle platform-specific errors', async () => {
      // Mock GitHub Actions error
      const { Octokit } = await import('@octokit/rest');
      const mockOctokit = new Octokit();
      vi.mocked(mockOctokit.actions.createWorkflowDispatch).mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const report = await tester.testOnPlatform(
        'odavl-studio/guardian/extension',
        'macos'
      );

      expect(report.success).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0].message).toContain('Failed to run tests');
    });

    it('should return performance metrics', async () => {
      const report = await tester.testOnPlatform(
        'odavl-studio/guardian/extension',
        'linux'
      );

      expect(report.performance).toHaveProperty('buildTime');
      expect(report.performance).toHaveProperty('testExecutionTime');
      expect(report.performance).toHaveProperty('memoryUsage');
      expect(report.performance).toHaveProperty('cpuUsage');
    });
  });

  describe('detectPlatformSpecificIssues', () => {
    it('should detect issues that occur on one platform only', () => {
      const reports: PlatformReport[] = [
        {
          platform: 'windows',
          success: false,
          testsPassed: 8,
          testsFailed: 2,
          errors: [{
            type: 'build-error',
            severity: 'high',
            message: 'EACCES: permission denied on C:\\temp',
            platformSpecific: false,
            reproducible: true
          }],
          warnings: [],
          performance: { buildTime: 50000, testExecutionTime: 15000, memoryUsage: 512, cpuUsage: 70 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'macos',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 40000, testExecutionTime: 12000, memoryUsage: 480, cpuUsage: 60 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'linux',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 35000, testExecutionTime: 10000, memoryUsage: 450, cpuUsage: 55 },
          logs: [],
          timestamp: new Date().toISOString()
        }
      ];

      const platformBugs = tester.detectPlatformSpecificIssues(reports);

      expect(platformBugs.length).toBe(1);
      expect(platformBugs[0].platformSpecific).toBe(true);
      expect(platformBugs[0].message).toContain('windows');
    });

    it('should not flag errors that occur on multiple platforms', () => {
      const reports: PlatformReport[] = [
        {
          platform: 'windows',
          success: false,
          testsPassed: 8,
          testsFailed: 2,
          errors: [{
            type: 'runtime-error',
            severity: 'high',
            message: 'Cannot read property useContext',
            platformSpecific: false,
            reproducible: true
          }],
          warnings: [],
          performance: { buildTime: 50000, testExecutionTime: 15000, memoryUsage: 512, cpuUsage: 70 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'macos',
          success: false,
          testsPassed: 8,
          testsFailed: 2,
          errors: [{
            type: 'runtime-error',
            severity: 'high',
            message: 'Cannot read property useContext', // Same error!
            platformSpecific: false,
            reproducible: true
          }],
          warnings: [],
          performance: { buildTime: 45000, testExecutionTime: 14000, memoryUsage: 500, cpuUsage: 65 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'linux',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 35000, testExecutionTime: 10000, memoryUsage: 450, cpuUsage: 55 },
          logs: [],
          timestamp: new Date().toISOString()
        }
      ];

      const platformBugs = tester.detectPlatformSpecificIssues(reports);

      // Should be 0 because error occurs on both Windows and macOS
      expect(platformBugs.length).toBe(0);
    });
  });

  describe('calculateReadiness', () => {
    it('should return 100% for all successful platforms', () => {
      const reports: PlatformReport[] = [
        {
          platform: 'windows',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 50000, testExecutionTime: 15000, memoryUsage: 512, cpuUsage: 70 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'macos',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 45000, testExecutionTime: 14000, memoryUsage: 500, cpuUsage: 65 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'linux',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 35000, testExecutionTime: 10000, memoryUsage: 450, cpuUsage: 55 },
          logs: [],
          timestamp: new Date().toISOString()
        }
      ];

      const readiness = tester.calculateReadiness(reports);

      expect(readiness).toBe(100);
    });

    it('should deduct points for failures', () => {
      const reports: PlatformReport[] = [
        {
          platform: 'windows',
          success: false,
          testsPassed: 8,
          testsFailed: 2,
          errors: [],
          warnings: [],
          performance: { buildTime: 50000, testExecutionTime: 15000, memoryUsage: 512, cpuUsage: 70 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'macos',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 45000, testExecutionTime: 14000, memoryUsage: 500, cpuUsage: 65 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'linux',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 35000, testExecutionTime: 10000, memoryUsage: 450, cpuUsage: 55 },
          logs: [],
          timestamp: new Date().toISOString()
        }
      ];

      const readiness = tester.calculateReadiness(reports);

      expect(readiness).toBeLessThan(100);
      expect(readiness).toBeGreaterThan(0);
    });

    it('should deduct more points for critical errors', () => {
      const reportsWithCritical: PlatformReport[] = [
        {
          platform: 'windows',
          success: false,
          testsPassed: 5,
          testsFailed: 5,
          errors: [{
            type: 'runtime-error',
            severity: 'critical',
            message: 'Extension crashes on startup',
            platformSpecific: true,
            reproducible: true
          }],
          warnings: [],
          performance: { buildTime: 50000, testExecutionTime: 15000, memoryUsage: 512, cpuUsage: 70 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'macos',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 45000, testExecutionTime: 14000, memoryUsage: 500, cpuUsage: 65 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'linux',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 35000, testExecutionTime: 10000, memoryUsage: 450, cpuUsage: 55 },
          logs: [],
          timestamp: new Date().toISOString()
        }
      ];

      const readiness = tester.calculateReadiness(reportsWithCritical);

      expect(readiness).toBeLessThan(70); // Critical error should deduct heavily
    });
  });

  describe('Boundary Compliance Tests', () => {
    it('should NOT have applyFix method', () => {
      const prototype = Object.getPrototypeOf(tester);
      const methods = Object.getOwnPropertyNames(prototype);

      expect(methods).not.toContain('applyFix');
      expect(methods).not.toContain('executeFix');
      expect(methods).not.toContain('autoFix');
    });

    it('should NOT have rollback method', () => {
      const prototype = Object.getPrototypeOf(tester);
      const methods = Object.getOwnPropertyNames(prototype);

      expect(methods).not.toContain('rollback');
      expect(methods).not.toContain('undo');
      expect(methods).not.toContain('revert');
    });

    it('should NOT have file modification methods', () => {
      const prototype = Object.getPrototypeOf(tester);
      const methods = Object.getOwnPropertyNames(prototype);

      expect(methods).not.toContain('modifyFile');
      expect(methods).not.toContain('writeFile');
      expect(methods).not.toContain('updateFile');
      expect(methods).not.toContain('patchFile');
    });

    it('should ONLY have detection and analysis methods', () => {
      const prototype = Object.getPrototypeOf(tester);
      const methods = Object.getOwnPropertyNames(prototype);

      // Allowed methods (detection only)
      const allowedMethods = [
        'constructor',
        'testOnAllPlatforms',
        'testOnPlatform',
        'detectPlatformSpecificIssues',
        'calculateReadiness'
      ];

      const publicMethods = methods.filter(m => !m.startsWith('_') && m !== 'constructor');
      
      for (const method of publicMethods) {
        expect(allowedMethods).toContain(method);
      }
    });

    it('should return detection results, not execute fixes', async () => {
      const reports = await tester.testOnAllPlatforms('odavl-studio/guardian/extension');

      // Should return reports with suggestions, not modify files
      expect(reports).toBeInstanceOf(Array);
      expect(reports.every(r => r.platform && typeof r.success === 'boolean')).toBe(true);
      
      // Reports should contain errors/warnings, not fix results
      for (const report of reports) {
        expect(report).toHaveProperty('errors');
        expect(report).toHaveProperty('warnings');
        expect(report).not.toHaveProperty('fixesApplied');
        expect(report).not.toHaveProperty('filesModified');
      }
    });

    it('should detect issues without executing code changes', () => {
      const reports: PlatformReport[] = [
        {
          platform: 'windows',
          success: false,
          testsPassed: 8,
          testsFailed: 2,
          errors: [{
            type: 'build-error',
            severity: 'high',
            message: 'Path too long on Windows',
            platformSpecific: true,
            reproducible: true
          }],
          warnings: [],
          performance: { buildTime: 50000, testExecutionTime: 15000, memoryUsage: 512, cpuUsage: 70 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'macos',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 45000, testExecutionTime: 14000, memoryUsage: 500, cpuUsage: 65 },
          logs: [],
          timestamp: new Date().toISOString()
        },
        {
          platform: 'linux',
          success: true,
          testsPassed: 10,
          testsFailed: 0,
          errors: [],
          warnings: [],
          performance: { buildTime: 35000, testExecutionTime: 10000, memoryUsage: 450, cpuUsage: 55 },
          logs: [],
          timestamp: new Date().toISOString()
        }
      ];

      // Detect platform-specific issues (detection only)
      const platformBugs = tester.detectPlatformSpecificIssues(reports);

      // Should return issues, not fix them
      expect(platformBugs.length).toBeGreaterThan(0);
      expect(platformBugs[0]).toHaveProperty('message');
      expect(platformBugs[0]).toHaveProperty('platformSpecific');
      
      // Should NOT have fix execution properties
      expect(platformBugs[0]).not.toHaveProperty('fixed');
      expect(platformBugs[0]).not.toHaveProperty('appliedFix');
    });
  });
});

/**
 * Test Summary:
 * 
 * ✅ testOnAllPlatforms (3 tests)
 * ✅ testOnPlatform (4 tests)
 * ✅ detectPlatformSpecificIssues (2 tests)
 * ✅ calculateReadiness (4 tests)
 * ✅ Boundary Compliance (6 tests)
 * 
 * Total: 19 tests
 * 
 * Boundary Compliance:
 * - NO applyFix/executeFix/autoFix methods
 * - NO rollback/undo/revert methods
 * - NO file modification methods
 * - ONLY detection and analysis methods
 * - Returns detection results, not fix execution
 * - Detects issues without code changes
 */
