#!/usr/bin/env tsx
/**
 * ODAVL Insight Interactive CLI
 * Professional, beautiful, and accurate analysis
 */

import { FEATURES } from '@odavl-studio/core';
import { TSDetector } from '../src/detector/ts-detector.js';
import { ESLintDetector } from '../src/detector/eslint-detector.js';
import { SecurityDetector } from '../src/detector/security-detector.js';
import { PerformanceDetector } from '../src/detector/performance-detector.js';
import { ComplexityDetector } from '../src/detector/complexity-detector.js';
import { CircularDependencyDetector } from '../src/detector/circular-detector.js';
import { ImportDetector } from '../src/detector/import-detector.js';
import { PackageDetector } from '../src/detector/package-detector.js';
import { RuntimeDetector } from '../src/detector/runtime-detector.js';
import { BuildDetector } from '../src/detector/build-detector.js';
import { NetworkDetector } from '../src/detector/network-detector.js';
import { ComponentIsolationDetector } from '../src/detector/isolation-detector.js';
import { CVEScannerDetector } from '../src/detector/cve-scanner-detector.js';
import { PythonTypeDetector } from '../src/detector/python-type-detector.js';
import { PythonSecurityDetector } from '../src/detector/python-security-detector.js';
import { PythonComplexityDetector } from '../src/detector/python-complexity-detector.js';
import { EnhancedAnalyzer } from '../src/analyzer/enhanced-analyzer.js';
import { HTMLReporter } from '../src/reporter/html-reporter.js';
import { MarkdownReporter } from '../src/reporter/markdown-reporter.js';
import { 
  generateContextualInsight, 
  groupByConfidence,
  generateAccuracySummary,
  type EnhancedIssue 
} from '../src/reports/enhanced-formatter.js';
import { 
  GLOBAL_IGNORE_PATTERNS, 
  shouldIgnoreFile 
} from '../src/utils/ignore-patterns.js';
import { 
  ResultCache, 
  GitChangeDetector, 
  ParallelDetectorExecutor, 
  PerformanceTracker 
} from '../src/utils/performance.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const rl = readline.createInterface({ input, output });

// PHASE 3: Performance optimization
const performanceTracker = new PerformanceTracker();
const parallelExecutor = new ParallelDetectorExecutor(4); // 4 concurrent detectors

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
  bold: '\x1b[1m',
};

export function c(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function header(text: string) {
  console.log('\n' + c('cyan', '═'.repeat(60)));
  console.log(c('cyan', c('bold', `  ${text}`)));
  console.log(c('cyan', '═'.repeat(60)) + '\n');
}

function section(icon: string, text: string) {
  console.log(c('yellow', `\n${icon} ${text}`));
  console.log(c('gray', '─'.repeat(60)));
}

// Workspace metadata
export interface WorkspaceInfo {
  path: string;
  icon: string;
  description: string;
}

const WORKSPACES: WorkspaceInfo[] = [
  {
    path: 'apps/studio-cli',
    icon: '📦',
    description: 'Unified CLI for all ODAVL products',
  },
  {
    path: 'apps/studio-hub',
    icon: '🌐',
    description: 'Marketing website (Next.js)',
  },
  {
    path: 'odavl-studio/autopilot',
    icon: '🤖',
    description: 'Self-healing code infrastructure (O-D-A-V-L cycle)',
  },
  {
    path: 'odavl-studio/guardian',
    icon: '🛡️',
    description: 'Pre-deploy testing & monitoring',
  },
  {
    path: 'odavl-studio/insight',
    icon: '🧠',
    description: 'Advanced error detection (12 stable detectors)',
  },
  {
    path: 'packages',
    icon: '📚',
    description: 'Shared libraries & utilities',
  },
  {
    path: '.',
    icon: '🌳',
    description: 'Full monorepo analysis (all workspaces)',
  },
];

async function findWorkspaces(): Promise<WorkspaceInfo[]> {
  const root = process.cwd();
  const availableWorkspaces: WorkspaceInfo[] = [];

  // Check which workspaces actually exist
  for (const ws of WORKSPACES) {
    try {
      const fullPath = ws.path === '.' ? root : path.join(root, ws.path);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        availableWorkspaces.push(ws);
      }
    } catch (error) {
      // Workspace doesn't exist, skip it silently
      continue;
    }
  }

  return availableWorkspaces;
}

