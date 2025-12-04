#!/usr/bin/env node
/**
 * ODAVL Guardian CLI
 * Usage: odavl guardian test <url>
 */

import { testAccessibility, testPerformance, testSecurity } from './index.js';
import type { GuardianReport } from './types.js';

// Environment variable for Insight Cloud API endpoint
const INSIGHT_API = process.env.ODAVL_INSIGHT_API || 'http://localhost:3001';

async function uploadToInsightCloud(report: GuardianReport): Promise<boolean> {
  try {
    const response = await fetch(`${INSIGHT_API}/api/guardian`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
    
    if (!response.ok) {
      const error: any = await response.json();
      console.error('⚠️  Failed to upload to Insight Cloud:', error.error || 'Unknown error');
      return false;
    }
    
    const result: any = await response.json();
    console.log(`✅ Results uploaded to Insight Cloud (Test ID: ${result.testId || 'unknown'})`);
    return true;
  } catch (error) {
    console.error('⚠️  Could not connect to Insight Cloud:', (error as Error).message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] !== 'test') {
    console.log(`
🔰 ODAVL Guardian - Pre-Deploy Testing

Usage:
  guardian test <url>                Run all tests on a URL
  guardian test <url> --json         Output JSON report
  guardian test <url> --no-upload    Skip upload to Insight Cloud

Examples:
  guardian test https://example.com
  guardian test http://localhost:3000 --json
  
Environment:
  ODAVL_INSIGHT_API                  Insight Cloud API endpoint (default: http://localhost:3001)
    `);
    process.exit(1);
  }
  
  const url = args[1];
  const jsonOutput = args.includes('--json');
  const noUpload = args.includes('--no-upload');
  
  if (!url) {
    console.error('❌ Error: URL required');
    process.exit(1);
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error('❌ Error: Invalid URL format');
    process.exit(1);
  }
  
  if (!jsonOutput) {
    console.log(`\n🔰 ODAVL Guardian Testing: ${url}\n`);
  }
  
  const startTime = Date.now();
  
  try {
    // Run all tests in parallel
    const [accessibility, performance, security] = await Promise.all([
      testAccessibility(url),
      testPerformance(url),
      testSecurity(url),
    ]);
    
    const duration = Date.now() - startTime;
    
    // Calculate overall score (weighted average)
    const weights = { accessibility: 0.3, performance: 0.4, security: 0.3 };
    const overallScore = Math.round(
      accessibility.score * weights.accessibility +
      performance.scores.performance * weights.performance +
      security.score * weights.security
    );
    
    // Check if passed (no critical issues)
    const criticalAccessibility = accessibility.violations.filter((v: any) => v.impact === 'critical').length;
    const criticalSecurity = security.vulnerabilities.filter((v: any) => v.severity === 'critical').length;
    const passed = criticalAccessibility === 0 && criticalSecurity === 0 && overallScore >= 70;
    
    const report: GuardianReport = {
      url,
      timestamp: new Date().toISOString(),
      tests: {
        accessibility,
        performance,
        security,
      },
      overallScore,
      passed,
      duration,
    };
    
    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }
    
    // Upload to Insight Cloud (unless --no-upload flag)
    if (!noUpload && !jsonOutput) {
      console.log('\n📤 Uploading results to Insight Cloud...');
      await uploadToInsightCloud(report);
    }
    
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

function printReport(report: GuardianReport) {
  console.log(`\n📊 Test Results\n`);
  
  // Accessibility
  const { accessibility } = report.tests;
  if (accessibility) {
    console.log(`♿ Accessibility: ${accessibility.score}/100`);
    console.log(`   ✅ Passed: ${accessibility.passes}`);
    console.log(`   ❌ Violations: ${accessibility.violations.length}`);
    if (accessibility.violations.length > 0) {
      const critical = accessibility.violations.filter((v: any) => v.impact === 'critical');
      const serious = accessibility.violations.filter((v: any) => v.impact === 'serious');
      if (critical.length > 0) console.log(`      🔴 Critical: ${critical.length}`);
      if (serious.length > 0) console.log(`      🟠 Serious: ${serious.length}`);
    }
  }
  
  // Performance
  const { performance } = report.tests;
  if (performance) {
    console.log(`\n⚡ Performance: ${performance.scores.performance}/100`);
    console.log(`   Accessibility: ${performance.scores.accessibility}/100`);
    console.log(`   Best Practices: ${performance.scores.bestPractices}/100`);
    console.log(`   SEO: ${performance.scores.seo}/100`);
    console.log(`\n   Core Web Vitals:`);
    console.log(`   FCP: ${(performance.metrics.firstContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`   LCP: ${(performance.metrics.largestContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`   CLS: ${performance.metrics.cumulativeLayoutShift.toFixed(3)}`);
  }
  
  // Security
  const { security } = report.tests;
  if (security) {
    console.log(`\n🔒 Security: ${security.score}/100`);
    console.log(`   Vulnerabilities: ${security.vulnerabilities.length}`);
    if (security.vulnerabilities.length > 0) {
      const critical = security.vulnerabilities.filter((v: any) => v.severity === 'critical');
      const high = security.vulnerabilities.filter((v: any) => v.severity === 'high');
      if (critical.length > 0) console.log(`      🔴 Critical: ${critical.length}`);
      if (high.length > 0) console.log(`      🟠 High: ${high.length}`);
    }
  }
  
  // Overall
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Overall Score: ${report.overallScore}/100`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Duration: ${(report.duration / 1000).toFixed(1)}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(console.error);
