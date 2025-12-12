/**
 * CI/CD Detector Tests
 * 
 * @since Week 13-14 (December 2025)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CICDDetector, analyzeCICD } from './cicd-detector.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CICDDetector', () => {
  let detector: CICDDetector;

  beforeEach(() => {
    detector = new CICDDetector();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const det = new CICDDetector();
      expect(det).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const det = new CICDDetector({
        checkGitHubActions: false,
        checkVercel: false,
        maxWorkflowDuration: 300,
      });
      expect(det).toBeDefined();
    });
  });

  describe('GitHub Actions Analysis', () => {
    it('should detect missing jobs definition', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-invalid-workflow');
      
      // Create test fixture
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        'name: Test\non: push\n'
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('missing jobs'))).toBe(true);

      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect unverified actions', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-unverified-action');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
`
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.type === 'security' && i.message.includes('Unverified action'))).toBe(true);
      expect(result.metrics.securityIssues).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect secret exposure', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-secret-exposure');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo \${{ secrets.API_KEY }}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.severity === 'critical' && i.message.includes('secret exposure'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect missing cache', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-no-cache');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
`
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.type === 'performance' && i.message.includes('missing dependency cache'))).toBe(true);
      expect(result.metrics.performanceIssues).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect pull_request_target security issue', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-pr-target');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: 
  pull_request_target:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.severity === 'critical' && i.message.includes('pull_request_target'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should count workflows, jobs, and steps', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-valid');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm lint
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalWorkflows).toBe(1);
      expect(result.metrics.totalJobs).toBe(2);
      expect(result.metrics.totalSteps).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Vercel Configuration', () => {
    it('should detect missing build command', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-vercel-no-build');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'vercel.json'),
        JSON.stringify({
          outputDirectory: '.next'
        })
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('Missing buildCommand'))).toBe(true);
      expect(result.metrics.hasVercelConfig).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect hardcoded environment variables', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-vercel-hardcoded-env');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'vercel.json'),
        JSON.stringify({
          buildCommand: 'pnpm build',
          env: {
            API_KEY: 'secret-key-12345'
          }
        })
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.severity === 'high' && i.message.includes('hardcoded value'))).toBe(true);
      expect(result.metrics.securityIssues).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should accept Vercel environment variable syntax', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-vercel-valid');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'vercel.json'),
        JSON.stringify({
          buildCommand: 'pnpm build',
          outputDirectory: '.next',
          env: {
            API_KEY: '@api-key'
          }
        })
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('hardcoded value'))).toBe(false);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Score Calculation', () => {
    it('should calculate base score', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-empty');
      await fs.mkdir(testDir, { recursive: true });

      const result = await detector.analyze(testDir);

      expect(result.metrics.cicdScore).toBe(100);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should deduct points for security issues', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-security-issues');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: pull_request_target
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - run: echo \${{ secrets.API_KEY }}
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.cicdScore).toBeLessThan(100);
      expect(result.metrics.securityIssues).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should add bonus for CI/CD setup', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-with-setup');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: 'pnpm'
      - run: pnpm test
`
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalWorkflows).toBe(1);
      expect(result.metrics.cicdScore).toBeGreaterThanOrEqual(100);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent workspace', async () => {
      await expect(detector.analyze('/non-existent-path-12345')).rejects.toThrow();
    });

    it('should handle invalid YAML', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-invalid-yaml');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        'invalid: yaml: syntax: error:'
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('Failed to parse'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should handle missing runs-on', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-no-runs-on');
      
      await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        `name: Test
on: push
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
`
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('missing runs-on'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Helper Function', () => {
    it('should work via helper function', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'cicd-helper');
      await fs.mkdir(testDir, { recursive: true });

      const result = await analyzeCICD(testDir);

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });
});
