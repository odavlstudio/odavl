/**
 * ODAVL ON ODAVL - Phase 1: Full Insight Analysis
 * Simple wrapper to run all detectors and save JSON report
 */

import { runAllDetectors } from '../odavl-studio/insight/core/scripts/lib/detector-runner.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const WORKSPACE_ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'reports', 'omega');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'insight-phase1.json');

async function main() {
  console.log('\n════════════════════════════════════════════════');
  console.log('  ODAVL ON ODAVL - PHASE 1: FULL INSIGHT ANALYSIS');
  console.log('════════════════════════════════════════════════\n');

  console.log(`📂 Workspace: ${WORKSPACE_ROOT}`);
  console.log(`📄 Output: ${OUTPUT_FILE}\n`);

  const startTime = Date.now();
  
  // Run all 16 detectors
  const results = await runAllDetectors(WORKSPACE_ROOT);
  
  const executionTime = Date.now() - startTime;

  // Calculate statistics
  const allIssues = results.flatMap((r) => r.issues);
  const totalIssues = allIssues.length;

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

  // File breakdown (top 20)
  const fileBreakdown: Record<string, number> = {};
  allIssues.forEach((issue) => {
    const file = issue.file || issue.filePath || 'unknown';
    const relativePath = file.replace(WORKSPACE_ROOT, '.');
    fileBreakdown[relativePath] = (fileBreakdown[relativePath] || 0) + 1;
  });

  const topFiles = Object.entries(fileBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  // Top critical/high issues (first 50)
  const topIssues = allIssues
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 50);

  // Extract circular dependencies
  const circularResult = results.find((r) => r.name === 'Circular Deps');
  const circularDependencies = circularResult?.issues || [];

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

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    mode: 'ODAVL ON ODAVL - Phase 1',
    workspaceRoot: WORKSPACE_ROOT,
    totalDetectors: results.length,
    totalIssues,
    executionTime,
    detectorResults: results.map((r) => ({
      detector: r.name,
      icon: r.icon,
      issueCount: r.count,
      issues: r.issues,
    })),
    severityBreakdown,
    categoryBreakdown,
    fileBreakdown: topFiles,
    topIssues,
    circularDependencies,
    riskScore,
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
  console.log(`   Detectors Run:     ${results.length}`);
  console.log(`   Total Issues:      ${totalIssues}`);
  console.log(`   Execution Time:    ${(executionTime / 1000).toFixed(2)}s`);
  console.log(`   Risk Score:        ${riskScore}/100\n`);

  console.log('🔴 SEVERITY BREAKDOWN:');
  console.log(`   Critical:  ${severityBreakdown.critical}`);
  console.log(`   High:      ${severityBreakdown.high}`);
  console.log(`   Medium:    ${severityBreakdown.medium}`);
  console.log(`   Low:       ${severityBreakdown.low}\n`);

  console.log('📁 TOP DETECTORS:');
  results
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .forEach((r) => {
      console.log(`   ${r.icon} ${r.name.padEnd(20)} ${r.count} issues`);
    });

  console.log(`\n📄 Full report: ${OUTPUT_FILE}\n`);
  
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
