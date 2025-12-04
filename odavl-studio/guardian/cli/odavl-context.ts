/**
 * ODAVL Suite Context System
 * Provides deep understanding of ODAVL Studio architecture
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';

// ============================================================================
// ODAVL Suite Knowledge Base
// ============================================================================

export interface ODAVLProduct {
  name: 'Insight' | 'Autopilot' | 'Guardian';
  purpose: string;
  type: 'extension' | 'cloud' | 'cli' | 'engine' | 'core';
  path: string;
  mainFeatures: string[];
  dependencies: string[];
  affectedBy: string[];
  affects: string[];
}

export interface ODAVLSuiteContext {
  isODAVLProject: boolean;
  projectType: 'monorepo' | 'product' | 'app' | 'package' | 'external';
  products: ODAVLProduct[];
  sharedPackages: string[];
  architecture: {
    packageManager: 'pnpm' | 'npm' | 'yarn' | 'unknown';
    workspaces: string[];
    buildTool: string;
  };
  relationships: {
    from: string;
    to: string;
    type: 'depends' | 'uses' | 'extends' | 'imports';
  }[];
}

// ODAVL Suite Knowledge Base
const ODAVL_PRODUCTS_KNOWLEDGE = {
  insight: {
    name: 'Insight' as const,
    purpose: 'ML-Powered Error Detection & Analysis',
    mainFeatures: [
      '12 specialized detectors (TypeScript, ESLint, Import, Package, Runtime, Build, Security, Circular, Network, Performance, Complexity, Isolation)',
      'ML trust prediction with TensorFlow.js',
      'Problems Panel integration',
      'Claude AI error analysis',
      'Multi-language support (TypeScript, Python, Java)',
    ],
    packages: [
      '@odavl-studio/insight-core',
      '@odavl-studio/insight-cloud',
      '@odavl-studio/insight-extension',
    ],
    detectorTypes: [
      'typescript',
      'eslint',
      'import',
      'package',
      'runtime',
      'build',
      'security',
      'circular',
      'network',
      'performance',
      'complexity',
      'isolation',
    ],
    mlFeatures: [
      'Trust score prediction',
      'Error pattern recognition',
      'Fix suggestion ranking',
    ],
  },
  autopilot: {
    name: 'Autopilot' as const,
    purpose: 'Self-Healing Code Infrastructure (O-D-A-V-L Cycle)',
    mainFeatures: [
      'O-D-A-V-L cycle (Observe, Decide, Act, Verify, Learn)',
      'Automated code fixes with undo snapshots',
      'Risk budget enforcement (max 10 files, 40 LOC)',
      'Recipe trust system (0.1-1.0 scoring)',
      'Attestation chain (SHA-256 proofs)',
    ],
    packages: [
      '@odavl-studio/autopilot-engine',
      '@odavl-studio/autopilot-recipes',
      '@odavl-studio/autopilot-extension',
    ],
    phases: ['observe', 'decide', 'act', 'verify', 'learn'],
    safetyMechanisms: [
      'Risk Budget Guard',
      'Undo Snapshots',
      'Attestation Chain',
      'Protected Paths',
    ],
  },
  guardian: {
    name: 'Guardian' as const,
    purpose: 'Pre-Deploy Testing & Quality Gates',
    mainFeatures: [
      'Real runtime testing with Playwright',
      'Multi-device screenshots (Desktop, Tablet, Mobile)',
      'Visual regression testing',
      'AI error analysis with Claude',
      'Extension Host testing',
      'Live dashboard with real-time data',
    ],
    packages: [
      '@odavl-studio/guardian-app',
      '@odavl-studio/guardian-workers',
      '@odavl-studio/guardian-core',
      '@odavl-studio/guardian-cli',
      '@odavl-studio/guardian-extension',
    ],
    testingTypes: [
      'runtime',
      'visual',
      'accessibility',
      'performance',
      'security',
    ],
  },
};

// ============================================================================
// ODAVL Context Detector
// ============================================================================

export class ODAVLContextDetector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect complete ODAVL Suite context
   */
  async detectContext(): Promise<ODAVLSuiteContext> {
    const isODAVL = await this.isODAVLProject();
    const projectType = await this.detectProjectType();
    const products = await this.detectProducts();
    const sharedPackages = await this.detectSharedPackages();
    const architecture = await this.detectArchitecture();
    const relationships = await this.detectRelationships(products);

    return {
      isODAVLProject: isODAVL,
      projectType,
      products,
      sharedPackages,
      architecture,
      relationships,
    };
  }

  /**
   * Check if this is an ODAVL Studio project
   */
  private async isODAVLProject(): Promise<boolean> {
    // Check for ODAVL-specific markers
    const markers = [
      'odavl-studio',
      'pnpm-workspace.yaml',
      '.github/copilot-instructions.md',
      'ODAVL_STUDIO_V2_GUIDE.md',
    ];

    for (const marker of markers) {
      if (existsSync(join(this.projectRoot, marker))) {
        return true;
      }
    }

    // Check package.json for ODAVL packages
    try {
      const pkgPath = join(this.projectRoot, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
        };

        return Object.keys(allDeps).some((dep) =>
          dep.startsWith('@odavl-studio/')
        );
      }
    } catch {
      // Ignore
    }

    return false;
  }

  /**
   * Detect project type in ODAVL context
   */
  private async detectProjectType(): Promise<ODAVLSuiteContext['projectType']> {
    // Check if it's the monorepo root
    if (existsSync(join(this.projectRoot, 'pnpm-workspace.yaml'))) {
      return 'monorepo';
    }

    // Check if it's inside odavl-studio/
    const pathParts = this.projectRoot.split(/[/\\]/);
    if (pathParts.includes('odavl-studio')) {
      return 'product';
    }

    // Check if it's in apps/
    if (pathParts.includes('apps')) {
      return 'app';
    }

    // Check if it's in packages/
    if (pathParts.includes('packages')) {
      return 'package';
    }

    return 'external';
  }

  /**
   * Detect ODAVL products in project
   */
  private async detectProducts(): Promise<ODAVLProduct[]> {
    const products: ODAVLProduct[] = [];

    // Try to find odavl-studio directory
    const studioPath = this.findODAVLStudioPath();
    if (!studioPath) return products;

    // Check for each product
    for (const [productKey, knowledge] of Object.entries(
      ODAVL_PRODUCTS_KNOWLEDGE
    )) {
      const productPath = join(studioPath, productKey);
      if (!existsSync(productPath)) continue;

      // Detect product components
      const components = await this.detectProductComponents(
        productPath,
        productKey as 'insight' | 'autopilot' | 'guardian'
      );

      products.push(...components);
    }

    return products;
  }

  /**
   * Detect components of a product (core, cloud, extension, etc.)
   */
  private async detectProductComponents(
    productPath: string,
    productKey: 'insight' | 'autopilot' | 'guardian'
  ): Promise<ODAVLProduct[]> {
    const components: ODAVLProduct[] = [];
    const knowledge = ODAVL_PRODUCTS_KNOWLEDGE[productKey];

    try {
      const entries = await readdir(productPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const componentPath = join(productPath, entry.name);
        const type = this.detectComponentType(entry.name);

        // Read package.json to get dependencies
        const pkgPath = join(componentPath, 'package.json');
        let dependencies: string[] = [];
        let affectedBy: string[] = [];
        let affects: string[] = [];

        if (existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
            dependencies = Object.keys({
              ...pkg.dependencies,
              ...pkg.devDependencies,
            });

            // Determine relationships based on product type
            if (productKey === 'insight') {
              affectedBy = ['@odavl-studio/core', '@odavl-studio/types'];
              affects = [
                '@odavl-studio/autopilot-engine',
                '@odavl-studio/guardian-cli',
              ];
            } else if (productKey === 'autopilot') {
              affectedBy = [
                '@odavl-studio/insight-core',
                '@odavl-studio/core',
              ];
              affects = ['@odavl-studio/guardian-cli'];
            } else if (productKey === 'guardian') {
              affectedBy = [
                '@odavl-studio/insight-core',
                '@odavl-studio/autopilot-engine',
              ];
              affects = [];
            }
          } catch {
            // Ignore
          }
        }

        components.push({
          name: knowledge.name,
          purpose: knowledge.purpose,
          type,
          path: componentPath,
          mainFeatures: knowledge.mainFeatures,
          dependencies,
          affectedBy,
          affects,
        });
      }
    } catch {
      // Ignore
    }

    return components;
  }

  /**
   * Detect component type from directory name
   */
  private detectComponentType(
    dirName: string
  ): ODAVLProduct['type'] {
    if (dirName === 'core') return 'core';
    if (dirName === 'cloud' || dirName === 'app') return 'cloud';
    if (dirName === 'cli') return 'cli';
    if (dirName === 'engine' || dirName === 'workers') return 'engine';
    if (dirName === 'extension') return 'extension';
    return 'core';
  }

  /**
   * Detect shared packages
   */
  private async detectSharedPackages(): Promise<string[]> {
    const packages: string[] = [];
    const packagesPath = join(this.projectRoot, 'packages');

    if (!existsSync(packagesPath)) return packages;

    try {
      const entries = await readdir(packagesPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          packages.push(`@odavl-studio/${entry.name}`);
        }
      }
    } catch {
      // Ignore
    }

    return packages;
  }

  /**
   * Detect architecture details
   */
  private async detectArchitecture(): Promise<
    ODAVLSuiteContext['architecture']
  > {
    let packageManager: 'pnpm' | 'npm' | 'yarn' | 'unknown' = 'unknown';
    let workspaces: string[] = [];
    let buildTool = 'tsup';

    // Detect package manager
    if (existsSync(join(this.projectRoot, 'pnpm-lock.yaml'))) {
      packageManager = 'pnpm';
    } else if (existsSync(join(this.projectRoot, 'package-lock.json'))) {
      packageManager = 'npm';
    } else if (existsSync(join(this.projectRoot, 'yarn.lock'))) {
      packageManager = 'yarn';
    }

    // Read workspaces from pnpm-workspace.yaml
    if (packageManager === 'pnpm') {
      try {
        const workspaceFile = await readFile(
          join(this.projectRoot, 'pnpm-workspace.yaml'),
          'utf-8'
        );
        // Simple YAML parsing for packages array
        const packagesMatch = workspaceFile.match(/packages:\s*([\s\S]*)/);
        if (packagesMatch) {
          workspaces = packagesMatch[1]
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('-'))
            .map((line) => line.substring(1).trim().replace(/['"]/g, ''));
        }
      } catch {
        // Ignore
      }
    }

    return {
      packageManager,
      workspaces,
      buildTool,
    };
  }

  /**
   * Detect relationships between products
   */
  private async detectRelationships(
    products: ODAVLProduct[]
  ): Promise<ODAVLSuiteContext['relationships']> {
    const relationships: ODAVLSuiteContext['relationships'] = [];

    for (const product of products) {
      // Dependencies
      for (const dep of product.dependencies) {
        if (dep.startsWith('@odavl-studio/')) {
          relationships.push({
            from: basename(product.path),
            to: dep,
            type: 'depends',
          });
        }
      }

      // Affects
      for (const affected of product.affects) {
        relationships.push({
          from: basename(product.path),
          to: affected,
          type: 'affects',
        });
      }

      // Affected by
      for (const affectedBy of product.affectedBy) {
        relationships.push({
          from: affectedBy,
          to: basename(product.path),
          type: 'affects',
        });
      }
    }

    return relationships;
  }

  /**
   * Find ODAVL Studio path from current location
   */
  private findODAVLStudioPath(): string | null {
    // Try from current path
    let currentPath = this.projectRoot;
    const maxDepth = 5;

    for (let i = 0; i < maxDepth; i++) {
      const studioPath = join(currentPath, 'odavl-studio');
      if (existsSync(studioPath)) {
        return studioPath;
      }

      const parentPath = join(currentPath, '..');
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    return null;
  }

  /**
   * Get product-specific insights
   */
  getProductInsights(productName: string): typeof ODAVL_PRODUCTS_KNOWLEDGE[keyof typeof ODAVL_PRODUCTS_KNOWLEDGE] | null {
    const key = productName.toLowerCase() as keyof typeof ODAVL_PRODUCTS_KNOWLEDGE;
    return ODAVL_PRODUCTS_KNOWLEDGE[key] || null;
  }

  /**
   * Check if a change in one product affects another
   */
  async analyzeImpact(
    changedProduct: string,
    context: ODAVLSuiteContext
  ): Promise<{ affected: string[]; reason: string }[]> {
    const impacts: { affected: string[]; reason: string }[] = [];

    // Find the changed product
    const product = context.products.find((p) =>
      p.path.includes(changedProduct)
    );
    if (!product) return impacts;

    // Check direct impacts
    if (product.affects.length > 0) {
      impacts.push({
        affected: product.affects,
        reason: `Changes in ${product.name} directly affect these packages`,
      });
    }

    // Check shared package impacts
    const sharedDeps = product.dependencies.filter((dep) =>
      context.sharedPackages.includes(dep)
    );
    if (sharedDeps.length > 0) {
      const affectedProducts = context.products.filter((p) =>
        p.dependencies.some((dep) => sharedDeps.includes(dep))
      );
      if (affectedProducts.length > 0) {
        impacts.push({
          affected: affectedProducts.map((p) => p.name),
          reason: `Changes affect shared packages: ${sharedDeps.join(', ')}`,
        });
      }
    }

    return impacts;
  }
}

/**
 * Get ODAVL Suite context for current project
 */
export async function getODAVLContext(
  projectPath: string
): Promise<ODAVLSuiteContext> {
  const detector = new ODAVLContextDetector(projectPath);
  return await detector.detectContext();
}

/**
 * Display ODAVL context in readable format
 */
export function displayODAVLContext(context: ODAVLSuiteContext): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('🏢 ODAVL Suite Context');
  lines.push('═'.repeat(60));

  // Project Type
  lines.push(`\n📦 Project Type: ${context.projectType}`);
  lines.push(`   ODAVL Project: ${context.isODAVLProject ? '✅' : '❌'}`);

  // Products
  if (context.products.length > 0) {
    lines.push(`\n🎯 Products Detected (${context.products.length}):`);
    const uniqueProducts = new Set(context.products.map((p) => p.name));
    uniqueProducts.forEach((name) => {
      const productKnowledge = ODAVL_PRODUCTS_KNOWLEDGE[name.toLowerCase() as keyof typeof ODAVL_PRODUCTS_KNOWLEDGE];
      lines.push(`\n   ${name}:`);
      lines.push(`   Purpose: ${productKnowledge.purpose}`);
      lines.push(`   Features: ${productKnowledge.mainFeatures.length}`);

      const productComponents = context.products.filter((p) => p.name === name);
      lines.push(`   Components: ${productComponents.map((p) => p.type).join(', ')}`);
    });
  }

  // Shared Packages
  if (context.sharedPackages.length > 0) {
    lines.push(`\n📚 Shared Packages (${context.sharedPackages.length}):`);
    context.sharedPackages.forEach((pkg) => {
      lines.push(`   - ${pkg}`);
    });
  }

  // Architecture
  lines.push(`\n🏗️  Architecture:`);
  lines.push(`   Package Manager: ${context.architecture.packageManager}`);
  lines.push(`   Workspaces: ${context.architecture.workspaces.length}`);
  lines.push(`   Build Tool: ${context.architecture.buildTool}`);

  // Relationships
  if (context.relationships.length > 0) {
    lines.push(`\n🔗 Product Relationships (${context.relationships.length}):`);
    const grouped = context.relationships.reduce((acc, rel) => {
      if (!acc[rel.type]) acc[rel.type] = [];
      acc[rel.type].push(`${rel.from} → ${rel.to}`);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(grouped).forEach(([type, rels]) => {
      lines.push(`   ${type}: ${rels.length}`);
    });
  }

  lines.push('\n' + '═'.repeat(60));

  return lines.join('\n');
}
