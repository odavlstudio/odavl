/**
 * Guardian v5.0 - Package Scanner for Monorepos
 * 
 * Reads workspace structure and discovers all packages/apps
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { ProjectType, detectProject, DetectionResult } from './project-detector.js';

/**
 * Package Information
 */
export interface Package {
  name: string;           // From package.json "name"
  displayName?: string;   // From package.json "displayName" (for extensions)
  path: string;           // Absolute path
  relativePath: string;   // Relative to workspace root
  type: ProjectType;      // Auto-detected type
  version: string;
  private: boolean;       // From package.json "private"
  framework?: string;     // Next.js, Vite, etc.
  confidence: number;     // Detection confidence (0-100)
}

/**
 * Workspace Structure
 */
export interface WorkspaceStructure {
  rootPackage: Package | null;
  subPackages: Package[];
  totalPackages: number;
  workspaceType: 'monorepo' | 'single';
  rootPath: string;
}

/**
 * Package Scanner
 */
export class PackageScanner {
  /**
   * Scan entire workspace
   */
  async scan(workspacePath: string): Promise<WorkspaceStructure> {
    // First, detect if this is a monorepo
    const rootDetection = await detectProject(workspacePath);
    
    if (rootDetection.type !== ProjectType.MONOREPO) {
      // Single package project
      const rootPkg = await this.scanPackage(workspacePath, workspacePath);
      return {
        rootPackage: rootPkg,
        subPackages: [],
        totalPackages: 1,
        workspaceType: 'single',
        rootPath: workspacePath,
      };
    }

    // Monorepo: scan all sub-packages
    const subPackages = await this.scanMonorepo(workspacePath);
    
    return {
      rootPackage: null, // Monorepo root usually isn't a package itself
      subPackages,
      totalPackages: subPackages.length,
      workspaceType: 'monorepo',
      rootPath: workspacePath,
    };
  }

  /**
   * Scan monorepo for all packages
   */
  private async scanMonorepo(rootPath: string): Promise<Package[]> {
    const packagesMap = new Map<string, Package>(); // Deduplicate by package name
    
    // Strategy 1: Read workspace configuration
    const workspacePackages = this.readWorkspaceConfig(rootPath);
    
    if (workspacePackages.length > 0) {
      // Scan each workspace package
      for (const pkgPattern of workspacePackages) {
        const pkgs = await this.scanPattern(rootPath, pkgPattern);
        pkgs.forEach(pkg => {
          if (!packagesMap.has(pkg.name)) {
            packagesMap.set(pkg.name, pkg);
          }
        });
      }
    } else {
      // Strategy 2: Scan common directories
      const commonDirs = ['packages', 'apps', 'odavl-studio'];
      for (const dir of commonDirs) {
        const pkgs = await this.scanDirectory(rootPath, dir);
        pkgs.forEach(pkg => {
          if (!packagesMap.has(pkg.name)) {
            packagesMap.set(pkg.name, pkg);
          }
        });
      }
    }

    return Array.from(packagesMap.values());
  }

