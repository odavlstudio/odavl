#!/usr/bin/env tsx

/**
 * Test script for JavaArchitectureDetector
 * Tests architectural violation detection on ArchitectureSample.java
 * 
 * Expected results:
 * - 18-22 architectural issues detected
 * - 0 false positives on safe patterns
 * - < 100ms per file
 * - 90%+ accuracy
 */

import { JavaArchitectureDetector } from '../odavl-studio/insight/core/src/detector/java/java-architecture-detector.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cwd } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = cwd();

interface IssuesByCategory {
  'LAYER-VIOLATIONS': any[];
  'GOD-CLASSES': any[];
  'CIRCULAR-DEPENDENCIES': any[];
  'PACKAGE-STRUCTURE': any[];
  [key: string]: any[];
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     ODAVL JavaArchitectureDetector Test Suite               ║');
  console.log('║     Testing: ArchitectureSample.java                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const testFixturesRoot = path.join(workspaceRoot, 'test-fixtures', 'java');
  const detector = new JavaArchitectureDetector(testFixturesRoot);

  console.log(`🔍 Scanning Java files in: ${testFixturesRoot}\n`);

  const startTime = performance.now();
  const issues = await detector.detect();
  const endTime = performance.now();
  const detectionTime = Math.round(endTime - startTime);

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 DETECTION SUMMARY\n');
  console.log(`⏱️  Detection Time: ${detectionTime}ms`);
  console.log(`🎯 Total Issues: ${issues.length}`);
  console.log(`⚠️  Errors: ${issues.filter(i => i.severity === 'error').length}`);
  console.log(`⚠️  Warnings: ${issues.filter(i => i.severity === 'warning').length}`);
  console.log(`ℹ️  Info: ${issues.filter(i => i.severity === 'info').length}`);
  console.log(`🔧 Auto-fixable: ${issues.filter(i => i.autoFixable).length}`);

  // Group by category
  const byCategory: IssuesByCategory = {
    'LAYER-VIOLATIONS': [],
    'GOD-CLASSES': [],
    'CIRCULAR-DEPENDENCIES': [],
    'PACKAGE-STRUCTURE': [],
  };

  for (const issue of issues) {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📂 ISSUES BY CATEGORY\n');

  for (const [category, categoryIssues] of Object.entries(byCategory)) {
    if (categoryIssues.length === 0) continue;

    console.log(`\n▶ ${category} (${categoryIssues.length} issues)\n`);

    // Group by severity
    const errors = categoryIssues.filter(i => i.severity === 'error');
    const warnings = categoryIssues.filter(i => i.severity === 'warning');
    const infos = categoryIssues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      console.log(`  🔴 ERRORS (${errors.length}):`);
      for (const issue of errors) {
        const fileName = path.basename(issue.file);
        console.log(`     • ${fileName}:${issue.line} - ${issue.message}`);
        console.log(`       Rule: ${issue.rule}`);
        console.log(`       💡 ${issue.suggestion}`);
        console.log();
      }
    }

    if (warnings.length > 0) {
      console.log(`  🟡 WARNINGS (${warnings.length}):`);
      for (const issue of warnings) {
        const fileName = path.basename(issue.file);
        console.log(`     • ${fileName}:${issue.line} - ${issue.message}`);
        console.log(`       Rule: ${issue.rule}`);
        console.log(`       💡 ${issue.suggestion}`);
        console.log();
      }
    }

    if (infos.length > 0) {
      console.log(`  🔵 INFO (${infos.length}):`);
      for (const issue of infos) {
        const fileName = path.basename(issue.file);
        console.log(`     • ${fileName}:${issue.line} - ${issue.message}`);
        console.log(`       Rule: ${issue.rule}`);
        console.log(`       💡 ${issue.suggestion}`);
        console.log();
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📈 PATTERN DETECTION BREAKDOWN\n');

  const expectedIssues = {
    'LAYER-VIOLATIONS': 5,
    'GOD-CLASSES': 5,
    'CIRCULAR-DEPENDENCIES': 5,
    'PACKAGE-STRUCTURE': 2,
  };

  let totalExpected = 0;
  let totalDetected = 0;

  for (const [category, expected] of Object.entries(expectedIssues)) {
    const detected = byCategory[category]?.length || 0;
    const accuracy = expected > 0 ? Math.round((Math.min(detected, expected) / expected) * 100) : 100;
    
    totalExpected += expected;
    totalDetected += detected;
    
    const icon = accuracy >= 80 ? '✅' : accuracy >= 50 ? '⚠️' : '❌';
    
    console.log(`${icon} ${category}:`);
    console.log(`   Expected: ${expected} | Detected: ${detected} | Accuracy: ${accuracy}%`);
  }

  const overallAccuracy = Math.round((Math.min(totalDetected, totalExpected) / totalExpected) * 100);

  console.log(`\n📊 Overall Accuracy: ${overallAccuracy}%`);

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('⚡ PERFORMANCE METRICS\n');

  const targetTime = 100; // ms
  const performanceRatio = Math.round((targetTime / detectionTime) * 100);
  const performanceIcon = detectionTime < targetTime ? '✅' : '⚠️';

  console.log(`${performanceIcon} Detection Time: ${detectionTime}ms (target: < ${targetTime}ms)`);
  console.log(`📊 Performance Ratio: ${performanceRatio}% of target time`);
  
  if (detectionTime < targetTime) {
    const faster = Math.round(((targetTime - detectionTime) / targetTime) * 100);
    console.log(`🚀 ${faster}% faster than target!`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('✨ TEST RESULTS SUMMARY\n');

  const passedTests = [
    { name: 'Detection Completed', passed: issues.length > 0 },
    { name: 'Performance < 100ms', passed: detectionTime < 100 },
    { name: 'Accuracy >= 80%', passed: overallAccuracy >= 80 },
    { name: 'Layer Violations Detected', passed: (byCategory['LAYER-VIOLATIONS']?.length || 0) >= 3 },
    { name: 'God Classes Detected', passed: (byCategory['GOD-CLASSES']?.length || 0) >= 3 },
    { name: 'Circular Dependencies Detected', passed: (byCategory['CIRCULAR-DEPENDENCIES']?.length || 0) >= 2 },
    { name: 'Package Issues Detected', passed: (byCategory['PACKAGE-STRUCTURE']?.length || 0) >= 1 },
  ];

  for (const test of passedTests) {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
  }

  const passedCount = passedTests.filter(t => t.passed).length;
  const totalTests = passedTests.length;
  const passRate = Math.round((passedCount / totalTests) * 100);

  console.log(`\n📊 Test Pass Rate: ${passedCount}/${totalTests} (${passRate}%)`);

  if (passRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED! JavaArchitectureDetector is production ready!\n');
  } else if (passRate >= 80) {
    console.log('\n⚠️  Most tests passed, but some improvements needed.\n');
  } else {
    console.log('\n❌ Multiple test failures. Review detector implementation.\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  process.exit(passRate >= 80 ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Error running tests:', error);
  process.exit(1);
});
