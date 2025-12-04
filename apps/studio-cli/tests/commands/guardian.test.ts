/**
 * ODAVL Guardian CLI Commands Tests
 * Tests for check, fix, and check-all commands
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as guardianCommands from '../../src/commands/guardian';

// Mock ora (spinner)
const mockOraInstance = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};

vi.mock('ora', () => ({
  default: vi.fn(() => mockOraInstance),
}));

// Mock LaunchValidator methods
const mockValidateProduct = vi.fn();
const mockValidateAndFix = vi.fn();
const mockValidateAllProducts = vi.fn();

// Mock LaunchValidator constructor
vi.mock('@odavl-studio/guardian-core', () => ({
  LaunchValidator: vi.fn().mockImplementation(() => ({
    validateProduct: mockValidateProduct,
    validateAndFix: mockValidateAndFix,
    validateAllProducts: mockValidateAllProducts,
  })),
}));

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Guardian CLI Commands', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('checkProduct', () => {
    it('should display readiness score and status for ready product', async () => {
      // Mock successful validation (90% ready)
      mockValidateProduct.mockResolvedValue({
        productType: 'vscode-extension',
        report: {
          productId: 'test-product',
          productName: 'Test Extension',
          productType: 'vscode-extension',
          readinessScore: 90,
          status: 'ready',
          issues: [
            {
              id: 'test-issue',
              severity: 'medium',
              category: 'config',
              message: 'Missing optional config',
              autoFixable: false,
              impact: 'Low impact',
            },
          ],
        },
      });

      await guardianCommands.checkProduct('test-path', 'vscode-extension');

      expect(mockValidateProduct).toHaveBeenCalledWith(
        'vscode-extension',
        expect.stringContaining('test-path')
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ODAVL Guardian v3.0')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('90%')
      );
    });

    it('should show warning for unstable product (70-89%)', async () => {
      mockValidateProduct.mockResolvedValue({
        productType: 'nextjs-app',
        report: {
          productId: 'test-app',
          productName: 'Test App',
          productType: 'nextjs-app',
          readinessScore: 75,
          status: 'unstable',
          issues: [
            {
              id: 'high-issue',
              severity: 'high',
              category: 'build',
              message: 'Build configuration issue',
              autoFixable: true,
              impact: 'High impact',
            },
          ],
        },
      });

      await guardianCommands.checkProduct('test-app', 'nextjs-app');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('75%')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('unstable')
      );
    });

    it('should show error for blocked product (<70%)', async () => {
      mockValidateProduct.mockResolvedValue({
        productType: 'vscode-extension',
        report: {
          productId: 'broken-ext',
          productName: 'Broken Extension',
          productType: 'vscode-extension',
          readinessScore: 50,
          status: 'blocked',
          issues: [
            {
              id: 'critical-issue',
              severity: 'critical',
              category: 'build',
              message: 'Build output missing',
              autoFixable: false,
              impact: 'Critical impact',
            },
          ],
        },
      });

      await guardianCommands.checkProduct('broken-ext', 'vscode-extension');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('50%')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('blocked')
      );
    });

    it('should group issues by severity', async () => {
      mockValidateProduct.mockResolvedValue({
        productType: 'vscode-extension',
        report: {
          productId: 'test',
          productName: 'Test',
          productType: 'vscode-extension',
          readinessScore: 60,
          status: 'blocked',
          issues: [
            {
              id: 'critical-1',
              severity: 'critical',
              category: 'build',
              message: 'Critical issue 1',
              autoFixable: true,
              impact: 'High',
            },
            {
              id: 'high-1',
              severity: 'high',
              category: 'config',
              message: 'High issue 1',
              autoFixable: true,
              impact: 'Medium',
            },
            {
              id: 'medium-1',
              severity: 'medium',
              category: 'metadata',
              message: 'Medium issue 1',
              autoFixable: false,
              impact: 'Low',
            },
          ],
        },
      });

      await guardianCommands.checkProduct('test', 'vscode-extension');

      // Should display all severity levels
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Critical')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('High')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Medium')
      );
    });

    it('should show auto-fixable suggestion', async () => {
      mockValidateProduct.mockResolvedValue({
        productType: 'vscode-extension',
        report: {
          productId: 'test',
          productName: 'Test',
          productType: 'vscode-extension',
          readinessScore: 85,
          status: 'ready',
          issues: [
            {
              id: 'fixable-1',
              severity: 'high',
              category: 'config',
              message: 'Fixable issue',
              autoFixable: true,
              impact: 'Medium',
            },
            {
              id: 'fixable-2',
              severity: 'medium',
              category: 'metadata',
              message: 'Another fixable issue',
              autoFixable: true,
              impact: 'Low',
            },
          ],
        },
      });

      await guardianCommands.checkProduct('test', 'vscode-extension');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('2 issues can be auto-fixed')
      );
    });

    it('should handle validation errors gracefully', async () => {
      mockValidateProduct.mockRejectedValue(
        new Error('Invalid product path')
      );

      try {
        await guardianCommands.checkProduct('invalid-path', 'auto');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Expected to throw due to process.exit
      }

      expect(mockOraInstance.fail).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
  });

  describe('fixProduct', () => {
    it('should apply fixes and show improvement', async () => {
      // Mock validation before fix (70% ready)
      mockValidateAndFix.mockResolvedValue({
        productType: 'vscode-extension',
        initialReport: {
          productId: 'test',
          productName: 'Test Extension',
          productType: 'vscode-extension',
          readinessScore: 70,
          status: 'unstable',
          issues: [
            {
              id: 'missing-icon',
              severity: 'high',
              category: 'ui',
              message: 'Missing icon',
              autoFixable: true,
              impact: 'Medium',
            },
          ],
        },
        fixResults: [
          {
            issueId: 'missing-icon',
            success: true,
            action: 'Added icon.png',
          },
        ],
        finalReport: {
          productId: 'test',
          productName: 'Test Extension',
          productType: 'vscode-extension',
          readinessScore: 90,
          status: 'ready',
          issues: [],
        },
      });

      await guardianCommands.fixProduct('test-ext', 'vscode-extension');

      expect(mockValidateAndFix).toHaveBeenCalledWith(
        'vscode-extension',
        expect.stringContaining('test-ext')
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Initial readiness: 70%')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Final readiness: 90%')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Improved by: +20%')
      );
    });

    it('should show fixes applied', async () => {
      mockValidateAndFix.mockResolvedValue({
        productType: 'nextjs-app',
        initialReport: {
          productId: 'test',
          productName: 'Test App',
          productType: 'nextjs-app',
          readinessScore: 65,
          status: 'unstable',
          issues: [
            {
              id: 'standalone-output',
              severity: 'critical',
              category: 'build',
              message: 'Standalone output detected',
              autoFixable: true,
              impact: 'High',
            },
            {
              id: 'missing-env',
              severity: 'high',
              category: 'config',
              message: 'Missing .env.local',
              autoFixable: true,
              impact: 'Medium',
            },
          ],
        },
        fixResults: [
          {
            issueId: 'standalone-output',
            success: true,
            action: 'Removed output: standalone',
          },
          {
            issueId: 'missing-env',
            success: true,
            action: 'Created .env.local',
          },
        ],
        finalReport: {
          productId: 'test',
          productName: 'Test App',
          productType: 'nextjs-app',
          readinessScore: 100,
          status: 'ready',
          issues: [],
        },
      });

      await guardianCommands.fixProduct('test-app', 'nextjs-app');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('standalone-output')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('missing-env')
      );
    });

    it('should show remaining issues if not all fixed', async () => {
      mockValidateAndFix.mockResolvedValue({
        productType: 'vscode-extension',
        initialReport: {
          productId: 'test',
          productName: 'Test',
          productType: 'vscode-extension',
          readinessScore: 60,
          status: 'blocked',
          issues: [
            {
              id: 'fixable',
              severity: 'high',
              category: 'config',
              message: 'Fixable issue',
              autoFixable: true,
              impact: 'Medium',
            },
            {
              id: 'manual',
              severity: 'critical',
              category: 'build',
              message: 'Requires manual fix',
              autoFixable: false,
              impact: 'High',
            },
          ],
        },
        fixResults: [
          {
            issueId: 'fixable',
            success: true,
            action: 'Fixed',
          },
        ],
        finalReport: {
          productId: 'test',
          productName: 'Test',
          productType: 'vscode-extension',
          readinessScore: 75,
          status: 'unstable',
          issues: [
            {
              id: 'manual',
              severity: 'critical',
              category: 'build',
              message: 'Requires manual fix',
              autoFixable: false,
              impact: 'High',
            },
          ],
        },
      });

      await guardianCommands.fixProduct('test', 'vscode-extension');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Remaining issues: 1')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Requires manual fix')
      );
    });

    it('should handle fix errors gracefully', async () => {
      mockValidateAndFix.mockRejectedValue(
        new Error('Failed to apply fixes')
      );

      try {
        await guardianCommands.fixProduct('test', 'auto');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Expected to throw due to process.exit
      }

      expect(mockOraInstance.fail).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
  });

  describe('checkAllProducts', () => {
    it('should scan workspace and show summary', async () => {
      mockValidateAllProducts.mockResolvedValue([
        {
          productType: 'vscode-extension',
          report: {
            productId: 'ext-1',
            productName: 'Extension 1',
            productType: 'vscode-extension',
            readinessScore: 95,
            status: 'ready',
            issues: [],
          },
        },
        {
          productType: 'nextjs-app',
          report: {
            productId: 'app-1',
            productName: 'App 1',
            productType: 'nextjs-app',
            readinessScore: 65,
            status: 'unstable',
            issues: [
              {
                id: 'issue-1',
                severity: 'high',
                category: 'build',
                message: 'Build issue',
                autoFixable: true,
                impact: 'Medium',
              },
            ],
          },
        },
      ]);

      await guardianCommands.checkAllProducts();

      expect(mockValidateAllProducts).toHaveBeenCalled();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 products')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Extension 1')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('App 1')
      );
    });

    it('should calculate summary statistics', async () => {
      mockValidateAllProducts.mockResolvedValue([
        {
          productType: 'vscode-extension',
          report: {
            productId: 'ready-1',
            productName: 'Ready Product',
            productType: 'vscode-extension',
            readinessScore: 100,
            status: 'ready',
            issues: [],
          },
        },
        {
          productType: 'nextjs-app',
          report: {
            productId: 'unstable-1',
            productName: 'Unstable Product',
            productType: 'nextjs-app',
            readinessScore: 75,
            status: 'unstable',
            issues: [
              {
                id: 'issue-1',
                severity: 'medium',
                category: 'config',
                message: 'Config issue',
                autoFixable: false,
                impact: 'Low',
              },
            ],
          },
        },
        {
          productType: 'vscode-extension',
          report: {
            productId: 'blocked-1',
            productName: 'Blocked Product',
            productType: 'vscode-extension',
            readinessScore: 50,
            status: 'blocked',
            issues: [
              {
                id: 'critical-1',
                severity: 'critical',
                category: 'build',
                message: 'Critical issue',
                autoFixable: true,
                impact: 'High',
              },
            ],
          },
        },
      ]);

      await guardianCommands.checkAllProducts();

      // Should show summary
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Ready: 1')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Unstable: 1')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Blocked: 1')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Average: 75%')
      );
    });

    it('should show auto-fixable issues count', async () => {
      mockValidateAllProducts.mockResolvedValue([
        {
          productType: 'vscode-extension',
          report: {
            productId: 'test-1',
            productName: 'Test 1',
            productType: 'vscode-extension',
            readinessScore: 80,
            status: 'ready',
            issues: [
              {
                id: 'fixable-1',
                severity: 'high',
                category: 'config',
                message: 'Fixable 1',
                autoFixable: true,
                impact: 'Medium',
              },
              {
                id: 'manual-1',
                severity: 'medium',
                category: 'metadata',
                message: 'Manual 1',
                autoFixable: false,
                impact: 'Low',
              },
            ],
          },
        },
        {
          productType: 'nextjs-app',
          report: {
            productId: 'test-2',
            productName: 'Test 2',
            productType: 'nextjs-app',
            readinessScore: 70,
            status: 'unstable',
            issues: [
              {
                id: 'fixable-2',
                severity: 'high',
                category: 'build',
                message: 'Fixable 2',
                autoFixable: true,
                impact: 'High',
              },
            ],
          },
        },
      ]);

      await guardianCommands.checkAllProducts();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('2 auto-fixable issues')
      );
    });

    it('should handle empty workspace', async () => {
      mockValidateAllProducts.mockResolvedValue([]);

      await guardianCommands.checkAllProducts();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('No products found')
      );
    });

    it('should handle scan errors gracefully', async () => {
      mockValidateAllProducts.mockRejectedValue(
        new Error('Workspace scan failed')
      );

      try {
        await guardianCommands.checkAllProducts();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Expected to throw due to process.exit
      }

      expect(mockOraInstance.fail).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });
  });
});
