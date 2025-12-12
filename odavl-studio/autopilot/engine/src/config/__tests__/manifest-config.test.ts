/**
 * ODAVL Autopilot - Manifest Configuration Tests
 * Phase P3 Task 5: Unit tests for enforcement functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateRiskBudget,
  isProtectedPath,
  shouldAvoidChanges,
  shouldAutoApproveRecipe,
} from '../manifest-config';

// Mock the manifest module
vi.mock('@odavl/core/manifest', () => ({
  manifest: {} as any,
}));

describe('Autopilot Manifest Enforcement', () => {
  let mockManifest: any;

  beforeEach(async () => {
    const { manifest } = await import('@odavl/core/manifest');
    mockManifest = manifest;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateRiskBudget()', () => {
    it('should allow changes within budget', () => {
      mockManifest.autopilot = {
        riskBudget: {
          maxLOCPerRun: 100,
          maxFilesPerRun: 10,
          maxRecipesPerRun: 5,
        },
      };

      const result = validateRiskBudget({
        locCount: 50,
        filesCount: 5,
        recipesCount: 3,
      });

      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should block when LOC exceeds budget', () => {
      mockManifest.autopilot = {
        riskBudget: {
          maxLOCPerRun: 100,
          maxFilesPerRun: 10,
          maxRecipesPerRun: 5,
        },
      };

      const result = validateRiskBudget({
        locCount: 150,
        filesCount: 5,
        recipesCount: 3,
      });

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('LOC count 150 exceeds limit 100');
    });

    it('should block when files exceed budget', () => {
      mockManifest.autopilot = {
        riskBudget: {
          maxLOCPerRun: 100,
          maxFilesPerRun: 10,
          maxRecipesPerRun: 5,
        },
      };

      const result = validateRiskBudget({
        locCount: 50,
        filesCount: 15,
        recipesCount: 3,
      });

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('Files count 15 exceeds limit 10');
    });

    it('should block when recipes exceed budget', () => {
      mockManifest.autopilot = {
        riskBudget: {
          maxLOCPerRun: 100,
          maxFilesPerRun: 10,
          maxRecipesPerRun: 5,
        },
      };

      const result = validateRiskBudget({
        locCount: 50,
        filesCount: 5,
        recipesCount: 8,
      });

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('Recipes count 8 exceeds limit 5');
    });

    it('should report multiple violations', () => {
      mockManifest.autopilot = {
        riskBudget: {
          maxLOCPerRun: 100,
          maxFilesPerRun: 10,
          maxRecipesPerRun: 5,
        },
      };

      const result = validateRiskBudget({
        locCount: 200,
        filesCount: 20,
        recipesCount: 10,
      });

      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBe(3);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.autopilot = undefined;

      const result = validateRiskBudget({
        locCount: 50,
        filesCount: 5,
        recipesCount: 3,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('isProtectedPath()', () => {
    it('should block protected security paths', () => {
      mockManifest.autopilot = {
        protectedPaths: ['security/**', 'auth/**'],
      };

      const result = isProtectedPath('security/encryption.ts');

      expect(result.blocked).toBe(true);
      expect(result.matchedPattern).toBe('security/**');
    });

    it('should block protected test files', () => {
      mockManifest.autopilot = {
        protectedPaths: ['**/*.spec.ts', '**/*.test.ts'],
      };

      const result = isProtectedPath('src/utils/helpers.spec.ts');

      expect(result.blocked).toBe(true);
      expect(result.matchedPattern).toMatch(/spec\.ts/);
    });

    it('should allow non-protected paths', () => {
      mockManifest.autopilot = {
        protectedPaths: ['security/**', 'auth/**'],
      };

      const result = isProtectedPath('src/utils/helpers.ts');

      expect(result.blocked).toBe(false);
      expect(result.matchedPattern).toBeUndefined();
    });

    it('should handle multiple patterns correctly', () => {
      mockManifest.autopilot = {
        protectedPaths: ['security/**', 'auth/**', 'public-api/**'],
      };

      expect(isProtectedPath('security/keys.ts').blocked).toBe(true);
      expect(isProtectedPath('auth/login.ts').blocked).toBe(true);
      expect(isProtectedPath('public-api/index.ts').blocked).toBe(true);
      expect(isProtectedPath('src/utils.ts').blocked).toBe(false);
    });

    it('should use fail-safe defaults if manifest missing', () => {
      mockManifest.autopilot = undefined;

      const result = isProtectedPath('security/keys.ts');

      // Should have default protected paths
      expect(result.blocked).toBe(true);
    });
  });

  describe('shouldAvoidChanges()', () => {
    it('should warn for avoided paths', () => {
      mockManifest.autopilot = {
        avoidChanges: ['database/**', 'migrations/**'],
      };

      const result = shouldAvoidChanges('database/schema.ts');

      expect(result.shouldAvoid).toBe(true);
      expect(result.matchedPattern).toBe('database/**');
    });

    it('should not warn for non-avoided paths', () => {
      mockManifest.autopilot = {
        avoidChanges: ['database/**'],
      };

      const result = shouldAvoidChanges('src/utils/helpers.ts');

      expect(result.shouldAvoid).toBe(false);
      expect(result.matchedPattern).toBeUndefined();
    });

    it('should handle empty avoidChanges array', () => {
      mockManifest.autopilot = {
        avoidChanges: [],
      };

      const result = shouldAvoidChanges('database/schema.ts');

      expect(result.shouldAvoid).toBe(false);
    });

    it('should use empty defaults if manifest missing', () => {
      mockManifest.autopilot = undefined;

      const result = shouldAvoidChanges('database/schema.ts');

      expect(result.shouldAvoid).toBe(false);
    });
  });

  describe('shouldAutoApproveRecipe()', () => {
    it('should approve high-trust recipes', () => {
      mockManifest.autopilot = {
        autoApprove: {
          minTrust: 0.8,
          maxFilesModified: 10,
        },
      };

      const result = shouldAutoApproveRecipe({
        recipeId: 'test-recipe',
        trust: 0.9,
        filesModified: ['file1.ts', 'file2.ts'],
      });

      expect(result.approved).toBe(true);
      expect(result.reason).toContain('trust');
    });

    it('should reject low-trust recipes', () => {
      mockManifest.autopilot = {
        autoApprove: {
          minTrust: 0.8,
          maxFilesModified: 10,
        },
      };

      const result = shouldAutoApproveRecipe({
        recipeId: 'test-recipe',
        trust: 0.5,
        filesModified: ['file1.ts'],
      });

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('trust');
    });

    it('should reject recipes modifying too many files', () => {
      mockManifest.autopilot = {
        autoApprove: {
          minTrust: 0.8,
          maxFilesModified: 5,
        },
      };

      const files = Array.from({ length: 10 }, (_, i) => `file${i}.ts`);
      const result = shouldAutoApproveRecipe({
        recipeId: 'test-recipe',
        trust: 0.9,
        filesModified: files,
      });

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('files');
    });

    it('should handle missing manifest gracefully', () => {
      mockManifest.autopilot = undefined;

      const result = shouldAutoApproveRecipe({
        recipeId: 'test-recipe',
        trust: 0.9,
        filesModified: ['file1.ts'],
      });

      expect(result.approved).toBe(true); // Fail-safe default
    });
  });
});
