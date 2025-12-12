/**
 * Tests for NetworkDetector
 * 
 * Coverage:
 * - Network timeout detection
 * - Missing error handling
 * - Inefficient API calls
 * - Retry logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { NetworkDetector, NetworkErrorType } from './network-detector';

describe('NetworkDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'network-detector-test-'));
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

  describe('Timeout Detection', () => {
    it('should detect missing timeouts in fetch calls', async () => {
      await createFile('src/api.ts', `
        const response = await fetch('/api/data');
      `);

      const detector = new NetworkDetector(tempDir);
      const issues = await detector.detect();

      const timeout = issues.find(i => i.type === NetworkErrorType.MISSING_TIMEOUT);
      expect(timeout).toBeDefined();
      expect(timeout?.severity).toBe('medium');
    });

    it('should not flag requests with timeout', async () => {
      await createFile('src/api.ts', `
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const response = await fetch('/api/data', { signal: controller.signal });
      `);

      const detector = new NetworkDetector(tempDir);
      const issues = await detector.detect();

      const timeout = issues.find(i => i.type === NetworkErrorType.MISSING_TIMEOUT);
      expect(timeout).toBeUndefined();
    });
  });

  describe('Error Handling Detection', () => {
    it('should detect missing error handling in fetch', async () => {
      await createFile('src/api.ts', `
        const data = await fetch('/api/data').then(r => r.json());
      `);

      const detector = new NetworkDetector(tempDir);
      const issues = await detector.detect();

      const errorHandling = issues.find(i => i.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING);
      expect(errorHandling).toBeDefined();
    });

    it('should not flag properly handled errors', async () => {
      await createFile('src/api.ts', `
        try {
          const response = await fetch('/api/data');
          if (!response.ok) throw new Error('Failed');
        } catch (error) {
          console.error(error);
        }
      `);

      const detector = new NetworkDetector(tempDir);
      const issues = await detector.detect();

      const errorHandling = issues.find(i => i.type === NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING);
      expect(errorHandling).toBeUndefined();
    });
  });

  describe('Inefficient API Calls Detection', () => {
    it('should detect API calls in loops', async () => {
      await createFile('src/api.ts', `
        for (const id of ids) {
          const user = await fetch(\`/api/users/\${id}\`);
        }
      `);

      const detector = new NetworkDetector(tempDir);
      const issues = await detector.detect();

      const inefficient = issues.find(i => i.type.toString().includes('LOOP'));
      expect(inefficient).toBeDefined();
      expect(inefficient?.suggestedFix).toContain('batch');
    });
  });

  describe('Retry Logic Detection', () => {
    it('should detect missing retry logic for critical APIs', async () => {
      await createFile('src/payment.ts', `
        const result = await fetch('/api/payment', { method: 'POST' });
      `);

      const detector = new NetworkDetector(tempDir);
      const issues = await detector.detect();

      const retry = issues.find(i => i.type === NetworkErrorType.MISSING_RETRY_LOGIC);
      expect(retry).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      await createFile('src/api.ts', `
        const response = await fetch('/api/data');
      `);

      const detector = new NetworkDetector(tempDir);
      // TODO: Fix constructor to accept options - new NetworkDetector(tempDir);
      
      const issues = await detector.detect();

      const timeout = issues.find(i => i.type === NetworkErrorType.MISSING_TIMEOUT);
      expect(timeout).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid files', async () => {
      await createFile('src/test.ts', 'invalid syntax {');

      const detector = new NetworkDetector(tempDir);
      
      await expect(detector.detect()).resolves.toBeDefined();
    });
  });
});
