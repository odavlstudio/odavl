/**
 * ODAVL Brain - Manifest Configuration Tests
 * Phase P3 Task 5: Unit tests for enforcement functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  canModifyKnowledge,
  enforceMemoryLimit,
  validateConfidence,
  shouldAllowDeployment,
  shouldAutoApproveRecipe,
} from '../manifest-config';

// Mock the manifest module
vi.mock('@odavl/core/manifest', () => ({
  manifest: {} as any,
}));

describe('Brain Manifest Enforcement', () => {
  let mockManifest: any;

  beforeEach(async () => {
    const { manifest } = await import('@odavl/core/manifest');
    mockManifest = manifest;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('canModifyKnowledge()', () => {
    it('should allow modifications in aggressive learning mode', () => {
      mockManifest.brain = {
        learningMode: 'aggressive',
      };

      const result = canModifyKnowledge();

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('aggressive');
    });

    it('should allow modifications in adaptive learning mode', () => {
      mockManifest.brain = {
        learningMode: 'adaptive',
      };

      const result = canModifyKnowledge();

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('adaptive');
    });

    it('should block modifications in observe-only mode', () => {
      mockManifest.brain = {
        learningMode: 'observe',
      };

      const result = canModifyKnowledge();

      expect(result.allowed).toBe(false);
      expect(result.mode).toBe('observe');
    });

    it('should block modifications when disabled', () => {
      mockManifest.brain = {
        learningMode: 'disabled',
      };

      const result = canModifyKnowledge();

      expect(result.allowed).toBe(false);
      expect(result.mode).toBe('disabled');
    });

    it('should use fail-safe default (adaptive) if manifest missing', () => {
      mockManifest.brain = undefined;

      const result = canModifyKnowledge();

      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('adaptive'); // Default
    });
  });

  describe('enforceMemoryLimit()', () => {
    it('should allow below short-term memory limit', () => {
      mockManifest.brain = {
        memory: {
          shortTermLimit: 100,
          longTermLimit: 1000,
        },
      };

      const result = enforceMemoryLimit({
        shortTermCount: 50,
        longTermCount: 500,
      });

      expect(result.needsEviction).toBe(false);
      expect(result.evictionTargets).toEqual([]);
    });

    it('should trigger eviction when short-term limit exceeded', () => {
      mockManifest.brain = {
        memory: {
          shortTermLimit: 100,
          longTermLimit: 1000,
          evictionPolicy: 'lru',
        },
      };

      const result = enforceMemoryLimit({
        shortTermCount: 150,
        longTermCount: 500,
      });

      expect(result.needsEviction).toBe(true);
      expect(result.evictionTargets).toContain('short-term');
      expect(result.policy).toBe('lru');
    });

    it('should trigger eviction when long-term limit exceeded', () => {
      mockManifest.brain = {
        memory: {
          shortTermLimit: 100,
          longTermLimit: 1000,
          evictionPolicy: 'fifo',
        },
      };

      const result = enforceMemoryLimit({
        shortTermCount: 50,
        longTermCount: 1500,
      });

      expect(result.needsEviction).toBe(true);
      expect(result.evictionTargets).toContain('long-term');
      expect(result.policy).toBe('fifo');
    });

    it('should use LRU policy by default', () => {
      mockManifest.brain = {
        memory: {
          shortTermLimit: 100,
          longTermLimit: 1000,
        },
      };

      const result = enforceMemoryLimit({
        shortTermCount: 150,
        longTermCount: 500,
      });

      expect(result.policy).toBe('lru'); // Default
    });

    it('should trigger eviction for both limits exceeded', () => {
      mockManifest.brain = {
        memory: {
          shortTermLimit: 100,
          longTermLimit: 1000,
        },
      };

      const result = enforceMemoryLimit({
        shortTermCount: 150,
        longTermCount: 1500,
      });

      expect(result.needsEviction).toBe(true);
      expect(result.evictionTargets).toContain('short-term');
      expect(result.evictionTargets).toContain('long-term');
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.brain = undefined;

      const result = enforceMemoryLimit({
        shortTermCount: 50,
        longTermCount: 500,
      });

      expect(result.needsEviction).toBe(false); // Generous defaults
    });
  });

  describe('validateConfidence()', () => {
    it('should pass when Insight confidence meets threshold', () => {
      mockManifest.brain = {
        confidenceThresholds: {
          insight: 0.6,
          autopilot: 0.8,
          guardian: 0.9,
        },
      };

      const result = validateConfidence('insight', 0.75);

      expect(result.meetsThreshold).toBe(true);
      expect(result.confidence).toBe(0.75);
      expect(result.threshold).toBe(0.6);
    });

    it('should fail when Insight confidence below threshold', () => {
      mockManifest.brain = {
        confidenceThresholds: {
          insight: 0.6,
          autopilot: 0.8,
          guardian: 0.9,
        },
      };

      const result = validateConfidence('insight', 0.4);

      expect(result.meetsThreshold).toBe(false);
      expect(result.confidence).toBe(0.4);
      expect(result.threshold).toBe(0.6);
    });

    it('should pass when Autopilot confidence meets threshold', () => {
      mockManifest.brain = {
        confidenceThresholds: {
          insight: 0.6,
          autopilot: 0.8,
          guardian: 0.9,
        },
      };

      const result = validateConfidence('autopilot', 0.85);

      expect(result.meetsThreshold).toBe(true);
    });

    it('should fail when Guardian confidence below threshold', () => {
      mockManifest.brain = {
        confidenceThresholds: {
          insight: 0.6,
          autopilot: 0.8,
          guardian: 0.9,
        },
      };

      const result = validateConfidence('guardian', 0.85);

      expect(result.meetsThreshold).toBe(false);
      expect(result.threshold).toBe(0.9);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.brain = undefined;

      const result = validateConfidence('autopilot', 0.7);

      expect(result.meetsThreshold).toBe(true); // Lenient defaults
    });
  });

  describe('shouldAllowDeployment()', () => {
    it('should allow deployment when all conditions met', () => {
      mockManifest.brain = {
        decisionPolicies: {
          deployment: {
            conditions: [
              { expression: 'guardian.launchReady === true' },
              { expression: 'insight.totalIssues < 5' },
            ],
            operator: 'AND',
          },
        },
      };

      const context = {
        guardian: { launchReady: true },
        insight: { totalIssues: 2 },
      };

      const result = shouldAllowDeployment(context);

      expect(result.allowed).toBe(true);
      expect(result.failedConditions).toEqual([]);
    });

    it('should block deployment when launchReady is false', () => {
      mockManifest.brain = {
        decisionPolicies: {
          deployment: {
            conditions: [
              { expression: 'guardian.launchReady === true' },
              { expression: 'insight.totalIssues < 5' },
            ],
            operator: 'AND',
          },
        },
      };

      const context = {
        guardian: { launchReady: false },
        insight: { totalIssues: 2 },
      };

      const result = shouldAllowDeployment(context);

      expect(result.allowed).toBe(false);
      expect(result.failedConditions.length).toBeGreaterThan(0);
    });

    it('should block deployment when issues exceed threshold', () => {
      mockManifest.brain = {
        decisionPolicies: {
          deployment: {
            conditions: [
              { expression: 'guardian.launchReady === true' },
              { expression: 'insight.totalIssues < 5' },
            ],
            operator: 'AND',
          },
        },
      };

      const context = {
        guardian: { launchReady: true },
        insight: { totalIssues: 10 },
      };

      const result = shouldAllowDeployment(context);

      expect(result.allowed).toBe(false);
    });

    it('should use OR operator correctly', () => {
      mockManifest.brain = {
        decisionPolicies: {
          deployment: {
            conditions: [
              { expression: 'guardian.launchReady === true' },
              { expression: 'insight.totalIssues === 0' },
            ],
            operator: 'OR',
          },
        },
      };

      const context = {
        guardian: { launchReady: true },
        insight: { totalIssues: 5 }, // Doesn't meet second condition
      };

      const result = shouldAllowDeployment(context);

      expect(result.allowed).toBe(true); // First condition passes
    });

    it('should handle complex expressions', () => {
      mockManifest.brain = {
        decisionPolicies: {
          deployment: {
            conditions: [
              { expression: 'autopilot.trust > 0.8' },
              { expression: 'guardian.score >= 0.9' },
            ],
            operator: 'AND',
          },
        },
      };

      const context = {
        autopilot: { trust: 0.85 },
        guardian: { score: 0.92 },
      };

      const result = shouldAllowDeployment(context);

      expect(result.allowed).toBe(true);
    });

    it('should use fail-safe default (block) if manifest missing', () => {
      mockManifest.brain = undefined;

      const result = shouldAllowDeployment({});

      expect(result.allowed).toBe(false); // Fail-safe: block
    });
  });

  describe('shouldAutoApproveRecipe()', () => {
    it('should approve recipe with high trust', () => {
      mockManifest.brain = {
        recipeApproval: {
          autoApprove: {
            expression: 'recipe.trust > 0.8',
          },
        },
      };

      const context = {
        recipe: { trust: 0.9, previousSuccesses: 10 },
      };

      const result = shouldAutoApproveRecipe(context);

      expect(result.approved).toBe(true);
    });

    it('should reject recipe with low trust', () => {
      mockManifest.brain = {
        recipeApproval: {
          autoApprove: {
            expression: 'recipe.trust > 0.8',
          },
        },
      };

      const context = {
        recipe: { trust: 0.5, previousSuccesses: 5 },
      };

      const result = shouldAutoApproveRecipe(context);

      expect(result.approved).toBe(false);
    });

    it('should handle complex approval conditions', () => {
      mockManifest.brain = {
        recipeApproval: {
          autoApprove: {
            expression: 'recipe.trust > 0.8 && recipe.previousSuccesses > 5',
          },
        },
      };

      const context = {
        recipe: { trust: 0.85, previousSuccesses: 10 },
      };

      const result = shouldAutoApproveRecipe(context);

      expect(result.approved).toBe(true);
    });

    it('should reject when one condition fails', () => {
      mockManifest.brain = {
        recipeApproval: {
          autoApprove: {
            expression: 'recipe.trust > 0.8 && recipe.previousSuccesses > 5',
          },
        },
      };

      const context = {
        recipe: { trust: 0.85, previousSuccesses: 2 },
      };

      const result = shouldAutoApproveRecipe(context);

      expect(result.approved).toBe(false);
    });

    it('should use fail-safe default (reject) if manifest missing', () => {
      mockManifest.brain = undefined;

      const result = shouldAutoApproveRecipe({});

      expect(result.approved).toBe(false); // Fail-safe: manual review
    });
  });
});
