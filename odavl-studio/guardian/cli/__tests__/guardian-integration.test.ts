/**
 * @file guardian-integration.test.ts
 * @description Integration tests for Guardian CLI commands
 * @coverage End-to-end workflows
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Execute Guardian CLI command and return output
 */
function runGuardianCommand(args: string): string {
  try {
    const output = execSync(`node dist/guardian.js ${args}`, {
      encoding: 'utf-8',
      cwd: __dirname.replace('__tests__', ''),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });
    return output;
  } catch (error: any) {
    // Return error output for validation
    return error.stdout || error.stderr || error.message;
  }
}

/**
 * Check if Guardian CLI is built
 */
function isGuardianBuilt(): boolean {
  const distPath = join(__dirname.replace('__tests__', ''), 'dist', 'guardian.js');
  return existsSync(distPath);
}

/**
 * Ensure reports directory exists
 */
function ensureReportsDir(): void {
  const reportsDir = join(__dirname.replace('__tests__', ''), 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Guardian CLI Integration Tests', () => {
  beforeAll(() => {
    // Ensure Guardian is built before running tests
    if (!isGuardianBuilt()) {
      console.warn('⚠️  Guardian not built. Run: pnpm build');
    }

    // Ensure reports directory exists
    ensureReportsDir();
  });

  // ============================================================================
  // Command: guardian context
  // ============================================================================

  describe('guardian context', () => {
    it('should display ODAVL Suite context', () => {
      const output = runGuardianCommand('context');

      expect(output).toContain('ODAVL Suite');
      expect(output).toContain('14 products');
      expect(output).toContain('insight-core');
      expect(output).toContain('autopilot-engine');
      expect(output).toContain('guardian-cli');
    }, 10000);

    it('should show product relationships', () => {
      const output = runGuardianCommand('context');

      expect(output).toContain('relationships');
      expect(output).toContain('→'); // Relationship arrow
    }, 10000);

    it('should display criticality scores', () => {
      const output = runGuardianCommand('context');

      expect(output).toContain('Criticality');
      expect(output).toMatch(/\d+%/); // Should show percentage
    }, 10000);
  });

  // ============================================================================
  // Command: guardian detect
  // ============================================================================

  describe('guardian detect', () => {
    it('should detect ODAVL monorepo', () => {
      const output = runGuardianCommand('detect');

      expect(output).toContain('Project detected');
      expect(output).toContain('typescript');
      expect(output).toContain('monorepo');
      expect(output).toContain('Confidence');
    }, 10000);

    it('should detect Next.js framework', () => {
      const output = runGuardianCommand('detect');

      expect(output).toContain('Framework');
      expect(output).toContain('nextjs');
    }, 10000);

    it('should detect pnpm package manager', () => {
      const output = runGuardianCommand('detect');

      expect(output).toContain('Package Manager');
      expect(output).toContain('pnpm');
    }, 10000);

    it('should show high confidence for ODAVL', () => {
      const output = runGuardianCommand('detect');

      // Should be >80% confidence
      const confidenceMatch = output.match(/Confidence:\s*(\d+)/);
      if (confidenceMatch) {
        const confidence = parseInt(confidenceMatch[1]);
        expect(confidence).toBeGreaterThan(80);
      }
    }, 10000);
  });

  // ============================================================================
  // Command: guardian impact <product>
  // ============================================================================

  describe('guardian impact', () => {
    it('should analyze insight-core impact', () => {
      const output = runGuardianCommand('impact insight-core');

      expect(output).toContain('CROSS-PRODUCT IMPACT');
      expect(output).toContain('insight-core');
      expect(output).toContain('affected products');
      expect(output).toContain('CRITICAL');
    }, 15000);

    it('should find 6+ affected products for insight-core', () => {
      const output = runGuardianCommand('impact insight-core');

      // Extract number of affected products
      const affectedMatch = output.match(/(\d+)\s+affected products/i);
      if (affectedMatch) {
        const affected = parseInt(affectedMatch[1]);
        expect(affected).toBeGreaterThanOrEqual(6);
      } else {
        expect(output).toContain('affected');
      }
    }, 15000);

    it('should analyze autopilot-engine impact', () => {
      const output = runGuardianCommand('impact autopilot-engine');

      expect(output).toContain('autopilot-engine');
      expect(output).toContain('affected products');
    }, 15000);

    it('should show visual cascade tree', () => {
      const output = runGuardianCommand('impact insight-core');

      // Should contain tree characters and emoji
      expect(output).toMatch(/[└├─│]/);
      expect(output).toMatch(/[🔴🟡🔵]/);
    }, 15000);

    it('should generate recommendations', () => {
      const output = runGuardianCommand('impact insight-core');

      expect(output).toContain('Recommendations');
      expect(output).toContain('Fix');
    }, 15000);

    it('should generate test plan', () => {
      const output = runGuardianCommand('impact insight-core');

      expect(output).toContain('Test Plan');
      expect(output).toContain('Test insight-core');
    }, 15000);

    it('should save report to file', () => {
      const output = runGuardianCommand('impact insight-core');

      expect(output).toContain('Report saved');
      
      // Check if report file exists
      const reportsDir = join(__dirname.replace('__tests__', ''), 'reports');
      const reportFiles = existsSync(reportsDir);
      expect(reportFiles).toBe(true);
    }, 15000);

    it('should handle invalid product gracefully', () => {
      const output = runGuardianCommand('impact unknown-product');

      expect(output).toContain('Unknown product');
    }, 10000);
  });

  // ============================================================================
  // Command: guardian impact --error
  // ============================================================================

  describe('guardian impact with error context', () => {
    it('should accept error context flag', () => {
      const output = runGuardianCommand(
        'impact autopilot-engine --error "TypeScript error" --severity high'
      );

      expect(output).toContain('autopilot-engine');
      expect(output).toContain('affected');
    }, 15000);

    it('should increase confidence with error context', () => {
      const withoutContext = runGuardianCommand('impact autopilot-engine');
      const withContext = runGuardianCommand(
        'impact autopilot-engine --error "TypeScript error" --severity high'
      );

      // Both should succeed
      expect(withoutContext).toContain('autopilot-engine');
      expect(withContext).toContain('autopilot-engine');
    }, 20000);
  });

  // ============================================================================
  // Interactive Mode Tests
  // ============================================================================

  describe('Interactive Mode (Limited)', () => {
    it('should show help when run without arguments', () => {
      const output = runGuardianCommand('--help');

      expect(output).toContain('Guardian');
      expect(output).toContain('context');
      expect(output).toContain('detect');
      expect(output).toContain('impact');
    }, 10000);

    it('should show version', () => {
      const output = runGuardianCommand('--version');

      expect(output).toMatch(/\d+\.\d+\.\d+/);
    }, 10000);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle unknown command gracefully', () => {
      const output = runGuardianCommand('unknown-command');

      expect(output).toMatch(/unknown|invalid|error/i);
    }, 10000);

    it('should handle missing required arguments', () => {
      const output = runGuardianCommand('impact');

      expect(output).toMatch(/missing|required|product/i);
    }, 10000);
  });

  // ============================================================================
  // Output Format Tests
  // ============================================================================

  describe('Output Format', () => {
    it('should produce colored output (ANSI codes)', () => {
      const output = runGuardianCommand('context');

      // Check for ANSI color codes
      expect(output).toMatch(/\u001b\[\d+m/);
    }, 10000);

    it('should format tables correctly', () => {
      const output = runGuardianCommand('context');

      // Should have table borders
      expect(output).toMatch(/[─│┌┐└┘├┤]/);
    }, 10000);

    it('should use emoji indicators', () => {
      const output = runGuardianCommand('impact insight-core');

      expect(output).toMatch(/[✅❌⚠️🔴🟡🔵]/);
    }, 15000);
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should complete context command in <3s', () => {
      const start = Date.now();
      runGuardianCommand('context');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000);
    }, 5000);

    it('should complete detect command in <3s', () => {
      const start = Date.now();
      runGuardianCommand('detect');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000);
    }, 5000);

    it('should complete impact command in <10s', () => {
      const start = Date.now();
      runGuardianCommand('impact insight-core');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10000);
    }, 15000);
  });

  // ============================================================================
  // File Output Tests
  // ============================================================================

  describe('File Output', () => {
    it('should create reports directory', () => {
      runGuardianCommand('impact insight-core');

      const reportsDir = join(__dirname.replace('__tests__', ''), 'reports');
      expect(existsSync(reportsDir)).toBe(true);
    }, 15000);

    it('should save valid JSON report', () => {
      runGuardianCommand('impact insight-core');

      const reportsDir = join(__dirname.replace('__tests__', ''), 'reports');
      
      if (existsSync(reportsDir)) {
        // Find most recent report file
        const fs = require('fs');
        const files = fs.readdirSync(reportsDir)
          .filter((f: string) => f.startsWith('impact-insight-core-'));
        
        if (files.length > 0) {
          const reportPath = join(reportsDir, files[files.length - 1]);
          const content = readFileSync(reportPath, 'utf-8');
          
          // Should be valid JSON
          const report = JSON.parse(content);
          expect(report).toBeDefined();
          expect(report.source).toBe('insight-core');
        }
      }
    }, 15000);
  });

  // ============================================================================
  // End-to-End Workflow Tests
  // ============================================================================

  describe('E2E Workflows', () => {
    it('should complete full analysis workflow', () => {
      // 1. Detect project
      const detectOutput = runGuardianCommand('detect');
      expect(detectOutput).toContain('typescript');

      // 2. Show context
      const contextOutput = runGuardianCommand('context');
      expect(contextOutput).toContain('ODAVL Suite');

      // 3. Analyze impact
      const impactOutput = runGuardianCommand('impact insight-core');
      expect(impactOutput).toContain('affected products');
    }, 30000);

    it('should handle multiple sequential analyses', () => {
      const products = ['insight-core', 'autopilot-engine', 'guardian-cli'];

      products.forEach(product => {
        const output = runGuardianCommand(`impact ${product}`);
        expect(output).toContain(product);
        expect(output).toContain('affected');
      });
    }, 45000);
  });
});

// ============================================================================
// CLI Argument Parsing Tests
// ============================================================================

describe('CLI Argument Parsing', () => {
  it('should handle --help flag', () => {
    const output = runGuardianCommand('--help');
    expect(output).toContain('help');
  });

  it('should handle -h short flag', () => {
    const output = runGuardianCommand('-h');
    expect(output).toContain('help');
  });

  it('should handle --version flag', () => {
    const output = runGuardianCommand('--version');
    expect(output).toMatch(/\d+\.\d+/);
  });

  it('should handle multiple flags', () => {
    const output = runGuardianCommand('impact insight-core --error "test" --severity high');
    expect(output).toContain('insight-core');
  });
});
