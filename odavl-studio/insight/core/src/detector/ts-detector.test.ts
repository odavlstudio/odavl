/**
 * Tests for TSDetector (TypeScript Error Detector)
 * 
 * Coverage:
 * - TypeScript compilation errors
 * - Type mismatch detection
 * - Import resolution errors
 * - Configuration handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { TSDetector, type TSError } from './ts-detector';

describe('TSDetector', () => {
  let tempDir: string;
  let detector: TSDetector;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ts-detector-test-'));
    detector = new TSDetector(tempDir);
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

  async function createTsConfig(): Promise<void> {
    await createFile('tsconfig.json', JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true
      }
    }));
  }

  describe('Type Error Detection', () => {
    it('should detect type mismatch errors', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        const num: number = "hello";
      `);

      const errors = await detector.detect();

      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find(e => e.code === 'TS2322');
      expect(typeError).toBeDefined();
      expect(typeError?.message).toContain('string');
      expect(typeError?.severity).toBe('error');
    });

    it('should detect undefined variable errors', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        console.log(undefinedVariable);
      `);

      const errors = await detector.detect();

      expect(errors.length).toBeGreaterThan(0);
      const varError = errors.find(e => e.code === 'TS2304');
      expect(varError).toBeDefined();
      expect(varError?.message).toContain('Cannot find name');
    });

    it('should detect import errors', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        import { nonExistent } from './missing-module';
      `);

      const errors = await detector.detect();

      expect(errors.length).toBeGreaterThan(0);
      const importError = errors.find(e => e.code === 'TS2307');
      expect(importError).toBeDefined();
      expect(importError?.message).toContain('Cannot find module');
    });

    it('should detect property access errors', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        const obj = { name: "test" };
        console.log(obj.nonExistent);
      `);

      const errors = await detector.detect();

      expect(errors.length).toBeGreaterThan(0);
      const propError = errors.find(e => e.code === 'TS2339');
      expect(propError).toBeDefined();
      expect(propError?.message).toContain('Property');
    });
  });

  describe('No Errors Case', () => {
    it('should return empty array for valid TypeScript code', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        const greeting: string = "hello";
        console.log(greeting);
      `);

      const errors = await detector.detect();

      expect(errors).toEqual([]);
    });
  });

  describe('Configuration Handling', () => {
    it('should work without tsconfig.json', async () => {
      await createFile('src/test.ts', `
        const num: number = "hello";
      `);

      const errors = await detector.detect();

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should respect strict mode in tsconfig', async () => {
      await createFile('tsconfig.json', JSON.stringify({
        compilerOptions: {
          strict: true,
          noImplicitAny: true
        }
      }));
      
      await createFile('src/test.ts', `
        function test(param) {
          return param;
        }
      `);

      const errors = await detector.detect();

      const implicitAnyError = errors.find(e => e.code === 'TS7006');
      expect(implicitAnyError).toBeDefined();
    });
  });

  describe('Root Cause Analysis', () => {
    it('should provide root cause for common errors', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        const num: number = "hello";
      `);

      const errors = await detector.detect();

      const typeError = errors.find(e => e.code === 'TS2322');
      expect(typeError?.rootCause).toBeDefined();
      expect(typeError?.suggestedFix).toBeDefined();
    });
  });

  describe('Error Location', () => {
    it('should include line and column numbers', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
const x = 1;
const y: number = "hello";
      `);

      const errors = await detector.detect();

      const typeError = errors.find(e => e.code === 'TS2322');
      expect(typeError?.line).toBeGreaterThan(0);
      expect(typeError?.column).toBeGreaterThan(0);
    });

    it('should include full file path', async () => {
      await createTsConfig();
      await createFile('src/test.ts', `
        const num: number = "hello";
      `);

      const errors = await detector.detect();

      expect(errors[0].file).toContain('test.ts');
      expect(path.isAbsolute(errors[0].file)).toBe(true);
    });
  });
});
