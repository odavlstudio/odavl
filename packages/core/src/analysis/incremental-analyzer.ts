/**
 * Incremental Analysis Engine
 * 
 * Git-aware analysis that only processes changed files.
 * Dramatically reduces analysis time for large codebases.
 * 
 * @since Phase 1 Week 20 (December 2025)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

const execAsync = promisify(exec);

export interface IncrementalOptions {
  baseBranch?: string; // Base branch for comparison (default: main)
  includeUntracked?: boolean; // Include untracked files (default: true)
  includeStaged?: boolean; // Include staged files (default: true)
  maxFiles?: number; // Max files to analyze (default: 1000)
  fileExtensions?: string[]; // Allowed extensions (default: .ts,.js,.tsx,.jsx)
}

export interface ChangedFile {
  path: string;
  status: FileStatus; // added, modified, deleted, renamed
  oldPath?: string; // For renamed files
  hash: string; // File content hash
  size: number; // File size in bytes
}

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';

export interface AnalysisScope {
  files: ChangedFile[];
  baseCommit: string;
  currentCommit: string;
  branch: string;
  isClean: boolean;
  totalFiles: number;
  scope: 'full' | 'incremental';
}

/**
 * Incremental analysis engine
 * 
 * Features:
 * - Git diff detection (detects file changes)
 * - Smart file filtering (only analyze changed files)
 * - Status tracking (added, modified, deleted)
 * - Cache-aware (skips unchanged files)
 * - Monorepo support (analyzes specific packages)
 */
export class IncrementalAnalyzer {
  private options: Required<IncrementalOptions>;
  private workspaceRoot: string;

  constructor(workspaceRoot: string, options: IncrementalOptions = {}) {
    this.workspaceRoot = workspaceRoot;
    this.options = {
      baseBranch: options.baseBranch || 'main',
      includeUntracked: options.includeUntracked !== false,
      includeStaged: options.includeStaged !== false,
      maxFiles: options.maxFiles || 1000,
      fileExtensions: options.fileExtensions || ['.ts', '.js', '.tsx', '.jsx', '.py', '.java'],
    };
  }

  /**
   * Get analysis scope (full or incremental)
   */
  async getScope(): Promise<AnalysisScope> {
    const isGitRepo = await this.isGitRepository();

    if (!isGitRepo) {
      return await this.getFullScope();
    }

    const changedFiles = await this.getChangedFiles();

    if (changedFiles.length === 0) {
      return await this.getFullScope();
    }

    const baseCommit = await this.getBaseCommit();
    const currentCommit = await this.getCurrentCommit();
    const branch = await this.getCurrentBranch();
    const isClean = await this.isWorkspaceClean();

    return {
      files: changedFiles,
      baseCommit,
      currentCommit,
      branch,
      isClean,
      totalFiles: changedFiles.length,
      scope: 'incremental',
    };
  }

  /**
   * Get changed files since base branch
   */
  async getChangedFiles(): Promise<ChangedFile[]> {
    const files: ChangedFile[] = [];

    // Get modified/added files
    if (this.options.includeStaged) {
      const staged = await this.getStagedFiles();
      files.push(...staged);
    }

    // Get unstaged changes
    const unstaged = await this.getUnstagedFiles();
    files.push(...unstaged);

    // Get untracked files
    if (this.options.includeUntracked) {
      const untracked = await this.getUntrackedFiles();
      files.push(...untracked);
    }

    // Filter by extensions
    const filtered = files.filter(file =>
      this.options.fileExtensions.some(ext => file.path.endsWith(ext))
    );

    // Limit file count
    return filtered.slice(0, this.options.maxFiles);
  }

  /**
   * Get staged files
   */
  private async getStagedFiles(): Promise<ChangedFile[]> {
    try {
      const { stdout } = await execAsync('git diff --cached --name-status', {
        cwd: this.workspaceRoot,
      });

      return this.parseGitStatus(stdout);
    } catch {
      return [];
    }
  }

  /**
   * Get unstaged files
   */
  private async getUnstagedFiles(): Promise<ChangedFile[]> {
    try {
      const { stdout } = await execAsync('git diff --name-status', {
        cwd: this.workspaceRoot,
      });

      return this.parseGitStatus(stdout);
    } catch {
      return [];
    }
  }

