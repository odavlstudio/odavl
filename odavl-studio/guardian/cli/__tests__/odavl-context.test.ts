/**
 * @file odavl-context.test.ts
 * @description Comprehensive unit tests for ODAVL Suite Context System
 * @coverage Target: 95%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ODAVLContextAnalyzer,
  type ODAVLProduct,
  type ODAVLSuiteContext,
  type ProductRelationshipType,
} from '../odavl-context.js';

describe('ODAVLContextAnalyzer', () => {
  let analyzer: ODAVLContextAnalyzer;

  beforeEach(() => {
    analyzer = new ODAVLContextAnalyzer();
  });

  // ============================================================================
  // Basic Functionality Tests
  // ============================================================================

  describe('analyzeSuiteContext()', () => {
    it('should analyze suite context successfully', async () => {
      const context = await analyzer.analyzeSuiteContext();

      expect(context).toBeDefined();
      expect(context.products.length).toBeGreaterThan(10);
      expect(context.relationships.length).toBeGreaterThan(0);
    });

    it('should return all 14 ODAVL products', async () => {
      const context = await analyzer.analyzeSuiteContext();

      expect(context.products.length).toBe(14);
      
      // Verify key products exist
      const productNames = context.products.map(p => p.name);
      expect(productNames).toContain('insight-core');
      expect(productNames).toContain('autopilot-engine');
      expect(productNames).toContain('guardian-cli');
      expect(productNames).toContain('studio-cli');
    });

    it('should include product metadata', async () => {
      const context = await analyzer.analyzeSuiteContext();

      const insightCore = context.products.find(p => p.name === 'insight-core');

      expect(insightCore).toBeDefined();
      expect(insightCore?.directory).toContain('insight/core');
      expect(insightCore?.criticalityScore).toBe(95);
      expect(insightCore?.dependencies.length).toBeGreaterThanOrEqual(0);
      expect(insightCore?.consumers.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Product Detection Tests
  // ============================================================================

  describe('detectProductFromPath()', () => {
    it('should detect insight-core from path', () => {
      const product = analyzer.detectProductFromPath(
        'c:/projects/odavl/odavl-studio/insight/core/src/detector/typescript-detector.ts'
      );

      expect(product).toBe('insight-core');
    });

    it('should detect autopilot-engine from path', () => {
      const product = analyzer.detectProductFromPath(
        'c:/projects/odavl/odavl-studio/autopilot/engine/src/phases/act.ts'
      );

      expect(product).toBe('autopilot-engine');
    });

    it('should detect guardian-cli from path', () => {
      const product = analyzer.detectProductFromPath(
        'c:/projects/odavl/odavl-studio/guardian/cli/guardian.ts'
      );

      expect(product).toBe('guardian-cli');
    });

    it('should detect studio-cli from path', () => {
      const product = analyzer.detectProductFromPath(
        'c:/projects/odavl/apps/studio-cli/src/index.ts'
      );

      expect(product).toBe('studio-cli');
    });

    it('should detect studio-hub from path', () => {
      const product = analyzer.detectProductFromPath(
        'c:/projects/odavl/apps/studio-hub/app/page.tsx'
      );

      expect(product).toBe('studio-hub');
    });

    it('should return unknown for non-ODAVL path', () => {
      const product = analyzer.detectProductFromPath(
        'c:/other-project/src/index.ts'
      );

      expect(product).toBe('unknown');
    });

    it('should handle Windows paths with backslashes', () => {
      const product = analyzer.detectProductFromPath(
        'C:\\Users\\test\\odavl\\odavl-studio\\insight\\core\\src\\detector.ts'
      );

      expect(product).toBe('insight-core');
    });

    it('should handle Linux paths', () => {
      const product = analyzer.detectProductFromPath(
        '/home/user/odavl/odavl-studio/autopilot/engine/src/index.ts'
      );

      expect(product).toBe('autopilot-engine');
    });
  });

  // ============================================================================
  // Relationship Detection Tests
  // ============================================================================

  describe('getProductRelationships()', () => {
    it('should find relationships for insight-core', () => {
      const relationships = analyzer.getProductRelationships('insight-core');

      expect(relationships.length).toBeGreaterThan(0);
      
      // insight-core has many consumers
      const consumers = relationships.filter(r => r.type === 'api-consumer');
      expect(consumers.length).toBeGreaterThan(3);
    });

    it('should find relationships for autopilot-engine', () => {
      const relationships = analyzer.getProductRelationships('autopilot-engine');

      expect(relationships.length).toBeGreaterThan(0);
      
      // autopilot-engine depends on insight-core
      const hasDependency = relationships.some(
        r => r.target === 'insight-core' && r.type === 'api-consumer'
      );
      expect(hasDependency).toBe(true);
    });

    it('should return empty array for product with no relationships', () => {
      const relationships = analyzer.getProductRelationships('unknown' as ODAVLProduct);

      expect(relationships).toEqual([]);
    });

    it('should not include duplicate relationships', () => {
      const relationships = analyzer.getProductRelationships('insight-core');

      const uniqueKey = (r: any) => `${r.source}-${r.target}-${r.type}`;
      const keys = relationships.map(uniqueKey);
      const uniqueKeys = new Set(keys);

      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  // ============================================================================
  // Relationship Type Tests
  // ============================================================================

  describe('Relationship Types', () => {
    it('should identify direct dependencies', () => {
      const relationships = analyzer.getProductRelationships('autopilot-engine');

      const directDep = relationships.find(
        r => r.type === 'direct-dependency'
      );

      // autopilot-engine has direct dependencies
      expect(directDep).toBeDefined();
    });

    it('should identify API consumers', () => {
      const relationships = analyzer.getProductRelationships('insight-core');

      const apiConsumer = relationships.find(
        r => r.type === 'api-consumer'
      );

      expect(apiConsumer).toBeDefined();
    });

    it('should identify shared types', () => {
      const relationships = analyzer.getProductRelationships('studio-cli');

      // CLI uses shared types from core packages
      const sharedTypes = relationships.find(
        r => r.type === 'shared-types'
      );

      expect(sharedTypes).toBeDefined();
    });

    it('should identify VS Code extension relationships', () => {
      const relationships = analyzer.getProductRelationships('insight-extension');

      // Extension uses insight-core
      const extensionRel = relationships.find(
        r => r.type === 'extension-host'
      );

      expect(extensionRel).toBeDefined();
    });
  });

  // ============================================================================
  // Criticality Score Tests
  // ============================================================================

  describe('Criticality Scores', () => {
    it('should assign high criticality to core components', async () => {
      const context = await analyzer.analyzeSuiteContext();

      const insightCore = context.products.find(p => p.name === 'insight-core');
      const autopilotEngine = context.products.find(p => p.name === 'autopilot-engine');

      expect(insightCore?.criticalityScore).toBeGreaterThanOrEqual(90);
      expect(autopilotEngine?.criticalityScore).toBeGreaterThanOrEqual(85);
    });

    it('should assign lower criticality to UI components', async () => {
      const context = await analyzer.analyzeSuiteContext();

      const insightCloud = context.products.find(p => p.name === 'insight-cloud');
      const guardianApp = context.products.find(p => p.name === 'guardian-app');

      expect(insightCloud?.criticalityScore).toBeLessThan(90);
      expect(guardianApp?.criticalityScore).toBeLessThan(90);
    });

    it('should have criticality between 0-100', async () => {
      const context = await analyzer.analyzeSuiteContext();

      context.products.forEach(product => {
        expect(product.criticalityScore).toBeGreaterThanOrEqual(0);
        expect(product.criticalityScore).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============================================================================
  // Graph Analysis Tests
  // ============================================================================

  describe('getAllDependents()', () => {
    it('should find all dependents of insight-core', () => {
      const dependents = analyzer.getAllDependents('insight-core');

      expect(dependents.length).toBeGreaterThan(5);
      expect(dependents).toContain('insight-cloud');
      expect(dependents).toContain('insight-extension');
      expect(dependents).toContain('autopilot-engine');
    });

    it('should find all dependents of autopilot-engine', () => {
      const dependents = analyzer.getAllDependents('autopilot-engine');

      expect(dependents.length).toBeGreaterThan(0);
      expect(dependents).toContain('autopilot-extension');
      expect(dependents).toContain('guardian-cli');
    });

    it('should return empty array for leaf nodes', () => {
      const dependents = analyzer.getAllDependents('insight-cloud');

      // insight-cloud has no consumers (it's a dashboard)
      expect(dependents.length).toBe(0);
    });

    it('should not include duplicates in dependency chain', () => {
      const dependents = analyzer.getAllDependents('insight-core');

      const unique = new Set(dependents);
      expect(dependents.length).toBe(unique.size);
    });
  });

  describe('getAllDependencies()', () => {
    it('should find all dependencies of autopilot-engine', () => {
      const dependencies = analyzer.getAllDependencies('autopilot-engine');

      expect(dependencies.length).toBeGreaterThan(0);
      expect(dependencies).toContain('insight-core');
    });

    it('should find all dependencies of guardian-cli', () => {
      const dependencies = analyzer.getAllDependencies('guardian-cli');

      expect(dependencies.length).toBeGreaterThan(0);
      
      // guardian-cli depends on multiple products
      expect(dependencies).toContain('autopilot-engine');
    });

    it('should return empty array for products with no dependencies', () => {
      const dependencies = analyzer.getAllDependencies('insight-core');

      // insight-core is a core component with no ODAVL dependencies
      expect(dependencies.length).toBe(0);
    });
  });

  // ============================================================================
  // Circular Dependency Tests
  // ============================================================================

  describe('hasCircularDependency()', () => {
    it('should detect no circular dependencies in ODAVL', () => {
      const hasCircular = analyzer.hasCircularDependency('insight-core');

      // ODAVL has no circular dependencies by design
      expect(hasCircular).toBe(false);
    });

    it('should detect no circular dependencies for any product', async () => {
      const context = await analyzer.analyzeSuiteContext();

      context.products.forEach(product => {
        const hasCircular = analyzer.hasCircularDependency(product.name);
        expect(hasCircular).toBe(false);
      });
    });
  });

  // ============================================================================
  // Product Group Tests
  // ============================================================================

  describe('getProductsByGroup()', () => {
    it('should return Insight products', () => {
      const insightProducts = analyzer.getProductsByGroup('insight');

      expect(insightProducts.length).toBe(3);
      expect(insightProducts).toContain('insight-core');
      expect(insightProducts).toContain('insight-cloud');
      expect(insightProducts).toContain('insight-extension');
    });

    it('should return Autopilot products', () => {
      const autopilotProducts = analyzer.getProductsByGroup('autopilot');

      expect(autopilotProducts.length).toBeGreaterThanOrEqual(2);
      expect(autopilotProducts).toContain('autopilot-engine');
      expect(autopilotProducts).toContain('autopilot-extension');
    });

    it('should return Guardian products', () => {
      const guardianProducts = analyzer.getProductsByGroup('guardian');

      expect(guardianProducts.length).toBeGreaterThanOrEqual(2);
      expect(guardianProducts).toContain('guardian-cli');
      expect(guardianProducts).toContain('guardian-app');
    });

    it('should return empty array for unknown group', () => {
      const unknownProducts = analyzer.getProductsByGroup('unknown' as any);

      expect(unknownProducts).toEqual([]);
    });
  });

  // ============================================================================
  // Utility Method Tests
  // ============================================================================

  describe('isODAVLProduct()', () => {
    it('should return true for valid ODAVL products', () => {
      expect(analyzer.isODAVLProduct('insight-core')).toBe(true);
      expect(analyzer.isODAVLProduct('autopilot-engine')).toBe(true);
      expect(analyzer.isODAVLProduct('guardian-cli')).toBe(true);
    });

    it('should return false for invalid products', () => {
      expect(analyzer.isODAVLProduct('unknown')).toBe(false);
      expect(analyzer.isODAVLProduct('random-package')).toBe(false);
      expect(analyzer.isODAVLProduct('')).toBe(false);
    });
  });

  describe('getProductDirectory()', () => {
    it('should return correct directory for insight-core', () => {
      const dir = analyzer.getProductDirectory('insight-core');

      expect(dir).toContain('insight/core');
    });

    it('should return correct directory for autopilot-engine', () => {
      const dir = analyzer.getProductDirectory('autopilot-engine');

      expect(dir).toContain('autopilot/engine');
    });

    it('should return undefined for unknown product', () => {
      const dir = analyzer.getProductDirectory('unknown' as ODAVLProduct);

      expect(dir).toBeUndefined();
    });
  });

  describe('listAllProducts()', () => {
    it('should return array of all 14 products', () => {
      const products = analyzer.listAllProducts();

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(14);
    });

    it('should include all key products', () => {
      const products = analyzer.listAllProducts();

      expect(products).toContain('insight-core');
      expect(products).toContain('autopilot-engine');
      expect(products).toContain('guardian-cli');
      expect(products).toContain('studio-cli');
      expect(products).toContain('studio-hub');
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty path gracefully', () => {
      const product = analyzer.detectProductFromPath('');

      expect(product).toBe('unknown');
    });

    it('should handle null/undefined gracefully', () => {
      const product = analyzer.detectProductFromPath(undefined as any);

      expect(product).toBe('unknown');
    });

    it('should handle paths with special characters', () => {
      const product = analyzer.detectProductFromPath(
        'c:/projects/odavl (test)/odavl-studio/insight/core/src/index.ts'
      );

      expect(product).toBe('insight-core');
    });

    it('should handle very long paths', () => {
      const longPath = 'c:/' + 'a/'.repeat(100) + 'odavl-studio/insight/core/src/index.ts';
      const product = analyzer.detectProductFromPath(longPath);

      expect(product).toBe('insight-core');
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should analyze suite context quickly (<1s)', async () => {
      const start = Date.now();
      await analyzer.analyzeSuiteContext();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    }, 3000);

    it('should detect product from path quickly (<10ms)', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        analyzer.detectProductFromPath(
          'c:/projects/odavl/odavl-studio/insight/core/src/index.ts'
        );
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // <0.1ms per operation
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration with ImpactAnalyzer', () => {
    it('should provide data structure compatible with ImpactAnalyzer', async () => {
      const context = await analyzer.analyzeSuiteContext();

      // ImpactAnalyzer expects specific fields
      context.products.forEach(product => {
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('directory');
        expect(product).toHaveProperty('dependencies');
        expect(product).toHaveProperty('consumers');
        expect(product).toHaveProperty('criticalityScore');
      });

      context.relationships.forEach(rel => {
        expect(rel).toHaveProperty('source');
        expect(rel).toHaveProperty('target');
        expect(rel).toHaveProperty('type');
      });
    });

    it('should work with getAllDependents for cascade analysis', () => {
      const dependents = analyzer.getAllDependents('insight-core');

      // ImpactAnalyzer uses this for cascade tree building
      expect(Array.isArray(dependents)).toBe(true);
      expect(dependents.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // JSON Serialization Tests
  // ============================================================================

  describe('JSON Serialization', () => {
    it('should serialize suite context to JSON', async () => {
      const context = await analyzer.analyzeSuiteContext();

      const json = JSON.stringify(context);
      const parsed = JSON.parse(json);

      expect(parsed.products.length).toBe(context.products.length);
      expect(parsed.relationships.length).toBe(context.relationships.length);
    });

    it('should preserve all data after serialization', async () => {
      const context = await analyzer.analyzeSuiteContext();

      const json = JSON.stringify(context);
      const parsed = JSON.parse(json) as ODAVLSuiteContext;

      const insightCore = parsed.products.find(p => p.name === 'insight-core');
      expect(insightCore?.criticalityScore).toBe(95);
    });
  });
});

// ============================================================================
// Relationship Type Validation Tests
// ============================================================================

describe('Relationship Type Validation', () => {
  it('should use only valid relationship types', async () => {
    const analyzer = new ODAVLContextAnalyzer();
    const context = await analyzer.analyzeSuiteContext();

    const validTypes: ProductRelationshipType[] = [
      'direct-dependency',
      'api-consumer',
      'shared-types',
      'extension-host',
      'monorepo-sibling',
      'indirect-dependency',
    ];

    context.relationships.forEach(rel => {
      expect(validTypes).toContain(rel.type);
    });
  });
});
