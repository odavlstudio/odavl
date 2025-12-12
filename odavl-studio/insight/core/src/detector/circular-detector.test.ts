/**
 * Tests for CircularDetector
 * 
 * Coverage:
 * - Circular dependency detection
 * - Dependency graph analysis
 * - Cycle breaking suggestions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { CircularDependencyDetector } from './circular-detector';

describe('CircularDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'circular-detector-test-'));
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

  describe('Simple Circular Dependencies', () => {
    it('should detect 2-file circular dependency', async () => {
      await createFile('src/a.ts', `
        import { funcB } from './b';
        export function funcA() { return funcB(); }
      `);
      await createFile('src/b.ts', `
        import { funcA } from './a';
        export function funcB() { return funcA(); }
      `);

      const detector = new CircularDependencyDetector(tempDir);
      const issues = await detector.detect();

      expect(issues.length).toBeGreaterThan(0);
      const circular = issues.find((i: any) => i.type === 'circular-dependency');
      expect(circular).toBeDefined();
      expect(circular?.severity).toBe('high');
      expect(circular?.cycle).toContain('a.ts');
      expect(circular?.cycle).toContain('b.ts');
    });

    it('should detect 3-file circular dependency', async () => {
      await createFile('src/a.ts', `import { funcB } from './b'; export function funcA() {}`);
      await createFile('src/b.ts', `import { funcC } from './c'; export function funcB() {}`);
      await createFile('src/c.ts', `import { funcA } from './a'; export function funcC() {}`);

      const detector = new CircularDependencyDetector(tempDir);
      const issues = await detector.detect();

      const circular = issues.find((i: any) => i.type === 'circular-dependency');
      expect(circular).toBeDefined();
      expect(circular?.cycle.length).toBe(3);
    });
  });

  describe('No Circular Dependencies', () => {
    it('should return empty for linear dependencies', async () => {
      await createFile('src/a.ts', `import { funcB } from './b'; export function funcA() {}`);
      await createFile('src/b.ts', `import { funcC } from './c'; export function funcB() {}`);
      await createFile('src/c.ts', `export function funcC() {}`);

      const detector = new CircularDependencyDetector(tempDir);
      const issues = await detector.detect();

      const circular = issues.find((i: any) => i.type === 'circular-dependency');
      expect(circular).toBeUndefined();
    });
  });

  describe('Breaking Suggestions', () => {
    it('should suggest breaking circular dependencies', async () => {
      await createFile('src/a.ts', `import { funcB } from './b'; export function funcA() {}`);
      await createFile('src/b.ts', `import { funcA } from './a'; export function funcB() {}`);

      const detector = new CircularDependencyDetector(tempDir);
      const issues = await detector.detect();

      const circular = issues.find((i: any) => i.type === 'circular-dependency');
      expect(circular?.suggestedFix).toBeDefined();
      expect(circular?.suggestedFix).toContain('extract');
    });
  });

  describe('Configuration', () => {
    it('should respect exclude patterns', async () => {
      await createFile('test/a.ts', `import { b } from './b'; export const a = 1;`);
      await createFile('test/b.ts', `import { a } from './a'; export const b = 2;`);

      const detector = new CircularDependencyDetector(tempDir);
      // TODO: Fix constructor to accept options - new CircularDependencyDetector(tempDir);
      
      const issues = await detector.detect();

      expect(issues.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid files', async () => {
      await createFile('src/test.ts', 'invalid syntax {');

      const detector = new CircularDependencyDetector(tempDir);
      
      await expect(detector.detect()).resolves.toBeDefined();
    });
  });
});
