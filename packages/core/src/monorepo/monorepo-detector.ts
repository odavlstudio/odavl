/**
 * Monorepo Detector
 * 
 * Detects and analyzes monorepo structures.
 * Supports: Nx, Turborepo, Lerna, pnpm workspaces, Yarn workspaces.
 * 
 * @since Phase 1 Week 21 (December 2025)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export type MonorepoType = 'nx' | 'turborepo' | 'lerna' | 'pnpm' | 'yarn' | 'npm' | 'none';

export interface MonorepoInfo {
  type: MonorepoType;
  root: string;
  packages: PackageInfo[];
  workspaces: string[]; // Workspace globs
  config: MonorepoConfig;
}

export interface PackageInfo {
  name: string;
  path: string; // Relative to monorepo root
  dependencies: string[]; // Internal dependencies
  devDependencies: string[];
  scripts: Record<string, string>;
  version: string;
}

export interface MonorepoConfig {
  nx?: NxConfig;
  turborepo?: TurborepoConfig;
  lerna?: LernaConfig;
  pnpm?: PnpmConfig;
  yarn?: YarnConfig;
}

export interface NxConfig {
  affected: boolean;
  cacheDirectory: string;
  targetDefaults?: Record<string, any>;
}

export interface TurborepoConfig {
  pipeline: Record<string, any>;
  globalDependencies?: string[];
}

export interface LernaConfig {
  version: string;
  packages: string[];
  npmClient: string;
}

export interface PnpmConfig {
  workspaces: string[];
}

export interface YarnConfig {
  workspaces: string[];
}

/**
 * Monorepo detector
 */
export class MonorepoDetector {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Detect monorepo type and configuration
   */
  async detect(): Promise<MonorepoInfo> {
    const type = await this.detectType();

    if (type === 'none') {
      return {
        type: 'none',
        root: this.workspaceRoot,
        packages: [],
        workspaces: [],
        config: {},
      };
    }

    const workspaces = await this.getWorkspaces(type);
    const packages = await this.discoverPackages(workspaces);
    const config = await this.loadConfig(type);

    return {
      type,
      root: this.workspaceRoot,
      packages,
      workspaces,
      config,
    };
  }

  /**
   * Detect monorepo type
   */
  private async detectType(): Promise<MonorepoType> {
    // Check for Nx
    if (await this.fileExists('nx.json')) {
      return 'nx';
    }

    // Check for Turborepo
    if (await this.fileExists('turbo.json')) {
      return 'turborepo';
    }

    // Check for Lerna
    if (await this.fileExists('lerna.json')) {
      return 'lerna';
    }

    // Check for pnpm workspaces
    if (await this.fileExists('pnpm-workspace.yaml')) {
      return 'pnpm';
    }

    // Check for Yarn/npm workspaces
    const packageJson = await this.readPackageJson(this.workspaceRoot);
    if (packageJson?.workspaces) {
      // Detect if Yarn or npm
      if (await this.fileExists('yarn.lock')) {
        return 'yarn';
      }
      return 'npm';
    }

    return 'none';
  }

  /**
   * Get workspace patterns
   */
  private async getWorkspaces(type: MonorepoType): Promise<string[]> {
    switch (type) {
      case 'nx':
        return this.getNxWorkspaces();
      case 'turborepo':
        return this.getTurborepoWorkspaces();
      case 'lerna':
        return this.getLernaWorkspaces();
      case 'pnpm':
        return this.getPnpmWorkspaces();
      case 'yarn':
      case 'npm':
        return this.getYarnNpmWorkspaces();
      default:
        return [];
    }
  }

  /**
   * Get Nx workspaces
   */
  private async getNxWorkspaces(): Promise<string[]> {
    const nxJson = await this.readJson('nx.json');
    if (!nxJson) return [];

    // Nx uses project.json files in each package
    const workspaceJson = await this.readJson('workspace.json');
    if (workspaceJson?.projects) {
      return Object.values(workspaceJson.projects) as string[];
    }

    // Fallback: scan for project.json files
    return ['apps/*', 'libs/*', 'packages/*'];
  }

  /**
   * Get Turborepo workspaces
   */
  private async getTurborepoWorkspaces(): Promise<string[]> {
    const packageJson = await this.readPackageJson(this.workspaceRoot);
    return packageJson?.workspaces || ['apps/*', 'packages/*'];
  }

  /**
   * Get Lerna workspaces
   */
  private async getLernaWorkspaces(): Promise<string[]> {
    const lernaJson = await this.readJson('lerna.json');
    return lernaJson?.packages || ['packages/*'];
  }

