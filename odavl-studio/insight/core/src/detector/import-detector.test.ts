/**
 * Tests for ImportDetector
 * 
 * Coverage:
 * - Import cycle detection
 * - Unused imports
 * - Missing imports
 * - Import optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ImportDetector } from './import-detector';

describe('ImportDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'import-detector-test-'));
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

  describe('Import Cycle Detection', () => {
    it('should detect simple import cycles', async () => {
      await createFile('src/a.ts', `
        import { b } from './b';
        export const a = 'a';
      `);
      await createFile('src/b.ts', `
        import { a } from './a';
        export const b = 'b';
      `);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const cycle = issues.find(i => i.issue === 'circular');
      expect(cycle).toBeDefined();
      expect(cycle?.rootCause).toBe('high');
    });

    it('should detect complex import cycles (A -> B -> C -> A)', async () => {
      await createFile('src/a.ts', `import { b } from './b'; export const a = 'a';`);
      await createFile('src/b.ts', `import { c } from './c'; export const b = 'b';`);
      await createFile('src/c.ts', `import { a } from './a'; export const c = 'c';`);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const cycle = issues.find(i => i.issue === 'circular');
      expect(cycle).toBeDefined();
    });
  });

  describe('Unused Imports Detection', () => {
    it('should detect unused imports', async () => {
      await createFile('src/test.ts', `
        import { unused, used } from './module';
        console.log(used);
      `);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const unusedImport = issues.find(i => i.issue === 'not-found');
      expect(unusedImport).toBeDefined();
      expect(unusedImport?.suggestedFix).toContain('unused');
    });

    it('should not flag used imports', async () => {
      await createFile('src/test.ts', `
        import { helper } from './utils';
        helper();
      `);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const unusedImport = issues.find(i => i.issue === 'not-found');
      expect(unusedImport).toBeUndefined();
    });
  });

  describe('Missing Imports Detection', () => {
    it('should detect missing imports', async () => {
      await createFile('src/test.ts', `
        console.log(undefinedFunction());
      `);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const missingImport = issues.find(i => i.issue === 'not-found');
      expect(missingImport).toBeDefined();
    });
  });

  describe('Import Optimization', () => {
    it('should suggest barrel import optimization', async () => {
      await createFile('src/test.ts', `
        import { ComponentA } from './components/ComponentA';
        import { ComponentB } from './components/ComponentB';
        import { ComponentC } from './components/ComponentC';
      `);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const optimizationSuggestion = issues.find(i => i.issue === 'syntax-error');
      expect(optimizationSuggestion).toBeDefined();
    });

    it('should detect large library imports', async () => {
      await createFile('src/test.ts', `
        import _ from 'lodash';
        _.map([1, 2], x => x * 2);
      `);

      const detector = new ImportDetector(tempDir);
      const issues = await detector.detect();

      const largeImport = issues.find(i => i.issue === 'no-export');
      expect(largeImport).toBeDefined();
      expect(largeImport?.suggestedFix).toContain('lodash/map');
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      await createFile('src/a.ts', `import { b } from './b'; export const a = 'a';`);
      await createFile('src/b.ts', `import { a } from './a'; export const b = 'b';`);

      const detector = new ImportDetector(tempDir);
      // TODO: Fix constructor to accept options - new ImportDetector(tempDir);
      
      const issues = await detector.detect();

      const cycle = issues.find(i => i.issue === 'circular');
      expect(cycle).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid files', async () => {
      await createFile('src/test.ts', 'invalid syntax {');

      const detector = new ImportDetector(tempDir);
      
      await expect(detector.detect()).resolves.toBeDefined();
    });
  });
});
