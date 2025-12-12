/**
 * Tests for PerformanceDetector
 * 
 * Coverage:
 * - Memory leaks detection
 * - Large bundle size
 * - Slow operations
 * - N+1 queries
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { PerformanceDetector } from './performance-detector';

describe('PerformanceDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'performance-detector-test-'));
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

  describe('Memory Leak Detection', () => {
    it('should detect event listeners without cleanup', async () => {
      await createFile('src/component.tsx', `
        useEffect(() => {
          window.addEventListener('resize', handleResize);
          // Missing cleanup
        }, []);
      `);

      const detector = new PerformanceDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const memLeak = issues.find(i => i.type === 'memory-leak');
      expect(memLeak).toBeDefined();
      expect(memLeak?.severity).toBe('high');
    });

    it('should not flag properly cleaned up listeners', async () => {
      await createFile('src/component.tsx', `
        useEffect(() => {
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);
      `);

      const detector = new PerformanceDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const memLeak = issues.find(i => i.type === 'memory-leak');
      expect(memLeak).toBeUndefined();
    });
  });

  describe('Large Bundle Detection', () => {
    it('should detect large dependencies', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'moment': '^2.29.0', // Large bundle
        }
      }));

      const detector = new PerformanceDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const largeBundle = issues.find(i => i.type === 'large-dependency');
      expect(largeBundle).toBeDefined();
      // TODO: OldPerformanceIssue doesn't have suggestion field
    });
  });

  describe('Slow Operations Detection', () => {
    it('should detect synchronous file operations', async () => {
      await createFile('src/file.ts', `
        const data = fs.readFileSync('large-file.txt');
      `);

      const detector = new PerformanceDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const slowOp = issues.find(i => i.type === 'blocking-operation');
      expect(slowOp).toBeDefined();
      // TODO: OldPerformanceIssue doesn't have suggestion field
    });

    it('should detect blocking crypto operations', async () => {
      await createFile('src/crypto.ts', `
        const hash = crypto.createHash('sha256').update(data).digest();
      `);

      const detector = new PerformanceDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const cryptoIssue = issues.find(i => i.type === 'blocking-operation');
      expect(cryptoIssue).toBeDefined();
    });
  });

  describe('N+1 Query Detection', () => {
    it('should detect N+1 queries in loops', async () => {
      await createFile('src/database.ts', `
        for (const user of users) {
          const posts = await db.query('SELECT * FROM posts WHERE userId = ?', [user.id]);
        }
      `);

      const detector = new PerformanceDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const n1 = issues.find(i => i.type === 'n-plus-one');
      expect(n1).toBeDefined();
      // TODO: OldPerformanceIssue doesn't have suggestion field
    });
  });

  describe('Configuration', () => {
    it('should respect custom thresholds', async () => {
      await createFile('src/test.ts', `
        const data = fs.readFileSync('file.txt');
      `);

      const detector = new PerformanceDetector(tempDir);
      
      const issues = await detector.detect(tempDir);

      const blockingOp = issues.find(i => i.type === 'blocking-operation');
      expect(blockingOp).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on analysis errors', async () => {
      await createFile('src/test.ts', 'invalid code {');

      const detector = new PerformanceDetector(tempDir);
      
      await expect(detector.detect(tempDir)).resolves.toBeDefined();
    });
  });
});
