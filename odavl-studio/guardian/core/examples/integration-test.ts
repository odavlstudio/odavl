import { TestOrchestrator, TestReport } from '../src/test-orchestrator';
import { ReportGenerator } from '../src/report-generator';

/**
 * Integration test: Run all 9 detectors on a real URL
 */

async function runIntegrationTest() {
  console.log('🚀 Guardian Integration Test\n');
  console.log('Testing all 9 detectors on real website...\n');

  const orchestrator = new TestOrchestrator();
  const generator = new ReportGenerator();

  // Test URLs
  const testUrls = [
    'https://example.com',
    'http://localhost:3000' // User's white screen issue
  ];

  for (const url of testUrls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${url}`);
    console.log('='.repeat(60));

    try {
      const report = await orchestrator.runTests({
        url,
        browserType: 'chromium',
        headless: true,
        timeout: 15000
      });

      // Display results
      console.log(`\n✓ Test completed in ${(report.duration / 1000).toFixed(2)}s`);
      console.log(`Status: ${report.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`\nIssues Found: ${report.metrics.totalIssues}`);
      console.log(`  Critical: ${report.metrics.critical}`);
      console.log(`  High: ${report.metrics.high}`);
      console.log(`  Medium: ${report.metrics.medium}`);
      console.log(`  Low: ${report.metrics.low}`);

      if (report.issues.length > 0) {
        console.log('\nTop Issues:');
        report.issues.slice(0, 5).forEach((issue, i) => {
          const icon = issue.severity === 'critical' ? '🔴' : 
                       issue.severity === 'high' ? '🟠' : 
                       issue.severity === 'medium' ? '🟡' : '⚪';
          console.log(`  ${i + 1}. ${icon} ${issue.type}: ${issue.message}`);
        });
      }

      // Generate report
      const reportPath = await generator.generate(report, {
        outputDir: '.odavl/guardian/integration-tests',
        format: 'both'
      });

      console.log(`\n📊 Report: ${reportPath}`);

    } catch (error) {
      console.error(`\n❌ Test failed: ${(error as Error).message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Integration test complete!');
  console.log('='.repeat(60));
}

runIntegrationTest();
