/**
 * Auto-Detect - Automatically detect project type and run appropriate tester
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getTester, type TesterType } from './tester-factory.js';

export interface AutoTestResult {
  tested: boolean;
  type?: TesterType;
  score?: number;
  status?: 'pass' | 'warning' | 'fail';
  info?: any;
  error?: string;
}

/**
 * Auto-detect project type and run appropriate tester
 */
export async function autoTest(projectPath: string): Promise<AutoTestResult | null> {
  try {
    // Check if path exists
    if (!existsSync(projectPath)) {
      return null;
    }

    // Detect project type
    const type = await detectProjectType(projectPath);
    
    if (!type) {
      console.error('❌ Could not detect product type');
      console.error('Supported: Website, Extension, CLI, Package, Monorepo\n');
      return null;
    }

    // Get appropriate tester
    const tester = await getTester(type);

    // Run test
    const result = await tester.test(projectPath);

    const returnValue = {
      tested: true,
      type,
      score: result.overallScore || result.score || 0,
      status: result.status,
      info: result,
    };
    
    return returnValue;
  } catch (error) {
    // Re-throw for invalid JSON or other parsing errors
    throw error;
  }
}

/**
 * Detect project type from filesystem
 */
async function detectProjectType(projectPath: string): Promise<TesterType | null> {
  // Check for monorepo first (most specific)
  if (existsSync(join(projectPath, 'pnpm-workspace.yaml'))) {
    return 'monorepo';
  }
  if (existsSync(join(projectPath, 'lerna.json'))) {
    return 'monorepo';
  }

  // Check package.json for other types
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    // Let JSON parse errors propagate (don't catch here)
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

    // VS Code Extension
    if (packageJson.engines?.vscode) {
      return 'extension';
    }

    // CLI Tool
    if (packageJson.bin) {
      return 'cli';
    }

    // Website (Next.js, React, etc.)
    const webDeps = ['next', 'react', 'vue', 'svelte', '@angular/core'];
    if (
      packageJson.dependencies &&
      webDeps.some((dep) => packageJson.dependencies[dep])
    ) {
      return 'website';
    }

    // NPM Package (has exports or main)
    if (packageJson.exports || packageJson.main || packageJson.module) {
      return 'package';
    }
  }

  // Check for website structure
  if (
    existsSync(join(projectPath, 'public', 'index.html')) ||
    existsSync(join(projectPath, 'src', 'index.html'))
  ) {
    return 'website';
  }

  return null;
}
