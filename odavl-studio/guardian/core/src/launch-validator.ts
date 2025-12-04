/**
 * Launch Validator
 * Main coordinator for product validation and fixing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { VSCodeExtensionInspector } from '../../inspectors/vscode-extension.js';
import { NextJSAppInspector } from '../../inspectors/nextjs-app.js';
import { ExtensionFixer } from '../../fixers/extension-fixer.js';
import { NextJSFixer } from '../../fixers/nextjs-fixer.js';
import type { InspectionReport, BaseInspector } from '../../inspectors/base-inspector.js';
import type { FixResult } from '../../fixers/extension-fixer.js';

export type ProductType = 
  | 'vscode-extension'
  | 'nextjs-app'
  | 'nodejs-server'
  | 'cli-app'
  | 'npm-package'
  | 'cloud-function'
  | 'ide-extension'
  | 'auto';

export interface ValidationResult {
  productType: ProductType;
  report: InspectionReport;
  fixesApplied?: FixResult[];
  verificationReport?: InspectionReport;
}

export class LaunchValidator {
  private inspectors: Map<ProductType, BaseInspector>;
  private fixers: Map<ProductType, ExtensionFixer | NextJSFixer>;

  constructor() {
    this.inspectors = new Map([
      ['vscode-extension', new VSCodeExtensionInspector()],
      ['nextjs-app', new NextJSAppInspector()],
    ]);

    this.fixers = new Map<ProductType, ExtensionFixer | NextJSFixer>([
      ['vscode-extension', new ExtensionFixer()],
      ['nextjs-app', new NextJSFixer()],
    ]);
  }

  /**
   * Detect product type automatically
   */
  async detectProductType(projectPath: string): Promise<ProductType> {
    try {
      const pkgPath = path.join(projectPath, 'package.json');
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

      // VS Code Extension
      if (pkg.engines?.vscode || pkg.categories?.includes('Extension')) {
        return 'vscode-extension';
      }

      // Next.js App
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        return 'nextjs-app';
      }

      // CLI App
      if (pkg.bin) {
        return 'cli-app';
      }

      // npm Package
      if (pkg.main || pkg.module || pkg.exports) {
        return 'npm-package';
      }

      // Default to generic
      return 'nodejs-server';
    } catch {
      return 'nodejs-server';
    }
  }

  /**
   * Validate a single product
   */
  async validateProduct(
    productType: ProductType,
    projectPath: string
  ): Promise<ValidationResult> {
    // Auto-detect if needed
    if (productType === 'auto') {
      productType = await this.detectProductType(projectPath);
    }

    const inspector = this.inspectors.get(productType);
    if (!inspector) {
      throw new Error(`No inspector available for product type: ${productType}`);
    }

    const report = await inspector.inspect(projectPath);

    return {
      productType,
      report,
    };
  }

  /**
   * Validate and fix a product
   */
  async validateAndFix(
    productType: ProductType,
    projectPath: string
  ): Promise<ValidationResult> {
    // Auto-detect if needed
    if (productType === 'auto') {
      productType = await this.detectProductType(projectPath);
    }

    // Step 1: Initial scan
    const inspector = this.inspectors.get(productType);
    if (!inspector) {
      throw new Error(`No inspector available for product type: ${productType}`);
    }

    const report = await inspector.inspect(projectPath);

    // Step 2: Apply fixes
    const fixer = this.fixers.get(productType);
    if (!fixer) {
      return {
        productType,
        report,
      };
    }

    const fixesApplied = await fixer.applyFixes(projectPath, report.issues);

    // Step 3: Re-scan to verify fixes
    const verificationReport = await inspector.inspect(projectPath);

    return {
      productType,
      report,
      fixesApplied,
      verificationReport,
    };
  }

  /**
   * Validate all products in a workspace
   */
  async validateAllProducts(workspaceRoot: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Find all potential products
    const products = await this.findProducts(workspaceRoot);

    for (const product of products) {
      try {
        const result = await this.validateProduct('auto', product.path);
        results.push(result);
      } catch (error) {
        console.error(`Failed to validate ${product.path}:`, error);
      }
    }

    return results;
  }

  /**
   * Find all products in workspace
   */
  private async findProducts(
    workspaceRoot: string
  ): Promise<Array<{ name: string; path: string }>> {
    const products: Array<{ name: string; path: string }> = [];

    // Check common locations
    const locations = [
      'apps/*',
      'packages/*',
      'odavl-studio/*/extension',
      'odavl-studio/*/cloud',
      'odavl-studio/*/app',
    ];

    for (const location of locations) {
      const [base, pattern] = location.split('*');
      const baseDir = path.join(workspaceRoot, base);

      try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const productPath = path.join(baseDir, entry.name);
            const pkgPath = path.join(productPath, 'package.json');

            try {
              await fs.access(pkgPath);
              products.push({
                name: entry.name,
                path: productPath,
              });
            } catch {
              // No package.json, skip
            }
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return products;
  }

  /**
   * Get readiness summary for all products
   */
  async getReadinessSummary(workspaceRoot: string): Promise<{
    totalProducts: number;
    readyProducts: number;
    unstableProducts: number;
    blockedProducts: number;
    averageReadiness: number;
    autoFixableIssues: number;
  }> {
    const results = await this.validateAllProducts(workspaceRoot);

    const summary = {
      totalProducts: results.length,
      readyProducts: 0,
      unstableProducts: 0,
      blockedProducts: 0,
      averageReadiness: 0,
      autoFixableIssues: 0,
    };

    let totalReadiness = 0;

    for (const result of results) {
      const { report } = result;

      totalReadiness += report.readinessScore;

      if (report.status === 'ready') {
        summary.readyProducts++;
      } else if (report.status === 'unstable') {
        summary.unstableProducts++;
      } else {
        summary.blockedProducts++;
      }

      summary.autoFixableIssues += report.issues.filter(i => i.autoFixable).length;
    }

    summary.averageReadiness = Math.round(totalReadiness / results.length);

    return summary;
  }
}
