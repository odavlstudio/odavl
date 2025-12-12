/**
 * Smart File Filter
 * 
 * Intelligently filters files for analysis based on:
 * - File type/extension
 * - File size
 * - Gitignore patterns
 * - Custom exclusion rules
 * 
 * @since Phase 1 Week 20 (December 2025)
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { minimatch } from 'minimatch';

export interface FilterOptions {
  include?: string[]; // Include patterns (default: all)
  exclude?: string[]; // Exclude patterns (default: node_modules, dist)
  maxFileSize?: number; // Max file size in bytes (default: 10MB)
  followGitignore?: boolean; // Respect .gitignore (default: true)
  extensions?: string[]; // Allowed extensions (default: .ts,.js,.tsx,.jsx)
  minLines?: number; // Min lines (default: 0)
  maxLines?: number; // Max lines (default: 50000)
}

export interface FilterResult {
  included: string[];
  excluded: string[];
  reasons: Map<string, string>; // file → reason
  stats: FilterStats;
}

export interface FilterStats {
  totalFiles: number;
  includedFiles: number;
  excludedFiles: number;
  totalSize: number;
  avgSize: number;
}

/**
 * Smart file filter
 */
export class SmartFileFilter {
  private options: Required<FilterOptions>;
  private gitignorePatterns: string[] = [];

  constructor(options: FilterOptions = {}) {
    this.options = {
      include: options.include || ['**/*'],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/*.min.js',
        '**/*.bundle.js',
      ],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      followGitignore: options.followGitignore !== false,
      extensions: options.extensions || ['.ts', '.js', '.tsx', '.jsx', '.py', '.java'],
      minLines: options.minLines || 0,
      maxLines: options.maxLines || 50000,
    };
  }

  /**
   * Filter files
   */
  async filter(files: string[], workspaceRoot: string): Promise<FilterResult> {
    const included: string[] = [];
    const excluded: string[] = [];
    const reasons = new Map<string, string>();
    let totalSize = 0;

    // Load gitignore if enabled
    if (this.options.followGitignore) {
      await this.loadGitignore(workspaceRoot);
    }

    for (const file of files) {
      const reason = await this.shouldExclude(file, workspaceRoot);

      if (reason) {
        excluded.push(file);
        reasons.set(file, reason);
      } else {
        included.push(file);
        
        // Calculate size
        const fullPath = path.join(workspaceRoot, file);
        try {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        } catch {
          // Skip if inaccessible
        }
      }
    }

    const stats: FilterStats = {
      totalFiles: files.length,
      includedFiles: included.length,
      excludedFiles: excluded.length,
      totalSize,
      avgSize: included.length > 0 ? totalSize / included.length : 0,
    };

    return {
      included,
      excluded,
      reasons,
      stats,
    };
  }

  /**
   * Check if file should be excluded
   */
  private async shouldExclude(file: string, workspaceRoot: string): Promise<string | null> {
    // Check extension
    if (!this.options.extensions.some(ext => file.endsWith(ext))) {
      return `Invalid extension (allowed: ${this.options.extensions.join(', ')})`;
    }

    // Check exclude patterns
    for (const pattern of this.options.exclude) {
      if (minimatch(file, pattern)) {
        return `Matches exclude pattern: ${pattern}`;
      }
    }

    // Check include patterns
    const matchesInclude = this.options.include.some(pattern => minimatch(file, pattern));
    if (!matchesInclude) {
      return 'Does not match any include pattern';
    }

    // Check gitignore
    if (this.options.followGitignore && this.isGitignored(file)) {
      return 'Matched .gitignore pattern';
    }

    // Check file size
    const fullPath = path.join(workspaceRoot, file);
    try {
      const stats = await fs.stat(fullPath);

      if (stats.size > this.options.maxFileSize) {
        return `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB`;
      }

      // Check line count
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').length;

      if (lines < this.options.minLines) {
        return `Too few lines: ${lines} (min: ${this.options.minLines})`;
      }

      if (lines > this.options.maxLines) {
        return `Too many lines: ${lines} (max: ${this.options.maxLines})`;
      }
    } catch (error: any) {
      return `File inaccessible: ${error.message}`;
    }

    return null;
  }

  /**
   * Load .gitignore patterns
   */
  private async loadGitignore(workspaceRoot: string): Promise<void> {
    const gitignorePath = path.join(workspaceRoot, '.gitignore');

    try {
      const content = await fs.readFile(gitignorePath, 'utf-8');
      this.gitignorePatterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    } catch {
      // .gitignore doesn't exist
      this.gitignorePatterns = [];
    }
  }

  /**
   * Check if file matches gitignore
   */
  private isGitignored(file: string): boolean {
    return this.gitignorePatterns.some(pattern => {
      // Convert gitignore pattern to glob
      const glob = pattern.startsWith('/')
        ? pattern.substring(1)
        : `**/${pattern}`;

      return minimatch(file, glob);
    });
  }

  /**
   * Get all files in directory
   */
  async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string): Promise<void> {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.push(relativePath);
        }
      }
    }

    await walk(dir);
    return files;
  }
}

/**
 * Cache invalidation strategy
 */
export class CacheInvalidationStrategy {
  /**
   * Get files to invalidate based on changes
   */
  static getFilesToInvalidate(
    changedFiles: string[],
    allFiles: string[]
  ): string[] {
    const toInvalidate = new Set<string>();

    for (const changed of changedFiles) {
      // Add changed file itself
      toInvalidate.add(changed);

      // Add files that import changed file
      const dependents = this.findDependents(changed, allFiles);
      dependents.forEach(dep => toInvalidate.add(dep));
    }

    return Array.from(toInvalidate);
  }

  /**
   * Find files that depend on target file
   */
  private static findDependents(targetFile: string, allFiles: string[]): string[] {
    // Placeholder - would use AST analysis in production
    // For now, invalidate files in same directory
    const targetDir = path.dirname(targetFile);
    return allFiles.filter(file => path.dirname(file) === targetDir);
  }

  /**
   * Get invalidation reason
   */
  static getInvalidationReason(file: string, changedFiles: string[]): string {
    if (changedFiles.includes(file)) {
      return 'File modified';
    }

    // Check if dependency changed
    const deps = changedFiles.filter(changed =>
      this.areRelated(file, changed)
    );

    if (deps.length > 0) {
      return `Dependency changed: ${deps.join(', ')}`;
    }

    return 'Unknown';
  }

  /**
   * Check if files are related (import/export)
   */
  private static areRelated(file1: string, file2: string): boolean {
    // Placeholder - would use import graph analysis
    return path.dirname(file1) === path.dirname(file2);
  }
}

/**
 * Helper: Create file filter
 */
export function createFileFilter(options?: FilterOptions): SmartFileFilter {
  return new SmartFileFilter(options);
}

/**
 * Helper: Filter files
 */
export async function filterFiles(
  files: string[],
  workspaceRoot: string,
  options?: FilterOptions
): Promise<FilterResult> {
  const filter = createFileFilter(options);
  return filter.filter(files, workspaceRoot);
}

export default SmartFileFilter;
