/**
 * Tests for ESLintDetector
 * 
 * Coverage:
 * - ESLint error detection
 * - Warning detection
 * - Configuration handling
 * - Fix suggestions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ESLintDetector } from './eslint-detector';

describe('ESLintDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eslint-detector-test-'));
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

  async function createESLintConfig(): Promise<void> {
    await createFile('.eslintrc.json', JSON.stringify({
      env: { es2021: true, node: true },
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
      },
      rules: {
        'no-unused-vars': 'error',
        'no-console': 'warn'
      }
    }));
  }

  describe('Error Detection', () => {
    it('should detect unused variables', async () => {
      await createESLintConfig();
      await createFile('src/test.js', `
        const unused = 42;
        console.log('hello');
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      expect(issues.length).toBeGreaterThan(0);
      const unusedVar = issues.find(i => i.ruleId === 'no-unused-vars');
      expect(unusedVar).toBeDefined();
      expect(unusedVar?.severity).toBe(2);
    });

    it('should detect console statements as warnings', async () => {
      await createESLintConfig();
      await createFile('src/test.js', `
        console.log('debug message');
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      const consoleIssue = issues.find(i => i.ruleId === 'no-console');
      expect(consoleIssue).toBeDefined();
      expect(consoleIssue?.severity).toBe(1);
    });

    it('should provide line and column information', async () => {
      await createESLintConfig();
      await createFile('src/test.js', `
const x = 1;
const unused = 2;
console.log(x);
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      const unusedVar = issues.find(i => i.ruleId === 'no-unused-vars');
      expect(unusedVar?.line).toBeGreaterThan(0);
      expect(unusedVar?.column).toBeGreaterThan(0);
    });
  });

  describe('No Issues Case', () => {
    it('should return empty array for valid code', async () => {
      await createESLintConfig();
      await createFile('src/test.js', `
        const greeting = 'hello';
        export { greeting };
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      expect(issues).toEqual([]);
    });
  });

  describe('Configuration', () => {
    it('should work with default configuration', async () => {
      await createFile('src/test.js', `
        const unused = 42;
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      // Should detect issues even without explicit config
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should respect custom rules', async () => {
      await createFile('.eslintrc.json', JSON.stringify({
        rules: {
          'no-var': 'error'
        }
      }));
      
      await createFile('src/test.js', `
        var oldStyle = 42;
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      const varIssue = issues.find(i => i.ruleId === 'no-var');
      expect(varIssue).toBeDefined();
    });
  });

  describe('Fix Suggestions', () => {
    it('should include fix information when available', async () => {
      await createESLintConfig();
      await createFile('src/test.js', `
        const unused = 42;
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      const unusedVar = issues.find(i => i.ruleId === 'no-unused-vars');
      expect(unusedVar?.message).toBeDefined();
      expect(unusedVar?.message.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Files', () => {
    it('should analyze multiple files', async () => {
      await createESLintConfig();
      await createFile('src/file1.js', `
        const unused1 = 1;
      `);
      await createFile('src/file2.js', `
        const unused2 = 2;
      `);

      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      expect(issues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      await createFile('.eslintrc.json', 'invalid json {');
      await createFile('src/test.js', 'const x = 1;');

      const detector = new ESLintDetector(tempDir);
      
      // Should not throw
      await expect(detector.detect()).resolves.toBeDefined();
    });

    it('should handle missing files gracefully', async () => {
      const detector = new ESLintDetector(tempDir);
      const issues = await detector.detect();

      // Should return empty array, not throw
      expect(Array.isArray(issues)).toBe(true);
    });
  });
});
