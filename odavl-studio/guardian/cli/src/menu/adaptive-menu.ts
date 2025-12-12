/**
 * Adaptive Menu System - Changes based on detected project
 * 
 * Phase 5: Dynamic Menu System
 * This replaces static menu with context-aware menu generation
 */

import chalk from 'chalk';
import type { SuiteInfo, SuiteProduct } from '../detectors/suite-detector.js';
import { ProjectType } from '../detectors/project-detector.js';

/**
 * Menu mode based on project detection
 */
export type MenuMode = 'single-package' | 'monorepo' | 'unknown';

/**
 * Adaptive menu item
 */
export interface AdaptiveMenuItem {
  id: string;
  key: string;
  label: string;
  emoji: string;
  description: string;
  type: 'test' | 'utility' | 'navigation';
  projectType?: ProjectType;
  product?: SuiteProduct;
}

/**
 * Menu section for grouping
 */
export interface MenuSection {
  title: string;
  emoji: string;
  items: AdaptiveMenuItem[];
}

/**
 * Adaptive Menu Generator
 * Creates menu based on detected project structure
 */
export class AdaptiveMenuGenerator {
  /**
   * Generate menu for single package project
   */
  generateSinglePackageMenu(
    projectType: ProjectType,
    projectName: string
  ): MenuSection[] {
    const sections: MenuSection[] = [];

    // Main Test Section
    sections.push({
      title: 'TESTING',
      emoji: '🧪',
      items: [
        {
          id: 'test-main',
          key: '1',
          label: `Test ${this.getProjectTypeLabel(projectType)}`,
          emoji: this.getProjectTypeEmoji(projectType),
          description: `Comprehensive ${projectType} testing`,
          type: 'test',
          projectType,
        },
      ],
    });

    // Utilities Section
    sections.push({
      title: 'UTILITIES',
      emoji: '⚙️',
      items: [
        {
          id: 'custom-test',
          key: '2',
          label: 'Custom Test',
          emoji: '🎯',
          description: 'Pick specific tests',
          type: 'utility',
        },
        {
          id: 'language',
          key: '3',
          label: 'Language Analysis',
          emoji: '🗣️',
          description: 'Detect all languages',
          type: 'utility',
        },
      ],
    });

    return sections;
  }

