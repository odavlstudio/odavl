/**
 * Guardian v5.0 - Generic Suite Detection
 * 
 * Detects any suite/monorepo workspace (not just ODAVL)
 * Works with Spotify, Microsoft, or any company's monorepo
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { scanWorkspace, Package } from './package-scanner.js';
import { ProjectType } from './project-detector.js';

/**
 * Suite Information
 */
export interface SuiteInfo {
  name: string;              // Suite/company name (e.g., "Spotify", "ODAVL")
  displayName: string;       // Formatted display name
  type: 'monorepo' | 'single';
  rootPath: string;
  products: SuiteProduct[];
  totalProducts: number;
  detectionSource: 'package.json' | 'git-remote' | 'directory' | 'unknown';
}

/**
 * Suite Product
 */
export interface SuiteProduct {
  name: string;              // Package name
  displayName: string;       // Formatted for display
  type: ProjectType;         // website, extension, cli, package
  path: string;
  relativePath: string;
  emoji: string;             // Visual representation
  tested: boolean;           // Has Guardian tested it?
  healthScore?: number;      // 0-100
}

/**
 * Suite Detector
 */
export class SuiteDetector {
  /**
   * Detect suite information
   */
  async detect(workspacePath: string): Promise<SuiteInfo> {
    // Scan workspace structure
    const workspace = await scanWorkspace(workspacePath);

    // Detect suite name
    const suiteName = this.detectSuiteName(workspacePath);

    // Convert packages to products
    const products = this.convertToProducts(workspace.subPackages || []);

    return {
      name: suiteName.name,
      displayName: suiteName.displayName,
      type: workspace.workspaceType,
      rootPath: workspacePath,
      products,
      totalProducts: products.length,
      detectionSource: suiteName.source,
    };
  }

  /**
   * Detect suite/company name from various sources
   */
  private detectSuiteName(workspacePath: string): {
    name: string;
    displayName: string;
    source: 'package.json' | 'git-remote' | 'directory' | 'unknown';
  } {
    // Strategy 1: Read root package.json
    const pkgName = this.getNameFromPackageJson(workspacePath);
    if (pkgName) {
      return {
        name: pkgName,
        displayName: this.formatName(pkgName),
        source: 'package.json',
      };
    }

    // Strategy 2: Get from git remote
    const gitName = this.getNameFromGitRemote(workspacePath);
    if (gitName) {
      return {
        name: gitName,
        displayName: this.formatName(gitName),
        source: 'git-remote',
      };
    }

    // Strategy 3: Get from directory name
    const dirName = basename(workspacePath);
    return {
      name: dirName,
      displayName: this.formatName(dirName),
      source: 'directory',
    };
  }

  /**
   * Get name from package.json
   */
  private getNameFromPackageJson(workspacePath: string): string | null {
    try {
      const pkgPath = join(workspacePath, 'package.json');
      if (!existsSync(pkgPath)) {
        return null;
      }

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (!pkg.name) {
        return null;
      }

      // Extract meaningful name
      // Examples:
      // "@odavl-studio/workspace" → "odavl"
      // "spotify-monorepo" → "spotify"
      // "my-company-workspace" → "my-company"
      
      let name = pkg.name;
      
      // Remove scope (@company/)
      if (name.startsWith('@')) {
        name = name.split('/')[0].substring(1); // @odavl-studio → odavl-studio
      }

      // Extract base name (remove -workspace, -monorepo suffixes)
      name = name
        .replace(/-workspace$/i, '')
        .replace(/-monorepo$/i, '')
        .replace(/-suite$/i, '');

      // If it has -studio suffix, keep first part
      if (name.includes('-studio')) {
        name = name.split('-')[0]; // odavl-studio → odavl
      }

      return name;
    } catch {
      return null;
    }
  }

