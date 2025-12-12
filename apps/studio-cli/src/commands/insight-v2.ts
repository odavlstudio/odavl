/**
 * ODAVL Insight v2 - Production CLI Integration
 * Wave 4: Schema finalization, performance, and hardening
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import { AnalysisEngine } from '../../../../odavl-studio/insight/core/src/analysis-engine.js';
import { 
  ParallelDetectorExecutor, 
  SequentialDetectorExecutor,
  FileParallelDetectorExecutor // Wave 11: File-level parallelism
} from '../../../../odavl-studio/insight/core/src/detector-executor.js';
import { loadDetector, type DetectorName } from '../../../../odavl-studio/insight/core/src/detector/detector-loader.js';
import { PerformanceTimer } from '../../../../odavl-studio/insight/core/src/utils/performance-timer.js';
import { ResultCache } from '../../../../odavl-studio/insight/core/src/utils/result-cache.js';

/**
 * Unified Insight issue schema (Wave 4)
 * Used across CLI, reports, VS Code extension, and Autopilot integration
 */
export interface InsightIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}

export interface AnalyzeOptions {
  detectors?: string;
  severity?: string;
  json?: boolean;
  html?: boolean;
  md?: boolean;
  output?: string;
  files?: string;
  dir?: string;
  strict?: boolean;
  debug?: boolean;
  silent?: boolean;
  progress?: boolean; // Wave 10 Enhanced: Show progress updates
  maxWorkers?: number; // Wave 10 Enhanced: Parallel execution concurrency
  mode?: 'sequential' | 'parallel' | 'file-parallel'; // Wave 11: Added file-parallel mode
  useWorkerPool?: boolean; // Wave 10 Enhanced: Use worker pool (vs Promise.all)
  fileParallel?: boolean; // Wave 11: Shorthand flag for file-level parallelism
}

// Performance: Cache workspace root and file lists
const workspaceCache = new Map<string, string[]>();

// Performance: Result cache for analysis
const resultCache = new ResultCache<{ issues: InsightIssue[]; fileCount: number }>();

