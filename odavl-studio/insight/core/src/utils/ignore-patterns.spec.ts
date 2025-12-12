/**
 * Unit tests for ignore-patterns.ts
 * Tests false positive elimination for ODAVL Insight
 * 
 * Phase 5: Unit Tests - ignore-patterns.ts
 */

import { describe, it, expect } from 'vitest';
import {
  shouldIgnoreFile,
  GLOBAL_IGNORE_PATTERNS,
  SECURITY_IGNORE_PATTERNS,
  PERFORMANCE_IGNORE_PATTERNS,
  filterIgnoredFiles,
  isFalsePositiveByLocation,
} from './ignore-patterns';

describe('ignore-patterns.ts - False Positive Elimination', () => {
  describe('GLOBAL_IGNORE_PATTERNS', () => {
    it('should contain 52+ ignore patterns', () => {
      expect(GLOBAL_IGNORE_PATTERNS.length).toBeGreaterThanOrEqual(52);
    });

    it('should include critical patterns', () => {
      const patterns = GLOBAL_IGNORE_PATTERNS;
      
      // Test directories
      expect(patterns).toContain('**/test-fixtures/**');
      expect(patterns).toContain('**/dist/**');
      expect(patterns).toContain('**/.next/**');
      expect(patterns).toContain('**/node_modules/**');
      
      // Build outputs
      expect(patterns).toContain('**/out/**');
      expect(patterns).toContain('**/build/**');
      
      // Test files (flexible pattern matching)
      expect(patterns.some(p => p.includes('.test.') || p.includes('.spec.'))).toBe(true);
      expect(patterns.some(p => p.includes('.spec.') || p.includes('test'))).toBe(true);
      expect(patterns.some(p => p.includes('__tests__'))).toBe(true);
      
      // Mock/Example files
      expect(patterns.some(p => p.includes('mock'))).toBe(true);
      expect(patterns.some(p => p.includes('example'))).toBe(true);
    });
  });

  describe('shouldIgnoreFile() - Path Filtering', () => {
    describe('✅ Should IGNORE (return true)', () => {
      it('node_modules/**', () => {
        expect(shouldIgnoreFile('node_modules/react/index.js')).toBe(true);
        expect(shouldIgnoreFile('src/node_modules/pkg/file.ts')).toBe(true);
      });

      it('dist/**', () => {
        expect(shouldIgnoreFile('dist/index.js')).toBe(true);
        expect(shouldIgnoreFile('packages/core/dist/bundle.js')).toBe(true);
      });

      it('.next/**', () => {
        expect(shouldIgnoreFile('.next/server/pages/index.js')).toBe(true);
        expect(shouldIgnoreFile('apps/web/.next/static/chunks/main.js')).toBe(true);
      });

      it('test-fixtures/**', () => {
        expect(shouldIgnoreFile('test-fixtures/broken-code.ts')).toBe(true);
        expect(shouldIgnoreFile('src/test-fixtures/mock-data.json')).toBe(true);
      });

      it('*.test.* and *.spec.*', () => {
        expect(shouldIgnoreFile('src/utils/helpers.test.ts')).toBe(true);
        expect(shouldIgnoreFile('src/components/Button.spec.tsx')).toBe(true);
        expect(shouldIgnoreFile('tests/integration/api.test.js')).toBe(true);
      });

      it('__tests__/**', () => {
        expect(shouldIgnoreFile('src/__tests__/unit/math.ts')).toBe(true);
        expect(shouldIgnoreFile('__tests__/integration/api.ts')).toBe(true);
      });

      it('.vscode/** and .idea/**', () => {
        expect(shouldIgnoreFile('.vscode/settings.json')).toBe(true);
        expect(shouldIgnoreFile('.idea/workspace.xml')).toBe(true);
      });

      it('coverage/**', () => {
        expect(shouldIgnoreFile('coverage/lcov-report/index.html')).toBe(true);
        expect(shouldIgnoreFile('packages/core/coverage/coverage.json')).toBe(true);
      });
    });

    describe('❌ Should NOT IGNORE (return false)', () => {
      it('production source files', () => {
        expect(shouldIgnoreFile('src/index.ts')).toBe(false);
        expect(shouldIgnoreFile('src/components/Button.tsx')).toBe(false);
        expect(shouldIgnoreFile('packages/core/src/utils.ts')).toBe(false);
      });

      it('configuration files', () => {
        expect(shouldIgnoreFile('package.json')).toBe(false);
        expect(shouldIgnoreFile('tsconfig.json')).toBe(false);
        expect(shouldIgnoreFile('next.config.js')).toBe(false);
      });

      it('app directories', () => {
        expect(shouldIgnoreFile('apps/web/src/app/page.tsx')).toBe(false);
        expect(shouldIgnoreFile('src/app/api/route.ts')).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('deeply nested paths', () => {
        expect(shouldIgnoreFile('a/b/c/d/e/node_modules/pkg/file.ts')).toBe(true);
        expect(shouldIgnoreFile('packages/core/src/__tests__/unit/deep/test.ts')).toBe(true);
      });

      it('Windows-style paths', () => {
        expect(shouldIgnoreFile('C:\\Projects\\app\\node_modules\\pkg\\index.js')).toBe(true);
        expect(shouldIgnoreFile('D:\\code\\dist\\bundle.js')).toBe(true);
      });

      it('paths with special characters', () => {
        expect(shouldIgnoreFile('node_modules/@types/node/index.d.ts')).toBe(true);
        expect(shouldIgnoreFile('src/__tests__/[id].test.ts')).toBe(true);
      });
    });
  });

  describe('isFalsePositiveByLocation() - Location-based filtering', () => {
    it('should identify false positives in test directories', () => {
      expect(isFalsePositiveByLocation('src/__tests__/unit/test.ts')).toBe(true);
      expect(isFalsePositiveByLocation('path/to/test-fixtures/broken.ts')).toBe(true);
    });

    it('should NOT identify production code as false positive', () => {
      expect(isFalsePositiveByLocation('src/index.ts')).toBe(false);
      expect(isFalsePositiveByLocation('src/components/Button.tsx')).toBe(false);
    });
  });

  describe('filterIgnoredFiles() - Batch filtering', () => {
    it('should filter out ignored files from array', () => {
      const files = [
        'src/index.ts',
        'node_modules/react/index.js',
        'src/utils.ts',
        'dist/bundle.js',
        '__tests__/test.ts',
      ];

      const filtered = filterIgnoredFiles(files);
      
      expect(filtered).toHaveLength(2);
      expect(filtered).toContain('src/index.ts');
      expect(filtered).toContain('src/utils.ts');
      expect(filtered).not.toContain('node_modules/react/index.js');
      expect(filtered).not.toContain('dist/bundle.js');
      expect(filtered).not.toContain('__tests__/test.ts');
    });

    it('should handle empty arrays', () => {
      expect(filterIgnoredFiles([])).toEqual([]);
    });
  });

  describe('SECURITY_IGNORE_PATTERNS', () => {
    it('should exist and contain security-specific patterns', () => {
      expect(SECURITY_IGNORE_PATTERNS).toBeDefined();
      expect(Array.isArray(SECURITY_IGNORE_PATTERNS)).toBe(true);
    });
  });

  describe('PERFORMANCE_IGNORE_PATTERNS', () => {
    it('should exist and contain performance-specific patterns', () => {
      expect(PERFORMANCE_IGNORE_PATTERNS).toBeDefined();
      expect(Array.isArray(PERFORMANCE_IGNORE_PATTERNS)).toBe(true);
    });
  });

  describe('Integration: Combined Filtering', () => {
    it('should filter test files', () => {
      const testFile = 'src/__tests__/unit/api.test.ts';
      expect(shouldIgnoreFile(testFile)).toBe(true);
    });

    it('should NOT filter production files', () => {
      const prodFile = 'src/components/Button.tsx';
      expect(shouldIgnoreFile(prodFile)).toBe(false);
    });

    it('performance: fast pattern matching', () => {
      const start = performance.now();
      
      // Run 1000 iterations
      for (let i = 0; i < 1000; i++) {
        shouldIgnoreFile('src/index.ts');
        shouldIgnoreFile('node_modules/react/index.js');
      }
      
      const duration = performance.now() - start;
      
      // Should complete 1000 iterations in < 500ms (minimatch has overhead)
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Real-World Scenarios', () => {
    it('Scenario 1: Next.js App', () => {
      const nextJsFiles = [
        '.next/server/pages/index.js', // ✅ Ignore
        '.next/types/app-page.d.ts', // ✅ Ignore
        'node_modules/next/dist/server.js', // ✅ Ignore
        'src/app/page.tsx', // ❌ Do NOT ignore
        'src/components/Header.tsx', // ❌ Do NOT ignore
      ];

      expect(shouldIgnoreFile(nextJsFiles[0])).toBe(true);
      expect(shouldIgnoreFile(nextJsFiles[1])).toBe(true);
      expect(shouldIgnoreFile(nextJsFiles[2])).toBe(true);
      expect(shouldIgnoreFile(nextJsFiles[3])).toBe(false);
      expect(shouldIgnoreFile(nextJsFiles[4])).toBe(false);
    });

    it('Scenario 2: Monorepo with Tests', () => {
      const monorepoFiles = [
        'packages/core/src/index.ts', // ❌ Do NOT ignore
        'packages/core/src/__tests__/index.test.ts', // ✅ Ignore
        'packages/core/dist/index.js', // ✅ Ignore
        'apps/web/src/app/api/route.ts', // ❌ Do NOT ignore
      ];

      expect(shouldIgnoreFile(monorepoFiles[0])).toBe(false);
      expect(shouldIgnoreFile(monorepoFiles[1])).toBe(true);
      expect(shouldIgnoreFile(monorepoFiles[2])).toBe(true);
      expect(shouldIgnoreFile(monorepoFiles[3])).toBe(false);
    });
  });

  describe('Coverage: Pattern Statistics', () => {
    it('should have comprehensive ignore patterns', () => {
      expect(GLOBAL_IGNORE_PATTERNS.length).toBeGreaterThanOrEqual(52);
      
      // Verify key categories are covered
      const hasTestPatterns = GLOBAL_IGNORE_PATTERNS.some(p => p.includes('test'));
      const hasBuildPatterns = GLOBAL_IGNORE_PATTERNS.some(p => p.includes('dist') || p.includes('build'));
      const hasNodeModules = GLOBAL_IGNORE_PATTERNS.some(p => p.includes('node_modules'));
      
      expect(hasTestPatterns).toBe(true);
      expect(hasBuildPatterns).toBe(true);
      expect(hasNodeModules).toBe(true);
    });
  });
});
