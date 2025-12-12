/**
 * ODAVL Guardian Deployment Gates - Integration Tests
 * Phase Ω-P2: Validate all 5 gates with various scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  gateConfidence,
  gatePerformance,
  gateRegression,
  gateSecurity,
  gateFileTypeRisk,
  runAllGates,
  type DeploymentGatesInput,
} from '../deployment-gates';

describe('Guardian Deployment Gates - Phase Ω-P2', () => {
  describe('gateConfidence', () => {
    it('should pass when confidence meets threshold', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 85,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        thresholds: { confidence: 75 },
      };

      const result = gateConfidence(input);
      expect(result.pass).toBe(true);
      expect(result.gate).toBe('confidence');
      expect(result.reason).toContain('85.0%');
    });

    it('should fail when confidence below threshold', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 60,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        thresholds: { confidence: 75 },
      };

      const result = gateConfidence(input);
      expect(result.pass).toBe(false);
      expect(result.reason).toContain('60.0%');
      expect(result.reason).toContain('below threshold');
    });
  });

  describe('gatePerformance', () => {
    it('should pass when all metrics within thresholds', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 95, lcp: 2000, fid: 80, cls: 0.08 },
        thresholds: {},
      };

      const result = gatePerformance(input);
      expect(result.pass).toBe(true);
      expect(result.reason).toContain('within thresholds');
    });

    it('should fail when lighthouse score too low', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 85, lcp: 2000, fid: 80, cls: 0.08 },
        thresholds: {},
      };

      const result = gatePerformance(input);
      expect(result.pass).toBe(false);
      expect(result.reason).toContain('Lighthouse');
      expect(result.reason).toContain('85');
    });

    it('should fail when LCP exceeds threshold', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 95, lcp: 3000, fid: 80, cls: 0.08 },
        thresholds: {},
      };

      const result = gatePerformance(input);
      expect(result.pass).toBe(false);
      expect(result.reason).toContain('LCP');
      expect(result.reason).toContain('3000');
    });
  });

  describe('gateRegression', () => {
    it('should pass with 0 regressions', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        baseline: { regressions: 0, improvements: 5 },
        thresholds: {},
      };

      const result = gateRegression(input);
      expect(result.pass).toBe(true);
      expect(result.reason).toContain('0 regressions');
      expect(result.reason).toContain('5 improvements');
    });

    it('should fail when regressions exceed threshold', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        baseline: { regressions: 3, improvements: 1 },
        thresholds: { maxRegressions: 0 },
      };

      const result = gateRegression(input);
      expect(result.pass).toBe(false);
      expect(result.reason).toContain('3 regressions');
    });
  });

  describe('gateSecurity', () => {
    it('should pass when security risk is low', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        brainMTL: { security: 0.3, performance: 0.2, maintainability: 0.1 },
        thresholds: {},
      };

      const result = gateSecurity(input);
      expect(result.pass).toBe(true);
      expect(result.reason).toContain('30.0%');
    });

    it('should fail when security risk is high', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        brainMTL: { security: 0.8, performance: 0.2, maintainability: 0.1 },
        thresholds: {},
      };

      const result = gateSecurity(input);
      expect(result.pass).toBe(false);
      expect(result.reason).toContain('80.0%');
      expect(result.reason).toContain('threshold 70.0%');
    });
  });

  describe('gateFileTypeRisk', () => {
    it('should pass with few high-risk files', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: ['src/utils/helper.ts', 'src/components/button.tsx'],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        thresholds: {},
      };

      const result = gateFileTypeRisk(input);
      expect(result.pass).toBe(true);
      expect(result.reason).toContain('0 high-risk');
    });

    it('should warn when many high-risk files', () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 80,
        brainReasoning: [],
        changedFiles: [
          'security/auth.ts',
          'security/jwt.ts',
          'auth/oauth.ts',
          'auth/session.ts',
          'database/migrations/001.sql',
          'database/schema.prisma',
        ],
        metrics: { lighthouse: 90, lcp: 2000, fid: 50, cls: 0.05 },
        thresholds: {},
      };

      const result = gateFileTypeRisk(input);
      expect(result.pass).toBe(false);
      expect(result.reason).toContain('6 high-risk');
      expect(result.reason).toContain('threshold 5');
    });
  });

  describe('runAllGates', () => {
    it('should run all 5 gates and return results', async () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 85,
        brainReasoning: [],
        changedFiles: ['src/app.ts'],
        metrics: { lighthouse: 95, lcp: 2000, fid: 80, cls: 0.08 },
        baseline: { regressions: 0, improvements: 3 },
        brainMTL: { security: 0.3, performance: 0.2, maintainability: 0.1 },
        thresholds: { confidence: 75 },
      };

      const results = await runAllGates(input);
      expect(results).toHaveLength(5);
      expect(results.every((r) => r.pass)).toBe(true);
    });

    it('should detect multiple gate failures', async () => {
      const input: DeploymentGatesInput = {
        brainConfidence: 60, // Below threshold
        brainReasoning: [],
        changedFiles: ['security/auth.ts', 'security/jwt.ts', 'auth/oauth.ts', 'auth/session.ts', 'database/migrations/001.sql', 'database/schema.prisma'], // Too many high-risk
        metrics: { lighthouse: 85, lcp: 3000, fid: 120, cls: 0.15 }, // All metrics fail
        baseline: { regressions: 5, improvements: 0 }, // Too many regressions
        brainMTL: { security: 0.9, performance: 0.8, maintainability: 0.7 }, // High security risk
        thresholds: { confidence: 75, maxRegressions: 0 },
      };

      const results = await runAllGates(input);
      const failedGates = results.filter((r) => !r.pass);
      expect(failedGates.length).toBeGreaterThanOrEqual(4); // Should fail all except maybe fileRisk
    });
  });
});
