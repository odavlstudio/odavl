import { TestOrchestrator } from '../src/test-orchestrator';
import { ReportGenerator } from '../src/report-generator';

/**
 * Test the white screen issue on user's Next.js app
 * URL: http://localhost:3000/en
 */

async function testWhiteScreen() {
  console.log('🚀 Testing user\'s white screen issue...\n');

  const orchestrator = new TestOrchestrator();
  const generator = new ReportGenerator();

  try {
    // Test the problematic URL
    const report = await orchestrator.runTests({
      url: 'http://localhost:3000/en',
      browserType: 'chromium',
      headless: false, // Show browser to see white screen
      timeout: 10000
    });

    console.log('═══════════════════════════════════════════');
    console.log(`Status: ${report.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Duration: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`Total Issues: ${report.metrics.totalIssues}`);
    console.log('═══════════════════════════════════════════\n');

    if (report.issues.length > 0) {
      console.log('Issues detected:\n');
      
      for (const issue of report.issues) {
        console.log(`🔴 ${issue.type}`);
        console.log(`   Severity: ${issue.severity}`);
        console.log(`   ${issue.message}\n`);
        
        console.log('   Fix suggestions:');
        issue.fix.forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion}`);
        });
        console.log('');
      }
    }

    // Generate report
    const reportPath = await generator.generate(report, {
      outputDir: '.odavl/guardian',
      format: 'both'
    });

    console.log(`📊 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
  }
}

testWhiteScreen();
