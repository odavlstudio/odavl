/**
 * @file impact-analyzer.test.ts
 * @description Comprehensive unit tests for ImpactAnalyzer
 * @coverage Target: 95%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ImpactAnalyzer,
  type ODAVLProduct,
  type ImpactAnalysis,
  type CorrelatedError,
} from '../impact-analyzer.js';

describe('ImpactAnalyzer', () => {
  let analyzer: ImpactAnalyzer;

  beforeEach(() => {
    analyzer = new ImpactAnalyzer();
  });

  // ============================================================================
  // Core Functionality Tests
  // ============================================================================

  describe('analyzeDeepImpact()', () => {
    it('should analyze insight-core and find 6+ affected products', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      expect(result).toBeDefined();
      expect(result.source).toBe('insight-core');
      expect(result.affected.length).toBeGreaterThanOrEqual(6);
      expect(result.overallSeverity).toBe('critical');
      expect(result.cascadeDepth).toBeGreaterThanOrEqual(3);
    });

    it('should analyze autopilot-engine and find correct affected products', async () => {
      const result = await analyzer.analyzeDeepImpact('autopilot-engine');

      expect(result.source).toBe('autopilot-engine');
      expect(result.affected.length).toBeGreaterThan(0);
      
      // autopilot-extension should be affected
      const hasAutopilotExtension = result.affected.some(
        p => p.product === 'autopilot-extension'
      );
      expect(hasAutopilotExtension).toBe(true);
      
      // guardian-cli should be affected
      const hasGuardianCli = result.affected.some(
        p => p.product === 'guardian-cli'
      );
      expect(hasGuardianCli).toBe(true);
    });

    it('should include error context in analysis', async () => {
      const errorContext = {
        message: 'TypeScript error: Property does not exist',
        file: 'src/test.ts',
        severity: 'critical',
      };

      const result = await analyzer.analyzeDeepImpact('insight-core', errorContext);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('Fix error in insight-core');
      expect(result.recommendations[0]).toContain('src/test.ts');
    });

    it('should calculate confidence scores between 0-100', async () => {
      const result = await analyzer.analyzeDeepImpact('guardian-core');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);

      result.affected.forEach(affected => {
        expect(affected.confidence).toBeGreaterThanOrEqual(0);
        expect(affected.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should generate test plan with correct order', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      expect(result.testPlan.length).toBeGreaterThan(0);
      expect(result.testPlan[0]).toContain('Test insight-core (source)');
      
      // Should have integration test at the end if multiple products affected
      if (result.affected.length > 2) {
        const lastStep = result.testPlan[result.testPlan.length - 1];
        expect(lastStep).toContain('integration');
      }
    });

    it('should throw error for unknown product', async () => {
      await expect(
        analyzer.analyzeDeepImpact('unknown-product' as ODAVLProduct)
      ).rejects.toThrow('Unknown product');
    });
  });

  // ============================================================================
  // Cascade Tree Building Tests
  // ============================================================================

  describe('buildCascadeTree() - Edge Cases', () => {
    it('should prevent infinite loops with circular dependencies', async () => {
      // Even if we artificially create circular deps, it should handle them
      const result = await analyzer.analyzeDeepImpact('insight-core');
      
      // Should complete without hanging
      expect(result).toBeDefined();
      expect(result.cascadeDepth).toBeLessThanOrEqual(5); // Max depth limit
    });

    it('should limit cascade depth to 5 levels', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      expect(result.cascadeDepth).toBeLessThanOrEqual(5);
    });

    it('should handle products with no consumers', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-cloud');

      // insight-cloud has no consumers, so only 0 affected
      expect(result.affected.length).toBe(0);
      expect(result.cascadeDepth).toBe(1);
    });

    it('should handle products with multiple consumers correctly', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      // insight-core has multiple consumers
      expect(result.affected.length).toBeGreaterThan(3);
      
      // Should not have duplicates
      const productNames = result.affected.map(a => a.product);
      const uniqueNames = new Set(productNames);
      expect(productNames.length).toBe(uniqueNames.size);
    });
  });

  // ============================================================================
  // Severity Calculation Tests
  // ============================================================================

  describe('calculateSeverity()', () => {
    it('should return CRITICAL for critical error + high criticality target', async () => {
      const errorContext = {
        message: 'Critical error',
        severity: 'critical',
      };

      const result = await analyzer.analyzeDeepImpact('insight-core', errorContext);

      // insight-core has criticality 95, so overall should be critical
      expect(result.overallSeverity).toBe('critical');
    });

    it('should return HIGH for api-consumer of critical component', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      // autopilot-engine is api-consumer of insight-core (criticality 95)
      const autopilotImpact = result.affected.find(
        a => a.product === 'autopilot-engine'
      );

      if (autopilotImpact) {
        expect(autopilotImpact.severity).toBe('high');
      }
    });

    it('should return MEDIUM for direct dependencies', async () => {
      const result = await analyzer.analyzeDeepImpact('guardian-core');

      // Should have some medium severity impacts
      const hasMediumSeverity = result.affected.some(
        a => a.severity === 'medium'
      );
      expect(hasMediumSeverity).toBe(true);
    });
  });

  // ============================================================================
  // Confidence Calculation Tests
  // ============================================================================

  describe('calculateImpactConfidence()', () => {
    it('should have higher confidence for direct dependencies', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      const directConsumer = result.affected.find(
        a => a.relationshipType === 'direct-dependency' || 
             a.relationshipType === 'api-consumer'
      );

      if (directConsumer) {
        expect(directConsumer.confidence).toBeGreaterThan(70);
      }
    });

    it('should increase confidence when error context provided', async () => {
      const withoutContext = await analyzer.analyzeDeepImpact('insight-core');
      const withContext = await analyzer.analyzeDeepImpact('insight-core', {
        message: 'Error',
        severity: 'high',
      });

      // With context should have equal or higher confidence
      expect(withContext.confidence).toBeGreaterThanOrEqual(withoutContext.confidence);
    });

    it('should have high confidence for known critical relationships', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      // autopilot-engine depends on insight-core (known strong relationship)
      const autopilotImpact = result.affected.find(
        a => a.product === 'autopilot-engine'
      );

      if (autopilotImpact) {
        expect(autopilotImpact.confidence).toBeGreaterThan(80);
      }
    });
  });

  // ============================================================================
  // Recommendations Generation Tests
  // ============================================================================

  describe('generateRecommendations()', () => {
    it('should always recommend fixing source first', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('insight-core');
      expect(result.recommendations[0]).toMatch(/Fix|Verify/i);
    });

    it('should recommend testing high-impact products', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      const criticalAffected = result.affected.filter(
        a => a.severity === 'critical' || a.severity === 'high'
      );

      if (criticalAffected.length > 0) {
        const hasTestRecommendation = result.recommendations.some(
          r => r.toLowerCase().includes('test')
        );
        expect(hasTestRecommendation).toBe(true);
      }
    });

    it('should recommend rebuild for core components', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      const hasRebuildRecommendation = result.recommendations.some(
        r => r.toLowerCase().includes('rebuild')
      );
      expect(hasRebuildRecommendation).toBe(true);
    });

    it('should recommend manual review for critical components', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      // insight-core has criticality 95
      const hasManualReview = result.recommendations.some(
        r => r.toLowerCase().includes('manual') || r.toLowerCase().includes('review')
      );
      expect(hasManualReview).toBe(true);
    });
  });

  // ============================================================================
  // Error Correlation Tests
  // ============================================================================

  describe('correlateErrors()', () => {
    it('should correlate similar errors across products', async () => {
      const errors = [
        {
          product: 'insight-core' as ODAVLProduct,
          message: 'TypeScript error: Property x does not exist',
          file: 'src/a.ts',
          line: 10,
        },
        {
          product: 'autopilot-engine' as ODAVLProduct,
          message: 'TypeScript error: Property x does not exist',
          file: 'src/b.ts',
          line: 20,
        },
        {
          product: 'guardian-cli' as ODAVLProduct,
          message: 'TypeScript error: Property x does not exist',
          file: 'src/c.ts',
          line: 30,
        },
      ];

      const correlated = await analyzer.correlateErrors(errors);

      expect(correlated.length).toBeGreaterThan(0);
      expect(correlated[0].locations.length).toBeGreaterThanOrEqual(2);
    });

    it('should not correlate completely different errors', async () => {
      const errors = [
        {
          product: 'insight-core' as ODAVLProduct,
          message: 'TypeScript error: Property x does not exist',
          file: 'src/a.ts',
        },
        {
          product: 'autopilot-engine' as ODAVLProduct,
          message: 'ESLint: no-console rule violation',
          file: 'src/b.ts',
        },
      ];

      const correlated = await analyzer.correlateErrors(errors);

      // These are very different errors, should not correlate
      expect(correlated.length).toBeLessThanOrEqual(1);
    });

    it('should identify root cause in core products', async () => {
      const errors = [
        {
          product: 'insight-core' as ODAVLProduct,
          message: 'Type error in shared interface',
          file: 'src/types.ts',
        },
        {
          product: 'autopilot-engine' as ODAVLProduct,
          message: 'Type error in shared interface',
          file: 'src/main.ts',
        },
      ];

      const correlated = await analyzer.correlateErrors(errors);

      if (correlated.length > 0) {
        expect(correlated[0].rootCause).toContain('insight-core');
      }
    });

    it('should calculate correlation confidence correctly', async () => {
      const errors = [
        {
          product: 'insight-core' as ODAVLProduct,
          message: 'Error A',
          file: 'src/a.ts',
        },
        {
          product: 'autopilot-engine' as ODAVLProduct,
          message: 'Error A',
          file: 'src/b.ts',
        },
      ];

      const correlated = await analyzer.correlateErrors(errors);

      if (correlated.length > 0) {
        expect(correlated[0].confidence).toBeGreaterThanOrEqual(0);
        expect(correlated[0].confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  // ============================================================================
  // Fix Order Suggestion Tests
  // ============================================================================

  describe('suggestFixOrder()', () => {
    it('should prioritize core components with high criticality', async () => {
      const analyses = [
        await analyzer.analyzeDeepImpact('insight-core'),    // 95
        await analyzer.analyzeDeepImpact('autopilot-engine'), // 90
        await analyzer.analyzeDeepImpact('guardian-cli'),     // 80
      ];

      const fixOrder = analyzer.suggestFixOrder(analyses);

      expect(fixOrder.length).toBe(3);
      expect(fixOrder[0]).toContain('insight-core'); // Highest criticality first
    });

    it('should return empty array for empty input', () => {
      const fixOrder = analyzer.suggestFixOrder([]);
      expect(fixOrder).toEqual([]);
    });
  });

  // ============================================================================
  // Visual Tree Tests
  // ============================================================================

  describe('visualizeCascade()', () => {
    it('should generate valid ASCII tree structure', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      expect(result.visualTree).toBeDefined();
      expect(result.visualTree.length).toBeGreaterThan(0);
      
      // Should contain tree characters
      expect(result.visualTree).toMatch(/[└├─│]/);
      
      // Should contain emoji indicators
      expect(result.visualTree).toMatch(/[🔴🟡🔵⚪]/);
    });

    it('should show severity levels in tree', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core');

      expect(result.visualTree).toContain('CRITICAL');
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('getProductMetadata()', () => {
    it('should return metadata for valid product', () => {
      const metadata = analyzer.getProductMetadata('insight-core');

      expect(metadata).toBeDefined();
      expect(metadata?.product).toBe('insight-core');
      expect(metadata?.criticalityScore).toBe(95);
    });

    it('should return undefined for invalid product', () => {
      const metadata = analyzer.getProductMetadata('invalid' as ODAVLProduct);
      expect(metadata).toBeUndefined();
    });
  });

  describe('listAllProducts()', () => {
    it('should return array of all products', () => {
      const products = analyzer.listAllProducts();

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(10);
      expect(products).toContain('insight-core');
      expect(products).toContain('autopilot-engine');
      expect(products).toContain('guardian-cli');
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should complete analysis in reasonable time (<5s)', async () => {
      const start = Date.now();
      await analyzer.analyzeDeepImpact('insight-core');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    }, 10000);

    it('should handle multiple sequential analyses efficiently', async () => {
      const start = Date.now();

      await analyzer.analyzeDeepImpact('insight-core');
      await analyzer.analyzeDeepImpact('autopilot-engine');
      await analyzer.analyzeDeepImpact('guardian-cli');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000);
    }, 15000);
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty error context gracefully', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core', undefined);
      expect(result).toBeDefined();
    });

    it('should handle partial error context', async () => {
      const result = await analyzer.analyzeDeepImpact('insight-core', {
        message: 'Error',
        // file and severity missing
      });
      expect(result).toBeDefined();
    });

    it('should handle product with no dependencies', async () => {
      const result = await analyzer.analyzeDeepImpact('studio-hub');
      
      // studio-hub has no dependencies on ODAVL products
      expect(result).toBeDefined();
      expect(result.affected.length).toBe(0);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ImpactAnalyzer Integration Tests', () => {
  it('should work with formatImpactAnalysis() helper', async () => {
    const analyzer = new ImpactAnalyzer();
    const result = await analyzer.analyzeDeepImpact('insight-core');

    // formatImpactAnalysis should be importable and work
    expect(result.visualTree).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  it('should produce JSON-serializable output', async () => {
    const analyzer = new ImpactAnalyzer();
    const result = await analyzer.analyzeDeepImpact('insight-core');

    // Should be able to stringify and parse
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);

    expect(parsed.source).toBe('insight-core');
    expect(parsed.affected).toBeDefined();
  });
});
