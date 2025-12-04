import { TestOrchestrator } from '../src/test-orchestrator';
import { ReportGenerator } from '../src/report-generator';

/**
 * Benchmark: Measure Guardian performance
 */

async function benchmark() {
  console.log('⚡ Guardian Performance Benchmark\n');

  const orchestrator = new TestOrchestrator();
  const urls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com'
  ];

  const results: { url: string; duration: number; issues: number }[] = [];

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    
    const start = Date.now();
    try {
      const report = await orchestrator.runTests({
        url,
        browserType: 'chromium',
        headless: true,
        timeout: 10000
      });

      const duration = Date.now() - start;
      results.push({
        url,
        duration,
        issues: report.metrics.totalIssues
      });

      console.log(`  ✓ ${duration}ms (${report.metrics.totalIssues} issues)\n`);
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}\n`);
    }
  }

  // Calculate statistics
  const durations = results.map(r => r.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  console.log('='.repeat(60));
  console.log('Benchmark Results:');
  console.log('='.repeat(60));
  console.log(`Average: ${avg.toFixed(0)}ms`);
  console.log(`Min: ${min}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Total URLs tested: ${results.length}`);
  console.log('='.repeat(60));
}

benchmark();