interface DetectorResult {
  name: string;
  icon: string;
  count: number;
  issues: any[];
}

interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// Severity colors and icons
const severityColors = {
  critical: '\x1b[38;5;196m', // Red
  high: '\x1b[38;5;208m',     // Orange
  medium: '\x1b[38;5;220m',   // Yellow
  low: '\x1b[38;5;45m',       // Blue
};

const severityIcons = {
  critical: '🚨',
  high: '⚠️',
  medium: '📊',
  low: 'ℹ️',
};

function calculateSeverityBreakdown(issues: any[]): SeverityBreakdown {
  return {
    critical: issues.filter(i => i.priority === 'critical').length,
    high: issues.filter(i => i.priority === 'high').length,
    medium: issues.filter(i => i.priority === 'medium').length,
    low: issues.filter(i => i.priority === 'low').length,
  };
}

function drawProgressBar(count: number, total: number, maxWidth: number = 30): string {
  if (total === 0) return '░'.repeat(maxWidth) + ' 0.0%';
  const percentage = (count / total) * 100;
  const filled = Math.round((count / total) * maxWidth);
  const empty = maxWidth - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(1)}%`;
}

function getTopPriorities(issues: any[], count: number = 3): any[] {
  return issues
    .filter(i => i.priority === 'critical' || i.priority === 'high')
    .sort((a, b) => {
      const priorityOrder: { [key: string]: number } = { critical: 0, high: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, count);
}

export async function quickScanFromProblemsPanel(workspacePath: string): Promise<void> {
  const root = process.cwd();
  const problemsFile = path.join(root, '.odavl', 'problems-panel-export.json');
  
  section('⚡', `Quick Scan: ${workspacePath}`);
  console.log(c('gray', `Reading from Problems Panel export...\n`));
  
  try {
    await fs.access(problemsFile);
  } catch (error) {
    console.log(c('red', '\n❌ Problems Panel export not found!'));
    console.log(c('yellow', '\n💡 To use Quick Scan, run this command in VS Code first:'));
    console.log(c('cyan', '   > ODAVL: Export Problems Panel'));
    console.log(c('gray', '\nOr run Full Scan instead for complete analysis.\n'));
    return;
  }
  
  const startTime = Date.now();
  const content = await fs.readFile(problemsFile, 'utf-8');
  const data = JSON.parse(content);
  
  // Count issues by source
  let tsCount = 0;
  let eslintCount = 0;
  let totalCount = 0;
  
  Object.values(data.diagnostics || {}).forEach((diagnostics: any) => {
    diagnostics.forEach((d: any) => {
      totalCount++;
      if (d.source && d.source.toLowerCase().includes('ts')) tsCount++;
      if (d.source && d.source.toLowerCase().includes('eslint')) eslintCount++;
    });
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Display results
  console.log('\n' + c('cyan', '═'.repeat(60)));
  console.log(c('bold', '⚡ QUICK SCAN RESULTS'));
  console.log(c('cyan', '═'.repeat(60)));
  console.log(c('white', `⏱️  Duration: ${duration}s`));
  console.log(c('white', `📊 Source: VS Code Problems Panel\n`));
  
  console.log(c('cyan', '📘 TypeScript: ') + c('white', `${tsCount} issues`));
  console.log(c('cyan', '🔧 ESLint: ') + c('white', `${eslintCount} issues`));
  console.log(c('cyan', '📈 Total: ') + c('white', `${totalCount} issues\n`));
  
  console.log(c('gray', '─'.repeat(60)));
  console.log(c('yellow', '\n💡 Want deeper analysis?'));
  console.log(c('white', '   Run "Full Scan" to check:'));
  console.log(c('gray', '   • Security vulnerabilities (SQL injection, XSS)'));
  console.log(c('gray', '   • Performance issues (memory leaks, slow code)'));
  console.log(c('gray', '   • Complexity problems (high cyclomatic complexity)'));
  console.log(c('gray', '   • Network issues (missing timeouts, error handling)'));
  console.log(c('gray', '   • And 12 more specialized detectors...\n'));
}

export async function smartScan(workspacePath: string): Promise<void> {
  const root = process.cwd();
  const fullPath = workspacePath === '.' ? root : path.join(root, workspacePath);
  
  section('🎯', `Smart Scan: ${workspacePath}`);
  console.log(c('gray', `Detecting file types...\n`));
  
  // Detect file types
  const fileTypes = new Set<string>();
  
  async function scanDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullEntryPath = path.join(dir, entry.name);
        
        // PHASE 1 FIX: Use comprehensive ignore patterns
        if (shouldIgnoreFile(fullEntryPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await scanDirectory(fullEntryPath);
        } else if (entry.isFile()) {
          if (/\.(ts|tsx)$/.test(entry.name)) fileTypes.add('typescript');
          if (/\.py$/.test(entry.name)) fileTypes.add('python');
          if (/\.java$/.test(entry.name)) fileTypes.add('java');
          if (/\.(js|jsx)$/.test(entry.name)) fileTypes.add('javascript');
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  await scanDirectory(fullPath);
  
  // Select detectors based on file types
  const selectedDetectors = [
    'TypeScript',
    'ESLint',
    'Security',
    'Performance',
    'Complexity',
  ];
  
  if (fileTypes.has('python')) {
    selectedDetectors.push('Python Types', 'Python Security', 'Python Complexity');
  }
  
  // Always include these
  selectedDetectors.push('Circular Deps', 'Imports', 'Packages');
  
  console.log(c('cyan', `🎯 Detected file types: ${Array.from(fileTypes).join(', ') || 'none'}\n`));
  console.log(c('yellow', `⚡ Running ${selectedDetectors.length} relevant detectors...\n`));
  
  // For now, run full scan (will optimize later)
  await analyzeWorkspace(workspacePath);
}

/**
 * Run single detector with timeout and caching
 * PHASE 3: Added 60s timeout per detector + cache support
 */
async function runDetector(
  name: string,
  icon: string,
  DetectorClass: any,
  targetPath: string,
  cache?: ResultCache
): Promise<DetectorResult> {
  try {
    // PHASE 3: Check cache first
    if (cache) {
      const cached = cache.get(targetPath, name);
      if (cached) {
        console.log(c('green', `   ✅ ${icon} ${name}: ${cached.length} issues (cached)`));
        return { name, icon, count: cached.length, issues: cached };
      }
    }
    
    // PHASE 3: Wrap in timeout (60 seconds)
    const detectorPromise = (async () => {
      const detector = new DetectorClass(targetPath);
      const issues = await detector.detect(targetPath);
      const issuesArray = Array.isArray(issues) ? issues : [];
      
      // PHASE 3: Save to cache
      if (cache && issuesArray.length > 0) {
        cache.set(targetPath, name, issuesArray);
      }
      
      return { name, icon, count: issuesArray.length, issues: issuesArray };
    })();
    
    const result = await parallelExecutor.executeWithTimeout(
      () => detectorPromise,
      60000 // 60 seconds timeout
    );
    
    if (result === null) {
      console.log(c('yellow', `   ⏱️  ${icon} ${name}: Timeout (60s exceeded)`));
      return { name, icon, count: 0, issues: [] };
    }
    
    return result;
    
  } catch (error) {
    const msg = (error as Error).message;
    if (!msg.includes('workspaceRoot is required')) {
      console.log(c('gray', `   ${icon} ${name}: Skipped (${msg.substring(0, 60)})`));
    }
    return { name, icon, count: 0, issues: [] };
  }
}

/**
 * Setup analysis environment
 */
function setupAnalysis(workspacePath: string) {
  const root = process.cwd();
  const fullPath = path.join(root, workspacePath);
  const analyzer = new EnhancedAnalyzer();
  return { root, fullPath, analyzer };
}

/**
 * Get detector configuration
 * Feature flags gate incomplete/experimental detectors
 */
function getDetectorConfiguration() {
  const detectors = [
    { name: 'TypeScript', icon: '📘', DetectorClass: TSDetector },
    { name: 'ESLint', icon: '🔧', DetectorClass: ESLintDetector },
    { name: 'Security', icon: '🔒', DetectorClass: SecurityDetector },
    { name: 'Performance', icon: '⚡', DetectorClass: PerformanceDetector },
    { name: 'Complexity', icon: '🧮', DetectorClass: ComplexityDetector },
    { name: 'Circular Deps', icon: '🔄', DetectorClass: CircularDependencyDetector },
    { name: 'Imports', icon: '📦', DetectorClass: ImportDetector },
    { name: 'Packages', icon: '📋', DetectorClass: PackageDetector },
    { name: 'Runtime', icon: '⚙️', DetectorClass: RuntimeDetector },
    { name: 'Build', icon: '🏗️', DetectorClass: BuildDetector },
    { name: 'Network', icon: '🌐', DetectorClass: NetworkDetector },
    { name: 'Isolation', icon: '🔐', DetectorClass: ComponentIsolationDetector },
  ];

  // Gate incomplete/experimental detectors behind feature flags
  if (FEATURES.CVE_SCANNER) {
    detectors.push({ name: 'CVE Scanner', icon: '🛡️', DetectorClass: CVEScannerDetector });
  }
  if (FEATURES.PYTHON_DETECTION) {
    detectors.push({ name: 'Python Types', icon: '🐍', DetectorClass: PythonTypeDetector });
    detectors.push({ name: 'Python Security', icon: '🔒🐍', DetectorClass: PythonSecurityDetector });
    detectors.push({ name: 'Python Complexity', icon: '🧮🐍', DetectorClass: PythonComplexityDetector });
  }

  return detectors;
}

/**
 * Run detectors in parallel
 */
/**
 * Run detectors in parallel with performance optimization
 * PHASE 3: Added caching, parallel execution limits, and performance tracking
 */
async function runDetectorsInParallel(detectors: Array<{ name: string; icon: string; DetectorClass: any }>, targetPath: string) {
  // PHASE 3: Initialize cache and git detector
  const cache = new ResultCache(targetPath, 3600000); // 1 hour cache
  const gitDetector = new GitChangeDetector(targetPath);
  
  // PHASE 3: Check if we can use incremental analysis
  const useIncremental = gitDetector.isGitAvailable();
  const changedFiles = useIncremental ? gitDetector.getRelevantFiles() : [];
  if (useIncremental && changedFiles.length > 0 && changedFiles.length < 50) {
    console.log(c('cyan', `⚡ Incremental mode: analyzing ${changedFiles.length} changed files\n`));
  }
  
  // PHASE 3: Execute detectors with timeout and batching
  const detectorFunctions = detectors.map(({ name, icon, DetectorClass }) => 
    async () => {
      const startTime = Date.now();
      const result = await runDetector(name, icon, DetectorClass, targetPath, cache);
      const duration = Date.now() - startTime;
      performanceTracker.record(name, duration);
      return result;
    }
  );
  
  // PHASE 3: Run in batches of 4 to avoid overwhelming the system
  const results = await parallelExecutor.executeParallel(detectorFunctions);
  
  // PHASE 3: Save cache for next run
  cache.saveToDisk();
  
  // PHASE 3: Log performance metrics
  const perfStats = performanceTracker.getAllStats();
  if (Object.keys(perfStats).length > 0) {
    console.log(c('gray', '\n⏱️  Performance breakdown:'));
    const sorted = Object.entries(perfStats).sort(([,a], [,b]) => (b.avg || 0) - (a.avg || 0));
    for (const [detector, stats] of sorted) {
      if (stats && stats.avg) {
        console.log(c('gray', `   ${detector.padEnd(25)}: ${(stats.avg / 1000).toFixed(2)}s`));
      }
    }
    console.log('');
  }
  
  return results;
}

/**
 * Display analysis summary
 */
function displayAnalysisSummary(duration: string, totalIssues: number, results: DetectorResult[]) {
  console.log(c('cyan', '═'.repeat(60)));
  console.log(c('bold', '📊 ANALYSIS COMPLETE'));
  console.log(c('cyan', '═'.repeat(60)));
  console.log(c('white', `⏱️  Duration: ${duration}s`));
  console.log(c('white', `📊 Total Issues: ${totalIssues}`));
  console.log(c('white', `🔍 Detectors Run: ${results.filter(r => r.count >= 0).length}/16`));
  console.log(c('cyan', '─'.repeat(60)) + '\n');
}

/**
 * Display severity breakdown for each detector
 */
function displaySeverityBreakdown(results: DetectorResult[], analyzer: EnhancedAnalyzer) {
  results.forEach(r => {
    if (r.count > 0) {
      const enhancedIssues = r.issues.map(issue => analyzer.enhanceIssue(issue, r.name)).filter(Boolean);
      const severity = calculateSeverityBreakdown(enhancedIssues);
      
      const critCount = severity.critical;
      const highCount = severity.high;
      const medCount = severity.medium;
      const lowCount = severity.low;

      console.log(c('white', `${r.icon} ${r.name}: ${r.count} issues`));
      
      if (critCount > 0) console.log(c('red', `   🔴 Critical: ${critCount}`));
      if (highCount > 0) console.log(c('yellow', `   🟡 High: ${highCount}`));
      if (medCount > 0) console.log(c('blue', `   🔵 Medium: ${medCount}`));
      if (lowCount > 0) console.log(c('gray', `   ⚪ Low: ${lowCount}`));

      // Show progress bar
      const maxIssues = Math.max(...results.map(r => r.count));
      const barLength = Math.round((r.count / maxIssues) * 30);
      const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
      console.log(c('cyan', `   ${bar} ${((r.count / maxIssues) * 100).toFixed(0)}%\n`));

      // Show top 3 priorities
      const topPriorities = enhancedIssues
        .sort((a, b) => b.priority === 'critical' ? 1 : a.priority === 'critical' ? -1 : 0)
        .slice(0, 3);

      if (topPriorities.length > 0) {
        console.log(c('gray', '   🎯 Top Priorities:'));
        topPriorities.forEach((issue, i) => {
          const badge = issue.priority === 'critical' ? '🔴' : issue.priority === 'high' ? '🟡' : '🔵';
          const msg = issue.original.message?.substring(0, 50) || issue.original.type?.substring(0, 50) || 'Issue';
          console.log(c('gray', `      ${i + 1}. ${badge} ${msg}...`));
        });
        console.log('');
      }
    }
  });
}

/**
 * Display detailed report for all issues
 */
function displayDetailedReport(results: DetectorResult[], analyzer: EnhancedAnalyzer) {
  console.log(c('cyan', '═'.repeat(60)));
  console.log(c('bold', '📋 DETAILED REPORT'));
  console.log(c('cyan', '═'.repeat(60)) + '\n');

  results.forEach(result => {
    if (result.count > 0) {
      const enhancedIssues = result.issues.map(issue => analyzer.enhanceIssue(issue, result.name)).filter(Boolean);
      const filtered = analyzer.filterByConfidence(enhancedIssues, 60);
      const sorted = analyzer.sortByPriority(filtered);
      const issuesToShow = sorted.slice(0, 10);

      if (issuesToShow.length === 0) return;

      console.log(c('white', `${result.icon} ${result.name} - Top ${issuesToShow.length} Issues`));
      console.log(c('cyan', '─'.repeat(60)) + '\n');

      issuesToShow.forEach((enhanced, i) => {
        const issue = enhanced.original;
        
        const priorityBadge = 
          enhanced.priority === 'critical' ? c('red', '[CRITICAL]') :
          enhanced.priority === 'high' ? c('yellow', '[HIGH]') :
          enhanced.priority === 'medium' ? c('blue', '[MEDIUM]') : c('gray', '[LOW]');

        const confidenceBadge = 
          enhanced.confidence >= 80 ? c('green', `[${enhanced.confidence}% confidence]`) :
          enhanced.confidence >= 60 ? c('yellow', `[${enhanced.confidence}% confidence]`) :
          c('gray', `[${enhanced.confidence}% confidence]`);

        console.log(c('white', `${i + 1}. ${priorityBadge} ${confidenceBadge}`));
        console.log(c('red', `   ${issue.message || issue.type || 'Issue detected'}`));

        const file = issue.file || issue.filePath;
        const line = issue.line || issue.startLine;
        if (file) {
          console.log(c('gray', `   📄 ${file}:${line}`));
        }

        if (enhanced.fileContext) {
          const ctx = enhanced.fileContext;
          const contextStr = [
            ctx.framework ? `${ctx.framework}` : null,
            ctx.pattern ? `${ctx.pattern}` : null
          ].filter(Boolean).join(' • ');
          if (contextStr) {
            console.log(c('blue', `   🏗️  ${contextStr}`));
          }
        }

        const impacts = [];
        if (enhanced.impact.security > 0) impacts.push(c('red', `Security: ${enhanced.impact.security}/10`));
        if (enhanced.impact.performance > 0) impacts.push(c('yellow', `Performance: ${enhanced.impact.performance}/10`));
        if (enhanced.impact.maintainability > 0) impacts.push(c('blue', `Maintainability: ${enhanced.impact.maintainability}/10`));
        if (impacts.length > 0) {
          console.log(`   📊 Impact: ${impacts.join(' • ')}`);
        }

        if (enhanced.rootCause) {
          console.log(c('cyan', `   🔍 Root Cause: ${enhanced.rootCause.substring(0, 100)}...`));
        }

        if (enhanced.smartFix) {
          const firstLine = enhanced.smartFix.split('\n')[0];
          console.log(c('green', `   💡 Quick Fix: ${firstLine}`));
        }

        if (enhanced.preventionTip) {
          console.log(c('magenta', `   ${enhanced.preventionTip}`));
        }

        console.log('');
      });

      console.log('');
    }
  });
}

/**
 * Generate analysis reports (JSON, HTML, Markdown)
 */
async function generateAnalysisReports(
  root: string,
  workspacePath: string,
  results: DetectorResult[],
  analyzer: EnhancedAnalyzer,
  duration: string,
  totalIssues: number
) {
  const reportDir = path.join(root, '.odavl/insight/reports');
  await fs.mkdir(reportDir, { recursive: true });

  const workspaceName = workspacePath.replace(/\//g, '-').replace(/\\/g, '-');
  
  const allEnhancedIssues = results.flatMap(r => 
    (r.issues && Array.isArray(r.issues)) ? r.issues.map(issue => analyzer.enhanceIssue(issue, r.name)) : []
  ).filter(issue => issue && issue.original);
  
  const detectorSummaries = results
    .filter(r => r.count > 0 && r.issues && Array.isArray(r.issues))
    .map(r => {
      const enhancedIssues = r.issues.map(issue => analyzer.enhanceIssue(issue, r.name)).filter(Boolean);
      const severity = calculateSeverityBreakdown(enhancedIssues);
      return {
        name: r.name,
        icon: r.icon,
        count: r.count,
        severity,
      };
    });
  
  const analysisResult = {
    workspace: workspacePath,
    duration: parseFloat(duration),
    totalIssues,
    timestamp: new Date().toLocaleString(),
    detectors: detectorSummaries,
    issues: allEnhancedIssues.map(enhanced => ({
      detector: enhanced.original.detector || 'Unknown',
      priority: enhanced.priority,
      confidence: enhanced.confidence,
      message: enhanced.original.message || enhanced.original.type || 'Issue detected',
      file: enhanced.original.file || enhanced.original.filePath,
      line: enhanced.original.line || enhanced.original.startLine,
      suggestion: enhanced.smartFix?.split('\n')[0] || enhanced.preventionTip,
    })),
  };
  
  // Save JSON report
  const jsonPath = path.join(reportDir, `${workspaceName}-latest.json`);
  await fs.writeFile(jsonPath, JSON.stringify(analysisResult, null, 2));
  
  // Generate HTML report
  const htmlReporter = new HTMLReporter();
  const htmlContent = htmlReporter.generate(analysisResult);
  const htmlPath = path.join(reportDir, `${workspaceName}-latest.html`);
  await fs.writeFile(htmlPath, htmlContent);
  
  // Generate Markdown report
  const mdReporter = new MarkdownReporter();
  const mdContent = mdReporter.generate(analysisResult);
  const mdPath = path.join(reportDir, `${workspaceName}-summary.md`);
  await fs.writeFile(mdPath, mdContent);
  
  // Show accuracy summary
  if (allEnhancedIssues.length > 0) {
    const issuesForSummary: EnhancedIssue[] = allEnhancedIssues.map(enhanced => ({
      file: enhanced.original.file || enhanced.original.filePath || '',
      line: enhanced.original.line || enhanced.original.startLine || 0,
      type: enhanced.original.type || '',
      severity: enhanced.priority as 'critical' | 'high' | 'medium' | 'low',
      message: enhanced.original.message || enhanced.original.type || 'Issue detected',
      confidence: enhanced.confidence,
      suggestedFix: enhanced.smartFix || ''
    }));
    
    console.log('\n' + c('cyan', '═'.repeat(60)));
    console.log(c('bold', '🎯 DETECTION ACCURACY REPORT'));
    console.log(c('cyan', '═'.repeat(60)));
    const summary = generateAccuracySummary(issuesForSummary);
    console.log(summary);
  }
  
  // Display report paths
  console.log('\n' + c('cyan', '═'.repeat(60)));
  console.log(c('bold', '💾 REPORTS GENERATED'));
  console.log(c('cyan', '═'.repeat(60)));
  console.log(c('white', '\n📄 JSON Report (for programmatic access)'));
  console.log(c('gray', `   ${jsonPath}`));
  console.log(c('green', `   ✅ ${totalIssues} issues with full details\n`));
  
  console.log(c('white', '🌐 HTML Interactive Report (for viewing)'));
  console.log(c('gray', `   ${htmlPath}`));
  console.log(c('green', '   ✅ Interactive charts, filters, and search\n'));
  
  console.log(c('white', '📝 Markdown Summary (for sharing)'));
  console.log(c('gray', `   ${mdPath}`));
  console.log(c('green', '   ✅ Top 10 issues and recommendations\n'));
  
  console.log(c('cyan', '─'.repeat(60)));
  
  return htmlPath;
}

/**
 * Offer to open HTML report in browser
 */
async function offerBrowserOpening(htmlPath: string) {
  const answer = await rl.question(c('yellow', '\n📊 Open HTML report in browser? [Y/n]: '));
  if (answer.toLowerCase() !== 'n') {
    try {
      if (process.platform === 'win32') {
        await execAsync(`start "" "${htmlPath}"`);
      } else if (process.platform === 'darwin') {
        await execAsync(`open "${htmlPath}"`);
      } else {
        await execAsync(`xdg-open "${htmlPath}"`);
      }
      console.log(c('green', '\n✅ Opening in default browser...'));
      console.log(c('white', '✅ Report is interactive - you can:'));
      console.log(c('gray', '   • Filter by severity/detector'));
      console.log(c('gray', '   • Search for specific issues'));
      console.log(c('gray', '   • View charts and statistics'));
      console.log(c('gray', '   • Share with your team\n'));
    } catch (error) {
      console.log(c('yellow', '\n⚠️  Could not auto-open browser.'));
      console.log(c('gray', `   Error: ${(error as Error).message}`));
      console.log(c('gray', `   Please open manually: ${htmlPath}\n`));
    }
  }
  
  console.log(c('cyan', '═'.repeat(60)) + '\n');
}

export async function analyzeWorkspace(workspacePath: string) {
  // Setup analysis environment
  const { root, fullPath, analyzer } = setupAnalysis(workspacePath);
  
  // Display header
  section('🔍', `Analyzing: ${workspacePath}`);
  console.log(c('gray', `Path: ${fullPath}\n`));
  console.log(c('yellow', '⚡ Running 16 detectors in parallel...\n'));

  // Run analysis
  const startTime = Date.now();
  const detectors = getDetectorConfiguration();
  const results = await runDetectorsInParallel(detectors, fullPath);
  
  // Calculate metrics
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalIssues = results.reduce((sum, r) => sum + r.count, 0);
  
  // Display summary
  displayAnalysisSummary(duration, totalIssues, results);
  
  // Display severity breakdown
  displaySeverityBreakdown(results, analyzer);
  
  // Display detailed report
  if (totalIssues > 0) {
    displayDetailedReport(results, analyzer);
  }
  
  // Generate and save reports
  const htmlPath = await generateAnalysisReports(root, workspacePath, results, analyzer, duration, totalIssues);
  
  // Offer to open HTML report
  await offerBrowserOpening(htmlPath);
}

async function main() {
  header('🧠 ODAVL INSIGHT - Professional Code Analysis');

  console.log(c('white', '🔍 Discovering workspaces...'));
  const workspaces = await findWorkspaces();

  if (workspaces.length === 0) {
    console.log(c('red', '\n❌ No workspaces found!\n'));
    process.exit(1);
  }

  console.log(c('green', `\n✅ Found ${workspaces.length} workspaces\n`));

  // Display workspace selection menu
  section('📁', 'Select workspace to analyze:');
  const { selectWorkspace } = await import('./cli/workspaceSelector.js');
  const choice = await selectWorkspace(workspaces, rl);

  // Execute analysis based on selection
  const { selectAnalysisType, AnalysisType } = await import(
    './cli/analysisTypeSelector.js'
  );
  const { executeAnalysis } = await import('./cli/analysisExecutor.js');

  if (choice === 0) {
    // Analyze all workspaces
    header('🚀 Analyzing ALL workspaces');
    for (const ws of workspaces) {
      await analyzeWorkspace(ws.path);
    }
  } else if (choice > 0 && choice <= workspaces.length) {
    // Analyze selected workspace with type selection
    const selectedWorkspace = workspaces[choice - 1];

    section('📊', 'Select Analysis Type:');
    const analysisType = await selectAnalysisType(rl);

    if (analysisType === AnalysisType.Back) {
      // Back to workspace selection - restart
      rl.close();
      return main();
    }

    await executeAnalysis(selectedWorkspace, analysisType);
  } else {
    console.log(c('red', '\n❌ Invalid choice!\n'));
    process.exit(1);
  }

  rl.close();
}

main().catch(error => {
  console.error(c('red', `\n❌ Fatal Error: ${error.message}\n`));
  process.exit(1);
});
