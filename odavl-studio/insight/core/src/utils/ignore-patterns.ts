/**
 * @fileoverview Centralized ignore patterns to eliminate false positives
 * 
 * CRITICAL: These patterns prevent analysis of:
 * - Test fixtures (intentional bad code for testing)
 * - Compiled/bundled code (dist/, build/, .next/)
 * - Dependencies (node_modules/)
 * - Generated files (coverage/, reports/)
 * 
 * Target: Reduce false positives from 43% to <5%
 */

import * as path from 'path';
import { minimatch } from 'minimatch';

/**
 * Global ignore patterns (apply to ALL detectors)
 */
export const GLOBAL_IGNORE_PATTERNS = [
  // Test fixtures - intentional bad code for detector testing
  '**/test-fixtures/**',
  '**/test-data/**',
  '**/fixtures/**',
  '**/__fixtures__/**',
  
  // Compiled/bundled code - already processed
  '**/dist/**',
  '**/dist-test/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.output/**',
  
  // Dependencies - not our code
  '**/node_modules/**',
  '**/vendor/**',
  '**/bower_components/**',
  
  // Test files - may contain intentional errors
  '**/*.test.ts',
  '**/*.test.js',
  '**/*.test.tsx',
  '**/*.test.jsx',
  '**/*.spec.ts',
  '**/*.spec.js',
  '**/*.spec.tsx',
  '**/*.spec.jsx',
  '**/__tests__/**',
  '**/__mocks__/**',
  
  // Coverage and reports - generated files
  '**/coverage/**',
  '**/.nyc_output/**',
  '**/reports/**',
  '**/.odavl/**',
  
  // Version control
  '**/.git/**',
  '**/.svn/**',
  '**/.hg/**',
  
  // IDE and editor files
  '**/.vscode/**',
  '**/.idea/**',
  '**/*.swp',
  '**/*.swo',
  '**/*~',
  
  // OS files
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/desktop.ini',
  
  // Lock files
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lockb',
  
  // Minified files - hard to analyze accurately
  '**/*.min.js',
  '**/*.min.css',
  '**/*.bundle.js',
  
  // Documentation
  '**/docs/**',
  '**/*.md',
  
  // Configuration files - often contain tokens for examples
  '**/.env.example',
  '**/.env.template',
  '**/example.config.js',
  '**/example.config.ts'
];

/**
 * Security-specific ignore patterns (less false positives for secrets)
 */
export const SECURITY_IGNORE_PATTERNS = [
  ...GLOBAL_IGNORE_PATTERNS,
  
  // Example/demo files - often contain fake credentials
  '**/examples/**',
  '**/demo/**',
  '**/samples/**',
  '**/*-example.*',
  '**/*-sample.*',
  '**/*-demo.*',
  
  // Documentation with code samples
  '**/*.md',
  '**/README*',
  '**/CHANGELOG*',
  '**/CONTRIBUTING*',
  
  // Storybook stories - may contain mock data
  '**/*.stories.*',
  '**/.storybook/**'
];

/**
 * Performance-specific ignore patterns
 */
export const PERFORMANCE_IGNORE_PATTERNS = [
  ...GLOBAL_IGNORE_PATTERNS,
  
  // Legacy code - we know it's slow
  '**/legacy/**',
  '**/deprecated/**',
  
  // Scripts - one-time execution
  '**/scripts/**',
  '**/tools/**'
];

/**
 * Check if a file path should be ignored
 */
export function shouldIgnoreFile(
  filePath: string,
  customPatterns: string[] = [],
  detectorType: 'global' | 'security' | 'performance' = 'global'
): boolean {
  // Normalize path separators (Windows -> Unix)
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Select patterns based on detector type
  let patterns: string[];
  switch (detectorType) {
    case 'security':
      patterns = [...SECURITY_IGNORE_PATTERNS, ...customPatterns];
      break;
    case 'performance':
      patterns = [...PERFORMANCE_IGNORE_PATTERNS, ...customPatterns];
      break;
    default:
      patterns = [...GLOBAL_IGNORE_PATTERNS, ...customPatterns];
  }
  
  // Check if path matches any ignore pattern
  return patterns.some(pattern => minimatch(normalizedPath, pattern, { dot: true }));
}

/**
 * Filter an array of file paths, removing ignored files
 */
export function filterIgnoredFiles(
  filePaths: string[],
  customPatterns: string[] = [],
  detectorType: 'global' | 'security' | 'performance' = 'global'
): string[] {
  return filePaths.filter(filePath => 
    !shouldIgnoreFile(filePath, customPatterns, detectorType)
  );
}

