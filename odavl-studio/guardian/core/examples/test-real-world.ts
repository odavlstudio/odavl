#!/usr/bin/env node
/**
 * Real-World Testing Script
 * Week 11 Day 2 - Test Guardian against popular production sites
 */

import { testAccessibility, testPerformance, testSecurity } from '../dist/index.js';

const testUrls = [
  { name: 'GitHub', url: 'https://github.com', category: 'Dev Tools' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Community' },
  { name: 'Dev.to', url: 'https://dev.to', category: 'Blog Platform' },
  { name: 'Vercel', url: 'https://vercel.com', category: 'Cloud Platform' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com', category: 'Discovery' },
];

interface TestResult {
  name: string;
  url: string;
  category: string;
  accessibility: number;
  performance: number;
  security: number;
  overallScore: number;
  passed: boolean;
  duration: number;
  error?: string;
}

async function runTest(site: typeof testUrls[0]): Promise<TestResult> {
  console.log(`\n🔰 Testing ${site.name} (${site.url})...`);
  const startTime = Date.now();
  
  try {
    // Run all tests in parallel
    const [accessibility, performance, security] = await Promise.all([
      testAccessibility(site.url),
      testPerformance(site.url),
      testSecurity(site.url),
    ]);
    
    const duration = Date.now() - startTime;
    
    // Calculate overall score (weighted)
    const weights = { accessibility: 0.3, performance: 0.4, security: 0.3 };
    const overallScore = Math.round(
      accessibility.score * weights.accessibility +
      performance.scores.performance * weights.performance +
      security.score * weights.security
    );
    
    // Check pass/fail
    const criticalAccessibility = accessibility.violations.filter((v: any) => v.impact === 'critical').length;
    const criticalSecurity = security.vulnerabilities.filter((v: any) => v.severity === 'critical').length;
    const passed = criticalAccessibility === 0 && criticalSecurity === 0 && overallScore >= 70;
    
    console.log(`✅ ${site.name}: Overall ${overallScore}/100 (${passed ? 'PASSED' : 'FAILED'})`);
    console.log(`   A11y: ${accessibility.score}, Perf: ${performance.scores.performance}, Sec: ${security.score}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    
    return {
      name: site.name,
      url: site.url,
      category: site.category,
      accessibility: accessibility.score,
      performance: performance.scores.performance,
      security: security.score,
      overallScore,
      passed,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${site.name} failed: ${(error as Error).message}`);
    
    return {
      name: site.name,
      url: site.url,
      category: site.category,
      accessibility: 0,
      performance: 0,
      security: 0,
      overallScore: 0,
      passed: false,
      duration,
      error: (error as Error).message,
    };
  }
}

async function main() {
  console.log('🔰 ODAVL Guardian - Real-World Testing Suite\n');
  console.log(`Testing ${testUrls.length} production websites...\n`);
  
  const results: TestResult[] = [];
  
  // Run tests sequentially to avoid overwhelming system
  for (const site of testUrls) {
    const result = await runTest(site);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Overall statistics
  const successful = results.filter(r => !r.error).length;
  const passed = results.filter(r => r.passed).length;
  const avgOverall = Math.round(results.filter(r => !r.error).reduce((sum, r) => sum + r.overallScore, 0) / successful);
  const avgAccessibility = Math.round(results.filter(r => !r.error).reduce((sum, r) => sum + r.accessibility, 0) / successful);
  const avgPerformance = Math.round(results.filter(r => !r.error).reduce((sum, r) => sum + r.performance, 0) / successful);
  const avgSecurity = Math.round(results.filter(r => !r.error).reduce((sum, r) => sum + r.security, 0) / successful);
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
  
  console.log(`Total Sites Tested: ${testUrls.length}`);
  console.log(`Successful Tests: ${successful}/${testUrls.length}`);
  console.log(`Passed Quality Gates: ${passed}/${successful}`);
  console.log(`\nAverage Scores:`);
  console.log(`  Overall: ${avgOverall}/100`);
  console.log(`  ♿ Accessibility: ${avgAccessibility}/100`);
  console.log(`  ⚡ Performance: ${avgPerformance}/100`);
  console.log(`  🔒 Security: ${avgSecurity}/100`);
  console.log(`\nAverage Duration: ${(avgDuration / 1000).toFixed(1)}s per site`);
  
  // Detailed results table
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DETAILED RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Site              | A11y | Perf | Sec | Overall | Status | Duration');
  console.log('------------------|------|------|-----|---------|--------|----------');
  
  results.forEach(r => {
    const status = r.error ? '❌ ERROR' : (r.passed ? '✅ PASS' : '⚠️  FAIL');
    const name = r.name.padEnd(17);
    const a11y = String(r.accessibility).padStart(4);
    const perf = String(r.performance).padStart(4);
    const sec = String(r.security).padStart(3);
    const overall = String(r.overallScore).padStart(7);
    const duration = `${(r.duration / 1000).toFixed(1)}s`.padStart(8);
    
    console.log(`${name} | ${a11y} | ${perf} | ${sec} | ${overall} | ${status} | ${duration}`);
    
    if (r.error) {
      console.log(`                  | Error: ${r.error}`);
    }
  });
  
  // Category breakdown
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 CATEGORY BREAKDOWN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat && !r.error);
    if (catResults.length > 0) {
      const catAvg = Math.round(catResults.reduce((sum, r) => sum + r.overallScore, 0) / catResults.length);
      console.log(`${cat}: ${catAvg}/100 (${catResults.length} sites)`);
    }
  });
  
  // Save results to JSON
  const fs = await import('node:fs/promises');
  const reportPath = './test-results.json';
  await fs.writeFile(reportPath, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    summary: {
      totalSites: testUrls.length,
      successful,
      passed,
      avgOverall,
      avgAccessibility,
      avgPerformance,
      avgSecurity,
      avgDuration,
    },
    results,
  }, null, 2));
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Exit with appropriate code
  process.exit(passed === successful ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
