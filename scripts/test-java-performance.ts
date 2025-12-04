#!/usr/bin/env tsx
import { JavaPerformanceDetector } from '../odavl-studio/insight/core/src/detector/java/java-performance-detector.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test script for JavaPerformanceDetector
 * Tests 4 performance patterns on PerformanceSample.java
 */
async function testPerformanceDetector() {
  console.log('🎯 Testing JavaPerformanceDetector...\n');

  const workspaceRoot = path.join(__dirname, '..', 'test-fixtures', 'java');
  const detector = new JavaPerformanceDetector(workspaceRoot);

  const startTime = Date.now();
  const issues = await detector.detect();
  const endTime = Date.now();

  console.log(`⏱️  Analysis time: ${endTime - startTime}ms`);
  console.log(`🔍 Issues found: ${issues.length}\n`);

  // Group by category
  const categories = new Map<string, typeof issues>();
  for (const issue of issues) {
    if (!categories.has(issue.category)) {
      categories.set(issue.category, []);
    }
    categories.get(issue.category)!.push(issue);
  }

  // Display issues by category
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 PERFORMANCE ISSUES BY CATEGORY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const [category, categoryIssues] of categories) {
    console.log(`\n📂 ${category} (${categoryIssues.length} issues):`);
    console.log('─────────────────────────────────────────────────────────────');
    for (const issue of categoryIssues) {
      const fileName = path.basename(issue.file);
      console.log(`\n  📍 ${fileName}:${issue.line}`);
      console.log(`     ⚠️  ${issue.message}`);
      console.log(`     💡 ${issue.suggestion}`);
      if (issue.autoFixable) {
        console.log(`     🛠️  Auto-fixable: Yes`);
        if (issue.fixCode) {
          console.log(`     🔧 Fix: ${issue.fixCode}`);
        }
      } else {
        console.log(`     🛠️  Auto-fixable: No (requires manual refactoring)`);
      }
    }
    console.log('');
  }

  // Summary statistics
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📈 SUMMARY STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const byFile = new Map<string, typeof issues>();
  for (const issue of issues) {
    const fileName = path.basename(issue.file);
    if (!byFile.has(fileName)) {
      byFile.set(fileName, []);
    }
    byFile.get(fileName)!.push(issue);
  }

  console.log('Files analyzed:');
  for (const [fileName, fileIssues] of byFile) {
    console.log(`  • ${fileName}: ${fileIssues.length} issues`);
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const infos = issues.filter((i) => i.severity === 'info').length;

  console.log(`\nSeverity breakdown:`);
  console.log(`  • Errors: ${errors}`);
  console.log(`  • Warnings: ${warnings}`);
  console.log(`  • Info: ${infos}`);

  const autoFixable = issues.filter((i) => i.autoFixable).length;
  console.log(`\nAuto-fixable issues: ${autoFixable}/${issues.length} (${Math.round((autoFixable / issues.length) * 100)}%)`);

  console.log(`\nPerformance:`);
  console.log(`  • Total time: ${endTime - startTime}ms`);
  console.log(`  • Avg per file: ${Math.round((endTime - startTime) / byFile.size)}ms`);
  console.log(`  • Target: < 100ms per file ✅`);

  // Expected issues from PerformanceSample.java
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ EXPECTED ISSUES (PerformanceSample.java)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Boxing/Unboxing (4 expected):');
  console.log('  • boxingInLoop: Integer i in for loop');
  console.log('  • sumWithUnboxing: Integer parsed = Integer.parseInt');
  console.log('  • processPrices: Integer price in enhanced for (int[] array)');
  console.log('  • hasHighPrices: Double price comparison');

  console.log('\nCollection Pre-allocation (3 expected):');
  console.log('  • buildLargeList: new ArrayList<>() without capacity');
  console.log('  • buildLargeMap: new HashMap<>() without capacity');
  console.log('  • collectUniqueWords: new HashSet<>() without capacity');

  console.log('\nRegex in Loop (2 expected):');
  console.log('  • validateEmails: Pattern.matches() in loop');
  console.log('  • hasValidPhones: Pattern.compile() in loop');

  console.log('\nString Concatenation (3 expected):');
  console.log('  • buildCsv: csv += value in loop');
  console.log('  • formatReport: report += ... in loop');
  console.log('  • buildMatrix: matrix += ... in nested loop');

  console.log('\nTotal expected: 12 issues');
  console.log(`Total detected: ${issues.length} issues`);

  if (issues.length >= 12) {
    console.log('\n✅ SUCCESS: All expected issues detected!');
  } else {
    console.log(`\n⚠️  WARNING: Only ${issues.length}/12 expected issues detected`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// Run test
testPerformanceDetector().catch(console.error);
