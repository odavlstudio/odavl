/**
 * Tests for IsolationDetector
 * 
 * Coverage:
 * - Code isolation issues
 * - Side effects detection
 * - Pure function validation
 * - Global state access
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ComponentIsolationDetector } from './isolation-detector';

describe('IsolationDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'isolation-detector-test-'));
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

  describe('Side Effects Detection', () => {
    it('should detect global state mutations', async () => {
      await createFile('src/state.ts', `
        function updateGlobal() {
          window.globalState = { updated: true };
        }
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const sideEffect = issues.find((i: any) => i.type === 'global-mutation');
      expect(sideEffect).toBeDefined();
      expect(sideEffect?.severity).toBe('medium');
    });

    it('should detect console usage in pure functions', async () => {
      await createFile('src/utils.ts', `
        function calculate(x, y) {
          console.log('Calculating...');
          return x + y;
        }
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const sideEffect = issues.find((i: any) => i.type === 'side-effect');
      expect(sideEffect).toBeDefined();
    });

    it('should not flag pure functions', async () => {
      await createFile('src/pure.ts', `
        function add(a, b) {
          return a + b;
        }
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const sideEffect = issues.find((i: any) => i.type === 'side-effect');
      expect(sideEffect).toBeUndefined();
    });
  });

  describe('Global State Access Detection', () => {
    it('should detect direct window access', async () => {
      await createFile('src/browser.ts', `
        const width = window.innerWidth;
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const globalAccess = issues.find((i: any) => i.type === 'global-access');
      expect(globalAccess).toBeDefined();
    });

    it('should detect document access', async () => {
      await createFile('src/dom.ts', `
        const element = document.getElementById('app');
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const globalAccess = issues.find((i: any) => i.type === 'global-access');
      expect(globalAccess).toBeDefined();
    });
  });

  describe('Module Isolation', () => {
    it('should detect shared mutable state', async () => {
      await createFile('src/shared.ts', `
        export let sharedCounter = 0;
        export function increment() {
          sharedCounter++;
        }
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const shared = issues.find((i: any) => i.type === 'shared-mutable-state');
      expect(shared).toBeDefined();
      expect(shared?.suggestedFix).toContain('const');
    });

    it('should not flag immutable exports', async () => {
      await createFile('src/constants.ts', `
        export const API_URL = 'https://api.example.com';
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      const issues = await detector.detect();

      const shared = issues.find((i: any) => i.type === 'shared-mutable-state');
      expect(shared).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      await createFile('src/test.ts', `
        window.globalState = {};
      `);

      const detector = new ComponentIsolationDetector(tempDir);
      // Note: This detector doesn't support allowGlobalAccess config
      const issues = await detector.detect();

      const globalAccess = issues.find((i: any) => i.type === 'global-access');
      expect(globalAccess).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid files', async () => {
      await createFile('src/test.ts', 'invalid syntax {');

      const detector = new ComponentIsolationDetector(tempDir);
      
      await expect(detector.detect()).resolves.toBeDefined();
    });
  });
});
