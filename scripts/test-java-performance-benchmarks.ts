#!/usr/bin/env tsx
/**
 * ODAVL Insight - Performance Benchmarking
 * Tests performance on projects of different sizes
 * Week 10 Day 4 - Integration & Testing
 */

import { join } from 'node:path';
import {
  JavaComplexityDetector,
  JavaStreamDetector,
  JavaExceptionDetector,
  JavaMemoryDetector,
  JavaSpringDetector,
} from '../odavl-studio/insight/core/dist/detector/index.js';

interface BenchmarkResult {
  projectName: string;
  fileCount: number;
  issues: number;
  totalTime: number;
  avgPerFile: number;
  avgPerDetector: number;
  detectorResults: Array<{
    name: string;
    time: number;
    issues: number;
  }>;
}

async function benchmarkProject(
  projectName: string,
  projectPath: string,
  fileCount: number
): Promise<BenchmarkResult> {
  const detectors = [
    { name: 'Complexity', detector: new JavaComplexityDetector(projectPath) },
    { name: 'Stream API', detector: new JavaStreamDetector(projectPath) },
    { name: 'Exception', detector: new JavaExceptionDetector(projectPath) },
    { name: 'Memory', detector: new JavaMemoryDetector(projectPath) },
    { name: 'Spring Boot', detector: new JavaSpringDetector(projectPath) },
  ];
  
  const detectorResults: Array<{ name: string; time: number; issues: number }> = [];
  let totalIssues = 0;
  let totalTime = 0;
  
  for (const { name, detector } of detectors) {
    const startTime = performance.now();
    const issues = await detector.detect();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    totalIssues += issues.length;
    totalTime += duration;
    detectorResults.push({ name, time: duration, issues: issues.length });
  }
  
  return {
    projectName,
    fileCount,
    issues: totalIssues,
    totalTime,
    avgPerFile: totalTime / fileCount,
    avgPerDetector: totalTime / detectors.length,
    detectorResults,
  };
}

function displayBenchmark(result: BenchmarkResult, targetMs: number): void {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📦 ${result.projectName}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`📁 Files:              ${result.fileCount}`);
  console.log(`🔍 Issues Found:       ${result.issues}`);
  console.log(`⏱️  Total Time:         ${result.totalTime.toFixed(0)}ms`);
  console.log(`📊 Time per File:      ${result.avgPerFile.toFixed(2)}ms`);
  console.log(`📈 Time per Detector:  ${result.avgPerDetector.toFixed(0)}ms`);
  
  // Performance rating
  if (result.totalTime < targetMs) {
    const percentFaster = ((targetMs - result.totalTime) / targetMs * 100).toFixed(0);
    console.log(`🎯 Performance:        ✅ EXCELLENT (${percentFaster}% faster than ${targetMs}ms target)`);
  } else if (result.totalTime < targetMs * 1.5) {
    const percentSlower = ((result.totalTime - targetMs) / targetMs * 100).toFixed(0);
    console.log(`🎯 Performance:        🟡 GOOD (${percentSlower}% slower than ${targetMs}ms target)`);
  } else {
    console.log(`🎯 Performance:        ❌ NEEDS IMPROVEMENT (${result.totalTime.toFixed(0)}ms > ${targetMs}ms target)`);
  }
  
  // Detector breakdown
  console.log(`\n📋 Detector Breakdown:`);
  for (const dr of result.detectorResults) {
    const timePercent = ((dr.time / result.totalTime) * 100).toFixed(0);
    console.log(`   ${dr.name.padEnd(15)} │ ${dr.issues.toString().padStart(3)} issues │ ${dr.time.toFixed(0).padStart(4)}ms (${timePercent.padStart(2)}%)`);
  }
}

async function runBenchmarks() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           ODAVL Insight - Performance Benchmarking Suite            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  const testFixturesPath = join(process.cwd(), 'test-fixtures', 'java');
  
  // Project Size Categories
  const projects = [
    {
      name: 'Small Project (3 files)',
      path: testFixturesPath,
      fileCount: 3,
      targetMs: 100,
    },
  ];
  
  const results: BenchmarkResult[] = [];
  
  console.log('\n🚀 Running benchmarks...\n');
  
  for (const project of projects) {
    const result = await benchmarkProject(project.name, project.path, project.fileCount);
    results.push(result);
    displayBenchmark(result, project.targetMs);
  }
  
  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 BENCHMARK SUMMARY');
  console.log(`${'='.repeat(70)}`);
  
  const totalFiles = results.reduce((sum, r) => sum + r.fileCount, 0);
  const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
  const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
  const avgTimePerFile = totalTime / totalFiles;
  
  console.log(`\n📁 Total Files Analyzed:    ${totalFiles}`);
  console.log(`🔍 Total Issues Found:      ${totalIssues}`);
  console.log(`⏱️  Total Analysis Time:     ${totalTime.toFixed(0)}ms`);
  console.log(`📊 Average Time per File:   ${avgTimePerFile.toFixed(2)}ms`);
  
  // Scaling analysis
  console.log(`\n📈 Scaling Projections (based on ${avgTimePerFile.toFixed(2)}ms per file):`);
  console.log(`   Small (50 files):      ~${(avgTimePerFile * 50).toFixed(0)}ms`);
  console.log(`   Medium (500 files):    ~${(avgTimePerFile * 500 / 1000).toFixed(1)}s`);
  console.log(`   Large (2000 files):    ~${(avgTimePerFile * 2000 / 1000).toFixed(1)}s`);
  
  // Detector performance comparison
  console.log(`\n🏆 Fastest Detectors (average time):`);
  const detectorAverages = new Map<string, { totalTime: number; count: number }>();
  
  for (const result of results) {
    for (const dr of result.detectorResults) {
      if (!detectorAverages.has(dr.name)) {
        detectorAverages.set(dr.name, { totalTime: 0, count: 0 });
      }
      const stats = detectorAverages.get(dr.name)!;
      stats.totalTime += dr.time;
      stats.count += 1;
    }
  }
  
  const sortedDetectors = Array.from(detectorAverages.entries())
    .map(([name, stats]) => ({
      name,
      avgTime: stats.totalTime / stats.count,
    }))
    .sort((a, b) => a.avgTime - b.avgTime);
  
  for (let i = 0; i < sortedDetectors.length; i++) {
    const d = sortedDetectors[i];
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    console.log(`   ${medal} ${d.name.padEnd(15)} │ ${d.avgTime.toFixed(0).padStart(4)}ms average`);
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ Benchmarking complete!');
  console.log(`${'='.repeat(70)}\n`);
}

// Run benchmarks
runBenchmarks().catch(error => {
  console.error('\n❌ Benchmark suite failed:', error);
  process.exit(1);
});
