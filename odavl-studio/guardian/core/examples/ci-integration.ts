import { TestOrchestrator } from '../src/test-orchestrator';
import { ReportGenerator } from '../src/report-generator';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * CI/CD Integration: Generate reports for deployment pipelines
 */

interface CIConfig {
  urls: string[];
  failOnCritical?: boolean;
  failOnHigh?: boolean;
  maxIssues?: number;
  outputDir?: string;
}

async function runCITests(config: CIConfig): Promise<void> {
  console.log('🔄 Guardian CI/CD Integration\n');

  const orchestrator = new TestOrchestrator();
  const generator = new ReportGenerator();
  const outputDir = config.outputDir || '.odavl/guardian/ci';

  let totalIssues = 0;
  let criticalCount = 0;
  let highCount = 0;
  let failedTests = 0;

  const allReports = [];

  for (const url of config.urls) {
    console.log(`Testing: ${url}`);

    try {
      const report = await orchestrator.runTests({
        url,
        browserType: 'chromium',
        headless: true,
        timeout: 15000
      });

      allReports.push(report);
      totalIssues += report.metrics.totalIssues;
      criticalCount += report.metrics.critical;
      highCount += report.metrics.high;

      if (report.status === 'failed') {
        failedTests++;
      }

      console.log(`  ✓ ${report.metrics.totalIssues} issues found\n`);

      // Generate individual report
      await generator.generate(report, {
        outputDir,
        format: 'both'
      });

    } catch (error) {
      console.error(`  ✗ Test failed: ${(error as Error).message}\n`);
      failedTests++;
    }
  }

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    totalUrls: config.urls.length,
    passedTests: config.urls.length - failedTests,
    failedTests,
    totalIssues,
    criticalIssues: criticalCount,
    highIssues: highCount,
    reports: allReports
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  // Generate markdown summary for CI
  const markdown = `
# Guardian Test Summary

**Date**: ${new Date().toISOString()}

## Overview
- **Total URLs Tested**: ${config.urls.length}
- **Passed**: ${summary.passedTests}
- **Failed**: ${failedTests}

## Issues Found
- **Total**: ${totalIssues}
- **Critical**: ${criticalCount} 🔴
- **High**: ${highCount} 🟠

${allReports.map((report, i) => `
### ${config.urls[i]}
- Status: ${report.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- Duration: ${(report.duration / 1000).toFixed(2)}s
- Issues: ${report.metrics.totalIssues} (${report.metrics.critical} critical, ${report.metrics.high} high)
`).join('\n')}

## Quality Gates
${config.failOnCritical ? '- ✓ Fail on critical issues' : '- ○ Allow critical issues'}
${config.failOnHigh ? '- ✓ Fail on high severity issues' : '- ○ Allow high severity issues'}
${config.maxIssues ? `- ✓ Max issues: ${config.maxIssues}` : '- ○ No issue limit'}

## Result
${(config.failOnCritical && criticalCount > 0) || 
  (config.failOnHigh && highCount > 0) || 
  (config.maxIssues && totalIssues > config.maxIssues) 
  ? '❌ **DEPLOYMENT BLOCKED**' 
  : '✅ **DEPLOYMENT APPROVED**'}
`;

  await fs.writeFile(
    path.join(outputDir, 'summary.md'),
    markdown.trim(),
    'utf8'
  );

  console.log('\n' + '='.repeat(60));
  console.log('CI Test Summary:');
  console.log('='.repeat(60));
  console.log(`Total Issues: ${totalIssues}`);
  console.log(`Critical: ${criticalCount}`);
  console.log(`High: ${highCount}`);
  console.log(`Failed Tests: ${failedTests}/${config.urls.length}`);
  console.log('='.repeat(60));

  // Determine exit code based on quality gates
  let shouldFail = false;

  if (config.failOnCritical && criticalCount > 0) {
    console.log('❌ FAILED: Critical issues found');
    shouldFail = true;
  }

  if (config.failOnHigh && highCount > 0) {
    console.log('❌ FAILED: High severity issues found');
    shouldFail = true;
  }

  if (config.maxIssues && totalIssues > config.maxIssues) {
    console.log(`❌ FAILED: Too many issues (${totalIssues} > ${config.maxIssues})`);
    shouldFail = true;
  }

  if (shouldFail) {
    console.log('\n🚫 Deployment blocked by quality gates');
    process.exit(1);
  } else {
    console.log('\n✅ All quality gates passed');
    process.exit(0);
  }
}

// Example usage
const config: CIConfig = {
  urls: [
    'http://localhost:3000',
    'http://localhost:3000/en'
  ],
  failOnCritical: true,
  failOnHigh: false,
  maxIssues: 20,
  outputDir: '.odavl/guardian/ci'
};

runCITests(config);
