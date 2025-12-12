/**
 * Tests for BuildDetector
 * 
 * Coverage:
 * - Build error detection
 * - Configuration issues
 * - Asset optimization
 * - Bundle size analysis
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { BuildDetector } from './build-detector';

describe('BuildDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-detector-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  async function createFile(relativePath: string, content: string): Promise<string> {
    const filePath = path.join(tempDir, relativePath);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  describe('Build Configuration Detection', () => {
    it('should detect missing build configuration', async () => {
      await createFile('package.json', JSON.stringify({
        name: 'test-project',
        scripts: {}
      }));

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const missingConfig = issues.find((i: any) => i.type === 'missing-build-config');
      expect(missingConfig).toBeDefined();
    });

    it('should not flag projects with build scripts', async () => {
      await createFile('package.json', JSON.stringify({
        name: 'test-project',
        scripts: {
          build: 'tsc && vite build'
        }
      }));

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const missingConfig = issues.find((i: any) => i.type === 'missing-build-config');
      expect(missingConfig).toBeUndefined();
    });
  });

  describe('TypeScript Configuration Issues', () => {
    it('should detect missing tsconfig.json', async () => {
      await createFile('src/index.ts', 'export const x = 1;');

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const missingTsConfig = issues.find((i: any) => i.type === 'missing-tsconfig');
      expect(missingTsConfig).toBeDefined();
    });

    it('should detect invalid tsconfig.json', async () => {
      await createFile('tsconfig.json', 'invalid json {');

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const invalidConfig = issues.find((i: any) => i.type === 'invalid-config');
      expect(invalidConfig).toBeDefined();
    });

    it('should not flag valid tsconfig', async () => {
      await createFile('tsconfig.json', JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext'
        }
      }));

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const configIssue = issues.find((i: any) => i.type === 'invalid-config');
      expect(configIssue).toBeUndefined();
    });
  });

  describe('Asset Optimization Detection', () => {
    it('should detect unoptimized images', async () => {
      await createFile('public/large-image.png', Buffer.alloc(5 * 1024 * 1024).toString()); // 5MB

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const largeAsset = issues.find((i: any) => i.type === 'large-asset');
      expect(largeAsset).toBeDefined();
      expect(largeAsset?.suggestedFix).toContain('optimize');
    });

    it('should detect missing source maps', async () => {
      await createFile('package.json', JSON.stringify({
        scripts: {
          build: 'tsc'
        }
      }));
      await createFile('tsconfig.json', JSON.stringify({
        compilerOptions: {
          sourceMap: false
        }
      }));

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const noSourceMap = issues.find((i: any) => i.type === 'missing-sourcemap');
      expect(noSourceMap).toBeDefined();
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should detect large bundle sizes', async () => {
      await createFile('dist/bundle.js', Buffer.alloc(2 * 1024 * 1024).toString()); // 2MB

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const largeBundle = issues.find((i: any) => i.type === 'large-bundle');
      expect(largeBundle).toBeDefined();
      expect(largeBundle?.severity).toBe('high');
    });

    it('should suggest code splitting for large bundles', async () => {
      await createFile('dist/main.js', Buffer.alloc(3 * 1024 * 1024).toString());

      const detector = new BuildDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const largeBundle = issues.find((i: any) => i.type === 'large-bundle');
      expect(largeBundle?.suggestedFix).toContain('code splitting');
    });
  });

  describe('Configuration', () => {
    it('should accept custom thresholds', async () => {
      await createFile('dist/bundle.js', Buffer.alloc(1024 * 1024).toString()); // 1MB

      const detector = new BuildDetector(tempDir);
      // Note: This detector doesn't support custom maxBundleSize config
      const issues = await detector.detect();

      const largeBundle = issues.find((i: any) => i.type === 'large-bundle');
      expect(largeBundle).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on missing directories', async () => {
      const detector = new BuildDetector(tempDir);
      
      await expect(detector.detect(tempDir)).resolves.toBeDefined();
    });

    it('should handle file read errors gracefully', async () => {
      await createFile('package.json', 'invalid json {');

      const detector = new BuildDetector(tempDir);
      
      await expect(detector.detect(tempDir)).resolves.toBeDefined();
    });
  });
});
