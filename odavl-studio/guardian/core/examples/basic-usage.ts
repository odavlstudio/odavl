/**
 * Guardian Core - Basic Usage Example
 * Week 11 Day 2 - Real-world testing examples
 */

import { testAccessibility, testPerformance, testSecurity } from '@odavl-studio/guardian-core';
import type { GuardianReport } from '@odavl-studio/guardian-core';

/**
 * Example 1: Test single URL with all tests
 */
async function testSingleUrl() {
  const url = 'https://github.com';
  
  console.log(`\n🔰 Testing ${url}...\n`);
  
  try {
    // Run all tests in parallel
    const [accessibility, performance, security] = await Promise.all([
      testAccessibility(url),
      testPerformance(url),
      testSecurity(url),
    ]);
    
    // Calculate overall score (weighted)
    const weights = { accessibility: 0.3, performance: 0.4, security: 0.3 };
    const overallScore = Math.round(
      accessibility.score * weights.accessibility +
      performance.scores.performance * weights.performance +
      security.score * weights.security
    );
    
    // Check pass/fail
    const criticalAccessibility = accessibility.violations.filter(v => v.impact === 'critical').length;
    const criticalSecurity = security.vulnerabilities.filter(v => v.severity === 'critical').length;
    const passed = criticalAccessibility === 0 && criticalSecurity === 0 && overallScore >= 70;
    
    const report: GuardianReport = {
      url,
      timestamp: new Date().toISOString(),
      tests: { accessibility, performance, security },
      overallScore,
      passed,
      duration: 0, // Calculated separately
    };
    
    console.log('✅ Test complete!');
    console.log(`Overall Score: ${overallScore}/100`);
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return report;
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 2: Test multiple URLs in sequence
 */
async function testMultipleUrls() {
  const urls = [
    'https://github.com',
    'https://stackoverflow.com',
    'https://dev.to',
  ];
  
  const results = [];
  
  for (const url of urls) {
    console.log(`\n🔰 Testing ${url}...`);
    
    try {
      const [accessibility, performance, security] = await Promise.all([
        testAccessibility(url),
        testPerformance(url),
        testSecurity(url),
      ]);
      
      results.push({
        url,
        accessibility: accessibility.score,
        performance: performance.scores.performance,
        security: security.score,
      });
      
      console.log(`✅ ${url}: A11y ${accessibility.score}, Perf ${performance.scores.performance}, Sec ${security.score}`);
    } catch (error) {
      console.error(`❌ ${url} failed:`, (error as Error).message);
      results.push({ url, error: (error as Error).message });
    }
  }
  
  return results;
}

/**
 * Example 3: Test with custom scoring logic
 */
async function testWithCustomScoring(url: string) {
  const [accessibility, performance, security] = await Promise.all([
    testAccessibility(url),
    testPerformance(url),
    testSecurity(url),
  ]);
  
  // Custom scoring: Strict on performance, lenient on accessibility
  const customScore = Math.round(
    accessibility.score * 0.2 +  // 20%
    performance.scores.performance * 0.6 +  // 60% (strict!)
    security.score * 0.2  // 20%
  );
  
  // Custom pass/fail: Performance must be ≥ 80, others ≥ 60
  const passed = 
    performance.scores.performance >= 80 &&
    accessibility.score >= 60 &&
    security.score >= 60;
  
  return {
    url,
    customScore,
    passed,
    breakdown: {
      accessibility: accessibility.score,
      performance: performance.scores.performance,
      security: security.score,
    },
  };
}

/**
 * Example 4: Test accessibility only (fast check)
 */
async function quickAccessibilityCheck(url: string) {
  console.log(`♿ Quick accessibility check: ${url}`);
  
  const result = await testAccessibility(url);
  
  // Show only critical and serious issues
  const critical = result.violations.filter(v => v.impact === 'critical');
  const serious = result.violations.filter(v => v.impact === 'serious');
  
  console.log(`\nScore: ${result.score}/100`);
  console.log(`Critical issues: ${critical.length}`);
  console.log(`Serious issues: ${serious.length}`);
  
  if (critical.length > 0) {
    console.log('\n🔴 Critical violations:');
    critical.forEach(v => {
      console.log(`  - ${v.description}`);
      console.log(`    Fix: ${v.help}`);
    });
  }
  
  return result;
}

/**
 * Example 5: CI/CD integration (exit code based on pass/fail)
 */
async function cicdIntegration(url: string) {
  try {
    const [accessibility, performance, security] = await Promise.all([
      testAccessibility(url),
      testPerformance(url),
      testSecurity(url),
    ]);
    
    // Strict CI/CD requirements
    const ciPassed = 
      accessibility.score >= 80 &&
      performance.scores.performance >= 80 &&
      security.score >= 80 &&
      accessibility.violations.filter(v => v.impact === 'critical').length === 0 &&
      security.vulnerabilities.filter(v => v.severity === 'critical').length === 0;
    
    if (ciPassed) {
      console.log('✅ CI/CD checks passed - Ready to deploy!');
      process.exit(0);
    } else {
      console.error('❌ CI/CD checks failed - Deployment blocked!');
      console.error('Requirements: All scores ≥ 80, no critical issues');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ CI/CD test failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('🔰 ODAVL Guardian - Usage Examples\n');
    
    // Example 1: Single URL
    await testSingleUrl();
    
    // Example 2: Multiple URLs
    // await testMultipleUrls();
    
    // Example 3: Custom scoring
    // await testWithCustomScoring('https://vercel.com');
    
    // Example 4: Quick A11y check
    // await quickAccessibilityCheck('https://producthunt.com');
    
    // Example 5: CI/CD (uncomment to test)
    // await cicdIntegration('https://github.com');
  })();
}

export {
  testSingleUrl,
  testMultipleUrls,
  testWithCustomScoring,
  quickAccessibilityCheck,
  cicdIntegration,
};