  /**
   * Get pnpm workspaces
   */
  private async getPnpmWorkspaces(): Promise<string[]> {
    try {
      const content = await fs.readFile(
        path.join(this.workspaceRoot, 'pnpm-workspace.yaml'),
        'utf-8'
      );

      // Simple YAML parser for workspaces
      const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n)+)/);
      if (match) {
        return match[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.substring(1).trim());
      }
    } catch {
      // Fallback
    }

    return ['packages/*'];
  }

  /**
   * Get Yarn/npm workspaces
   */
  private async getYarnNpmWorkspaces(): Promise<string[]> {
    const packageJson = await this.readPackageJson(this.workspaceRoot);
    const workspaces = packageJson?.workspaces;

    if (Array.isArray(workspaces)) {
      return workspaces;
    }

    if (workspaces?.packages) {
      return workspaces.packages;
    }

    return [];
  }

  /**
   * Discover packages from workspace patterns
   */
  private async discoverPackages(workspaces: string[]): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];

    for (const pattern of workspaces) {
      const dirs = await this.expandGlob(pattern);

      for (const dir of dirs) {
        const packageInfo = await this.getPackageInfo(dir);
        if (packageInfo) {
          packages.push(packageInfo);
        }
      }
    }

    return packages;
  }

  /**
   * Get package information
   */
  private async getPackageInfo(dir: string): Promise<PackageInfo | null> {
    const fullPath = path.join(this.workspaceRoot, dir);
    const packageJson = await this.readPackageJson(fullPath);

    if (!packageJson) return null;

    return {
      name: packageJson.name || path.basename(dir),
      path: dir,
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
      scripts: packageJson.scripts || {},
      version: packageJson.version || '0.0.0',
    };
  }

  /**
   * Load monorepo configuration
   */
  private async loadConfig(type: MonorepoType): Promise<MonorepoConfig> {
    const config: MonorepoConfig = {};

    switch (type) {
      case 'nx':
        config.nx = await this.loadNxConfig();
        break;
      case 'turborepo':
        config.turborepo = await this.loadTurborepoConfig();
        break;
      case 'lerna':
        config.lerna = await this.loadLernaConfig();
        break;
      case 'pnpm':
        config.pnpm = { workspaces: await this.getPnpmWorkspaces() };
        break;
      case 'yarn':
        config.yarn = { workspaces: await this.getYarnNpmWorkspaces() };
        break;
    }

    return config;
  }

  /**
   * Load Nx config
   */
  private async loadNxConfig(): Promise<NxConfig | undefined> {
    const nxJson = await this.readJson('nx.json');
    if (!nxJson) return undefined;

    return {
      affected: nxJson.affected !== false,
      cacheDirectory: nxJson.cacheDirectory || 'node_modules/.cache/nx',
      targetDefaults: nxJson.targetDefaults,
    };
  }

  /**
   * Load Turborepo config
   */
  private async loadTurborepoConfig(): Promise<TurborepoConfig | undefined> {
    const turboJson = await this.readJson('turbo.json');
    if (!turboJson) return undefined;

    return {
      pipeline: turboJson.pipeline || {},
      globalDependencies: turboJson.globalDependencies,
    };
  }

  /**
   * Load Lerna config
   */
  private async loadLernaConfig(): Promise<LernaConfig | undefined> {
    const lernaJson = await this.readJson('lerna.json');
    if (!lernaJson) return undefined;

    return {
      version: lernaJson.version || 'independent',
      packages: lernaJson.packages || ['packages/*'],
      npmClient: lernaJson.npmClient || 'npm',
    };
  }

  /**
   * Expand glob pattern to directories
   */
  private async expandGlob(pattern: string): Promise<string[]> {
    // Simple glob expansion (supports * only)
    if (!pattern.includes('*')) {
      return [pattern];
    }

    const parts = pattern.split('/');
    let current = ['.'];

    for (const part of parts) {
      if (part === '*') {
        const expanded: string[] = [];
        for (const dir of current) {
          const fullPath = path.join(this.workspaceRoot, dir);
          try {
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                expanded.push(path.join(dir, entry.name));
              }
            }
          } catch {
            // Skip inaccessible directories
          }
        }
        current = expanded;
      } else {
        current = current.map(dir => path.join(dir, part));
      }
    }

    return current;
  }

  /**
   * Read package.json
   */
  private async readPackageJson(dir: string): Promise<any | null> {
    try {
      const content = await fs.readFile(path.join(dir, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Read JSON file
   */
  private async readJson(filename: string): Promise<any | null> {
    try {
      const content = await fs.readFile(path.join(this.workspaceRoot, filename), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.workspaceRoot, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get affected packages (Nx/Turborepo)
   */
  async getAffectedPackages(changedFiles: string[]): Promise<string[]> {
    const info = await this.detect();

    if (info.type === 'none') {
      return [];
    }

    const affected = new Set<string>();

    for (const file of changedFiles) {
      for (const pkg of info.packages) {
        if (file.startsWith(pkg.path)) {
          affected.add(pkg.name);

          // Add dependents
          const dependents = this.findDependents(pkg.name, info.packages);
          dependents.forEach(dep => affected.add(dep));
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * Find packages that depend on target package
   */
  private findDependents(target: string, packages: PackageInfo[]): string[] {
    return packages
      .filter(pkg =>
        pkg.dependencies.includes(target) ||
        pkg.devDependencies.includes(target)
      )
      .map(pkg => pkg.name);
  }
}

/**
 * Helper: Create monorepo detector
 */
export function createMonorepoDetector(workspaceRoot: string): MonorepoDetector {
  return new MonorepoDetector(workspaceRoot);
}

/**
 * Helper: Detect monorepo
 */
export async function detectMonorepo(workspaceRoot: string): Promise<MonorepoInfo> {
  const detector = createMonorepoDetector(workspaceRoot);
  return detector.detect();
}

export default MonorepoDetector;
