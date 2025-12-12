#!/usr/bin/env tsx
/**
 * ODAVL ON ODAVL - Phase 1: Full Insight Analysis
 * Runs all 16 detectors on entire monorepo
 */

const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');

// Use built detectors from dist/
const {
  TypeScriptDetector,
  ESLintDetector,
  SecurityDetector,
  PerformanceDetector,
  ComplexityDetector,
  CircularDependencyDetector,
  ImportDetector,
  PackageDetector,
  RuntimeDetector,
  BuildDetector,
  NetworkDetector,
  IsolationDetector,
  ArchitectureDetector,
} = require('../odavl-studio/insight/core/dist/detector/index.cjs');

const WORKSPACE_ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'reports', 'omega');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'insight-phase1.json');

interface DetectorResult {
  detector: string;
  issueCount: number;
  issues: any[];
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}

interface AnalysisReport {
  timestamp: string;
  mode: 'ODAVL ON ODAVL - Phase 1';
  workspaceRoot: string;
  totalDetectors: number;
  totalIssues: number;
  totalExecutionTime: number;
  detectorResults: DetectorResult[];
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryBreakdown: Record<string, number>;
  fileBreakdown: Record<string, number>;
  topIssues: any[];
  circularDependencies: any[];
  architectureIssues: any[];
  riskScore: number;
}

async function runDetector(
  name: string,
  DetectorClass: any,
  workspace: string
): Promise<DetectorResult> {
  console.log(chalk.blue(`\n🔍 Running ${name}...`));
  const startTime = Date.now();

  try {
    const detector = new DetectorClass(workspace);
    const issues = await detector.detect();
    const executionTime = Date.now() - startTime;

    console.log(
      chalk.green(
        `✅ ${name}: ${issues.length} issues found (${executionTime}ms)`
      )
    );

    return {
      detector: name,
      issueCount: issues.length,
      issues,
      executionTime,
      status: 'success',
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.log(chalk.red(`❌ ${name}: ${error.message}`));

    return {
      detector: name,
      issueCount: 0,
      issues: [],
      executionTime,
      status: 'error',
      error: error.message,
    };
  }
}

async function main() {
  console.log(chalk.bold.cyan('\n════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('  ODAVL ON ODAVL - PHASE 1: FULL INSIGHT ANALYSIS'));
  console.log(chalk.bold.cyan('════════════════════════════════════════════════\n'));

  console.log(chalk.yellow(`📂 Workspace: ${WORKSPACE_ROOT}`));
  console.log(chalk.yellow(`📄 Output: ${OUTPUT_FILE}\n`));

  const detectors = [
    { name: 'TypeScript', class: TypeScriptDetector },
    { name: 'ESLint', class: ESLintDetector },
    { name: 'Security', class: SecurityDetector },
    { name: 'Performance', class: PerformanceDetector },
    { name: 'Complexity', class: ComplexityDetector },
    { name: 'Circular Dependencies', class: CircularDependencyDetector },
    { name: 'Import', class: ImportDetector },
    { name: 'Package', class: PackageDetector },
    { name: 'Runtime', class: RuntimeDetector },
    { name: 'Build', class: BuildDetector },
    { name: 'Network', class: NetworkDetector },
    { name: 'Isolation', class: IsolationDetector },
    { name: 'Architecture', class: ArchitectureDetector },
  ];

  const results: DetectorResult[] = [];

  // Run all detectors
  for (const { name, class: DetectorClass } of detectors) {
    const result = await runDetector(name, DetectorClass, WORKSPACE_ROOT);
    results.push(result);
  }

  // Calculate statistics
  const allIssues = results.flatMap((r) => r.issues);
  const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);

  // Severity breakdown
  const severityBreakdown = {
    critical: allIssues.filter((i) => i.severity === 'critical').length,
    high: allIssues.filter((i) => i.severity === 'high').length,
    medium: allIssues.filter((i) => i.severity === 'medium').length,
    low: allIssues.filter((i) => i.severity === 'low').length,
  };

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  allIssues.forEach((issue) => {
    const category = issue.category || issue.type || 'unknown';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
  });

  // File breakdown
  const fileBreakdown: Record<string, number> = {};
  allIssues.forEach((issue) => {
    const file = issue.file || issue.filePath || 'unknown';
    fileBreakdown[file] = (fileBreakdown[file] || 0) + 1;
  });

  // Top 50 issues by severity
  const topIssues = allIssues
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 50);

  // Extract circular dependencies
  const circularResult = results.find((r) => r.detector === 'Circular Dependencies');
  const circularDependencies = circularResult?.issues || [];

  // Extract architecture issues
  const archResult = results.find((r) => r.detector === 'Architecture');
  const architectureIssues = archResult?.issues || [];

  // Calculate risk score (0-100)
  const riskScore = Math.min(
    100,
    Math.round(
      severityBreakdown.critical * 10 +
        severityBreakdown.high * 5 +
        severityBreakdown.medium * 2 +
        severityBreakdown.low * 0.5
    )
  );

  // Build final report
  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    mode: 'ODAVL ON ODAVL - Phase 1',
    workspaceRoot: WORKSPACE_ROOT,
    totalDetectors: detectors.length,
    totalIssues: allIssues.length,
    totalExecutionTime,
    detectorResults: results,
    severityBreakdown,
    categoryBreakdown,
    fileBreakdown,
    topIssues,
    circularDependencies,
    architectureIssues,
    riskScore,
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf8');

  // Print summary
  console.log(chalk.bold.green('\n════════════════════════════════════════════════'));
  console.log(chalk.bold.green('  PHASE 1 ANALYSIS COMPLETE ✅'));
  console.log(chalk.bold.green('════════════════════════════════════════════════\n'));

  console.log(chalk.bold('📊 SUMMARY:'));
  console.log(chalk.white(`   Detectors Run:     ${detectors.length}`));
  console.log(chalk.white(`   Total Issues:      ${allIssues.length}`));
  console.log(chalk.white(`   Execution Time:    ${(totalExecutionTime / 1000).toFixed(2)}s`));
  console.log(chalk.white(`   Risk Score:        ${riskScore}/100\n`));

  console.log(chalk.bold('🔴 SEVERITY BREAKDOWN:'));
  console.log(chalk.red(`   Critical:  ${severityBreakdown.critical}`));
  console.log(chalk.yellow(`   High:      ${severityBreakdown.high}`));
  console.log(chalk.blue(`   Medium:    ${severityBreakdown.medium}`));
  console.log(chalk.gray(`   Low:       ${severityBreakdown.low}\n`));

  console.log(chalk.bold('📁 TOP DETECTORS:'));
  results
    .filter((r) => r.status === 'success')
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 5)
    .forEach((r) => {
      console.log(chalk.white(`   ${r.detector.padEnd(25)} ${r.issueCount} issues`));
    });

  console.log(chalk.bold.cyan(`\n📄 Full report: ${OUTPUT_FILE}\n`));
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
