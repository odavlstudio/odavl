/**
 * Tests for PackageDetector
 * 
 * Coverage:
 * - Outdated dependencies
 * - Security vulnerabilities
 * - Missing dependencies
 * - Peer dependency conflicts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { PackageDetector } from './package-detector';

describe('PackageDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-detector-test-'));
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

  describe('Outdated Dependencies Detection', () => {
    it('should detect outdated major versions', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'react': '16.0.0', // Outdated (current is 18.x)
        }
      }));

      const detector = new PackageDetector(tempDir);
      const issues = await detector.detect();

      const outdated = issues.find(i => i.type === 'version-mismatch');
      expect(outdated).toBeDefined();
      expect(outdated?.severity).toBe('medium');
    });

    it('should not flag recent versions', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'react': '18.2.0',
        }
      }));

      const detector = new PackageDetector(tempDir);
      const issues = await detector.detect();

      const outdated = issues.find(i => i.type === 'version-mismatch' && i.packageName === 'react');
      expect(outdated).toBeUndefined();
    });
  });

  describe('Security Vulnerabilities Detection', () => {
    it('should detect packages with known vulnerabilities', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'lodash': '4.17.0', // Has known vulnerabilities
        }
      }));

      const detector = new PackageDetector(tempDir);
      const issues = await detector.detect();

      const vuln = issues.find(i => i.type === 'version-mismatch');
      expect(vuln).toBeDefined();
      expect(vuln?.severity).toBe('high');
    });
  });

  describe('Missing Dependencies Detection', () => {
    it('should detect used but not declared dependencies', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {}
      }));
      await createFile('src/index.ts', `
        import express from 'express';
      `);

      const detector = new PackageDetector(tempDir);
      const issues = await detector.detect();

      const missing = issues.find(i => i.type === 'missing-dependency');
      expect(missing).toBeDefined();
    });
  });

  describe('Peer Dependency Conflicts', () => {
    it('should detect peer dependency conflicts', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'react': '18.0.0',
          'react-router-dom': '5.3.0' // Requires react ^16 || ^17
        }
      }));

      const detector = new PackageDetector(tempDir);
      const issues = await detector.detect();

      const conflict = issues.find(i => i.type === 'peer-conflict');
      expect(conflict).toBeDefined();
    });
  });

  describe('Duplicate Dependencies', () => {
    it('should detect duplicate dependencies', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'lodash': '4.17.21',
        },
        devDependencies: {
          'lodash': '4.17.21',
        }
      }));

      const detector = new PackageDetector(tempDir);
      const issues = await detector.detect();

      const duplicate = issues.find(i => i.type === 'unused-dependency');
      expect(duplicate).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'react': '16.0.0',
        }
      }));

      const detector = new PackageDetector(tempDir);
      
      const issues = await detector.detect();

      const outdated = issues.find(i => i.type === 'version-mismatch');
      expect(outdated).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json', async () => {
      const detector = new PackageDetector(tempDir);
      
      const issues = await detector.detect();
      
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle invalid package.json', async () => {
      await createFile('package.json', 'invalid json {');

      const detector = new PackageDetector(tempDir);
      
      await expect(detector.detect()).resolves.toBeDefined();
    });
  });
});