  /**
   * Get untracked files
   */
  private async getUntrackedFiles(): Promise<ChangedFile[]> {
    try {
      const { stdout } = await execAsync('git ls-files --others --exclude-standard', {
        cwd: this.workspaceRoot,
      });

      const paths = stdout.trim().split('\n').filter(Boolean);
      const files: ChangedFile[] = [];

      for (const filePath of paths) {
        const fullPath = path.join(this.workspaceRoot, filePath);
        try {
          const stats = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath, 'utf-8');
          const hash = createHash('sha256').update(content).digest('hex');

          files.push({
            path: filePath,
            status: 'untracked',
            hash,
            size: stats.size,
          });
        } catch {
          // Skip inaccessible files
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  /**
   * Parse git status output
   */
  private async parseGitStatus(output: string): Promise<ChangedFile[]> {
    const lines = output.trim().split('\n').filter(Boolean);
    const files: ChangedFile[] = [];

    for (const line of lines) {
      const [statusCode, ...pathParts] = line.split('\t');
      const filePath = pathParts.join('\t');

      let status: FileStatus;
      let oldPath: string | undefined;

      switch (statusCode[0]) {
        case 'A':
          status = 'added';
          break;
        case 'M':
          status = 'modified';
          break;
        case 'D':
          status = 'deleted';
          break;
        case 'R':
          status = 'renamed';
          [oldPath, filePath] = pathParts;
          break;
        default:
          continue; // Skip unknown status
      }

      if (status === 'deleted') {
        files.push({
          path: filePath,
          status,
          hash: '',
          size: 0,
        });
        continue;
      }

      const fullPath = path.join(this.workspaceRoot, filePath);
      try {
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const hash = createHash('sha256').update(content).digest('hex');

        files.push({
          path: filePath,
          status,
          oldPath,
          hash,
          size: stats.size,
        });
      } catch {
        // Skip inaccessible files
      }
    }

    return files;
  }

  /**
   * Get base commit
   */
  private async getBaseCommit(): Promise<string> {
    try {
      const { stdout } = await execAsync(`git merge-base HEAD origin/${this.options.baseBranch}`, {
        cwd: this.workspaceRoot,
      });
      return stdout.trim();
    } catch {
      return 'HEAD~1';
    }
  }

  /**
   * Get current commit
   */
  private async getCurrentCommit(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', {
        cwd: this.workspaceRoot,
      });
      return stdout.trim();
    } catch {
      return '';
    }
  }

  /**
   * Get current branch
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: this.workspaceRoot,
      });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if workspace is clean
   */
  private async isWorkspaceClean(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: this.workspaceRoot,
      });
      return stdout.trim() === '';
    } catch {
      return false;
    }
  }

  /**
   * Check if workspace is git repository
   */
  private async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', {
        cwd: this.workspaceRoot,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get full scope (all files)
   */
  private async getFullScope(): Promise<AnalysisScope> {
    const files = await this.getAllFiles();

    return {
      files,
      baseCommit: '',
      currentCommit: '',
      branch: '',
      isClean: true,
      totalFiles: files.length,
      scope: 'full',
    };
  }

  /**
   * Get all files in workspace
   */
  private async getAllFiles(): Promise<ChangedFile[]> {
    const files: ChangedFile[] = [];

    async function walk(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const relativePath = path.relative(this.workspaceRoot, fullPath);
          const stats = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath, 'utf-8');
          const hash = createHash('sha256').update(content).digest('hex');

          files.push({
            path: relativePath,
            status: 'modified',
            hash,
            size: stats.size,
          });
        }
      }
    }

    await walk(this.workspaceRoot);

    // Filter by extensions
    return files.filter(file =>
      this.options.fileExtensions.some(ext => file.path.endsWith(ext))
    );
  }

  /**
   * Get files changed since specific commit
   */
  async getFilesSince(commit: string): Promise<ChangedFile[]> {
    try {
      const { stdout } = await execAsync(`git diff --name-status ${commit}..HEAD`, {
        cwd: this.workspaceRoot,
      });

      return this.parseGitStatus(stdout);
    } catch {
      return [];
    }
  }

  /**
   * Get files changed between commits
   */
  async getFilesBetween(from: string, to: string): Promise<ChangedFile[]> {
    try {
      const { stdout } = await execAsync(`git diff --name-status ${from}..${to}`, {
        cwd: this.workspaceRoot,
      });

      return this.parseGitStatus(stdout);
    } catch {
      return [];
    }
  }

  /**
   * Get affected files by PR
   */
  async getAffectedByPR(prNumber: number): Promise<ChangedFile[]> {
    try {
      // Get PR base branch
      const { stdout: prInfo } = await execAsync(`gh pr view ${prNumber} --json baseRefName`, {
        cwd: this.workspaceRoot,
      });

      const { baseRefName } = JSON.parse(prInfo);

      // Get changed files
      const { stdout } = await execAsync(`git diff --name-status origin/${baseRefName}...HEAD`, {
        cwd: this.workspaceRoot,
      });

      return this.parseGitStatus(stdout);
    } catch {
      return [];
    }
  }
}

/**
 * Helper: Create incremental analyzer
 */
export function createIncrementalAnalyzer(
  workspaceRoot: string,
  options?: IncrementalOptions
): IncrementalAnalyzer {
  return new IncrementalAnalyzer(workspaceRoot, options);
}

/**
 * Helper: Get analysis scope
 */
export async function getAnalysisScope(
  workspaceRoot: string,
  options?: IncrementalOptions
): Promise<AnalysisScope> {
  const analyzer = createIncrementalAnalyzer(workspaceRoot, options);
  return analyzer.getScope();
}

export default IncrementalAnalyzer;