export async function analyze(options: AnalyzeOptions = {}) {
  const startTime = Date.now();
  const workspaceRoot = options.dir || process.cwd();
  const perfTimer = new PerformanceTimer();

  if (!options.silent) {
    console.log(chalk.cyan('🔍 ODAVL Insight Analysis\n'));
    console.log(chalk.gray('Loading detectors...'));
  }

  try {
    // Collect files to analyze (with caching)
    perfTimer.startPhase('collectFiles');
    const cacheKey = `${workspaceRoot}:${options.files || 'default'}`;
    let files = workspaceCache.get(cacheKey);
    
    if (!files) {
      files = await collectFiles(workspaceRoot, options.files);
      workspaceCache.set(cacheKey, files);
    }
    perfTimer.endPhase('collectFiles');
    
    if (files.length === 0) {
      console.log(chalk.yellow('No files found to analyze'));
      return;
    }

    // Check result cache
    const resultCacheKey = ResultCache.generateKey([
      workspaceRoot,
      options.detectors || 'default',
      options.severity || 'low',
      files.length.toString(),
    ]);
    
    const cached = resultCache.get(resultCacheKey);
    if (cached && options.debug) {
      console.log(chalk.gray('(cache hit - skipping detector execution)'));
    }

    if (!options.silent) {
      console.log(chalk.gray(`Scanning ${files.length} files...`));
    }

    if (options.debug) {
      console.log(chalk.gray(`Files to analyze: ${files.length}`));
    }

    // Use cached results if available, otherwise run analysis
    let filteredIssues: InsightIssue[];
    
    if (cached) {
      // Cache hit - skip all detector execution
      filteredIssues = cached.issues;
    } else {
      // Cache miss - run full analysis
      
      // Wave 11: Determine execution mode with file-parallel support
      let mode = options.mode || (options.maxWorkers ? 'parallel' : 'sequential');
      
      // Wave 11: --file-parallel flag overrides mode
      if (options.fileParallel) {
        mode = 'file-parallel';
      }
      
      const useWorkerPool = options.useWorkerPool ?? false;
      const workerCount = options.maxWorkers || 4;
      
      if (!options.silent) {
        const modeLabel = mode === 'file-parallel'
          ? `file-parallel (${workerCount} workers, 4-16x speedup)`
          : mode === 'parallel' 
          ? `parallel (${workerCount} workers${useWorkerPool ? ', worker pool' : ''})` 
          : 'sequential';
        console.log(chalk.gray(`Running detectors (${modeLabel})...`));
      }
      
      // Wave 10 Enhanced: Progress callback
      const showProgress = options.progress || options.debug;
      let lastProgressTime = Date.now();
      const onProgress = showProgress ? (event: any) => {
        const now = Date.now();
        // Throttle progress updates to every 500ms
        if (now - lastProgressTime < 500 && event.phase !== 'complete') return;
        lastProgressTime = now;
        
        if (event.phase === 'runDetectors' && event.completed && event.total) {
          const percent = Math.round((event.completed / event.total) * 100);
          console.log(chalk.gray(`  Progress: ${event.completed}/${event.total} detectors (${percent}%)`));
        } else if (event.message && event.phase !== 'runDetectors') {
          console.log(chalk.gray(`  ${event.message}`));
        }
      } : undefined;
      
      perfTimer.startPhase('runDetectors');
      let results: any[] = [];
      let engine: AnalysisEngine | null = null;
      try {
        // Wave 11: Create executor based on mode (now supports file-parallel)
        let executor;
        if (mode === 'file-parallel') {
          // Wave 11: File-level parallelism with worker pool
          executor = new FileParallelDetectorExecutor({ 
            maxWorkers: workerCount,
            useWorkerPool: true, // Always use worker pool for file-parallel
            verbose: options.debug ?? false
          });
        } else if (mode === 'parallel') {
          // Wave 10: Detector-level parallelism
          executor = new ParallelDetectorExecutor({ 
            maxConcurrency: workerCount,
            useWorkerPool 
          });
        } else {
          // Default: Sequential execution
          executor = new SequentialDetectorExecutor();
        }
        
        engine = new AnalysisEngine(executor, { onProgress });
        results = await engine.analyze(files);
        
        // Cleanup
        await engine.shutdown();
      } catch (error: any) {
        if (options.debug) {
          console.error(chalk.red('Detector execution failed:'), error);
        } else {
          console.error(chalk.red('Some detectors failed. Run with --debug for details.'));
        }
        // Continue with empty results if analysis completely fails
        results = [];
        
        // Cleanup on error
        if (engine) {
          await engine.shutdown().catch(() => {});
        }
      }
      perfTimer.endPhase('runDetectors');

      if (!options.silent) {
        console.log(chalk.gray('Aggregating results...'));
      }

      perfTimer.startPhase('aggregateResults');
      
      // Collect all issues and normalize to unified schema with safety checks
      const allIssues: InsightIssue[] = results.flatMap(r => {
        if (!r.issues || !Array.isArray(r.issues)) return [];
        return r.issues.map(issue => ({
          file: r.file || 'unknown',
          line: issue.line || 0,
          column: issue.column || 0,
          message: issue.message || 'No message provided',
          severity: normalizeSeverity(issue.severity),
          detector: (issue.detector || 'unknown').toLowerCase(),
          ruleId: issue.code,
          suggestedFix: issue.suggestedFix,
        }));
      });

      // Filter by severity
      const minSeverity = options.severity || 'low';
      filteredIssues = filterBySeverity(allIssues, minSeverity);

      // Filter by detectors
      if (options.detectors) {
        const detectorList = options.detectors.split(',');
        filteredIssues = filteredIssues.filter(i => detectorList.includes(i.detector));
      }
      
      // Cache the results
      resultCache.set(resultCacheKey, { issues: filteredIssues, fileCount: files.length });
      
      perfTimer.endPhase('aggregateResults');
    }

    // Display summary
    if (!options.silent) {
      displaySummary(filteredIssues, files.length, Date.now() - startTime);
    }

    // Generate reports
    perfTimer.startPhase('generateReports');
    if (!options.silent && (options.json || options.html || options.md)) {
      console.log(chalk.gray('\nGenerating reports...'));
    }
    
    const reportsDir = path.join(workspaceRoot, '.odavl/reports');
    await fs.mkdir(reportsDir, { recursive: true });

    if (options.json || options.output?.endsWith('.json')) {
      const jsonPath = options.output || path.join(reportsDir, 'insight-latest.json');
      await generateJSONReport(filteredIssues, jsonPath, files.length, Date.now() - startTime);
      if (!options.silent) console.log(chalk.green(`✓ JSON report: ${jsonPath}`));
    }

    if (options.html) {
      const htmlPath = options.output || path.join(reportsDir, 'insight-latest.html');
      await generateHTMLReport(filteredIssues, htmlPath, files.length, Date.now() - startTime);
      if (!options.silent) console.log(chalk.green(`✓ HTML report: ${htmlPath}`));
    }

    if (options.md) {
      const mdPath = options.output || path.join(reportsDir, 'insight-latest.md');
      await generateMarkdownReport(filteredIssues, mdPath, files.length, Date.now() - startTime);
      if (!options.silent) console.log(chalk.green(`✓ Markdown report: ${mdPath}`));
    }
    perfTimer.endPhase('generateReports');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green(`✓ Analysis complete in ${elapsed}s`));
    
    // Show phase breakdown in debug mode
    if (options.debug) {
      console.log(chalk.gray('\nPhase Breakdown:'));
      console.log(chalk.gray(perfTimer.getSummary()));
    }
    console.log('');

    // Exit with error if strict mode and issues found
    if (options.strict && filteredIssues.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    if (options.debug) {
      console.error(chalk.red('Analysis failed:'), error);
    } else {
      console.error(chalk.red('Analysis failed. Run with --debug for details.'));
    }
    process.exit(1);
  }
}

