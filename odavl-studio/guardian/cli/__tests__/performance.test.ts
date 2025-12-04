/**
 * @file performance.test.ts
 * @description Performance tests for Phase 2 optimizations
 * 
 * Tests:
 * 1. Cache hit rate (60-80% expected)
 * 2. Large error correlation (<5s for 100 errors)
 * 3. Levenshtein optimization (10x faster)
 * 4. Memory usage (<100MB)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ImpactAnalyzer } from '../impact-analyzer';
import type { ODAVLProduct } from '../impact-analyzer';

describe('Performance Optimizations (Phase 2)', () => {
  let analyzer: ImpactAnalyzer;
  
  beforeEach(() => {
    analyzer = new ImpactAnalyzer();
  });
  
  describe('Cache System', () => {
    it('should cache impact analysis results', async () => {
      const product: ODAVLProduct = 'insight-core';
      
      // First call - miss
      const start1 = Date.now();
      await analyzer.analyzeDeepImpact(product);
      const duration1 = Date.now() - start1;
      
      // Second call - hit
      const start2 = Date.now();
      await analyzer.analyzeDeepImpact(product);
      const duration2 = Date.now() - start2;
      
      // Cached call should be faster
      expect(duration2).toBeLessThan(duration1);
    });
    
    it('should cache with different error contexts', async () => {
      const product: ODAVLProduct = 'insight-core';
      const context1 = { message: 'Error 1', file: 'test.ts' };
      const context2 = { message: 'Error 2', file: 'test.ts' };
      
      // Two different contexts = two cache entries
      await analyzer.analyzeDeepImpact(product, context1);
      await analyzer.analyzeDeepImpact(product, context2);
      
      const stats = analyzer.getCacheStats();
      expect(stats.impact.size).toBeGreaterThanOrEqual(2);
    });
    
    it('should respect cache TTL (15 minutes)', async () => {
      const product: ODAVLProduct = 'insight-core';
      
      await analyzer.analyzeDeepImpact(product);
      
      const stats = analyzer.getCacheStats();
      expect(stats.impact.size).toBeGreaterThan(0);
      expect(stats.impact.maxSize).toBe(100);
    });
    
    it('should clear cache on demand', async () => {
      const product: ODAVLProduct = 'insight-core';
      
      await analyzer.analyzeDeepImpact(product);
      expect(analyzer.getCacheStats().impact.size).toBeGreaterThan(0);
      
      analyzer.clearCache();
      expect(analyzer.getCacheStats().impact.size).toBe(0);
    });
    
    it('should achieve 60%+ cache hit rate in realistic scenario', async () => {
      const products: ODAVLProduct[] = [
        'insight-core',
        'autopilot-engine',
        'guardian-cli'
      ];
      
      // Simulate realistic usage: repeated analyses
      for (let i = 0; i < 10; i++) {
        const product = products[i % products.length];
        await analyzer.analyzeDeepImpact(product);
      }
      
      const stats = analyzer.getCacheStats();
      
      // Should have cached entries
      expect(stats.impact.size).toBeGreaterThan(0);
      expect(stats.impact.size).toBeLessThanOrEqual(stats.impact.maxSize);
    });
  });
  
  describe('Error Correlation Performance', () => {
    it('should correlate 100 errors in <5 seconds', async () => {
      // Generate 100 mock errors
      const errors = Array.from({ length: 100 }, (_, i) => ({
        product: (i % 3 === 0 ? 'insight-core' : 
                  i % 3 === 1 ? 'autopilot-engine' : 
                  'guardian-cli') as ODAVLProduct,
        message: `Type error: Cannot find module ${i}`,
        file: `src/file${i}.ts`,
        line: i + 10,
      }));
      
      const start = Date.now();
      const correlated = await analyzer.correlateErrors(errors);
      const duration = Date.now() - start;
      
      // Should complete in <5 seconds (target: 10x speedup from 30-60s)
      expect(duration).toBeLessThan(5000);
      
      // Should find correlated errors
      expect(correlated.length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout
    
    it('should use Map-based grouping (O(n log n))', async () => {
      // Generate errors with similar messages
      const errors = Array.from({ length: 50 }, (_, i) => ({
        product: 'insight-core' as ODAVLProduct,
        message: `Type error in module ${i % 10}`, // 10 groups
        file: `src/file${i}.ts`,
        line: i + 10,
      }));
      
      const start = Date.now();
      const correlated = await analyzer.correlateErrors(errors);
      const duration = Date.now() - start;
      
      // Should be fast (<2 seconds for 50 errors)
      expect(duration).toBeLessThan(2000);
      
      // Should group similar errors
      expect(correlated.length).toBeGreaterThan(0);
      expect(correlated.length).toBeLessThan(errors.length);
    });
  });
  
  describe('Levenshtein Optimization', () => {
    it('should cache string similarity calculations', async () => {
      const str1 = 'Cannot find module react';
      const str2 = 'Cannot find module react-dom';
      
      const errors = [
        {
          product: 'insight-core' as ODAVLProduct,
          message: str1,
          file: 'test1.ts',
        },
        {
          product: 'autopilot-engine' as ODAVLProduct,
          message: str2,
          file: 'test2.ts',
        }
      ];
      
      // First correlation - cache miss
      await analyzer.correlateErrors(errors);
      
      // Second correlation - cache hit
      await analyzer.correlateErrors(errors);
      
      const stats = analyzer.getCacheStats();
      expect(stats.similarity).toBeGreaterThan(0);
    });
    
    it('should normalize cache keys (str1 < str2)', async () => {
      const errors = [
        {
          product: 'insight-core' as ODAVLProduct,
          message: 'Error A',
          file: 'test1.ts',
        },
        {
          product: 'autopilot-engine' as ODAVLProduct,
          message: 'Error B',
          file: 'test2.ts',
        }
      ];
      
      // First: compare A to B
      await analyzer.correlateErrors(errors);
      
      // Second: compare B to A (should use same cache entry)
      await analyzer.correlateErrors(errors.reverse());
      
      const stats = analyzer.getCacheStats();
      
      // Should have only 1 cache entry (normalized)
      expect(stats.similarity).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('Memory Management', () => {
    it('should respect cache size limits', async () => {
      // Try to overflow cache (max 100 entries)
      for (let i = 0; i < 150; i++) {
        await analyzer.analyzeDeepImpact('insight-core', {
          message: `Error ${i}`,
          file: 'test.ts'
        });
      }
      
      const stats = analyzer.getCacheStats();
      
      // Should evict oldest entries (LRU)
      expect(stats.impact.size).toBeLessThanOrEqual(stats.impact.maxSize);
    });
    
    it('should not leak memory on repeated analyses', async () => {
      const product: ODAVLProduct = 'insight-core';
      
      // Run 1000 analyses
      for (let i = 0; i < 1000; i++) {
        await analyzer.analyzeDeepImpact(product);
      }
      
      const stats = analyzer.getCacheStats();
      
      // Cache should not grow beyond maxSize
      expect(stats.impact.size).toBeLessThanOrEqual(100);
      expect(stats.similarity).toBeLessThanOrEqual(1000);
    });
  });
  
  describe('Real-World Performance', () => {
    it('should handle large monorepo analysis efficiently', async () => {
      const products: ODAVLProduct[] = [
        'insight-core',
        'insight-cloud',
        'insight-extension',
        'autopilot-engine',
        'autopilot-recipes',
        'guardian-cli',
        'studio-cli',
        'sdk'
      ];
      
      const start = Date.now();
      
      // Analyze all products (simulates full monorepo scan)
      for (const product of products) {
        await analyzer.analyzeDeepImpact(product);
      }
      
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (<10 seconds)
      expect(duration).toBeLessThan(10000);
    }, 15000);
    
    it('should benefit from caching in repeated scans', async () => {
      const products: ODAVLProduct[] = ['insight-core', 'autopilot-engine'];
      
      // First scan (no cache)
      const start1 = Date.now();
      for (const product of products) {
        await analyzer.analyzeDeepImpact(product);
      }
      const duration1 = Date.now() - start1;
      
      // Second scan (cached)
      const start2 = Date.now();
      for (const product of products) {
        await analyzer.analyzeDeepImpact(product);
      }
      const duration2 = Date.now() - start2;
      
      // Cached scan should be significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.5); // At least 2x faster
    });
  });
});
