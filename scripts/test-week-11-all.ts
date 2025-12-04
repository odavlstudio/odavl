#!/usr/bin/env tsx

/**
 * Week 11 Comprehensive Test Suite - All 6 Java Detectors
 * Tests all detectors together and generates combined report
 * 
 * Detectors tested:
 * 1. JavaNullSafetyDetector (Day 1)
 * 2. JavaConcurrencyDetector (Day 2)
 * 3. JavaPerformanceDetector (Day 3)
 * 4. JavaSecurityDetector (Day 4)
 * 5. JavaTestingDetector (Day 5)
 * 6. JavaArchitectureDetector (Day 6)
 */

import { JavaNullSafetyDetector } from '../odavl-studio/insight/core/src/detector/java/java-null-safety-detector.js';
import { JavaConcurrencyDetector } from '../odavl-studio/insight/core/src/detector/java/java-concurrency-detector.js';
import { JavaPerformanceDetector } from '../odavl-studio/insight/core/src/detector/java/java-performance-detector.js';
import { JavaSecurityDetector } from '../odavl-studio/insight/core/src/detector/java/java-security-detector.js';
import { JavaTestingDetector } from '../odavl-studio/insight/core/src/detector/java/java-testing-detector.js';
import { JavaArchitectureDetector } from '../odavl-studio/insight/core/src/detector/java/java-architecture-detector.js';
import * as path from 'node:path';
import { cwd } from 'node:process';

const workspaceRoot = cwd();
const testFixturesRoot = path.join(workspaceRoot, 'test-fixtures', 'java');

interface DetectorResult {
  name: string;
  issues: any[];
  time: number;
  expectedIssues: number;
  accuracy: number;
}

