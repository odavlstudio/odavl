/**
 * ODAVL Insight - Baseline Storage
 * 
 * Handles loading and saving baselines from disk.
 */

import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import type { Baseline, BaselineIssue, BaselineMetadata } from './baseline.js';
import {
  validateBaseline,
  BaselineValidationError,
  BaselineNotFoundError,
  BASELINE_SCHEMA_VERSION,
} from './baseline.js';
import type { InsightIssue } from '../types.js';
import { generateFingerprint } from './fingerprint.js';

const BASELINE_DIR = '.odavl/baselines';

/**
 * Gets the baseline directory path
 */
export function getBaselineDir(workspaceRoot: string): string {
  return join(workspaceRoot, BASELINE_DIR);
}

/**
 * Gets the baseline file path
 */
export function getBaselinePath(workspaceRoot: string, name: string): string {
  return join(getBaselineDir(workspaceRoot), `${name}.json`);
}

/**
 * Ensures baseline directory exists
 */
export async function ensureBaselineDir(workspaceRoot: string): Promise<void> {
  const dir = getBaselineDir(workspaceRoot);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Gets git commit hash (if in git repo)
 */
function getGitCommit(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * Gets git branch name (if in git repo)
 */
function getGitBranch(): string | undefined {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * Creates a baseline from analysis results
 */
export async function createBaseline(
  workspaceRoot: string,
  name: string,
  issues: InsightIssue[],
  options: {
    detectors: string[];
    ignorePatterns?: string[];
    projectName?: string;
    autoCreated?: boolean;
  }
): Promise<Baseline> {
  await ensureBaselineDir(workspaceRoot);

  const now = new Date().toISOString();
  const cliVersion = 'odavl-insight@1.0.0'; // TODO: Get from package.json

  // Generate fingerprints and convert to baseline issues
  const baselineIssues: BaselineIssue[] = issues.map((issue) => ({
    ...issue,
    fingerprint: generateFingerprint(issue),
    firstSeen: now,
    // Code context would be added here if we read file snippets
  }));

  // Count unique files
  const uniqueFiles = new Set(issues.map((i) => i.file)).size;

  const metadata: BaselineMetadata = {
    createdAt: now,
    createdBy: cliVersion,
    projectName: options.projectName,
    gitCommit: getGitCommit(),
    gitBranch: getGitBranch(),
    totalFiles: uniqueFiles,
    totalIssues: issues.length,
    autoCreated: options.autoCreated,
  };

  const baseline: Baseline = {
    version: BASELINE_SCHEMA_VERSION,
    metadata,
    config: {
      detectors: options.detectors,
      ignorePatterns: options.ignorePatterns,
    },
    issues: baselineIssues,
  };

  // Save to disk
  const path = getBaselinePath(workspaceRoot, name);
  await fs.writeFile(path, JSON.stringify(baseline, null, 2), 'utf8');

  return baseline;
}

/**
 * Loads a baseline from disk
 */
export async function loadBaseline(
  workspaceRoot: string,
  name: string
): Promise<Baseline> {
  const path = getBaselinePath(workspaceRoot, name);

  try {
    const content = await fs.readFile(path, 'utf8');
    const data = JSON.parse(content);

    if (!validateBaseline(data)) {
      throw new BaselineValidationError(
        `Baseline '${name}' failed schema validation. The file may be corrupted or incompatible.`
      );
    }

    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new BaselineNotFoundError(name);
    }
    if (error instanceof BaselineValidationError) {
      throw error;
    }
    throw new BaselineValidationError(
      `Failed to load baseline '${name}': ${(error as Error).message}`
    );
  }
}

/**
 * Lists all available baselines
 */
export async function listBaselines(
  workspaceRoot: string
): Promise<Array<{ name: string; path: string; baseline: Baseline }>> {
  const dir = getBaselineDir(workspaceRoot);

  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const baselines = await Promise.all(
      jsonFiles.map(async (file) => {
        const name = file.replace('.json', '');
        const baseline = await loadBaseline(workspaceRoot, name);
        return {
          name,
          path: getBaselinePath(workspaceRoot, name),
          baseline,
        };
      })
    );

    return baselines;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // No baselines directory yet
    }
    throw error;
  }
}

/**
 * Deletes a baseline
 */
export async function deleteBaseline(
  workspaceRoot: string,
  name: string
): Promise<void> {
  const path = getBaselinePath(workspaceRoot, name);

  try {
    await fs.unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new BaselineNotFoundError(name);
    }
    throw error;
  }
}

/**
 * Checks if a baseline exists
 */
export async function baselineExists(
  workspaceRoot: string,
  name: string
): Promise<boolean> {
  const path = getBaselinePath(workspaceRoot, name);
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
