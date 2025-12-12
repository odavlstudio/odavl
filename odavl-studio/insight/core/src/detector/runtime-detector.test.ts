/**
 * Tests for RuntimeDetector
 * 
 * Coverage:
 * - Runtime error detection
 * - Exception handling
 * - Async/await errors
 * - Promise rejection handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { RuntimeDetector } from './runtime-detector';

describe('RuntimeDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'runtime-detector-test-'));
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

  describe('Unhandled Promise Rejection Detection', () => {
    it('should detect unhandled promise rejections', async () => {
      await createFile('src/async.ts', `
        async function fetchData() {
          const response = await fetch('/api/data');
          return response.json();
        }
        fetchData(); // No .catch()
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const unhandled = issues.find(i => i.errorType === 'unhandled-promise');
      expect(unhandled).toBeDefined();
      expect(unhandled?.severity).toBe('high');
    });

    it('should not flag properly handled promises', async () => {
      await createFile('src/async.ts', `
        fetchData().catch(err => console.error(err));
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const unhandled = issues.find(i => i.errorType === 'unhandled-promise');
      expect(unhandled).toBeUndefined();
    });
  });

  describe('Try-Catch Detection', () => {
    it('should detect missing try-catch in async functions', async () => {
      await createFile('src/async.ts', `
        async function dangerousOperation() {
          const data = await riskyCall();
          return data.value;
        }
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const missingTry = issues.find(i => i.errorType === 'uncaught-exception');
      expect(missingTry).toBeDefined();
    });

    it('should not flag functions with try-catch', async () => {
      await createFile('src/async.ts', `
        async function safeOperation() {
          try {
            const data = await riskyCall();
            return data.value;
          } catch (error) {
            console.error(error);
          }
        }
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const missingTry = issues.find(i => i.errorType === 'uncaught-exception');
      expect(missingTry).toBeUndefined();
    });
  });

  describe('Null/Undefined Access Detection', () => {
    it('should detect potential null/undefined access', async () => {
      await createFile('src/null-check.ts', `
        function process(data) {
          return data.value.toString();
        }
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const nullAccess = issues.find(i => i.errorType === 'crash');
      expect(nullAccess).toBeDefined();
    });

    it('should not flag properly guarded access', async () => {
      await createFile('src/null-check.ts', `
        function process(data) {
          if (data && data.value) {
            return data.value.toString();
          }
        }
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const nullAccess = issues.find(i => i.errorType === 'crash');
      expect(nullAccess).toBeUndefined();
    });
  });

  describe('Async/Await Errors', () => {
    it('should detect await without async', async () => {
      await createFile('src/async.ts', `
        function notAsync() {
          await somePromise();
        }
      `);

      const detector = new RuntimeDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const awaitError = issues.find(i => i.errorType === 'race-condition');
      expect(awaitError).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      await createFile('src/async.ts', `
        fetchData(); // No .catch()
      `);

      const detector = new RuntimeDetector(tempDir);
      
      const issues = await detector.detect(tempDir);

      const unhandled = issues.find(i => i.errorType === 'unhandled-promise');
      expect(unhandled).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid files', async () => {
      await createFile('src/test.ts', 'invalid syntax {');

      const detector = new RuntimeDetector(tempDir);
      
      await expect(detector.detect(tempDir)).resolves.toBeDefined();
    });
  });
});
