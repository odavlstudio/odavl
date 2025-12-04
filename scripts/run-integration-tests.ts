/**
 * Integration Test Runner
 * 
 * Quick runner for integration tests with immediate output
 */

import { IntegrationTestFramework } from './integration-test-framework.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🧪 Starting Integration Test Suite...\n');

  const framework = new IntegrationTestFramework();
  const report = await framework.runAllTests();

  console.log('\n📊 Integration Test Report:');
  console.log(`   Total Tests: ${report.totalTests}`);
  console.log(`   Passed: ${report.totalPassed} (${report.passRate.toFixed(2)}%)`);
  console.log(`   Failed: ${report.totalFailed}`);
  console.log(`   Skipped: ${report.totalSkipped}`);
  console.log(`   Duration: ${report.totalDuration}ms`);

  // Save report
  const outputPath = path.join(process.cwd(), 'reports', 'integration-test-report.json');
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  framework.saveReport(report, outputPath);

  // Exit with error code if tests failed
  if (report.totalFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
