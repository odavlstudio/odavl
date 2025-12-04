/**
 * @file config-loader.test.ts
 * @description Tests for dynamic configuration system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigLoader } from '../config-loader';
import { DEFAULT_CONFIG, CONSTANTS } from '../guardian.config.schema';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Configuration System (Phase 3)', () => {
  let loader: ConfigLoader;
  const testRoot = process.cwd();
  
  beforeEach(() => {
    loader = new ConfigLoader(testRoot);
  });
  
  describe('Default Configuration', () => {
    it('should load default config when no file exists', async () => {
      const config = await loader.load();
      
      expect(config.version).toBe('1.0.0');
      expect(config.products?.autoDiscover?.enabled).toBe(true);
      expect(config.performance?.impactCache?.maxSize).toBe(100);
    });
    
    it('should use constants for default values', () => {
      expect(CONSTANTS.DEFAULT_CACHE_SIZE).toBe(100);
      expect(CONSTANTS.DEFAULT_CACHE_TTL_MINUTES).toBe(15);
      expect(CONSTANTS.DEFAULT_SIMILARITY_CACHE_SIZE).toBe(1000);
    });
    
    it('should provide performance settings', async () => {
      await loader.load();
      const settings = loader.getPerformanceSettings();
      
      expect(settings.impactCacheMaxSize).toBe(100);
      expect(settings.impactCacheTTL).toBe(15 * 60 * 1000); // 15 minutes in ms
      expect(settings.similarityCacheMaxSize).toBe(1000);
    });
  });
  
  describe('Severity Thresholds', () => {
    it('should provide severity thresholds', async () => {
      await loader.load();
      const thresholds = loader.getSeverityThresholds();
      
      expect(thresholds.low).toBe(25);
      expect(thresholds.medium).toBe(50);
      expect(thresholds.high).toBe(75);
      expect(thresholds.critical).toBe(90);
    });
    
    it('should use named constants instead of magic numbers', () => {
      expect(CONSTANTS.SEVERITY_LOW).toBe(25);
      expect(CONSTANTS.SEVERITY_MEDIUM).toBe(50);
      expect(CONSTANTS.SEVERITY_HIGH).toBe(75);
      expect(CONSTANTS.SEVERITY_CRITICAL).toBe(90);
    });
  });
  
  describe('Confidence Thresholds', () => {
    it('should provide confidence thresholds', async () => {
      await loader.load();
      const thresholds = loader.getConfidenceThresholds();
      
      expect(thresholds.minimum).toBe(30);
      expect(thresholds.warning).toBe(50);
      expect(thresholds.high).toBe(70);
      expect(thresholds.excellent).toBe(90);
    });
  });
  
  describe('Criticality Scores', () => {
    it('should define constants for different product types', () => {
      expect(CONSTANTS.CORE_PRODUCT_CRITICALITY).toBe(95);
      expect(CONSTANTS.ENGINE_PRODUCT_CRITICALITY).toBe(90);
      expect(CONSTANTS.CLI_PRODUCT_CRITICALITY).toBe(80);
      expect(CONSTANTS.DASHBOARD_PRODUCT_CRITICALITY).toBe(70);
      expect(CONSTANTS.EXTENSION_PRODUCT_CRITICALITY).toBe(65);
    });
  });
  
  describe('Impact Weights', () => {
    it('should define relationship weights as constants', () => {
      expect(CONSTANTS.DIRECT_DEPENDENCY_WEIGHT).toBe(1.0);
      expect(CONSTANTS.API_CONSUMER_WEIGHT).toBe(0.9);
      expect(CONSTANTS.DATA_CONSUMER_WEIGHT).toBe(0.7);
      expect(CONSTANTS.WORKFLOW_TRIGGER_WEIGHT).toBe(0.6);
      expect(CONSTANTS.SHARED_TYPES_WEIGHT).toBe(0.5);
      expect(CONSTANTS.INDIRECT_WEIGHT).toBe(0.3);
    });
  });
  
  describe('Auto-Discovery', () => {
    it('should attempt to discover products from workspace', async () => {
      await loader.load();
      const discovered = loader.getDiscoveredProducts();
      
      // Should discover some products (depending on workspace structure)
      expect(Array.isArray(discovered)).toBe(true);
    });
    
    it('should use pnpm-workspace.yaml by default', async () => {
      const config = await loader.load();
      
      expect(config.products?.autoDiscover?.workspaceFile).toBe('pnpm-workspace.yaml');
    });
  });
  
  describe('Configuration Merging', () => {
    it('should merge user config with defaults', async () => {
      // This test assumes guardian.config.json might exist
      const config = await loader.load();
      
      // Should have default structure
      expect(config.version).toBeDefined();
      expect(config.products).toBeDefined();
      expect(config.performance).toBeDefined();
    });
  });
  
  describe('Constants Usage', () => {
    it('should eliminate magic numbers', () => {
      // All thresholds should be defined as constants
      const magicNumbers = [25, 50, 75, 90]; // Old magic numbers
      
      // Now as named constants
      expect(CONSTANTS.SEVERITY_LOW).toBe(magicNumbers[0]);
      expect(CONSTANTS.SEVERITY_MEDIUM).toBe(magicNumbers[1]);
      expect(CONSTANTS.SEVERITY_HIGH).toBe(magicNumbers[2]);
      expect(CONSTANTS.SEVERITY_CRITICAL).toBe(magicNumbers[3]);
    });
    
    it('should provide cascade limits', () => {
      expect(CONSTANTS.MAX_CASCADE_DEPTH).toBe(5);
      expect(CONSTANTS.MAX_ERRORS_TO_CORRELATE).toBe(1000);
      expect(CONSTANTS.CORRELATION_TIMEOUT_MS).toBe(30000);
    });
  });
  
  describe('Dashboard Configuration', () => {
    it('should provide dashboard settings', async () => {
      const config = await loader.load();
      
      expect(config.dashboard?.port).toBe(3333);
      expect(config.dashboard?.autoOpen).toBe(true);
      expect(config.dashboard?.theme).toBe('auto');
    });
    
    it('should use default port constant', () => {
      expect(CONSTANTS.DEFAULT_DASHBOARD_PORT).toBe(3333);
    });
  });
  
  describe('Real-World Scenarios', () => {
    it('should support custom products via config', async () => {
      const config = await loader.load();
      
      // Custom products should be definable
      expect(Array.isArray(config.products?.custom)).toBe(true);
    });
    
    it('should allow criticality score overrides', async () => {
      const config = await loader.load();
      
      // Criticality scores should be overridable
      expect(typeof config.products?.criticalityScores).toBe('object');
    });
    
    it('should support plugin system structure', async () => {
      const config = await loader.load();
      
      // Plugin system should be defined
      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins?.detectors)).toBe(true);
      expect(Array.isArray(config.plugins?.analyzers)).toBe(true);
    });
  });
});