/**
 * Normalize severity to lowercase standard format
 */
function normalizeSeverity(severity: any): 'info' | 'low' | 'medium' | 'high' | 'critical' {
  if (typeof severity === 'number') {
    if (severity >= 4) return 'critical';
    if (severity === 3) return 'high';
    if (severity === 2) return 'medium';
    if (severity === 1) return 'low';
    return 'info';
  }
  const str = String(severity || 'medium').toLowerCase();
  if (str === 'critical' || str === 'high' || str === 'medium' || str === 'low' || str === 'info') {
    return str as any;
  }
  return 'medium';
}

function filterBySeverity(issues: InsightIssue[], minSeverity: string): InsightIssue[] {
  const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];
  const minIndex = severityLevels.indexOf(minSeverity);
  return issues.filter(i => severityLevels.indexOf(i.severity) >= minIndex);
}

function displaySummary(issues: InsightIssue[], fileCount: number, elapsed: number) {
  console.log(chalk.bold('\n📊 Analysis Summary\n'));
  console.log(chalk.white(`Files analyzed: ${fileCount}`));
  console.log(chalk.white(`Total issues: ${issues.length}`));
  
  // Severity breakdown
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;
  const info = issues.filter(i => i.severity === 'info').length;

  console.log(chalk.white('\nBy Severity:'));
  if (critical > 0) console.log(chalk.red(`  Critical: ${critical}`));
  if (high > 0) console.log(chalk.red(`  High: ${high}`));
  if (medium > 0) console.log(chalk.yellow(`  Medium: ${medium}`));
  if (low > 0) console.log(chalk.blue(`  Low: ${low}`));
  if (info > 0) console.log(chalk.gray(`  Info: ${info}`));

  // Detector breakdown
  const detectorCounts: Record<string, number> = {};
  for (const issue of issues) {
    detectorCounts[issue.detector] = (detectorCounts[issue.detector] || 0) + 1;
  }

  console.log(chalk.white('\nBy Detector:'));
  for (const [detector, count] of Object.entries(detectorCounts).sort((a, b) => b[1] - a[1])) {
    console.log(chalk.gray(`  ${detector}: ${count}`));
  }

  console.log(chalk.white(`\nTime elapsed: ${(elapsed / 1000).toFixed(2)}s`));
}

async function generateJSONReport(issues: InsightIssue[], outputPath: string, fileCount: number, elapsed: number) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesAnalyzed: fileCount,
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      info: issues.filter(i => i.severity === 'info').length,
      elapsedMs: elapsed,
    },
    issues,
  };
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

