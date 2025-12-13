/**
 * ODAVL Insight v2 - Production CLI Integration
 * Wave 4: Schema finalization, performance, and hardening
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import ora from 'ora';
import { AnalysisEngine } from '../../../../odavl-studio/insight/core/src/analysis-engine.js';
import { 
  ParallelDetectorExecutor, 
  SequentialDetectorExecutor,
  FileParallelDetectorExecutor // Wave 11: File-level parallelism
} from '../../../../odavl-studio/insight/core/src/detector-executor.js';
import { loadDetector, type DetectorName, getDetectorMetadata } from '../../../../odavl-studio/insight/core/src/detector/detector-loader.js';
import { PerformanceTimer } from '../../../../odavl-studio/insight/core/src/utils/performance-timer.js';
import { ResultCache } from '../../../../odavl-studio/insight/core/src/utils/result-cache.js';
import { IncrementalCache } from '../../../../odavl-studio/insight/core/src/utils/incremental-cache.js'; // Phase 1.4.2
import * as fmt from '../utils/cli-formatter.js'; // Phase 1.5: Polished output formatting
import { sanitizeIssues, generatePrivacyReport } from '../utils/privacy-sanitizer.js'; // Phase 2.1: Privacy filtering
import { uploadSnapshot, formatSnapshotResult, type Issue } from '../utils/snapshot-uploader.js'; // TASK 7: Hardened cloud upload
import { generateSarif } from '../utils/sarif-generator.js'; // Phase 2.2 Task 6: SARIF generation

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
  sarif?: boolean; // Phase 1.5: SARIF v2.1.0 export
  html?: boolean;
  md?: boolean;
  output?: string;
  files?: string;
  dir?: string;
  strict?: boolean;
  debug?: boolean;
  debugPerf?: boolean; // Phase 1.4.1: Detailed performance breakdown
  silent?: boolean;
  progress?: boolean; // Wave 10 Enhanced: Show progress updates
  maxWorkers?: number; // Wave 10 Enhanced: Parallel execution concurrency
  mode?: 'sequential' | 'parallel' | 'file-parallel'; // Wave 11: Added file-parallel mode
  useWorkerPool?: boolean; // Wave 10 Enhanced: Use worker pool (vs Promise.all)
  fileParallel?: boolean; // Wave 11: Shorthand flag for file-level parallelism
  privacyMode?: 'on' | 'off'; // Phase 2.1: Privacy sanitization (default: on)
  upload?: boolean; // Phase 2.2: Upload to ODAVL Cloud
}

// Performance: Cache workspace root and file lists
const workspaceCache = new Map<string, string[]>();

// Performance: Result cache for analysis
const resultCache = new ResultCache<{ issues: InsightIssue[]; fileCount: number }>();

export async function analyze(options: AnalyzeOptions = {}) {
  const startTime = Date.now();
  const workspaceRoot = options.dir || process.cwd();
  const perfTimer = new PerformanceTimer();
  
  // Phase 1.3: Reset exit code at start (clean slate)
  process.exitCode = 0;

  if (!options.silent) {
    console.log('');
    console.log(chalk.cyan.bold('🔍 ODAVL Insight Analysis'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  }
  
  // Start spinner for initial setup
  const spinner = options.silent ? null : ora({
    text: 'Initializing analysis...',
    color: 'cyan'
  }).start();

  try {
    // Collect files to analyze (with caching)
    perfTimer.startPhase('collectFiles');
    const cacheKey = `${workspaceRoot}:${options.files || 'default'}`;
    let files = workspaceCache.get(cacheKey);
    
    // Phase 1.4.1: Track cache hit/miss
    perfTimer.startPhase('checkCache');
    if (!files) {
      perfTimer.recordCacheMiss();
      if (spinner) spinner.text = 'Scanning workspace files...';
      files = await collectFiles(workspaceRoot, options.files);
      workspaceCache.set(cacheKey, files);
    } else {
      perfTimer.recordCacheHit();
      if (spinner) spinner.text = 'Using cached file list...';
    }
    perfTimer.endPhase('checkCache');
    perfTimer.endPhase('collectFiles');
    
    if (files.length === 0) {
      if (spinner) spinner.fail('No files found to analyze');
      else console.log(chalk.yellow('No files found to analyze'));
      return;
    }
    
    if (spinner) spinner.succeed(`Found ${files.length} files to analyze`);
    
    // Phase 1.4.2: Incremental analysis - detect changed files
    perfTimer.startPhase('incrementalCheck');
    const analysisSpinner = options.silent ? null : ora('Checking for changed files...').start();
    const incrementalCache = new IncrementalCache(workspaceRoot);
    await incrementalCache.load();
    
    const { changed, unchanged, newHashes } = await incrementalCache.detectChanges(files);
    const useIncremental = changed.length < files.length; // Only use if some files unchanged
    
    if (analysisSpinner) {
      if (unchanged.length > 0) {
        analysisSpinner.succeed(`${changed.length} files changed, ${unchanged.length} cached`);
      } else {
        analysisSpinner.succeed(`Analyzing ${files.length} files`);
      }
    }
    
    perfTimer.endPhase('incrementalCheck');
    perfTimer.recordIncremental(unchanged.length, changed.length, 0); // Will update skipped count later

    // Phase 1.5: Track skipped detectors for summary
    let detectorsSkippedCount = 0;

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
      // Phase 1.4.2: Show incremental status
      if (useIncremental && (options.debug || options.debugPerf)) {
        console.log(chalk.gray(`  ${unchanged.length} unchanged (cached), ${changed.length} changed (analyzing)`));
      }
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
      // Phase 1.4.1: Enhanced to track per-detector timing
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
          
          // Phase 1.4.1: Track detector execution time
          if (event.detectorName && event.detectorDuration !== undefined) {
            perfTimer.trackDetector(
              event.detectorName, 
              event.detectorDuration,
              event.detectorStatus || 'success'
            );
          }
          
          // Phase 1.4.3: Track skipped detectors
          if (event.detectorsSkipped && event.detectorsSkipped.length > 0) {
            perfTimer.recordSkippedDetectors(event.detectorsSkipped);
            detectorsSkippedCount = event.detectorsSkipped.length; // Phase 1.5: Track for summary
          }
        } else if (event.message && event.phase !== 'runDetectors') {
          console.log(chalk.gray(`  ${event.message}`));
        }
      } : (event: any) => {
        // Phase 1.4.1: Even without progress display, track detector metrics for --debug-perf
        if (event.phase === 'runDetectors') {
          if (event.detectorName && event.detectorDuration !== undefined) {
            perfTimer.trackDetector(
              event.detectorName,
              event.detectorDuration,
              event.detectorStatus || 'success'
            );
          }
          
          // Phase 1.4.3: Track skipped detectors
          if (event.detectorsSkipped && event.detectorsSkipped.length > 0) {
            perfTimer.recordSkippedDetectors(event.detectorsSkipped);
            detectorsSkippedCount = event.detectorsSkipped.length; // Phase 1.5: Track for summary
          }
        }
      };
      
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
        // Phase 1.4.3: Pass changed files for smart detector skipping
        results = await engine.analyze(files, { changedFiles: changed });
        
        // Cleanup
        await engine.shutdown();
        if (detectorSpinner) detectorSpinner.succeed(`Completed ${detectorsRun} detectors`);
      } catch (error: any) {
        // Phase 1.3: Improved error messages (no raw stack traces by default)
        if (detectorSpinner) detectorSpinner.fail('Analysis failed');
        
        if (options.debug) {
          console.error(chalk.red('\n❌ Detector execution failed:'));
          console.error(chalk.gray(error.stack || error.message || error));
        } else {
          console.error(chalk.red('\n❌ Analysis failed due to internal error'));
          console.error(chalk.yellow('💡 Run with --debug for detailed error information'));
        }
        // Continue with empty results if analysis completely fails
        results = [];
        
        // Cleanup on error
        if (engine) {
          await engine.shutdown().catch(() => {});
        }
        
        // Phase 1.3: Exit with code 2 for internal failures
        process.exitCode = 2;
      }
      perfTimer.endPhase('runDetectors');

      const resultsSpinner = options.silent ? null : ora('Processing results...').start();
      if (resultsSpinner) {
        setTimeout(() => resultsSpinner.succeed('Results processed'), 100);
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
      
      // Phase 1.4.2: Update incremental cache with new hashes and results
      incrementalCache.updateFileHashes(newHashes);
      // Group issues by file for incremental cache
      const issuesByFile = new Map<string, any[]>();
      for (const issue of filteredIssues) {
        if (!issuesByFile.has(issue.file)) {
          issuesByFile.set(issue.file, []);
        }
        issuesByFile.get(issue.file)!.push(issue);
      }
      // Store per-file, per-detector results
      for (const file of files) {
        const fileIssues = issuesByFile.get(file) || [];
        const detectorMap = new Map<string, any[]>();
        for (const issue of fileIssues) {
          if (!detectorMap.has(issue.detector)) {
            detectorMap.set(issue.detector, []);
          }
          detectorMap.get(issue.detector)!.push(issue);
        }
        for (const [detector, issues] of detectorMap.entries()) {
          incrementalCache.setCachedResult(file, detector, issues);
        }
      }
      await incrementalCache.save();
      
      perfTimer.endPhase('aggregateResults');
    }

    // Phase 2.1: Privacy sanitization (before display/reports)
    let issuesForOutput = filteredIssues;
    const privacyEnabled = options.privacyMode !== 'off';
    
    if (privacyEnabled && filteredIssues.length > 0) {
      perfTimer.startPhase('privacySanitization');
      
      if (!options.silent) {
        console.log(chalk.cyan('\n🔒 Privacy Mode: Sanitizing sensitive data...'));
      }
      
      // Sanitize all issues (remove absolute paths, variable names, code snippets)
      issuesForOutput = sanitizeIssues(filteredIssues, workspaceRoot);
      
      // Generate privacy report
      const privacyReport = generatePrivacyReport(filteredIssues, issuesForOutput);
      
      if (!options.silent) {
        console.log(chalk.gray(`  Paths sanitized: ${privacyReport.pathsSanitized} absolute → relative`));
        console.log(chalk.gray(`  Messages sanitized: ${privacyReport.messagesSanitized} (variables removed)`));
        console.log(chalk.gray(`  Code snippets removed: ${privacyReport.fixesRemoved}`));
        console.log(chalk.green(`✓ Privacy sanitization complete (${privacyReport.validationPassed}/${privacyReport.totalIssues} passed validation)\n`));
      }
      
      perfTimer.endPhase('privacySanitization');
    } else if (!privacyEnabled && !options.silent) {
      console.log(chalk.yellow('\n⚠️  Privacy Mode: OFF'));
      console.log(chalk.yellow('   Absolute paths and variable names will be included in output.'));
      console.log(chalk.gray('   (Use --privacy-mode on to enable sanitization)\n'));
    }
    
    // Display summary
    if (!options.silent) {
      displaySummary(issuesForOutput, files.length, Date.now() - startTime);
    }

    // Generate reports
    perfTimer.startPhase('generateReports');
    if (!options.silent && (options.json || options.sarif || options.html || options.md)) {
      console.log(chalk.gray('\nGenerating reports...'));
    }
    
    const reportsDir = path.join(workspaceRoot, '.odavl/reports');
    await fs.mkdir(reportsDir, { recursive: true });

    if (options.json || options.output?.endsWith('.json')) {
      const jsonPath = options.output || path.join(reportsDir, 'insight-latest.json');
      await generateJSONReport(issuesForOutput, jsonPath, files.length, Date.now() - startTime);
      if (!options.silent) console.log(fmt.success(`JSON report: ${jsonPath}`));
    }
    
    // Phase 1.5: SARIF export for GitHub Code Scanning integration
    if (options.sarif || options.output?.endsWith('.sarif')) {
      const sarifPath = options.output || path.join(reportsDir, 'insight-latest.sarif');
      await generateSARIFReport(issuesForOutput, sarifPath);
      if (!options.silent) console.log(fmt.success(`SARIF report: ${sarifPath}`));
    }

    if (options.html) {
      const htmlPath = options.output || path.join(reportsDir, 'insight-latest.html');
      await generateHTMLReport(issuesForOutput, htmlPath, files.length, Date.now() - startTime);
      if (!options.silent) console.log(chalk.green(`✓ HTML report: ${htmlPath}`));
    }

    if (options.md) {
      const mdPath = options.output || path.join(reportsDir, 'insight-latest.md');
      await generateMarkdownReport(issuesForOutput, mdPath, files.length, Date.now() - startTime);
      if (!options.silent) console.log(chalk.green(`✓ Markdown report: ${mdPath}`));
    }
    perfTimer.endPhase('generateReports');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Phase 1.5: Polished summary output
    if (!options.silent) {
      console.log(fmt.summaryBox({
        filesAnalyzed: changed.length,
        filesCached: unchanged.length,
        detectorsSkipped: detectorsSkippedCount,
        issuesFound: issuesForOutput.length,
        timeElapsed: `${elapsed}s`,
      }));
      
      if (issuesForOutput.length === 0) {
        console.log(fmt.success('No issues found! Your code looks great.'));
      } else {
        const criticalCount = issuesForOutput.filter(i => i.severity === 'critical').length;
        const highCount = issuesForOutput.filter(i => i.severity === 'high').length;
        if (criticalCount > 0 || highCount > 0) {
          console.log(fmt.warning(`Found ${criticalCount} critical and ${highCount} high severity issues`));
        }
      }
    }
    
    // Phase 2.2 Task 5: Upload to ODAVL Cloud
    if (options.upload) {
      await handleCloudUpload(issuesForOutput, workspaceRoot, options);
    }
    
    // Phase 1.4.1: Show performance breakdown based on flags
    if (options.debugPerf) {
      console.log('\n' + chalk.cyan(perfTimer.getDetailedBreakdown()));
    } else if (options.debug) {
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

/**
 * Phase 1.5: Generate SARIF v2.1.0 format report
 * SARIF = Static Analysis Results Interchange Format
 * Compatible with GitHub Code Scanning, VS Code, and other tools
 * 
 * Phase 2.2 Task 6: Refactored to use reusable SARIF generator
 */