  /**
   * Generate menu for monorepo/suite
   */
  generateMonorepoMenu(suite: SuiteInfo): MenuSection[] {
    const sections: MenuSection[] = [];

    // Group products by type for organized display
    const grouped = this.groupProductsByType(suite.products);
    
    // Websites Section - Custom URL only
    sections.push({
      title: `🌐 WEBSITE TESTING`,
      emoji: '🌐',
      items: [
        {
          id: 'test-custom-website',
          key: 'w',
          label: 'Test Website',
          emoji: '🌐',
          description: 'Enter URL · Accessibility · Performance · Security · SEO',
          type: 'test' as const,
          projectType: ProjectType.WEBSITE,
        },
      ],
    });

    // CLI Tools Section
    if (grouped.cli.length > 0) {
      sections.push({
        title: `⚙️ CLI TOOLS (${grouped.cli.length})`,
        emoji: '⚙️',
        items: [
          {
            id: 'test-all-cli',
            key: 'c',
            label: 'Test All CLI Tools',
            emoji: '⚙️',
            description: `Run comprehensive tests on all ${grouped.cli.length} CLI tools`,
            type: 'test' as const,
            projectType: ProjectType.CLI,
          },
          ...grouped.cli.map((product, index) => ({
            id: `product-${product.name}`,
            key: `c${index + 1}`,
            label: `${product.displayName} (Individual)`,
            emoji: '⚙️',
            description: 'Functionality · Exit codes · Help text · Error handling',
            type: 'test' as const,
            projectType: product.type,
            product,
          })),
          {
            id: 'cli-deep-analysis',
            key: 'cd',
            label: 'CLI Deep Analysis',
            emoji: '🔍',
            description: 'Performance profiling · Memory usage · Command parsing · Benchmarks',
            type: 'test' as const,
            projectType: ProjectType.CLI,
          },
        ],
      });
    }

    // Extensions Section
    if (grouped.extensions.length > 0) {
      sections.push({
        title: `🧩 EXTENSIONS (${grouped.extensions.length})`,
        emoji: '🧩',
        items: grouped.extensions.map((product, index) => ({
          id: `product-${product.name}`,
          key: `e${index + 1}`,
          label: product.displayName,
          emoji: '🧩',
          description: 'Activation · Commands · Package validity · Manifest',
          type: 'test' as const,
          projectType: product.type,
          product,
        })),
      });
    }

    // Packages Section - Smart Grouping
    if (grouped.packages.length > 0) {
      const pkgCategories = this.categorizePackages(grouped.packages);
      
      sections.push({
        title: `📦 PACKAGES (${grouped.packages.length})`,
        emoji: '📦',
        items: [
          {
            id: 'test-all-packages',
            key: 'p',
            label: 'Test All Packages',
            emoji: '📦',
            description: `Validate all ${grouped.packages.length} packages · Build · Types · Exports · Dependencies`,
            type: 'test' as const,
            projectType: ProjectType.PACKAGE,
          },
          {
            id: 'test-packages-by-category',
            key: 'pc',
            label: 'Test by Category',
            emoji: '📋',
            description: `Core (${pkgCategories.core.length}) · Integration (${pkgCategories.integration.length}) · Utils (${pkgCategories.utils.length}) · UI (${pkgCategories.ui.length})`,
            type: 'test' as const,
            projectType: ProjectType.PACKAGE,
          },
          {
            id: 'test-packages-interactive',
            key: 'pi',
            label: 'Select Packages Interactively',
            emoji: '✅',
            description: 'Choose specific packages to test with checkboxes',
            type: 'test' as const,
            projectType: ProjectType.PACKAGE,
          },
        ],
      });
    }

    // Suite Actions Section
    sections.push({
      title: '🚀 SUITE ACTIONS',
      emoji: '🚀',
      items: [
        {
          id: 'test-all',
          key: 'a',
          label: 'Test All Products',
          emoji: '🚀',
          description: 'Full suite validation across all products',
          type: 'test',
        },
        {
          id: 'test-websites',
          key: 'wa',
          label: 'Test All Websites',
          emoji: '🌐',
          description: 'Run tests on all website products',
          type: 'test',
        },
        {
          id: 'test-cli-all',
          key: 'ca',
          label: 'Test All CLI Tools',
          emoji: '⚙️',
          description: 'Run tests on all CLI products',
          type: 'test',
        },
        {
          id: 'test-packages-all',
          key: 'pa',
          label: 'Test All Packages',
          emoji: '📦',
          description: 'Run tests on all library packages',
          type: 'test',
        },
      ],
    });

    return sections;
  }

