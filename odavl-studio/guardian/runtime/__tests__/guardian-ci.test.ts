/**
 * ODAVL Guardian CI Integration Tests
 * Phase Ω-P2: Validate unified CI/CD deployment decision engine
 */

import { describe, it, expect } from 'vitest';
import { runGuardianCI, type GuardianCIInput } from '../guardian-ci';

describe('Guardian CI - Phase Ω-P2', () => {
  it('should approve deployment when all gates pass', async () => {
    const input: GuardianCIInput = {
      brainConfidence: 85,
      brainReasoning: ['✓ High confidence from 5-model ensemble'],
      changedFiles: ['src/app.ts'],
      metrics: { lighthouse: 95, lcp: 2000, fid: 80, cls: 0.08 },
      baseline: { regressions: 0, improvements: 3 },
      brainMTL: { security: 0.3, performance: 0.2, maintainability: 0.1 },
      brainFusionScore: 91,
      thresholds: { confidence: 75 },
    };

    const result = await runGuardianCI(input);

    expect(result.canDeploy).toBe(true);
    expect(result.gates.every((g) => g.pass)).toBe(true);
    expect(result.finalConfidence).toBeGreaterThan(80);
    expect(result.brainScore).toBe(85);
    expect(result.fusionScore).toBe(91);
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it('should block deployment when gates fail', async () => {
    const input: GuardianCIInput = {
      brainConfidence: 60, // Below threshold
      brainReasoning: ['⚠️ Low confidence due to insufficient data'],
      changedFiles: ['src/app.ts'],
      metrics: { lighthouse: 85, lcp: 3000, fid: 120, cls: 0.15 }, // Performance fail
      baseline: { regressions: 5, improvements: 0 }, // Regressions fail
      brainMTL: { security: 0.9, performance: 0.8, maintainability: 0.7 }, // Security fail
      brainFusionScore: 70,
      thresholds: { confidence: 75, maxRegressions: 0 },
    };

    const result = await runGuardianCI(input);

    expect(result.canDeploy).toBe(false);
    const failedGates = result.gates.filter((g) => !g.pass);
    expect(failedGates.length).toBeGreaterThan(0);
    expect(result.reasoning.some((r) => r.includes('Guardian Gates'))).toBe(true);
  });

  it('should allow force override when --force used', async () => {
    const input: GuardianCIInput = {
      brainConfidence: 50, // Very low
      brainReasoning: ['⚠️ Minimal confidence'],
      changedFiles: ['src/app.ts'],
      metrics: { lighthouse: 80, lcp: 4000, fid: 150, cls: 0.2 }, // All fail
      baseline: { regressions: 10, improvements: 0 },
      brainMTL: { security: 0.95, performance: 0.9, maintainability: 0.85 },
      brainFusionScore: 60,
      thresholds: { confidence: 75 },
    };

    const result = await runGuardianCI(input, { force: true });

    expect(result.canDeploy).toBe(true); // Force override
    expect(result.reasoning.some((r) => r.includes('forced'))).toBe(true);
  });

  it('should compute blended final confidence correctly', async () => {
    const input: GuardianCIInput = {
      brainConfidence: 80,
      brainReasoning: [],
      changedFiles: ['src/app.ts'],
      metrics: { lighthouse: 95, lcp: 2000, fid: 80, cls: 0.08 },
      baseline: { regressions: 0, improvements: 3 },
      brainMTL: { security: 0.3, performance: 0.2, maintainability: 0.1 },
      brainFusionScore: 90,
      thresholds: { confidence: 75 },
    };

    const result = await runGuardianCI(input);

    // Formula: 0.5*brain + 0.3*fusion + 0.2*gates
    // Expected: 0.5*80 + 0.3*90 + 0.2*100 = 40 + 27 + 20 = 87
    expect(result.finalConfidence).toBeCloseTo(87, 1);
    expect(result.brainScore).toBe(80);
    expect(result.fusionScore).toBe(90);
  });

  it('should merge Brain and Guardian reasoning', async () => {
    const input: GuardianCIInput = {
      brainConfidence: 85,
      brainReasoning: ['✓ LSTM sequence analysis shows stable patterns', '✓ MTL security prediction low risk'],
      changedFiles: ['src/app.ts'],
      metrics: { lighthouse: 95, lcp: 2000, fid: 80, cls: 0.08 },
      baseline: { regressions: 0, improvements: 3 },
      brainMTL: { security: 0.3, performance: 0.2, maintainability: 0.1 },
      brainFusionScore: 91,
      thresholds: { confidence: 75 },
    };

    const result = await runGuardianCI(input);

    expect(result.reasoning.some((r) => r.includes('🧠 Brain Analysis'))).toBe(true);
    expect(result.reasoning.some((r) => r.includes('🛡️ Guardian Gates'))).toBe(true);
    expect(result.reasoning.some((r) => r.includes('LSTM'))).toBe(true); // Brain reasoning preserved
  });
});