async function generateHTMLReport(issues: InsightIssue[], outputPath: string, fileCount: number, elapsed: number) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>ODAVL Insight Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .issue { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ccc; }
    .critical { border-left-color: #d32f2f; }
    .high { border-left-color: #f57c00; }
    .medium { border-left-color: #fbc02d; }
    .low { border-left-color: #1976d2; }
    .info { border-left-color: #757575; }
  </style>
</head>
<body>
  <h1>ODAVL Insight Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Files analyzed: ${fileCount}</p>
    <p>Total issues: ${issues.length}</p>
    <p>Time: ${(elapsed / 1000).toFixed(2)}s</p>
  </div>
  ${issues.map(i => `<div class="issue ${i.severity}"><strong>${i.severity.toUpperCase()}</strong>: ${i.message} <br><small>${i.file}:${i.line}</small></div>`).join('')}
</body>
</html>`;
  await fs.writeFile(outputPath, html, 'utf-8');
}

async function generateMarkdownReport(issues: InsightIssue[], outputPath: string, fileCount: number, elapsed: number) {
  const md = `# ODAVL Insight Report

## Summary

- **Files analyzed**: ${fileCount}
- **Total issues**: ${issues.length}
- **Time**: ${(elapsed / 1000).toFixed(2)}s

## Issues

${issues.map(i => `### ${i.severity.toUpperCase()}: ${i.message}\n\n**File**: ${i.file}:${i.line}\n**Detector**: ${i.detector}\n`).join('\n')}
`;
  await fs.writeFile(outputPath, md, 'utf-8');
}

/**
 * Auto-discover detectors by scanning filesystem
 * Wave 4: Dynamic detection of all *-detector.ts files
 */
export async function listDetectors() {
  console.log(chalk.cyan('🔍 Available Detectors\n'));
  
  try {
    const detectorDir = path.join(process.cwd(), 'odavl-studio/insight/core/src/detector');
    const detectorFiles = glob.sync(`${detectorDir}/*-detector.{ts,js}`, {
      absolute: false,
      ignore: ['**/*.test.*', '**/*.spec.*'],
    });
    
    const detectors = detectorFiles
      .map(f => path.basename(f).replace(/-detector\.(ts|js)$/, ''))
      .filter(d => !d.includes('test') && !d.includes('spec'))
      .sort();
    
    if (detectors.length === 0) {
      // Fallback to known detectors if filesystem scan fails
      const fallback = [
        'typescript', 'eslint', 'security', 'performance', 'complexity',
        'import', 'python-type', 'python-security', 'python-complexity',
        'java', 'go', 'rust', 'advanced-runtime', 'architecture', 'build',
        'cicd', 'circular', 'database', 'infrastructure', 'isolation',
        'ml-model', 'network', 'nextjs', 'package', 'runtime'
      ].sort();
      
      fallback.forEach(d => console.log(chalk.white(`  • ${d}`)));
      console.log(chalk.gray(`\nTotal: ${fallback.length} detectors`));
    } else {
      detectors.forEach(d => console.log(chalk.white(`  • ${d}`)));
      console.log(chalk.gray(`\nTotal: ${detectors.length} detectors`));
    }
  } catch (error) {
    console.error(chalk.yellow('Failed to auto-discover detectors'));
    console.error(chalk.gray('Using static list instead'));
  }
}

export async function showStats() {
  const workspaceRoot = process.cwd();
  const reportPath = path.join(workspaceRoot, '.odavl/reports/insight-latest.json');
  
  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    const report = JSON.parse(content);
    
    console.log(chalk.cyan('📊 Latest Analysis Stats\n'));
    console.log(chalk.white(`Timestamp: ${report.timestamp}`));
    console.log(chalk.white(`Files: ${report.summary.filesAnalyzed}`));
    console.log(chalk.white(`Issues: ${report.summary.totalIssues}`));
    console.log(chalk.white(`Time: ${(report.summary.elapsedMs / 1000).toFixed(2)}s`));
  } catch {
    console.log(chalk.yellow('No analysis data found. Run "odavl insight analyze" first.'));
  }
}

export async function generateReport(format: string) {
  const workspaceRoot = process.cwd();
  const reportPath = path.join(workspaceRoot, '.odavl/reports/insight-latest.json');
  
  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    const report = JSON.parse(content);
    
    if (format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(chalk.yellow(`Format "${format}" not yet implemented. Use --json, --html, or --md flags with analyze command.`));
    }
  } catch {
    console.log(chalk.yellow('No analysis data found. Run "odavl insight analyze" first.'));
  }
}

/**
 * Collect files with comprehensive ignore patterns
 * Wave 4: Enhanced with common ignore directories and better deduplication
 */
async function collectFiles(root: string, pattern?: string): Promise<string[]> {
  const defaultPatterns = [
    '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
    '**/*.py', '**/*.go', '**/*.rs', '**/*.java'
  ];
  const patterns = pattern ? pattern.split(',').map(p => p.trim()) : defaultPatterns;
  
  // Comprehensive ignore list
  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/build/**',
    '**/.git/**',
    '**/out/**',
    '**/coverage/**',
    '**/.odavl/**',
    '**/reports/**',
    '**/*.min.js',
    '**/*.bundle.js',
    '**/vendor/**',
    '**/__pycache__/**',
    '**/.pytest_cache/**',
    '**/target/**', // Rust/Java build
  ];
  
  const allFiles: string[] = [];

  for (const p of patterns) {
    try {
      const matches = glob.sync(`${root}/${p}`, {
        absolute: true,
        ignore: ignorePatterns,
        dot: false, // Skip dot files
      });
      allFiles.push(...matches);
    } catch (error) {
      console.warn(chalk.yellow(`Invalid pattern: ${p}`));
    }
  }

  return [...new Set(allFiles)]; // Deduplicate
}
