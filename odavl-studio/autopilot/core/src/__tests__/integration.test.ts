/**
 * ODAVL Autopilot Integration Tests
 * Phase Ω-P3: Validate self-healing pipeline components
 */

import { describe, it, expect } from 'vitest';
import { InsightIntake } from '../intake/insight-intake';
import { RecipeSelector } from '../../../engine/src/selection/recipe-selector';
import { SelfHealExecutor } from '../../../engine/src/execution/self-heal';

describe('Autopilot Self-Healing Pipeline - Phase Ω-P3', () => {
  describe('InsightIntake', () => {
    const intake = new InsightIntake();

    it('should parse Insight findings from detector output', async () => {
      const mockDetectorOutput = [
        {
          detector: 'typescript',
          severity: 'high',
          message: 'Type error: Cannot assign string to number',
          file: 'src/app.ts',
          line: 42,
          code: 'TS2322',
        },
        {
          detector: 'security',
          severity: 'critical',
          message: 'Hardcoded API key detected',
          file: 'src/config.ts',
          line: 10,
          code: 'SEC001',
        },
      ];

      const findings = await intake.parseInsightFindings(mockDetectorOutput);

      expect(findings).toHaveLength(2);
      expect(findings[0].severity).toBe('high');
      expect(findings[0].category).toBe('syntax');
      expect(findings[1].severity).toBe('critical');
      expect(findings[1].category).toBe('security');
    });

    it('should create fix candidates with risk weights', async () => {
      const findings = [
        {
          detector: 'typescript',
          severity: 'high' as const,
          message: 'Type error',
          file: 'src/app.ts',
          category: 'syntax' as const,
        },
        {
          detector: 'security',
          severity: 'critical' as const,
          message: 'Security issue',
          file: 'security/auth.ts',
          category: 'security' as const,
        },
      ];

      const candidates = await intake.createFixCandidates(findings);

      expect(candidates).toHaveLength(2);
      expect(candidates[0].riskWeight).toBeGreaterThan(0);
      expect(candidates[0].potentialRecipes.length).toBeGreaterThan(0);
      
      // Security file should have higher risk weight
      const securityCandidate = candidates.find((c) => c.finding.file.includes('security'));
      const appCandidate = candidates.find((c) => c.finding.file.includes('app.ts'));
      expect(securityCandidate!.riskWeight).toBeGreaterThan(appCandidate!.riskWeight);
    });

    it('should calculate priority correctly', async () => {
      const criticalFinding = {
        detector: 'security',
        severity: 'critical' as const,
        message: 'Critical security issue',
        file: 'security/auth.ts',
        category: 'security' as const,
      };

      const lowFinding = {
        detector: 'import',
        severity: 'low' as const,
        message: 'Unused import',
        file: 'src/utils.ts',
        category: 'import' as const,
      };

      const candidates = await intake.createFixCandidates([criticalFinding, lowFinding]);

      expect(candidates[0].priority).toBeGreaterThan(candidates[1].priority); // Critical first
    });
  });

  describe('RecipeSelector', () => {
    const selector = new RecipeSelector();

    it('should select recipes with ML + Trust + Fusion scoring', async () => {
      const mockCandidates = [
        {
          id: 'fix-1',
          finding: {
            detector: 'typescript',
            severity: 'high' as const,
            message: 'Type error',
            file: 'src/app.ts',
            category: 'syntax' as const,
          },
          riskWeight: 0.5,
          potentialRecipes: ['fix-typescript-errors'],
          priority: 80,
          estimatedLOC: 5,
        },
      ];

      const selected = await selector.selectRecipes(mockCandidates);

      expect(selected.length).toBeGreaterThan(0);
      expect(selected[0].score.mlScore).toBeGreaterThanOrEqual(0);
      expect(selected[0].score.mlScore).toBeLessThanOrEqual(1);
      expect(selected[0].score.trustScore).toBeGreaterThanOrEqual(0);
      expect(selected[0].score.trustScore).toBeLessThanOrEqual(1);
      expect(selected[0].score.fusionScore).toBeGreaterThanOrEqual(0);
      expect(selected[0].score.fusionScore).toBeLessThanOrEqual(1);
      expect(selected[0].score.safetyClass).toMatch(/safe|review|unsafe/);
    });

    it('should filter recipes below threshold', async () => {
      const mockCandidates = [
        {
          id: 'fix-1',
          finding: {
            detector: 'typescript',
            severity: 'low' as const,
            message: 'Minor issue',
            file: 'src/test.ts',
            category: 'syntax' as const,
          },
          riskWeight: 0.9, // High risk
          potentialRecipes: ['risky-recipe'],
          priority: 20, // Low priority
          estimatedLOC: 50,
        },
      ];

      const selected = await selector.selectRecipes(mockCandidates, {
        minMLScore: 0.8,
        minTrustScore: 0.8,
        minFusionScore: 0.8,
      });

      // Should filter out low-scoring recipes
      expect(selected.length).toBeLessThanOrEqual(1);
    });

    it('should respect maxRecipes limit', async () => {
      const mockCandidates = Array.from({ length: 10 }, (_, i) => ({
        id: `fix-${i}`,
        finding: {
          detector: 'typescript',
          severity: 'high' as const,
          message: `Error ${i}`,
          file: `src/file${i}.ts`,
          category: 'syntax' as const,
        },
        riskWeight: 0.5,
        potentialRecipes: [`recipe-${i}`],
        priority: 80,
        estimatedLOC: 5,
      }));

      const selected = await selector.selectRecipes(mockCandidates, { maxRecipes: 3 });

      expect(selected.length).toBeLessThanOrEqual(3);
    });
  });

  describe('SelfHealExecutor', () => {
    const executor = new SelfHealExecutor();

    it('should execute session with constraints', async () => {
      const mockRecipes = [
        {
          recipeId: 'fix-typescript-errors',
          score: {
            recipeId: 'fix-typescript-errors',
            mlScore: 0.85,
            trustScore: 0.9,
            fusionScore: 0.87,
            finalScore: 0.87,
            safetyClass: 'safe' as const,
            justification: ['High confidence'],
          },
          targetCandidates: [
            {
              id: 'fix-1',
              finding: {
                detector: 'typescript',
                severity: 'high' as const,
                message: 'Type error',
                file: 'src/app.ts',
                category: 'syntax' as const,
              },
              riskWeight: 0.5,
              potentialRecipes: ['fix-typescript-errors'],
              priority: 80,
              estimatedLOC: 5,
            },
          ],
          estimatedImpact: {
            filesAffected: 1,
            locChanged: 5,
            riskReduction: 80,
          },
        },
      ];

      const session = await executor.executeSession(mockRecipes);

      expect(session.sessionId).toMatch(/heal-\d+/);
      expect(session.finalOutcome).toMatch(/success|partial|failed|rolled-back/);
      expect(session.executionResults.length).toBe(1);
    });

    it('should skip recipes violating constraints', async () => {
      const mockRecipes = [
        {
          recipeId: 'unsafe-recipe',
          score: {
            recipeId: 'unsafe-recipe',
            mlScore: 0.5,
            trustScore: 0.6,
            fusionScore: 0.55,
            finalScore: 0.55,
            safetyClass: 'review' as const,
            justification: ['Review required'],
          },
          targetCandidates: [],
          estimatedImpact: {
            filesAffected: 20, // Exceeds limit
            locChanged: 100, // Exceeds limit
            riskReduction: 50,
          },
        },
      ];

      const session = await executor.executeSession(mockRecipes, {
        maxLOC: 40,
        maxFiles: 10,
      });

      expect(session.executionResults[0].status).toBe('skipped');
      expect(session.executionResults[0].errors).toContain('Recipe violates execution constraints');
    });

    it('should protect security and auth paths', async () => {
      const mockRecipes = [
        {
          recipeId: 'fix-security',
          score: {
            recipeId: 'fix-security',
            mlScore: 0.9,
            trustScore: 0.85,
            fusionScore: 0.87,
            finalScore: 0.87,
            safetyClass: 'safe' as const,
            justification: ['High confidence'],
          },
          targetCandidates: [
            {
              id: 'fix-1',
              finding: {
                detector: 'security',
                severity: 'high' as const,
                message: 'Security issue',
                file: 'security/auth.ts', // Protected path
                category: 'security' as const,
              },
              riskWeight: 0.9,
              potentialRecipes: ['fix-security'],
              priority: 90,
              estimatedLOC: 10,
            },
          ],
          estimatedImpact: {
            filesAffected: 1,
            locChanged: 10,
            riskReduction: 90,
          },
        },
      ];

      const session = await executor.executeSession(mockRecipes);

      expect(session.executionResults[0].status).toBe('skipped');
      expect(session.executionResults[0].errors?.some((e) => e.includes('protected path'))).toBe(true);
    });
  });
});