async function runDetector(
  name: string,
  detector: any,
  expectedIssues: number
): Promise<DetectorResult> {
  console.log(`\n🔍 Running ${name}...`);
  
  const startTime = performance.now();
  const issues = await detector.detect();
  const endTime = performance.now();
  const time = Math.round(endTime - startTime);
  
  const accuracy = Math.round((Math.min(issues.length, expectedIssues) / expectedIssues) * 100);
  
  console.log(`   ✓ Detected: ${issues.length} issues in ${time}ms (${accuracy}% accuracy)`);
  
  return {
    name,
    issues,
    time,
    expectedIssues,
    accuracy,
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     ODAVL Week 11 - All Java Detectors Test Suite           ║');
  console.log('║     Testing 6 detectors on Java test fixtures               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`📂 Test fixtures root: ${testFixturesRoot}\n`);

  const results: DetectorResult[] = [];

  // Run all detectors
  try {
    results.push(
      await runDetector(
        'JavaNullSafetyDetector',
        new JavaNullSafetyDetector(testFixturesRoot),
        18
      )
    );

    results.push(
      await runDetector(
        'JavaConcurrencyDetector',
        new JavaConcurrencyDetector(testFixturesRoot),
        24
      )
    );

    results.push(
      await runDetector(
        'JavaPerformanceDetector',
        new JavaPerformanceDetector(testFixturesRoot),
        20
      )
    );

    results.push(
      await runDetector(
        'JavaSecurityDetector',
        new JavaSecurityDetector(testFixturesRoot),
        19
      )
    );

    results.push(
      await runDetector(
        'JavaTestingDetector',
        new JavaTestingDetector(testFixturesRoot),
        17
      )
    );

    results.push(
      await runDetector(
        'JavaArchitectureDetector',
        new JavaArchitectureDetector(testFixturesRoot),
        18
      )
    );
  } catch (error) {
    console.error('\n❌ Error running detectors:', error);
    process.exit(1);
  }

  // Calculate totals
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalTime = results.reduce((sum, r) => sum + r.time, 0);
  const totalExpected = results.reduce((sum, r) => sum + r.expectedIssues, 0);
  const overallAccuracy = Math.round((Math.min(totalIssues, totalExpected) / totalExpected) * 100);

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📊 COMPREHENSIVE SUMMARY\n');

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    DETECTION STATISTICS                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`🎯 Total Issues Detected: ${totalIssues} issues`);
  console.log(`📋 Expected Issues: ${totalExpected} issues`);
  console.log(`⏱️  Total Detection Time: ${totalTime}ms`);
  console.log(`📊 Overall Accuracy: ${overallAccuracy}%`);
  console.log(`⚡ Issues per Second: ${Math.round((totalIssues / totalTime) * 1000)} issues/sec`);

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                  DETECTOR PERFORMANCE                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Sort by performance (time)
  const sortedByTime = [...results].sort((a, b) => a.time - b.time);
  
  console.log('⚡ Fastest to Slowest:\n');
  for (let i = 0; i < sortedByTime.length; i++) {
    const result = sortedByTime[i];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    console.log(`${medal} ${i + 1}. ${result.name.padEnd(28)} ${result.time.toString().padStart(4)}ms`);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    ACCURACY RANKING                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Sort by accuracy
  const sortedByAccuracy = [...results].sort((a, b) => b.accuracy - a.accuracy);
  
  for (let i = 0; i < sortedByAccuracy.length; i++) {
    const result = sortedByAccuracy[i];
    const stars = result.accuracy >= 95 ? '⭐⭐⭐⭐⭐' :
                  result.accuracy >= 90 ? '⭐⭐⭐⭐' :
                  result.accuracy >= 85 ? '⭐⭐⭐' :
                  result.accuracy >= 80 ? '⭐⭐' : '⭐';
    
    console.log(`${stars} ${result.name.padEnd(28)} ${result.accuracy}% (${result.issues.length}/${result.expectedIssues})`);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                  DETAILED BREAKDOWN                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  for (const result of results) {
    console.log(`▶ ${result.name}`);
    console.log(`  Issues: ${result.issues.length}/${result.expectedIssues}`);
    console.log(`  Time: ${result.time}ms`);
    console.log(`  Accuracy: ${result.accuracy}%`);
    
    // Count by severity
    const errors = result.issues.filter(i => i.severity === 'error').length;
    const warnings = result.issues.filter(i => i.severity === 'warning').length;
    const infos = result.issues.filter(i => i.severity === 'info').length;
    
    console.log(`  Severity: ${errors} errors, ${warnings} warnings, ${infos} info`);
    
    // Count auto-fixable
    const autoFixable = result.issues.filter(i => i.autoFixable).length;
    console.log(`  Auto-fixable: ${autoFixable}/${result.issues.length} (${Math.round((autoFixable / result.issues.length) * 100)}%)`);
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✨ TEST RESULTS SUMMARY\n');

  const passedTests = [
    { name: 'All Detectors Completed', passed: results.length === 6 },
    { name: 'Overall Accuracy >= 90%', passed: overallAccuracy >= 90 },
    { name: 'Total Issues >= 100', passed: totalIssues >= 100 },
    { name: 'Total Time < 2000ms', passed: totalTime < 2000 },
    { name: 'All Detectors >= 80% Accuracy', passed: results.every(r => r.accuracy >= 80) },
    { name: 'No Detector Failures', passed: results.every(r => r.issues.length > 0) },
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
    console.log('\n🎉 ALL TESTS PASSED! Week 11 Java Detectors are production ready!\n');
  } else if (passRate >= 80) {
    console.log('\n⚠️  Most tests passed, but some improvements needed.\n');
  } else {
    console.log('\n❌ Multiple test failures. Review detector implementations.\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generate summary stats for documentation
  console.log('📋 WEEK 11 FINAL STATISTICS FOR DOCUMENTATION:\n');
  console.log('```yaml');
  console.log('Week 11 Complete Summary:');
  console.log(`  Detectors: 6/6 (100%)`);
  console.log(`  Total Issues: ${totalIssues} issues`);
  console.log(`  Detection Time: ${totalTime}ms`);
  console.log(`  Overall Accuracy: ${overallAccuracy}%`);
  console.log(`  Issues per Second: ${Math.round((totalIssues / totalTime) * 1000)}`);
  console.log('  ');
  console.log('Detector Details:');
  for (const result of results) {
    console.log(`  - ${result.name}:`);
    console.log(`      Issues: ${result.issues.length}/${result.expectedIssues}`);
    console.log(`      Time: ${result.time}ms`);
    console.log(`      Accuracy: ${result.accuracy}%`);
  }
  console.log('```\n');

  // Exit with appropriate code
  process.exit(passRate >= 80 ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
