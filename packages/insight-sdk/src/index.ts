/**
 * ODAVL Insight SDK - Main Entry Point
 * Wave 5 - SDK + IDE Integration
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { InsightIssue, InsightAnalysisResult, AnalysisOptions } from './types';

export type { InsightIssue, InsightAnalysisResult, AnalysisOptions };

/**
 * Analyze an entire workspace directory
 * @param workspacePath - Absolute path to workspace root
 * @param options - Analysis configuration
 * @returns Analysis results with issues and summary
 */
export async function analyzeWorkspace(
  workspacePath: string,
  options: AnalysisOptions = {}
): Promise<InsightAnalysisResult> {
  const startTime = Date.now();
  
  // Collect all TypeScript/JavaScript files
  const files = await collectFiles(workspacePath);
  
  // Run analysis using Insight Core
  const issues = await runAnalysis(files, workspacePath, options);
  
  const elapsedMs = Date.now() - startTime;
  
  return {
    issues,
    summary: buildSummary(issues, files.length, elapsedMs)
  };
}

/**
 * Analyze specific files
 * @param filePaths - Array of absolute file paths
 * @param options - Analysis configuration
 * @returns Analysis results with issues and summary
 */
export async function analyzeFiles(
  filePaths: string[],
  options: AnalysisOptions = {}
): Promise<InsightAnalysisResult> {
  const startTime = Date.now();
  
  // Validate files exist
  const validFiles: string[] = [];
  for (const file of filePaths) {
    try {
      await fs.access(file);
      validFiles.push(file);
    } catch {
      // Skip non-existent files
    }
  }
  
  if (validFiles.length === 0) {
    return {
      issues: [],
      summary: {
        filesAnalyzed: 0,
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        elapsedMs: Date.now() - startTime
      }
    };
  }
  
  // Run analysis
  const workspaceRoot = path.dirname(validFiles[0]);
  const issues = await runAnalysis(validFiles, workspaceRoot, options);
  
  const elapsedMs = Date.now() - startTime;
  
  return {
    issues,
    summary: buildSummary(issues, validFiles.length, elapsedMs)
  };
}

/**
 * List all available detectors
 * Uses Wave 4 auto-discovery system
 * @returns Array of detector names
 */
export async function listDetectors(): Promise<string[]> {
  // Fallback to known stable detectors (avoid dynamic require resolution)
  return [
    'typescript',
    'security',
    'performance',
    'complexity',
    'circular',
    'import',
    'package',
    'runtime',
    'build',
    'network',
    'isolation',
    'eslint',
    'advanced-runtime',
    'architecture',
    'cicd',
    'database',
    'go',
    'infrastructure',
    'java',
    'kotlin',
    'nextjs',
    'python-complexity',
    'python-security',
    'python-type',
    'rust'
  ].sort();
}

/**
 * Collect TypeScript/JavaScript files from workspace
 */
async function collectFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const ignorePatterns = [
    'node_modules',
    'dist',
    'build',
    '.next',
    'out',
    'coverage',
    '.git',
    '.odavl',
    'reports'
  ];
  
  async function scan(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (ignorePatterns.some((pattern: string) => entry.name.includes(pattern))) {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  await scan(root);
  return files;
}

/**
 * Run analysis using Insight Core engine
 */
async function runAnalysis(
  files: string[],
  workspaceRoot: string,
  options: AnalysisOptions
): Promise<InsightIssue[]> {
  const issues: InsightIssue[] = [];
  
  // Import AnalysisEngine from Insight Core (dynamic to avoid type issues)
  const insightCore = await import('@odavl-studio/insight-core');
  const AnalysisEngine = (insightCore as any).AnalysisEngine;
  const engine = new AnalysisEngine(workspaceRoot);
  
  // Get detectors to run
  const detectors = options.detectors || await listDetectors();
  
  // Run analysis
  for (const file of files) {
    try {
      const fileIssues = await engine.analyzeFile(file, detectors);
      
      // Filter by severity minimum
      const filtered = options.severityMinimum
        ? fileIssues.filter((issue: any) => 
            compareSeverity(issue.severity, options.severityMinimum!) >= 0
          )
        : fileIssues;
      
      issues.push(...filtered);
    } catch {
      // Skip files that fail analysis
    }
  }
  
  return issues;
}

/**
 * Build summary statistics
 */
function buildSummary(
  issues: InsightIssue[],
  filesAnalyzed: number,
  elapsedMs: number
) {
  const summary = {
    filesAnalyzed,
    totalIssues: issues.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    elapsedMs
  };
  
  for (const issue of issues) {
    summary[issue.severity]++;
  }
  
  return summary;
}

/**
 * Compare severity levels
 * Returns: 1 if a > b, 0 if equal, -1 if a < b
 */
function compareSeverity(
  a: string,
  b: string
): number {
  const levels = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return levels[a as keyof typeof levels] - levels[b as keyof typeof levels];
}
