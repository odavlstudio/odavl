/**
 * Unit Tests for ExtensionFixer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExtensionFixer } from '../fixers/extension-fixer.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ExtensionFixer', () => {
  let fixer: ExtensionFixer;
  let testDir: string;

  beforeEach(async () => {
    fixer = new ExtensionFixer();
    testDir = path.join(__dirname, 'test-fixtures', 'extension-fixer');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('fixMissingDisplayName', () => {
    it('should add displayName from package name', async () => {
      // Create test package.json
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-extension',
        version: '1.0.0',
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Apply fix
      const issue = {
        id: 'missing-display-name',
        severity: 'medium' as const,
        category: 'metadata' as const,
        message: 'Missing displayName',
        autoFixable: true,
        impact: 'Extension name not visible',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      // Verify
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].fixType).toBe('missing-display-name');

      // Check file was updated
      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      expect(updated.displayName).toBe('Test Extension');
    });

    it('should not overwrite existing displayName', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-extension',
        displayName: 'My Custom Name',
        version: '1.0.0',
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const issue = {
        id: 'missing-display-name',
        severity: 'medium' as const,
        category: 'metadata' as const,
        message: 'Missing displayName',
        autoFixable: true,
        impact: 'Extension name not visible',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      // Should skip because displayName exists
      expect(results).toHaveLength(0);

      // Verify displayName unchanged
      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      expect(updated.displayName).toBe('My Custom Name');
    });
  });

  describe('fixMissingIconField', () => {
    it('should add icon field if icon.png exists', async () => {
      // Create package.json
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-extension',
        version: '1.0.0',
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Create icon file
      const iconPath = path.join(testDir, 'icon.png');
      await fs.writeFile(iconPath, 'fake-icon-content');

      const issue = {
        id: 'missing-icon-field',
        severity: 'medium' as const,
        category: 'metadata' as const,
        message: 'Missing icon field',
        autoFixable: true,
        impact: 'No icon shown',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      expect(updated.icon).toBe('icon.png');
    });

    it('should report error if no icon file found', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-extension',
        version: '1.0.0',
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const issue = {
        id: 'missing-icon-field',
        severity: 'medium' as const,
        category: 'metadata' as const,
        message: 'Missing icon field',
        autoFixable: true,
        impact: 'No icon shown',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('No icon file found');
    });
  });

  describe('fixMissingActivationEvents', () => {
    it('should add activation events for webviews', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-extension',
        version: '1.0.0',
        contributes: {
          views: {
            'test-sidebar': [
              {
                id: 'test-view',
                name: 'Test View',
              },
            ],
          },
        },
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const issue = {
        id: 'missing-activation-events',
        severity: 'high' as const,
        category: 'activation' as const,
        message: 'Missing activation events',
        autoFixable: true,
        impact: 'Extension may not load',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      const updated = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      expect(updated.activationEvents).toContain('onView:test-view');
    });
  });

  describe('fixMissingWebviewRegistration', () => {
    it('should generate webview registration code', async () => {
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = {
        name: 'test-extension',
        version: '1.0.0',
        contributes: {
          views: {
            'test-sidebar': [
              {
                id: 'test-view',
                name: 'Test View',
              },
            ],
          },
        },
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const issue = {
        id: 'missing-webview-registration',
        severity: 'critical' as const,
        category: 'ui' as const,
        message: 'Missing webview registration',
        autoFixable: true,
        impact: 'Webview will not appear',
      };

      const results = await fixer.applyFixes(testDir, [issue]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      // Check generated file
      const generatedPath = path.join(testDir, 'src', 'providers', 'test-view-provider.ts');
      const exists = await fs.access(generatedPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      if (exists) {
        const content = await fs.readFile(generatedPath, 'utf-8');
        expect(content).toContain('class TestViewProvider');
        expect(content).toContain('resolveWebviewView');
      }
    });
  });
});
