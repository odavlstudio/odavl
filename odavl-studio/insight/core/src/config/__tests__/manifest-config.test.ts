/**
 * ODAVL Insight - Manifest Configuration Tests
 * Phase P3 Task 5: Unit tests for enforcement functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getActiveDetectors,
  shouldReportSeverity,
  applyMaxFilesLimit,
  isSuppressedByFalsePositiveRules,
} from '../manifest-config';

// Mock the manifest module
vi.mock('@odavl/core/manifest', () => ({
  manifest: {} as any,
}));

describe('Insight Manifest Enforcement', () => {
  let mockManifest: any;

  beforeEach(async () => {
    // Reset manifest before each test
    const { manifest } = await import('@odavl/core/manifest');
    mockManifest = manifest;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveDetectors()', () => {
    it('should return only enabled detectors', () => {
      mockManifest.insight = {
        enabled: ['typescript', 'eslint', 'security'],
        disabled: ['performance'],
      };

      const active = getActiveDetectors();

      expect(active).toEqual(['typescript', 'eslint', 'security']);
      expect(active).not.toContain('performance');
    });

    it('should exclude disabled detectors from enabled list', () => {
      mockManifest.insight = {
        enabled: ['typescript', 'eslint', 'performance'],
        disabled: ['performance'],
      };

      const active = getActiveDetectors();

      expect(active).toEqual(['typescript', 'eslint']);
      expect(active).not.toContain('performance');
    });

    it('should return all detectors if no config provided (fail-safe)', () => {
      mockManifest.insight = undefined;

      const active = getActiveDetectors();

      expect(active.length).toBeGreaterThan(0);
      expect(active).toContain('typescript');
      expect(active).toContain('eslint');
    });

    it('should handle corrupt manifest gracefully', () => {
      mockManifest.insight = { enabled: 'not-an-array' }; // Invalid type

      expect(() => getActiveDetectors()).not.toThrow();
      const active = getActiveDetectors();
      expect(Array.isArray(active)).toBe(true);
    });
  });

  describe('shouldReportSeverity()', () => {
    it('should allow critical severity issues', () => {
      mockManifest.insight = { minSeverity: 'medium' };

      expect(shouldReportSeverity('critical')).toBe(true);
    });

    it('should allow high severity when minSeverity is medium', () => {
      mockManifest.insight = { minSeverity: 'medium' };

      expect(shouldReportSeverity('high')).toBe(true);
    });

    it('should block low severity when minSeverity is medium', () => {
      mockManifest.insight = { minSeverity: 'medium' };

      expect(shouldReportSeverity('low')).toBe(false);
    });

    it('should allow all severities when minSeverity is low (default)', () => {
      mockManifest.insight = { minSeverity: 'low' };

      expect(shouldReportSeverity('critical')).toBe(true);
      expect(shouldReportSeverity('high')).toBe(true);
      expect(shouldReportSeverity('medium')).toBe(true);
      expect(shouldReportSeverity('low')).toBe(true);
    });

    it('should only allow critical when minSeverity is critical', () => {
      mockManifest.insight = { minSeverity: 'critical' };

      expect(shouldReportSeverity('critical')).toBe(true);
      expect(shouldReportSeverity('high')).toBe(false);
      expect(shouldReportSeverity('medium')).toBe(false);
      expect(shouldReportSeverity('low')).toBe(false);
    });

    it('should use fail-safe default (low) if manifest missing', () => {
      mockManifest.insight = undefined;

      expect(shouldReportSeverity('low')).toBe(true);
    });
  });

  describe('applyMaxFilesLimit()', () => {
    it('should return all files when under limit', () => {
      mockManifest.insight = { maxFiles: 100 };
      const files = Array.from({ length: 50 }, (_, i) => `file${i}.ts`);

      const limited = applyMaxFilesLimit(files);

      expect(limited).toEqual(files);
      expect(limited.length).toBe(50);
    });

    it('should cap files at maxFiles limit', () => {
      mockManifest.insight = { maxFiles: 10 };
      const files = Array.from({ length: 50 }, (_, i) => `file${i}.ts`);

      const limited = applyMaxFilesLimit(files);

      expect(limited.length).toBe(10);
      expect(limited).toEqual(files.slice(0, 10));
    });

    it('should handle zero limit gracefully', () => {
      mockManifest.insight = { maxFiles: 0 };
      const files = ['file1.ts', 'file2.ts'];

      const limited = applyMaxFilesLimit(files);

      expect(limited.length).toBe(0);
    });

    it('should use fail-safe default (1000) if manifest missing', () => {
      mockManifest.insight = undefined;
      const files = Array.from({ length: 1500 }, (_, i) => `file${i}.ts`);

      const limited = applyMaxFilesLimit(files);

      expect(limited.length).toBe(1000);
    });

    it('should handle empty file array', () => {
      mockManifest.insight = { maxFiles: 100 };

      const limited = applyMaxFilesLimit([]);

      expect(limited).toEqual([]);
    });
  });

  describe('isSuppressedByFalsePositiveRules()', () => {
    it('should suppress when detector matches rule', () => {
      mockManifest.insight = {
        falsePositives: [
          { detector: 'security', messagePattern: 'Hardcoded API key' },
        ],
      };

      const suppressed = isSuppressedByFalsePositiveRules({
        detector: 'security',
        message: 'Hardcoded API key detected in config',
        path: 'src/config.ts',
      });

      expect(suppressed).toBe(true);
    });

    it('should suppress when path matches glob pattern', () => {
      mockManifest.insight = {
        falsePositives: [
          { detector: 'typescript', pathPattern: 'test/**' },
        ],
      };

      const suppressed = isSuppressedByFalsePositiveRules({
        detector: 'typescript',
        message: 'Type error',
        path: 'test/fixtures/sample.ts',
      });

      expect(suppressed).toBe(true);
    });

    it('should not suppress when detector does not match', () => {
      mockManifest.insight = {
        falsePositives: [
          { detector: 'security', messagePattern: 'API key' },
        ],
      };

      const suppressed = isSuppressedByFalsePositiveRules({
        detector: 'eslint',
        message: 'API key detected',
        path: 'src/index.ts',
      });

      expect(suppressed).toBe(false);
    });

    it('should not suppress when message does not match pattern', () => {
      mockManifest.insight = {
        falsePositives: [
          { detector: 'security', messagePattern: 'password' },
        ],
      };

      const suppressed = isSuppressedByFalsePositiveRules({
        detector: 'security',
        message: 'Hardcoded API key',
        path: 'src/index.ts',
      });

      expect(suppressed).toBe(false);
    });

    it('should not suppress when no rules configured', () => {
      mockManifest.insight = { falsePositives: [] };

      const suppressed = isSuppressedByFalsePositiveRules({
        detector: 'security',
        message: 'Any message',
        path: 'src/index.ts',
      });

      expect(suppressed).toBe(false);
    });

    it('should handle missing manifest gracefully (fail-safe)', () => {
      mockManifest.insight = undefined;

      expect(() =>
        isSuppressedByFalsePositiveRules({
          detector: 'security',
          message: 'test',
          path: 'test.ts',
        })
      ).not.toThrow();

      const suppressed = isSuppressedByFalsePositiveRules({
        detector: 'security',
        message: 'test',
        path: 'test.ts',
      });

      expect(suppressed).toBe(false);
    });
  });
});