  /**
   * Get name from git remote URL
   */
  private getNameFromGitRemote(workspacePath: string): string | null {
    try {
      const remote = execSync('git remote get-url origin', {
        cwd: workspacePath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      // Parse git URL
      // https://github.com/spotify/web-workspace → spotify
      // git@github.com:microsoft/vscode.git → microsoft
      
      const match = remote.match(/[/:]([\w-]+)\/([\w-]+?)(?:\.git)?$/);
      if (match) {
        const owner = match[1]; // Organization/user name
        return owner;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Format name for display
   */
  private formatName(name: string): string {
    // Examples:
    // "odavl" → "ODAVL"
    // "spotify" → "Spotify"
    // "my-company" → "My Company"

    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Convert Package[] to SuiteProduct[]
   */
  private convertToProducts(packages: Package[]): SuiteProduct[] {
    return packages.map(pkg => ({
      name: pkg.name,
      displayName: this.formatProductName(pkg.name, pkg.displayName),
      type: pkg.type,
      path: pkg.path,
      relativePath: pkg.relativePath,
      emoji: this.getProductEmoji(pkg.type),
      tested: false, // Will be updated when tests run
      healthScore: undefined,
    }));
  }

  /**
   * Format product name for display
   */
  private formatProductName(name: string, displayName?: string): string {
    // If displayName exists (from package.json), use it
    if (displayName) {
      return displayName;
    }

    // Remove scope and format
    // "@odavl-studio/insight-core" → "Insight Core"
    // "spotify-web" → "Spotify Web"
    
    let formatted = name;
    
    // Remove scope
    if (formatted.startsWith('@')) {
      formatted = formatted.split('/')[1]; // @odavl-studio/insight-core → insight-core
    }

    // Remove company prefix if it matches suite name
    // (will be handled later with suite context)
    
    // Format: insight-core → Insight Core
    return formatted
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get emoji for product type
   */
  private getProductEmoji(type: ProjectType): string {
    const emojis: Record<ProjectType, string> = {
      [ProjectType.WEBSITE]: '🌐',
      [ProjectType.EXTENSION]: '🧩',
      [ProjectType.CLI]: '⚙️',
      [ProjectType.PACKAGE]: '📦',
      [ProjectType.MONOREPO]: '🏢',
      [ProjectType.UNKNOWN]: '❓',
    };
    return emojis[type] || '❓';
  }

  /**
   * Filter products by type
   */
  filterProductsByType(products: SuiteProduct[], type: ProjectType): SuiteProduct[] {
    return products.filter(p => p.type === type);
  }

  /**
   * Get product by name
   */
  getProductByName(products: SuiteProduct[], name: string): SuiteProduct | undefined {
    return products.find(p => p.name === name);
  }

  /**
   * Sort products by type
   */
  sortProductsByType(products: SuiteProduct[]): SuiteProduct[] {
    const typeOrder = {
      [ProjectType.WEBSITE]: 1,
      [ProjectType.EXTENSION]: 2,
      [ProjectType.CLI]: 3,
      [ProjectType.PACKAGE]: 4,
      [ProjectType.MONOREPO]: 5,
      [ProjectType.UNKNOWN]: 6,
    };

    return [...products].sort((a, b) => {
      const orderA = typeOrder[a.type] || 999;
      const orderB = typeOrder[b.type] || 999;
      return orderA - orderB;
    });
  }

  /**
   * Generate suite summary
   */
  generateSummary(suite: SuiteInfo): string {
    const lines: string[] = [];
    
    lines.push(`🏢 ${suite.displayName} Suite`);
    lines.push(`📦 ${suite.totalProducts} product${suite.totalProducts !== 1 ? 's' : ''} detected`);
    lines.push('');

    // Group by type
    const byType: Record<string, SuiteProduct[]> = {};
    suite.products.forEach(p => {
      if (!byType[p.type]) byType[p.type] = [];
      byType[p.type].push(p);
    });

    // Display each type
    Object.entries(byType).forEach(([type, products]) => {
      const emoji = products[0].emoji;
      const typeName = type.charAt(0).toUpperCase() + type.slice(1) + 's';
      lines.push(`${emoji} ${typeName} (${products.length}):`);
      products.forEach(p => {
        lines.push(`  • ${p.displayName}`);
      });
      lines.push('');
    });

    return lines.join('\n');
  }
}

/**
 * Convenience function: Detect suite
 */
export async function detectSuite(workspacePath: string): Promise<SuiteInfo> {
  const detector = new SuiteDetector();
  return detector.detect(workspacePath);
}
