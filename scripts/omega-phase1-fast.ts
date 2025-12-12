/**
 * ODAVL ON ODAVL - Phase 1: Fast Insight Analysis
 * Excludes node_modules, .next, dist for speed
 */

import { TSDetector } from '../odavl-studio/insight/core/src/detector/ts-detector.js';
import { ESLintDetector } from '../odavl-studio/insight/core/src/detector/eslint-detector.js';
import { SecurityDetector } from '../odavl-studio/insight/core/src/detector/security-detector.js';
import { ComplexityDetector } from '../odavl-studio/insight/core/src/detector/complexity-detector.js';
import { CircularDependencyDetector } from '../odavl-studio/insight/core/src/detector/circular-detector.js';
import { ImportDetector } from '../odavl-studio/insight/core/src/detector/import-detector.js';
import { PackageDetector } from '../odavl-studio/insight/core/src/detector/package-detector.js';

import * as fs from 'node:fs';
import * as path from 'node:path';

const WORKSPACE_ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'reports', 'omega');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'insight-phase1.json');

// Target directories (exclude heavy ones)
const TARGET_DIRS = [
  'apps/studio-cli/src',
  'apps/studio-hub/src',
  'apps/studio-hub/app',
  'odavl-studio/insight/core/src',
  'odavl-studio/autopilot/engine/src',
  'odavl-studio/guardian/core/src',
  'odavl-studio/guardian/cli/src',
  'odavl-studio/oms/src',
  'packages/core/src',
  'packages/types/src',
  'packages/odavl-brain/src',
  'packages/auth/src',
  'packages/sdk/src',
];

interface DetectorResult {
  name: string;
  issueCount: number;
  issues: any[];
  executionTime: number;
}

async function runDetector(
  name: string,
  DetectorClass: any,
  targetPath: string
): Promise<DetectorResult> {
  const startTime = Date.now();
  try {
    const detector = new DetectorClass(WORKSPACE_ROOT);
    const issues = await detector.detect(targetPath);
    const issuesArray = Array.isArray(issues) ? issues : [];
    const executionTime = Date.now() - startTime;
    console.log(`✅ ${name}: ${issuesArray.length} issues (${executionTime}ms)`);
    return { name, issueCount: issuesArray.length, issues: issuesArray, executionTime };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.log(`⚠️  ${name}: Skipped (${error.message.substring(0, 60)})`);
    return { name, issueCount: 0, issues: [], executionTime };
  }
}

async function main() {
  console.log('\n════════════════════════════════════════════════');
  console.log('  ODAVL ON ODAVL - PHASE 1: FAST ANALYSIS');
  console.log('  (Source code only - excludes node_modules)');
  console.log('════════════════════════════════════════════════\n');

  console.log(`📂 Workspace: ${WORKSPACE_ROOT}`);
  console.log(`📄 Output: ${OUTPUT_FILE}\n`);
  console.log(`🎯 Scanning ${TARGET_DIRS.length} directories:\n`);
  TARGET_DIRS.forEach((dir) => console.log(`   - ${dir}`));
  console.log();

  const detectors = [
    { name: 'TypeScript', class: TSDetector },
    { name: 'Security', class: SecurityDetector },
    { name: 'Complexity', class: ComplexityDetector },
    { name: 'Circular Dependencies', class: CircularDependencyDetector },
    { name: 'Import', class: ImportDetector },
    { name: 'Package', class: PackageDetector },
  ];

  console.log(`🔍 Running ${detectors.length} core detectors...\n`);

  const results: DetectorResult[] = [];

  // Run each detector sequentially to avoid resource issues
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

  // File breakdown (top 30)
  const fileBreakdown: Record<string, number> = {};
  allIssues.forEach((issue) => {
    const file = issue.file || issue.filePath || 'unknown';
    const relativePath = file.replace(WORKSPACE_ROOT, '.').replace(/\\/g, '/');
    fileBreakdown[relativePath] = (fileBreakdown[relativePath] || 0) + 1;
  });

  const topFiles = Object.entries(fileBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  // Top critical/high issues
  const topIssues = allIssues
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 50);

  // Extract circular dependencies
  const circularResult = results.find((r) => r.name === 'Circular Dependencies');
  const circularDependencies = circularResult?.issues || [];

  // Calculate risk score
  const riskScore = Math.min(
    100,
    Math.round(
      severityBreakdown.critical * 10 +
        severityBreakdown.high * 5 +
        severityBreakdown.medium * 2 +
        severityBreakdown.low * 0.5
    )
  );

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    mode: 'ODAVL ON ODAVL - Phase 1 (Fast Analysis)',
    workspaceRoot: WORKSPACE_ROOT,
    targetDirectories: TARGET_DIRS,
    totalDetectors: detectors.length,
    totalIssues: allIssues.length,
    executionTime: totalExecutionTime,
    detectorResults: results,
    severityBreakdown,
    categoryBreakdown,
    fileBreakdown: topFiles,
    topIssues,
    circularDependencies,
    riskScore,
    safetyConstraints: {
      maxFilesPerChange: 10,
      maxLOCPerFile: 40,
      protectedPaths: ['security/**', '**/*.spec.*', 'auth/**'],
    },
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf8');

  // Print summary
  console.log('\n════════════════════════════════════════════════');
  console.log('  PHASE 1 ANALYSIS COMPLETE ✅');
  console.log('════════════════════════════════════════════════\n');

  console.log('📊 SUMMARY:');
  console.log(`   Detectors Run:     ${detectors.length}`);
  console.log(`   Total Issues:      ${allIssues.length}`);
  console.log(`   Execution Time:    ${(totalExecutionTime / 1000).toFixed(2)}s`);
  console.log(`   Risk Score:        ${riskScore}/100\n`);

  console.log('🔴 SEVERITY BREAKDOWN:');
  console.log(`   Critical:  ${severityBreakdown.critical}`);
  console.log(`   High:      ${severityBreakdown.high}`);
  console.log(`   Medium:    ${severityBreakdown.medium}`);
  console.log(`   Low:       ${severityBreakdown.low}\n`);

  console.log('📁 TOP DETECTORS BY ISSUES:');
  results
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 5)
    .forEach((r) => {
      console.log(`   ${r.name.padEnd(25)} ${r.issueCount} issues`);
    });

  console.log('\n🔄 CIRCULAR DEPENDENCIES:');
  console.log(`   Found: ${circularDependencies.length} cycles`);

  console.log(`\n📄 Full report saved to:`);
  console.log(`   ${OUTPUT_FILE}\n`);

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