  /**
   * Display help screen with shortcuts and commands
   */
  displayHelp(): void {
    console.log();
    console.log(chalk.cyan.bold('╭──────────────────────────────────────────────────────────────╮'));
    console.log(chalk.cyan.bold('│              🛡️  GUARDIAN v5.0 - Help & Shortcuts          │'));
    console.log(chalk.cyan.bold('╰──────────────────────────────────────────────────────────────╯'));
    console.log();

    console.log(chalk.yellow.bold('📦 PRODUCT SHORTCUTS'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.white('  w1, w2, ...    ') + chalk.gray('→ Test individual website'));
    console.log(chalk.white('  c1, c2, ...    ') + chalk.gray('→ Test individual CLI tool'));
    console.log(chalk.white('  e1, e2, ...    ') + chalk.gray('→ Test individual extension'));
    console.log(chalk.white('  p1, p2, ...    ') + chalk.gray('→ Test individual package'));
    console.log();

    console.log(chalk.yellow.bold('🚀 QUICK ACTIONS'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.white('  a              ') + chalk.gray('→ Test All Products'));
    console.log(chalk.white('  wa             ') + chalk.gray('→ Test All Websites'));
    console.log(chalk.white('  ca             ') + chalk.gray('→ Test All CLI Tools'));
    console.log(chalk.white('  pa             ') + chalk.gray('→ Test All Packages'));
    console.log();

    console.log(chalk.yellow.bold('⚙️ UTILITIES'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.white('  h              ') + chalk.gray('→ Show this help screen'));
    console.log(chalk.white('  l              ') + chalk.gray('→ Language analysis'));
    console.log(chalk.white('  d              ') + chalk.gray('→ Open dashboard'));
    console.log(chalk.white('  s              ') + chalk.gray('→ Settings'));
    console.log();

    console.log(chalk.yellow.bold('🚪 NAVIGATION'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.white('  0, x, exit     ') + chalk.gray('→ Exit Guardian'));
    console.log();

    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.gray('Press Enter to return to menu...'));
    console.log();
  }

  /**
   * Generate menu for unknown project
   */
  generateUnknownProjectMenu(): MenuSection[] {
    const sections: MenuSection[] = [];

    sections.push({
      title: 'AVAILABLE TESTS',
      emoji: '🔍',
      items: [
        {
          id: 'static-analysis',
          key: '1',
          label: 'Static Analysis',
          emoji: '📊',
          description: 'Code quality checks',
          type: 'test',
        },
        {
          id: 'security-scan',
          key: '2',
          label: 'Security Scan',
          emoji: '🔒',
          description: 'Vulnerability scanning',
          type: 'test',
        },
        {
          id: 'language',
          key: '3',
          label: 'Language Analysis',
          emoji: '🗣️',
          description: 'Detect all languages',
          type: 'utility',
        },
        {
          id: 'website',
          key: 'w',
          label: 'Website Analysis (NEW!)',
          emoji: '🌐',
          description: 'Enterprise website scan',
          type: 'test',
        },
      ],
    });

    return sections;
  }

  /**
   * Render menu to console
   */
  renderMenu(
    sections: MenuSection[],
    header: {
      title: string;
      subtitle?: string;
      emoji?: string;
    }
  ): void {
    console.log();
    console.log(this.drawHeader(header));
    console.log();

    sections.forEach((section, index) => {
      console.log(chalk.cyan.bold(`${section.emoji} ${section.title}`));
      console.log(chalk.gray('━'.repeat(60)));

      section.items.forEach((item) => {
        const keyStr = chalk.white.bold(`[${item.key}]`);
        const labelStr = `${item.emoji} ${chalk.white(item.label)}`;
        const descStr = chalk.gray(item.description);

        console.log(`  ${keyStr} ${labelStr}`);
        console.log(`      ${descStr}`);
        console.log();
      });

      // Add spacing between sections
      if (index < sections.length - 1) {
        console.log();
      }
    });

    // Footer
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.gray(`  [${chalk.white.bold('0')}] 🚪 Exit`));
    console.log();
  }

  /**
   * Parse user input to menu item
   */
  parseInput(
    input: string,
    sections: MenuSection[]
  ): AdaptiveMenuItem | 'exit' | null {
    const normalized = input.trim().toLowerCase();

    // Exit commands
    if (normalized === '0' || normalized === 'x' || normalized === 'exit') {
      return 'exit';
    }

    // Search through all sections
    for (const section of sections) {
      for (const item of section.items) {
        if (item.key === normalized) {
          return item;
        }
      }
    }

    return null;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Group products by type for organized display
   */
  private groupProductsByType(products: SuiteProduct[]): {
    websites: SuiteProduct[];
    cli: SuiteProduct[];
    extensions: SuiteProduct[];
    packages: SuiteProduct[];
  } {
    return {
      websites: products.filter(p => p.type === 'website'),
      cli: products.filter(p => p.type === 'cli'),
      extensions: products.filter(p => p.type === 'extension'),
      packages: products.filter(p => p.type === 'package'),
    };
  }

  /**
   * Get emoji for project type
   */
  private getProjectTypeEmoji(type: ProjectType): string {
    const emojiMap: Record<ProjectType, string> = {
      website: '🌐',
      extension: '🧩',
      cli: '⚙️',
      package: '📦',
      monorepo: '🏢',
      unknown: '❓',
    };

    return emojiMap[type] || '📦';
  }

  /**
   * Get readable label for project type
   */
  private getProjectTypeLabel(type: ProjectType): string {
    const labelMap: Record<ProjectType, string> = {
      website: 'Website',
      extension: 'Extension',
      cli: 'CLI Tool',
      package: 'Package',
      monorepo: 'Monorepo',
      unknown: 'Project',
    };

    return labelMap[type] || 'Project';
  }

  /**
   * Categorize packages by their purpose
   */
  private categorizePackages(packages: SuiteProduct[]): {
    core: SuiteProduct[];
    integration: SuiteProduct[];
    utils: SuiteProduct[];
    ui: SuiteProduct[];
  } {
    const categories = {
      core: [] as SuiteProduct[],
      integration: [] as SuiteProduct[],
      utils: [] as SuiteProduct[],
      ui: [] as SuiteProduct[],
    };

    packages.forEach(pkg => {
      const name = pkg.name.toLowerCase();
      
      // Core packages
      if (name.includes('core') || name.includes('sdk') || name.includes('types')) {
        categories.core.push(pkg);
      }
      // Integration packages
      else if (name.includes('github') || name.includes('integration') || name.includes('api')) {
        categories.integration.push(pkg);
      }
      // UI packages
      else if (name.includes('marketplace') || name.includes('sales') || name.includes('auth')) {
        categories.ui.push(pkg);
      }
      // Utils packages
      else {
        categories.utils.push(pkg);
      }
    });

    return categories;
  }

  /**
   * Sort products by type (websites first, then CLI, then packages)
   */
  private sortProductsByType(products: SuiteProduct[]): SuiteProduct[] {
    const typeOrder: Record<string, number> = {
      website: 1,
      cli: 2,
      extension: 3,
      package: 4,
      monorepo: 5,
      unknown: 6,
    };

    return [...products].sort((a, b) => {
      const orderA = typeOrder[a.type] || 999;
      const orderB = typeOrder[b.type] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Same type, sort alphabetically
      return a.displayName.localeCompare(b.displayName);
    });
  }

  /**
   * Draw header box
   */
  private drawHeader(header: {
    title: string;
    subtitle?: string;
    emoji?: string;
  }): string {
    const lines: string[] = [];
    const width = 62;

    lines.push('╔' + '═'.repeat(width) + '╗');
    lines.push('║' + ' '.repeat(width) + '║');

    // Title
    const titleEmoji = header.emoji || '🛡️';
    const titleText = `${titleEmoji} ${header.title}`;
    const titlePadding = Math.max(0, width - this.stripAnsi(titleText).length);
    const titleLeftPad = Math.floor(titlePadding / 2);
    const titleRightPad = titlePadding - titleLeftPad;
    lines.push(
      '║' +
        ' '.repeat(titleLeftPad) +
        chalk.bold.white(titleText) +
        ' '.repeat(titleRightPad) +
        '║'
    );

    // Subtitle
    if (header.subtitle) {
      const subtitleText = header.subtitle;
      const subtitlePadding = Math.max(
        0,
        width - this.stripAnsi(subtitleText).length
      );
      const subtitleLeftPad = Math.floor(subtitlePadding / 2);
      const subtitleRightPad = subtitlePadding - subtitleLeftPad;
      lines.push(
        '║' +
          ' '.repeat(subtitleLeftPad) +
          chalk.cyan(subtitleText) +
          ' '.repeat(subtitleRightPad) +
          '║'
      );
    }

    lines.push('║' + ' '.repeat(width) + '║');
    lines.push('╚' + '═'.repeat(width) + '╝');

    return lines.join('\n');
  }

  /**
   * Strip ANSI escape codes for length calculation
   */
  private stripAnsi(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }
}

/**
 * Create menu generator instance
 */
export function createAdaptiveMenu(): AdaptiveMenuGenerator {
  return new AdaptiveMenuGenerator();
}
