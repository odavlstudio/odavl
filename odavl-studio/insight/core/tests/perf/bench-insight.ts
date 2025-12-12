/**
 * ODAVL Insight Performance Benchmark
 * Wave 9: Simple perf testing tool for maintainers
 * Wave 10: Added parallel vs sequential comparison
 */

import * as path from 'path';
import { AnalysisEngine } from '../../src/analysis-engine.js';
import { SequentialDetectorExecutor, ParallelDetectorExecutor } from '../../src/detector-executor.js';
import { glob } from 'glob';

const TRIALS = 3;

async function collectFiles(rootDir: string): Promise<string[]> {
  const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
  const ignore = ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/out/**'];
  
  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const matches = glob.sync(`${rootDir}/${pattern}`, { ignore, absolute: true });
    allFiles.push(...matches);
  }
  
  return [...new Set(allFiles)];
}

async function runTrials(mode: string, files: string[], executor?: any): Promise<{ avgTime: number; minTime: number; maxTime: number; issues: number }> {
  const times: number[] = [];
  let totalIssues = 0;

  for (let i = 0; i < TRIALS; i++) {
    console.log(`  Trial ${i + 1}/${TRIALS}...`);
    
    const startTime = performance.now();
    const engine = executor ? new AnalysisEngine(executor) : new AnalysisEngine();
    const results = await engine.analyze(files);
    const elapsed = performance.now() - startTime;
    
    times.push(elapsed);
    
    const issues = results.reduce((sum, r) => sum + (r.issues?.length || 0), 0);
    totalIssues = issues;
    
    console.log(`    Time: ${(elapsed / 1000).toFixed(2)}s, Issues: ${issues}`);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return { avgTime, minTime, maxTime, issues: totalIssues };
}

async function runBenchmark(workspacePath: string) {
  console.log(`\n🧪 ODAVL Insight Performance Benchmark (Wave 10)\n`);
  console.log(`Workspace: ${workspacePath}`);
  console.log(`Trials per mode: ${TRIALS}\n`);

  // Collect files
  console.log('Collecting files...');
  const files = await collectFiles(workspacePath);
  console.log(`Files found: ${files.length}\n`);

  if (files.length === 0) {
    console.log('No files to analyze');
    return;
  }

  // Run sequential benchmark
  console.log('📊 Sequential Mode:');
  const seqExecutor = new SequentialDetectorExecutor();
  const seqResults = await runTrials('sequential', files, seqExecutor);

  // Run parallel benchmark (4 workers)
  console.log('\n📊 Parallel Mode (4 workers):');
  const parExecutor = new ParallelDetectorExecutor({ maxConcurrency: 4 });
  const parResults = await runTrials('parallel-4', files, parExecutor);

  // Calculate speedup
  const speedup = seqResults.avgTime / parResults.avgTime;
  const improvement = ((seqResults.avgTime - parResults.avgTime) / seqResults.avgTime * 100);

  console.log(`\n📈 Performance Comparison:`);
  console.log(`─────────────────────────────────────────────────────`);
  console.log(`                    Sequential    Parallel (4)   Speedup`);
  console.log(`─────────────────────────────────────────────────────`);
  console.log(`Average time:       ${(seqResults.avgTime / 1000).toFixed(2)}s         ${(parResults.avgTime / 1000).toFixed(2)}s        ${speedup.toFixed(2)}x`);
  console.log(`Min time:           ${(seqResults.minTime / 1000).toFixed(2)}s         ${(parResults.minTime / 1000).toFixed(2)}s`);
  console.log(`Max time:           ${(seqResults.maxTime / 1000).toFixed(2)}s         ${(parResults.maxTime / 1000).toFixed(2)}s`);
  console.log(`Throughput:         ${(files.length / (seqResults.avgTime / 1000)).toFixed(0)} files/s   ${(files.length / (parResults.avgTime / 1000)).toFixed(0)} files/s`);
  console.log(`─────────────────────────────────────────────────────`);
  console.log(`\nParallel is ${improvement >= 0 ? improvement.toFixed(1) + '% faster' : Math.abs(improvement).toFixed(1) + '% slower'}`);
  console.log(`Files analyzed: ${files.length}, Issues found: ${seqResults.issues}\n`);
}

// Main entry point
const workspacePath = process.argv[2] || process.cwd();
runBenchmark(workspacePath).catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