  /**
   * Read workspace configuration (pnpm-workspace.yaml, package.json workspaces, etc.)
   */
  private readWorkspaceConfig(rootPath: string): string[] {
    // Try pnpm-workspace.yaml
    const pnpmWorkspace = join(rootPath, 'pnpm-workspace.yaml');
    if (existsSync(pnpmWorkspace)) {
      try {
        const content = readFileSync(pnpmWorkspace, 'utf8');
        // Simple YAML parsing for packages array
        const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
        if (match) {
          return match[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^\s*-\s*['"]?(.+?)['"]?\s*$/, '$1'));
        }
      } catch {
        // Fallback to common directories
      }
    }

    // Try package.json workspaces
    const pkgPath = join(rootPath, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (pkg.workspaces) {
          return Array.isArray(pkg.workspaces) 
            ? pkg.workspaces 
            : pkg.workspaces.packages || [];
        }
      } catch {
        // Fallback
      }
    }

    return [];
  }

  /**
   * Scan a glob pattern (e.g., "packages/*", "apps/*")
   */
  private async scanPattern(rootPath: string, pattern: string): Promise<Package[]> {
    const packages: Package[] = [];
    
    // Simple glob: "packages/*" or "apps/**"
    const parts = pattern.split('/');
    if (parts.length === 0) return packages;

    const baseDir = parts[0];
    const basePath = join(rootPath, baseDir);
    
    if (!existsSync(basePath)) return packages;

    // For now, just scan one level deep (packages/*)
    if (pattern.includes('*')) {
      const items = readdirSync(basePath);
      for (const item of items) {
        const itemPath = join(basePath, item);
        if (statSync(itemPath).isDirectory()) {
          const pkg = await this.scanPackage(itemPath, rootPath);
          if (pkg) packages.push(pkg);
        }
      }
    } else {
      // Exact path
      const exactPath = join(rootPath, pattern);
      const pkg = await this.scanPackage(exactPath, rootPath);
      if (pkg) packages.push(pkg);
    }

    return packages;
  }

  /**
   * Scan a specific directory for packages
   */
  private async scanDirectory(rootPath: string, dirName: string): Promise<Package[]> {
    const packages: Package[] = [];
    const packagesMap = new Map<string, Package>(); // Use Map to deduplicate by name
    const dirPath = join(rootPath, dirName);
    
    if (!existsSync(dirPath)) return packages;

    try {
      const items = readdirSync(dirPath);
      for (const item of items) {
        const itemPath = join(dirPath, item);
        if (statSync(itemPath).isDirectory()) {
          // For odavl-studio structure: scan subdirectories (insight, autopilot, guardian)
          // Each has its own packages (core, cli, app, etc.)
          if (dirName === 'odavl-studio') {
            const subPackages = await this.scanSubdirectory(itemPath, rootPath);
            subPackages.forEach(pkg => {
              if (!packagesMap.has(pkg.name)) {
                packagesMap.set(pkg.name, pkg);
              }
            });
          } else {
            // Regular package scanning
            const pkg = await this.scanPackage(itemPath, rootPath);
            if (pkg && !packagesMap.has(pkg.name)) {
              packagesMap.set(pkg.name, pkg);
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }

    return Array.from(packagesMap.values());
  }

  /**
   * Scan subdirectory (for nested structure like odavl-studio/insight/*)
   */
  private async scanSubdirectory(subPath: string, rootPath: string): Promise<Package[]> {
    const packages: Package[] = [];
    
    try {
      const items = readdirSync(subPath);
      for (const item of items) {
        const itemPath = join(subPath, item);
        if (statSync(itemPath).isDirectory()) {
          const pkg = await this.scanPackage(itemPath, rootPath);
          if (pkg) packages.push(pkg);
        }
      }
    } catch {
      // Ignore errors
    }

    return packages;
  }

  /**
   * Scan a single package
   */
  private async scanPackage(pkgPath: string, rootPath: string): Promise<Package | null> {
    const pkgJsonPath = join(pkgPath, 'package.json');
    if (!existsSync(pkgJsonPath)) {
      return null;
    }

    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      
      // Detect project type
      const detection = await detectProject(pkgPath);
      
      return {
        name: pkgJson.name || basename(pkgPath),
        displayName: pkgJson.displayName,
        path: pkgPath,
        relativePath: pkgPath.replace(rootPath, '').replace(/^[/\\]/, ''),
        type: detection.type,
        version: pkgJson.version || '0.0.0',
        private: pkgJson.private === true,
        framework: detection.framework,
        confidence: detection.confidence,
      };
    } catch {
      return null;
    }
  }

  /**
   * Filter packages by type
   */
  filterByType(packages: Package[], type: ProjectType): Package[] {
    return packages.filter(pkg => pkg.type === type);
  }

  /**
   * Get package by name
   */
  getPackageByName(packages: Package[], name: string): Package | undefined {
    return packages.find(pkg => pkg.name === name);
  }

  /**
   * Sort packages by type
   */
  sortByType(packages: Package[]): Package[] {
    const typeOrder = {
      [ProjectType.WEBSITE]: 1,
      [ProjectType.EXTENSION]: 2,
      [ProjectType.CLI]: 3,
      [ProjectType.PACKAGE]: 4,
      [ProjectType.MONOREPO]: 5,
      [ProjectType.UNKNOWN]: 6,
    };

    return [...packages].sort((a, b) => {
      const orderA = typeOrder[a.type] || 999;
      const orderB = typeOrder[b.type] || 999;
      return orderA - orderB;
    });
  }
}

/**
 * Convenience function: Scan workspace
 */
export async function scanWorkspace(workspacePath: string): Promise<WorkspaceStructure> {
  const scanner = new PackageScanner();
  return scanner.scan(workspacePath);
}