/**
 * Check if a detected issue is likely a false positive based on file location
 */
export function isFalsePositiveByLocation(issueFilePath: string): boolean {
  // Quick check for most common false positive locations
  const normalizedPath = issueFilePath.replace(/\\/g, '/').toLowerCase();
  
  return (
    normalizedPath.includes('/test-fixtures/') ||
    normalizedPath.includes('/dist/') ||
    normalizedPath.includes('/dist-test/') ||
    normalizedPath.includes('/node_modules/') ||
    normalizedPath.includes('/__tests__/') ||
    normalizedPath.includes('/__mocks__/') ||
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.') ||
    normalizedPath.includes('.min.') ||
    normalizedPath.endsWith('.bundle.js')
  );
}

/**
 * Load custom ignore patterns from .odavlignore file
 */
export async function loadCustomIgnorePatterns(workspaceRoot: string): Promise<string[]> {
  const fs = await import('fs/promises');
  const ignoreFilePath = path.join(workspaceRoot, '.odavlignore');
  
  try {
    const content = await fs.readFile(ignoreFilePath, 'utf-8');
    
    // Parse .gitignore-style format
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Remove empty lines and comments
  } catch (error) {
    // .odavlignore doesn't exist - use defaults only
    return [];
  }
}

/**
 * Create a default .odavlignore file for a workspace
 */
export async function createDefaultIgnoreFile(workspaceRoot: string): Promise<void> {
  const fs = await import('fs/promises');
  const ignoreFilePath = path.join(workspaceRoot, '.odavlignore');
  
  const defaultContent = `# ODAVL Insight - Ignore Patterns
# Lines starting with # are comments
# Patterns use glob syntax (like .gitignore)

# Test fixtures (intentional bad code)
**/test-fixtures/**
**/fixtures/**

# Compiled/bundled code
**/dist/**
**/build/**
**/out/**
**/.next/**

# Dependencies
**/node_modules/**

# Test files
**/*.test.*
**/*.spec.*
**/__tests__/**

# Coverage reports
**/coverage/**
**/reports/**

# Generated files
**/.odavl/**

# Add your custom patterns below:
`;

  try {
    await fs.writeFile(ignoreFilePath, defaultContent, 'utf-8');
    console.log(`✅ Created .odavlignore at ${ignoreFilePath}`);
  } catch (error) {
    console.error(`❌ Failed to create .odavlignore: ${error}`);
  }
}

/**
 * Statistics for ignored files (for reporting)
 */
export interface IgnoreStats {
  totalFiles: number;
  ignoredFiles: number;
  analyzedFiles: number;
  ignoredByCategory: {
    testFixtures: number;
    compiled: number;
    dependencies: number;
    tests: number;
    generated: number;
    other: number;
  };
}

/**
 * Calculate ignore statistics for reporting
 */
export function calculateIgnoreStats(
  allFiles: string[],
  analyzedFiles: string[]
): IgnoreStats {
  const ignoredFiles = allFiles.filter(f => !analyzedFiles.includes(f));
  
  const stats: IgnoreStats = {
    totalFiles: allFiles.length,
    ignoredFiles: ignoredFiles.length,
    analyzedFiles: analyzedFiles.length,
    ignoredByCategory: {
      testFixtures: 0,
      compiled: 0,
      dependencies: 0,
      tests: 0,
      generated: 0,
      other: 0
    }
  };
  
  // Categorize ignored files
  ignoredFiles.forEach(file => {
    const normalized = file.replace(/\\/g, '/').toLowerCase();
    
    if (normalized.includes('/test-fixtures/') || normalized.includes('/fixtures/')) {
      stats.ignoredByCategory.testFixtures++;
    } else if (normalized.includes('/dist/') || normalized.includes('/build/') || normalized.includes('/.next/')) {
      stats.ignoredByCategory.compiled++;
    } else if (normalized.includes('/node_modules/')) {
      stats.ignoredByCategory.dependencies++;
    } else if (normalized.includes('.test.') || normalized.includes('.spec.') || normalized.includes('/__tests__/')) {
      stats.ignoredByCategory.tests++;
    } else if (normalized.includes('/coverage/') || normalized.includes('/reports/')) {
      stats.ignoredByCategory.generated++;
    } else {
      stats.ignoredByCategory.other++;
    }
  });
  
  return stats;
}
