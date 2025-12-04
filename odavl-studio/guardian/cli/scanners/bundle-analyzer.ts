/**
 * 📦 Guardian Enterprise Bundle Analyzer
 * JavaScript bundle size and dependency analysis
 * - Bundle size analysis
 * - Unused dependencies detection
 * - Code duplication finder
 * - Dead code elimination suggestions
 * - Tree-shaking opportunities
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface BundleIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'size' | 'unused' | 'duplication' | 'dead-code';
  title: string;
  description: string;
  recommendation: string;
  metrics?: Record<string, any>;
}

export interface BundleAnalysis {
  score: number; // 0-100
  totalIssues: number;
  issues: BundleIssue[];
  metrics: {
    totalBundleSize?: number; // KB
    unusedDeps?: number;
    duplicateCode?: number;
    deadCodeFiles?: number;
  };
  recommendations: string[];
}

export async function analyzeBundle(projectPath: string): Promise<BundleAnalysis> {
  const issues: BundleIssue[] = [];

  // 1. Analyze bundle size
  issues.push(...analyzeBundleSize(projectPath));

  // 2. Detect unused dependencies
  issues.push(...detectUnusedDependencies(projectPath));

  // 3. Find code duplication
  issues.push(...findCodeDuplication(projectPath));

  // 4. Detect dead code
  issues.push(...detectDeadCode(projectPath));

  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;

  const score = Math.max(0, 100 - (critical * 20) - (high * 10) - (medium * 5) - (low * 2));

  return {
    score,
    totalIssues: issues.length,
    issues,
    metrics: {
      totalBundleSize: calculateTotalSize(projectPath),
      unusedDeps: issues.filter(i => i.category === 'unused').length,
      duplicateCode: issues.filter(i => i.category === 'duplication').length,
      deadCodeFiles: issues.filter(i => i.category === 'dead-code').length
    },
    recommendations: generateBundleRecommendations(issues)
  };
}

function analyzeBundleSize(projectPath: string): BundleIssue[] {
  const issues: BundleIssue[] = [];

  try {
    const buildDirs = [
      join(projectPath, '.next'),
      join(projectPath, 'dist'),
      join(projectPath, 'build'),
      join(projectPath, 'out')
    ];

    for (const dir of buildDirs) {
      if (existsSync(dir)) {
        // Exclude cache and node_modules from size calculation
        const excludeDirs = ['node_modules', 'cache', '.cache'];
        const size = getDirSize(dir, excludeDirs);
        const sizeMB = size / 1024 / 1024;

        // Intelligent size thresholds based on build type
        const isNextStandalone = dir.includes('standalone');
        const threshold = isNextStandalone ? 10 : 5; // MB

        if (sizeMB > threshold) {
          issues.push({
            severity: sizeMB > threshold * 2 ? 'critical' : 'high',
            category: 'size',
            title: `Large bundle size: ${sizeMB.toFixed(2)} MB`,
            description: `Bundle exceeds ${threshold}MB threshold for production`,
            recommendation: 'Enable code splitting, lazy loading, and tree-shaking',
            metrics: { 
              sizeMB: sizeMB.toFixed(2),
              threshold: `${threshold}MB`,
              buildType: isNextStandalone ? 'standalone' : 'default'
            }
          });
        }

        // Check for large individual files
        const largeFiles = findLargeFiles(dir, 500); // >500KB
        if (largeFiles.length > 0) {
          issues.push({
            severity: 'medium',
            category: 'size',
            title: `${largeFiles.length} large files (>500KB)`,
            description: 'Individual files are too large',
            recommendation: 'Split large files, use dynamic imports',
            metrics: {
              files: largeFiles.slice(0, 3).map(f => f.name),
              sizes: largeFiles.slice(0, 3).map(f => `${(f.size / 1024).toFixed(0)}KB`)
            }
          });
        }
      }
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

function detectUnusedDependencies(projectPath: string): BundleIssue[] {
  const issues: BundleIssue[] = [];

  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) return issues;

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (Object.keys(deps).length === 0) return issues;

    // Use depcheck or simple grep to find unused deps
    try {
      const output = execSync('npx depcheck --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['ignore', 'pipe', 'ignore']
      });

      const result = JSON.parse(output);
      const unused = result.dependencies || [];

      if (unused.length > 0) {
        issues.push({
          severity: 'medium',
          category: 'unused',
          title: `${unused.length} unused dependencies`,
          description: 'Dependencies installed but not imported anywhere',
          recommendation: 'Run: npm uninstall ' + unused.slice(0, 3).join(' '),
          metrics: {
            count: unused.length,
            examples: unused.slice(0, 5)
          }
        });
      }

    } catch (e) {
      // depcheck not available - do basic check
      const srcDirs = [
        join(projectPath, 'src'),
        join(projectPath, 'app'),
        join(projectPath, 'pages')
      ];

      const importedPackages = new Set<string>();
      for (const dir of srcDirs) {
        if (existsSync(dir)) {
          findImports(dir, importedPackages);
        }
      }

      const unused = Object.keys(deps).filter(dep => !importedPackages.has(dep));
      
      if (unused.length > 5) {
        issues.push({
          severity: 'low',
          category: 'unused',
          title: `Potentially ${unused.length} unused dependencies`,
          description: 'Dependencies may not be imported (basic check)',
          recommendation: 'Run: npx depcheck for accurate results',
          metrics: { count: unused.length }
        });
      }
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

function findCodeDuplication(projectPath: string): BundleIssue[] {
  const issues: BundleIssue[] = [];

  try {
    // Simple duplication detection - look for similar function names
    const srcDirs = [
      join(projectPath, 'src'),
      join(projectPath, 'app'),
      join(projectPath, 'lib')
    ];

    const functionCounts = new Map<string, number>();

    for (const dir of srcDirs) {
      if (existsSync(dir)) {
        countFunctions(dir, functionCounts);
      }
    }

    const duplicates = Array.from(functionCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    if (duplicates.length > 10) {
      issues.push({
        severity: 'medium',
        category: 'duplication',
        title: `${duplicates.length} potentially duplicated functions`,
        description: 'Similar function names detected across files',
        recommendation: 'Extract common code into shared utilities',
        metrics: {
          count: duplicates.length,
          examples: duplicates.slice(0, 5).map(([name, count]) => `${name} (${count}x)`)
        }
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

function detectDeadCode(projectPath: string): BundleIssue[] {
  const issues: BundleIssue[] = [];

  try {
    // Look for unused exports
    const srcDirs = [
      join(projectPath, 'src'),
      join(projectPath, 'app'),
      join(projectPath, 'lib')
    ];

    let unusedFiles = 0;
    const examples: string[] = [];

    for (const dir of srcDirs) {
      if (existsSync(dir)) {
        const files = findAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx']);
        
        for (const file of files) {
          const content = readFileSync(file, 'utf-8');
          
          // Check if file exports but is never imported
          if ((content.includes('export ') || content.includes('export default')) &&
              !file.includes('.test.') && !file.includes('.spec.')) {
            
            const fileName = file.split(/[/\\]/).pop() || '';
            const isImported = checkIfImported(projectPath, fileName);
            
            if (!isImported) {
              unusedFiles++;
              if (examples.length < 5) {
                examples.push(fileName);
              }
            }
          }
        }
      }
    }

    if (unusedFiles > 5) {
      issues.push({
        severity: 'low',
        category: 'dead-code',
        title: `${unusedFiles} potentially unused files`,
        description: 'Files with exports that may not be imported anywhere',
        recommendation: 'Review and remove unused code to reduce bundle size',
        metrics: {
          count: unusedFiles,
          examples
        }
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

// Helper functions
function getDirSize(dir: string, excludeDirs: string[] = []): number {
  let size = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip excluded directories (cache, node_modules, etc.)
      if (excludeDirs.includes(entry.name)) {
        continue;
      }
      
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        size += getDirSize(fullPath, excludeDirs);
      } else {
        size += statSync(fullPath).size;
      }
    }
  } catch (e) {
    // Skip inaccessible dirs
  }
  return size;
}

function findLargeFiles(dir: string, minSizeKB: number): Array<{ name: string; size: number }> {
  const large: Array<{ name: string; size: number }> = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        large.push(...findLargeFiles(fullPath, minSizeKB));
      } else if (entry.isFile()) {
        const size = statSync(fullPath).size;
        if (size > minSizeKB * 1024) {
          large.push({ name: entry.name, size });
        }
      }
    }
  } catch (e) {
    // Skip
  }
  return large;
}

function findImports(dir: string, imports: Set<string>): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        findImports(fullPath, imports);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
        const content = readFileSync(fullPath, 'utf-8');
        const importMatches = content.match(/from ['"]([^'"]+)['"]/g) || [];
        for (const match of importMatches) {
          const pkg = match.match(/from ['"]([@\w][@\w\-\/]+)/)?.[1];
          if (pkg) imports.add(pkg.split('/')[0]);
        }
      }
    }
  } catch (e) {
    // Skip
  }
}

function countFunctions(dir: string, counts: Map<string, number>): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        countFunctions(fullPath, counts);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = readFileSync(fullPath, 'utf-8');
        const functions = content.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(/g) || [];
        for (const func of functions) {
          const name = func.match(/\w+/)?.[0];
          if (name) {
            counts.set(name, (counts.get(name) || 0) + 1);
          }
        }
      }
    }
  } catch (e) {
    // Skip
  }
}

function findAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findAllFiles(fullPath, extensions));
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip
  }
  return files;
}

function checkIfImported(projectPath: string, fileName: string): boolean {
  try {
    // Cross-platform file search using Node.js fs instead of grep
    const baseFileName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
    const searchDirs = [
      join(projectPath, 'src'),
      join(projectPath, 'app')
    ].filter(dir => existsSync(dir));
    
    for (const searchDir of searchDirs) {
      const files = findAllFiles(searchDir, ['.ts', '.tsx', '.js', '.jsx']);
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const importRegex = new RegExp(`from\\s+['"].*${baseFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
        if (importRegex.test(content)) {
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    return true; // Assume imported if check fails
  }
}

function calculateTotalSize(projectPath: string): number {
  // Exclude directories that shouldn't be counted
  const excludeDirs = ['node_modules', 'cache', '.cache', 'static', 'chunks'];
  
  // Next.js production build paths (in priority order)
  const buildPaths = [
    { dir: join(projectPath, '.next', 'standalone'), priority: 1 },  // Production standalone
    { dir: join(projectPath, '.next', 'server'), priority: 2 },       // Server build
    { dir: join(projectPath, 'dist'), priority: 3 },                  // Generic dist
    { dir: join(projectPath, 'build'), priority: 4 },                 // Generic build
    { dir: join(projectPath, '.next'), priority: 5 }                  // Fallback (full .next)
  ];

  for (const { dir } of buildPaths) {
    if (existsSync(dir)) {
      const size = getDirSize(dir, excludeDirs);
      return Math.round(size / 1024); // KB
    }
  }

  return 0;
}

function generateBundleRecommendations(issues: BundleIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some(i => i.category === 'size')) {
    recommendations.push('📦 Reduce bundle size: Enable code splitting and lazy loading');
  }

  if (issues.some(i => i.category === 'unused')) {
    recommendations.push('🗑️ Remove unused dependencies: Run npx depcheck');
  }

  if (issues.some(i => i.category === 'duplication')) {
    recommendations.push('♻️ Eliminate code duplication: Extract shared utilities');
  }

  if (issues.some(i => i.category === 'dead-code')) {
    recommendations.push('💀 Remove dead code: Delete unused exports and files');
  }

  return recommendations;
}
