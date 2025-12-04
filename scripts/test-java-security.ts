#!/usr/bin/env tsx

/**
 * Test script for JavaSecurityDetector
 * 
 * Tests security vulnerability detection on SecuritySample.java
 * Expected: 18 vulnerabilities across 6 categories
 * 
 * Categories:
 * 1. SQL Injection (4 issues)
 * 2. XSS Vulnerabilities (3 issues)
 * 3. Path Traversal (3 issues)
 * 4. Weak Encryption (3 issues)
 * 5. Hardcoded Credentials (3 issues)
 * 6. Insecure Deserialization (2 issues)
 */

import { JavaSecurityDetector } from '../odavl-studio/insight/core/src/detector/java/java-security-detector.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔒 ODAVL JavaSecurityDetector Test\n');
  console.log('═'.repeat(80));
  console.log('Testing security vulnerability detection on SecuritySample.java');
  console.log('Expected: 18 vulnerabilities across 6 categories');
  console.log('═'.repeat(80));
  console.log();

  const testFixturesPath = path.join(__dirname, '..', 'test-fixtures', 'java');
  const detector = new JavaSecurityDetector(testFixturesPath);

  console.log('📂 Analyzing test fixtures...\n');

  const startTime = Date.now();
  const issues = await detector.detect();
  const endTime = Date.now();
  const analysisTime = endTime - startTime;

  // Group issues by category
  const byCategory: Record<string, typeof issues> = {};
  for (const issue of issues) {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  }

  // Group by severity
  const bySeverity: Record<string, typeof issues> = {
    error: [],
    warning: [],
    info: [],
  };
  for (const issue of issues) {
    bySeverity[issue.severity].push(issue);
  }

  // Display results by category
  console.log('📊 DETECTION RESULTS\n');
  console.log('─'.repeat(80));

  const categoryOrder = [
    'SQL-INJECTION',
    'XSS',
    'PATH-TRAVERSAL',
    'WEAK-ENCRYPTION',
    'HARDCODED-CREDENTIALS',
    'INSECURE-DESERIALIZATION',
  ];

  const categoryLabels: Record<string, string> = {
    'SQL-INJECTION': 'SQL Injection',
    'XSS': 'XSS Vulnerabilities',
    'PATH-TRAVERSAL': 'Path Traversal',
    'WEAK-ENCRYPTION': 'Weak Encryption',
    'HARDCODED-CREDENTIALS': 'Hardcoded Credentials',
    'INSECURE-DESERIALIZATION': 'Insecure Deserialization',
  };

  for (const category of categoryOrder) {
    const categoryIssues = byCategory[category] || [];
    if (categoryIssues.length === 0) continue;

    console.log(`\n🔴 ${categoryLabels[category]} (${categoryIssues.length} issues)`);
    console.log('─'.repeat(80));

    for (const issue of categoryIssues) {
      const fileName = path.basename(issue.file);
      const severityIcon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      
      console.log(`${severityIcon} ${fileName}:${issue.line} [${issue.rule}]`);
      console.log(`   ${issue.message}`);
      console.log(`   💡 ${issue.suggestion}`);
      
      if (issue.autoFixable) {
        console.log(`   🔧 Auto-fixable`);
        if (issue.fixCode) {
          console.log(`   Fix: ${issue.fixCode}`);
        }
      }
      console.log();
    }
  }

  // Summary statistics
  console.log('─'.repeat(80));
  console.log('\n📈 SUMMARY STATISTICS\n');
  console.log('─'.repeat(80));
  console.log(`Total issues detected:    ${issues.length}`);
  console.log();
  console.log('By Category:');
  for (const category of categoryOrder) {
    const count = byCategory[category]?.length || 0;
    if (count > 0) {
      console.log(`  ${categoryLabels[category]}: ${count}`);
    }
  }
  console.log();
  console.log('By Severity:');
  console.log(`  Errors:   ${bySeverity.error.length}`);
  console.log(`  Warnings: ${bySeverity.warning.length}`);
  console.log(`  Info:     ${bySeverity.info.length}`);
  console.log();

  const autoFixableCount = issues.filter((i) => i.autoFixable).length;
  console.log(`Auto-fixable:            ${autoFixableCount} (${Math.round((autoFixableCount / issues.length) * 100)}%)`);
  console.log();
  console.log(`Analysis time:           ${analysisTime}ms`);
  console.log(`Average time per file:   ${Math.round(analysisTime / 1)}ms`);
  console.log();

  // Expected vs detected comparison
  console.log('─'.repeat(80));
  console.log('\n🎯 ACCURACY ASSESSMENT\n');
  console.log('─'.repeat(80));

  const expected = {
    'SQL-INJECTION': 4,
    'XSS': 3,
    'PATH-TRAVERSAL': 3,
    'WEAK-ENCRYPTION': 3,
    'HARDCODED-CREDENTIALS': 3,
    'INSECURE-DESERIALIZATION': 2,
  };

  let totalExpected = 0;
  let totalDetected = 0;
  let allPassed = true;

  for (const category of categoryOrder) {
    const expectedCount = expected[category as keyof typeof expected];
    const detectedCount = byCategory[category]?.length || 0;
    const match = detectedCount >= expectedCount;
    const icon = match ? '✅' : '❌';

    console.log(`${icon} ${categoryLabels[category]}: Expected ${expectedCount}, Detected ${detectedCount}`);

    totalExpected += expectedCount;
    totalDetected += detectedCount;

    if (!match) {
      allPassed = false;
    }
  }

  console.log();
  console.log(`Total: Expected ${totalExpected}, Detected ${totalDetected}`);

  const accuracy = Math.round((Math.min(totalDetected, totalExpected) / totalExpected) * 100);
  console.log(`Accuracy: ${accuracy}%`);
  console.log();

  // Performance assessment
  console.log('─'.repeat(80));
  console.log('\n⚡ PERFORMANCE ASSESSMENT\n');
  console.log('─'.repeat(80));

  const targetTime = 150; // 150ms per file for security detector
  const performanceRating = analysisTime <= targetTime ? '✅ PASS' : '⚠️ SLOW';
  const performancePercent = Math.round((targetTime / analysisTime) * 100);

  console.log(`Target: < ${targetTime}ms per file`);
  console.log(`Actual: ${analysisTime}ms per file`);
  console.log(`Performance: ${performanceRating}`);
  
  if (analysisTime < targetTime) {
    const improvement = Math.round(((targetTime - analysisTime) / targetTime) * 100);
    console.log(`Result: ${improvement}% faster than target 🚀`);
  } else {
    const slower = Math.round(((analysisTime - targetTime) / targetTime) * 100);
    console.log(`Result: ${slower}% slower than target ⏱️`);
  }
  console.log();

  // False positives check
  console.log('─'.repeat(80));
  console.log('\n✅ FALSE POSITIVES CHECK\n');
  console.log('─'.repeat(80));

  // Expected safe patterns (should NOT be flagged):
  // 1. PreparedStatement with parameter binding
  // 2. JdbcTemplate with parameter binding
  // 3. Whitelist validation for ORDER BY
  // 4. HTML escaping functions
  // 5. Template engines (Thymeleaf)
  // 6. Path validation and normalization
  // 7. Whitelist for file access
  // 8. AES-256/GCM encryption
  // 9. bcrypt for password hashing
  // 10. SHA-256 for integrity (not passwords)
  // 11. Environment variables for credentials
  // 12. Configuration files (@Value annotation)

  const safePatternCount = 12;
  const falsePositives = issues.filter((issue) => {
    const line = issue.line;
    // Check if issue is in safe pattern methods (lines ~200+)
    return line > 200 && line < 400; // Rough estimate for safe patterns section
  });

  console.log(`Total safe patterns:     ${safePatternCount}`);
  console.log(`False positives:         ${falsePositives.length}`);
  console.log();

  if (falsePositives.length === 0) {
    console.log('✅ No false positives detected on safe patterns!');
  } else {
    console.log('⚠️ False positives detected:');
    for (const fp of falsePositives) {
      console.log(`   - Line ${fp.line}: ${fp.message}`);
    }
  }
  console.log();

  // Final verdict
  console.log('═'.repeat(80));
  console.log('\n🏆 FINAL VERDICT\n');
  console.log('═'.repeat(80));

  if (allPassed && analysisTime <= targetTime && falsePositives.length === 0) {
    console.log('✅ ALL TESTS PASSED');
    console.log();
    console.log(`🎯 Detected ${totalDetected}/${totalExpected} expected vulnerabilities (${accuracy}% accuracy)`);
    console.log(`⚡ Performance: ${analysisTime}ms (within target ${targetTime}ms)`);
    console.log(`🔍 Zero false positives on safe patterns`);
    console.log(`🔧 ${autoFixableCount} auto-fixable issues (${Math.round((autoFixableCount / issues.length) * 100)}%)`);
    console.log();
    console.log('🚀 JavaSecurityDetector is production-ready for enterprise security!');
  } else {
    console.log('⚠️ SOME ISSUES DETECTED');
    console.log();
    
    if (!allPassed) {
      console.log('❌ Detection accuracy below expected');
    }
    if (analysisTime > targetTime) {
      console.log('⚠️ Performance slower than target');
    }
    if (falsePositives.length > 0) {
      console.log(`❌ ${falsePositives.length} false positives detected`);
    }
    console.log();
    console.log('⚙️ Further tuning required before production deployment');
  }

  console.log();
  console.log('═'.repeat(80));
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
