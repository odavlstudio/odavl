#!/usr/bin/env tsx
/**
 * ODAVL Insight - Parallel Detector Execution Experiment
 * Tests performance improvement with parallel execution
 * Week 10 Day 5 - Advanced Testing & Optimization
 */

import { join } from 'node:path';
import {
  JavaComplexityDetector,
  JavaStreamDetector,
  JavaExceptionDetector,
  JavaMemoryDetector,
  JavaSpringDetector,
} from '../odavl-studio/insight/core/dist/detector/index.js';

async function runSequential(workspace: string) {
  console.log('\n📊 Sequential Execution:');
  console.log('─'.repeat(70));
  
  const detectors = [
    { name: 'Complexity', detector: new JavaComplexityDetector(workspace) },
    { name: 'Stream API', detector: new JavaStreamDetector(workspace) },
    { name: 'Exception', detector: new JavaExceptionDetector(workspace) },
    { name: 'Memory', detector: new JavaMemoryDetector(workspace) },
    { name: 'Spring Boot', detector: new JavaSpringDetector(workspace) },
  ];
  
  const startTime = performance.now();
  let totalIssues = 0;
  
  for (const { name, detector } of detectors) {
    const detectorStart = performance.now();
    const issues = await detector.detect();
    const detectorTime = performance.now() - detectorStart;
    
    totalIssues += issues.length;
    console.log(`${name.padEnd(15)} │ ${issues.length.toString().padStart(3)} issues │ ${detectorTime.toFixed(0).padStart(4)}ms`);
  }
  
  const totalTime = performance.now() - startTime;
  
  console.log('─'.repeat(70));
  console.log(`Total: ${totalIssues} issues in ${totalTime.toFixed(0)}ms`);
  
  return { totalTime, totalIssues };
}

async function runParallel(workspace: string) {
  console.log('\n⚡ Parallel Execution:');
  console.log('─'.repeat(70));
  
  const detectors = [
    { name: 'Complexity', detector: new JavaComplexityDetector(workspace) },
    { name: 'Stream API', detector: new JavaStreamDetector(workspace) },
    { name: 'Exception', detector: new JavaExceptionDetector(workspace) },
    { name: 'Memory', detector: new JavaMemoryDetector(workspace) },
    { name: 'Spring Boot', detector: new JavaSpringDetector(workspace) },
  ];
  
  const startTime = performance.now();
  
  // Run all detectors in parallel
  const results = await Promise.all(
    detectors.map(async ({ name, detector }) => {
      const detectorStart = performance.now();
      const issues = await detector.detect();
      const detectorTime = performance.now() - detectorStart;
      return { name, issues: issues.length, time: detectorTime };
    })
  );
  
  const totalTime = performance.now() - startTime;
  
  // Display results
  let totalIssues = 0;
  for (const result of results) {
    totalIssues += result.issues;
    console.log(`${result.name.padEnd(15)} │ ${result.issues.toString().padStart(3)} issues │ ${result.time.toFixed(0).padStart(4)}ms`);
  }
  
  console.log('─'.repeat(70));
  console.log(`Total: ${totalIssues} issues in ${totalTime.toFixed(0)}ms`);
  
  return { totalTime, totalIssues };
}

async function runExperiment() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║      ODAVL Insight - Parallel Execution Performance Experiment      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  const workspace = join(process.cwd(), 'test-fixtures', 'java');
  console.log(`\n📁 Workspace: ${workspace}`);
  
  // Run 3 iterations of each approach
  const iterations = 3;
  console.log(`\n🔬 Running ${iterations} iterations of each approach...\n`);
  
  const sequentialTimes: number[] = [];
  const parallelTimes: number[] = [];
  
  for (let i = 1; i <= iterations; i++) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`Iteration ${i}/${iterations}`);
    console.log(`${'═'.repeat(70)}`);
    
    // Sequential
    const seqResult = await runSequential(workspace);
    sequentialTimes.push(seqResult.totalTime);
    
    // Parallel
    const parResult = await runParallel(workspace);
    parallelTimes.push(parResult.totalTime);
    
    // Comparison
    const speedup = seqResult.totalTime / parResult.totalTime;
    const percentFaster = ((seqResult.totalTime - parResult.totalTime) / seqResult.totalTime * 100);
    
    console.log(`\n📈 Iteration ${i} Speedup: ${speedup.toFixed(2)}x (${percentFaster.toFixed(0)}% faster)`);
  }
  
  // Calculate averages
  const avgSequential = sequentialTimes.reduce((a, b) => a + b, 0) / iterations;
  const avgParallel = parallelTimes.reduce((a, b) => a + b, 0) / iterations;
  const avgSpeedup = avgSequential / avgParallel;
  const avgPercentFaster = ((avgSequential - avgParallel) / avgSequential * 100);
  
  // Final summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('📊 FINAL RESULTS (Average of 3 iterations)');
  console.log(`${'═'.repeat(70)}`);
  
  console.log(`\n⏱️  Average Times:`);
  console.log(`   Sequential: ${avgSequential.toFixed(0)}ms`);
  console.log(`   Parallel:   ${avgParallel.toFixed(0)}ms`);
  
  console.log(`\n🚀 Performance Improvement:`);
  console.log(`   Speedup:    ${avgSpeedup.toFixed(2)}x`);
  console.log(`   Faster by:  ${avgPercentFaster.toFixed(0)}%`);
  
  console.log(`\n📋 Detailed Breakdown:`);
  console.log(`   Sequential times: ${sequentialTimes.map(t => t.toFixed(0) + 'ms').join(', ')}`);
  console.log(`   Parallel times:   ${parallelTimes.map(t => t.toFixed(0) + 'ms').join(', ')}`);
  
  // Theoretical vs actual
  console.log(`\n🧮 Analysis:`);
  console.log(`   Theoretical max speedup: 5x (5 detectors)`);
  console.log(`   Actual speedup:          ${avgSpeedup.toFixed(2)}x`);
  console.log(`   Efficiency:              ${(avgSpeedup / 5 * 100).toFixed(0)}%`);
  
  if (avgSpeedup >= 3) {
    console.log(`   Rating: ✅ EXCELLENT (3x+ speedup)`);
  } else if (avgSpeedup >= 2) {
    console.log(`   Rating: 🟡 GOOD (2-3x speedup)`);
  } else {
    console.log(`   Rating: ⚠️  MODERATE (<2x speedup)`);
  }
  
  // Recommendation
  console.log(`\n💡 Recommendation:`);
  if (avgSpeedup >= 2) {
    console.log(`   ✅ Enable parallel execution by default`);
    console.log(`   Expected performance: ${avgParallel.toFixed(0)}ms (from ${avgSequential.toFixed(0)}ms)`);
    console.log(`   User benefit: ${avgPercentFaster.toFixed(0)}% faster analysis`);
  } else {
    console.log(`   ⚠️  Parallel execution shows limited improvement`);
    console.log(`   Keep sequential execution (simpler, predictable)`);
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('✅ Parallel execution experiment complete!');
  console.log(`${'═'.repeat(70)}\n`);
}

// Run experiment
runExperiment().catch(error => {
  console.error('\n❌ Experiment failed:', error);
  process.exit(1);
});
