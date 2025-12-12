/**
 * ODAVL Guardian - Manifest Configuration Tests
 * Phase P3 Task 5: Unit tests for enforcement functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getActiveSuites,
  validateLighthouseScores,
  validateWebVitals,
  compareAgainstBaseline,
} from '../manifest-config';

// Mock the manifest module
vi.mock('@odavl/core/manifest', () => ({
  manifest: {} as any,
}));

describe('Guardian Manifest Enforcement', () => {
  let mockManifest: any;

  beforeEach(async () => {
    const { manifest } = await import('@odavl/core/manifest');
    mockManifest = manifest;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveSuites()', () => {
    it('should return enabled suites', () => {
      mockManifest.guardian = {
        suites: {
          performance: { enabled: true },
          accessibility: { enabled: true },
          security: { enabled: false },
          visual: { enabled: true },
          e2e: { enabled: false },
        },
      };

      const suites = getActiveSuites();

      expect(suites).toEqual(['performance', 'accessibility', 'visual']);
    });

    it('should filter out disabled suites', () => {
      mockManifest.guardian = {
        suites: {
          performance: { enabled: true },
          accessibility: { enabled: false },
          security: { enabled: false },
        },
      };

      const suites = getActiveSuites();

      expect(suites).toEqual(['performance']);
      expect(suites).not.toContain('accessibility');
      expect(suites).not.toContain('security');
    });

    it('should return empty array when no suites enabled', () => {
      mockManifest.guardian = {
        suites: {
          performance: { enabled: false },
          accessibility: { enabled: false },
        },
      };

      const suites = getActiveSuites();

      expect(suites).toEqual([]);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.guardian = undefined;

      const suites = getActiveSuites();

      expect(Array.isArray(suites)).toBe(true);
      expect(suites.length).toBeGreaterThan(0); // Default suites
    });
  });

  describe('validateLighthouseScores()', () => {
    it('should pass when all scores meet thresholds', () => {
      mockManifest.guardian = {
        lighthouseThresholds: {
          performance: 0.9,
          accessibility: 0.9,
          bestPractices: 0.9,
          seo: 0.9,
        },
      };

      const result = validateLighthouseScores({
        performance: 0.95,
        accessibility: 0.98,
        bestPractices: 0.92,
        seo: 0.94,
      });

      expect(result.passed).toBe(true);
      expect(result.failures).toEqual([]);
    });

    it('should fail when performance is below threshold', () => {
      mockManifest.guardian = {
        lighthouseThresholds: {
          performance: 0.9,
          accessibility: 0.9,
          bestPractices: 0.9,
          seo: 0.9,
        },
      };

      const result = validateLighthouseScores({
        performance: 0.75,
        accessibility: 0.95,
        bestPractices: 0.92,
        seo: 0.94,
      });

      expect(result.passed).toBe(false);
      expect(result.failures).toContain('performance: 0.75 < 0.9');
    });

    it('should fail when accessibility is below threshold', () => {
      mockManifest.guardian = {
        lighthouseThresholds: {
          performance: 0.9,
          accessibility: 0.9,
          bestPractices: 0.9,
          seo: 0.9,
        },
      };

      const result = validateLighthouseScores({
        performance: 0.95,
        accessibility: 0.70,
        bestPractices: 0.92,
        seo: 0.94,
      });

      expect(result.passed).toBe(false);
      expect(result.failures).toContain('accessibility: 0.7 < 0.9');
    });

    it('should report multiple failures', () => {
      mockManifest.guardian = {
        lighthouseThresholds: {
          performance: 0.9,
          accessibility: 0.9,
          bestPractices: 0.9,
          seo: 0.9,
        },
      };

      const result = validateLighthouseScores({
        performance: 0.75,
        accessibility: 0.80,
        bestPractices: 0.70,
        seo: 0.94,
      });

      expect(result.passed).toBe(false);
      expect(result.failures.length).toBe(3);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.guardian = undefined;

      const result = validateLighthouseScores({
        performance: 0.6,
        accessibility: 0.6,
        bestPractices: 0.6,
        seo: 0.6,
      });

      expect(result.passed).toBe(true); // Default thresholds are low
    });
  });

  describe('validateWebVitals()', () => {
    it('should pass when all vitals meet thresholds', () => {
      mockManifest.guardian = {
        webVitalsThresholds: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = validateWebVitals({
        lcp: 2000,
        fid: 80,
        cls: 0.05,
      });

      expect(result.passed).toBe(true);
      expect(result.failures).toEqual([]);
    });

    it('should fail when LCP exceeds threshold', () => {
      mockManifest.guardian = {
        webVitalsThresholds: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = validateWebVitals({
        lcp: 3500,
        fid: 80,
        cls: 0.05,
      });

      expect(result.passed).toBe(false);
      expect(result.failures).toContain('LCP: 3500ms > 2500ms');
    });

    it('should fail when FID exceeds threshold', () => {
      mockManifest.guardian = {
        webVitalsThresholds: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = validateWebVitals({
        lcp: 2000,
        fid: 150,
        cls: 0.05,
      });

      expect(result.passed).toBe(false);
      expect(result.failures).toContain('FID: 150ms > 100ms');
    });

    it('should fail when CLS exceeds threshold', () => {
      mockManifest.guardian = {
        webVitalsThresholds: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = validateWebVitals({
        lcp: 2000,
        fid: 80,
        cls: 0.25,
      });

      expect(result.passed).toBe(false);
      expect(result.failures).toContain('CLS: 0.25 > 0.1');
    });

    it('should report multiple vital violations', () => {
      mockManifest.guardian = {
        webVitalsThresholds: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = validateWebVitals({
        lcp: 4000,
        fid: 200,
        cls: 0.3,
      });

      expect(result.passed).toBe(false);
      expect(result.failures.length).toBe(3);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.guardian = undefined;

      const result = validateWebVitals({
        lcp: 5000,
        fid: 200,
        cls: 0.3,
      });

      expect(result.passed).toBe(true); // Lenient defaults
    });
  });

  describe('compareAgainstBaseline()', () => {
    it('should detect performance regressions', () => {
      mockManifest.guardian = {
        baselineMode: 'strict',
        regressionThresholds: {
          performance: 0.05, // 5% tolerance
          accessibility: 0.05,
        },
      };

      const result = compareAgainstBaseline(
        { performance: 0.95, accessibility: 0.98 }, // Current
        { performance: 0.85, accessibility: 0.98 } // Baseline
      );

      expect(result.regressions.length).toBe(0); // Improved
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.improvements).toContain('performance');
    });

    it('should flag regressions in strict mode', () => {
      mockManifest.guardian = {
        baselineMode: 'strict',
        regressionThresholds: {
          performance: 0.05,
          accessibility: 0.05,
        },
      };

      const result = compareAgainstBaseline(
        { performance: 0.80, accessibility: 0.98 }, // Current (worse)
        { performance: 0.90, accessibility: 0.98 } // Baseline
      );

      expect(result.regressions.length).toBeGreaterThan(0);
      expect(result.regressions).toContain('performance');
    });

    it('should allow minor regressions in adaptive mode', () => {
      mockManifest.guardian = {
        baselineMode: 'adaptive',
        regressionThresholds: {
          performance: 0.05,
          accessibility: 0.05,
        },
      };

      const result = compareAgainstBaseline(
        { performance: 0.88, accessibility: 0.98 }, // Current (3% worse)
        { performance: 0.91, accessibility: 0.98 } // Baseline
      );

      expect(result.regressions.length).toBe(0); // Within 5% tolerance
    });

    it('should track multiple improvements', () => {
      mockManifest.guardian = {
        baselineMode: 'learning',
        regressionThresholds: {
          performance: 0.05,
          accessibility: 0.05,
          seo: 0.05,
        },
      };

      const result = compareAgainstBaseline(
        { performance: 0.95, accessibility: 0.98, seo: 0.96 },
        { performance: 0.85, accessibility: 0.90, seo: 0.85 }
      );

      expect(result.hasImprovements).toBe(true);
      expect(result.improvements.length).toBe(3);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.guardian = undefined;

      const result = compareAgainstBaseline(
        { performance: 0.80, accessibility: 0.98 },
        { performance: 0.90, accessibility: 0.98 }
      );

      expect(result.regressions.length).toBe(0); // Lenient default
    });
  });
});
