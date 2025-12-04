/**
 * Guardian v5.0 - Project Type Auto-Detection Engine
 * 
 * Automatically detects project type (website, extension, CLI, package, monorepo)
 * without user configuration.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Project Types
 */
export enum ProjectType {
  WEBSITE = 'website',        // Next.js, Vite, CRA, Angular, etc.
  EXTENSION = 'extension',    // VS Code Extension
  CLI = 'cli',                // CLI Tool with bin
  PACKAGE = 'package',        // Library/SDK/npm package
  MONOREPO = 'monorepo',      // Multi-package workspace
  UNKNOWN = 'unknown'         // Could not determine
}

/**
 * Detection Result
 */
export interface DetectionResult {
  type: ProjectType;
  name: string;
  confidence: number;        // 0-100
  framework?: string;        // 'next.js', 'vite', 'angular', etc.
  detectionReasons: string[]; // Why we think it's this type
  path: string;              // Absolute path to project
  version?: string;          // From package.json
}

/**
 * Detection Strategy Interface
 */
interface DetectionStrategy {
  type: ProjectType;
  detect: (projectPath: string) => Promise<DetectionResult | null>;
}

/**
 * Main Project Detector
 */
export class ProjectDetector {
  private strategies: DetectionStrategy[] = [];

  constructor() {
    // Order matters: Check most specific types first
    this.strategies = [
      { type: ProjectType.MONOREPO, detect: this.detectMonorepo.bind(this) },
      { type: ProjectType.EXTENSION, detect: this.detectExtension.bind(this) },
      { type: ProjectType.CLI, detect: this.detectCLI.bind(this) },
      { type: ProjectType.WEBSITE, detect: this.detectWebsite.bind(this) },
      { type: ProjectType.PACKAGE, detect: this.detectPackage.bind(this) },
    ];
  }

  /**
   * Detect project type automatically
   */
  async detect(projectPath: string): Promise<DetectionResult> {
    // Try each strategy in order
    for (const strategy of this.strategies) {
      const result = await strategy.detect(projectPath);
      if (result && result.confidence >= 50) {
        return result;
      }
    }

    // Fallback: Unknown
    return {
      type: ProjectType.UNKNOWN,
      name: 'Unknown Project',
      confidence: 0,
      detectionReasons: ['Could not determine project type'],
      path: projectPath,
    };
  }

