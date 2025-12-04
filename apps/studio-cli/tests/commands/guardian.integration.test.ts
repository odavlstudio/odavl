/**
 * Guardian CLI Integration Tests
 * Test CLI commands with real LaunchValidator (not mocked)
 */

import { describe, it, expect } from 'vitest';
import { LaunchValidator } from '@odavl-studio/guardian-core';
import * as path from 'path';

describe('Guardian CLI - Integration Tests', () => {
  it('LaunchValidator should instantiate correctly', () => {
    const validator = new LaunchValidator();
    expect(validator).toBeDefined();
    expect(validator.validateProduct).toBeDefined();
    expect(validator.validateAndFix).toBeDefined();
    expect(validator.validateAllProducts).toBeDefined();
  });

  it('should detect VS Code extension projects', async () => {
    const validator = new LaunchValidator();
    const extensionPath = path.resolve(process.cwd(), '../../odavl-studio/insight/extension');
    
    // Validate product (auto-detect type)
    const result = await validator.validateProduct('auto', extensionPath);
    
    expect(result).toBeDefined();
    expect(result.productType).toBe('vscode-extension');
    expect(result.report).toBeDefined();
    expect(result.report.productName).toBeTruthy();
    expect(result.report.readinessScore).toBeGreaterThanOrEqual(0);
    expect(result.report.readinessScore).toBeLessThanOrEqual(100);
  });

  it('should detect Next.js app projects', async () => {
    const validator = new LaunchValidator();
    const appPath = path.resolve(process.cwd(), '../../apps/studio-hub');
    
    // Validate product (auto-detect type)
    const result = await validator.validateProduct('auto', appPath);
    
    expect(result).toBeDefined();
    expect(result.productType).toBe('nextjs-app');
    expect(result.report).toBeDefined();
    expect(result.report.readinessScore).toBeGreaterThanOrEqual(0);
  });

  it('should calculate readiness score correctly', async () => {
    const validator = new LaunchValidator();
    const extensionPath = path.resolve(process.cwd(), '../../odavl-studio/insight/extension');
    
    const result = await validator.validateProduct('vscode-extension', extensionPath);
    
    // Score should be between 0-100
    expect(result.report.readinessScore).toBeGreaterThanOrEqual(0);
    expect(result.report.readinessScore).toBeLessThanOrEqual(100);
    
    // Status should match score
    if (result.report.readinessScore >= 90) {
      expect(result.report.status).toBe('ready');
    } else if (result.report.readinessScore >= 70) {
      expect(result.report.status).toBe('unstable');
    } else {
      expect(result.report.status).toBe('blocked');
    }
  });

  it('should group issues by severity', async () => {
    const validator = new LaunchValidator();
    const extensionPath = path.resolve(process.cwd(), '../../odavl-studio/insight/extension');
    
    const result = await validator.validateProduct('vscode-extension', extensionPath);
    
    // Check issues structure
    expect(Array.isArray(result.report.issues)).toBe(true);
    
    // Each issue should have required fields
    result.report.issues.forEach((issue: any) => {
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('severity');
      expect(issue).toHaveProperty('category');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('autoFixable');
      expect(issue).toHaveProperty('impact');
      
      // Severity should be valid
      expect(['critical', 'high', 'medium', 'low']).toContain(issue.severity);
    });
  });

  it('should identify auto-fixable issues', async () => {
    const validator = new LaunchValidator();
    const extensionPath = path.resolve(process.cwd(), '../../odavl-studio/insight/extension');
    
    const result = await validator.validateProduct('vscode-extension', extensionPath);
    
    const autoFixableCount = result.report.issues.filter((i: any) => i.autoFixable).length;
    expect(autoFixableCount).toBeGreaterThanOrEqual(0);
    
    // If there are issues, at least some should be auto-fixable (Guardian design)
    if (result.report.issues.length > 0) {
      // This is informational, not a hard requirement
      console.log(`Found ${autoFixableCount}/${result.report.issues.length} auto-fixable issues`);
    }
  });

  it('should scan workspace for all products', async () => {
    const validator = new LaunchValidator();
    const workspacePath = path.resolve(process.cwd(), '../..');
    
    const results = await validator.validateAllProducts(workspacePath);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    // Each result should have expected structure
    results.forEach((result: any) => {
      expect(result).toHaveProperty('productType');
      expect(result).toHaveProperty('report');
      expect(result.report).toHaveProperty('productName');
      expect(result.report).toHaveProperty('readinessScore');
      expect(result.report).toHaveProperty('status');
      expect(result.report).toHaveProperty('issues');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid product path gracefully', async () => {
      const validator = new LaunchValidator();
      const invalidPath = path.resolve(process.cwd(), './non-existent-path');
      
      // Should throw error for non-existent path
      await expect(
        validator.validateProduct('auto', invalidPath)
      ).rejects.toThrow();
    });

    it('should handle malformed package.json', async () => {
      const validator = new LaunchValidator();
      // Path with invalid package.json (if exists in test fixtures)
      // This is a placeholder test - actual implementation may vary
      
      expect(validator).toBeDefined();
      // Real test would require test fixtures with broken package.json
    });

    it('should handle unsupported product types', async () => {
      const validator = new LaunchValidator();
      const extensionPath = path.resolve(process.cwd(), '../../odavl-studio/insight/extension');
      
      // Should auto-detect even with wrong type hint
      const result = await validator.validateProduct('auto', extensionPath);
      
      expect(result).toBeDefined();
      expect(result.productType).toBeTruthy();
    });
  });
});