async function generateSARIFReport(issues: InsightIssue[], outputPath: string) {
  const sarif = generateSarif(issues);
  await fs.writeFile(outputPath, JSON.stringify(sarif, null, 2), 'utf-8');
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

/**
 * Phase 1.5 Task 9: Generate detector registry documentation
 */
export async function generateDetectorDocs() {
  const detectorNames: DetectorName[] = [
    'typescript', 'eslint', 'python-type', 'python-security', 'python-complexity',
    'python-imports', 'python-best-practices', 'java-complexity', 'java-stream',
    'java-exception', 'java-memory', 'java-spring', 'go', 'rust',
    'security', 'complexity', 'performance', 'import', 'circular', 
    'network', 'isolation', 'package', 'runtime', 'build'
  ];
  
  // Group by scope
  const fileDetectors: any[] = [];
  const workspaceDetectors: any[] = [];
  const globalDetectors: any[] = [];
  
  for (const name of detectorNames) {
    const metadata = getDetectorMetadata(name);
    const detector = {
      name,
      extensions: metadata.extensions?.join(', ') || 'All files',
      scope: metadata.scope || 'global',
    };
    
    if (detector.scope === 'file') fileDetectors.push(detector);
    else if (detector.scope === 'workspace') workspaceDetectors.push(detector);
    else globalDetectors.push(detector);
  }
  
  // Generate markdown
  const lines = [
    '# ODAVL Insight Detector Registry',
    '',
    '> Auto-generated documentation from detector metadata',
    '> Last updated: ' + new Date().toISOString(),
    '',
    '## Overview',
    '',
    `ODAVL Insight includes **${detectorNames.length} detectors** organized by analysis scope:`,
    '',
    `- **File-Scoped** (${fileDetectors.length}): Language-specific detectors that analyze individual files`,
    `- **Workspace-Scoped** (${workspaceDetectors.length}): Cross-file analysis detectors`,
    `- **Global** (${globalDetectors.length}): Configuration and metadata detectors`,
    '',
    '## Detector Table',
    '',
    '| Name | Scope | Extensions | Smart Skipping |',
    '|------|-------|------------|----------------|',
  ];
  
  // Add all detectors to table
  [...fileDetectors, ...workspaceDetectors, ...globalDetectors].forEach(d => {
    const skipBehavior = d.scope === 'file' ? 'Yes' : 'No (always runs)';
    lines.push(`| ${d.name} | ${d.scope} | ${d.extensions} | ${skipBehavior} |`);
  });
  
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // File-scoped section
  lines.push('## File-Scoped Detectors');
  lines.push('');
  lines.push('These detectors analyze individual files and can be skipped when files haven\'t changed.');
  lines.push('');
  
  const descriptions: Record<string, string> = {
    'typescript': 'TypeScript compiler checks for type errors, strict mode violations, and TypeScript-specific issues.',
    'eslint': 'ESLint rules for JavaScript/TypeScript code style, potential bugs, and best practices.',
    'python-type': 'Python type checking via mypy for type hint violations.',
    'python-security': 'Security vulnerability detection for Python code via bandit.',
    'python-complexity': 'Cyclomatic and cognitive complexity analysis for Python functions.',
    'python-imports': 'Python import cycle detection and organization checks.',
    'python-best-practices': 'PEP 8 compliance and Python best practices validation.',
    'java-complexity': 'Complexity metrics for Java methods and classes.',
    'java-stream': 'Java Stream API misuse and optimization opportunities.',
    'java-exception': 'Exception handling pattern validation for Java.',
    'java-memory': 'Memory leak detection and resource management for Java.',
    'java-spring': 'Spring Framework best practices and configuration validation.',
    'go': 'Go vet checks for common Go programming errors.',
    'rust': 'Clippy lints for Rust code quality and idioms.',
  };
  
  fileDetectors.forEach(d => {
    lines.push(`### ${d.name}`);
    lines.push('');
    lines.push(`**Extensions**: ${d.extensions}`);
    lines.push('');
    lines.push(descriptions[d.name] || 'Code quality analysis detector.');
    lines.push('');
  });
  
  // Workspace-scoped section
  lines.push('---');
  lines.push('');
  lines.push('## Workspace-Scoped Detectors');
  lines.push('');
  lines.push('These detectors perform cross-file analysis and always run (never skipped).');
  lines.push('');
  
  const workspaceDescriptions: Record<string, string> = {
    'security': 'Workspace-wide security scans for secrets, API keys, hardcoded credentials.',
    'complexity': 'Overall codebase complexity trends and hotspot identification.',
    'performance': 'Performance bottleneck detection across the entire workspace.',
    'import': 'Import statement organization and unused import detection.',
    'circular': 'Circular dependency detection between modules.',
    'network': 'Network call patterns and potential issues.',
    'isolation': 'Module isolation and boundary violation detection.',
  };
  
  workspaceDetectors.forEach(d => {
    lines.push(`### ${d.name}`);
    lines.push('');
    lines.push(workspaceDescriptions[d.name] || 'Cross-file analysis detector.');
    lines.push('');
  });
  
  // Global section
  lines.push('---');
  lines.push('');
  lines.push('## Global Detectors');
  lines.push('');
  lines.push('These detectors analyze project configuration and metadata.');
  lines.push('');
  
  const globalDescriptions: Record<string, string> = {
    'package': 'Package.json validation and dependency analysis.',
    'runtime': 'Runtime environment configuration checks.',
    'build': 'Build configuration validation (tsconfig, webpack, etc).',
  };
  
  globalDetectors.forEach(d => {
    lines.push(`### ${d.name}`);
    lines.push('');
    lines.push(globalDescriptions[d.name] || 'Configuration analysis detector.');
    lines.push('');
  });
  
  // Write file
  const docsDir = path.join(process.cwd(), 'docs/insight');
  await fs.mkdir(docsDir, { recursive: true });
  const docPath = path.join(docsDir, 'DETECTOR_REGISTRY.md');
  await fs.writeFile(docPath, lines.join('\n'), 'utf-8');
  
  console.log(fmt.success(`Generated detector registry documentation`));
  console.log(fmt.stat('Location', docPath, 'blue'));
  console.log(fmt.stat('Detectors', detectorNames.length, 'blue'));
}

/**
 * TASK 7: Handle cloud upload with hardened snapshot pipeline
 * 
 * Features:
 * - ZCC compliance (metadata only)
 * - Retry logic with exponential backoff
 * - Silent by default (no noise)
 * - Clear errors only when needed
 */
async function handleCloudUpload(
  issues: InsightIssue[],
  workspaceRoot: string,
  options: AnalyzeOptions
): Promise<void> {
  const startTime = Date.now();
  
  // Get project metadata (best effort)
  let projectName = 'workspace';
  let repoUrl: string | undefined;
  
  try {
    const pkgPath = path.join(workspaceRoot, 'package.json');
    const pkgJson = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    if (pkgJson.name) {
      projectName = pkgJson.name;
    }
  } catch {
    // Ignore - use default
  }
  
  try {
    const { execSync } = await import('child_process');
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (remoteUrl) {
      repoUrl = remoteUrl;
    }
  } catch {
    // Ignore - git not available
  }
  
  // Calculate analysis time
  const analysisTimeMs = Date.now() - startTime;
  
  // TASK 8: Check consent and authentication before upload
  const { ConsentManager } = await import('../utils/consent-manager.js');
  const consentManager = new ConsentManager();
  
  // Check environment variable for opt-out
  if (ConsentManager.isCloudDisabledByEnv()) {
    console.log(chalk.yellow('\n⚠ Cloud uploads disabled (ODAVL_NO_CLOUD=true)\n'));
    console.log(chalk.gray('Remove the environment variable to enable uploads.\n'));
    return;
  }
  
  // Check consent (interactive prompt on first upload)
  const hasConsent = await consentManager.requestCloudUploadConsent(options.silent);
  if (!hasConsent) {
    // User declined or consent required
    return;
  }
  
  // Convert InsightIssue[] to Issue[] (snapshot format)
  const snapshotIssues: Issue[] = issues.map(i => ({
    file: i.file,
    line: i.line,
    column: i.column,
    message: i.message,
    severity: i.severity,
    detector: i.detector,
    ruleId: i.ruleId,
  }));
  
  // Upload snapshot (silent by default, errors only when needed)
  const result = await uploadSnapshot(snapshotIssues, {
    workspaceRoot,
    projectName,
    repoUrl,
    analysisTimeMs,
    cliVersion: cliPkgJson.version || '2.0.0',
    debug: options.debug,
    silent: !options.debug, // Silent unless debug mode
  });
  
  // Format and display result (only if error and not silent)
  const message = formatSnapshotResult(result, !options.debug);
  if (message) {
    console.log('\n' + message + '\n');
  }
  
  // Debug logging
  if (options.debug) {
    if (result.status === 'success') {
      console.log(chalk.gray(`[Cloud] Snapshot uploaded (ID: ${result.snapshotId})`));
    } else if (result.status === 'offline') {
      console.log(chalk.gray(`[Cloud] Offline: ${result.reason}`));
    } else if (result.status === 'error') {
      console.log(chalk.gray(`[Cloud] Error: ${result.code} - ${result.message}`));
    }
  }
}