  /**
   * Read package.json safely
   */
  private readPackageJson(projectPath: string): any | null {
    try {
      const pkgPath = join(projectPath, 'package.json');
      if (!existsSync(pkgPath)) {
        return null;
      }
      const content = readFileSync(pkgPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Check if file exists
   */
  private fileExists(projectPath: string, filename: string): boolean {
    return existsSync(join(projectPath, filename));
  }

  /**
   * Detect Monorepo
   */
  private async detectMonorepo(projectPath: string): Promise<DetectionResult | null> {
    const reasons: string[] = [];
    let confidence = 0;
    let framework: string | undefined;

    // Check for workspace configuration files
    if (this.fileExists(projectPath, 'pnpm-workspace.yaml')) {
      reasons.push('Found pnpm-workspace.yaml');
      confidence += 40;
      framework = 'pnpm';
    }

    if (this.fileExists(projectPath, 'lerna.json')) {
      reasons.push('Found lerna.json');
      confidence += 30;
      framework = framework ? `${framework}+lerna` : 'lerna';
    }

    if (this.fileExists(projectPath, 'nx.json')) {
      reasons.push('Found nx.json');
      confidence += 30;
      framework = framework ? `${framework}+nx` : 'nx';
    }

    if (this.fileExists(projectPath, 'turbo.json')) {
      reasons.push('Found turbo.json');
      confidence += 25;
      framework = framework ? `${framework}+turbo` : 'turbo';
    }

    // Check for common monorepo directories
    if (this.fileExists(projectPath, 'packages')) {
      reasons.push('Found packages/ directory');
      confidence += 20;
    }

    if (this.fileExists(projectPath, 'apps')) {
      reasons.push('Found apps/ directory');
      confidence += 20;
    }

    // ODAVL-specific structure
    if (this.fileExists(projectPath, 'odavl-studio')) {
      reasons.push('Found odavl-studio/ directory');
      confidence += 20;
    }

    // Read package.json for workspaces field
    const pkg = this.readPackageJson(projectPath);
    if (pkg?.workspaces) {
      reasons.push('package.json has workspaces field');
      confidence += 30;
    }

    if (confidence < 50) {
      return null;
    }

    return {
      type: ProjectType.MONOREPO,
      name: pkg?.name || 'Monorepo Project',
      confidence: Math.min(confidence, 100),
      framework,
      detectionReasons: reasons,
      path: projectPath,
      version: pkg?.version,
    };
  }

  /**
   * Detect VS Code Extension
   */
  private async detectExtension(projectPath: string): Promise<DetectionResult | null> {
    const reasons: string[] = [];
    let confidence = 0;

    const pkg = this.readPackageJson(projectPath);
    if (!pkg) {
      return null;
    }

    // Check for VS Code engine requirement (strongest signal)
    if (pkg.engines?.vscode) {
      reasons.push(`VS Code engine: ${pkg.engines.vscode}`);
      confidence += 60;
    }

    // Check for extension entry point
    if (pkg.main && (pkg.main.includes('extension') || pkg.main.includes('src/extension'))) {
      reasons.push('Main entry point references extension');
      confidence += 20;
    }

    // Check for .vscodeignore
    if (this.fileExists(projectPath, '.vscodeignore')) {
      reasons.push('Found .vscodeignore file');
      confidence += 20;
    }

    // Check for extension.ts or extension.js
    if (this.fileExists(projectPath, 'src/extension.ts') || this.fileExists(projectPath, 'src/extension.js')) {
      reasons.push('Found extension entry file');
      confidence += 30;
    }

    // Check for VS Code dependencies
    const vscodeDeps = ['@types/vscode', 'vscode', '@vscode/test-electron'];
    const foundDeps = vscodeDeps.filter(dep => 
      pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]
    );
    if (foundDeps.length > 0) {
      reasons.push(`VS Code dependencies: ${foundDeps.join(', ')}`);
      confidence += 15 * foundDeps.length;
    }

    if (confidence < 50) {
      return null;
    }

    return {
      type: ProjectType.EXTENSION,
      name: pkg.displayName || pkg.name || 'VS Code Extension',
      confidence: Math.min(confidence, 100),
      framework: 'vscode',
      detectionReasons: reasons,
      path: projectPath,
      version: pkg.version,
    };
  }

  /**
   * Detect CLI Tool
   */
  private async detectCLI(projectPath: string): Promise<DetectionResult | null> {
    const reasons: string[] = [];
    let confidence = 0;

    const pkg = this.readPackageJson(projectPath);
    if (!pkg) {
      return null;
    }

    // Check for bin field (strongest signal)
    if (pkg.bin) {
      const binCommands = typeof pkg.bin === 'string' ? 1 : Object.keys(pkg.bin).length;
      reasons.push(`Has bin field with ${binCommands} command(s)`);
      confidence += 70;
    }

    // Check for CLI framework dependencies
    const cliFrameworks = ['commander', 'yargs', 'oclif', 'inquirer', 'prompts', 'chalk', 'ora'];
    const foundFrameworks = cliFrameworks.filter(fw => 
      pkg.dependencies?.[fw] || pkg.devDependencies?.[fw]
    );
    if (foundFrameworks.length > 0) {
      reasons.push(`CLI frameworks: ${foundFrameworks.join(', ')}`);
      confidence += 10 * foundFrameworks.length;
    }

    // Check for shebang in main file
    if (pkg.main) {
      try {
        const mainPath = join(projectPath, pkg.main);
        if (existsSync(mainPath)) {
          const content = readFileSync(mainPath, 'utf8');
          if (content.startsWith('#!/usr/bin/env node') || content.startsWith('#!/usr/bin/env tsx')) {
            reasons.push('Main file has shebang');
            confidence += 20;
          }
        }
      } catch {
        // Ignore read errors
      }
    }

    // Check for CLI-related keywords
    const cliKeywords = ['cli', 'command', 'terminal', 'console'];
    const hasCliKeywords = pkg.keywords?.some((kw: string) => 
      cliKeywords.some(cli => kw.toLowerCase().includes(cli))
    );
    if (hasCliKeywords) {
      reasons.push('Keywords indicate CLI tool');
      confidence += 15;
    }

    if (confidence < 50) {
      return null;
    }

    return {
      type: ProjectType.CLI,
      name: pkg.name || 'CLI Tool',
      confidence: Math.min(confidence, 100),
      framework: foundFrameworks[0], // Primary CLI framework
      detectionReasons: reasons,
      path: projectPath,
      version: pkg.version,
    };
  }

  /**
   * Detect Website/Web App
   */
  private async detectWebsite(projectPath: string): Promise<DetectionResult | null> {
    const reasons: string[] = [];
    let confidence = 0;
    let framework: string | undefined;

    // Check for Next.js
    if (this.fileExists(projectPath, 'next.config.js') || this.fileExists(projectPath, 'next.config.mjs')) {
      reasons.push('Found next.config.js');
      confidence += 80;
      framework = 'next.js';
    }

    // Check for Vite
    if (this.fileExists(projectPath, 'vite.config.ts') || this.fileExists(projectPath, 'vite.config.js')) {
      reasons.push('Found vite.config');
      confidence += 75;
      framework = 'vite';
    }

    // Check for Angular
    if (this.fileExists(projectPath, 'angular.json')) {
      reasons.push('Found angular.json');
      confidence += 80;
      framework = 'angular';
    }

    // Check for Nuxt
    if (this.fileExists(projectPath, 'nuxt.config.ts') || this.fileExists(projectPath, 'nuxt.config.js')) {
      reasons.push('Found nuxt.config');
      confidence += 80;
      framework = 'nuxt';
    }

    // Check for Create React App
    if (this.fileExists(projectPath, 'public/index.html') && 
        (this.fileExists(projectPath, 'src/App.tsx') || this.fileExists(projectPath, 'src/App.jsx'))) {
      reasons.push('Found CRA structure (public/index.html + src/App)');
      confidence += 70;
      framework = 'create-react-app';
    }

    // Check for Vue CLI
    if (this.fileExists(projectPath, 'vue.config.js')) {
      reasons.push('Found vue.config.js');
      confidence += 75;
      framework = 'vue-cli';
    }

    // Check package.json for web dependencies
    const pkg = this.readPackageJson(projectPath);
    if (pkg) {
      const webDeps = ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt'];
      const foundWebDeps = webDeps.filter(dep => 
        pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]
      );
      if (foundWebDeps.length > 0 && confidence === 0) {
        reasons.push(`Web framework: ${foundWebDeps.join(', ')}`);
        confidence += 40;
        framework = framework || foundWebDeps[0];
      }

      // Check for dev server script
      if (pkg.scripts?.dev || pkg.scripts?.start || pkg.scripts?.serve) {
        reasons.push('Has dev server script');
        confidence += 15;
      }
    }

    if (confidence < 50) {
      return null;
    }

    return {
      type: ProjectType.WEBSITE,
      name: pkg?.name || 'Website',
      confidence: Math.min(confidence, 100),
      framework,
      detectionReasons: reasons,
      path: projectPath,
      version: pkg?.version,
    };
  }

  /**
   * Detect Package/Library/SDK
   */
  private async detectPackage(projectPath: string): Promise<DetectionResult | null> {
    const reasons: string[] = [];
    let confidence = 0;

    const pkg = this.readPackageJson(projectPath);
    if (!pkg) {
      return null;
    }

    // Has exports or main field (common for packages)
    if (pkg.exports || pkg.main) {
      reasons.push('Has exports or main field');
      confidence += 40;
    }

    // Has TypeScript declarations
    if (pkg.types || pkg.typings) {
      reasons.push('Has TypeScript declarations');
      confidence += 30;
    }

    // Check for .d.ts files
    if (this.fileExists(projectPath, 'dist/index.d.ts') || 
        this.fileExists(projectPath, 'lib/index.d.ts') ||
        this.fileExists(projectPath, 'types/index.d.ts')) {
      reasons.push('Found .d.ts declaration files');
      confidence += 25;
    }

    // Not a bin (would be CLI)
    if (!pkg.bin) {
      reasons.push('Not a CLI tool (no bin field)');
      confidence += 10;
    }

    // Check for build scripts
    if (pkg.scripts?.build || pkg.scripts?.compile) {
      reasons.push('Has build scripts');
      confidence += 15;
    }

    // Check for package keywords
    const pkgKeywords = ['library', 'sdk', 'package', 'utility', 'utils', 'helper'];
    const hasPackageKeywords = pkg.keywords?.some((kw: string) => 
      pkgKeywords.some(pk => kw.toLowerCase().includes(pk))
    );
    if (hasPackageKeywords) {
      reasons.push('Keywords indicate library/package');
      confidence += 20;
    }

    // Default fallback: If it has package.json and nothing else matched, probably a package
    if (confidence < 30) {
      confidence = 30;
      reasons.push('Default: Has package.json but no specific markers');
    }

    return {
      type: ProjectType.PACKAGE,
      name: pkg.name || 'Package',
      confidence: Math.min(confidence, 100),
      detectionReasons: reasons,
      path: projectPath,
      version: pkg.version,
    };
  }
}

/**
 * Convenience function: Detect project type
 */
export async function detectProject(projectPath: string): Promise<DetectionResult> {
  const detector = new ProjectDetector();
  return detector.detect(projectPath);
}
