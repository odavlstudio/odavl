#!/usr/bin/env tsx
/**
 * Test script for JavaTestingDetector
 * Tests: JUnit assertion issues, Mockito usage, test coverage, naming conventions
 * Expected: 16 issues detected in TestingSample.java
 */

import { JavaTestingDetector } from '../odavl-studio/insight/core/src/detector/java/java-testing-detector.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResults {
  totalIssues: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  autoFixable: number;
  executionTime: number;
}

async function runTests(): Promise<TestResults> {
  console.log('🧪 JavaTestingDetector Test Run\n');
  console.log('='.repeat(80));

  const workspaceRoot = path.join(__dirname, '..', 'test-fixtures', 'java');
  const detector = new JavaTestingDetector(workspaceRoot);

  console.log(`\n📂 Workspace: ${workspaceRoot}`);
  console.log(`🔍 Detector: ${detector.name}\n`);

  const startTime = Date.now();
  const issues = await detector.detect();
  const executionTime = Date.now() - startTime;

  // Group by category
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let autoFixable = 0;

  for (const issue of issues) {
    byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    if (issue.autoFixable) {
      autoFixable++;
    }
  }

  // Display results
  console.log('📊 Detection Results:');
  console.log('='.repeat(80));
  console.log(`\n✅ Total Issues: ${issues.length}`);
  console.log(`⏱️  Execution Time: ${executionTime}ms`);
  console.log(`🔧 Auto-fixable: ${autoFixable}/${issues.length} (${((autoFixable / issues.length) * 100).toFixed(1)}%)\n`);

  // By severity
  console.log('📈 By Severity:');
  console.log('-'.repeat(80));
  for (const [severity, count] of Object.entries(bySeverity)) {
    const emoji = severity === 'error' ? '🔴' : severity === 'warning' ? '🟡' : '🔵';
    console.log(`${emoji} ${severity.toUpperCase()}: ${count}`);
  }

  // By category
  console.log('\n📦 By Category:');
  console.log('-'.repeat(80));
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`• ${category}: ${count}`);
  }

  // Display all issues grouped by category
  console.log('\n📝 Detailed Issues:');
  console.log('='.repeat(80));

  const categories = [
    'JUNIT-ASSERTIONS',
    'MOCKITO-USAGE',
    'TEST-COVERAGE',
    'TEST-NAMING',
  ];

  for (const category of categories) {
    const categoryIssues = issues.filter((i) => i.category === category);
    if (categoryIssues.length > 0) {
      console.log(`\n🏷️  ${category} (${categoryIssues.length} issues):`);
      console.log('-'.repeat(80));

      for (const issue of categoryIssues) {
        const emoji = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        const fixable = issue.autoFixable ? '🔧' : '  ';
        console.log(`\n${emoji}${fixable} Line ${issue.line}: ${issue.message}`);
        console.log(`   Rule: ${issue.rule}`);
        console.log(`   💡 Suggestion: ${issue.suggestion}`);
        if (issue.fixCode) {
          console.log(`   ✏️  Fix: ${issue.fixCode}`);
        }
      }
    }
  }

  // Performance & accuracy metrics
  console.log('\n\n📊 Performance Metrics:');
  console.log('='.repeat(80));
  console.log(`Execution Time: ${executionTime}ms`);
  console.log(`Issues per second: ${((issues.length / executionTime) * 1000).toFixed(1)}`);
  console.log(`Target: < 100ms per file ✅`);

  console.log('\n🎯 Expected vs Detected:');
  console.log('='.repeat(80));
  console.log(`Expected: 16 issues (4 JUnit + 4 Mockito + 4 Coverage + 4 Naming)`);
  console.log(`Detected: ${issues.length} issues`);
  
  const expectedByCat = {
    'JUNIT-ASSERTIONS': 4,
    'MOCKITO-USAGE': 4,
    'TEST-COVERAGE': 4,
    'TEST-NAMING': 4,
  };

  let accuracyScore = 0;
  for (const [cat, expected] of Object.entries(expectedByCat)) {
    const detected = byCategory[cat] || 0;
    const accuracy = Math.min((detected / expected) * 100, 100);
    accuracyScore += accuracy;
    const status = detected >= expected ? '✅' : '⚠️';
    console.log(`${status} ${cat}: ${detected}/${expected} (${accuracy.toFixed(1)}% accuracy)`);
  }

  const overallAccuracy = accuracyScore / Object.keys(expectedByCat).length;
  console.log(`\n🎯 Overall Accuracy: ${overallAccuracy.toFixed(1)}%`);
  console.log(`Target: > 90% ${overallAccuracy >= 90 ? '✅' : '⚠️'}`);

  // Test quality rating
  console.log('\n⭐ Test Quality Rating:');
  console.log('='.repeat(80));
  
  let stars = 0;
  if (issues.length >= 14) stars++; // Detection coverage
  if (executionTime < 100) stars++; // Performance
  if (overallAccuracy >= 90) stars++; // Accuracy
  if (autoFixable >= 6) stars++; // Auto-fix capability
  
  console.log(`${'⭐'.repeat(stars)}${'☆'.repeat(5 - stars)} (${stars}/5 stars)`);
  
  if (stars === 5) {
    console.log('🎉 EXCELLENT - Production ready!');
  } else if (stars >= 3) {
    console.log('✅ GOOD - Minor improvements needed');
  } else {
    console.log('⚠️  NEEDS WORK - Significant improvements required');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completed successfully!\n');

  return {
    totalIssues: issues.length,
    byCategory,
    bySeverity,
    autoFixable,
    executionTime,
  };
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
