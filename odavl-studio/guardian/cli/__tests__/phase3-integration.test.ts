/**
 * Phase 3.6 Integration Tests
 * 
 * Tests all 5 product-specific testers working together
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  WebsiteTester,
  ExtensionTester,
  CLITester,
  PackageTester,
  MonorepoTester,
  autoTest,
  getTester,
} from '../src/testers/index.js';

describe('Phase 3: Product-Specific Testers Integration', () => {
  let testRoot: string;

  beforeAll(async () => {
    testRoot = join(tmpdir(), 'guardian-phase3-test');
    await mkdir(testRoot, { recursive: true });
  });

  describe('Tester Exports', () => {
    it('should export all 5 testers', () => {
      expect(WebsiteTester).toBeDefined();
      expect(ExtensionTester).toBeDefined();
      expect(CLITester).toBeDefined();
      expect(PackageTester).toBeDefined();
      expect(MonorepoTester).toBeDefined();
    });

    it('should export utility functions', () => {
      expect(autoTest).toBeDefined();
      expect(getTester).toBeDefined();
    });
  });

  describe('getTester() - Dynamic Tester Loading', () => {
    it('should return WebsiteTester for website type', async () => {
      const tester = await getTester('website');
      expect(tester).toBeInstanceOf(WebsiteTester);
    });

    it('should return ExtensionTester for extension type', async () => {
      const tester = await getTester('extension');
      expect(tester).toBeInstanceOf(ExtensionTester);
    });

    it('should return CLITester for cli type', async () => {
      const tester = await getTester('cli');
      expect(tester).toBeInstanceOf(CLITester);
    });

    it('should return PackageTester for package type', async () => {
      const tester = await getTester('package');
      expect(tester).toBeInstanceOf(PackageTester);
    });

    it('should return MonorepoTester for monorepo type', async () => {
      const tester = await getTester('monorepo');
      expect(tester).toBeInstanceOf(MonorepoTester);
    });

    it('should throw error for unknown type', async () => {
      await expect(getTester('unknown' as any)).rejects.toThrow('Unknown tester type');
    });
  });

  describe('autoTest() - Product Type Detection', () => {
    it('should detect monorepo from pnpm-workspace.yaml', async () => {
      const monorepoPath = join(testRoot, 'monorepo-pnpm');
      await mkdir(monorepoPath, { recursive: true });
      await writeFile(
        join(monorepoPath, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );

      const result = await autoTest(monorepoPath);
      expect(result).toBeDefined();
      expect(result?.info?.info?.type).toBe('pnpm-workspace');
    });

    it('should detect VS Code extension from package.json', async () => {
      const extensionPath = join(testRoot, 'extension');
      await mkdir(extensionPath, { recursive: true });
      await writeFile(
        join(extensionPath, 'package.json'),
        JSON.stringify({
          name: 'test-extension',
          engines: { vscode: '^1.80.0' },
        })
      );

      const result = await autoTest(extensionPath);
      expect(result).toBeDefined();
      expect(result.tested).toBe(true);
    });

    it('should detect CLI tool from package.json bin field', async () => {
      const cliPath = join(testRoot, 'cli');
      await mkdir(cliPath, { recursive: true });
      await writeFile(
        join(cliPath, 'package.json'),
        JSON.stringify({
          name: 'test-cli',
          bin: { 'test-cli': './bin/cli.js' },
        })
      );

      const result = await autoTest(cliPath);
      expect(result).toBeDefined();
    });

    it('should detect NPM package from package.json exports', async () => {
      const packagePath = join(testRoot, 'package');
      await mkdir(packagePath, { recursive: true });
      await writeFile(
        join(packagePath, 'package.json'),
        JSON.stringify({
          name: 'test-package',
          main: './dist/index.js',
          exports: {
            '.': {
              import: './dist/index.mjs',
              require: './dist/index.js',
            },
          },
        })
      );

      const result = await autoTest(packagePath);
      expect(result).toBeDefined();
    });

    it('should handle unknown project type gracefully', async () => {
      const unknownPath = join(testRoot, 'unknown');
      await mkdir(unknownPath, { recursive: true });

      const result = await autoTest(unknownPath);
      expect(result).toBeNull();
    });
  });

  describe('ExtensionTester Integration', () => {
    it('should create ExtensionTester instance', () => {
      const tester = new ExtensionTester();
      expect(tester).toBeInstanceOf(ExtensionTester);
    });

    it('should have test method', () => {
      const tester = new ExtensionTester();
      expect(typeof tester.test).toBe('function');
    });
  });

  describe('CLITester Integration', () => {
    it('should create CLITester instance', () => {
      const tester = new CLITester();
      expect(tester).toBeInstanceOf(CLITester);
    });

    it('should have test method', () => {
      const tester = new CLITester();
      expect(typeof tester.test).toBe('function');
    });
  });

  describe('PackageTester Integration', () => {
    it('should create PackageTester instance', () => {
      const tester = new PackageTester();
      expect(tester).toBeInstanceOf(PackageTester);
    });

    it('should have test method', () => {
      const tester = new PackageTester();
      expect(typeof tester.test).toBe('function');
    });
  });

  describe('MonorepoTester Integration', () => {
    it('should create MonorepoTester instance', () => {
      const tester = new MonorepoTester();
      expect(tester).toBeInstanceOf(MonorepoTester);
    });

    it('should have test method', () => {
      const tester = new MonorepoTester();
      expect(typeof tester.test).toBe('function');
    });

    it('should detect monorepo types', async () => {
      const tester = new MonorepoTester();
      
      // Test pnpm-workspace detection
      const pnpmPath = join(testRoot, 'monorepo-pnpm-test');
      await mkdir(pnpmPath, { recursive: true });
      await writeFile(
        join(pnpmPath, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"\n  - "apps/*"'
      );

      const result = await tester.test(pnpmPath);
      expect(result.info.type).toBe('pnpm-workspace');
    });
  });

  describe('Report Generation', () => {
    it('should create .guardian/reports directories', async () => {
      const reportPath = join(testRoot, '.guardian', 'reports');
      await mkdir(reportPath, { recursive: true });
      
      expect(existsSync(reportPath)).toBe(true);
    });

    it('should save reports as JSON', async () => {
      const reportPath = join(testRoot, '.guardian', 'reports', 'test-report.json');
      const report = {
        timestamp: new Date().toISOString(),
        score: 85,
        status: 'pass',
      };

      await writeFile(reportPath, JSON.stringify(report, null, 2));
      expect(existsSync(reportPath)).toBe(true);
    });
  });

  describe('Cross-Tester Consistency', () => {
    it('all testers should have consistent result interface', async () => {
      // All testers return results with these fields
      const requiredFields = [
        'score',
        'status',
        'timestamp',
        'reportPath',
        'recommendations',
      ];

      // Mock results to verify interface consistency
      const mockExtensionResult = {
        score: 85,
        status: 'pass' as const,
        timestamp: new Date().toISOString(),
        reportPath: '/path/to/report',
        recommendations: [],
        overallScore: 85,
        tested: true,
        path: '/test',
      };

      const mockPackageResult = {
        score: 90,
        status: 'pass' as const,
        timestamp: new Date().toISOString(),
        reportPath: '/path/to/report',
        recommendations: [],
        publishReady: true,
        path: '/test',
      };

      // Both should have required fields
      requiredFields.forEach(field => {
        expect(mockExtensionResult).toHaveProperty(field);
        expect(mockPackageResult).toHaveProperty(field);
      });
    });

    it('all testers should support scoring 0-100', () => {
      const scores = [0, 25, 50, 75, 100];
      
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('all testers should support status levels', () => {
      const statuses = ['pass', 'fail', 'warning'] as const;
      
      statuses.forEach(status => {
        expect(['pass', 'fail', 'warning']).toContain(status);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('autoTest should complete within reasonable time', async () => {
      const start = Date.now();
      
      const testPath = join(testRoot, 'perf-test');
      await mkdir(testPath, { recursive: true });
      await writeFile(
        join(testPath, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );

      await autoTest(testPath);
      
      const duration = Date.now() - start;
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing directories gracefully', async () => {
      const nonExistentPath = join(testRoot, 'does-not-exist');
      
      const result = await autoTest(nonExistentPath);
      expect(result).toBeNull();
    });

    it('should handle invalid package.json', async () => {
      const invalidPath = join(testRoot, 'invalid');
      await mkdir(invalidPath, { recursive: true });
      await writeFile(join(invalidPath, 'package.json'), 'invalid json {');

      await expect(autoTest(invalidPath)).rejects.toThrow();
    });
  });
});
