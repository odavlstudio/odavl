/**
 * Unit Tests for NextJSFixer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextJSFixer } from '../fixers/nextjs-fixer.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('NextJSFixer', () => {
  let fixer: NextJSFixer;
  let testDir: string;

  beforeEach(async () => {
    fixer = new NextJSFixer();
    testDir = path.join(__dirname, 'test-fixtures', 'nextjs-fixer');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('fixStandaloneOutputMode', () => {
    it('should remove "output: standalone" from next.config.js', async () => {
      const configPath = path.join(testDir, 'next.config.js');
      const configContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['example.com'],
  },
};

module.exports = nextConfig;
`;
      await fs.writeFile(configPath, configContent);

      const issue = {
        id: 'standalone-output-mode',
        severity: 'critical' as const,
        category: 'config' as const,
        message: 'output: standalone detected',
        autoFixable: true,
        impact: 'Build may fail',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].fixType).toBe('standalone-output-mode');

      // Verify file was updated
      const updated = await fs.readFile(configPath, 'utf-8');
      expect(updated).not.toContain('output:');
      expect(updated).not.toContain('standalone');
      expect(updated).toContain('reactStrictMode: true');
    });

    it('should handle next.config.mjs with export default', async () => {
      const configPath = path.join(testDir, 'next.config.mjs');
      const configContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
`;
      await fs.writeFile(configPath, configContent);

      const issue = {
        id: 'standalone-output-mode',
        severity: 'critical' as const,
        category: 'config' as const,
        message: 'output: standalone detected',
        autoFixable: true,
        impact: 'Build may fail',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const updated = await fs.readFile(configPath, 'utf-8');
      expect(updated).not.toContain('output:');
      expect(updated).not.toContain('standalone');
    });
  });

  describe('createNextConfig', () => {
    it('should create basic next.config.js', async () => {
      const issue = {
        id: 'missing-next-config',
        severity: 'high' as const,
        category: 'config' as const,
        message: 'Missing next.config.js',
        autoFixable: true,
        impact: 'No custom configuration',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const configPath = path.join(testDir, 'next.config.js');
      const exists = await fs.access(configPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('reactStrictMode: true');
    });
  });

  describe('createPublicDir', () => {
    it('should create public directory', async () => {
      const issue = {
        id: 'missing-public-dir',
        severity: 'medium' as const,
        category: 'build' as const,
        message: 'Missing public directory',
        autoFixable: true,
        impact: 'No static assets',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const publicDir = path.join(testDir, 'public');
      const exists = await fs.access(publicDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const gitkeep = path.join(publicDir, '.gitkeep');
      const gitkeepExists = await fs.access(gitkeep).then(() => true).catch(() => false);
      expect(gitkeepExists).toBe(true);
    });
  });

  describe('createEnvExample', () => {
    it('should create .env.example with common variables', async () => {
      const issue = {
        id: 'missing-env-example',
        severity: 'low' as const,
        category: 'config' as const,
        message: 'Missing .env.example',
        autoFixable: true,
        impact: 'No env template',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const envPath = path.join(testDir, '.env.example');
      const content = await fs.readFile(envPath, 'utf-8');
      
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('NEXTAUTH_SECRET');
      expect(content).toContain('API_KEY');
    });
  });

  describe('fixMissingScripts', () => {
    it('should add dev/build/start scripts', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
        scripts: {},
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const issue = {
        id: 'missing-npm-scripts',
        severity: 'high' as const,
        category: 'build' as const,
        message: 'Missing npm scripts',
        autoFixable: true,
        impact: 'Cannot run app',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      expect(updated.scripts.dev).toBe('next dev');
      expect(updated.scripts.build).toBe('next build');
      expect(updated.scripts.start).toBe('next start');
    });
  });

  describe('createRobotsTxt', () => {
    it('should create robots.txt in public directory', async () => {
      // Create public directory first
      await fs.mkdir(path.join(testDir, 'public'), { recursive: true });

      const issue = {
        id: 'missing-robots-txt',
        severity: 'low' as const,
        category: 'metadata' as const,
        message: 'Missing robots.txt',
        autoFixable: true,
        impact: 'No SEO file',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const robotsPath = path.join(testDir, 'public', 'robots.txt');
      const content = await fs.readFile(robotsPath, 'utf-8');
      
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Allow: /');
    });
  });

  describe('createReadme', () => {
    it('should create comprehensive README.md', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const issue = {
        id: 'missing-readme',
        severity: 'medium' as const,
        category: 'metadata' as const,
        message: 'Missing README',
        autoFixable: true,
        impact: 'No documentation',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const readmePath = path.join(testDir, 'README.md');
      const content = await fs.readFile(readmePath, 'utf-8');
      
      expect(content).toContain('# Test App');
      expect(content).toContain('Getting Started');
      expect(content).toContain('npm run dev');
    });
  });

  describe('createTsConfig', () => {
    it('should create Next.js-optimized tsconfig.json', async () => {
      const issue = {
        id: 'missing-tsconfig',
        severity: 'medium' as const,
        category: 'build' as const,
        message: 'Missing tsconfig.json',
        autoFixable: true,
        impact: 'No TypeScript config',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results[0].success).toBe(true);

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      const content = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));
      
      expect(content.compilerOptions.jsx).toBe('preserve');
      expect(content.compilerOptions.plugins).toBeDefined();
      expect(content.include).toContain('next-env.d.ts');
    });
  });
});
